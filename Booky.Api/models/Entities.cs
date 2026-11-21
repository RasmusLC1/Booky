public interface ITimestamped { DateTime UpdatedAt { get; set; } }

public class Product : ITimestamped
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Author { get; set; } = "";
    public int PriceInCents { get; set; }
    public string FilePath { get; set; } = "";
    public string ImagePath { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public int Length { get; set; }
    public bool IsAvailableForPurchase { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Review> Reviews { get; set; } = [];
    public List<Order> Orders { get; set; } = [];
    public List<DownloadVerification> DownloadVerifications { get; set; } = [];
}

public sealed record ProductDto
{
    public required string Id { get; init; }
    public required string Name { get; init; }
    public required string Author { get; init; }
    public required int PriceInCents { get; init; }
    public required string FilePath { get; init; }
    public required string ImagePath { get; init; }
    public required string Description { get; init; }
    public required string Category { get; init; }
    public required int Length { get; init; }
    public required bool IsAvailableForPurchase { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
}


public class User : ITimestamped
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = "";
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";   // hash, never plaintext
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Order> Orders { get; set; } = [];
    public List<PasswordReset> PasswordResets { get; set; } = [];
    public List<Review> Reviews { get; set; } = [];
}

public class UserDto
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";
    public string Username { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class Order : ITimestamped
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int PriceInCents { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public string UserId { get; set; } = "";
    public string ProductId { get; set; } = "";
    public User User { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public class Review : ITimestamped
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProductId { get; set; } = "";
    public string UserId { get; set; } = "";
    public string? Headline { get; set; }
    public string? Text { get; set; }
    public int Rating { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class DownloadVerification
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string ProductId { get; set; } = "";
    public Product Product { get; set; } = null!;
}

public class PasswordReset
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = "";
    public string Token { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public User User { get; set; } = null!;
}

public class DownloadPayload
{
    public byte[] Bytes { get; set; } = [];
    public string ContentType { get; set; } = "application/octet-stream";
    public string FileName { get; set; } = "";
}