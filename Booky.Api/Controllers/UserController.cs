// Controllers/UsersController.cs
using Microsoft.AspNetCore.Mvc;

public record LoginRequest(string? Email, string? Password);
public record EnsureUserRequest(string? Email, string? Name);
public record ResetPasswordRequest(string? Token, string? NewPassword);

[ApiController]
[Route("api/users")]
public class UsersController(UserService users) : ControllerBase
{
    [HttpPost("verify-login")]
    public async Task<IActionResult> VerifyLogin(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrEmpty(req.Password))
            return BadRequest(new { error = new { email = "Email is required" } });

        var result = await users.VerifyLoginAsync(req.Email, req.Password);
        return result.Success
            ? Ok(new { success = true })
            : Unauthorized(new { error = new Dictionary<string, string> { [result.Field!] = result.Error! } });
    }

    [HttpPost("ensure")]
    public async Task<IActionResult> Ensure(EnsureUserRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { error = "Email is required" });

        await users.EnsureUserAsync(req.Email, req.Name);
        return Ok(new { success = true });
    }

    public record RegisterRequest(string? Email, string? Username, string? Password);

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Username)
            || string.IsNullOrEmpty(req.Password) || req.Password.Length < 8)
            return BadRequest(new { error = new { email = "Invalid input" } });

        var result = await users.RegisterAsync(req.Email, req.Username, req.Password);
        return result.Success
            ? Ok(new { success = true })
            : Conflict(new { error = result.Errors });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Token) || string.IsNullOrEmpty(req.NewPassword))
        {
            return BadRequest(new { error = new { token = "Token and new password are required" } });
        }

        var result = await users.ResetPasswordAsync(req.Token, req.NewPassword, ct);
        return result.Success
            ? Ok(new { success = true, message = "Your password has been reset successfully!" })
            : BadRequest(new { error = result.Errors });
    }
}