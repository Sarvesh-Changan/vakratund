import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";
import { loadStandaloneEnv, validateStandaloneEnvironment } from "../src/lib/standalone-env.ts";

const loaded = loadStandaloneEnv();
const parsed = validateStandaloneEnvironment(loaded.environment);
if (!parsed.success || !parsed.data.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: parsed.data.DATABASE_URL }) });
try {
  const services = await prisma.estimatorService.findMany({ include: { fields: { include: { options: true } }, rules: true } });
  const zones = await prisma.locationZone.findMany();
  for (const service of services) {
    const fields = service.fields;
    const options = fields.flatMap((field) => field.options);
    const rules = service.rules;
    const emptyRules = rules.filter((rule) => { const condition = rule.condition as Record<string, unknown>; return (Array.isArray(condition.all) && condition.all.length === 0) || (Array.isArray(condition.any) && condition.any.length === 0); });
    const isSimple = (value: unknown): boolean => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const item = value as Record<string, unknown>;
      if (Array.isArray(item.any)) return false;
      if (Array.isArray(item.all)) return item.all.length === 1 && isSimple(item.all[0]);
      const operators = ["equals", "notEquals", "in", "notIn", "gt", "gte", "lt", "lte"].filter((key) => key in item);
      const chosen = item[operators[0] ?? ""];
      return typeof item.field === "string" && operators.length === 1 && (!Array.isArray(chosen) || chosen.length === 1);
    };
    const canConvert = (value: unknown): boolean => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const item = value as Record<string, unknown>;
      return Array.isArray(item.all) && item.all.length === 1 && isSimple(item.all[0]);
    };
    const conditions = [...rules.map((rule) => rule.condition), ...fields.map((field) => field.showIf).filter(Boolean)];
    const complex = conditions.filter((entry) => !isSimple(entry)).length;
    const duplicateEffects = fields.filter((field) => field.effectType !== "NONE" && field.options.length > 0 && field.options.every((option) => option.effectType === field.effectType && Number(option.effectValue) === Number(field.effectValue))).length;
    const noneEffects = fields.filter((field) => field.effectType === "NONE" && field.effectValue !== null).length + options.filter((option) => option.effectType === "NONE" && option.effectValue !== null).length;
    const orphans = options.filter((option) => !fields.some((field) => field.id === option.fieldId)).length;
    const activeKeys = new Set(fields.filter((field) => field.isActive).map((field) => field.key));
    const references = (value: unknown): string[] => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return [];
      const item = value as Record<string, unknown>;
      if (typeof item.field === "string") return [item.field];
      return [...(Array.isArray(item.all) ? item.all.flatMap(references) : []), ...(Array.isArray(item.any) ? item.any.flatMap(references) : [])];
    };
    const unusedRules = rules.filter((rule) => references(rule.condition).some((key) => !activeKeys.has(key))).length;
    console.log(`${service.name}: ${fields.length} questions, ${options.length} choices, ${rules.length} special conditions, ${zones.length} location surcharges`);
    console.log(`  Review: ${complex} complex conditions; ${duplicateEffects} repeated question/answer price changes; ${noneEffects} no-price amounts; ${orphans} orphan choices; ${unusedRules} conditions using inactive or missing questions; ${emptyRules.length} empty conditions.`);
    console.log(`  Convertible to a simple condition: ${rules.filter((rule) => canConvert(rule.condition)).length} safe one-comparison conditions.`);
  }
  if (!services.length) console.log("No estimator services found.");
} finally { await prisma.$disconnect(); }
