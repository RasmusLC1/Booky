using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite("Data Source=booky.db"));
builder.Services.AddScoped<OrderService>();
builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();
app.Run();