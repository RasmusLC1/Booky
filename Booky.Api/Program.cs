using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Default") ?? "Data Source=booky.db";

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite(connectionString));
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<DownloadService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddSingleton<Validation>();


var app = builder.Build();

app.Use(async (ctx, next) =>
{
    if (ctx.Request.Path.StartsWithSegments("/api"))
    {
        var validation = ctx.RequestServices.GetRequiredService<Validation>();
        if (!validation.ValidateAPI(ctx))
        {
            ctx.Response.StatusCode = 401;
            await ctx.Response.WriteAsJsonAsync(new { error = "Not logged in" });
            return;
        }
    }
    await next();
});

app.MapControllers();
app.Run();

public partial class Program { } // Test access