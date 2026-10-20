import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import {
  clausesToCondition,
  type EstimatorServiceAdminInput,
  type LocationZoneAdminInput,
} from "@/lib/validation/estimator-admin";

export type EstimatorAdminService = EstimatorServiceAdminInput & {
  slug: string;
  name: string;
  fields: EstimatorServiceAdminInput["fields"];
  rules: EstimatorServiceAdminInput["rules"];
};
export type EstimatorAdminData = {
  services: EstimatorAdminService[];
  zones: LocationZoneAdminInput[];
};

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const adminInclude = {
  fields: {
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  },
  rules: { orderBy: [{ order: "asc" }, { id: "asc" }] },
} satisfies Prisma.EstimatorServiceInclude;

type AdminClause = {
  field: string;
  operator:
    "equals" | "notEquals" | "in" | "notIn" | "gt" | "gte" | "lt" | "lte";
  value: string | number | boolean;
};

function toClauses(condition: unknown): AdminClause[] {
  const record =
    condition && typeof condition === "object" && !Array.isArray(condition)
      ? (condition as { all?: unknown[]; field?: unknown })
      : null;
  const items = Array.isArray(record?.all)
    ? record.all
    : record
      ? [record]
      : [];
  return items.flatMap((entry) => {
    const item =
      entry && typeof entry === "object" && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : null;
    if (!item || typeof item.field !== "string") return [];
    const operator = [
      "equals",
      "notEquals",
      "in",
      "notIn",
      "gt",
      "gte",
      "lt",
      "lte",
    ].find((key) => key in item) as AdminClause["operator"] | undefined;
    const rawValue = operator ? item[operator] : undefined;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    return operator &&
      (typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean")
      ? [{ field: item.field, operator, value }]
      : [];
  });
}

export async function getEstimatorAdminData(): Promise<EstimatorAdminData> {
  const [services, zones] = await Promise.all([
    prisma.estimatorService.findMany({
      include: adminInclude,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.locationZone.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);
  return {
    services: services.map((service) => ({
      id: service.id,
      slug: service.slug,
      name: service.name,
      isActive: service.isActive,
      pricingMode: String(
        service.pricingMode,
      ) as EstimatorAdminService["pricingMode"],
      unit: String(service.unit) as EstimatorAdminService["unit"],
      baseRate: Number(service.baseRate),
      minCharge: Number(service.minCharge),
      minArea: service.minArea,
      maxArea: service.maxArea,
      spreadPercent: Number(service.spreadPercent),
      roundTo: service.roundTo,
      sortOrder: service.sortOrder,
      disclaimer: service.disclaimer,
      includedText: service.includedText,
      notIncludedText: service.notIncludedText,
      fields: service.fields.map((field) => ({
        key: field.key,
        label: field.label,
        helpText: field.helpText,
        shortHelp: field.shortHelp,
        type: String(
          field.type,
        ) as EstimatorAdminService["fields"][number]["type"],
        required: field.required,
        isAdvanced: field.isAdvanced,
        sortOrder: field.sortOrder,
        min: field.min,
        max: field.max,
        step: field.step,
        defaultValue: field.defaultValue,
        presetValues: field.presetValues,
        unitLabel: field.unitLabel,
        showIf: toClauses(field.showIf)[0] ?? null,
        effectType: String(
          field.effectType,
        ) as EstimatorAdminService["fields"][number]["effectType"],
        effectValue: numberOrNull(field.effectValue),
        options: field.options.map((option) => ({
          value: option.value,
          label: option.label,
          description: option.description,
          effectType: String(
            option.effectType,
          ) as EstimatorAdminService["fields"][number]["options"][number]["effectType"],
          effectValue: numberOrNull(option.effectValue),
          sortOrder: option.sortOrder,
          isActive: option.isActive,
        })),
        isActive: field.isActive,
      })),
      rules: service.rules.flatMap((rule) => {
        const clauses = toClauses(rule.condition);
        return clauses.length
          ? [
              {
                id: rule.id,
                name: rule.name,
                order: rule.order,
                condition: { all: clauses },
                effectType: String(
                  rule.effectType,
                ) as EstimatorAdminService["rules"][number]["effectType"],
                effectValue: Number(rule.effectValue),
                isActive: rule.isActive,
              },
            ]
          : [];
      }),
    })),
    zones: zones.map((zone) => ({
      id: zone.id,
      name: zone.name,
      keywords: zone.keywords,
      multiplierPct: Number(zone.multiplierPct),
      sortOrder: zone.sortOrder,
      isActive: zone.isActive,
    })),
  };
}

export function nextEstimatorVersion(version: number): number {
  return version + 1;
}

function summary(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function saveEstimatorService(
  input: EstimatorServiceAdminInput,
  userId: string,
): Promise<{ version: number }> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.estimatorService.findUnique({
      where: { id: input.id },
      include: adminInclude,
    });
    if (!before) throw new Error("Estimator service not found.");
    const version = nextEstimatorVersion(before.version);
    const updated = await tx.estimatorService.update({
      where: { id: input.id },
      data: {
        isActive: input.isActive,
        pricingMode: input.pricingMode,
        unit: input.unit,
        baseRate: input.baseRate,
        minCharge: input.minCharge,
        minArea: input.minArea,
        maxArea: input.maxArea,
        spreadPercent: input.spreadPercent,
        roundTo: input.roundTo,
        sortOrder: input.sortOrder,
        disclaimer: input.disclaimer || null,
        includedText: input.includedText,
        notIncludedText: input.notIncludedText,
        version,
      },
      select: { id: true, slug: true, version: true },
    });
    await tx.estimatorField.deleteMany({
      where: { estimatorServiceId: input.id },
    });
    for (const field of input.fields) {
      const createdField = await tx.estimatorField.create({
        data: {
          estimatorServiceId: input.id,
          key: field.key,
          label: field.label,
          helpText: field.helpText || null,
          shortHelp: field.shortHelp || null,
          type: field.type,
          required: field.required,
          isAdvanced: field.isAdvanced,
          sortOrder: field.sortOrder,
          min: field.min,
          max: field.max,
          step: field.step,
          defaultValue: field.defaultValue || null,
          presetValues: field.presetValues,
          unitLabel: field.unitLabel || null,
          showIf: field.showIf
            ? (clausesToCondition([field.showIf]) as Prisma.InputJsonValue)
            : undefined,
          effectType: field.effectType,
          effectValue: field.effectValue,
          isActive: field.isActive,
        },
        select: { id: true },
      });
      if (field.options.length)
        await tx.fieldOption.createMany({
          data: field.options.map((option) => ({
            fieldId: createdField.id,
            value: option.value,
            label: option.label,
            description: option.description || null,
            effectType: option.effectType,
            effectValue: option.effectValue,
            sortOrder: option.sortOrder,
            isActive: option.isActive,
          })),
        });
    }
    await tx.pricingRule.deleteMany({
      where: { estimatorServiceId: input.id },
    });
    if (input.rules.length)
      await tx.pricingRule.createMany({
        data: input.rules.map((rule) => ({
          estimatorServiceId: input.id,
          name: rule.name,
          order: rule.order,
          condition: clausesToCondition(
            rule.condition.all,
          ) as Prisma.InputJsonValue,
          effectType: rule.effectType,
          effectValue: rule.effectValue,
          isActive: rule.isActive,
        })),
      });
    await tx.activityLog.create({
      data: {
        userId,
        action: "estimator.update",
        entityType: "EstimatorService",
        entityId: input.id,
        summary: `Updated estimator ${updated.slug}`,
        diff: {
          before: summary({
            ...before,
            fields: before.fields.map((field) => ({
              key: field.key,
              isActive: field.isActive,
            })),
            rules: before.rules.map((rule) => ({
              id: rule.id,
              isActive: rule.isActive,
            })),
          }),
          after: summary(input),
          version,
        },
      },
    });
    return { version };
  });
}

export async function saveLocationZones(
  input: { zones: LocationZoneAdminInput[] },
  userId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const before = await tx.locationZone.findMany();
    const incomingIds = new Set(
      input.zones.flatMap((zone) => (zone.id ? [zone.id] : [])),
    );
    for (const zone of before)
      if (!incomingIds.has(zone.id))
        await tx.locationZone.delete({ where: { id: zone.id } });
    for (const zone of input.zones) {
      const data = {
        name: zone.name,
        keywords: zone.keywords,
        multiplierPct: zone.multiplierPct,
        sortOrder: zone.sortOrder,
        isActive: zone.isActive,
      };
      if (zone.id)
        await tx.locationZone.update({ where: { id: zone.id }, data });
      else await tx.locationZone.create({ data });
    }
    await tx.estimatorService.updateMany({
      data: { version: { increment: 1 } },
    });
    await tx.activityLog.create({
      data: {
        userId,
        action: "estimator.locationZones.update",
        entityType: "LocationZone",
        summary: "Updated estimator location zones",
        diff: {
          before: summary(
            before.map((zone) => ({
              id: zone.id,
              name: zone.name,
              multiplierPct: Number(zone.multiplierPct),
              isActive: zone.isActive,
            })),
          ),
          after: summary(input.zones),
        },
      },
    });
  });
}
