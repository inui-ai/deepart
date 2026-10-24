import { HeroFromStore } from '@/components/Hero';
import { Gallery } from '@/components/Gallery';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DeepArt: pictures out of noise',
  description:
    'Type a few words, pick a model and watch the render resolve in steps. DeepArt runs in your browser: no login, no account, nothing leaves your machine.',
};

// The questions and answers below are the visible FAQ. The FAQPage schema is
// generated from the same array, so structured data and page text never drift.
const FAQ = [
  {
    q: 'Is DeepArt free?',
    a: 'Yes. The built-in Flux and Turbo models render with no key and no charge. Any OpenAI-compatible provider you add rides your own API key, and that provider bills you directly. DeepArt itself charges nothing and has no accounts.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. The sampler runs in the browser: no app, no command line, no sign-up. Your models, your prompt history and your gallery live in this browser and nowhere else.',
  },
  {
    q: 'Which image models can it use?',
    a: 'Flux and Turbo ship enabled and free. Any OpenAI-compatible images endpoint can be added too: a base URL such as https://kenari.id/v1 or a full generations URL, plus an API key that stays in your browser.',
  },
  {
    q: 'Where do my images go?',
    a: 'Nowhere. Renders are drawn in your browser and are not stored on a server. They leave your machine only when you download one or export the JSON file yourself.',
  },
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

// The landing, reworked: the atelier hero (statement + plate with a glass card), then
// the FAQ board (server-rendered, readable without JS), then the gallery deck. Footer
// arrives with the layout.
export default function Home() {
  return (
    <>
      <HeroFromStore />
      <section className="faq" aria-labelledby="faq-h">
        <h2 id="faq-h" className="faq__h">Questions people ask DeepArt</h2>
        {FAQ.map((f) => (
          <details key={f.q} className="faq__item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, '\\u003c') }}
        />
      </section>
      <Gallery />
    </>
  );
}
