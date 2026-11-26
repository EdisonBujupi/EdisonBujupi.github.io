import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

export async function GET(context) {
  const items = (await getCollection('articles', (a) => !a.data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
  return rss({
    title: site.title,
    description: site.description,
    site: context.site,
    items: items.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.pubDate,
      link: `/research/${a.id}/`,
      categories: [a.data.category, ...a.data.tags],
    })),
    customData: '<language>en</language>',
  });
}
