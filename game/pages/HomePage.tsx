// game/pages/HomePage.tsx

import { useState } from 'react';
import { cn } from '../utils';
import { useSetPage } from '../hooks/usePage'; // <--- keep this if you like

type ImageEntry = {
  id: string;
  label: string;
  src: string;
};

export const HomePage = ({ postId }: { postId: string }) => {
  const setPage = useSetPage();
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);

  const entries: ImageEntry[] = [
    { id: 'wildfire', label: 'Wildfire Shot', src: '/assets/default-snoovatar.png' },
    { id: 'portrait', label: 'Strange Portrait', src: '/assets/default-snoovatar.png' },
    { id: 'futuristic', label: 'Futuristic Scene', src: '/assets/default-snoovatar.png' },
    { id: 'city', label: 'City Skyline', src: '/assets/default-snoovatar.png' },
  ];

  const [selected, setSelected] = useState<string[]>([]);

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
    console.log('Submitted with selected images:', selected);
    // You can do scoring, round incrementing, or Devvit calls here
    // setRound(round + 1);
  }

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-slate-900 p-4">
      <h1 className="mt-4 text-xl font-semibold text-white md:text-2xl">
        Spot the AI-Generated Images!
      </h1>
      <p className="mt-2 text-sm text-neutral-300">
        Select the TWO images that you believe were created by AI
      </p>
      <p className="mt-2 text-sm text-neutral-400">
        Round: {round} | Score: {score}
      </p>

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

      <button
        onClick={handleSubmit}
        disabled={selected.length < 2}
        className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-500"
      >
        Submit Answer
      </button>

      {/* Just an example if you still want to show postId */}
      <p className="mt-4 text-xs text-neutral-500">PostId: {postId}</p>

      {/* If you still want to navigate to the Pokémon page, you can keep a button */}
      <button
        onClick={() => setPage('pokemon')}
        className="mt-2 rounded-full border border-slate-500 px-3 py-1 text-xs text-neutral-200 hover:bg-slate-800"
      >
        Go to Pokémon Page
      </button>
    </div>
  );
};
