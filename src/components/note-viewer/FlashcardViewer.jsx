import React, { useState } from "react";

function FlashcardViewer({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return <p className="text-center text-ink/60">No flashcards available</p>;
  }

  const card = flashcards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-4 text-ink/60 font-bold">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      <div
        onClick={() => setFlipped(!flipped)}
        className="bg-paper border border-frost card-rounded p-8 min-h-[200px] flex items-center justify-center cursor-pointer shadow-hard hover:shadow-hard-iris transition-all"
      >
        <div className="text-center">
          <p className="text-sm text-ink/60 mb-2 font-bold uppercase tracking-wider">
            {flipped ? "Answer" : "Question"} (click to flip)
          </p>
          <p className="text-lg font-medium text-ink">
            {flipped ? card.back : card.front}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => {
            setCurrentIndex((prev) => Math.max(0, prev - 1));
            setFlipped(false);
          }}
          disabled={currentIndex === 0}
          className="px-6 py-2 bg-paper border-2 border-ink font-medium rounded-xl shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          onClick={() => {
            setCurrentIndex((prev) =>
              Math.min(flashcards.length - 1, prev + 1),
            );
            setFlipped(false);
          }}
          disabled={currentIndex === flashcards.length - 1}
          className="px-6 py-2 bg-electric-iris text-white font-medium rounded-xl shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default FlashcardViewer;
