// Post-build validation: routes, internal links, metadata, canonicals, sitemap and RSS.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = 'https://edisonbujupi.github.io';
const errors = [];
const err = (m) => errors.push(m);

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const exists = (urlPath) => {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const p = path.join(dist, clean);
  return fs.existsSync(p) && (fs.statSync(p).isFile() || fs.existsSync(path.join(p, 'index.html')));
};

const titles = new Map();
const descs = new Map();
const pageUrl = (f) => '/' + path.relative(dist, f).replace(/index\.html$/, '').replace(/\\/g, '/');

for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const url = pageUrl(f);
  const is404 = url === '/404.html';
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (!title) err(`${url}: missing <title>`);
  if (!desc) err(`${url}: missing meta description`);
  if (!canon) err(`${url}: missing canonical`);
  if (title) { if (titles.has(title)) err(`${url}: duplicate title with ${titles.get(title)}`); titles.set(title, url); }
  if (desc) { if (descs.has(desc)) err(`${url}: duplicate description with ${descs.get(desc)}`); descs.set(desc, url); }
  if (canon && !is404 && canon !== SITE + url) err(`${url}: canonical is ${canon}`);
  if (desc && (desc.length < 50 || desc.length > 200)) err(`${url}: description length ${desc.length}`);
  if (!/<meta property="og:title"/.test(html) || !/<meta name="twitter:card"/.test(html)) err(`${url}: missing Open Graph or Twitter metadata`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) err(`${url}: ${h1} h1 elements`);
  if (!/<html lang="en"/.test(html)) err(`${url}: missing html lang`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) err(`${url}: image without alt`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { err(`${url}: invalid JSON-LD`); }
  }
  for (const m of html.matchAll(/<a\b[^>]*\shref="([^"]+)"[^>]*>/g)) {
    const href = m[1];
    if (/^(mailto:|tel:|#)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      if (href.startsWith(SITE) && !exists(href.slice(SITE.length))) err(`${url}: broken absolute link ${href}`);
      if (/target="_blank"/.test(m[0]) && !/rel="[^"]*noopener/.test(m[0])) err(`${url}: external link without noopener ${href}`);
      continue;
    }
    if (!exists(href)) err(`${url}: broken internal link ${href}`);
  }
  for (const m of html.matchAll(/<(?:img|link|script)\b[^>]*\s(?:src|href)="(\/[^"]+)"/g)) if (!exists(m[1])) err(`${url}: missing asset ${m[1]}`);
}

// sitemap
const sm = fs.readFileSync(path.join(dist, 'sitemap-0.xml'), 'utf8');
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const u of smUrls) { if (!u.startsWith(SITE)) err(`sitemap: unexpected host ${u}`); else if (!exists(u.slice(SITE.length))) err(`sitemap: missing page ${u}`); }
for (const f of htmlFiles) { const u = SITE + pageUrl(f); if (!pageUrl(f).includes('404') && !smUrls.includes(u)) err(`sitemap: ${u} not listed`); }
// robots and rss
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: ' + SITE + '/sitemap-index.xml')) err('robots.txt: missing sitemap line');
const rss = fs.readFileSync(path.join(dist, 'rss.xml'), 'utf8');
const items = (rss.match(/<item>/g) || []).length;
for (const m of rss.matchAll(/<link>([^<]+)<\/link>/g)) if (m[1].startsWith(SITE) && !exists(m[1].slice(SITE.length))) err(`rss: missing ${m[1]}`);
// drafts must not be built
for (const [dir, base] of [['articles', '/research/'], ['projects', '/projects/']]) {
  const src = fileURLToPath(new URL(`../src/content/${dir}/`, import.meta.url));
  if (!fs.existsSync(src)) continue;
  for (const name of fs.readdirSync(src).filter((n) => n.endsWith('.md'))) {
    const fm = (fs.readFileSync(path.join(src, name), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
    if (/^draft:\s*true\s*$/m.test(fm) && exists(base + name.replace(/\.md$/, '') + '/')) err(`draft ${dir}/${name} was published`);
  }
}
// placeholder text and empty values must not be public
const leak = /TO COMPLETE|TODO|FIXME|INSERT FIRST|REFERRAL_LINK|lorem ipsum|XXXXXXXX/i;
const empty = /\s(?:href|src|content)=""/;
for (const f of [...htmlFiles, path.join(dist, 'rss.xml')]) {
  const h = fs.readFileSync(f, 'utf8');
  if (leak.test(h)) err(`${pageUrl(f)}: placeholder text is public`);
  if (empty.test(h)) err(`${pageUrl(f)}: empty href, src or content attribute`);
}

console.log(`pages: ${htmlFiles.length}, sitemap urls: ${smUrls.length}, rss items: ${items}`);
if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s)`); process.exit(1); }
console.log('check: all passed');
