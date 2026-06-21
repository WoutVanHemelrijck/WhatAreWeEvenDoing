export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const upstream = new URL(url.pathname + url.search, "https://woutvanhemelrijck.github.io");
  const resp = await fetch(upstream, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "manual",
  });
  const out = new Response(resp.body, resp);
  const loc = out.headers.get("Location");
  if (loc) {
    out.headers.set(
      "Location",
      loc.replace("https://woutvanhemelrijck.github.io", "https://whatareweevendoing.dev"),
    );
  }
  return out;
}
