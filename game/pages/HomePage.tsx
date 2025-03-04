// game/pages/HomePage.tsx

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

/** Each "round" is just an array of 4 images. */
const allRounds: ImageEntry[][] = [
  [
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
  ],
  [
    { id: 'wildfire2', label: 'Wildfire Shot', src: '/assets/default-snoovatar.png', isAI: false },
    {
      id: 'portrait2',
      label: 'Strange Portrait',
      src: '/assets/default-snoovatar.png',
      isAI: false,
    },
    {
      id: 'futuristic2',
      label: 'Futuristic Scene',
      src: '/assets/default-snoovatar.png',
      isAI: true,
    },
    { id: 'city2', label: 'City Skyline', src: '/assets/default-snoovatar.png', isAI: true },
  ],
  [
    { id: 'wildfire3', label: 'Wildfire Shot', src: '/assets/default-snoovatar.png', isAI: true },
    {
      id: 'portrait3',
      label: 'Strange Portrait',
      src: '/assets/default-snoovatar.png',
      isAI: false,
    },
    {
      id: 'futuristic3',
      label: 'Futuristic Scene',
      src: '/assets/default-snoovatar.png',
      isAI: true,
    },
    { id: 'city3', label: 'City Skyline', src: '/assets/default-snoovatar.png', isAI: false },
  ],
  [
    { id: 'wildfire4', label: 'Wildfire Shot', src: '/assets/default-snoovatar.png', isAI: false },
    {
      id: 'portrait4',
      label: 'Strange Portrait',
      src: '/assets/default-snoovatar.png',
      isAI: true,
    },
    {
      id: 'futuristic4',
      label: 'Futuristic Scene',
      src: '/assets/default-snoovatar.png',
      isAI: false,
    },
    { id: 'city4', label: 'City Skyline', src: '/assets/default-snoovatar.png', isAI: true },
  ],
  [
    { id: 'wildfire5', label: 'Wildfire Shot', src: '/assets/default-snoovatar.png', isAI: true },
    {
      id: 'portrait5',
      label: 'Strange Portrait',
      src: '/assets/default-snoovatar.png',
      isAI: true,
    },
    {
      id: 'futuristic5',
      label: 'Futuristic Scene',
      src: '/assets/default-snoovatar.png',
      isAI: false,
    },
    { id: 'city5', label: 'City Skyline', src: '/assets/default-snoovatar.png', isAI: false },
  ],
];

export const HomePage = ({ postId }: { postId: string }) => {
  const setPage = useSetPage();

  /** Round # (1-based). We'll also track an index for allRounds. */
  const [round, setRound] = useState(1);
  /** The user's total score. */
  const [score, setScore] = useState(0);

  /** Which images are selected? (2 picks per round) */
  const [selected, setSelected] = useState<string[]>([]);

  /** Our current round's data. If round > 5, we are "done". */
  const currentRoundIndex = round - 1;
  const isGameFinished = round > 5;

  let entries: ImageEntry[] = [];
  if (!isGameFinished) {
    entries = allRounds[currentRoundIndex];
  }

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
    if (isGameFinished) return; // do nothing if we've finished all 5 rounds

    // Check if the user’s picks match the "isAI: true" images
    // Step 1: find which images in this round are isAI
    const correctIDs = entries.filter((img) => img.isAI).map((img) => img.id);
    // Step 2: if the user selected exactly those 2 IDs, give +1 point
    if (selected.length === 2) {
      // Simple approach: check if both selected are in correctIDs, and correctIDs has length 2
      if (correctIDs.length === 2 && selected.every((id) => correctIDs.includes(id))) {
        setScore((prev) => prev + 1);
      }
    }

    // Move to next round
    const nextRound = round + 1;
    setRound(nextRound);
    setSelected([]);
  }

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-slate-900 p-4">
      {/* If the game is finished, show a final message */}
      {isGameFinished ? (
        <div className="mt-10 text-center text-white">
          <h1 className="text-xl font-bold">All done!</h1>
          <p className="mt-2">You finished all 5 rounds.</p>
          <p className="mt-1">Your final score: {score} / 5</p>
          <button
            onClick={() => {
              // Example: reset the game if you want
              setRound(1);
              setScore(0);
              setSelected([]);
            }}
            className="mt-4 rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Play again
          </button>
        </div>
      ) : (
        <>
          <h1 className="mt-4 text-xl font-semibold text-white md:text-2xl">
            Spot the AI-Generated Images!
          </h1>
          <p className="mt-2 text-sm text-neutral-300">
            Select the TWO images that you believe were created by AI
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Round: {round} / 5 | Score: {score}
          </p>

          {/* Show 4 images for the current round */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {entries.map((entry) => {
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

      {/* Just an example if you still want to show postId */}
      <p className="mt-4 text-xs text-neutral-500">PostId: {postId}</p>

      {/* If you want to still jump to the Pokemon page, keep this button: */}
      <button
        onClick={() => setPage('pokemon')}
        className="mt-2 rounded-full border border-slate-500 px-3 py-1 text-xs text-neutral-200 hover:bg-slate-800"
      >
        Go to Pokémon Page
      </button>
    </div>
  );
};
