// The 404 carries the concept: this page never converged. A pure noise field, a spec line
// with no seed, one way back.
import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="lost">
      <figure className="plate lost__plate">
        <div className="plate__media plate__media--wide">
          <span className="lost__noise" aria-hidden="true" />
        </div>
        <figcaption className="plate__spec">
          <span>did not converge</span>
          <span>seed undefined</span>
          <span>pages: /, /generate, /admin</span>
        </figcaption>
      </figure>
      <h1 className="lost__title">This page ran out of focus.</h1>
      <p className="lost__sub">
        The address resolved to nothing. The visible site stays on three pages: the{' '}
        <Link className="link" href="/">wall</Link>, the <Link className="link" href="/generate">sampler</Link> and{' '}
        <Link className="link" href="/admin">admin</Link>.
      </p>
      <Link href="/" className="btn btn--solid" data-no-transition>
        Back to the wall
      </Link>
    </section>
  );
}
