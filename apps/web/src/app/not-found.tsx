import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted">That page or algorithm does not exist (yet).</p>
      <Link href="/algorithms" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg">
        Browse algorithms
      </Link>
    </div>
  );
}
