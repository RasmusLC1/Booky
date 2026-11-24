using Xunit;

public class AdminServiceTests
{
    private static User MakeUser(
        string id,
        string email,
        string? username = null,
        DateTime? createdAt = null) =>
        new()
        {
            Id = id,
            Email = email,
            Username = username ?? id,
            Password = "hashed-password",
            CreatedAt = createdAt ?? DateTime.UtcNow
        };

    private static Product MakeProduct(
        string id,
        string name,
        int priceInCents = 1999,
        bool isAvailable = true,
        string filePath = "https://storage.example.com/books/book.pdf") =>
        new()
        {
            Id = id,
            Name = name,
            Author = "Author",
            PriceInCents = priceInCents,
            ImagePath = "/images/book.png",
            Description = "A book",
            Category = "Tech",
            Length = 250,
            FilePath = filePath,
            IsAvailableForPurchase = isAvailable
        };

    private static Order MakeOrder(
        string id,
        string userId,
        string productId,
        int priceInCents = 1999,
        DateTime? createdAt = null) =>
        new()
        {
            Id = id,
            UserId = userId,
            ProductId = productId,
            PriceInCents = priceInCents,
            CreatedAt = createdAt ?? DateTime.UtcNow
        };

    // --- GetDashboardStatsAsync ---

    [Fact]
    public async Task GetDashboardStats_EmptyDatabase_ReturnsZeros()
    {
        using var db = new TestDb();
        var sut = new AdminService(db.Context);

        var stats = await sut.GetDashboardStatsAsync();

        Assert.Equal(0L, stats.Sales.TotalCents);
        Assert.Equal(0, stats.Sales.NumberOfSales);
        Assert.Equal(0, stats.Customers.UserCount);
        Assert.Equal(0L, stats.Customers.TotalOrderCents);
        Assert.Equal(0, stats.Products.ActiveCount);
        Assert.Equal(0, stats.Products.InactiveCount);
    }

    [Fact]
    public async Task GetDashboardStats_WithData_AggregatesSalesCustomersAndProducts()
    {
        using var db = new TestDb();
        db.Context.Users.AddRange(
            MakeUser("u1", "a@example.com"),
            MakeUser("u2", "b@example.com"));
        db.Context.Products.AddRange(
            MakeProduct("p1", "Active One", 1500, isAvailable: true),
            MakeProduct("p2", "Active Two", 2500, isAvailable: true),
            MakeProduct("p3", "Archived", 3000, isAvailable: false));
        db.Context.Orders.AddRange(
            MakeOrder("o1", "u1", "p1", 1500),
            MakeOrder("o2", "u2", "p2", 2500));
        await db.Context.SaveChangesAsync();

        var sut = new AdminService(db.Context);
        var stats = await sut.GetDashboardStatsAsync();

        Assert.Equal(4000L, stats.Sales.TotalCents);
        Assert.Equal(2, stats.Sales.NumberOfSales);
        Assert.Equal(2, stats.Customers.UserCount);
        Assert.Equal(4000L, stats.Customers.TotalOrderCents);
        Assert.Equal(2, stats.Products.ActiveCount);
        Assert.Equal(1, stats.Products.InactiveCount);
    }

    // --- DeleteOrderAsync ---

    [Fact]
    public async Task DeleteOrder_BlankOrMissingId_ReturnsFalse()
    {
        using var db = new TestDb();
        var sut = new AdminService(db.Context);

        Assert.False(await sut.DeleteOrderAsync(""));
        Assert.False(await sut.DeleteOrderAsync("   "));
        Assert.False(await sut.DeleteOrderAsync("non-existent-id"));
    }

    [Fact]
    public async Task DeleteOrder_ExistingId_DeletesOrderAndReturnsTrue()
    {
        using var db = new TestDb();
        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        db.Context.Products.Add(MakeProduct("p1", "Book"));
        db.Context.Orders.AddRange(
            MakeOrder("o1", "u1", "p1", 1200),
            MakeOrder("o2", "u1", "p1", 2400));
        await db.Context.SaveChangesAsync();

        var sut = new AdminService(db.Context);
        var deleted = await sut.DeleteOrderAsync("o1");

        Assert.True(deleted);
        db.Context.ChangeTracker.Clear();
        Assert.Null(await db.Context.Orders.FindAsync("o1"));
        Assert.NotNull(await db.Context.Orders.FindAsync("o2"));
    }

    // --- GetOrdersAsync ---

    [Fact]
    public async Task GetOrders_ReturnsOrdersDescendingByCreatedAtWithProductAndUserInfo()
    {
        using var db = new TestDb();
        var older = new DateTime(2026, 1, 15, 10, 0, 0, DateTimeKind.Utc);
        var newer = new DateTime(2026, 2, 15, 10, 0, 0, DateTimeKind.Utc);

        db.Context.Users.Add(MakeUser("u1", "reader@example.com"));
        db.Context.Products.AddRange(
            MakeProduct("p1", "First Book", 1000),
            MakeProduct("p2", "Second Book", 2000));
        db.Context.Orders.AddRange(
            MakeOrder("o-old", "u1", "p1", 1000, older),
            MakeOrder("o-new", "u1", "p2", 2000, newer));
        await db.Context.SaveChangesAsync();

        var sut = new AdminService(db.Context);
        var orders = await sut.GetOrdersAsync();

        Assert.Equal(2, orders.Count);
        Assert.Equal("o-new", orders[0].Id);
        Assert.Equal("Second Book", orders[0].ProductName);
        Assert.Equal("reader@example.com", orders[0].UserEmail);
        Assert.Equal(2000, orders[0].PriceInCents);

        Assert.Equal("o-old", orders[1].Id);
        Assert.Equal("First Book", orders[1].ProductName);
    }

    // --- GetAdminProductsAsync ---

    [Fact]
    public async Task GetAdminProducts_ReturnsSortedByNameWithOrderCounts()
    {
        using var db = new TestDb();
        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        db.Context.Products.AddRange(
            MakeProduct("p-zebra", "Zebra Guide", 1500, isAvailable: false, filePath: "https://files.example.com/z.pdf"),
            MakeProduct("p-alpha", "Alpha Handbook", 999, isAvailable: true, filePath: "https://files.example.com/a.pdf"));
        db.Context.Orders.AddRange(
            MakeOrder("o1", "u1", "p-alpha", 999),
            MakeOrder("o2", "u1", "p-alpha", 999));
        await db.Context.SaveChangesAsync();

        var sut = new AdminService(db.Context);
        var products = await sut.GetAdminProductsAsync();

        Assert.Equal(2, products.Count);
        Assert.Equal("Alpha Handbook", products[0].Name);
        Assert.True(products[0].IsAvailableForPurchase);
        Assert.Equal("https://files.example.com/a.pdf", products[0].FilePath);
        Assert.Equal(2, products[0].OrderCount);

        Assert.Equal("Zebra Guide", products[1].Name);
        Assert.False(products[1].IsAvailableForPurchase);
        Assert.Equal(0, products[1].OrderCount);
    }

    // --- GetAdminUsersAsync ---

    [Fact]
    public async Task GetAdminUsers_ReturnsUsersDescendingByCreatedAtWithOrderCountAndSpend()
    {
        using var db = new TestDb();
        var earlier = new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc);
        var later = new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc);

        db.Context.Users.AddRange(
            MakeUser("u-old", "old@example.com", "olduser", earlier),
            MakeUser("u-new", "new@example.com", "newuser", later),
            MakeUser("u-zero", "zero@example.com", "zerouser", later.AddHours(1)));
        db.Context.Products.Add(MakeProduct("p1", "Book", 1500));
        db.Context.Orders.AddRange(
            MakeOrder("o1", "u-old", "p1", 1500),
            MakeOrder("o2", "u-old", "p1", 2500));
        await db.Context.SaveChangesAsync();

        var sut = new AdminService(db.Context);
        var users = await sut.GetAdminUsersAsync();

        Assert.Equal(3, users.Count);
        Assert.Equal("u-zero", users[0].Id);
        Assert.Equal(0, users[0].OrderCount);
        Assert.Equal(0L, users[0].TotalSpentCents);

        Assert.Equal("u-new", users[1].Id);
        Assert.Equal("newuser", users[1].Username);
        Assert.Equal(0, users[1].OrderCount);
        Assert.Equal(0L, users[1].TotalSpentCents);

        Assert.Equal("u-old", users[2].Id);
        Assert.Equal("old@example.com", users[2].Email);
        Assert.Equal(2, users[2].OrderCount);
        Assert.Equal(4000L, users[2].TotalSpentCents);
    }
}