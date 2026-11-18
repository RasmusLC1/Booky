using Microsoft.AspNetCore.Mvc;

public record CreateOrderRequest(string? ProductId);

[ApiController]
[Route("api/orders")]
public class OrdersController(OrderService orders, IConfiguration config) : ControllerBase
{
    [HttpPost("create")]
    public async Task<IActionResult> Create(CreateOrderRequest request)
    {
        var key = Request.Headers["X-Internal-Key"].ToString();
        var email = Request.Headers["X-User-Email"].ToString();

        if (key != config["InternalApiKey"] || string.IsNullOrEmpty(email))
            return Unauthorized(new { error = "Not logged in" });

        var result = await orders.CreateOrderAsync(email, request.ProductId);

        if (!result.Success)
            return StatusCode(result.StatusCode, new { error = result.Error });

        var o = result.Order!;
        return Ok(new
        {
            message = "Order added successfully!",
            order = new { o.Id, o.ProductId, o.UserId, o.PriceInCents }
        });
    }
}