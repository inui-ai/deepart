'use client';
// The admin instrument. Tabs: Overview, Wall (gallery), Models, Ads. Every change hits the
// local store immediately; nothing leaves this browser.
import { useState } from 'react';
import { Overview } from './Overview';
import { GalleryAdmin } from './GalleryAdmin';
import { ModelsAdmin } from './ModelsAdmin';
import { AdsAdmin } from './AdsAdmin';

export type AdminTab = 'overview' | 'wall' | 'models' | 'ads';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'wall', label: 'Wall' },
  { id: 'models', label: 'Models' },
  { id: 'ads', label: 'Ads' },
];

export function Admin() {
  const [tab, setTab] = useState<AdminTab>('overview');
  return (
    <div className="adm">
      <header className="adm__head">
        <p className="adm__note">Changes save into this browser instantly. Nothing is uploaded.</p>
        <nav className="adm__tabs" aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`adm__tab ${tab === t.id ? 'adm__tab--on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="adm__panel"
        key={tab}
      >
        {tab === 'overview' && <Overview />}
        {tab === 'wall' && <GalleryAdmin />}
        {tab === 'models' && <ModelsAdmin />}
        {tab === 'ads' && <AdsAdmin />}
      </div>
    </div>
  );
}
