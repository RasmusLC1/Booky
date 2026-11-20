using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("Data Source=booky.db"));
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<UserService>();
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