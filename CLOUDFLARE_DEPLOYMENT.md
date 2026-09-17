# NexoBD Cloudflare Workers Deployment

## Local verification

```powershell
npm install
npm run build
npm run build:vinext
npx wrangler deploy --config dist/server/wrangler.json --dry-run
```

The Worker name is `nexobd`. Vinext emits the Worker bundle under `dist/server` and static assets under `dist/client`.

## Required environment variables

Add these in Cloudflare Workers > Settings > Variables and Secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Do not commit `.env.local` or secret values. `.env.example` contains names only.

## Deploy a new Worker first

1. Authenticate Wrangler locally with `npx wrangler login`, or use a configured Cloudflare API token.
2. Run `npm run build:vinext`.
3. Deploy the new Worker without any `nexobd.pro` route:

   ```powershell
   npx @vinext/cloudflare deploy --config dist/server/wrangler.json
   ```

4. Open the generated `https://nexobd.<account-subdomain>.workers.dev` URL.
5. Verify `/`, `/products/nxd-001`, `/cart`, `/checkout`, `/admin/login`, static product images, and the 404 page.
6. Do not delete or change the old Worker until this workers.dev deployment is verified.

## Move `nexobd.pro` safely

After the new Worker is verified:

1. Open Cloudflare Dashboard > Workers & Pages > the new `nexobd` Worker.
2. Add `nexobd.pro` under Settings > Domains & Routes as a custom domain.
3. Remove the old Worker route `nexobd.pro/*` only after the new custom-domain binding is active.
4. Confirm the old Worker has no remaining custom-domain binding or route for `nexobd.pro`.
5. Keep DNS managed by Cloudflare and verify the certificate is active.
6. Enable or confirm SSL/TLS mode is `Full (strict)` where the origin setup supports it.
7. Test HTTPS, redirects, assets, product routes, cart, checkout, admin login, and an unknown URL.
8. Retire the old Worker only after the new domain has passed all checks.

## Verification commands

```powershell
Invoke-WebRequest https://nexobd.pro -UseBasicParsing
Resolve-DnsName nexobd.pro -Type A
```

Expected result: HTTPS returns `200`, DNS resolves through Cloudflare, no old Worker response remains, and HTTP redirects to HTTPS without loops.

## Supabase

Run `supabase/schema.sql` in the target Supabase SQL editor before production use. Confirm the `product-images` bucket and its read policy are configured for the image URLs used by the application.
