export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const raw = typeof req.query.url === "string" ? req.query.url : "";
  let target;

  try {
    target = new URL(raw);
  } catch {
    return res.status(400).json({ error: "Link produk tidak valid." });
  }

  const allowedHosts = new Set(["shopee.co.id", "www.shopee.co.id", "s.shopee.co.id"]);
  if (target.protocol !== "https:" || !allowedHosts.has(target.hostname)) {
    return res.status(400).json({ error: "Gunakan link HTTPS Shopee Indonesia." });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response;
    try {
      response = await fetch(target.toString(), {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
    } finally {
      clearTimeout(timeout);
    }

    const finalUrl = new URL(response.url || target.toString());
    if (!allowedHosts.has(finalUrl.hostname)) {
      return res.status(400).json({ error: "Link dialihkan ke domain di luar Shopee Indonesia." });
    }

    if (!response.ok) {
      return res.status(502).json({
        error: `Shopee menolak permintaan otomatis (HTTP ${response.status}). Coba URL gambar dari Inspect Element.`
      });
    }

    const html = await response.text();
    const found = [];
    const add = (value, source) => {
      if (typeof value !== "string" || !value.trim()) return;
      let valueClean = value.trim()
        .replace(/&amp;/g, "&")
        .replace(/&#x2F;/gi, "/")
        .replace(/\\u002F/gi, "/")
        .replace(/\\\//g, "/")
        .replace(/\\u0026/gi, "&");

      if (valueClean.startsWith("//")) valueClean = "https:" + valueClean;
      try {
        const u = new URL(valueClean);
        if (!["https:", "http:"].includes(u.protocol)) return;
        if (!/(^|\.)susercontent\.com$/i.test(u.hostname)) return;
        if (/logo|avatar|favicon|shop.?icon/i.test(u.pathname)) return;
        found.push({ url: u.toString(), source });
      } catch {}
    };

    // Parse HTML attributes independent of their order.
    const tags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of tags) {
      const attrs = {};
      for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
        attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
      }
      const key = (attrs.property || attrs.name || "").toLowerCase();
      if (["og:image", "og:image:url", "twitter:image"].includes(key)) {
        add(attrs.content, key);
      }
    }

    // Structured product metadata, when available.
    const jsonLdScripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
    const visit = value => {
      if (!value) return;
      if (Array.isArray(value)) return value.forEach(visit);
      if (typeof value !== "object") return;
      const image = value.image;
      if (typeof image === "string") add(image, "json-ld");
      else if (Array.isArray(image)) image.forEach(item => add(typeof item === "string" ? item : item?.url, "json-ld"));
      else if (image && typeof image === "object") add(image.url || image.contentUrl, "json-ld");
      Object.values(value).forEach(visit);
    };
    for (const script of jsonLdScripts) {
      const body = script.replace(/^.*?>/s, "").replace(/<\/script>$/i, "");
      try { visit(JSON.parse(body)); } catch {}
    }

    // Embedded CDN image references used by some Shopee page versions.
    const imageLike = html.match(/https?:\\?\/\\?\/[^"'\\\s<>]+/g) || [];
    for (const candidate of imageLike) {
      const decoded = candidate
        .replace(/\\\//g, "/")
        .replace(/\\u002F/gi, "/")
        .replace(/\\u0026/gi, "&")
        .replace(/&amp;/g, "&");
      add(decoded, "embedded-html");
    }

    const unique = [...new Map(found.map(item => [item.url, item])).values()];
    if (!unique.length) {
      return res.status(404).json({
        error: "URL gambar tidak ditemukan. Shopee mungkin membatasi akses otomatis atau halaman tidak menyertakan metadata gambar."
      });
    }

    return res.status(200).json({
      image: unique[0].url,
      alternatives: unique.slice(1, 5).map(item => item.url),
      source: unique[0].source
    });
  } catch (error) {
    const message = error?.name === "AbortError"
      ? "Permintaan ke Shopee melewati batas waktu."
      : "Tidak berhasil membaca halaman Shopee.";
    return res.status(502).json({ error: message });
  }
}
