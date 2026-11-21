using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/reviews")]
public class ReviewsController(AppDbContext db) : ControllerBase
{
    [HttpGet("{productId}")]
    public async Task<IActionResult> GetRatings(string productId)
    {
        var ratings = await db.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId)
            .Select(r => new { rating = r.Rating })
            .ToListAsync();

        return Ok(ratings);
    }

    [HttpGet("{productId}/mine")]
    public async Task<IActionResult> GetMine(string productId)
    {
        var email = Request.Headers["X-User-Email"].ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { error = "Not logged in" });

        var review = await db.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && r.User.Email == email)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new { rating = r.Rating })
            .FirstOrDefaultAsync();

        return review is null
            ? NotFound(new { error = "Review not found" })
            : Ok(review);
    }
}