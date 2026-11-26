import { getCollection, type CollectionEntry } from 'astro:content';
import { categories } from './data/site';

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

export async function allArticles(): Promise<CollectionEntry<'articles'>[]> {
  const items = await getCollection('articles', (a) => !a.data.draft);
  return items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
export async function allProjects(): Promise<CollectionEntry<'projects'>[]> {
  const items = await getCollection('projects', (p) => !p.data.draft);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
export const readingTime = (body: string | undefined) =>
  Math.max(1, Math.round((body ?? '').split(/\s+/).filter(Boolean).length / 220));

export function related(current: CollectionEntry<'articles'>, all: CollectionEntry<'articles'>[], n = 3) {
  const score = (a: CollectionEntry<'articles'>) =>
    (a.data.category === current.data.category ? 2 : 0) + a.data.tags.filter((t) => current.data.tags.includes(t)).length;
  return all
    .filter((a) => a.id !== current.id)
    .map((a) => ({ a, s: score(a) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .slice(0, n)
    .map((x) => x.a);
}
