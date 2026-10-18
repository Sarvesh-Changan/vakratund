import type { CSSProperties, ReactNode } from "react";

type TokenName =
  | "bg"
  | "alt"
  | "surface"
  | "feature"
  | "ink"
  | "muted"
  | "onFeature"
  | "brand"
  | "brandInk"
  | "brandDeep"
  | "secondary"
  | "secondaryInk"
  | "border";

type Theme = {
  id: "theme-reference" | "theme-warm" | "theme-engineering";
  option: string;
  title: string;
  description: string;
  treatment: string;
  gradient: string;
  tokens: Record<TokenName, string>;
};

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

const themes: readonly Theme[] = [
  {
    id: "theme-reference",
    option: "Option A",
    title: "Closest to reference",
    description: "Editorial light/dark rhythm with Vakratund amber and a steel-blue supporting note.",
    treatment: "One strong project image, soft crops, low-contrast architectural overlay.",
    gradient: "linear-gradient(118deg, #fff0d7 0%, #f7d8b4 48%, #dce8ec 100%)",
    tokens: {
      bg: "#fffdfa",
      alt: "#eef1f5",
      surface: "#ffffff",
      feature: "#191a1e",
      ink: "#1d2024",
      muted: "#56616a",
      onFeature: "#ffffff",
      brand: "#d97800",
      brandInk: "#21140a",
      brandDeep: "#a44f00",
      secondary: "#52708d",
      secondaryInk: "#ffffff",
      border: "#d8dde2",
    },
  },
  {
    id: "theme-warm",
    option: "Option B",
    title: "Warm construction",
    description: "A calmer, tactile system built from warm mineral surfaces and restrained amber.",
    treatment: "Sunlit masonry tones, generous whitespace, and imagery framed like a material sample.",
    gradient: "linear-gradient(118deg, #f7d18a 0%, #e9a26a 52%, #d9c1a3 100%)",
    tokens: {
      bg: "#f8f1e7",
      alt: "#efe0cf",
      surface: "#fffaf4",
      feature: "#28231f",
      ink: "#28231f",
      muted: "#64564b",
      onFeature: "#fffaf4",
      brand: "#d87400",
      brandInk: "#241507",
      brandDeep: "#a64f00",
      secondary: "#74513b",
      secondaryInk: "#ffffff",
      border: "#ddcbb7",
    },
  },
  {
    id: "theme-engineering",
    option: "Option C",
    title: "Bold engineering",
    description: "Sharper contrast, a deep teal feature field, and a civil-engineering steel-blue accent.",
    treatment: "Technical linework and cool steel surfaces keep the orange cue focused and purposeful.",
    gradient: "linear-gradient(118deg, #f4c36c 0%, #d77900 42%, #3f8894 100%)",
    tokens: {
      bg: "#f4f6f6",
      alt: "#dfe7e9",
      surface: "#ffffff",
      feature: "#10242b",
      ink: "#17242a",
      muted: "#4b6068",
      onFeature: "#f5fbfc",
      brand: "#d77900",
      brandInk: "#201308",
      brandDeep: "#a54d00",
      secondary: "#1f6f8b",
      secondaryInk: "#ffffff",
      border: "#bfd0d4",
    },
  },
];

const contrastPairs: readonly {
  label: string;
  foreground: TokenName;
  background: TokenName;
  minimum: number;
}[] = [
  { label: "Primary text / page", foreground: "ink", background: "bg", minimum: 4.5 },
  { label: "Primary text / alternate", foreground: "ink", background: "alt", minimum: 4.5 },
  { label: "Primary text / card", foreground: "ink", background: "surface", minimum: 4.5 },
  { label: "Muted text / page", foreground: "muted", background: "bg", minimum: 4.5 },
  { label: "Muted text / alternate", foreground: "muted", background: "alt", minimum: 4.5 },
  { label: "Light text / dark section", foreground: "onFeature", background: "feature", minimum: 4.5 },
  { label: "Button text / orange", foreground: "brandInk", background: "brand", minimum: 4.5 },
  { label: "Accent text / page", foreground: "brandDeep", background: "bg", minimum: 4.5 },
  { label: "Light text / secondary", foreground: "secondaryInk", background: "secondary", minimum: 4.5 },
];

function relativeLuminance(hex: string): number {
  const channels = hex.replace("#", "").match(/../g);
  if (!channels || channels.length !== 3) return 0;

  const values = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const red = values[0] ?? 0;
  const green = values[1] ?? 0;
  const blue = values[2] ?? 0;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

function themeStyle(theme: Theme): ThemeStyle {
  return {
    "--theme-bg": theme.tokens.bg,
    "--theme-alt": theme.tokens.alt,
    "--theme-surface": theme.tokens.surface,
    "--theme-feature": theme.tokens.feature,
    "--theme-ink": theme.tokens.ink,
    "--theme-muted": theme.tokens.muted,
    "--theme-on-feature": theme.tokens.onFeature,
    "--theme-brand": theme.tokens.brand,
    "--theme-brand-ink": theme.tokens.brandInk,
    "--theme-brand-deep": theme.tokens.brandDeep,
    "--theme-secondary": theme.tokens.secondary,
    "--theme-secondary-ink": theme.tokens.secondaryInk,
    "--theme-border": theme.tokens.border,
    "--theme-gradient": theme.gradient,
  };
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--theme-muted)" }}>
      <span className="size-4 shrink-0 rounded-full border" style={{ backgroundColor: color, borderColor: "var(--theme-border)" }} />
      <span>{label}</span>
    </div>
  );
}

function SectionLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ color: dark ? "var(--theme-brand)" : "var(--theme-brand-deep)" }}
    >
      {children}
    </p>
  );
}

function ContrastTable({ theme }: { theme: Theme }) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--theme-border)", backgroundColor: "var(--theme-surface)" }}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--theme-border)" }}>
        <SectionLabel>WCAG AA contrast</SectionLabel>
        <p className="mt-1 text-xs" style={{ color: "var(--theme-muted)" }}>
          Body text target: 4.5:1. Every pair used in this specimen passes.
        </p>
      </div>
      <table className="w-full text-left text-[10px]">
        <thead style={{ color: "var(--theme-muted)" }}>
          <tr>
            <th className="px-4 py-2 font-medium">Pair</th>
            <th className="px-2 py-2 text-right font-medium">Ratio</th>
            <th className="px-4 py-2 text-right font-medium">AA</th>
          </tr>
        </thead>
        <tbody>
          {contrastPairs.map((pair) => {
            const ratio = contrastRatio(theme.tokens[pair.foreground], theme.tokens[pair.background]);
            return (
              <tr key={pair.label} className="border-t" style={{ borderColor: "var(--theme-border)" }}>
                <td className="px-4 py-2" style={{ color: "var(--theme-ink)" }}>{pair.label}</td>
                <td className="px-2 py-2 text-right font-semibold tabular-nums" style={{ color: "var(--theme-ink)" }}>{ratio.toFixed(2)}:1</td>
                <td className="px-4 py-2 text-right font-semibold" style={{ color: ratio >= pair.minimum ? "var(--theme-secondary)" : "var(--theme-brand-deep)" }}>
                  {ratio >= pair.minimum ? "Pass" : "Review"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ThemePanel({ theme }: { theme: Theme }) {
  const { tokens } = theme;

  return (
    <article data-theme={theme.id} style={themeStyle(theme)} className="overflow-hidden rounded-[28px] border shadow-[0_12px_40px_rgb(15_23_42_/_0.08)]">
      <header className="border-b p-5 sm:p-6" style={{ backgroundColor: "var(--theme-bg)", borderColor: "var(--theme-border)", color: "var(--theme-ink)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SectionLabel>{theme.option}</SectionLabel>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em]">{theme.title}</h2>
          </div>
          <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ backgroundColor: "var(--theme-brand)", color: "var(--theme-brand-ink)" }}>
            Theme
          </span>
        </div>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--theme-muted)" }}>{theme.description}</p>
        <p className="mt-3 border-t pt-3 text-xs leading-5" style={{ borderColor: "var(--theme-border)", color: "var(--theme-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--theme-ink)" }}>Image treatment:</span> {theme.treatment}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Swatch label="page" color={tokens.bg} />
          <Swatch label="alternate" color={tokens.alt} />
          <Swatch label="card" color={tokens.surface} />
          <Swatch label="dark section" color={tokens.feature} />
          <Swatch label="brand orange" color={tokens.brand} />
          <Swatch label="secondary" color={tokens.secondary} />
        </div>
      </header>

      <div style={{ backgroundColor: "var(--theme-bg)", color: "var(--theme-ink)" }}>
        <section className="relative overflow-hidden px-5 py-8 sm:px-6" style={{ backgroundColor: "var(--theme-feature)", color: "var(--theme-on-feature)" }}>
          <div aria-hidden="true" className="absolute -right-20 -top-20 size-64 rounded-full border opacity-30" style={{ borderColor: "var(--theme-secondary)" }} />
          <div aria-hidden="true" className="absolute bottom-0 right-0 h-32 w-2/3 opacity-40" style={{ backgroundImage: "linear-gradient(90deg, transparent, var(--theme-secondary))", clipPath: "polygon(20% 100%, 100% 0, 100% 100%)" }} />
          <div className="relative">
            <SectionLabel dark>Sample hero</SectionLabel>
            <h3 className="mt-3 max-w-[13ch] font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-5xl">Built with clarity. Made to last.</h3>
            <p className="mt-4 max-w-[32ch] text-sm leading-6" style={{ color: "color-mix(in srgb, var(--theme-on-feature) 76%, transparent)" }}>
              Civil engineering, project management and repair expertise for buildings that need a dependable next step.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="rounded-full px-4 py-2 text-xs font-semibold" style={{ backgroundColor: "var(--theme-brand)", color: "var(--theme-brand-ink)" }}>Get free quote</button>
              <button type="button" className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: "color-mix(in srgb, var(--theme-on-feature) 55%, transparent)", color: "var(--theme-on-feature)" }}>View projects</button>
            </div>
          </div>
          <div className="relative mt-8 h-32 overflow-hidden rounded-2xl border" style={{ borderColor: "color-mix(in srgb, var(--theme-on-feature) 20%, transparent)", backgroundImage: theme.gradient }}>
            <div className="absolute inset-x-0 bottom-0 h-2/3 opacity-45" style={{ backgroundImage: "linear-gradient(135deg, transparent 49%, var(--theme-feature) 50%), linear-gradient(45deg, transparent 49%, var(--theme-feature) 50%)", backgroundSize: "42px 42px" }} />
            <span className="absolute bottom-3 left-3 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: "rgb(255 255 255 / 0.78)", color: "var(--theme-feature)" }}>Project image / 16:9 crop</span>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-px border-y" style={{ backgroundColor: "var(--theme-border)", borderColor: "var(--theme-border)" }} aria-label="Stats sample">
          {["2003", "PMC", "Thane"].map((value, index) => (
            <div key={value} className="px-3 py-4" style={{ backgroundColor: "var(--theme-alt)" }}>
              <p className="font-heading text-xl font-semibold tracking-[-0.05em]">{value}</p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--theme-muted)" }}>{["Established", "Delivery model", "Home ground"][index]}</p>
            </div>
          ))}
        </section>

        <section className="px-5 py-7 sm:px-6" style={{ backgroundColor: "var(--theme-bg)" }}>
          <SectionLabel>Card grid</SectionLabel>
          <h3 className="mt-2 font-heading text-2xl font-semibold tracking-[-0.05em]">One system, many scopes.</h3>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Structural repair", "Waterproofing", "Turnkey works"].map((title, index) => (
              <div key={title} className="min-h-32 rounded-2xl border p-3" style={{ backgroundColor: "var(--theme-surface)", borderColor: "var(--theme-border)" }}>
                <div className="mb-5 h-9 rounded-lg" style={{ background: index === 1 ? "var(--theme-gradient)" : "linear-gradient(135deg, var(--theme-alt), var(--theme-secondary))" }} />
                <p className="text-xs font-semibold leading-4">{title}</p>
                <p className="mt-1 text-[10px] leading-4" style={{ color: "var(--theme-muted)" }}>Clear scope, steady handover.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-6 sm:px-6" style={{ backgroundColor: "var(--theme-alt)" }}>
          <SectionLabel>Process strip</SectionLabel>
          <div className="mt-4 grid grid-cols-4 gap-1">
            {["Survey", "Plan", "Build", "Handover"].map((step, index) => (
              <div key={step} className="border-l pl-2" style={{ borderColor: index === 0 ? "var(--theme-brand)" : "var(--theme-border)" }}>
                <p className="text-[10px] font-semibold" style={{ color: index === 0 ? "var(--theme-brand-deep)" : "var(--theme-ink)" }}>0{index + 1}</p>
                <p className="mt-1 text-[10px] leading-4" style={{ color: "var(--theme-muted)" }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-5 py-7 sm:px-6" style={{ background: "var(--theme-gradient)", color: "var(--theme-brand-ink)" }}>
          <SectionLabel>Conversion band</SectionLabel>
          <h3 className="mt-2 font-heading text-2xl font-semibold leading-tight tracking-[-0.05em]">Have a building question?</h3>
          <p className="mt-2 text-sm leading-6 opacity-80">Start with a clear conversation and a practical next step.</p>
          <button type="button" className="mt-5 rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: "var(--theme-brand-ink)", color: "var(--theme-brand-ink)" }}>Request site inspection</button>
        </section>

        <footer className="px-5 py-6 sm:px-6" style={{ backgroundColor: "var(--theme-feature)", color: "var(--theme-on-feature)" }}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-heading text-lg font-semibold tracking-[-0.04em]">Vakratund</p>
              <p className="mt-1 text-[10px]" style={{ color: "color-mix(in srgb, var(--theme-on-feature) 68%, transparent)" }}>Construction · PMC · Repair</p>
            </div>
            <span className="text-[10px]" style={{ color: "var(--theme-brand)" }}>Est. 2003</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[10px]" style={{ color: "color-mix(in srgb, var(--theme-on-feature) 72%, transparent)" }}>
            <span>Services</span><span>Projects</span><span>Contact</span><span>Thane · Mumbai</span>
          </div>
        </footer>
      </div>

      <div className="p-4" style={{ backgroundColor: "var(--theme-bg)" }}>
        <ContrastTable theme={theme} />
      </div>
    </article>
  );
}

export function ThemeShowcase() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 lg:px-8" style={{ backgroundColor: "#e8e5df" }}>
      <div className="mx-auto max-w-[1600px]">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f5000]">Dev-only visual review</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.06em] text-[#17130f] sm:text-6xl">Three ways to build the rhythm.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#5b5249]">A contained theme comparison for Vakratund Construction. Each wrapper owns its tokens; the live site remains unchanged.</p>
        </header>
        <div className="grid items-start gap-6 xl:grid-cols-3">
          {themes.map((theme) => <ThemePanel key={theme.id} theme={theme} />)}
        </div>
      </div>
    </main>
  );
}
