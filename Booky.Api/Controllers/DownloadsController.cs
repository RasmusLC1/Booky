using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public record CreateVerificationRequest(string? ProductId);

[ApiController]
[Route("api/downloads")]
public class DownloadsController(AppDbContext db) : ControllerBase
{
    [HttpPost("verification")]
    public async Task<IActionResult> Create(CreateVerificationRequest req, CancellationToken ct = default)
    {
        var email = Request.Headers["X-User-Email"].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { error = "Not logged in" });

        if (string.IsNullOrWhiteSpace(req.ProductId))
            return BadRequest(new { error = "Product ID is required" });

        var owns = await db.Orders.AnyAsync(o =>
            o.ProductId == req.ProductId && o.User.Email == email, ct);
        if (!owns)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { error = "You have not purchased this product" });

        var verification = new DownloadVerification
        {
            ProductId = req.ProductId,
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        db.DownloadVerifications.Add(verification);
        await db.SaveChangesAsync(ct);

        return Ok(new { id = verification.Id });
    }

    public record OrderHistoryRequest(string? Email);

    [HttpPost("order-history")]
    public async Task<IActionResult> OrderHistory(OrderHistoryRequest req, CancellationToken ct = default)
    {
        var email = req.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return BadRequest(new { error = "Email is required" });

        if (!await db.Users.AnyAsync(u => u.Email == email, ct))
            return NotFound(new { error = "User not found" });

        var orders = await db.Orders
            .AsNoTracking()
            .Where(o => o.User.Email == email)
            .Select(o => new
            {
                o.Id,
                o.PriceInCents,
                o.CreatedAt,
                Product = new { o.Product.Id, o.Product.Name, o.Product.ImagePath, o.Product.Description }
            })
            .ToListAsync(ct);

        // One verification per order, all saved in a single call
        var verifications = orders
            .Select(o => new DownloadVerification
            {
                ProductId = o.Product.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            })
            .ToList();
        db.DownloadVerifications.AddRange(verifications);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            email,
            orders = orders.Select((o, i) => new
            {
                o.Id,
                o.PriceInCents,
                createdAt = DateTime.SpecifyKind(o.CreatedAt, DateTimeKind.Utc),
                o.Product,
                downloadVerificationId = verifications[i].Id
            })
        });
    }

    [HttpGet("my-orders")]
    public async Task<IActionResult> MyOrders(CancellationToken ct = default)
    {
        var email = Request.Headers["X-User-Email"].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { error = "Not logged in" });

        var orders = await db.Orders
            .AsNoTracking()
            .Where(o => o.User.Email == email)
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

        // One token per distinct product, not per order
        var tokens = orders
            .Select(o => o.Product.Id)
            .Distinct()
            .ToDictionary(id => id, id => new DownloadVerification
            {
                ProductId = id,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            });

        if (tokens.Count > 0)
        {
            db.DownloadVerifications.AddRange(tokens.Values);
            await db.SaveChangesAsync(ct);
        }

        return Ok(orders.Select(o => new
        {
            o.Id,
            o.PriceInCents,
            createdAt = DateTime.SpecifyKind(o.CreatedAt, DateTimeKind.Utc),
            o.Product,
            downloadVerificationId = tokens[o.Product.Id].Id
        }));
    }

    [HttpGet("{verificationId}")]
    public async Task<IActionResult> Download(string verificationId, CancellationToken ct = default)
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

        if (verification is null || string.IsNullOrWhiteSpace(verification.FilePath))
            return NotFound();

        using var httpClient = new HttpClient();
        using var remoteRes = await httpClient.GetAsync(verification.FilePath, ct);
        if (!remoteRes.IsSuccessStatusCode)
            return NotFound();

        var bytes = await remoteRes.Content.ReadAsByteArrayAsync(ct);
        var extension = Path.GetExtension(verification.FilePath);
        var safeName = string.Join("_", verification.Name.Split(Path.GetInvalidFileNameChars()));
        var downloadName = string.IsNullOrEmpty(extension) ? safeName : $"{safeName}{extension}";

        var contentType = remoteRes.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
        return File(bytes, contentType, downloadName);
    }
}