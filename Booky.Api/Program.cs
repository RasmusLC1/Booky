using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("Data Source=booky.db"));
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddControllers();

var app = builder.Build();

app.Use(async (ctx, next) =>
{
    if (ctx.Request.Path.StartsWithSegments("/api"))
    {
        if (!ValidateAPI(ctx))
        {
            ctx.Response.StatusCode = 401;
            await ctx.Response.WriteAsJsonAsync(new { error = "Not logged in" });
            return;
        }
    }
    await next();
});

bool ValidateAPI(HttpContext context)
{
    var expected = app.Configuration["InternalApiKey"] ?? "";
    var given = context.Request.Headers["X-Internal-Key"].ToString();

    var expectedBytes = Encoding.UTF8.GetBytes(expected);
    var givenBytes = Encoding.UTF8.GetBytes(given);

    if (expectedBytes.Length == 0 || 
        givenBytes.Length != expectedBytes.Length || 
        !CryptographicOperations.FixedTimeEquals(givenBytes, expectedBytes))
    {
        Console.WriteLine($"[Auth Failed] Path: {context.Request.Path} | Given Key Length: {givenBytes.Length}");
        return false;
    }
    return true;
}

app.MapControllers();
app.Run();