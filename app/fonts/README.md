Self-hosted fonts (latin subset, woff2), loaded by `next/font/local` in
`app/layout.tsx`.

They used to come from `next/font/google`, which downloads from Google at
build time. That download failed intermittently and took production deploys
down with it, so the files live in the repo now.

- Space Grotesk (variable, weights 300-700) and IBM Plex Sans (400, 500, 600,
  700), both under the SIL Open Font License 1.1.
- Source: the `@fontsource-variable/space-grotesk` and
  `@fontsource/ibm-plex-sans` npm packages, version 5.3.0.
