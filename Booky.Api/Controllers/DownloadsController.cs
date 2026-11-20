using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public record CreateVerificationRequest(string? ProductId);

[ApiController]
[Route("api/downloads")]
public class DownloadsController(AppDbContext db) : ControllerBase
{
    [HttpPost("verification")]
    public async Task<IActionResult> Create(CreateVerificationRequest req)
    {
        var email = Request.Headers["X-User-Email"].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { error = "Not logged in" });

        if (string.IsNullOrWhiteSpace(req.ProductId))
            return BadRequest(new { error = "Product ID is required" });

        var owns = await db.Orders.AnyAsync(o =>
            o.ProductId == req.ProductId && o.User.Email == email);
        if (!owns)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { error = "You have not purchased this product" });

        var verification = new DownloadVerification
        {
            ProductId = req.ProductId,
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        db.DownloadVerifications.Add(verification);
        await db.SaveChangesAsync();

        return Ok(new { id = verification.Id });
    }

    public record OrderHistoryRequest(string? Email);

    [HttpPost("order-history")]
    public async Task<IActionResult> OrderHistory(OrderHistoryRequest req)
    {
        var email = req.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return BadRequest(new { error = "Email is required" });

        if (!await db.Users.AnyAsync(u => u.Email == email))
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
            .ToListAsync();

        // One verification per order, all saved in a single call
        var verifications = orders
            .Select(o => new DownloadVerification
            {
                ProductId = o.Product.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            })
            .ToList();
        db.DownloadVerifications.AddRange(verifications);
        await db.SaveChangesAsync();

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
    public async Task<IActionResult> MyOrders()
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
                Product = new ProductDto(
                    o.Product.Id, o.Product.Name, o.Product.Author, o.Product.PriceInCents,
                    o.Product.ImagePath, o.Product.Description, o.Product.Category,
                    o.Product.Length, o.Product.IsAvailableForPurchase, o.Product.CreatedAt)
            })
            .ToListAsync();

        // One token per distinct product, not per order
        var tokens = orders
            .Select(o => o.Product.Id)
            .Distinct()
            .ToDictionary(id => id, id => new DownloadVerification
            {
                ProductId = id,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            });
        db.DownloadVerifications.AddRange(tokens.Values);
        await db.SaveChangesAsync();

        return Ok(orders.Select(o => new
        {
            o.Id,
            o.PriceInCents,
            createdAt = DateTime.SpecifyKind(o.CreatedAt, DateTimeKind.Utc),
            o.Product,
            downloadVerificationId = tokens[o.Product.Id].Id
        }));
    }
}