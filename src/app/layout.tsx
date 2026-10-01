import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});
const sora = localFont({
  src: [
    { path: "../../node_modules/@fontsource/sora/files/sora-latin-600-normal.woff2", weight: "600" },
    { path: "../../node_modules/@fontsource/sora/files/sora-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Vakratund Construction", template: "%s | Vakratund Construction" },
  description: "Civil engineering, PMC and turnkey project development since 2003.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${inter.variable} ${sora.variable}`}><body className="min-h-screen">{children}</body></html>;
}
