'use client';
// Models admin: name, slug, endpoint template with {prompt} {width} {height} {seed} {model}
// placeholders, enabled toggle. Templates are what make a request, so they validate.
import { useState } from 'react';
import { mutate, uid, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import type { Model } from '@/data/site';
import { AdminField, QuietBtn, Row, Stack, Toggle } from './kit';

const FLUX_T = 'https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}&seed={seed}&model=flux&nologo=true';

export function ModelsAdmin() {
  const s = useStore();
  const [nName, setNName] = useState('');
  const [nSlug, setNSlug] = useState('');
  const [nEndpoint, setNEndpoint] = useState(FLUX_T);

  function add() {
    const name = nName.trim();
    const slug = nSlug.trim();
    if (!name || !slug) { toast('Name and slug are both needed.', 'warn'); return; }
    if (!nEndpoint.includes('{prompt}')) { toast('The endpoint template must contain {prompt}.', 'error'); return; }
    const ok = mutate((d) => {
      d.models.push({ id: `m-${uid()}`, name, slug, endpoint: nEndpoint.trim(), enabled: true });
    });
    if (ok) {
      toast(`Added ${name}.`, 'ok');
      setNName(''); setNSlug('');
    } else toast('Added for this visit, but the browser refused to save it.', 'warn');
  }

  function remove(m: Model, i: number) {
    if (!window.confirm(`Remove the model "${m.name}"? Renders using it will fall back to the first enabled model.`)) return;
    mutate((d) => { d.models.splice(i, 1); });
    toast(`Removed ${m.name}.`, 'ok');
  }

  return (
    <Stack>
      <h3 className="adm__h3">Add a model</h3>
      <Row className="adm__adder">
        <AdminField label="Name" hint="Shown on the generate page.">
          <input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Flux Kontext" />
        </AdminField>
        <AdminField label="Slug" hint="Replaces {model} in the endpoint template.">
          <input value={nSlug} onChange={(e) => setNSlug(e.target.value)} placeholder="kontext" />
        </AdminField>
        <AdminField label="Endpoint template" hint="Placeholders: {prompt} {width} {height} {seed} {model}. The prompt is added URL-escaped.">
          <textarea className="adm__mono" rows={3} value={nEndpoint} onChange={(e) => setNEndpoint(e.target.value)} />
        </AdminField>
        <div className="adm__actions">
          <button type="button" className="btn btn--solid" data-fill onClick={add}>
            <span className="btn__fill" aria-hidden="true" />
            Add model
          </button>
        </div>
      </Row>

      <h3 className="adm__h3">Installed ({s.models.length})</h3>
      <ol className="adm__list">
        {s.models.map((m, i) => (
          <li key={m.id} className={`adm__item ${!m.enabled ? 'adm__item--off' : ''}`}>
            <div className="adm__inputs adm__inputs--model">
              <input value={m.name} aria-label="Model name" onChange={(e) => mutate((d) => { d.models[i].name = e.target.value; })} />
              <div className="adm__modelrow">
                <input className="adm__mono" value={m.slug} aria-label="Slug" onChange={(e) => mutate((d) => { d.models[i].slug = e.target.value; })} />
                {m.builtIn ? <span className="chip chip--dim" aria-label="Built in">built in</span> : null}
              </div>
              <textarea
                className="adm__mono"
                rows={2}
                value={m.endpoint}
                aria-label="Endpoint template"
                onChange={(e) => mutate((d) => { d.models[i].endpoint = e.target.value; })}
              />
            </div>
            <div className="adm__itembtns">
              <Toggle on={m.enabled} onClick={() => mutate((d) => { d.models[i].enabled = !m.enabled; })}>
                {m.enabled ? 'On' : 'Off'}
              </Toggle>
              <QuietBtn className="adm__btn--warn" aria-label={`Delete ${m.name}`} onClick={() => remove(m, i)}>Delete</QuietBtn>
            </div>
          </li>
        ))}
      </ol>
      <p className="adm__note">Built-in models are Pollinations endpoints; delete is allowed, and Reset on the overview tab brings them back.</p>
    </Stack>
  );
}
