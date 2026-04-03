const WEIGHT_CONFIG = {
  5: { icon: '⚡', label: 'NO-SHOW', bg: 'bg-red/10', text: 'text-red', border: 'border-red/30' },
  3: { icon: '⚡', label: 'BOOKER TX', bg: 'bg-org/10', text: 'text-org', border: 'border-org/30' },
  2: { icon: '●', label: 'MISSED', bg: 'bg-blu/10', text: 'text-blu', border: 'border-blu/30' },
  1: { icon: '●', label: 'OLD LEAD', bg: 'bg-gry/15', text: 'text-gry', border: 'border-gry/30' },
};

export default function WeightBadge({ weight }) {
  const c = WEIGHT_CONFIG[weight] || WEIGHT_CONFIG[1];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}>
      {c.icon} {weight} {c.label}
    </span>
  );
}
