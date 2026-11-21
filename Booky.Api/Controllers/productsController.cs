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

    [HttpGet("all")]
    public async Task<IActionResult> All(CancellationToken ct = default)
        => Ok(await products.GetAllAsync(ct));

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id, CancellationToken ct = default)
    {
        var file = await products.GetDownloadAsync(id, ct);
        return file is null ? NotFound() : File(file.Bytes, file.ContentType, file.FileName);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateProductRequest req, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Author)
            || string.IsNullOrWhiteSpace(req.Description) || string.IsNullOrWhiteSpace(req.Category))
        {
            return BadRequest(new { error = "All product fields are required." });
        }

        var id = await products.CreateAsync(req, ct);
        return CreatedAtAction(nameof(Specific), new { id }, new { id });
    }

    public record SetAvailabilityRequest(bool IsAvailableForPurchase);

    [HttpPatch("{id}/availability")]
    public async Task<IActionResult> SetAvailability(
        string id,
        SetAvailabilityRequest req,
        CancellationToken ct = default)
    {
        var updated = await products.SetAvailabilityAsync(id, req.IsAvailableForPurchase, ct);
        return updated ? NoContent() : NotFound();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        UpdateProductRequest req,
        CancellationToken ct = default)
    {
        var updated = await products.UpdateAsync(id, req, ct);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct = default)
    {
        var deleted = await products.DeleteAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }
}