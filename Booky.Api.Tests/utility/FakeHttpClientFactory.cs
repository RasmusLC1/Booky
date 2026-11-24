using System.Net;
using System.Net.Http.Headers;
using System.Text;

public sealed class FakeHttpClientFactory(Func<HttpRequestMessage, HttpResponseMessage> handler) : IHttpClientFactory
{
    public HttpClient CreateClient(string name = "") => new(new StubHandler(handler));

    public static HttpResponseMessage OkBytes(
        string content,
        string fileName = "book.epub",
        string mediaType = "application/epub+zip")
    {
        var res = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new ByteArrayContent(Encoding.UTF8.GetBytes(content))
        };
        res.Content.Headers.ContentType = new MediaTypeHeaderValue(mediaType);
        res.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
        {
            FileName = fileName
        };
        return res;
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> fn) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            Task.FromResult(fn(request));
    }
}