using Microsoft.EntityFrameworkCore;

public sealed record SalesStatsDto(long TotalCents, int NumberOfSales);
public sealed record CustomerStatsDto(int UserCount, long TotalOrderCents);
public sealed record ProductStatsDto(int ActiveCount, int InactiveCount);

public class AdminService(AppDbContext db)
{
    public async Task<AdminDashboardDto> GetDashboardStatsAsync(CancellationToken ct = default)
    {
        var orderCount = await db.Orders.AsNoTracking().CountAsync(ct);
        var totalOrderCents = await db.Orders
            .AsNoTracking()
            .Select(o => (long?)o.PriceInCents)
            .SumAsync(ct) ?? 0L;

        var userCount = await db.Users.AsNoTracking().CountAsync(ct);

        var activeCount = await db.Products
            .AsNoTracking()
            .CountAsync(p => p.IsAvailableForPurchase, ct);

        var inactiveCount = await db.Products
            .AsNoTracking()
            .CountAsync(p => !p.IsAvailableForPurchase, ct);

        return new AdminDashboardDto(
            Sales: new SalesStatsDto(totalOrderCents, orderCount),
            Customers: new CustomerStatsDto(userCount, totalOrderCents),
            Products: new ProductStatsDto(activeCount, inactiveCount));
    }

    public async Task<bool> DeleteOrderAsync(string id, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(id))
            return false;

        var deletedRows = await db.Orders
            .Where(o => o.Id == id)
            .ExecuteDeleteAsync(ct);

        return deletedRows > 0;
    }

    public async Task<List<AdminOrderDto>> GetOrdersAsync(CancellationToken ct = default)
    {
        return await db.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new AdminOrderDto(
                o.Id,
                o.PriceInCents,
                o.Product.Name,
                o.User.Email))
            .ToListAsync(ct);
}

    public async Task<List<AdminProductDto>> GetAdminProductsAsync(CancellationToken ct = default)
    {
        return await db.Products
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new AdminProductDto(
                p.Id,
                p.Name,
                p.PriceInCents,
                p.IsAvailableForPurchase,
                p.FilePath,
                p.Orders.Count))
            .ToListAsync(ct);
    }

    public async Task<List<AdminUserDto>> GetAdminUsersAsync(CancellationToken ct = default)
    {
        return await db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserDto(
                u.Id,
                u.Email,
                u.Username,
                u.Orders.Count,
                u.Orders.Select(o => (long?)o.PriceInCents).Sum() ?? 0L))
            .ToListAsync(ct);
    }
}