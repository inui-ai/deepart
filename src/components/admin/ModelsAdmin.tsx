'use client';
// Models admin: name, kind (GET template | OpenAI-compatible images POST), model id,
// optional API key, endpoint. Templates are what make a request, so they validate. Keys
// stay in this browser and ride inside exports.
import { useState } from 'react';
import { mutate, uid, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import type { Model } from '@/data/site';
import { AdminField, QuietBtn, Row, Stack, Toggle } from './kit';

const FLUX_T = 'https://image.pollinations.ai/prompt/{prompt}?width={width}&height={height}&seed={seed}&model=flux&nologo=true';
const OPENAI_T = 'https://api.openai.com/v1/images/generations';

export function ModelsAdmin() {
  const s = useStore();
  const [nName, setNName] = useState('');
  const [nKind, setNKind] = useState<'url' | 'openai'>('url');
  const [nModelId, setNModelId] = useState('flux');
  const [nKey, setNKey] = useState('');
  const [nEndpoint, setNEndpoint] = useState(FLUX_T);

  function changeKind(k: 'url' | 'openai') {
    setNKind(k);
    // a fresh kind starts from a whole, correct template instead of half-edited remains
    setNEndpoint(k === 'openai' ? OPENAI_T : FLUX_T);
  }

  function add() {
    const name = nName.trim();
    const modelId = nModelId.trim();
    if (!name || !modelId) { toast('Name and model id are both needed.', 'warn'); return; }
    if (nKind === 'url' && !nEndpoint.includes('{prompt}')) { toast('The endpoint template must contain {prompt}.', 'error'); return; }
    if (nKind === 'openai') {
      if (!/^https?:\/\//.test(nEndpoint.trim())) { toast('The endpoint must be a full URL, for example https://api.provider.com/v1/images/generations.', 'error'); return; }
      if (nEndpoint.includes('{prompt}')) toast('The endpoint still holds {prompt}; OpenAI-kind posts the prompt inside the JSON body. Check the Kind or the URL.', 'warn');
      else if (!nKey.trim()) toast('OpenAI-compatible endpoints send the key as a Bearer header; paste it any time in the installed list.', 'warn');
    } else if (nEndpoint.includes('{key}') && !nKey.trim()) {
      toast('The template calls for a key; you can paste it any time in the installed list.', 'warn');
    }
    const key = nKey.trim() || undefined;
    const kind = nKind === 'openai' ? 'openai' : undefined; // undefined keeps the url default
    const ok = mutate((d) => {
      d.models.push({ id: `m-${uid()}`, name, slug: modelId, apiKey: key, kind, endpoint: nEndpoint.trim(), enabled: true });
    });
    if (ok) {
      toast(`Added ${name}.`, 'ok');
      setNName(''); setNKey('');
      setNKind('url'); setNEndpoint(FLUX_T);
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
        <AdminField label="Kind" hint={nKind === 'openai' ? 'OpenAI-compatible: JSON POST with a Bearer key.' : 'GET template rendered straight into the stage image.'}>
          <select className="adm__mono" value={nKind} onChange={(e) => changeKind(e.target.value as 'url' | 'openai')} aria-label="Model kind">
            <option value="url">URL template (GET)</option>
            <option value="openai">OpenAI images (JSON POST)</option>
          </select>
        </AdminField>
        <AdminField label="Model id" hint={nKind === 'openai' ? 'The model name the API expects, e.g. gpt-image-1.' : 'The id the provider expects; replaces {model} in the template.'}>
          <input value={nModelId} onChange={(e) => setNModelId(e.target.value)} placeholder={nKind === 'openai' ? 'gpt-image-1' : 'kontext'} />
        </AdminField>
        <AdminField label="API key" hint={nKind === 'openai' ? 'Required at render time; rides as Authorization: Bearer.' : 'Optional. Stored only in this browser; the template uses it through {key}.'}>
          <input
            type="password"
            autoComplete="off"
            aria-label="API key"
            value={nKey}
            onChange={(e) => setNKey(e.target.value)}
            placeholder="paste if the provider requires one"
          />
        </AdminField>
        <AdminField
          label="Endpoint template"
          hint={nKind === 'openai'
            ? 'Full https POST URL (…/v1/images/generations). Requests ride the same-origin /api/gen relay, so any provider works.'
            : 'Placeholders: {prompt} {width} {height} {seed} {model} {key}. The prompt is added URL-escaped.'}
        >
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
                <input className="adm__mono" value={m.slug} aria-label="Model id" onChange={(e) => mutate((d) => { d.models[i].slug = e.target.value; })} />
                <select
                  className="adm__mono"
                  value={m.kind ?? 'url'}
                  aria-label="Kind"
                  onChange={(e) => mutate((d) => { d.models[i].kind = e.target.value === 'openai' ? 'openai' : undefined; })}
                >
                  <option value="url">GET</option>
                  <option value="openai">OpenAI POST</option>
                </select>
                {m.builtIn ? <span className="chip chip--dim" aria-label="Built in">built in</span> : null}
              </div>
              <input
                type="password"
                autoComplete="off"
                className="adm__mono"
                value={m.apiKey ?? ''}
                aria-label="API key"
                placeholder={m.kind === 'openai' ? 'OpenAI-compat rides the key as Bearer' : m.endpoint.includes('{key}') ? 'no key set; the template needs one through {key}' : 'none'}
                onChange={(e) => mutate((d) => { d.models[i].apiKey = e.target.value.trim() || undefined; })}
              />
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
      <p className="adm__note">Built-in models are Pollinations endpoints plus a gpt-image-1 (OpenAI-compatible JSON POST) that ships off until its key is pasted. Delete is allowed, and Reset on the overview tab brings them back. API keys live only in this browser's localStorage and travel inside any export file — keep exports private.</p>
    </Stack>
  );
}
