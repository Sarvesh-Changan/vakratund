import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Theme directions",
  robots: { index: false, follow: false },
};

export default function ThemeDirectionsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <ThemeShowcase />;
}
