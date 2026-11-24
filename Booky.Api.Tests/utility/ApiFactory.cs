// ApiFactory.cs
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

public class ApiFactory : WebApplicationFactory<Program>
{
    public const string Key = "test-key";
    private readonly string _db = $"Data Source=test-{Guid.NewGuid():N};Mode=Memory;Cache=Shared";
    private SqliteConnection? _keepAlive;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");   // skips user-secrets and development-only code
        builder.UseSetting("InternalApiKey", Key);
        builder.UseSetting("ConnectionStrings:Default", _db);

        _keepAlive = new SqliteConnection(_db);   // keeps the shared in-memory database alive
        _keepAlive.Open();
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
        return host;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        _keepAlive?.Dispose();
    }
}