import React, { useState } from "react";
import { Check, X } from "lucide-react";

function MCQViewer({ mcqs }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!mcqs || mcqs.length === 0) {
    return <p className="text-center text-ink/60">No MCQs available</p>;
  }

  const handleAnswer = (questionIndex, optionIndex) => {
    if (answers[questionIndex] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([qIndex, answer]) => mcqs[parseInt(qIndex)].correct === answer,
  ).length;

  const allAnswered = answeredCount === mcqs.length;

  return (
    <div className="space-y-6">
      {allAnswered && !showResults && (
        <div className="bg-jelly-green/10 border-2 border-jelly-green card-rounded p-6 text-center">
          <h3 className="font-bold text-lg text-ink mb-2">Quiz Complete</h3>
          <p className="text-ink/70 mb-4">
            You scored {correctCount} out of {mcqs.length} (
            {Math.round((correctCount / mcqs.length) * 100)}%)
          </p>
          <button
            onClick={() => setShowResults(true)}
            className="px-6 py-2 bg-electric-iris text-white font-bold rounded-xl shadow-hard-sm"
          >
            Review Answers
          </button>
        </div>
      )}

      {mcqs.map((mcq, qIndex) => {
        const userAnswer = answers[qIndex];
        const hasAnswered = userAnswer !== undefined;
        const isCorrect = hasAnswered && userAnswer === mcq.correct;

        return (
          <div
            key={qIndex}
            className="bg-paper border border-frost card-rounded p-6 shadow-hard"
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  hasAnswered
                    ? isCorrect
                      ? "bg-jelly-green text-white"
                      : "bg-marker-red text-white"
                    : "bg-frost text-ink"
                }`}
              >
                {qIndex + 1}
              </span>
              <div className="flex-1">
                <p className="font-medium text-ink">{mcq.question}</p>
                {mcq.difficulty && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-bold uppercase tracking-wider ${
                      mcq.difficulty === "hard"
                        ? "bg-marker-red/20 text-marker-red"
                        : mcq.difficulty === "medium"
                          ? "bg-hi-yellow/20 text-ink"
                          : "bg-jelly-green/20 text-jelly-green"
                    }`}
                  >
                    {mcq.difficulty}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 ml-11">
              {mcq.options.map((option, oIndex) => {
                const isSelected = userAnswer === oIndex;
                const isCorrectOption = mcq.correct === oIndex;

                let bgClass = "bg-frost hover:bg-electric-iris/10";
                let borderClass = "border-ink/20";

                if (hasAnswered) {
                  if (isCorrectOption) {
                    bgClass = "bg-jelly-green/20 font-bold";
                    borderClass = "border-jelly-green";
                  } else if (isSelected) {
                    bgClass = "bg-marker-red/20";
                    borderClass = "border-marker-red";
                  } else {
                    bgClass = "bg-frost/50 opacity-70";
                  }
                }

                return (
                  <button
                    key={oIndex}
                    onClick={() => handleAnswer(qIndex, oIndex)}
                    disabled={hasAnswered}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${bgClass} ${borderClass} ${
                      hasAnswered ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div>
                      <span className="font-bold mr-2">
                        {String.fromCharCode(65 + oIndex)}.
                      </span>
                      {option}
                    </div>
                    {hasAnswered && isCorrectOption && (
                      <Check size={18} strokeWidth={3} className="text-jelly-green shrink-0 ml-2" />
                    )}
                    {hasAnswered && isSelected && !isCorrectOption && (
                      <X size={18} strokeWidth={3} className="text-marker-red shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {hasAnswered && mcq.explanation && (
              <div className="mt-4 ml-11 p-4 bg-chalk rounded-xl border border-ink/10">
                <p className="text-sm text-ink/80">
                  <strong className="text-ink">Explanation:</strong>{" "}
                  {mcq.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MCQViewer;
