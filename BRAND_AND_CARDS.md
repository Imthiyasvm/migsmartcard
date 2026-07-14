# Multi-cards, photo upload & branding

## Card limits by plan

| Plan | Max cards |
|------|-----------|
| Free | **1** |
| Pro | **5** |
| Business | **25** |
| Enterprise | **999** (unlimited for practical use) |

In **Dashboard → My Card**:
- Switch between cards
- **New Card** (blocked at plan limit → upgrade CTA)
- Set primary / delete (must keep ≥ 1)
- Each card has its own slug `/p/your-slug`

## Photo & cover upload

**My Card → Photos** tab:
- Upload profile photo (square)
- Upload cover image (wide)
- Or paste image URLs

Accepted: JPG, PNG, **WebP**, GIF · max 4MB

- **Local / disk:** saved under `/public/uploads/`
- **Vercel:** stored as inline data URL (works without S3; for scale use Cloudinary)

API: `POST /api/upload` (multipart `file` + `kind=photo|cover`)

## Your brand logo (WebP)

Your file is installed as:

```text
public/brand/logo.webp
```

Used by the site `Logo` component (navbar, etc.).

Also included:

```text
public/brand/logo.svg   ← lightweight SVG alternative
```

### How to add / replace an SVG logo

Chat uploads often block `.svg`. Options:

1. **In the repo (best)**  
   Put the file at:
   ```text
   public/brand/logo.svg
   ```
   Then in `src/components/logo.tsx` point `Image`/`img` to `/brand/logo.svg`.

2. **Paste SVG source**  
   Open your SVG in a text editor, copy the XML, send it in chat — we can write `public/brand/logo.svg` for you.

3. **Convert WebP → SVG**  
   True SVG needs vectors. For a pixel logo, keep **WebP/PNG**.  
   For a real SVG: export from Figma/Illustrator as SVG, or use a tracer (Vectorizer, Adobe Trace) carefully.

4. **Use both**  
   - `logo.svg` for crisp UI / email  
   - `logo.webp` for exact brand raster  

### Dark backgrounds

Your WebP has a black background + blue wordmark. On light UI it may need a light container or a transparent export. Prefer a **transparent PNG/WebP** or SVG for best navbar results.

## Deploy

```bash
cd ~/migsmartcard
# update files from latest zip
git add .
git commit -m "Multi-cards by plan, photo upload, brand logo"
git push origin main
```

Then hard-refresh https://smartcard.migbiz.com
