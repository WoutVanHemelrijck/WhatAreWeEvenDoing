export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Bare /williamifier -> redirect to the trailing-slash form.
    if (url.pathname === "/williamifier") {
      return Response.redirect("https://whatareweevendoing.dev/williamifier/", 301);
    }

    // Proxy /williamifier/* to the GitHub Pages app.
    if (url.pathname.startsWith("/williamifier/")) {
      const upstream = new URL(url.pathname + url.search, "https://woutvanhemelrijck.github.io");

      // Drop the Host header so fetch sets it to the upstream host; GitHub
      // Pages serves 404 if it sees the wrong Host.
      const headers = new Headers(request.headers);
      headers.delete("host");

      const hasBody = request.method !== "GET" && request.method !== "HEAD";
      const resp = await fetch(upstream.toString(), {
        method: request.method,
        headers,
        body: hasBody ? request.body : undefined,
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

    // Everything else: serve the static site.
    return env.ASSETS.fetch(request);
  },
};
