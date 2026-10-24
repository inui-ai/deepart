import { HeroFromStore } from '@/components/Hero';
import { Gallery } from '@/components/Gallery';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DeepArt: pictures out of noise',
  description:
    'Type a few words, pick a model and watch the render resolve in steps. DeepArt runs in your browser: no login, no account, nothing leaves your machine.',
};

// The landing: the atelier hero (statement + plate with a glass card), then the gallery
// deck. Footer arrives with the layout.
export default function Home() {
  return (
    <>
      <HeroFromStore />
      <Gallery />
    </>
  );
}
