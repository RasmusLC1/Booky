using Microsoft.EntityFrameworkCore;

public sealed class DownloadFilePayload(HttpResponseMessage response, Stream stream) : IDisposable
{
    public Stream Stream { get; } = stream;
    public required string ContentType { get; init; }
    public required string FileName { get; init; }

    public void Dispose()
    {
        Stream.Dispose();
        response.Dispose();
    }
}

public sealed record OrderHistoryProductDto(
    string Id,
    string Name,
    string ImagePath,
    string Description
    );

public sealed record OrderHistoryItemDto(
    string Id,
    int PriceInCents,
    DateTime CreatedAt,
    OrderHistoryProductDto Product,
    string DownloadVerificationId
    );

public sealed record OrderHistoryResponseDto(
    string Email,
    IReadOnlyList<OrderHistoryItemDto> Orders);

public sealed record MyOrderItemDto(
    string Id,
    int PriceInCents,
    DateTime CreatedAt,
    ProductDto Product,
    string DownloadVerificationId);

public sealed record ServiceResult<T>(
    bool IsSuccess,
    T? Value = default,
    int StatusCode = 200,
    string? Error = null)
{
    public static ServiceResult<T> Ok(T value) => new(true, value, 200);
    public static ServiceResult<T> Fail(int statusCode, string error) => new(false, default, statusCode, error);
}

public class DownloadService(AppDbContext db, IHttpClientFactory httpClientFactory)
{
    public async Task<ServiceResult<string>> CreateVerificationAsync(
        string? email,
        string? productId,
        CancellationToken ct = default)
    {
        var normalizedEmail = email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedEmail))
            return ServiceResult<string>.Fail(StatusCodes.Status401Unauthorized, "Not logged in");

        if (string.IsNullOrWhiteSpace(productId))
            return ServiceResult<string>.Fail(StatusCodes.Status400BadRequest, "Product ID is required");

        var owns = await db.Orders.AnyAsync(
            o => o.ProductId == productId && o.User.Email == normalizedEmail, ct);

        if (!owns)
            return ServiceResult<string>.Fail(
                StatusCodes.Status403Forbidden,
                "You have not purchased this product");

        var verification = new DownloadVerification
        {
            ProductId = productId,
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        };

        db.DownloadVerifications.Add(verification);
        await db.SaveChangesAsync(ct);

        return ServiceResult<string>.Ok(verification.Id);
    }

    public async Task<ServiceResult<OrderHistoryResponseDto>> GetOrderHistoryAsync(
        string? email,
        CancellationToken ct = default)
    {
        var normalizedEmail = email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedEmail))
            return ServiceResult<OrderHistoryResponseDto>.Fail(
                StatusCodes.Status400BadRequest,
                "Email is required");

        if (!await db.Users.AnyAsync(u => u.Email == normalizedEmail, ct))
            return ServiceResult<OrderHistoryResponseDto>.Fail(
                StatusCodes.Status404NotFound,
                "User not found");

        var orders = await db.Orders
            .AsNoTracking()
            .Where(o => o.User.Email == normalizedEmail)
            .Select(o => new
            {
                o.Id,
                o.PriceInCents,
                o.CreatedAt,
                Product = new OrderHistoryProductDto(
                    o.Product.Id,
                    o.Product.Name,
                    o.Product.ImagePath,
                    o.Product.Description)
            })
            .ToListAsync(ct);

        var verifications = orders
            .Select(o => new DownloadVerification
            {
                ProductId = o.Product.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            })
            .ToList();

        if (verifications.Count > 0)
        {
            db.DownloadVerifications.AddRange(verifications);
            await db.SaveChangesAsync(ct);
        }

        var items = orders
            .Select((o, i) => new OrderHistoryItemDto(
                o.Id,
                o.PriceInCents,
                DateTime.SpecifyKind(o.CreatedAt, DateTimeKind.Utc),
                o.Product,
                verifications[i].Id))
            .ToList();

        return ServiceResult<OrderHistoryResponseDto>.Ok(
            new OrderHistoryResponseDto(normalizedEmail, items));
    }

    public async Task<ServiceResult<IReadOnlyList<MyOrderItemDto>>> GetMyOrdersAsync(
        string? email,
        CancellationToken ct = default)
    {
        var normalizedEmail = email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedEmail))
            return ServiceResult<IReadOnlyList<MyOrderItemDto>>.Fail(
                StatusCodes.Status401Unauthorized,
                "Not logged in");

        var orders = await db.Orders
            .AsNoTracking()
            .Where(o => o.User.Email == normalizedEmail)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.PriceInCents,
                o.CreatedAt,
                Product = new ProductDto
                {
                    Id = o.Product.Id,
                    Name = o.Product.Name,
                    Author = o.Product.Author,
                    PriceInCents = o.Product.PriceInCents,
                    ImagePath = o.Product.ImagePath,
                    Description = o.Product.Description,
                    Category = o.Product.Category,
                    Length = o.Product.Length,
                    IsAvailableForPurchase = o.Product.IsAvailableForPurchase,
                    CreatedAt = o.Product.CreatedAt,
                    UpdatedAt = o.Product.UpdatedAt
                }
            })
            .ToListAsync(ct);

        var tokens = orders
            .Select(o => o.Product.Id)
            .Distinct()
            .ToDictionary(
                id => id,
                id => new DownloadVerification
                {
                    ProductId = id,
                    ExpiresAt = DateTime.UtcNow.AddDays(1)
                });

        if (tokens.Count > 0)
        {
            db.DownloadVerifications.AddRange(tokens.Values);
            await db.SaveChangesAsync(ct);
        }

        var result = orders
            .Select(o => new MyOrderItemDto(
                o.Id,
                o.PriceInCents,
                DateTime.SpecifyKind(o.CreatedAt, DateTimeKind.Utc),
                o.Product,
                tokens[o.Product.Id].Id))
            .ToList();

        return ServiceResult<IReadOnlyList<MyOrderItemDto>>.Ok(result);
    }

    public async Task<DownloadFilePayload?> GetDownloadFileAsync(
        string verificationId,
        CancellationToken ct = default)
    {
        var verification = await db.DownloadVerifications
            .AsNoTracking()
            .Where(v => v.Id == verificationId && v.ExpiresAt > DateTime.UtcNow)
            .Select(v => new
            {
                v.Product.Name,
                v.Product.FilePath
            })
            .FirstOrDefaultAsync(ct);

        if (verification is null
            || !Uri.TryCreate(verification.FilePath, UriKind.Absolute, out var fileUri))
            return null;

        var client = httpClientFactory.CreateClient();
        var remoteRes = await client.GetAsync(fileUri, HttpCompletionOption.ResponseHeadersRead, ct);

        if (!remoteRes.IsSuccessStatusCode)
        {
            remoteRes.Dispose();
            return null;
        }

        var extension = Path.GetExtension(fileUri.AbsolutePath);
        var safeName = string.Join("_", verification.Name.Split(Path.GetInvalidFileNameChars()));
        var downloadName = string.IsNullOrEmpty(extension) ? safeName : $"{safeName}{extension}";

        return new DownloadFilePayload(remoteRes, await remoteRes.Content.ReadAsStreamAsync(ct))
        {
            ContentType = remoteRes.Content.Headers.ContentType?.ToString() ?? "application/octet-stream",
            FileName = downloadName
        };
    }
    
    public async Task<bool> HasOrderAsync(
        string email,
        string productId,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedEmail) || string.IsNullOrWhiteSpace(productId))
            return false;

        return await db.Orders
            .AsNoTracking()
            .AnyAsync(o => o.ProductId == productId && o.User.Email == normalizedEmail, ct);
    }
}