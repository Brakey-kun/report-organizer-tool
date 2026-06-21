import type { WizardStep } from '../types';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

const STEPS: { step: WizardStep; label: string; arabic: string }[] = [
  { step: 1, label: '1. Organize', arabic: 'ترتيب' },
  { step: 2, label: '2. Review', arabic: 'مراجعة' },
  { step: 3, label: '3. Export', arabic: 'تصدير' },
];

export default function ProgressBar({ currentStep, onStepClick }: ProgressBarProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 shrink-0" style={{ height: 60 }}>
      <div className="flex items-center justify-center h-full max-w-xl mx-auto px-6">
        {STEPS.map((s, i) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isFuture = s.step > currentStep;

          return (
            <div key={s.step} className="flex items-center flex-1 last:flex-none">
              {/* Connector line before this step (except the first) */}
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 transition-colors duration-300 ${
                    s.step <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => onStepClick(s.step)}
                className="flex flex-col items-center gap-0.5 cursor-pointer group focus:outline-none"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-300 shrink-0
                    ${isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-md' : ''}
                    ${isCompleted ? 'bg-primary-500 text-white group-hover:bg-primary-600' : ''}
                    ${isFuture ? 'bg-gray-300 text-gray-500 group-hover:bg-gray-400 group-hover:text-white' : ''}
                  `}
                >
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : s.step}
                </div>
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
                    isCurrent
                      ? 'text-primary-700 font-bold'
                      : isCompleted
                        ? 'text-primary-600'
                        : 'text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`text-[10px] leading-none whitespace-nowrap ${
                    isCurrent ? 'text-primary-500' : isCompleted ? 'text-primary-400' : 'text-gray-300'
                  }`}
                  dir="rtl"
                >
                  {s.arabic}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
