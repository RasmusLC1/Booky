using Microsoft.AspNetCore.Mvc;

public record ValidateTokenRequest(string? Token);

[ApiController]
[Route("api/password-reset")]
public class PasswordResetController(PasswordResetService passwordReset) : ControllerBase
{
    [HttpPost("validate")]
    public async Task<IActionResult> Validate(ValidateTokenRequest req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { error = "Invalid or expired token" });

        var result = await passwordReset.ValidatePasswordResetAsync(req.Token, ct);

        return result.Success
            ? Ok(new { message = "Token is valid" })
            : BadRequest(new { error = "Invalid or expired token" });
    }
}