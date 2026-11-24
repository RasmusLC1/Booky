using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

public class ApiFactory : WebApplicationFactory<Program>
{
    public const string Key = "test-key";
    private readonly string _db = $"Data Source=test-{Guid.NewGuid():N};Mode=Memory;Cache=Shared";
    private readonly object _schemaLock = new();
    private bool _schemaCreated;
    private SqliteConnection? _keepAlive;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("InternalApiKey", Key);
        builder.UseSetting("ConnectionStrings:Default", _db);

        lock (_schemaLock)
        {
            if (_keepAlive is null)
            {
                _keepAlive = new SqliteConnection(_db);
                _keepAlive.Open();
            }
        }
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        lock (_schemaLock)
        {
            if (!_schemaCreated)
            {
                using var scope = host.Services.CreateScope();
                scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.EnsureCreated();
                _schemaCreated = true;
            }
        }

        return host;
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _keepAlive?.Dispose();
            _keepAlive = null;
        }

        base.Dispose(disposing);
    }
}