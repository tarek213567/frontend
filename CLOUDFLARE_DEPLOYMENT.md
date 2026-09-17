# NexoBD Cloudflare Deployment

## Cloudflare Pages

1. Open Cloudflare Dashboard > Workers & Pages.
2. Remove the old Worker route `nexobd.pro/*` from Workers > Routes.
3. Disconnect or delete the old Worker deployment after confirming no other routes depend on it.
4. Create a new Pages project from `tarek213567/frontend`.
5. Select branch `main`.
6. Use these build settings:
   - Framework preset: Next.js
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Node version: `20` or newer
7. Add these production environment variables under Settings > Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
8. Deploy and review the Pages deployment logs.

## Custom Domain

1. Open the Pages project > Custom domains.
2. Add `nexobd.pro`.
3. Remove the old Worker custom-domain route before accepting the Pages domain assignment.
4. Keep DNS proxied through Cloudflare when prompted.
5. Wait for the certificate to become active.

## Verification

```powershell
Invoke-WebRequest https://nexobd.pro -UseBasicParsing
Resolve-DnsName nexobd.pro -Type A
```

Verify manually:

- `https://nexobd.pro` returns the NexoBD homepage.
- HTTPS certificate is active and valid.
- HTTP redirects to HTTPS once configured in SSL/TLS > Edge Certificates.
- `/products/nxd-001` loads a product detail page.
- `/cart`, `/checkout`, `/login`, and `/admin/login` load.
- Unknown routes show the Next.js 404 page.
- No old Worker response or redirect remains.

## Supabase

Run `supabase/schema.sql` in the target Supabase SQL editor before deploying. Create the `product-images` bucket and verify its public read policy or replace public URLs with signed URLs before production use.

Never commit `.env.local`. Use `.env.example` as the variable-name template only.
