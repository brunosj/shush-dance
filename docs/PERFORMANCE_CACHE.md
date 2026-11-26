# Performance & cache

## HTML / data cache

Marketing pages use Next `unstable_cache` around Local Payload queries (production only). Tags:

| Tag | Source |
|-----|--------|
| `pages`, `pages:<slug>` | Pages |
| `events` | Events |
| `releases` | Releases |
| `merch` | Merch |
| `socials` | Socials global |
| `sitemap` | `sitemap.ts` |

Draft preview skips the cache. Dev (`NODE_ENV=development`) always hits Mongo.

CMS `afterChange` hooks call `revalidateTag` / `revalidatePath` in-process.

- A **page** publish refreshes that page and the sitemap.
- **Events, releases, merch, media, and socials** refresh every public page (`revalidatePath('/', 'layout')`) and the shared `site` data-cache tag.

Upcoming events also expire hourly and use a daily cache key, so a past event drops off without an edit.

Manual: `GET /next/revalidate?secret=…&collection=events` (or `tag=site` / `revalidatePath=/`).

Home loads upcoming events only + latest release/merch (`limit: 1`).

## Images

- Media `imageSizes`: `thumb` (400w), `card` (800w)
- Public URLs: `/media/<filename>` (Caddy file_server)
- Listings use thumb/card; lightbox uses the original
- Next Image optimizer stays **off** (`images.unoptimized: true`)

Existing uploads:

```bash
pnpm backfill:image-sizes --dry-run
pnpm backfill:image-sizes
```

## Caddy

Serve shared media with long cache headers, e.g.:

```caddy
handle_path /media/* {
  root * /home/lando/shush/media
  header Cache-Control "public, max-age=31536000, immutable"
  file_server
}
```

Keep `/api/media/file/*` for Payload admin uploads.
