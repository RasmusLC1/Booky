using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
public sealed record CreateProductRequest(
    string Name,
    string Author,
    string Description,
    string Category,
    int PriceInCents,
    string FilePath,
    string ImagePath
    );

public sealed record UpdateProductRequest(
    string Name,
    string Author,
    string Description,
    string Category,
    int PriceInCents,
    string? FilePath,
    string? ImagePath
);

public class ProductService(AppDbContext db, IHttpClientFactory httpClientFactory)
{
    private static readonly Expression<Func<Product, ProductDto>> ToDto = p => new ProductDto
    {
        Id = p.Id,
        Name = p.Name,
        Author = p.Author,
        PriceInCents = p.PriceInCents,
        FilePath = p.FilePath,
        ImagePath = p.ImagePath,
        Description = p.Description,
        Category = p.Category,
        Length = p.Length,
        IsAvailableForPurchase = p.IsAvailableForPurchase,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    public async Task<List<ProductDto>> GetPopularAsync(int take = 3, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);
        return await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderByDescending(p => p.Orders.Count)
            .ThenByDescending(p => p.CreatedAt)
            .Take(take)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public async Task<List<ProductDto>> GetNewestAsync(int take = 3, CancellationToken ct = default)
    {
        take = Math.Clamp(take, 1, 50);
        return await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public Task<ProductDto?> GetByIdAsync(string id, CancellationToken ct = default)
    {
        return db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(ToDto)
            .FirstOrDefaultAsync(ct);
    }

    public async Task<List<ProductDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Products
            .AsNoTracking()
            .Where(p => p.IsAvailableForPurchase)
            .OrderBy(p => p.Name)
            .Select(ToDto)
            .ToListAsync(ct);
    }

    public async Task<DownloadPayload?> GetDownloadAsync(string id, CancellationToken ct = default)
    {
        var product = await db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new { p.Name, p.FilePath })
            .FirstOrDefaultAsync(ct);

        if (product is null || string.IsNullOrWhiteSpace(product.FilePath))
            return null;

        var client = httpClientFactory.CreateClient();
        using var response = await client.GetAsync(
            product.FilePath,
            HttpCompletionOption.ResponseHeadersRead,
            ct);

        if (!response.IsSuccessStatusCode)
            return null;

        var bytes = await response.Content.ReadAsByteArrayAsync(ct);
        var contentType = response.Content.Headers.ContentType?.ToString()
            ?? "application/octet-stream";
        var ext = Path.GetExtension(new Uri(product.FilePath).AbsolutePath);

        return new DownloadPayload
        {
            Bytes = bytes,
            ContentType = contentType,
            FileName = $"{product.Name}{ext}"
        };
    }
    public async Task<string> CreateAsync(CreateProductRequest req, CancellationToken ct = default)
    {
        var product = new Product
        {
            Id = Guid.NewGuid().ToString(),
            IsAvailableForPurchase = false,
            Name = req.Name.Trim(),
            Author = req.Author.Trim(),
            Description = req.Description.Trim(),
            Category = req.Category.Trim(),
            PriceInCents = req.PriceInCents,
            FilePath = req.FilePath,
            ImagePath = req.ImagePath,
            Length = 0
        };

        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return product.Id;
    }

    public async Task<bool> SetAvailabilityAsync(
        string id,
        bool isAvailableForPurchase,
        CancellationToken ct = default)
    {
        var updated = await db.Products
            .Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.IsAvailableForPurchase, isAvailableForPurchase), ct);

        return updated > 0;
    }

    public async Task<bool> DeleteAsync(string id, CancellationToken ct = default)
    {
        var deleted = await db.Products
            .Where(p => p.Id == id)
            .ExecuteDeleteAsync(ct);

        return deleted > 0;
    }

    public async Task<bool> UpdateAsync(
        string id,
        UpdateProductRequest req,
        CancellationToken ct = default)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (product is null)
            return false;

        product.Name = req.Name.Trim();
        product.Author = req.Author.Trim();
        product.Description = req.Description.Trim();
        product.Category = req.Category.Trim();
        product.PriceInCents = req.PriceInCents;

        if (!string.IsNullOrWhiteSpace(req.FilePath))
            product.FilePath = req.FilePath;

        if (!string.IsNullOrWhiteSpace(req.ImagePath))
            product.ImagePath = req.ImagePath;

        await db.SaveChangesAsync(ct);
        return true;
    }
}