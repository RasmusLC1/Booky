using Microsoft.AspNetCore.Mvc;

public record ValidateTokenRequest(string? Token);

[ApiController]
[Route("api/password-reset")]
public class PasswordResetController(PasswordResetService passwordResetService) : ControllerBase
{
    [HttpPost("validate")]
    public async Task<IActionResult> Validate(ValidateTokenRequest req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { error = "Invalid or expired token" });

        var result = await passwordResetService.ValidatePasswordResetAsync(req.Token, ct);

        return result.Success
            ? Ok(new { message = "Token is valid" })
            : BadRequest(new { error = "Invalid or expired token" });
    }

    public record RequestPasswordResetRequest(string? Email);

    [HttpPost("request")]
    public async Task<IActionResult> RequestReset(
        RequestPasswordResetRequest req,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { error = "Invalid email address" });

        var result = await passwordResetService.CreateResetTokenAsync(req.Email, ct);
        if (!result.Success)
            return NotFound(new { error = result.Error });

        return Ok(new
        {
            token = result.Token,
            user = new
            {
                id = result.UserId,
                email = result.Email,
                username = result.Username
            }
        });
    }
}