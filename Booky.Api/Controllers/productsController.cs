using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;

public record ProductDto(
    string Id, string Name, string Author, int PriceInCents, string ImagePath,
    string Description, string Category, int Length, bool IsAvailableForPurchase,
    DateTime CreatedAt, DateTime UpdatedAt);

[ApiController]
[Route("api/products")]
public class ProductsController(AppDbContext db, IHttpClientFactory httpClientFactory) : ControllerBase
{
    private static readonly Expression<Func<Product, ProductDto>> ToDto = p =>
    new ProductDto(p.Id, p.Name, p.Author, p.PriceInCents, p.ImagePath,
                   p.Description, p.Category, p.Length, p.IsAvailableForPurchase,
                   p.CreatedAt, p.UpdatedAt);

    [HttpGet("popular")]
    public async Task<IActionResult> Popular([FromQuery] int take = 3)
    {
        take = Math.Clamp(take, 1, 50);
        var products = await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderByDescending(p => p.Orders.Count)
            .ThenByDescending(p => p.CreatedAt) // deterministic when counts tie
            .Take(take)
            .Select(ToDto)
            .ToListAsync();
        return Ok(products);
    }

    [HttpGet("newest")]
    public async Task<IActionResult> Newest([FromQuery] int take = 3)
    {
        take = Math.Clamp(take, 1, 50);
        var products = await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .Select(ToDto)
            .ToListAsync();
        return Ok(products);
    }

    [HttpGet("specific")]
    public async Task<IActionResult> Specific([FromQuery] string id)
    {
        var product = await FindProductAsync(id);

        if (product is null)
        {
            return NotFound();
        }
        return Ok(product);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(string id, CancellationToken cancellationToken)
    {
        var product = await FindProductAsync(id, cancellationToken);
        if (product is null || string.IsNullOrWhiteSpace(product.FilePath))
            return NotFound();

        using var response = await httpClientFactory.CreateClient()
            .GetAsync(product.FilePath, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        if (!response.IsSuccessStatusCode)
            return NotFound();

        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";
        var ext = Path.GetExtension(new Uri(product.FilePath).AbsolutePath);

        return File(bytes, contentType, $"{product.Name}{ext}");
    }

    private Task<Product?> FindProductAsync(string id, CancellationToken cancellationToken = default)
    {
        return db.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }
}

