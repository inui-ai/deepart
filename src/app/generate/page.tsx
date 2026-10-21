import { Generate } from '@/components/Generate';
import { AdSlot } from '@/components/AdSlot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Generate',
  description:
    'Prompt in, image out: watch the sampler resolve your render in steps, download it, or hang it on the wall. Models are user-configurable in admin.',
};

export default function GeneratePage() {
  return (
    <div className="genpage">
      <Generate />
      <aside className="genpage__rail" aria-label="Sponsored">
        <AdSlot placement="generate-sidebar" />
      </aside>
    </div>
  );
}
