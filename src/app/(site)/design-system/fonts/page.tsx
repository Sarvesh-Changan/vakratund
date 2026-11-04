import type { Metadata } from "next";
import Image from "next/image";
import {
  Allerta_Stencil,
  Big_Shoulders_Stencil,
  Saira_Stencil,
  Stardos_Stencil,
  Sirin_Stencil,
  Black_Ops_One,
  Emblema_One,
  Barlow_Semi_Condensed,
  Saira_Semi_Condensed,
  Archivo,
} from "next/font/google";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Font candidates showcase | Vakratund Construction",
  robots: { index: false, follow: false },
};

const allertaStencil = Allerta_Stencil({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const bigShouldersStencil = Big_Shoulders_Stencil({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const sairaStencil = Saira_Stencil({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const stardosStencil = Stardos_Stencil({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const sirinStencil = Sirin_Stencil({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const blackOpsOne = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const emblemaOne = Emblema_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const barlowSemiCondensed = Barlow_Semi_Condensed({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const sairaSemiCondensed = Saira_Semi_Condensed({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const archivoSemiCondensed = Archivo({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
});

const candidateFonts = [
  {
    name: "Allerta Stencil",
    font: allertaStencil,
    category: "Stencil (Geometric / Signage)",
    isDefaultChoice: true,
    notes:
      "Exact match to Screenshot 1. Features identical bridge cutouts across lowercase 'a', 'o', 'r', 'u', 'n', 'c', and capital 'V' & 'C'. Matt McInerney / OFL license.",
  },
  {
    name: "Big Shoulders Stencil",
    font: bigShouldersStencil,
    category: "Stencil (Condensed Display)",
    isDefaultChoice: false,
    notes:
      "Taller x-height and significantly narrower proportions than the target wordmark.",
  },
  {
    name: "Saira Stencil",
    font: sairaStencil,
    category: "Stencil (Grotesque)",
    isDefaultChoice: false,
    notes:
      "Heavier horizontal bridges and squarer curves compared to the rounded geometry in the screenshot.",
  },
  {
    name: "Stardos Stencil",
    font: stardosStencil,
    category: "Stencil (Serif / Typewriter)",
    isDefaultChoice: false,
    notes: "Serif letterforms and typewriter-like ball terminals differ from the sans target.",
  },
  {
    name: "Sirin Stencil",
    font: sirinStencil,
    category: "Stencil (Humanist)",
    isDefaultChoice: false,
    notes: "Lighter weight and asymmetrical open humanist cuts rather than industrial utility cuts.",
  },
  {
    name: "Black Ops One",
    font: blackOpsOne,
    category: "Stencil (Heavy Military / Slab)",
    isDefaultChoice: false,
    notes: "Too heavy/blocky with wide military slab-like structure.",
  },
  {
    name: "Emblema One",
    font: emblemaOne,
    category: "Stencil (Victorian / Display)",
    isDefaultChoice: false,
    notes: "Decorative Victorian curves with circular cutout dots.",
  },
  {
    name: "Barlow Semi Condensed 700",
    font: barlowSemiCondensed,
    category: "Semi-Condensed Sans (Non-stencil)",
    isDefaultChoice: false,
    notes: "Close overall proportions and clean geometry, but solid strokes without stencil breaks.",
  },
  {
    name: "Saira Semi Condensed 700",
    font: sairaSemiCondensed,
    category: "Semi-Condensed Sans (Non-stencil)",
    isDefaultChoice: false,
    notes: "Punchy, modern neo-grotesque sans without stencil cuts.",
  },
  {
    name: "Archivo SemiCondensed 700",
    font: archivoSemiCondensed,
    category: "Semi-Condensed Sans (Non-stencil)",
    isDefaultChoice: false,
    notes: "Wide horizontal strokes with squarish grotesque terminals.",
  },
];

export default function DesignSystemFontsPage() {
  return (
    <section className="section-light min-h-screen py-16">
      <Container className="space-y-12">
        <div>
          <p className="eyebrow">Design System · Font Evaluation</p>
          <h1 className="mt-2 font-heading text-h1 font-bold text-ink">
            Navbar Brand Font Candidates
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-ink-muted">
            Evaluation of stencil and semi-condensed sans candidates beside the target
            wordmark (Screenshot 1: &quot;STENCIL: Utility &amp; Function&quot;).
          </p>
        </div>

        {/* Target Reference Card */}
        <div className="rounded-card border border-line bg-tint/50 p-6 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Screenshot 1 Target Wordmark
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="rounded-control border border-line bg-white p-3 shadow-soft">
              <Image
                src="/design-system/stencil-target.png"
                alt="Target wordmark screenshot: STENCIL: Utility & Function"
                width={347}
                height={60}
                className="h-auto max-w-full"
                priority
              />
            </div>
            <div className="text-sm text-ink-muted">
              <p className="font-semibold text-ink">Target Observations:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                <li>Caption reads &quot;STENCIL: Utility &amp; Function&quot;</li>
                <li>Distinct horizontal &amp; diagonal stencil cuts across lowercase a, o, r, u, n, c</li>
                <li>Balanced geometric grotesque proportions; non-condensed, highly readable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Candidate List */}
        <div className="space-y-6">
          <h2 className="font-heading text-h2 font-semibold text-ink">
            Candidate Comparisons
          </h2>
          <div className="grid gap-6">
            {candidateFonts.map((candidate) => (
              <div
                key={candidate.name}
                className={`rounded-card border p-6 transition-shadow ${
                  candidate.isDefaultChoice
                    ? "border-accent bg-accent/5 ring-2 ring-accent"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-heading text-lg font-bold text-ink">
                      {candidate.name}
                    </span>
                    <span className="ml-2 rounded-pill bg-tint px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                      {candidate.category}
                    </span>
                  </div>
                  {candidate.isDefaultChoice ? (
                    <span className="rounded-pill bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                      Selected Default Match
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 rounded-control border border-line bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`${candidate.font.className} text-xl font-bold tracking-tight text-ink sm:text-2xl`}
                    >
                      Vakratund Construction
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-sm text-ink-muted">{candidate.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

