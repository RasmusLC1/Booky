using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public record ProductDto(
    string Id, string Name, string Author, int PriceInCents, string ImagePath,
    string Description, string Category, int Length, bool IsAvailableForPurchase,
    DateTime CreatedAt);

[ApiController]
[Route("api/products")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    private static readonly Expression<Func<Product, ProductDto>> ToDto = p =>
        new ProductDto(p.Id, p.Name, p.Author, p.PriceInCents, p.ImagePath,
                       p.Description, p.Category, p.Length, p.IsAvailableForPurchase,
                       p.CreatedAt);

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
}