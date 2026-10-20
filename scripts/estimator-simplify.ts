import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";
import { loadStandaloneEnv, validateStandaloneEnvironment } from "../src/lib/standalone-env.ts";

const apply = process.argv.includes("--apply");
const loaded = loadStandaloneEnv();
const parsed = validateStandaloneEnvironment(loaded.environment);
if (!parsed.success || !parsed.data.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: parsed.data.DATABASE_URL }) });
const presetByKey: Record<string, { presets?: number[]; unitLabel?: string; shortHelp: string }> = {
  area: { presets: [600, 800, 1200, 1500], unitLabel: "sq ft", shortHelp: "A rough area is enough for an indicative range." },
  floors: { presets: [1, 2, 3, 4], unitLabel: "floors", shortHelp: "Choose the closest floor count." },
  location: { shortHelp: "Location helps us account for local site conditions." },
  specification: { shortHelp: "You can discuss the final specification during the site visit." },
  "add-ons": { shortHelp: "These choices are optional and can be discussed later." },
};

try {
  const fields = await prisma.estimatorField.findMany({ include: { estimatorService: { select: { slug: true, name: true } } }, orderBy: [{ estimatorServiceId: "asc" }, { sortOrder: "asc" }] });
  if (fields.length === 0) console.log("No estimator fields found.");
  for (const field of fields) {
    const edited = field.updatedAt.getTime() > field.createdAt.getTime();
    const preset = presetByKey[field.key];
    const isAdvanced = field.key === "add-ons" || field.isAdvanced;
    const changes: Record<string, unknown> = {};
    if (isAdvanced !== field.isAdvanced) changes.isAdvanced = isAdvanced;
    if (field.key === "location" && field.required) changes.required = false;
    if (preset?.presets && field.presetValues.length === 0) changes.presetValues = preset.presets;
    if (preset?.unitLabel && !field.unitLabel) changes.unitLabel = preset.unitLabel;
    if (preset?.shortHelp && !field.shortHelp) changes.shortHelp = preset.shortHelp;
    if (Object.keys(changes).length === 0) continue;
    const prefix = edited ? "SKIP (admin edited)" : apply ? "APPLY" : "DRY-RUN";
    console.log(`${prefix}: ${field.estimatorService.name} / ${field.label} [${field.key}] -> ${JSON.stringify(changes)}`);
    if (!apply || edited) continue;
    await prisma.estimatorField.update({ where: { id: field.id }, data: changes });
  }
  if (!apply) console.log("Dry run complete. Re-run with --apply to write these changes.");
  else console.log("Estimator simplification applied.");
} finally {
  await prisma.$disconnect();
}
