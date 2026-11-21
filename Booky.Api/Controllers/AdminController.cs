using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/admin")]
public class AdminController(AdminService adminService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken ct = default)
    {
        var stats = await adminService.GetDashboardStatsAsync(ct);
        return Ok(stats);
    }

    [HttpDelete("orders/{id}")]
    public async Task<IActionResult> DeleteOrder(string id, CancellationToken ct = default)
    {
        var deleted = await adminService.DeleteOrderAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    [HttpGet("orders")]
    public async Task<IActionResult> Orders(CancellationToken ct = default)
    {
        var orders = await adminService.GetOrdersAsync(ct);
        return Ok(orders);
    }

    [HttpGet("products")]
    public async Task<IActionResult> Products(CancellationToken ct = default)
    {
        var items = await adminService.GetAdminProductsAsync(ct);
        return Ok(items);
    }

    [HttpGet("users")]
    public async Task<IActionResult> Users(CancellationToken ct = default)
    {
        var users = await adminService.GetAdminUsersAsync(ct);
        return Ok(users);
    }
}