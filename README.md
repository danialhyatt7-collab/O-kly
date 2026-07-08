# Oakly Modern Furnica

High-converting landing page for **Oakly Modern Furnica** — premium modern furniture.

- **Live 3D hero** built with Three.js (vendored in `vendor/three.module.js`, no CDN needed): a handcrafted chair scene with mouse parallax, floating accents and wood-dust particles
- **WhatsApp-first conversion**: every CTA deep-links to [+92 300 5926262](https://wa.me/923005926262) with pre-filled messages, plus a floating chat button
- **Instagram catalog**: product cards link to [@oakly_furnica](https://www.instagram.com/oakly_furnica/)
- Single self-contained `index.html` — no build step, no framework

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

(A local server is needed because the Three.js ES module won't load over `file://`.)

## Deploy

Works on any static host — GitHub Pages, Netlify, Vercel, Cloudflare Pages. Just serve the repo root.
