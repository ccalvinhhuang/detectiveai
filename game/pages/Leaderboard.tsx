import { useSetPage } from '../hooks/usePage';

type LeaderboardEntry = {
  rank: number;
  username: string;
  imageScore: number;
  audioScore: number;
  textScore: number;
  totalScore: number;
};

// Dummy leaderboard data
const leaderboardData: LeaderboardEntry[] = [
  {
    rank: 1,
    username: 'AIDetective',
    imageScore: 5,
    audioScore: 4,
    textScore: 5,
    totalScore: 14,
  },
  {
    rank: 2,
    username: 'DeepFakeSpotter',
    imageScore: 4,
    audioScore: 5,
    textScore: 4,
    totalScore: 13,
  },
  {
    rank: 3,
    username: 'RealOrFake',
    imageScore: 4,
    audioScore: 4,
    textScore: 4,
    totalScore: 12,
  },
  {
    rank: 4,
    username: 'TuringTester',
    imageScore: 3,
    audioScore: 4,
    textScore: 4,
    totalScore: 11,
  },
  {
    rank: 5,
    username: 'AIOrHuman',
    imageScore: 3,
    audioScore: 3,
    textScore: 5,
    totalScore: 11,
  },
  {
    rank: 6,
    username: 'PixelDetector',
    imageScore: 4,
    audioScore: 3,
    textScore: 3,
    totalScore: 10,
  },
  {
    rank: 7,
    username: 'SyntheticSpotter',
    imageScore: 2,
    audioScore: 4,
    textScore: 3,
    totalScore: 9,
  },
  {
    rank: 8,
    username: 'GenerativeGuru',
    imageScore: 3,
    audioScore: 2,
    textScore: 4,
    totalScore: 9,
  },
  {
    rank: 9,
    username: 'AIHunter',
    imageScore: 3,
    audioScore: 3,
    textScore: 2,
    totalScore: 8,
  },
  {
    rank: 10,
    username: 'RoboRecognizer',
    imageScore: 2,
    audioScore: 2,
    textScore: 3,
    totalScore: 7,
  },
];

export const LeaderboardPage = () => {
  const setPage = useSetPage();

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-slate-900 p-4">
      {/* Back button */}
      <button
        onClick={() => setPage('home')}
        className="absolute top-4 left-4 rounded-full border border-slate-500 px-3 py-1 text-xs text-neutral-200 hover:bg-slate-800"
      >
        ← Back to Home
      </button>

      <h1 className="mt-12 text-xl font-bold text-white md:text-2xl">Global Leaderboard</h1>
      <p className="mt-2 text-sm text-neutral-300">
        See how you compare to other AI detectives around the world!
      </p>

      {/* Leaderboard table */}
      <div className="mt-6 w-full max-w-3xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-2 text-left text-neutral-300">Rank</th>
              <th className="p-2 text-left text-neutral-300">Username</th>
              <th className="p-2 text-center text-blue-300">Image</th>
              <th className="p-2 text-center text-green-300">Audio</th>
              <th className="p-2 text-center text-purple-300">Text</th>
              <th className="p-2 text-center text-amber-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((entry) => (
              <tr
                key={entry.rank}
                className={cn(
                  'border-b border-slate-800 hover:bg-slate-800/50',
                  entry.rank <= 3 ? 'bg-slate-800/25' : ''
                )}
              >
                <td className="p-2">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                      entry.rank === 1
                        ? 'bg-amber-500 text-black'
                        : entry.rank === 2
                          ? 'bg-slate-300 text-black'
                          : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-700 text-white'
                    )}
                  >
                    {entry.rank}
                  </span>
                </td>
                <td className="p-2 font-medium text-white">{entry.username}</td>
                <td className="p-2 text-center font-medium text-neutral-200">
                  {entry.imageScore}/5
                </td>
                <td className="p-2 text-center font-medium text-neutral-200">
                  {entry.audioScore}/5
                </td>
                <td className="p-2 text-center font-medium text-neutral-200">
                  {entry.textScore}/5
                </td>
                <td className="p-2 text-center font-bold text-white">{entry.totalScore}/15</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Challenge buttons */}
      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
        <button
          onClick={() => setPage('aiImage')}
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          Try Image Challenge
        </button>
        <button
          onClick={() => setPage('aiAudio')}
          className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700"
        >
          Try Audio Challenge
        </button>
        <button
          onClick={() => setPage('aiText')}
          className="rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white hover:bg-purple-700"
        >
          Try Text Challenge
        </button>
      </div>
    </div>
  );
};

// Helper function for conditional class names if cn isn't already defined
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
