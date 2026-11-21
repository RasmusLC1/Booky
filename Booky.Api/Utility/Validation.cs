using System.Security.Cryptography;
using System.Text;

public class Validation(IConfiguration configuration)
{
    public bool ValidateAPI(HttpContext context)
    {
        var expected = configuration["InternalApiKey"] ?? "";
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
}