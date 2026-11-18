using Microsoft.EntityFrameworkCore;

public record CreateOrderResult(
    bool Success, int StatusCode = 200, string? Error = null, Order? Order = null);

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
}