import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="label-eyebrow mb-4">404</div>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-4">
          That page doesn&rsquo;t exist.
        </h1>
        <p className="text-ink/65 mb-8">
          The link you followed may be broken, or the page may have moved. Let&rsquo;s get you back on track.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/login" className="btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
