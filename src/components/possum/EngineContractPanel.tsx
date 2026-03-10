"use client";

export default function EngineContractPanel({
  engineKey,
  title,
  intro,
  related = [],
}: {
  engineKey: string;
  title?: string;
  intro?: string;
  related?: Array<{ label: string; route: string; reason?: string }>;
}) {
  void engineKey;
  void title;
  void intro;
  void related;
  return null;
}
