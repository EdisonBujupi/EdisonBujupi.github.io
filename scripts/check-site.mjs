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

// wording and links that must not be public
const banned = [/student/i, /5\.0-rc/i];
for (const f of files.filter((x) => /\.(html|xml|txt|json)$/.test(x))) {
  const h = fs.readFileSync(f, 'utf8');
  for (const re of banned) if (re.test(h)) err(`${pageUrl(f)}: contains banned text ${re}`);
}

// no source maps in the output
for (const f of files) {
  if (f.endsWith('.map')) err(`source map in output: ${pageUrl(f)}`);
  else if (/\.(js|css|html)$/.test(f) && /sourceMappingURL/.test(fs.readFileSync(f, 'utf8'))) err(`${pageUrl(f)}: sourceMappingURL reference`);
}

// Content-Security-Policy: present on every page, and nothing on the page needs more than the policy allows
const CSP = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'self'; form-action 'self'";
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  const url = pageUrl(f);
  if (!html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`)) err(`${url}: missing or changed Content-Security-Policy`);
  if (!/<meta name="referrer" content="strict-origin-when-cross-origin">/.test(html)) err(`${url}: missing referrer policy`);
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const src = (m[1].match(/\ssrc="([^"]+)"/) || [])[1];
    if (src) { if (!src.startsWith('/')) err(`${url}: third-party script ${src} is blocked by the CSP`); }
    else if (!/type="application\/ld\+json"/.test(m[1])) err(`${url}: inline script is blocked by the CSP`);
  }
  if (/\son[a-z]+="/i.test(html)) err(`${url}: inline event handler is blocked by the CSP`);
  for (const m of html.matchAll(/<(?:img|source|link|iframe|video|audio)\b[^>]*\s(?:src|srcset|href)="([^"]+)"/g)) {
    const tag = m[0];
    if (/^<link\b/.test(tag) && !/rel="(?:stylesheet|icon|preload)"/.test(tag)) continue;
    if (!/^(\/|data:)/.test(m[1])) err(`${url}: external asset ${m[1]} is blocked by the CSP`);
  }
}

// resource category pages: generated from src/data/resources.ts
const { resourceCategories, resources } = await import('../src/data/resources.ts');
const active = resourceCategories.filter((c) => resources.some((r) => r.category === c.slug));
for (const r of resources) if (!resourceCategories.some((c) => c.slug === r.category)) err(`resources: unknown category ${r.category} for ${r.url}`);
const resIndex = fs.readFileSync(path.join(dist, 'resources/index.html'), 'utf8');
for (const c of resourceCategories) {
  const page = `/resources/${c.slug}/`;
  const isActive = active.includes(c);
  if (isActive !== exists(page)) err(`resources: ${page} should ${isActive ? '' : 'not '}exist`);
  if (isActive !== resIndex.includes(`href="${page}"`)) err(`resources: /resources/ should ${isActive ? '' : 'not '}link ${page}`);
  if (!isActive || !exists(page)) continue;
  const html = fs.readFileSync(path.join(dist, page, 'index.html'), 'utf8');
  for (const r of resources.filter((x) => x.category === c.slug)) if (!html.includes(`href="${r.url}"`)) err(`resources: ${page} is missing ${r.url}`);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const bc = ld.find((o) => o['@type'] === 'BreadcrumbList');
  const names = bc ? bc.itemListElement.map((i) => i.name).join(' > ') : '';
  if (names !== `Home > Resources > ${c.name}` || bc.itemListElement[2].item !== SITE + page) err(`resources: ${page} has a wrong BreadcrumbList (${names})`);
  if (!html.includes('<a href="/resources/">Resources</a>')) err(`resources: ${page} has no breadcrumb link to /resources/`);
}
for (const d of fs.readdirSync(path.join(dist, 'resources'), { withFileTypes: true }).filter((e) => e.isDirectory())) {
  if (!active.some((c) => c.slug === d.name)) err(`resources: unexpected page /resources/${d.name}/`);
}

console.log(`pages: ${htmlFiles.length}, sitemap urls: ${smUrls.length}, rss items: ${items}, resource categories: ${active.length}`);
if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s)`); process.exit(1); }
console.log('check: all passed');
