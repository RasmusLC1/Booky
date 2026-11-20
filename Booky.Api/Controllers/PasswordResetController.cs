using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public record ValidateTokenRequest(string? Token);

[ApiController]
[Route("api/password-reset")]
public class PasswordResetController(AppDbContext db) : ControllerBase
{
    [HttpPost("validate")]
    public async Task<IActionResult> Validate(ValidateTokenRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { error = "Invalid or expired token" });

        var valid = await db.PasswordResets
            .AsNoTracking()
            .AnyAsync(p => p.Token == req.Token && p.ExpiresAt > DateTime.UtcNow);

        return valid
            ? Ok(new { message = "Token is valid" })
            : BadRequest(new { error = "Invalid or expired token" });
    }
}