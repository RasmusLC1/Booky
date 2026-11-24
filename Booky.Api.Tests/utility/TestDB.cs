// TestDb.cs
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");
    public AppDbContext Context { get; }

    public TestDb()
    {
        _connection.Open();   // the in-memory database lives as long as this connection
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        Context = new AppDbContext(options);
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}