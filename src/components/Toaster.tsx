'use client';
import { useToasts } from '@/lib/toast';

export function Toaster() {
  const items = useToasts();
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <output key={t.id} className={`toast toast--${t.kind}`}>
          {t.msg}
        </output>
      ))}
    </div>
  );
}
