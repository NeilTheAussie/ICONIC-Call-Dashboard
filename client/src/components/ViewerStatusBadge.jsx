const STATUS_CONFIG = {
  available: { emoji: '🟢', bg: 'bg-grn/10', text: 'text-grn', label: 'Available' },
  on_call:   { emoji: '🔴', bg: 'bg-red/10', text: 'text-red', label: 'On Call' },
  break:     { emoji: '🟡', bg: 'bg-yel/10', text: 'text-yel', label: 'Break' },
  offline:   { emoji: '⚫', bg: 'bg-gry/15', text: 'text-gry', label: 'Offline' },
};

export default function ViewerStatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded ${c.bg} ${c.text}`}>
      {c.emoji} {c.label}
    </span>
  );
}
