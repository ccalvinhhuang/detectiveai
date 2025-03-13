import { useState } from 'react';
import { cn } from '../utils';
import { useSetPage } from '../hooks/usePage';

/** Each "image entry" includes a boolean `isAI` so we know which are correct. */
type ImageEntry = {
  id: string;
  label: string;
  src: string;
  isAI: boolean;
};

/** Single round of 4 images */
const images: ImageEntry[] = [
  { id: 'wildfire1', label: 'Wildfire Shot', src: '/assets/default-snoovatar.png', isAI: false },
  {
    id: 'portrait1',
    label: 'Strange Portrait',
    src: '/assets/default-snoovatar.png',
    isAI: true,
  },
  {
    id: 'futuristic1',
    label: 'Futuristic Scene',
    src: '/assets/default-snoovatar.png',
    isAI: true,
  },
  { id: 'city1', label: 'City Skyline', src: '/assets/default-snoovatar.png', isAI: false },
];

export const AIImagePage = () => {
  const setPage = useSetPage();
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [isGameFinished, setIsGameFinished] = useState(false);

  function toggleSelected(id: string) {
    setSelected((prev) => {
      // If already selected, unselect
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      // Otherwise add it, up to 2
      if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  }

  function handleSubmit() {
    if (isGameFinished) return;

    // Check if the user's picks match the "isAI: true" images
    const correctIDs = images.filter((img) => img.isAI).map((img) => img.id);
    
    // If the user selected exactly those 2 IDs, give +1 point
    if (selected.length === 2) {
      if (correctIDs.length === 2 && selected.every((id) => correctIDs.includes(id))) {
        setScore(1);
      }
    }

    setIsGameFinished(true);
  }

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-slate-900 p-4">
      {/* Back button */}
      <button
        onClick={() => setPage('home')}
        className="absolute top-4 left-4 rounded-full border border-slate-500 px-3 py-1 text-xs text-neutral-200 hover:bg-slate-800"
      >
        ← Back to Home
      </button>

      {/* If the game is finished, show a final message */}
      {isGameFinished ? (
        <div className="mt-10 text-center text-white">
          <h1 className="text-xl font-bold">All done!</h1>
          <p className="mt-2">You've completed the challenge!</p>
          <p className="mt-1">Your score: {score} / 1</p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                // Reset the game
                setScore(0);
                setSelected([]);
                setIsGameFinished(false);
              }}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Play again
            </button>
            <button
              onClick={() => setPage('home')}
              className="rounded-full bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
            >
              Return to Home
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mt-12 text-xl font-semibold text-white md:text-2xl">
            Spot the AI-Generated Images!
          </h1>
          <p className="mt-2 text-sm text-neutral-300">
            Select the TWO images that you believe were created by AI
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Score: {score}
          </p>

          {/* Show 4 images */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {images.map((entry) => {
              const isSelected = selected.includes(entry.id);
              return (
                <button
                  key={entry.id}
                  onClick={() => toggleSelected(entry.id)}
                  className={cn(
                    'flex flex-col items-center rounded-lg border p-4 transition',
                    isSelected
                      ? 'border-blue-500 bg-slate-800'
                      : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                  )}
                >
                  <img src={entry.src} alt={entry.label} className="h-16 w-16 rounded-full" />
                  <p className="mt-2 text-white">{entry.label}</p>
                </button>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={selected.length < 2}
            className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-500"
          >
            Submit Answer
          </button>
        </>
      )}
    </div>
  );
};
