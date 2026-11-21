using Microsoft.EntityFrameworkCore;

public record CreateOrderResult(
    bool Success, int StatusCode = 200, string? Error = null, Order? Order = null);

public sealed record FulfillOrderRequest(
    string ProductId,
    string Email,
    int PriceInCents);

public sealed record FulfillOrderResponse(
    string OrderId,
    DateTime CreatedAt,
    int PriceInCents,
    string ProductId,
    string ProductName,
    string? ProductImagePath,
    string? ProductDescription,
    string DownloadVerificationId);

public class OrderService(AppDbContext db, ILogger<OrderService> logger)
{
    public async Task<CreateOrderResult> CreateOrderAsync(string userEmail, string? productId)
    {
        if (string.IsNullOrWhiteSpace(productId))
            return new(false, StatusCodes.Status400BadRequest, "Product ID is required");

        var product = await db.Products.FindAsync(productId);
        if (product is null)
            return new(false, StatusCodes.Status404NotFound, "Product not found");

        if (!product.IsAvailableForPurchase)
            return new(false, StatusCodes.Status400BadRequest, "Product is not available for purchase");

        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == userEmail);
        if (user is null)
            return new(false, StatusCodes.Status404NotFound, "User not found");

        var order = new Order
        {
            ProductId = product.Id,
            UserId = user.Id,
            PriceInCents = product.PriceInCents
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        logger.LogInformation("Created order {OrderId} for user {UserId}", order.Id, user.Id);
        return new(true, Order: order);
    }

    public async Task<(FulfillOrderResponse? Data, string? Error, int StatusCode)> FulfillOrderAsync(
        FulfillOrderRequest req,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.ProductId) || string.IsNullOrWhiteSpace(req.Email))
            return (null, "ProductId and Email are required.", 400);

        var normalizedEmail = req.Email.Trim().ToLowerInvariant();

        var product = await db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == req.ProductId, ct);

        if (product is null)
            return (null, "Product not found.", 400);

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, ct);

        if (user is null)
            return (null, "User does not exist. Please create an account.", 404);

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var order = new Order
        {
            Id = Guid.NewGuid().ToString(),
            UserId = user.Id,
            ProductId = product.Id,
            PriceInCents = req.PriceInCents
        };
        db.Orders.Add(order);

        var verification = new DownloadVerification
        {
            Id = Guid.NewGuid().ToString(),
            ProductId = product.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        db.DownloadVerifications.Add(verification);

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return (
            new FulfillOrderResponse(
                order.Id,
                order.CreatedAt,
                order.PriceInCents,
                product.Id,
                product.Name,
                product.ImagePath,
                product.Description,
                verification.Id),
            null,
            201);
    }
}