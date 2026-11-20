using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

public class ProductService(AppDbContext db, IHttpClientFactory httpClientFactory)
{
    private static readonly Expression<Func<Product, ProductDto>> ToDto = p => new ProductDto
    {
        Id = p.Id,
        Name = p.Name,
        Author = p.Author,
        PriceInCents = p.PriceInCents,
        ImagePath = p.ImagePath,
        Description = p.Description,
        Category = p.Category,
        Length = p.Length,
        IsAvailableForPurchase = p.IsAvailableForPurchase,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    public async Task<List<ProductDto>> GetPopularAsync(int take = 3, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);
        return await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderByDescending(p => p.Orders.Count)
            .ThenByDescending(p => p.CreatedAt)
            .Take(take)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public async Task<List<ProductDto>> GetNewestAsync(int take = 3, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);
        return await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public Task<ProductDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        return db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(ToDto)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<List<ProductDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderBy(p => p.Name)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public async Task<DownloadPayload?> GetDownloadAsync(string id, CancellationToken ct = default)
    {
        var product = await db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new { p.Name, p.FilePath })
            .FirstOrDefaultAsync(ct);

        if (product is null || string.IsNullOrWhiteSpace(product.FilePath))
            return null;

        var client = httpClientFactory.CreateClient();
        using var response = await client.GetAsync(
            product.FilePath,
            HttpCompletionOption.ResponseHeadersRead,
            ct);

        if (!response.IsSuccessStatusCode)
            return null;

        var bytes = await response.Content.ReadAsByteArrayAsync(ct);
        var contentType = response.Content.Headers.ContentType?.ToString()
            ?? "application/octet-stream";
        var ext = Path.GetExtension(new Uri(product.FilePath).AbsolutePath);

        return new DownloadPayload
        {
            Bytes = bytes,
            ContentType = contentType,
            FileName = $"{product.Name}{ext}"
        };
    }
}