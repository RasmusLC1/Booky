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
}