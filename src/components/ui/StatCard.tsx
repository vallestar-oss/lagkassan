import { Card } from "./Card";
import { SectionLabel } from "./SectionLabel";

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <SectionLabel>{label}</SectionLabel>
      <p className="text-lg font-bold text-text-primary font-mono mt-1 tabular-nums">{value}</p>
    </Card>
  );
}
