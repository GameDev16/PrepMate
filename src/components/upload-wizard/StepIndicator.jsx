import React from "react";

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Configure" },
  { num: 3, label: "Generate" },
  { num: 4, label: "Done" },
];

function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                step >= s.num
                  ? "bg-electric-iris text-white border-electric-iris"
                  : "bg-paper text-ink/40 border-ink/20"
              }`}
            >
              {s.num}
            </div>
            <span
              className={`ml-2 font-medium hidden sm:block ${
                step >= s.num ? "text-ink" : "text-ink/40"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 sm:w-20 h-0.5 mx-2 ${
                step > s.num ? "bg-electric-iris" : "bg-ink/20"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default StepIndicator;
