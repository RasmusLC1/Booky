using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/products")]
public class ProductsController(ProductService products) : ControllerBase
{
    [HttpGet("popular")]
    public async Task<IActionResult> Popular([FromQuery] int take = 3, CancellationToken ct = default)
        => Ok(await products.GetPopularAsync(take, ct));

    [HttpGet("newest")]
    public async Task<IActionResult> Newest([FromQuery] int take = 3, CancellationToken ct = default)
        => Ok(await products.GetNewestAsync(take, ct));

    [HttpGet("specific")]
    public async Task<IActionResult> Specific([FromQuery] string id, CancellationToken ct = default)
    {
        var product = await products.GetByIdAsync(id, ct);
        if (product is null)
            return NotFound();

        return Ok(product);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id, CancellationToken ct = default)
    {
        var file = await products.GetDownloadAsync(id, ct);
        return file is null ? NotFound() : File(file.Bytes, file.ContentType, file.FileName);
    }
}