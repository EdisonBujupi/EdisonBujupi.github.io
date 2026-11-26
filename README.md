# Edison | Cybersecurity Research & Engineering

Source for [edisonbujupi.github.io](https://edisonbujupi.github.io): independent cybersecurity research notes on detection engineering, security monitoring with Wazuh and documented lab experiments, including contributions made as a member of the Wazuh Ambassadors Program.

## Stack

- [Astro](https://astro.build) with static output: no server, no database, almost no client-side JavaScript
- Markdown content collections for articles and projects
- Build-time image optimisation and syntax highlighting
- Sitemap, RSS feed, Open Graph metadata and JSON-LD structured data

## Layout

```
.github/workflows/deploy.yml   build and deploy to GitHub Pages
astro.config.mjs               Astro configuration
scripts/check-site.mjs         post-build validation (links, metadata, sitemap, RSS)
public/                        static files
src/data/site.ts               site-wide settings
src/data/resources.ts          resource links and categories (/resources/)
src/content.config.ts          frontmatter schemas
src/content/articles/          articles (Markdown)
src/content/projects/          projects (Markdown)
src/assets/articles/<slug>/    article images
src/components/, src/layouts/  page components and layout
src/pages/                     routes
src/styles/global.css          styles
```

## Local commands

Requires Node.js 22.18 or newer.

```sh
npm ci           # install dependencies
npm run dev      # local preview
npm run build    # build to dist/
npm run check    # validate the build output
```

## Deployment

Every push to `main` runs the GitHub Actions workflow. It runs `npm ci`, `npm run build` and `npm run check`, then publishes `dist/` to GitHub Pages.

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.

## Independence

This website is owned and operated by its author. It is not operated, endorsed or maintained by Wazuh, and its articles are not official Wazuh material. Wazuh is a trademark of its owner.
