using Microsoft.EntityFrameworkCore;

public class UserServiceTests
{
    [Fact]
    public async Task Register_StoresHashedPassword_AndNormalisesEmailAndUsername()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);

        var result = await sut.RegisterAsync("  Test@Example.com ", "Tester", "correct-horse");

        Assert.True(result.Success);
        var user = await db.Context.Users.SingleAsync();
        Assert.Equal("test@example.com", user.Email);
        Assert.Equal("tester", user.Username);
        Assert.NotEqual("correct-horse", user.Password);
        Assert.True(BCrypt.Net.BCrypt.Verify("correct-horse", user.Password));
    }

    [Fact]
    public async Task Register_DuplicateEmail_IsRejected()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("a@b.com", "first", "password1");

        var result = await sut.RegisterAsync("A@B.com", "second", "password1");

        Assert.False(result.Success);
        Assert.Equal("Email is already in use", result.Errors!["email"]);
    }

    [Fact]
    public async Task VerifyLogin_WrongPassword_ReportsPasswordField()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("a@b.com", "first", "password1");

        var result = await sut.VerifyLoginAsync("a@b.com", "not-the-password");

        Assert.False(result.Success);
        Assert.Equal("password", result.Field);
    }

    [Fact]
    public async Task VerifyLogin_UnknownEmail_ReportsEmailField()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);

        var result = await sut.VerifyLoginAsync("nobody@b.com", "whatever");

        Assert.False(result.Success);
        Assert.Equal("email", result.Field);
    }
}