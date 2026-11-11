import { IconCheck } from "@/components/icons";

// Pieces shared by the two public payment flows (roster list and free-form).

export function PaymentSuccess({ message }: { message: string }) {
  return (
    <div className="bg-success-light border border-success/30 rounded-lg shadow-card p-6 text-center flex flex-col gap-3">
      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
        <IconCheck className="w-6 h-6 text-success" />
      </div>
      <div>
        <p className="font-semibold text-text-primary">Tack!</p>
        <p className="text-sm text-text-muted mt-1">{message}</p>
      </div>
    </div>
  );
}

export function NoMoneyNote() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-alt rounded-md px-3 py-2">
      <IconCheck className="w-3.5 h-3.5 text-success flex-shrink-0" strokeWidth={2.5} />
      <span>Inga kortuppgifter — Lagkassan hanterar inga pengar</span>
    </div>
  );
}
