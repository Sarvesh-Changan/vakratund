import { describe, expect, it } from "vitest";
import { settingsSchema } from "@/lib/validation/settings";

const base = { businessName: "Vakratund", tagline: "", phones: [], email: "", whatsappNumber: "", whatsappMessage: "", address: "", mapEmbedUrl: "", businessHours: Object.fromEntries(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => [day, { closed: false, open: "09:00", close: "18:00" }])), socials: [], credentials: [], notifyEmails: [], foundedYear: 2003 };
describe("settings validation", () => {
  it("allows approved Google Maps URLs", () => expect(settingsSchema.safeParse({ ...base, mapEmbedUrl: "https://www.google.com/maps/embed?pb=test" }).success).toBe(true));
  it("rejects non-Google map URLs", () => expect(settingsSchema.safeParse({ ...base, mapEmbedUrl: "https://evil.example/maps" }).success).toBe(false));
  it("rejects HTML in business content", () => expect(settingsSchema.safeParse({ ...base, businessName: "<script>x</script>" }).success).toBe(false));
});
