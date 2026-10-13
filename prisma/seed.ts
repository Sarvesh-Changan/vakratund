import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import type { Prisma } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { assertPasswordPolicy } from "../src/lib/auth/password-policy.ts";
import {
  loadStandaloneEnv,
  printEnvironmentLoadError,
  printValidationFailure,
  validateStandaloneEnvironment,
} from "../src/lib/standalone-env.ts";

let loadedEnvironment: ReturnType<typeof loadStandaloneEnv>;
try {
  loadedEnvironment = loadStandaloneEnv();
} catch (error) {
  printEnvironmentLoadError(error);
  process.exit(1);
}

const environmentValidation = validateStandaloneEnvironment(
  loadedEnvironment.environment,
);
if (!environmentValidation.success) {
  printValidationFailure(environmentValidation.error);
  process.exit(1);
}

const environment = environmentValidation.data;
if (!environment.DATABASE_URL) {
  console.error("Environment validation failed:\n- DATABASE_URL: missing");
  process.exit(1);
}
if (!environment.SEED_ADMIN_EMAIL) {
  console.error("Environment validation failed:\n- SEED_ADMIN_EMAIL: missing");
  process.exit(1);
}
if (!environment.SEED_ADMIN_PASSWORD) {
  console.error(
    "Environment validation failed:\n- SEED_ADMIN_PASSWORD: missing",
  );
  process.exit(1);
}
const seedAdminEmail = environment.SEED_ADMIN_EMAIL;
const seedAdminPassword = environment.SEED_ADMIN_PASSWORD;
try {
  assertPasswordPolicy(seedAdminPassword);
} catch (error) {
  if (error instanceof z.ZodError)
    printValidationFailure(error, "SEED_ADMIN_PASSWORD");
  else
    console.error(
      "Environment validation failed:\n- SEED_ADMIN_PASSWORD: invalid value",
    );
  process.exit(1);
}

const databaseUrl = environment.DATABASE_URL;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: databaseUrl }),
});
let seedStage = "initialization";

function setSeedStage(stage: string): void {
  seedStage = stage;
  console.log(`Seeding ${stage}...`);
}

type PricingMode = "ESTIMATE" | "INSPECTION_ONLY";
type ServiceSeed = {
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  scopeItems: string[];
  pricingMode: PricingMode;
  seoTitle?: string;
  seoDesc?: string;
};

type EstimatorOption = {
  value: string;
  label: string;
  description?: string;
};

type EstimatorField = {
  key: string;
  label: string;
  helpText: string;
  type: "SELECT" | "RADIO" | "NUMBER" | "MULTISELECT";
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: EstimatorOption[];
};

type FaqSeed = {
  id: string;
  question: string;
  answer: string;
  serviceSlug?: string;
};

type LocationSeed = {
  id: string;
  name: string;
  keywords: string[];
};

type ProjectSeed = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  serviceSlug: string;
  areaSqft?: number;
  floorsText?: string;
  scopeText?: string;
  status: "COMPLETED" | "ONGOING";
  progressPct?: number;
  year?: number;
};

const SERVICE_DESCRIPTION = "PLACEHOLDER — client to confirm";
const ESTIMATE_DISCLAIMER =
  "Indicative estimate. Final quotation after site inspection.";

// CONTENT.md labels this table as 11 services but enumerates 12 slugs; all 12 source rows are retained.
const services = [
  {
    slug: "building-construction",
    title: "Building Construction",
    shortDesc:
      "New residential and commercial buildings, RCC works, brick/block work and plaster.",
    description:
      "New residential and commercial buildings with RCC works, brick/block work and plaster.",
    scopeItems: [
      "New residential and commercial buildings",
      "RCC works",
      "Brick/block work",
      "Plaster",
    ],
    pricingMode: "ESTIMATE",
  },
  {
    slug: "pmc-turnkey-project-development",
    title: "PMC & Turnkey Project Development",
    shortDesc: "Project management consultant and turnkey developer services.",
    description:
      "Project management consultant and turnkey project developer services for societies and individual property owners.",
    scopeItems: [
      "Project management consultancy",
      "Turnkey project development",
      "Consultancy for self-development",
    ],
    pricingMode: "INSPECTION_ONLY",
  },
  {
    slug: "redevelopment-project-management",
    title: "Redevelopment Project Management",
    shortDesc:
      "PMC for redevelopment of old buildings and societies, including self-redevelopment consulting.",
    description:
      "PMC for redevelopment of old buildings and societies, including self-redevelopment consulting.",
    scopeItems: [
      "Redevelopment project management",
      "Old building and society redevelopment",
      "Self-redevelopment consulting",
    ],
    pricingMode: "INSPECTION_ONLY",
  },
  {
    slug: "structural-repairs-rehabilitation",
    title: "Structural Repairs & Rehabilitation",
    shortDesc:
      "Repair survey/audit, structural strengthening, polymer repairs, rebar work and restoration.",
    description:
      "Repair survey/audit and execution of repairs as repair consultant, including structural strengthening, polymer repairs, rebar process, reinforcement addition and restoration of old buildings.",
    scopeItems: [
      "Repair survey/audit",
      "Structural strengthening",
      "Polymer repairs",
      "Rebar process",
      "Reinforcement addition",
      "Restoration of old buildings",
    ],
    pricingMode: "INSPECTION_ONLY",
  },
  {
    slug: "piling-foundation",
    title: "Piling Work & Foundation",
    shortDesc: "Piling and foundation work.",
    description: "Piling and foundation work.",
    scopeItems: ["Piling work", "Foundation work"],
    pricingMode: "INSPECTION_ONLY",
  },
  {
    slug: "waterproofing-solutions",
    title: "Waterproofing Solutions",
    shortDesc:
      "Terrace waterproofing, crack treatment, grouting, parapet coating and membrane/coating systems.",
    description:
      "Terrace waterproofing, crack treatment, pressure/injection grouting, parapet coating, K-type terrace, membrane/coating systems and brick-bat coba.",
    scopeItems: [
      "Terrace waterproofing",
      "Crack treatment",
      "Pressure/injection grouting",
      "Parapet coating",
      "K-type terrace",
      "Membrane/coating systems",
    ],
    pricingMode: "ESTIMATE",
  },
  {
    slug: "damp-proofing",
    title: "Damp Proofing",
    shortDesc: "Damp-proofing treatment at plinth/ground level.",
    description:
      "Damp-proofing treatment at plinth/ground level, including the BTM building treatment referenced in the source material.",
    scopeItems: ["Damp-proofing treatment", "Plinth/ground-level treatment"],
    pricingMode: "ESTIMATE",
  },
  {
    slug: "painting-works",
    title: "Painting Works",
    shortDesc:
      "Exterior and interior painting, raincoat application on parapets and building facades.",
    description:
      "Exterior/interior painting, raincoat application on parapet and building facades.",
    scopeItems: [
      "Exterior painting",
      "Interior painting",
      "Raincoat application on parapet",
      "Building facades",
    ],
    pricingMode: "ESTIMATE",
  },
  {
    slug: "plumbing-drainage",
    title: "Plumbing & Drainage Works",
    shortDesc:
      "Internal plumbing, fixtures, drainage lines, manholes and chambers.",
    description:
      "Internal plumbing, fixtures, drainage lines, manholes and chambers.",
    scopeItems: [
      "Internal plumbing",
      "Fixtures",
      "Drainage lines",
      "Manholes/chambers",
    ],
    pricingMode: "INSPECTION_ONLY",
  },
  {
    slug: "interior-works",
    title: "Interior Works",
    shortDesc:
      "Residential interiors including TV units, kitchens, false ceilings, partitions and wooden paneling.",
    description:
      "Residential interiors including TV units, kitchens, false ceilings with cove lighting, partitions and wooden paneling.",
    scopeItems: [
      "TV units",
      "Kitchens",
      "False ceilings with cove lighting",
      "Partitions",
      "Wooden paneling",
    ],
    pricingMode: "ESTIMATE",
  },
  {
    slug: "road-works",
    title: "Road Works",
    shortDesc:
      "Road laying and repair, rolling and patch works, including government works.",
    description:
      "Road laying/repair, rolling and patch works, including government works.",
    scopeItems: [
      "Road laying/repair",
      "Rolling",
      "Patch works",
      "Government works",
    ],
    pricingMode: "INSPECTION_ONLY",
  },
  {
    slug: "fabrication-porta-house",
    title: "Fabrication Work & Porta House",
    shortDesc:
      "Light-gauge steel frame fabrication, portable houses and fencing/chain-link fabrication.",
    description:
      "Light-gauge steel frame fabrication, porta/portable houses and fencing/chain-link fabrication.",
    scopeItems: [
      "Light-gauge steel frame fabrication",
      "Porta/portable houses",
      "Fencing/chain-link fabrication",
    ],
    pricingMode: "ESTIMATE",
  },
  {
    slug: "structural-audit-thane",
    title: "Structural audit in Thane",
    shortDesc:
      "Repair survey/audit and structural repair consulting for buildings in Thane.",
    description:
      "Vakratund Construction provides repair survey/audit and execution of repairs as a repair consultant. Its source project record includes repair audit work in Hariniwas Circle, Hariniwas and Vishnunagar, Thane (W). TODO(client): approve the final local landing-page copy and service-area wording.",
    scopeItems: [
      "Repair survey/audit",
      "Structural strengthening",
      "Execution of repairs as repair consultant",
      "Restoration of old buildings",
    ],
    pricingMode: "INSPECTION_ONLY",
    seoTitle: "Structural Audit in Thane | Vakratund Construction",
    seoDesc:
      "Structural repair survey, audit and repair consulting for buildings and societies in Thane. Request a site inspection.",
  },
  {
    slug: "terrace-waterproofing-thane",
    title: "Terrace waterproofing in Thane",
    shortDesc:
      "Terrace waterproofing, crack treatment, grouting and coating systems in Thane.",
    description:
      "Vakratund Construction provides terrace waterproofing, crack treatment, pressure/injection grouting, parapet coating, K-type terrace and membrane/coating systems. TODO(client): approve the final local landing-page copy and confirm any method-specific claims.",
    scopeItems: [
      "Terrace waterproofing",
      "Crack treatment",
      "Pressure/injection grouting",
      "Parapet coating",
      "Membrane/coating systems",
    ],
    pricingMode: "ESTIMATE",
    seoTitle: "Terrace Waterproofing in Thane | Vakratund Construction",
    seoDesc:
      "Terrace waterproofing, crack treatment, grouting and coating systems in Thane. Request an indicative estimate.",
  },
  {
    slug: "society-redevelopment-pmc-thane",
    title: "Society redevelopment PMC in Thane",
    shortDesc:
      "PMC for redevelopment of old buildings and societies, including self-redevelopment consulting.",
    description:
      "Vakratund Construction provides project management consultancy for redevelopment of old buildings and societies, including self-redevelopment consulting. TODO(client): approve the final local landing-page copy and add any confirmed process or project details.",
    scopeItems: [
      "Redevelopment project management",
      "Old building and society redevelopment",
      "Self-redevelopment consulting",
    ],
    pricingMode: "INSPECTION_ONLY",
    seoTitle: "Society Redevelopment PMC in Thane | Vakratund Construction",
    seoDesc:
      "PMC for society and old-building redevelopment in Thane, including self-redevelopment consulting. Request an inspection.",
  },
] satisfies ServiceSeed[];

const teamMembers = [
  {
    id: "seed-team-salil-s-chawan",
    name: "Er. Salil S. Chawan",
    qualification: "B.E. (Construction)",
    designation: "Proprietor",
    experienceYrs: 25,
  },
  {
    id: "seed-team-suresh-nath-gharote",
    name: "Er. Suresh Nath Gharote",
    qualification: "B.E. (Civil), M.I.E.",
    designation: "Senior Associate Engineer",
    experienceYrs: 45,
  },
  {
    id: "seed-team-amit-vyapari",
    name: "Adv. Amit Vyapari",
    qualification: "B.L.S., LL.B.",
    designation: "Legal Associate",
    experienceYrs: 15,
  },
  {
    id: "seed-team-sarika-s-chawan",
    name: "Mrs. Sarika S. Chawan",
    qualification: "M.Com",
    designation: "Accountant",
    experienceYrs: 15,
  },
] as const;

const projects: ProjectSeed[] = [
  {
    id: "seed-project-kharkar-ali-15000",
    slug: "residential-commercial-building-kharkar-ali",
    title: "Residential & Commercial Building — Kharkar Ali, Thane",
    summary:
      "Residential and commercial building of approximately 15,000 sq.ft with Ground + 5 upper floors.",
    description:
      "PMC and turnkey project for a residential and commercial building.",
    serviceSlug: "pmc-turnkey-project-development",
    areaSqft: 15000,
    floorsText: "Ground + 5 upper floors",
    scopeText: "PMC & Turnkey",
    status: "COMPLETED" as const,
  },
  {
    id: "seed-project-bhandup-strong-room",
    slug: "commercial-building-strong-room-bhandup",
    title: "Commercial Building & Strong Room — Bhandup, Mumbai",
    summary:
      "Commercial building and strong room construction with strengthening of an old building, approximately 25,000 sq.ft and Ground + 5 upper floors.",
    description:
      "Turnkey and restoration works for a commercial building and strong room.",
    serviceSlug: "pmc-turnkey-project-development",
    areaSqft: 25000,
    floorsText: "Ground + 5 upper floors",
    scopeText: "Turnkey + Restoration works",
    status: "COMPLETED" as const,
  },
  {
    id: "seed-project-kharkar-ali-17000",
    slug: "residential-building-kharkar-ali",
    title: "Residential Building — Kharkar Ali, Thane",
    summary:
      "Residential building of approximately 17,000 sq.ft with Stilt + 7 upper floors.",
    description: "PMC and turnkey project for a residential building.",
    serviceSlug: "pmc-turnkey-project-development",
    areaSqft: 17000,
    floorsText: "Stilt + 7 upper floors",
    scopeText: "PMC & Turnkey",
    status: "ONGOING" as const,
    progressPct: 90,
  },
  {
    id: "seed-project-hariniwas-12-storey",
    slug: "structural-repair-audit-hariniwas-12-storey",
    title: "Structural Repair Audit — Hariniwas, Thane — 12 Storeys",
    summary:
      "Repair survey/audit and execution of repairs as repair consultant for a Stilt + 12 storey building.",
    description:
      "Repair survey/audit and execution of repairs as repair consultant.",
    serviceSlug: "structural-repairs-rehabilitation",
    floorsText: "Stilt + 12 storey building",
    status: "COMPLETED" as const,
  },
  {
    id: "seed-project-hariniwas-9-storey",
    slug: "structural-repair-audit-hariniwas-9-storey",
    title: "Structural Repair Audit — Hariniwas, Thane — 9 Storeys",
    summary:
      "Repair survey/audit and execution of repairs as repair consultant for a Stilt + 9 storey building.",
    description:
      "Repair survey/audit and execution of repairs as repair consultant.",
    serviceSlug: "structural-repairs-rehabilitation",
    floorsText: "Stilt + 9 storey building",
    status: "COMPLETED" as const,
  },
  {
    id: "seed-project-vishnunagar-audit",
    slug: "structural-repair-audit-vishnunagar",
    title: "Structural Repair Audit — Vishnunagar, Thane",
    summary: "Repair survey and repair audit.",
    description: "Repair survey and repair audit.",
    serviceSlug: "structural-repairs-rehabilitation",
    status: "COMPLETED" as const,
    year: 2026,
  },
] as const;

const faqs: FaqSeed[] = [
  {
    id: "seed-faq-01",
    question: "What is a structural audit and when does a society need one?",
    answer:
      "The company provides repair surveys/audits and structural repairs and rehabilitation. TODO(client): approve the explanation of when a society should commission an audit.",
    serviceSlug: "structural-repairs-rehabilitation",
  },
  {
    id: "seed-faq-02",
    question: "How do you handle terrace leakage permanently?",
    answer:
      "Waterproofing services include terrace waterproofing, crack treatment, pressure/injection grouting, parapet coating, K-type terrace and membrane/coating systems. TODO(client): approve the final method guidance.",
    serviceSlug: "waterproofing-solutions",
  },
  {
    id: "seed-faq-03",
    question:
      "What does a PMC (Project Management Consultant) do in a redevelopment project?",
    answer:
      "Redevelopment project management includes PMC for redevelopment of old buildings and societies and self-redevelopment consulting.",
    serviceSlug: "redevelopment-project-management",
  },
  {
    id: "seed-faq-04",
    question:
      "What is the difference between turnkey development and PMC services?",
    answer:
      "The source material identifies PMC and turnkey project development as a positioning area. TODO(client): confirm the detailed commercial distinction before publishing.",
    serviceSlug: "pmc-turnkey-project-development",
  },
  {
    id: "seed-faq-05",
    question:
      "How long does structural repair of a 9–12 storey building usually take?",
    answer:
      "The source material lists repair work on Stilt + 9 and Stilt + 12 storey buildings. TODO(client): confirm typical duration guidance.",
    serviceSlug: "structural-repairs-rehabilitation",
  },
  {
    id: "seed-faq-06",
    question: "Do you work on government or society projects?",
    answer:
      "The company has executed government projects, maintenance works and road works, and provides services for co-operative housing societies.",
  },
  {
    id: "seed-faq-07",
    question: "Are your workers insured?",
    answer:
      "The firm is covered by a workmen's compensation insurance policy under the Maharashtra Government Act of Labour Insurance.",
  },
  {
    id: "seed-faq-08",
    question: "Which areas do you serve?",
    answer:
      "The source material names Thane and Mumbai, Maharashtra. TODO(client): confirm the service-area wording, including whether Navi Mumbai and areas outside MMR should be published.",
  },
  {
    id: "seed-faq-09",
    question: "How accurate is the online estimate?",
    answer:
      "TODO(client): confirm estimator accuracy guidance. Estimates must remain indicative and the final quotation should follow site inspection.",
  },
  {
    id: "seed-faq-10",
    question: "What are the payment terms?",
    answer:
      "TODO(client): provide approved payment terms before publishing this FAQ.",
  },
  {
    id: "seed-faq-11",
    question: "Do you provide warranty on waterproofing?",
    answer:
      "TODO(client): confirm whether any waterproofing warranty is offered. Do not publish a warranty claim until confirmed.",
    serviceSlug: "waterproofing-solutions",
  },
  {
    id: "seed-faq-12",
    question: "How do I request a site inspection?",
    answer:
      "The estimator includes an inspection-only enquiry path. TODO(client): confirm the preferred contact process and contact details.",
  },
];

const locations: LocationSeed[] = [
  { id: "seed-zone-thane", name: "Thane", keywords: ["thane", "thane west"] },
  {
    id: "seed-zone-mumbai-suburbs",
    name: "Mumbai suburbs",
    keywords: ["mumbai", "mumbai suburbs", "bhandup"],
  },
  {
    id: "seed-zone-navi-mumbai",
    name: "Navi Mumbai",
    keywords: ["navi mumbai"],
  },
  {
    id: "seed-zone-outside-mmr",
    name: "Outside MMR",
    keywords: ["outside mmr", "outside mumbai metropolitan region"],
  },
];

const blogCategories = [
  { slug: "construction", name: "Construction" },
  { slug: "structural-repairs", name: "Structural Repairs" },
  { slug: "waterproofing", name: "Waterproofing" },
  { slug: "project-management", name: "Project Management" },
] as const;

const pageSections = [
  {
    id: "seed-section-home-hero",
    pageKey: "home",
    sectionKey: "hero",
    content: {
      eyebrow: "Project Management Consultant & Turnkey Project Developers",
      title: "Building trust since 2003",
      description:
        "Civil engineering services for project management, repairs and rehabilitation of RCC structures, and construction of new buildings.",
      primaryCta: "Get Free Quote",
      secondaryCta: "Call Now",
    },
  },
  {
    id: "seed-section-home-stats",
    pageKey: "home",
    sectionKey: "stats",
    content: {
      items: [
        { label: "Established", value: "2003" },
        { label: "Region", value: "Thane and Mumbai" },
      ],
    },
  },
  {
    id: "seed-section-home-process",
    pageKey: "home",
    sectionKey: "process",
    content: {
      title: "Our process",
      steps: ["Survey", "Plan", "Execute", "Handover"],
    },
  },
  {
    id: "seed-section-home-cta",
    pageKey: "home",
    sectionKey: "cta",
    content: {
      title: "Quality is our first priority",
      primaryCta: "Get Free Quote",
      secondaryCta: "Request Site Inspection",
    },
  },
  {
    id: "seed-section-about-story",
    pageKey: "about",
    sectionKey: "story",
    content: {
      title: "About Vakratund Construction",
      body: "M/s. Vakratund Construction is a civil engineering concern specialized in project management, repairs and rehabilitation of RCC structures, and construction of new buildings. The firm was established in 2003 and has carried out turnkey construction projects as well as repair and rehabilitation projects in the region.",
    },
  },
  {
    id: "seed-section-about-mission",
    pageKey: "about",
    sectionKey: "mission",
    content: {
      title: "Our aim",
      body: "To provide genuine civil engineering services and solutions to corporate offices and co-operative housing societies facing problems such as terrace leakages, plaster damage and structural failure of RCC members.",
    },
  },
] satisfies Array<{
  id: string;
  pageKey: string;
  sectionKey: string;
  content: Prisma.InputJsonValue;
}>;

const pageSeo = [
  {
    path: "/",
    title: "Vakratund Construction — Civil Engineering Since 2003",
    description:
      "Project management, turnkey development, structural repairs, rehabilitation and construction services in Thane and Mumbai.",
  },
  {
    path: "/about",
    title: "About Vakratund Construction",
    description:
      "Learn about Vakratund Construction's civil engineering, repair and rehabilitation experience.",
  },
  {
    path: "/services",
    title: "Civil Engineering Services",
    description:
      "Explore construction, PMC, redevelopment, structural repair, waterproofing and related services.",
  },
  {
    path: "/projects",
    title: "Projects",
    description:
      "Selected construction, turnkey, repair survey and rehabilitation projects.",
  },
  {
    path: "/blog",
    title: "Construction Insights",
    description:
      "Insights on construction, structural repairs, project management and waterproofing.",
  },
  {
    path: "/faqs",
    title: "Frequently Asked Questions",
    description:
      "Answers about Vakratund Construction services and project enquiries.",
  },
  {
    path: "/contact",
    title: "Contact Vakratund Construction",
    description:
      "Contact Vakratund Construction for project management, repair, construction and inspection enquiries.",
  },
  {
    path: "/estimate",
    title: "Get an Indicative Estimate",
    description:
      "Request an indicative project estimate. Final quotation follows site inspection.",
  },
  {
    path: "/testimonials",
    title: "Testimonials",
    description:
      "Read published client feedback about Vakratund Construction.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Read how Vakratund Construction handles enquiry information and privacy requests.",
  },
  {
    path: "/terms",
    title: "Terms of Use",
    description:
      "Read the terms for using the Vakratund Construction website and project enquiries.",
  },
] as const;

function fieldsForService(service: ServiceSeed): EstimatorField[] {
  const common: EstimatorField[] = [
    {
      key: "area",
      label: "Project area (sq ft)",
      helpText:
        "TODO(client): confirm the allowed area range for this service.",
      type: "NUMBER",
      required: true,
      min: 100,
      max: 100000,
      step: 100,
    },
    {
      key: "floors",
      label: "Number of floors",
      helpText:
        "TODO(client): confirm whether floor count is required for this service.",
      type: "NUMBER",
      required: false,
      min: 1,
      max: 100,
      step: 1,
    },
    {
      key: "location",
      label: "Project location",
      helpText: "Select the closest configured location zone.",
      type: "SELECT",
      required: true,
      options: locations.map((location) => ({
        value: location.id.replace("seed-zone-", ""),
        label: location.name,
      })),
    },
  ];

  if (service.pricingMode === "INSPECTION_ONLY") return common;

  const addOns: Record<string, EstimatorOption[]> = {
    "building-construction": ["rcc-works", "brick-block-work", "plaster"].map(
      (value) => ({ value, label: value.replaceAll("-", " ") }),
    ),
    "waterproofing-solutions": [
      "crack-treatment",
      "pressure-injection-grouting",
      "parapet-coating",
    ].map((value) => ({ value, label: value.replaceAll("-", " ") })),
    "damp-proofing": [{ value: "plinth-treatment", label: "Plinth treatment" }],
    "painting-works": [
      { value: "raincoat-parapet", label: "Raincoat application on parapet" },
      { value: "building-facades", label: "Building facades" },
    ],
    "interior-works": [
      "tv-units",
      "kitchens",
      "false-ceilings-cove-lighting",
      "partitions",
      "wooden-paneling",
    ].map((value) => ({ value, label: value.replaceAll("-", " ") })),
    "fabrication-porta-house": [
      { value: "porta-house", label: "Porta House" },
      { value: "chain-link-fencing", label: "Chain-link fencing" },
    ],
  };

  return [
    ...common,
    {
      key: "specification",
      label: "Specification level",
      helpText:
        "TODO(client): confirm specification levels and their pricing effects.",
      type: "RADIO",
      required: true,
      options: [
        { value: "standard", label: "Standard" },
        { value: "premium", label: "Premium" },
      ],
    },
    {
      key: "add-ons",
      label: "Add-ons",
      helpText: "TODO(client): confirm available add-ons and pricing effects.",
      type: "MULTISELECT",
      required: false,
      options: addOns[service.slug] ?? [],
    },
  ];
}

async function main() {
  const serviceIds = new Map<string, string>();

  setSeedStage("admin account");
  const seedEmail = seedAdminEmail.trim().toLowerCase();
  const seedPassword = seedAdminPassword;
  const user = await prisma.user.upsert({
    where: { email: seedEmail },
    create: {
      name: "Vakratund Administrator",
      email: seedEmail,
      emailVerified: true,
      role: "SUPER_ADMIN",
      isActive: true,
      mustChangePassword: true,
    },
    update: {
      emailVerified: true,
      role: "SUPER_ADMIN",
      isActive: true,
      mustChangePassword: true,
    },
  });
  const passwordHash = await hashPassword(seedPassword);
  const credentialAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });
  if (credentialAccount) {
    await prisma.account.update({
      where: { id: credentialAccount.id },
      data: { accountId: user.id, password: passwordHash },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
  }
  console.log("admin user ready: SUPER_ADMIN");

  setSeedStage("site settings");
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      businessName: "M/s. Vakratund Construction",
      tagline: "Quality is our first priority",
      phones: ["+919821502956", "+919359895322"],
      whatsappNumber: "+919821502956",
      credentials: [
        {
          label: "MSME registration",
          value: "Registered with MSME, Government of India",
        },
        {
          label: "Workmen's compensation insurance",
          value:
            "Covered by workmen's compensation insurance policy under the Maharashtra Government Act of Labour Insurance",
        },
      ],
      notifyEmails: [],
      foundedYear: 2003,
    },
    update: {},
  });

  setSeedStage("services");
  for (const service of services) {
    const row = await prisma.service.upsert({
      where: { slug: service.slug },
      create: {
        slug: service.slug,
        title: service.title,
        shortDesc: service.shortDesc,
        description: service.description,
        scopeItems: service.scopeItems,
        iconKey: null,
        status: "PUBLISHED",
        isFeatured: false,
        sortOrder: services.indexOf(service),
        seoTitle: service.seoTitle ?? null,
        seoDesc: service.seoDesc ?? null,
      },
      update: {},
    });
    serviceIds.set(service.slug, row.id);
  }

  setSeedStage("team members");
  for (const member of teamMembers) {
    await prisma.teamMember.upsert({
      where: { id: member.id },
      create: {
        ...member,
        isVisible: true,
        sortOrder: teamMembers.indexOf(member),
      },
      update: {},
    });
  }

  setSeedStage("projects");
  for (const project of projects) {
    const serviceId = serviceIds.get(project.serviceSlug);
    if (!serviceId)
      throw new Error(`Missing service for project ${project.slug}`);
    await prisma.project.upsert({
      where: { slug: project.slug },
      create: {
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        description: project.description,
        areaSqft: project.areaSqft,
        floorsText: project.floorsText,
        scopeText: project.scopeText,
        status: project.status,
        progressPct: project.progressPct,
        year: project.year,
        serviceId,
        publishStatus: "DRAFT",
        showClientName: false,
        isFeatured: false,
        sortOrder: projects.indexOf(project),
      },
      update: {},
    });
  }

  setSeedStage("FAQs");
  for (const faq of faqs) {
    const serviceId = faq.serviceSlug
      ? serviceIds.get(faq.serviceSlug)
      : undefined;
    if (faq.serviceSlug && !serviceId)
      throw new Error(`Missing service for FAQ ${faq.id}`);
    await prisma.faq.upsert({
      where: { id: faq.id },
      create: {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        serviceId,
        status: "DRAFT",
        sortOrder: faqs.indexOf(faq),
      },
      update: {},
    });
  }

  setSeedStage("page sections");
  for (const section of pageSections) {
    await prisma.pageSection.upsert({
      where: {
        pageKey_sectionKey: {
          pageKey: section.pageKey,
          sectionKey: section.sectionKey,
        },
      },
      create: section,
      update: {},
    });
  }

  setSeedStage("page SEO");
  for (const seo of pageSeo) {
    await prisma.pageSeo.upsert({
      where: { path: seo.path },
      create: seo,
      update: {},
    });
  }

  setSeedStage("blog categories");
  for (const category of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { slug: category.slug },
      create: category,
      update: {},
    });
  }

  setSeedStage("gallery categories");
  const galleryCategories = [
    { name: "Waterproofing", slug: "waterproofing" },
    { name: "Structural Repairs", slug: "structural-repairs" },
    { name: "Painting", slug: "painting" },
    { name: "Interiors", slug: "interiors" },
    { name: "Fabrication & Porta House", slug: "fabrication-porta-house" },
    { name: "Building Construction", slug: "building-construction" },
  ];
  for (const [sortOrder, category] of galleryCategories.entries()) {
    const existing = await prisma.galleryCategory.findFirst({
      where: { name: { equals: category.name, mode: "insensitive" } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.galleryCategory.create({
        data: { ...category, sortOrder },
      });
    }
  }

  setSeedStage("location zones");
  for (const location of locations) {
    await prisma.locationZone.upsert({
      where: { id: location.id },
      create: {
        ...location,
        keywords: [...location.keywords],
        multiplierPct: 0,
        isActive: true,
        sortOrder: locations.indexOf(location),
      },
      update: {},
    });
  }

  setSeedStage("estimator services and fields");
  for (const service of services) {
    setSeedStage(`estimator service ${service.slug}`);
    const serviceId = serviceIds.get(service.slug);
    if (!serviceId)
      throw new Error(`Missing service for estimator ${service.slug}`);
    const estimator = await prisma.estimatorService.upsert({
      where: { slug: service.slug },
      create: {
        id: `seed-estimator-${service.slug}`,
        serviceId,
        slug: service.slug,
        name: service.title,
        description: SERVICE_DESCRIPTION,
        pricingMode: service.pricingMode,
        unit: "SQFT",
        baseRate: 0,
        minCharge: 0,
        minArea: 100,
        maxArea: 100000,
        spreadPercent: 0,
        roundTo: 100,
        disclaimer: ESTIMATE_DISCLAIMER,
        version: 1,
        isActive: true,
        sortOrder: services.indexOf(service),
      },
      update: {},
    });

    const fields = fieldsForService(service);
    for (const [fieldIndex, field] of fields.entries()) {
      const fieldRow = await prisma.estimatorField.upsert({
        where: {
          estimatorServiceId_key: {
            estimatorServiceId: estimator.id,
            key: field.key,
          },
        },
        create: {
          id: `seed-field-${service.slug}-${field.key}`,
          estimatorServiceId: estimator.id,
          key: field.key,
          label: field.label,
          helpText: field.helpText,
          type: field.type,
          required: field.required,
          sortOrder: fieldIndex,
          min: field.min,
          max: field.max,
          step: field.step,
          effectType: "NONE",
          effectValue: null,
          isActive: true,
        },
        update: {},
      });

      for (const option of field.options ?? []) {
        await prisma.fieldOption.upsert({
          where: {
            fieldId_value: { fieldId: fieldRow.id, value: option.value },
          },
          create: {
            id: `seed-option-${service.slug}-${field.key}-${option.value}`,
            fieldId: fieldRow.id,
            value: option.value,
            label: option.label,
            description: option.description,
            effectType: "NONE",
            effectValue: null,
            sortOrder: (field.options ?? []).indexOf(option),
            isActive: true,
          },
          update: {},
        });
      }
    }
  }

  setSeedStage("final row counts");
  const countQueries = [
    ["User", prisma.user.count()],
    ["Account", prisma.account.count()],
    ["SiteSetting", prisma.siteSetting.count()],
    ["Service", prisma.service.count()],
    ["TeamMember", prisma.teamMember.count()],
    ["Project", prisma.project.count()],
    ["Faq", prisma.faq.count()],
    ["PageSection", prisma.pageSection.count()],
    ["PageSeo", prisma.pageSeo.count()],
    ["BlogCategory", prisma.blogCategory.count()],
    ["LocationZone", prisma.locationZone.count()],
    ["EstimatorService", prisma.estimatorService.count()],
    ["EstimatorField", prisma.estimatorField.count()],
    ["FieldOption", prisma.fieldOption.count()],
    ["PricingRule", prisma.pricingRule.count()],
  ] as const;
  const counts = await Promise.all(
    countQueries.map(async ([table, count]) => [table, await count] as const),
  );

  console.log("Seed complete. Row counts:");
  for (const [table, count] of counts) console.log(`  ${table}: ${count}`);
}

main()
  .catch((error: unknown) => {
    const details =
      typeof error === "object" && error !== null
        ? (error as { name?: unknown; code?: unknown })
        : {};
    const prototypeName =
      typeof error === "object" && error !== null
        ? Object.getPrototypeOf(error)?.constructor?.name
        : undefined;
    const name =
      typeof details.name === "string"
        ? details.name
        : typeof prototypeName === "string"
          ? prototypeName
          : "UnknownError";
    const code = typeof details.code === "string" ? ` (${details.code})` : "";
    if (name === "ErrorEvent") console.error(`Seed failed during ${seedStage}: database connection error. Check database availability and network access.`);
    else if (name === "PrismaClientValidationError") console.error(`Seed failed during ${seedStage}: invalid Prisma seed input.`);
    else if (name.startsWith("PrismaClient")) console.error(`Seed failed during ${seedStage}: database operation failed${code}.`);
    else console.error(`Seed failed during ${seedStage}: unexpected error${code}.`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
