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
}