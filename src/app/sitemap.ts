import type { MetadataRoute } from 'next';
import { site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/generate'].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7,
  }));
}
