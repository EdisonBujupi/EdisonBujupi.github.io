import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The public address lives in src/data/site.ts and must match the value here.
export default defineConfig({
  site: 'https://edisonbujupi.github.io',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  markdown: {
    shikiConfig: { theme: 'github-dark-default', wrap: false },
  },
  prefetch: false,
  // No source maps in the production output.
  vite: { build: { sourcemap: false } },
});
