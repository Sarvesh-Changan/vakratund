import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MotionShowcase } from "./showcase";

export const metadata: Metadata = { title: "Motion system" };

export default function MotionPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MotionShowcase />;
}
