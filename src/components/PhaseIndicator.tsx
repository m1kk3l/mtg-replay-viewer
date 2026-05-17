interface Props {
  label: string;
}

const phaseColors: Record<string, string> = {
  Phase_Beginning: 'bg-blue-900 text-blue-200',
  Phase_Main1: 'bg-green-900 text-green-200',
  Phase_Combat: 'bg-red-900 text-red-200',
  Phase_Main2: 'bg-green-900 text-green-200',
  Phase_Ending: 'bg-slate-700 text-slate-200',
  Phase_Pregame: 'bg-slate-800 text-slate-400',
};

export function PhaseIndicator({ label }: Props) {
  const phase = label.includes('Combat') ? 'Phase_Combat'
    : label.includes('Main 1') ? 'Phase_Main1'
    : label.includes('Main 2') ? 'Phase_Main2'
    : label.includes('Begin') ? 'Phase_Beginning'
    : label.includes('End') ? 'Phase_Ending'
    : 'Phase_Pregame';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${phaseColors[phase] ?? 'bg-slate-700 text-slate-200'}`}>
      {label}
    </span>
  );
}
