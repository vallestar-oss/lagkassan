const STEPS = [
  "Lägg upp lag",
  "Lägg till medlemmar",
  "Skapa förfrågan",
  "Dela länken",
  "Bekräfta betalningar",
];

// Small calm progress indicator — not a tutorial modal. `current` is the
// step (1-5) the organizer is on right now; earlier steps show as done.
export function OnboardingSteps({ current }: { current: number }) {
  return (
    <div className="bg-white border border-surface-border rounded-lg p-4 shadow-card">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Så funkar det
      </p>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const done = stepNum < current;
          const active = stepNum === current;
          return (
            <li key={label} className="flex items-center gap-1">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                    done
                      ? "bg-success-light text-success"
                      : active
                      ? "bg-accent text-white"
                      : "bg-surface-alt text-text-muted"
                  }`}
                >
                  {done ? "✓" : stepNum}
                </span>
                <span
                  className={`whitespace-nowrap ${
                    active ? "text-text-primary font-medium" : "text-text-muted"
                  }`}
                >
                  {label}
                </span>
              </span>
              {stepNum < STEPS.length && (
                <span className="text-text-muted mx-1.5">→</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
