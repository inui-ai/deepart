import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ['/', '/generate'].map((path) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7,
  }));
}
