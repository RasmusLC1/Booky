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
}