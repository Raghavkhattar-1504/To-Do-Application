export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-3 rounded bg-pending-bg px-4 py-3 text-sm text-pending-icon">
      <p className="flex-1">{message}</p>
      <button type="button" onClick={onDismiss} className="font-medium hover:underline">
        Dismiss
      </button>
    </div>
  );
}
