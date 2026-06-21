import React from 'react';
import type { WizardStep } from '../types';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
}

const STEPS: { step: WizardStep; label: string; arabic: string }[] = [
  { step: 1, label: 'Organize', arabic: 'ترتيب' },
  { step: 2, label: 'Review', arabic: 'مراجعة' },
  { step: 3, label: 'Export', arabic: 'تصدير' },
];

export default function ProgressBar({ currentStep, onStepClick }: ProgressBarProps) {
  return (
    <div className="w-full bg-white border-b border-gray-200 shrink-0" style={{ height: 52 }}>
      <div className="flex items-center h-full w-full max-w-3xl mx-auto px-[clamp(1.5rem,5vw,4rem)]">
        {STEPS.map((s, i) => {
          const isCompleted = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          const isFuture = s.step > currentStep;

          return (
            <React.Fragment key={s.step}>
              {/* Connector line before this step (except the first) */}
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors duration-300 ${
                    s.step <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Step circle + label */}
              <button
                type="button"
                onClick={() => onStepClick(s.step)}
                className="flex items-center gap-2 cursor-pointer group focus:outline-none shrink-0"
              >
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    transition-all duration-300 shrink-0
                    ${isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100 shadow-sm' : ''}
                    ${isCompleted ? 'bg-primary-500 text-white group-hover:bg-primary-600' : ''}
                    ${isFuture ? 'bg-gray-300 text-gray-500 group-hover:bg-gray-400 group-hover:text-white' : ''}
                  `}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : s.step}
                </div>
                <div className="flex flex-col items-start leading-none">
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
                    className={`text-[10px] leading-tight whitespace-nowrap mt-0.5 ${
                      isCurrent ? 'text-primary-500' : isCompleted ? 'text-primary-400' : 'text-gray-300'
                    }`}
                    dir="rtl"
                  >
                    {s.arabic}
                  </span>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
