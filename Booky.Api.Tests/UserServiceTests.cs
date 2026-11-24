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
    public async Task Register_DuplicateUsername_IsRejected()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("first@b.com", "alice", "password1");

        var result = await sut.RegisterAsync("second@b.com", "ALICE", "password1");

        Assert.False(result.Success);
        Assert.Equal("Username is already in use", result.Errors!["username"]);
    }

    [Fact]
    public async Task VerifyLogin_ValidCredentialsAndNormalizedEmail_Succeeds()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("buyer@example.com", "buyer", "correct-horse");

        var result = await sut.VerifyLoginAsync("  BUYER@EXAMPLE.COM ", "correct-horse");

        Assert.True(result.Success);
        Assert.Null(result.Field);
        Assert.Null(result.Error);
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

    [Fact]
    public async Task EnsureUser_CreatesUserAndIsIdempotentForExistingEmail()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);

        await sut.EnsureUserAsync("  Reader@Example.com ", "Reader One");
        await sut.EnsureUserAsync("reader@example.com", "Different Name");

        var users = await db.Context.Users.ToListAsync();
        var user = Assert.Single(users);
        Assert.Equal("reader@example.com", user.Email);
        Assert.Equal("Reader One", user.Username);
        Assert.False(string.IsNullOrWhiteSpace(user.Password));
    }

    [Fact]
    public async Task EnsureUser_UsesEmailPrefixWhenNameMissing_AndSuffixesOnUsernameCollision()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("first@example.com", "alex", "password1");

        await sut.EnsureUserAsync("alex@example.com", "Alex");
        await sut.EnsureUserAsync("second@example.com", "Alex");
        await sut.EnsureUserAsync("third@example.com", null);

        var secondUser = await db.Context.Users.SingleAsync(u => u.Email == "second@example.com");
        Assert.StartsWith("Alex", secondUser.Username);
        Assert.NotEqual("Alex", secondUser.Username);

        var thirdUser = await db.Context.Users.SingleAsync(u => u.Email == "third@example.com");
        Assert.Equal("third", thirdUser.Username); // Username based on email if not available
    }

    [Fact]
    public async Task GetByEmail_NormalizesEmail_AndReturnsNullWhenMissingOrBlank()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("member@example.com", "member", "password1");

        var found = await sut.GetByEmailAsync("  MEMBER@EXAMPLE.COM ");
        var missing = await sut.GetByEmailAsync("unknown@example.com");
        var blank = await sut.GetByEmailAsync("   ");

        Assert.NotNull(found);
        Assert.Equal("member@example.com", found.Email);
        Assert.Equal("member", found.Username);
        Assert.Null(missing);
        Assert.Null(blank);
    }

    [Fact]
    public async Task DeleteUser_ExistingIdDeletesUser_BlankOrUnknownReturnsFalse()
    {
        using var db = new TestDb();
        var sut = new UserService(db.Context);
        await sut.RegisterAsync("delete-me@example.com", "deleteme", "password1");
        var user = await db.Context.Users.SingleAsync();

        Assert.False(await sut.DeleteUser(""));
        Assert.False(await sut.DeleteUser("   "));
        Assert.False(await sut.DeleteUser("does-not-exist"));

        var deleted = await sut.DeleteUser(user.Id);

        Assert.True(deleted);
        Assert.Empty(db.Context.Users);
    }
}