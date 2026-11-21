using Microsoft.EntityFrameworkCore;

public sealed record SalesStatsDto(long TotalCents, int NumberOfSales);
public sealed record CustomerStatsDto(int UserCount, long TotalOrderCents);
public sealed record ProductStatsDto(int ActiveCount, int InactiveCount);

public sealed record AdminDashboardDto(
    SalesStatsDto Sales,
    CustomerStatsDto Customers,
    ProductStatsDto Products);

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
}