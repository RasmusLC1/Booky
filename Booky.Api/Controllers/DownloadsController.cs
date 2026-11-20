using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public record CreateVerificationRequest(string? ProductId);

[ApiController]
[Route("api/downloads")]
public class DownloadsController(AppDbContext db) : ControllerBase
{
    [HttpPost("verification")]
    public async Task<IActionResult> Create(CreateVerificationRequest req)
    {
        var email = Request.Headers["X-User-Email"].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { error = "Not logged in" });

        if (string.IsNullOrWhiteSpace(req.ProductId))
            return BadRequest(new { error = "Product ID is required" });

        var owns = await db.Orders.AnyAsync(o =>
            o.ProductId == req.ProductId && o.User.Email == email);
        if (!owns)
            return StatusCode(StatusCodes.Status403Forbidden,
                new { error = "You have not purchased this product" });

        var verification = new DownloadVerification
        {
            ProductId = req.ProductId,
            ExpiresAt = DateTime.UtcNow.AddDays(1)
        };
        db.DownloadVerifications.Add(verification);
        await db.SaveChangesAsync();

        return Ok(new { id = verification.Id });
    }
}