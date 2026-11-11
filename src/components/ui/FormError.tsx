// Error banner shown at the top of a form after a failed server action.
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="text-sm text-danger bg-danger-light border border-danger/20 rounded px-3 py-2">
      {message}
    </p>
  );
}
