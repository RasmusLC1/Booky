using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

public class OrdersApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private HttpClient Client(string? userEmail = null, string? apiKey = ApiFactory.Key)
    {
        var client = factory.CreateClient();
        if (apiKey is not null)
            client.DefaultRequestHeaders.Add("X-Internal-Key", apiKey);
        if (userEmail is not null)
            client.DefaultRequestHeaders.Add("X-User-Email", userEmail);
        return client;
    }

    private async Task<(string UserId, string Email, string ProductId)> SeedUserAndProductAsync(
        bool available = true,
        int priceInCents = 1999)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var userId = $"u-{suffix}";
        var email = $"buyer-{suffix}@example.com";
        var productId = $"p-{suffix}";

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.Users.Add(new User
        {
            Id = userId,
            Email = email,
            Username = $"user-{suffix}",
            Password = "hashed-password"
        });

        db.Products.Add(new Product
        {
            Id = productId,
            Name = $"Book {suffix}",
            Author = "Author",
            PriceInCents = priceInCents,
            FilePath = "https://files.example.com/book.pdf",
            ImagePath = "/images/book.png",
            Description = "Description",
            Category = "Tech",
            Length = 200,
            IsAvailableForPurchase = available
        });

        await db.SaveChangesAsync();
        return (userId, email, productId);
    }

    // --- POST /api/orders/create ---

    [Fact]
    public async Task Create_MissingUserEmailHeader_ReturnsUnauthorized()
    {
        var (_, _, productId) = await SeedUserAndProductAsync();
        var client = Client(userEmail: null);

        var res = await client.PostAsJsonAsync("/api/orders/create", new CreateOrderRequest(productId));

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Create_ValidRequest_ReturnsOkWithOrderPayload()
    {
        var (userId, email, productId) = await SeedUserAndProductAsync(priceInCents: 2499);
        var client = Client(userEmail: email);

        var res = await client.PostAsJsonAsync("/api/orders/create", new CreateOrderRequest(productId));

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Order added successfully!", body.GetProperty("message").GetString());

        var order = body.GetProperty("order");
        Assert.False(string.IsNullOrWhiteSpace(order.GetProperty("id").GetString()));
        Assert.Equal(productId, order.GetProperty("productId").GetString());
        Assert.Equal(userId, order.GetProperty("userId").GetString());
        Assert.Equal(2499, order.GetProperty("priceInCents").GetInt32());
    }

    [Fact]
    public async Task Create_UnavailableProduct_ReturnsBadRequestWithError()
    {
        var (_, email, productId) = await SeedUserAndProductAsync(available: false);
        var client = Client(userEmail: email);

        var res = await client.PostAsJsonAsync("/api/orders/create", new CreateOrderRequest(productId));

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Product is not available for purchase", body.GetProperty("error").GetString());
    }

    // --- POST /api/orders/fulfill ---

    [Fact]
    public async Task Fulfill_ValidRequest_ReturnsCreatedWithOrderAndVerificationId()
    {
        var (userId, email, productId) = await SeedUserAndProductAsync(priceInCents: 1999);
        var client = Client(); // /fulfill only requires X-Internal-Key via middleware

        var req = new FulfillOrderRequest(productId, email.ToUpperInvariant(), 1500);
        var res = await client.PostAsJsonAsync("/api/orders/fulfill", req);

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);

        var payload = await res.Content.ReadFromJsonAsync<FulfillOrderResponse>();
        Assert.NotNull(payload);
        Assert.Equal(productId, payload.ProductId);
        Assert.Equal(1500, payload.PriceInCents);
        Assert.False(string.IsNullOrWhiteSpace(payload.OrderId));
        Assert.False(string.IsNullOrWhiteSpace(payload.DownloadVerificationId));

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var savedOrder = await db.Orders.FindAsync(payload.OrderId);
        Assert.NotNull(savedOrder);
        Assert.Equal(userId, savedOrder.UserId);
    }

    [Fact]
    public async Task Fulfill_UnknownUser_ReturnsNotFoundWithMessage()
    {
        var (_, _, productId) = await SeedUserAndProductAsync();
        var client = Client();

        var res = await client.PostAsJsonAsync("/api/orders/fulfill",
            new FulfillOrderRequest(productId, "ghost@example.com", 1500));

        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("User does not exist. Please create an account.", body.GetProperty("message").GetString());
    }
}