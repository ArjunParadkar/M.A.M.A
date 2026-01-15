interface ScoreBadgeProps {
  score: number;
  label?: string;
}

export function ScoreBadge({ score, label }: ScoreBadgeProps) {
  const percentage = Math.round(score * 100);
  const colorClass = percentage >= 80 ? 'bg-green-100 text-green-800' :
                     percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                     'bg-red-100 text-red-800';

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {label && <span className="mr-1">{label}:</span>}
      {percentage}%
    </div>
  );
}

