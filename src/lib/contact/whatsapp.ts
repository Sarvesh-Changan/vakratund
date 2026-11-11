export type WhatsAppSettings = {
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  phones?: readonly string[] | null;
};

export type WhatsAppContext = {
  pageTitle?: string;
  projectName?: string;
  estimateReference?: string;
};

function cleanText(value: string | null | undefined, maxLength: number): string | undefined {
  const cleaned = value?.replace(/[\u0000-\u001f\u007f<>]/g, " ").trim().slice(0, maxLength);
  return cleaned || undefined;
}

function numberDigits(value: string | null | undefined): string {
  return value?.replace(/\D/g, "") ?? "";
}

export function buildWhatsAppHref(
  settings: WhatsAppSettings | null | undefined,
  context: WhatsAppContext = {},
  fallbackMessage = "Hello Vakratund Construction, I would like to discuss a project.",
): string | null {
  if (!settings) return null;
  const number = numberDigits(settings.whatsappNumber || settings.phones?.[0]);
  if (!number) return null;

  const messageParts = [
    cleanText(settings.whatsappMessage, 300) || fallbackMessage,
  ].filter((part): part is string => Boolean(part));

  return `https://wa.me/${number}?text=${encodeURIComponent(messageParts.join("\n"))}`;
}

export function buildWhatsAppShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(cleanText(text, 500) ?? "")}`;
}
