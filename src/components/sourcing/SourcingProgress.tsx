interface SourcingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function SourcingProgress({
  currentStep,
  totalSteps,
}: SourcingProgressProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Progression
          </span>
          <span className="text-sm font-semibold text-foreground">
            {currentStep}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500 ease-out rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
