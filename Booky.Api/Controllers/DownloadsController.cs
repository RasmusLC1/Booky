using Microsoft.AspNetCore.Mvc;

public record CreateVerificationRequest(string? ProductId);
public record OrderHistoryRequest(string? Email);

[ApiController]
[Route("api/downloads")]
public class DownloadsController(DownloadService downloadService) : ControllerBase
{
    private IActionResult ToErrorResponse<T>(ServiceResult<T> result) =>
        StatusCode(result.StatusCode, new { error = result.Error });

    [HttpPost("verification")]
    public async Task<IActionResult> Create(CreateVerificationRequest req, CancellationToken ct = default)
    {
        var email = Request.Headers["X-User-Email"].ToString();
        var result = await downloadService.CreateVerificationAsync(email, req.ProductId, ct);
        return result.IsSuccess
            ? Ok(new { id = result.Value })
            : ToErrorResponse(result);
    }

    [HttpPost("order-history")]
    public async Task<IActionResult> OrderHistory(OrderHistoryRequest req, CancellationToken ct = default)
    {
        var result = await downloadService.GetOrderHistoryAsync(req.Email, ct);
        return result.IsSuccess
            ? Ok(result.Value)
            : ToErrorResponse(result);
    }

    [HttpGet("my-orders")]
    public async Task<IActionResult> MyOrders(CancellationToken ct = default)
    {
        var email = Request.Headers["X-User-Email"].ToString();
        var result = await downloadService.GetMyOrdersAsync(email, ct);
        return result.IsSuccess
            ? Ok(result.Value)
            : ToErrorResponse(result);
    }

    [HttpGet("{verificationId}")]
    public async Task<IActionResult> Download(string verificationId, CancellationToken ct = default)
    {
        var payload = await downloadService.GetDownloadFileAsync(verificationId, ct);
        if (payload is null)
            return NotFound();

        HttpContext.Response.RegisterForDispose(payload);
        return File(payload.Stream, payload.ContentType, payload.FileName);
    }

    [HttpGet("exists")]
    public async Task<IActionResult> Exists(
        [FromQuery] string? email,
        [FromQuery] string? productId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(productId))
            return BadRequest(new { error = "Email and productId are required" });

        var exists = await downloadService.HasOrderAsync(email, productId, ct);
        return Ok(new { exists });
    }
}