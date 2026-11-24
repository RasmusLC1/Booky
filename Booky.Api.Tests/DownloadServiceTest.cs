public class DownloadServiceTests
{
    [Fact]
    public async Task CreateVerification_WithoutPurchase_IsForbidden()
    {
        using var db = new TestDb();
        db.Context.Products.Add(new Product { Id = "p1", Name = "Book" });
        db.Context.Users.Add(new User { Id = "u1", Email = "buyer@example.com", Username = "buyer", Password = "x" });
        await db.Context.SaveChangesAsync();

        var sut = new DownloadService(db.Context, null!);   // the HTTP factory isn't used by this method

        var result = await sut.CreateVerificationAsync("buyer@example.com", "p1");

        Assert.False(result.IsSuccess);
        Assert.Equal(403, result.StatusCode);
    }
}