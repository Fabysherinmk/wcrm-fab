import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { DEFAULT_THEME, STORAGE_KEY, THEME_IDS } from "@/lib/themes";

// Body face. Kept neutral and highly legible for dense tables, forms
// and chat — Inter does this job well, so it stays for body copy only.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Display face for headings. A grotesque with real character so titles
// don't read like the default Inter-everywhere template look. Wired to
// `--font-display`, which globals.css maps onto every `h1`–`h4`.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cognifyr",
    template: "%s — Cognifyr",
  },
  description: "A WhatsApp CRM for teams that actually talk to their customers.",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [{ url: "/icon" }],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  // Cool charcoal — matches the Sky default `--background`.
  themeColor: "#14171c",
  colorScheme: "dark",
};

// Inline boot script — runs before React hydrates so the user's
// chosen theme is on the <html> element before first paint. Without
// this every page load flashes the default Violet for a frame before
// the React tree mounts and applies the picked theme.
//
// Kept dependency-free (no imports, no JSX) — must be a string the
// browser can run as a single <script>. Knowledge of valid theme IDs
// is sourced from the THEME_IDS constant so adding a theme doesn't
// silently break the boot path.
const THEME_BOOT_SCRIPT = `
(function(){
  try {
    var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
    var DEFAULT = ${JSON.stringify(DEFAULT_THEME)};
    var ALLOWED = ${JSON.stringify(THEME_IDS)};
    var saved = localStorage.getItem(STORAGE_KEY);
    var theme = ALLOWED.indexOf(saved) !== -1 ? saved : DEFAULT;
    document.documentElement.dataset.theme = theme;
  } catch (_e) {
    document.documentElement.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      className={`${inter.variable} ${bricolage.variable} h-full antialiased`}
      // The `theme-boot` script below rewrites `data-theme` on <html>
      // from localStorage before React hydrates, so for any non-default
      // theme the client DOM intentionally differs from the server-
      // rendered `DEFAULT_THEME`. suppressHydrationWarning silences the
      // expected mismatch — it only applies to this element's own
      // attributes, so genuine mismatches in children still surface.
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground font-sans">
        <ThemeProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              // Cool charcoal surface + hairline to match the Sky
              // default neutrals.
              style: {
                background: "oklch(0.2 0.011 250)",
                border: "1px solid oklch(0.3 0.012 250)",
                color: "white",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
