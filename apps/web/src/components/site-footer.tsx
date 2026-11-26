import Link from "next/link";
import { brand } from "../../brand.config";
import { Logo } from "./brand/logo";
import { SocialIcon, type SocialName } from "./brand/social-icons";
import { BackendStatus } from "./backend-status";

const columns: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Learn",
    links: [
      { href: "/home", label: "Home" },
      { href: "/algorithms", label: "All algorithms" },
      { href: "/paths", label: "Learning paths" },
      { href: "/cheatsheet", label: "Cheat sheet" },
    ],
  },
  {
    title: "Practice",
    links: [
      { href: "/practice", label: "Practice in the browser" },
      { href: "/review", label: "Daily review" },
      { href: "/compare", label: "Compare algorithms" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Your space",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/bookmarks", label: "Bookmarks" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create an account" },
    ],
  },
];

const socialLabels: Record<SocialName, string> = { github: "GitHub", linkedin: "LinkedIn", x: "X (Twitter)", instagram: "Instagram", youtube: "YouTube", mail: "Email" };

export function SiteFooter() {
  const socials = (Object.entries(brand.social) as [SocialName, string][]).filter(([, url]) => url);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-border bg-surface print:hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight">
              <Logo size={32} />
              {brand.name}
            </Link>
            <p className="max-w-xs text-sm text-muted">{brand.tagline}</p>
            <p className="max-w-xs text-sm text-muted">Watch algorithms run, read the code in four languages, and remember them through everyday stories.</p>
            <ul aria-label="Social media" className="flex flex-wrap gap-2">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${brand.name} on ${socialLabels[name]}`}
                    className="inline-grid size-11 place-items-center rounded-full border border-border text-muted transition hover:-translate-y-0.5 hover:border-accent hover:text-accent"
                  >
                    <SocialIcon name={name} />
                  </a>
                </li>
              ))}
              {brand.contactEmail && (
                <li>
                  <a href={`mailto:${brand.contactEmail}`} aria-label="Email us" className="inline-grid size-11 place-items-center rounded-full border border-border text-muted transition hover:-translate-y-0.5 hover:border-accent hover:text-accent">
                    <SocialIcon name="mail" />
                  </a>
                </li>
              )}
            </ul>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">{c.title}</h2>
              <ul className="space-y-2 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-flex min-h-8 items-center hover:text-accent hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-6 text-sm text-muted">
          <p>
            &copy; {year} {brand.name}. All rights reserved.
          </p>
          <p>
            Made with <span aria-label="love">♥</span> in {brand.country}
          </p>
          <BackendStatus />
        </div>
      </div>
    </footer>
  );
}
