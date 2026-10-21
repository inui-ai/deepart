// Primary button hover: an ink fill floods from the pointer's entry point, the label flips
// to lime. One treatment for the primary role across the site. CSS covers touch and
// reduced motion (plain color flip); this adds the pointer-aware wipe on fine pointers.
import { gsap } from 'gsap';
import { onPage, isTouch, prefersReducedMotion, ease } from '@/engine';

export const buttonFill = () => onPage(() => {
  if (isTouch() || prefersReducedMotion()) return; // CSS above covers these
  const off: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-fill]').forEach((btn) => {
    const fill = btn.querySelector<HTMLElement>('.btn__fill');
    if (!fill) return;
    const from = (e: PointerEvent) => {
      const r = btn.getBoundingClientRect();
      return `${e.clientX - r.left}px ${e.clientY - r.top}px`;
    };
    const focus = () => btn.matches(':focus-visible');
    let closed = true;
    const open = (at: string) => {
      if (closed) gsap.set(fill, { clipPath: `circle(0% at ${at})` }); // start at the entry point
      closed = false;
      btn.classList.add('is-filled');
      gsap.to(fill, { clipPath: `circle(150% at ${at})`, duration: 0.6, ease: ease.soft, overwrite: true });
    };
    const close = (at: string) => {
      btn.classList.remove('is-filled');
      gsap.to(fill, { clipPath: `circle(0% at ${at})`, duration: 0.5, ease: ease.soft, overwrite: true, onComplete: () => { closed = true; } });
    };
    const enter = (e: PointerEvent) => open(from(e));
    const leave = (e: PointerEvent) => close(from(e));
    const onEnter = () => focus() && open('50% 50%');
    const onBlur = () => close('50% 50%');
    btn.addEventListener('pointerenter', enter);
    btn.addEventListener('pointerleave', leave);
    btn.addEventListener('focus', onEnter);
    btn.addEventListener('blur', onBlur);
    off.push(() => {
      btn.removeEventListener('pointerenter', enter);
      btn.removeEventListener('pointerleave', leave);
      btn.removeEventListener('focus', onEnter);
      btn.removeEventListener('blur', onBlur);
    });
  });
  return () => off.forEach((f) => f());
});
