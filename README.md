# Cookie Composer

A static, client-only web app for creating an animated "kindness fortune cookie" GIF to share by text or email. No backend, no accounts — everything runs in the browser.

## Running locally

```sh
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173/cookie-composer/`).

## Opening the dev server from your phone

To test on Jennifer's iPhone (or any phone on the same Wi-Fi):

```sh
npm run dev -- --host
```

Vite will print a "Network" URL, e.g. `http://192.168.1.23:5173/cookie-composer/`. Open that URL in Safari on the phone, as long as the phone is on the same Wi-Fi network as the computer.

If you need to find your computer's LAN IP manually on macOS: **System Settings → Wi-Fi → Details** (or run `ipconfig getifaddr en0` in Terminal).

## Testing and type checking

```sh
npm test        # run the Vitest suite
npm run typecheck
```

## Building

```sh
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds, type-checks, tests, and deploys to GitHub Pages.

Live site: https://ukedude.github.io/cookie-composer/
