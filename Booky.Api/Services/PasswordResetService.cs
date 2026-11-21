using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;

public record ResetPasswordResult(bool Success, Dictionary<string, string>? Errors = null);

public class PasswordResetService(AppDbContext db)
{
    public async Task<ResetPasswordResult> ValidatePasswordResetAsync(
        string token,
        CancellationToken ct = default)
    {
        var valid = await db.PasswordResets
            .AsNoTracking()
            .AnyAsync(p => p.Token == token && p.ExpiresAt > DateTime.UtcNow, ct);

        if (!valid)
        {
            return new(false, new Dictionary<string, string>
            {
                ["token"] = "Invalid or expired token"
            });
        }

        return new(true);
    }

    public sealed record CreatePasswordResetTokenResult(
        bool Success,
        string? Token = null,
        string? UserId = null,
        string? Email = null,
        string? Username = null,
        string? Error = null
    );


    public async Task<ResetPasswordResult> ResetPasswordAsync(
        string token,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var errors = new Dictionary<string, string>();

        var resetRecord = await db.PasswordResets
            .FirstOrDefaultAsync(r => r.Token == token, cancellationToken);

        if (resetRecord is null || resetRecord.ExpiresAt <= DateTime.UtcNow)
        {
            errors["token"] = "Invalid or expired token";
            return new(false, errors);
        }

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == resetRecord.UserId, cancellationToken);

        if (user is null)
        {
            errors["user"] = "User not found.";
            return new(false, errors);
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);

        user.Password = hashedPassword;
        db.PasswordResets.Remove(resetRecord);

        await db.SaveChangesAsync(cancellationToken);
        await tx.CommitAsync(cancellationToken);

        return new(true);
    }


    public async Task<CreatePasswordResetTokenResult> CreateResetTokenAsync(
        string email,
        CancellationToken ct = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(normalizedEmail))
            return new(false, Error: "Invalid email address");

        var user = await db.Users
            .AsNoTracking()
            .Where(u => u.Email == normalizedEmail)
            .Select(u => new { u.Id, u.Email, u.Username })
            .FirstOrDefaultAsync(ct);

        if (user is null)
            return new(false, Error: "No account found with this email");

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var expiresAt = DateTime.UtcNow.AddMinutes(10);

        var resetRecord = new PasswordReset
        {
            UserId = user.Id,
            Token = token,
            ExpiresAt = expiresAt
        };

        db.PasswordResets.Add(resetRecord);
        await db.SaveChangesAsync(ct);

        return new(
            true,
            Token: token,
            UserId: user.Id,
            Email: user.Email,
            Username: user.Username);
    }
}