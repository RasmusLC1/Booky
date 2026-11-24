using Microsoft.EntityFrameworkCore;
using Xunit;

public class PasswordResetServiceTests
{
    private static async Task<User> SeedUserAsync(
        AppDbContext db,
        string id = "u1",
        string email = "user@example.com",
        string username = "reader",
        string initialPassword = "old-password")
    {
        var user = new User
        {
            Id = id,
            Email = email,
            Username = username,
            Password = BCrypt.Net.BCrypt.HashPassword(initialPassword, 4) // low cost for fast test setup
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    // --- CreateResetTokenAsync ---

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateResetToken_BlankEmail_ReturnsInvalidEmailError(string email)
    {
        using var db = new TestDb();
        var sut = new PasswordResetService(db.Context);

        var result = await sut.CreateResetTokenAsync(email);

        Assert.False(result.Success);
        Assert.Equal("Invalid email address", result.Error);
        Assert.Null(result.Token);
        Assert.Empty(db.Context.PasswordResets);
    }

    [Fact]
    public async Task CreateResetToken_UnknownEmail_ReturnsNotFoundError()
    {
        using var db = new TestDb();
        var sut = new PasswordResetService(db.Context);

        var result = await sut.CreateResetTokenAsync("missing@example.com");

        Assert.False(result.Success);
        Assert.Equal("No account found with this email", result.Error);
        Assert.Null(result.Token);
        Assert.Empty(db.Context.PasswordResets);
    }

    [Fact]
    public async Task CreateResetToken_ExistingUser_NormalizesEmailAndCreatesTenMinuteToken()
    {
        using var db = new TestDb();
        var user = await SeedUserAsync(db.Context, id: "u1", email: "user@example.com", username: "reader");

        var before = DateTime.UtcNow;
        var sut = new PasswordResetService(db.Context);

        var result = await sut.CreateResetTokenAsync("  USER@EXAMPLE.COM  ");

        Assert.True(result.Success);
        Assert.Null(result.Error);
        Assert.Equal(user.Id, result.UserId);
        Assert.Equal("user@example.com", result.Email);
        Assert.Equal("reader", result.Username);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal(64, result.Token.Length); // 32 random bytes as lowercase hex

        var saved = await db.Context.PasswordResets.SingleAsync(r => r.Token == result.Token);
        Assert.Equal(user.Id, saved.UserId);
        Assert.True(saved.ExpiresAt >= before.AddMinutes(9).AddSeconds(50));
        Assert.True(saved.ExpiresAt <= DateTime.UtcNow.AddMinutes(10).AddSeconds(10));
    }

    // --- ValidatePasswordResetAsync ---

    [Fact]
    public async Task ValidatePasswordReset_UnknownToken_FailsWithTokenError()
    {
        using var db = new TestDb();
        var sut = new PasswordResetService(db.Context);

        var result = await sut.ValidatePasswordResetAsync("non-existent-token");

        Assert.False(result.Success);
        Assert.NotNull(result.Errors);
        Assert.Equal("Invalid or expired token", result.Errors["token"]);
    }

    [Fact]
    public async Task ValidatePasswordReset_ExpiredToken_FailsWithTokenError()
    {
        using var db = new TestDb();
        var user = await SeedUserAsync(db.Context);
        db.Context.PasswordResets.Add(new PasswordReset
        {
            UserId = user.Id,
            Token = "expired-token",
            ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
        });
        await db.Context.SaveChangesAsync();

        var sut = new PasswordResetService(db.Context);
        var result = await sut.ValidatePasswordResetAsync("expired-token");

        Assert.False(result.Success);
        Assert.Equal("Invalid or expired token", result.Errors!["token"]);
    }

    [Fact]
    public async Task ValidatePasswordReset_ActiveToken_Succeeds()
    {
        using var db = new TestDb();
        var user = await SeedUserAsync(db.Context);
        db.Context.PasswordResets.Add(new PasswordReset
        {
            UserId = user.Id,
            Token = "valid-token",
            ExpiresAt = DateTime.UtcNow.AddMinutes(9)
        });
        await db.Context.SaveChangesAsync();

        var sut = new PasswordResetService(db.Context);
        var result = await sut.ValidatePasswordResetAsync("valid-token");

        Assert.True(result.Success);
        Assert.Null(result.Errors);
    }

    // --- ResetPasswordAsync ---

    [Fact]
    public async Task ResetPassword_MissingOrExpiredToken_DoesNotChangePassword()
    {
        using var db = new TestDb();
        var user = await SeedUserAsync(db.Context, initialPassword: "initial-password");
        var originalHash = user.Password;

        db.Context.PasswordResets.Add(new PasswordReset
        {
            UserId = user.Id,
            Token = "expired-reset",
            ExpiresAt = DateTime.UtcNow.AddSeconds(-10)
        });
        await db.Context.SaveChangesAsync();

        var sut = new PasswordResetService(db.Context);

        var missingRes = await sut.ResetPasswordAsync("unknown", "new-password");
        var expiredRes = await sut.ResetPasswordAsync("expired-reset", "new-password");

        Assert.False(missingRes.Success);
        Assert.Equal("Invalid or expired token", missingRes.Errors!["token"]);

        Assert.False(expiredRes.Success);
        Assert.Equal("Invalid or expired token", expiredRes.Errors!["token"]);

        db.Context.ChangeTracker.Clear();
        var reloaded = await db.Context.Users.SingleAsync(u => u.Id == user.Id);
        Assert.Equal(originalHash, reloaded.Password);
    }

    [Fact]
    public async Task ResetPassword_OrphanedTokenForMissingUser_ReturnsUserError()
    {
        using var db = new TestDb();
        var user = await SeedUserAsync(db.Context, id: "ghost-user-id", email: "ghost@example.com", username: "ghost");

        db.Context.PasswordResets.Add(new PasswordReset
        {
            UserId = user.Id,
            Token = "orphan-token",
            ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        await db.Context.SaveChangesAsync();

        // Temporarily suspend FK checks in SQLite so the User row can be removed while leaving the reset row behind
        await db.Context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF;");
        await db.Context.Users.Where(u => u.Id == user.Id).ExecuteDeleteAsync();
        await db.Context.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON;");

        var sut = new PasswordResetService(db.Context);
        var result = await sut.ResetPasswordAsync("orphan-token", "new-password");

        Assert.False(result.Success);
        Assert.NotNull(result.Errors);
        Assert.Equal("User not found.", result.Errors["user"]);
    }

    [Fact]
    public async Task ResetPassword_ValidToken_UpdatesPasswordAndConsumesTokenOnce()
    {
        using var db = new TestDb();
        var user = await SeedUserAsync(db.Context, initialPassword: "old-password");
        var sut = new PasswordResetService(db.Context);

        var created = await sut.CreateResetTokenAsync("user@example.com");
        Assert.True(created.Success);

        var reset = await sut.ResetPasswordAsync(created.Token!, "brand-new-password");

        Assert.True(reset.Success);
        Assert.Null(reset.Errors);

        db.Context.ChangeTracker.Clear();
        var updatedUser = await db.Context.Users.SingleAsync(u => u.Id == user.Id);
        Assert.True(BCrypt.Net.BCrypt.Verify("brand-new-password", updatedUser.Password));
        Assert.False(BCrypt.Net.BCrypt.Verify("old-password", updatedUser.Password));
        Assert.Empty(db.Context.PasswordResets);

        // Token was removed on use, so replaying it fails
        var replay = await sut.ResetPasswordAsync(created.Token!, "another-password");
        Assert.False(replay.Success);
        Assert.Equal("Invalid or expired token", replay.Errors!["token"]);
    }
}