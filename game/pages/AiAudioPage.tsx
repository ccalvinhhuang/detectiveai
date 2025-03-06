import { useState } from 'react';
import { cn } from '../utils';
import { useSetPage } from '../hooks/usePage';

/** Each "audio entry" includes a boolean `isAI` so we know which are correct. */
type AudioEntry = {
  id: string;
  label: string;
  src: string;
  isAI: boolean;
};

/** Each "round" is just an array of 4 audio clips. */
const allRounds: AudioEntry[][] = [
  [
    {
      id: 'piano1',
      label: 'Piano Solo',
      src: 'https://example.com/piano1.mp3',
      isAI: false,
    },
    {
      id: 'speech1',
      label: 'Speech Clip',
      src: 'https://example.com/speech1.mp3',
      isAI: true,
    },
    {
      id: 'nature1',
      label: 'Nature Sounds',
      src: 'https://example.com/nature1.mp3',
      isAI: false,
    },
    {
      id: 'song1',
      label: 'Pop Song',
      src: 'https://example.com/song1.mp3',
      isAI: true,
    },
  ],
  [
    {
      id: 'piano2',
      label: 'Piano Solo',
      src: 'https://example.com/piano2.mp3',
      isAI: true,
    },
    {
      id: 'speech2',
      label: 'Speech Clip',
      src: 'https://example.com/speech2.mp3',
      isAI: false,
    },
    {
      id: 'nature2',
      label: 'Nature Sounds',
      src: 'https://example.com/nature2.mp3',
      isAI: true,
    },
    {
      id: 'song2',
      label: 'Pop Song',
      src: 'https://example.com/song2.mp3',
      isAI: false,
    },
  ],
  [
    {
      id: 'piano3',
      label: 'Piano Solo',
      src: 'https://example.com/piano3.mp3',
      isAI: false,
    },
    {
      id: 'speech3',
      label: 'Speech Clip',
      src: 'https://example.com/speech3.mp3',
      isAI: true,
    },
    {
      id: 'nature3',
      label: 'Nature Sounds',
      src: 'https://example.com/nature3.mp3',
      isAI: true,
    },
    {
      id: 'song3',
      label: 'Pop Song',
      src: 'https://example.com/song3.mp3',
      isAI: false,
    },
  ],
  [
    {
      id: 'piano4',
      label: 'Piano Solo',
      src: 'https://example.com/piano4.mp3',
      isAI: true,
    },
    {
      id: 'speech4',
      label: 'Speech Clip',
      src: 'https://example.com/speech4.mp3',
      isAI: false,
    },
    {
      id: 'nature4',
      label: 'Nature Sounds',
      src: 'https://example.com/nature4.mp3',
      isAI: true,
    },
    {
      id: 'song4',
      label: 'Pop Song',
      src: 'https://example.com/song4.mp3',
      isAI: false,
    },
  ],
  [
    {
      id: 'piano5',
      label: 'Piano Solo',
      src: 'https://example.com/piano5.mp3',
      isAI: true,
    },
    {
      id: 'speech5',
      label: 'Speech Clip',
      src: 'https://example.com/speech5.mp3',
      isAI: true,
    },
    {
      id: 'nature5',
      label: 'Nature Sounds',
      src: 'https://example.com/nature5.mp3',
      isAI: false,
    },
    {
      id: 'song5',
      label: 'Pop Song',
      src: 'https://example.com/song5.mp3',
      isAI: false,
    },
  ],
];

export const AIAudioPage = () => {
  const setPage = useSetPage();

  /** Round # (1-based). We'll also track an index for allRounds. */
  const [round, setRound] = useState(1);
  /** The user's total score. */
  const [score, setScore] = useState(0);
  /** Which audio clips are selected? (2 picks per round) */
  const [selected, setSelected] = useState<string[]>([]);
  /** Currently playing audio */
  const [playing, setPlaying] = useState<string | null>(null);

  /** Our current round's data. If round > 5, we are "done". */
  const currentRoundIndex = round - 1;
  const isGameFinished = round > 5;

  let entries: AudioEntry[] = [];
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

  function togglePlayAudio(id: string) {
    if (playing === id) {
      setPlaying(null);
      // In a real implementation, we would pause the audio here
    } else {
      setPlaying(id);
      // In a real implementation, we would pause any other audio and play this one
    }
  }

  function handleSubmit() {
    if (isGameFinished) return; // do nothing if we've finished all 5 rounds

    // Check if the user's picks match the "isAI: true" audio clips
    const correctIDs = entries.filter((audio) => audio.isAI).map((audio) => audio.id);

    if (selected.length === 2) {
      if (correctIDs.length === 2 && selected.every((id) => correctIDs.includes(id))) {
        setScore((prev) => prev + 1);
      }
    }

    // Move to next round
    const nextRound = round + 1;
    setRound(nextRound);
    setSelected([]);
    setPlaying(null);
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
          <p className="mt-2">You finished all 5 rounds.</p>
          <p className="mt-1">Your final score: {score} / 5</p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                // Reset the game
                setRound(1);
                setScore(0);
                setSelected([]);
                setPlaying(null);
              }}
              className="rounded-full bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
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
            Spot the AI-Generated Audio!
          </h1>
          <p className="mt-2 text-sm text-neutral-300">
            Listen and select the TWO audio clips that you believe were created by AI
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Round: {round} / 5 | Score: {score}
          </p>

          {/* Show 4 audio clips for the current round */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {entries.map((entry) => {
              const isSelected = selected.includes(entry.id);
              const isPlaying = playing === entry.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex flex-col items-center rounded-lg border p-4 transition',
                    isSelected ? 'border-green-500 bg-slate-800' : 'border-slate-700 bg-slate-900'
                  )}
                >
                  <button
                    onClick={() => togglePlayAudio(entry.id)}
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-full',
                      isPlaying ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
                    )}
                  >
                    <span className="text-3xl text-white">{isPlaying ? '■' : '▶'}</span>
                  </button>
                  <p className="mt-2 text-white">{entry.label}</p>
                  <button
                    onClick={() => toggleSelected(entry.id)}
                    className={cn(
                      'mt-2 rounded-full px-3 py-1 text-xs',
                      isSelected
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-white hover:bg-slate-600'
                    )}
                  >
                    {isSelected ? 'Selected' : 'Select as AI'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={selected.length < 2}
            className="mt-6 rounded-full bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:bg-gray-500"
          >
            Submit Answer
          </button>
        </>
      )}
    </div>
  );
};
