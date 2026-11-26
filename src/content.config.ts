import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories } from './data/site';

const slugs = categories.map((c) => c.slug) as [string, ...string[]];

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(50).max(200),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    category: z.enum(slugs),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    // true adds the two required Wazuh tracking links and the independence note
    wazuhContribution: z.boolean().default(false),
    repoUrl: z.string().url().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().min(40).max(220),
    type: z.enum(['Laboratory', 'Investigation', 'Utility', 'Configuration', 'Experiment']),
    status: z.enum(['Ongoing', 'Documented', 'Archived']).default('Documented'),
    date: z.coerce.date(),
    tools: z.array(z.string()).default([]),
    repoUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, projects };
