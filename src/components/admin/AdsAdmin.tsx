'use client';
// Ads admin: headline, link, image, placement, on/off. Rendered slots are labeled "Ad" and
// inactive ones collapse. A fresh banner can be rendered right here with a random seed.
import { useEffect, useState } from 'react';
import { mutate, uid, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { pollUrl, type Ad } from '@/data/site';
import { AdminField, QuietBtn, Row, Stack, Toggle } from './kit';

const PLACEMENTS: { value: Ad['placement']; label: string }[] = [
  { value: 'home-strip', label: 'Home, between hero and wall' },
  { value: 'generate-sidebar', label: 'Generate, right rail' },
];

export function AdsAdmin() {
  const s = useStore();
  const [nHead, setNHead] = useState('');
  const [nLink, setNLink] = useState('');
  const [nPlace, setNPlace] = useState<Ad['placement']>('home-strip');
  const [nImg, setNImg] = useState('');
  const [rollSeed, setRollSeed] = useState(0);

  // Seeds are client-born: not present during prerender.
  useEffect(() => { setRollSeed(Math.floor(100_000 + Math.random() * 899_999)); }, []);

  function add() {
    if (!nHead.trim()) { toast('Give the ad a headline.', 'warn'); return; }
    if (!nLink.trim()) { toast('Give the ad a link (it can be "#").', 'warn'); return; }
    const ok = mutate((d) => {
      d.ads.push({
        id: `ad-${uid()}`,
        headline: nHead.trim().slice(0, 90),
        link: nLink.trim(),
        imageUrl: nImg.trim() || pollUrl('wide minimal abstract poster, lime and ink flat shapes, print grain', rollSeed, 1200, 260),
        placement: nPlace,
        active: false,
      });
    });
    if (ok) { toast('Ad added, inactive. Turn it on when ready.', 'ok'); setNHead(''); setNLink(''); setNImg(''); }
    else toast('Added for this visit, but the browser refused to save it.', 'warn');
  }

  function roll() {
    setNImg(pollUrl('wide minimal abstract poster, lime and ink flat shapes, print grain', rollSeed, 1200, 260));
    setRollSeed(Math.floor(100_000 + Math.random() * 899_999));
  }

  return (
    <Stack>
      <h3 className="adm__h3">Add an ad</h3>
      <Row className="adm__adder">
        <AdminField label="Headline">
          <input value={nHead} onChange={(e) => setNHead(e.target.value)} placeholder="Studio suite: unlimited renders, billed monthly" />
        </AdminField>
        <AdminField label="Link">
          <input value={nLink} onChange={(e) => setNLink(e.target.value)} placeholder="https://example.com" />
        </AdminField>
        <AdminField label="Placement">
          <select value={nPlace} onChange={(e) => setNPlace(e.target.value as Ad['placement'])}>
            {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </AdminField>
        <AdminField label="Image (banner works best wide, 1200×260)">
          <div className="gen__seed">
            <input value={nImg} onChange={(e) => setNImg(e.target.value)} placeholder="https://..." />
            <button type="button" className="chip" onClick={roll}>Render one</button>
          </div>
        </AdminField>
        <div className="adm__actions">
          <button type="button" className="btn btn--solid" data-fill onClick={add}>
            <span className="btn__fill" aria-hidden="true" />
            Add ad
          </button>
        </div>
      </Row>

      <h3 className="adm__h3">Installed ({s.ads.length})</h3>
      <ol className="adm__list">
        {s.ads.map((a, i) => (
          <li key={a.id} className={`adm__item ${!a.active ? 'adm__item--off' : ''}`}>
            <img className="adm__thumb" src={a.imageUrl} alt="" width={96} height={96} loading="lazy" decoding="async" />
            <div className="adm__inputs">
              <input value={a.headline} aria-label="Headline" onChange={(e) => mutate((d) => { d.ads[i].headline = e.target.value; })} />
              <input value={a.link} aria-label="Link" onChange={(e) => mutate((d) => { d.ads[i].link = e.target.value; })} />
              <input className="adm__mono" value={a.imageUrl} aria-label="Image URL" onChange={(e) => mutate((d) => { d.ads[i].imageUrl = e.target.value; })} />
              <select
                value={a.placement}
                aria-label="Placement"
                onChange={(e) => mutate((d) => { d.ads[i].placement = e.target.value as Ad['placement']; })}
              >
                {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="adm__itembtns">
              <Toggle on={a.active} onClick={() => mutate((d) => { d.ads[i].active = !a.active; })}>
                {a.active ? 'Live' : 'Off'}
              </Toggle>
              <QuietBtn
                className="adm__btn--warn"
                aria-label={`Delete ad ${a.headline}`}
                onClick={() => { mutate((d) => { d.ads.splice(i, 1); }); toast('Ad removed.', 'ok'); }}
              >
                Delete
              </QuietBtn>
            </div>
          </li>
        ))}
      </ol>
      <p className="adm__note">Rendered slots carry an &ldquo;Ad&rdquo; label. An inactive ad shows nothing: the slot collapses.</p>
    </Stack>
  );
}
