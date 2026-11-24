// OrderServiceTests.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

public class OrderServiceTests
{
    private static async Task SeedAsync(AppDbContext db, bool available = true)
    {
        db.Products.Add(new Product
        {
            Id = "p1", Name = "Book", Author = "A", PriceInCents = 1999,
            FilePath = "x", ImagePath = "x", Description = "x", Category = "c",
            Length = 1, IsAvailableForPurchase = available
        });
        db.Users.Add(new User { Id = "u1", Email = "buyer@example.com", Username = "buyer", Password = "x" });
        await db.SaveChangesAsync();
    }

    private static OrderService Create(TestDb db) =>
        new(db.Context, NullLogger<OrderService>.Instance);

    [Fact]
    public async Task CreateOrder_CopiesCurrentPriceOntoTheOrder()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var result = await Create(db).CreateOrderAsync("buyer@example.com", "p1");

        Assert.True(result.Success);
        var order = await db.Context.Orders.SingleAsync();
        Assert.Equal(1999, order.PriceInCents);
        Assert.Equal("u1", order.UserId);
    }

    [Fact]
    public async Task CreateOrder_UnavailableProduct_IsRejected()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context, available: false);

        var result = await Create(db).CreateOrderAsync("buyer@example.com", "p1");

        Assert.False(result.Success);
        Assert.Equal(400, result.StatusCode);
        Assert.Empty(db.Context.Orders);
    }

    [Theory]
    [InlineData(null, 400)]
    [InlineData("", 400)]
    [InlineData("missing", 404)]
    public async Task CreateOrder_BadProductId_ReturnsExpectedStatus(string? productId, int expected)
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var result = await Create(db).CreateOrderAsync("buyer@example.com", productId);

        Assert.Equal(expected, result.StatusCode);
    }

    [Fact]
    public async Task CreateOrder_UnknownUser_Returns404()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var result = await Create(db).CreateOrderAsync("stranger@example.com", "p1");

        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task CreateOrder_ValidRequest_SetsProductIdAndReturnsOrder()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var result = await Create(db).CreateOrderAsync("buyer@example.com", "p1");

        Assert.True(result.Success);
        Assert.Equal(200, result.StatusCode);
        Assert.Null(result.Error);
        Assert.NotNull(result.Order);
        Assert.Equal("p1", result.Order.ProductId);
        Assert.Equal("u1", result.Order.UserId);
        Assert.Equal(1999, result.Order.PriceInCents);
    }

    // --- FulfillOrderAsync ---

    [Theory]
    [InlineData("", "buyer@example.com")]
    [InlineData("   ", "buyer@example.com")]
    [InlineData("p1", "")]
    [InlineData("p1", "   ")]
    public async Task FulfillOrder_MissingRequiredFields_Returns400(string productId, string email)
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var (data, error, statusCode) = await Create(db).FulfillOrderAsync(
            new FulfillOrderRequest(productId, email, 1500));

        Assert.Null(data);
        Assert.NotNull(error);
        Assert.Equal(400, statusCode);
        Assert.Empty(db.Context.Orders);
        Assert.Empty(db.Context.DownloadVerifications);
    }

    [Fact]
    public async Task FulfillOrder_UnknownProduct_Returns400()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var (data, error, statusCode) = await Create(db).FulfillOrderAsync(
            new FulfillOrderRequest("missing-product", "buyer@example.com", 1500));

        Assert.Null(data);
        Assert.NotNull(error);
        Assert.Equal(400, statusCode);
        Assert.Empty(db.Context.Orders);
        Assert.Empty(db.Context.DownloadVerifications);
    }

    [Fact]
    public async Task FulfillOrder_UnknownUser_Returns404()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var (data, error, statusCode) = await Create(db).FulfillOrderAsync(
            new FulfillOrderRequest("p1", "unknown@example.com", 1500));

        Assert.Null(data);
        Assert.NotNull(error);
        Assert.Equal(404, statusCode);
        Assert.Empty(db.Context.Orders);
        Assert.Empty(db.Context.DownloadVerifications);
    }

    [Fact]
    public async Task FulfillOrder_ValidRequest_CreatesOrderAndDownloadVerificationWith201()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context);

        var before = DateTime.UtcNow;
        var req = new FulfillOrderRequest("p1", "  BUYER@EXAMPLE.COM  ", 2599);

        var (data, error, statusCode) = await Create(db).FulfillOrderAsync(req);

        Assert.Null(error);
        Assert.Equal(201, statusCode);
        Assert.NotNull(data);
        Assert.False(string.IsNullOrWhiteSpace(data.OrderId));
        Assert.False(string.IsNullOrWhiteSpace(data.DownloadVerificationId));
        Assert.Equal(2599, data.PriceInCents);
        Assert.Equal("p1", data.ProductId);
        Assert.Equal("Book", data.ProductName);
        Assert.Equal("x", data.ProductImagePath);
        Assert.Equal("x", data.ProductDescription);

        var savedOrder = await db.Context.Orders.SingleAsync();
        Assert.Equal(data.OrderId, savedOrder.Id);
        Assert.Equal("u1", savedOrder.UserId);
        Assert.Equal("p1", savedOrder.ProductId);
        Assert.Equal(2599, savedOrder.PriceInCents);

        var verification = await db.Context.DownloadVerifications.SingleAsync();
        Assert.Equal(data.DownloadVerificationId, verification.Id);
        Assert.Equal("p1", verification.ProductId);
        Assert.True(verification.ExpiresAt >= before.AddHours(23).AddMinutes(59));
        Assert.True(verification.ExpiresAt <= DateTime.UtcNow.AddHours(24).AddMinutes(1));
    }

    [Fact]
    public async Task FulfillOrder_UnavailableProduct_StillFulfillsWhenProductExists()
    {
        using var db = new TestDb();
        await SeedAsync(db.Context, available: false);

        var (data, error, statusCode) = await Create(db).FulfillOrderAsync(
            new FulfillOrderRequest("p1", "buyer@example.com", 1999));

        Assert.Null(error);
        Assert.Equal(201, statusCode);
        Assert.NotNull(data);
        Assert.Single(db.Context.Orders);
    }
}