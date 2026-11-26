# CMS image LQIP (`blurDataURL`)

New uploads get `Media.blurDataURL` via the `generateBlurDataURL` `beforeChange` hook. The frontend uses `CMSImage` + `next/image` `placeholder="blur"`.

Public image URLs use `/media/<filename>` (and `thumb` / `card` sizes). See [PERFORMANCE_CACHE.md](PERFORMANCE_CACHE.md).

## Backfill existing media (one-off)

Run on the server that has MongoDB and media files (production: `MEDIA_DIR` → `/home/lando/shush/media`):

```bash
cd /path/to/shush-dance
pnpm install
pnpm backfill:blur
# or: MEDIA_DIR=/home/lando/shush/media pnpm backfill:blur
```

Deploy order: ship schema + hook → run backfill → verify a listing page.

See ldz-kit: `react/docs/images/blur-lqip-plaiceholder.md`.