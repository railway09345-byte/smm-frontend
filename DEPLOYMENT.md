# Vercel deployment

Deploy `smmai-frontend` with the Vercel project root set to this directory.
Vercel will run `npm run build` and serve the Vite single-page application.

Set this Vercel environment variable for Production, Preview, and Development:

```text
VITE_API_BASE_URL=https://YOUR-RAILWAY-DOMAIN/api/v1
```

Do not add a trailing slash. Vite embeds `VITE_` values at build time, so
redeploy Vercel after changing the Railway domain.
