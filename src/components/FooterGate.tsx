'use client';
// The footer belongs everywhere except the sampler: on /generate the stage owns the
// whole page edge to edge, so the footer is skipped per route.
import { usePathname } from 'next/navigation';

export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  return <>{pathname.startsWith('/generate') ? null : children}</>;
}
