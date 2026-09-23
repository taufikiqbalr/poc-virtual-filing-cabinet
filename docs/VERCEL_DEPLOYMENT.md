# Vercel Deployment

Virtual Filing Cabinet is a Next.js application located in `apps/web`. No environment variables, database, or external server are required for the current PoC.

## Recommended: Vercel Git Integration

1. Open Vercel and choose **Add New → Project**.
2. Import the GitHub repository:
   `taufikiqbalr/poc-virtual-filing-cabinet`
3. Set **Root Directory** to:
   `apps/web`
4. Framework Preset should be detected as **Next.js**.
5. Keep these defaults:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: framework default
6. No environment variables are required.
7. Click **Deploy**.

Every subsequent push to `main` will create a production deployment when Git integration is enabled. Pull requests and non-production branches can generate preview deployments.

## CLI Deployment

From repository root:

```bash
npm run deploy:vercel
```

For production:

```bash
npm run deploy:vercel:prod
```

The scripts deploy `apps/web` directly using Vercel CLI's `--cwd` option.

For first-time CLI use:

```bash
npx vercel login
npm run deploy:vercel
```

## One-click Deploy Button

The repository README includes a **Deploy with Vercel** button that targets the Next.js subdirectory directly:

`apps/web`

This avoids deploying the repository root as a non-Next.js project.

## Runtime Notes

- The current PoC is client-side and uses browser `localStorage`.
- The requirement registry is bundled from `apps/web/data/requirements.json`.
- Uploaded file binaries are not persisted in this PoC; only browser-side metadata is used.
- The official OSS logo is loaded from the existing OSS media URL.
- Local Docker development remains available at `http://localhost:3410`.
- Vercel does not use port 3410 in production; Vercel manages the public HTTP endpoint automatically.

## Production Evolution

If this PoC later adds persistent uploads, server-side user sessions, or issued credentials, provision Vercel-compatible storage and environment variables separately. The current version requires none.
