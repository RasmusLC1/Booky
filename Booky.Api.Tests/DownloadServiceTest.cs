using System.Net;
using System.Text;
using Xunit;

public class DownloadServiceTests
{
    private static User MakeUser(string id = "u1", string email = "buyer@example.com") =>
        new()
        {
            Id = id,
            Email = email,
            Username = id,
            Password = "hashed-password"
        };

    private static Product MakeProduct(
        string id = "p1",
        string name = "Clean Code",
        string filePath = "https://files.example.com/books/clean-code.pdf",
        int priceInCents = 1999) =>
        new()
        {
            Id = id,
            Name = name,
            Author = "Author",
            PriceInCents = priceInCents,
            ImagePath = "/images/book.png",
            Description = "A book",
            Category = "Tech",
            Length = 300,
            FilePath = filePath,
            IsAvailableForPurchase = true
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

    // --- CreateVerificationAsync ---

    [Fact]
    public async Task CreateVerification_MissingEmail_IsUnauthorized()
    {
        using var db = new TestDb();
        var sut = new DownloadService(db.Context, null!);

        var result = await sut.CreateVerificationAsync("   ", "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task CreateVerification_MissingProductId_IsBadRequest()
    {
        using var db = new TestDb();
        var sut = new DownloadService(db.Context, null!);

        var result = await sut.CreateVerificationAsync("buyer@example.com", " ");

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task CreateVerification_WithoutPurchase_IsForbidden()
    {
        using var db = new TestDb();
        db.Context.Products.Add(MakeProduct("p1"));
        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        await db.Context.SaveChangesAsync();

        var sut = new DownloadService(db.Context, null!);

        var result = await sut.CreateVerificationAsync("buyer@example.com", "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal(403, result.StatusCode);
    }

    [Fact]
    public async Task CreateVerification_WithPurchase_CreatesExpiringToken()
    {
        using var db = new TestDb();
        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        db.Context.Products.Add(MakeProduct("p1"));
        db.Context.Orders.Add(MakeOrder("o1", "u1", "p1"));
        await db.Context.SaveChangesAsync();

        var before = DateTime.UtcNow;
        var sut = new DownloadService(db.Context, null!);

        // Also verifies email trimming and case normalization
        var result = await sut.CreateVerificationAsync("  BUYER@EXAMPLE.COM ", "p1");

        Assert.True(result.IsSuccess);
        Assert.Equal(200, result.StatusCode);
        Assert.False(string.IsNullOrWhiteSpace(result.Value));

        var saved = await db.Context.DownloadVerifications.FindAsync(result.Value);
        Assert.NotNull(saved);
        Assert.Equal("p1", saved.ProductId);
        Assert.True(saved.ExpiresAt >= before.AddHours(23).AddMinutes(59));
        Assert.True(saved.ExpiresAt <= DateTime.UtcNow.AddDays(1).AddMinutes(1));
    }

    // --- GetOrderHistoryAsync ---

    [Fact]
    public async Task GetOrderHistory_MissingEmail_IsBadRequest()
    {
        using var db = new TestDb();
        var sut = new DownloadService(db.Context, null!);

        var result = await sut.GetOrderHistoryAsync(null);

        Assert.False(result.IsSuccess);
        Assert.Equal(400, result.StatusCode);
    }

    [Fact]
    public async Task GetOrderHistory_UnknownUser_IsNotFound()
    {
        using var db = new TestDb();
        var sut = new DownloadService(db.Context, null!);

        var result = await sut.GetOrderHistoryAsync("missing@example.com");

        Assert.False(result.IsSuccess);
        Assert.Equal(404, result.StatusCode);
    }

    [Fact]
    public async Task GetOrderHistory_ExistingUser_ReturnsOrdersAndGeneratesVerifications()
    {
        using var db = new TestDb();
        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        db.Context.Products.AddRange(MakeProduct("p1", "Book One"), MakeProduct("p2", "Book Two"));
        db.Context.Orders.AddRange(
            MakeOrder("o1", "u1", "p1", 1500),
            MakeOrder("o2", "u1", "p2", 2500));
        await db.Context.SaveChangesAsync();

        var sut = new DownloadService(db.Context, null!);
        var result = await sut.GetOrderHistoryAsync("BUYER@example.com");

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("buyer@example.com", result.Value.Email);
        Assert.Equal(2, result.Value.Orders.Count);
        Assert.All(result.Value.Orders, item => Assert.False(string.IsNullOrWhiteSpace(item.DownloadVerificationId)));
        Assert.Equal(2, db.Context.DownloadVerifications.Count());
    }

    // --- GetMyOrdersAsync ---

    [Fact]
    public async Task GetMyOrders_MissingEmail_IsUnauthorized()
    {
        using var db = new TestDb();
        var sut = new DownloadService(db.Context, null!);

        var result = await sut.GetMyOrdersAsync("");

        Assert.False(result.IsSuccess);
        Assert.Equal(401, result.StatusCode);
    }

    [Fact]
    public async Task GetMyOrders_OrdersDescendingAndReusesTokenPerProduct()
    {
        using var db = new TestDb();
        var older = new DateTime(2026, 1, 10, 12, 0, 0, DateTimeKind.Utc);
        var newer = new DateTime(2026, 2, 10, 12, 0, 0, DateTimeKind.Utc);

        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        db.Context.Products.Add(MakeProduct("p1", "Repeated Book"));
        db.Context.Orders.AddRange(
            MakeOrder("o-old", "u1", "p1", 1000, older),
            MakeOrder("o-new", "u1", "p1", 1000, newer));
        await db.Context.SaveChangesAsync();

        var sut = new DownloadService(db.Context, null!);
        var result = await sut.GetMyOrdersAsync("buyer@example.com");

        Assert.True(result.IsSuccess);
        var orders = result.Value!;
        Assert.Equal(2, orders.Count);
        Assert.Equal("o-new", orders[0].Id);
        Assert.Equal("o-old", orders[1].Id);

        // Two orders for the same product share one verification token in GetMyOrdersAsync
        Assert.Equal(orders[0].DownloadVerificationId, orders[1].DownloadVerificationId);
        Assert.Equal(1, db.Context.DownloadVerifications.Count());
    }

    // --- GetDownloadFileAsync ---

    [Fact]
    public async Task GetDownloadFile_ExpiredToken_ReturnsNull()
    {
        using var db = new TestDb();
        db.Context.Products.Add(MakeProduct("p1", "Book"));
        db.Context.DownloadVerifications.Add(new DownloadVerification
        {
            Id = "expired-id",
            ProductId = "p1",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5)
        });
        await db.Context.SaveChangesAsync();

        var calls = 0;
        var factory = new FakeHttpClientFactory(_ =>
        {
            calls++;
            return FakeHttpClientFactory.OkBytes("data");
        });

        var sut = new DownloadService(db.Context, factory);
        var payload = await sut.GetDownloadFileAsync("expired-id");

        Assert.Null(payload);
        Assert.Equal(0, calls);
    }

    [Fact]
    public async Task GetDownloadFile_ValidToken_StreamsFileWithExtensionAndSanitizedName()
    {
        using var db = new TestDb();
        db.Context.Products.Add(MakeProduct(
            "p1",
            "C# / In:Depth",
            "https://storage.example.com/files/book.pdf"));
        db.Context.DownloadVerifications.Add(new DownloadVerification
        {
            Id = "valid-id",
            ProductId = "p1",
            ExpiresAt = DateTime.UtcNow.AddHours(12)
        });
        await db.Context.SaveChangesAsync();

        var factory = new FakeHttpClientFactory(_ =>
            FakeHttpClientFactory.OkBytes("pdf-bytes", "ignored.pdf", "application/pdf"));

        var sut = new DownloadService(db.Context, factory);
        using var payload = await sut.GetDownloadFileAsync("valid-id");

        Assert.NotNull(payload);
        Assert.Equal("application/pdf", payload.ContentType);
        Assert.EndsWith(".pdf", payload.FileName);
        Assert.DoesNotContain("/", payload.FileName);
        Assert.DoesNotContain(":", payload.FileName);

        using var reader = new StreamReader(payload.Stream, Encoding.UTF8);
        Assert.Equal("pdf-bytes", await reader.ReadToEndAsync());
    }

    [Fact]
    public async Task GetDownloadFile_RemoteFails_ReturnsNull()
    {
        using var db = new TestDb();
        db.Context.Products.Add(MakeProduct("p1", "Book", "https://storage.example.com/missing.pdf"));
        db.Context.DownloadVerifications.Add(new DownloadVerification
        {
            Id = "valid-id",
            ProductId = "p1",
            ExpiresAt = DateTime.UtcNow.AddHours(12)
        });
        await db.Context.SaveChangesAsync();

        var factory = new FakeHttpClientFactory(_ => new HttpResponseMessage(HttpStatusCode.NotFound));
        var sut = new DownloadService(db.Context, factory);

        var payload = await sut.GetDownloadFileAsync("valid-id");

        Assert.Null(payload);
    }

    // --- HasOrderAsync ---

    [Fact]
    public async Task HasOrder_MatchesNormalizedEmailAndProduct()
    {
        using var db = new TestDb();
        db.Context.Users.Add(MakeUser("u1", "buyer@example.com"));
        db.Context.Products.AddRange(MakeProduct("p1"), MakeProduct("p2"));
        db.Context.Orders.Add(MakeOrder("o1", "u1", "p1"));
        await db.Context.SaveChangesAsync();

        var sut = new DownloadService(db.Context, null!);

        Assert.True(await sut.HasOrderAsync("  BUYER@example.com ", "p1"));
        Assert.False(await sut.HasOrderAsync("buyer@example.com", "p2"));
        Assert.False(await sut.HasOrderAsync("   ", "p1"));
    }
}