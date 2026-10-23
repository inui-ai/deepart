'use client';
// Overview: counts, browser storage usage, export / import / reset.
import { useRef } from 'react';
import { exportJson, importJson, resetToSeed, storageUsage, useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import { QuietBtn, Stack } from './kit';

const N = ({
  value, label,
}: { value: number | string; label: string }) => (
  <div className="adm__stat">
    <p className="adm__num">{value}</p>
    <p className="adm__label">{label}</p>
  </div>
);

export function Overview() {
  const s = useStore();
  const file = useRef<HTMLInputElement>(null);
  const usage = storageUsage();

  function download() {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'deepart-content.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast('Exported deepart-content.json.', 'ok');
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const res = importJson(await f.text());
    toast(res.ok ? 'Import finished.' : `Import failed: ${res.error}`, res.ok ? 'ok' : 'error');
    e.target.value = '';
  }

  function reset() {
    if (!window.confirm('Reset everything (gallery, models, ads, hero copy) back to the shipped defaults?')) return;
    const ok = resetToSeed();
    toast(ok ? 'Reset to the shipped defaults.' : 'Reset for this visit; the browser refused to overwrite the save.', ok ? 'ok' : 'warn');
  }

  return (
    <Stack>
      <div className="adm__stats">
        <N value={s.gallery.length} label="Plates in the gallery" />
        <N value={s.models.length} label="Models" />
        <N value={s.ads.filter((a) => a.active).length} label="Live ads" />
        <N value={s.usage.generations} label="Generations" />
        <N value={`${usage.kb} KB`} label={`Of ~${usage.quota} browser storage`} />
      </div>

      <div className="adm__actions">
        <QuietBtn onClick={download}>Export content</QuietBtn>
        <QuietBtn onClick={() => file.current?.click()}>Import content</QuietBtn>
        <input ref={file} type="file" accept="application/json" hidden onChange={onFile} aria-hidden="true" tabIndex={-1} />
        <QuietBtn onClick={reset} className="adm__btn--warn">Reset to defaults</QuietBtn>
      </div>

      <p className="adm__note">
        Export is the whole local state as JSON; import replaces it. Use export before big edits if
        you want a way back.
      </p>
    </Stack>
  );
}
