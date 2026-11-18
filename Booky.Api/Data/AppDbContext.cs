using Microsoft.EntityFrameworkCore;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<DownloadVerification> DownloadVerifications => Set<DownloadVerification>();
    public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<User>().HasIndex(u => u.Username).IsUnique();
        b.Entity<PasswordReset>().HasIndex(p => p.Token).IsUnique();

        b.Entity<Order>().HasOne(o => o.User).WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Order>().HasOne(o => o.Product).WithMany(p => p.Orders)
            .HasForeignKey(o => o.ProductId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<Review>().HasOne(r => r.Product).WithMany(p => p.Reviews)
            .HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<Review>().HasOne(r => r.User).WithMany(u => u.Reviews)
            .HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<DownloadVerification>().HasOne(d => d.Product).WithMany(p => p.DownloadVerifications)
            .HasForeignKey(d => d.ProductId).OnDelete(DeleteBehavior.Cascade);

        // Prisma's default for a required relation is Restrict
        b.Entity<PasswordReset>().HasOne(p => p.User).WithMany(u => u.PasswordResets)
            .HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Restrict);
    }

    // Replaces Prisma's @updatedAt
    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        foreach (var e in ChangeTracker.Entries<ITimestamped>()
                     .Where(e => e.State == EntityState.Modified))
            e.Entity.UpdatedAt = DateTime.UtcNow;
        return base.SaveChangesAsync(ct);
    }
}