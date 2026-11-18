using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;

public record LoginResult(bool Success, string? Field = null, string? Error = null);

public class UserService(AppDbContext db)
{
    public async Task<LoginResult> VerifyLoginAsync(string email, string password)
    {
        email = email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(u => u.Email == email);

        if (user is null)
            return new(false, "email", "Email does not exist");
        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
            return new(false, "password", "Invalid password");

        return new(true);
    }

    public async Task EnsureUserAsync(string email, string? name)
    {
        email = email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email)) return;

        // Username is unique, so fall back to the email prefix and add a suffix on collision
        var baseName = string.IsNullOrWhiteSpace(name) ? email.Split('@')[0] : name.Trim();
        var username = baseName;
        while (await db.Users.AnyAsync(u => u.Username == username))
            username = $"{baseName}{Random.Shared.Next(1000, 9999)}";

        var randomPassword = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));

        db.Users.Add(new User
        {
            Email = email,
            Username = username,
            Password = BCrypt.Net.BCrypt.HashPassword(randomPassword, 12)
        });
        await db.SaveChangesAsync();
    }

    public record RegisterResult(bool Success, Dictionary<string, string>? Errors = null);

    public async Task<RegisterResult> RegisterAsync(string email, string username, string password)
    {
        email = email.Trim().ToLowerInvariant();
        username = username.Trim().ToLowerInvariant();

        var errors = new Dictionary<string, string>();
        if (await db.Users.AnyAsync(u => u.Email == email))
            errors["email"] = "Email is already in use";
        if (await db.Users.AnyAsync(u => u.Username == username))
            errors["username"] = "Username is already in use";
        if (errors.Count > 0)
            return new(false, errors);

        db.Users.Add(new User
        {
            Email = email,
            Username = username,
            Password = BCrypt.Net.BCrypt.HashPassword(password, 12)
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException) // two signups racing past the checks; the unique index catches it
        {
            return new(false, new() { ["email"] = "Email or username is already in use" });
        }

        return new(true);
    }
}