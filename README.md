# shush-dance

Website for [SHUSH](https://shush.dance): combined **Next.js App Router** + **Payload 3** (admin at `/admin`), Stripe/PayPal shop and ticket flows.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Node **22+** and **pnpm 10** (see `package.json` `engines` / `packageManager`).

## Layout

```
src/
  app/
    (site)/          # Public site (App Router)
    (payload)/       # Payload admin + API
    _api/            # Local Payload data helpers
    _components/     # UI (CMSImage, listings, …)
    _utilities/      # Media URLs, site URL, …
  payload/
    collections/     # CMS collections
    hooks/           # e.g. generateBlurDataURL, revalidate
    fields/          # Shared field factories
    migrations/
scripts/             # One-off tasks (backfill blur, Slate→Lexical, …)
docs/
```

## Media LQIP

New uploads store `Media.blurDataURL`; use `pnpm backfill:blur` once on the server for existing files. See [docs/IMAGES_LQIP.md](docs/IMAGES_LQIP.md).

## Cache & performance

See [docs/PERFORMANCE_CACHE.md](docs/PERFORMANCE_CACHE.md) (tagged data cache, lean home queries, `/media` + `imageSizes`).

## Docs

- [PAYLOAD_V3_MIGRATION.md](docs/PAYLOAD_V3_MIGRATION.md)
- [docs/IMAGES_LQIP.md](docs/IMAGES_LQIP.md)
- [docs/PERFORMANCE_CACHE.md](docs/PERFORMANCE_CACHE.md)

Cross-project patterns: [ldz-kit](https://github.com/landozone/ldz-kit) React lane.