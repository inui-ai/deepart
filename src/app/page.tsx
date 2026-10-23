import { HeroFromStore } from '@/components/Hero';
import { AdSlot } from '@/components/AdSlot';
import { Wall } from '@/components/Wall';
import { CtaBand, Ladder, PipelineRows, RunPanel, SamplerPromo, TruthsMarquee } from '@/components/Landing';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pictures out of noise',
  description:
    'Type a few words, pick a model and watch the render resolve in steps. DeepArt runs in your browser: no login, no account, nothing leaves your machine.',
};

export default function Home() {
  return (
    <>
      <HeroFromStore />
      <div className="home__strip">
        <AdSlot placement="home-strip" />
      </div>
      <SamplerPromo />
      <RunPanel />
      <Ladder />
      <PipelineRows />
      <TruthsMarquee />
      <Wall />
      <CtaBand />
    </>
  );
}
