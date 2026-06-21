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

      // Rewrite redirects back to our domain.
      const loc = resp.headers.get("Location");
      if (loc) {
        const out = new Response(resp.body, resp);
        out.headers.set(
          "Location",
          loc.replace("https://woutvanhemelrijck.github.io", "https://whatareweevendoing.dev"),
        );
        return out;
      }

      // The app's HTML hard-codes the old capital-W "/Williamifier/" asset
      // path, which 404s after the repo was renamed to lowercase. Rewrite the
      // HTML to the lowercase path so its JS/WASM and relative assets (resolved
      // against <base href>) actually load.
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        const body = (await resp.text()).replaceAll(
          "woutvanhemelrijck.github.io/Williamifier/",
          "woutvanhemelrijck.github.io/williamifier/",
        );
        const outHeaders = new Headers(resp.headers);
        outHeaders.delete("content-length");
        outHeaders.delete("content-encoding");
        return new Response(body, {
          status: resp.status,
          statusText: resp.statusText,
          headers: outHeaders,
        });
      }

      return new Response(resp.body, resp);
    }

    // Everything else: serve the static site.
    return env.ASSETS.fetch(request);
  },
};
