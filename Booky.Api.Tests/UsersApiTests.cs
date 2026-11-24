// UsersApiTests.cs
using System.Net;
using System.Net.Http.Json;

public class UsersApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private HttpClient AuthorizedClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Internal-Key", ApiFactory.Key);
        return client;
    }

    [Fact]
    public async Task Request_WithoutServiceKey_IsRejected()
    {
        var response = await factory.CreateClient()
            .PostAsJsonAsync("/api/users/verify-login", new { email = "a@b.com", password = "x" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_ThenLogin_Succeeds()
    {
        var client = AuthorizedClient();
        var email = $"{Guid.NewGuid():N}@example.com";
        var username = Guid.NewGuid().ToString("N");

        var register = await client.PostAsJsonAsync("/api/users/register",
            new { email, username, password = "correct-horse" });
        var login = await client.PostAsJsonAsync("/api/users/verify-login",
            new { email, password = "correct-horse" });

        Assert.Equal(HttpStatusCode.OK, register.StatusCode);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    [Fact]
    public async Task Register_ShortPassword_ReturnsBadRequest()
    {
        var response = await AuthorizedClient().PostAsJsonAsync("/api/users/register",
            new { email = "x@example.com", username = "x", password = "short" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}