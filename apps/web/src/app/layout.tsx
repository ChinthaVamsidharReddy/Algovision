import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { brand } from "../../brand.config";
import { AuthProvider } from "@/components/auth/auth-provider";
import { LearningProvider } from "@/components/learning/learning-provider";
import { SiteFooter } from "@/components/site-footer";
import { catalogCards } from "@/lib/catalog-cards";
import { SiteHeader } from "@/components/site-header";
import { WakeBanner } from "@/components/wake-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${brand.name} - ${brand.tagline}`, template: `%s | ${brand.name}` },
  description: brand.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
};

/** Applies a saved theme before first paint so there is no flash. Storage may be blocked; that is fine. */
const themeScript = `try{var t=localStorage.getItem("av-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex flex-col">
        <a
          href="#main"
          className="absolute left-3 top-3 z-50 -translate-y-20 rounded-md bg-accent px-4 py-2 font-medium text-accent-fg focus:translate-y-0"
        >
          Skip to content
        </a>
        <AuthProvider>
          <LearningProvider>
          <SiteHeader cards={catalogCards()} />
          <WakeBanner />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
          </LearningProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
