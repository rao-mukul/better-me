import Card from '../ui/Card';

export default function InsightCard({ icon: Icon, label, value, unit, color = 'text-primary' }) {
  return (
    <Card className="flex flex-col items-center text-center py-5">
      <Icon size={20} className={`${color} mb-2`} />
      <p className={`text-xl font-bold ${color} tabular-nums`}>
        {value}
        {unit && <span className="text-xs font-medium text-text-secondary ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </Card>
  );
}
