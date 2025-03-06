import { useSetPage } from '../hooks/usePage';

export const HomePage = ({ postId }: { postId: string }) => {
  const setPage = useSetPage();

  return (
    <div className="relative flex min-h-full w-full flex-col items-center bg-slate-900 p-4">
      <h1 className="mt-4 text-2xl font-bold text-white md:text-3xl">AI or Not?</h1>
      <p className="mt-2 text-center text-sm text-neutral-300">
        Can you tell which content is AI-generated? Test your skills across different media types!
      </p>

      <div className="mt-8 flex w-full max-w-md flex-col gap-4">
        <button
          onClick={() => setPage('aiImage')}
          className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          AI Image Challenge
        </button>

        <button
          onClick={() => setPage('aiAudio')}
          className="rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-green-700"
        >
          AI Audio Challenge
        </button>

        <button
          onClick={() => setPage('aiText')}
          className="rounded-lg bg-purple-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-purple-700"
        >
          AI Text Challenge
        </button>

        <button
          onClick={() => setPage('leaderboard')}
          className="rounded-lg bg-amber-600 px-6 py-3 text-lg font-semibold text-white transition hover:bg-amber-700"
        >
          Leaderboard
        </button>
      </div>

      <p className="mt-8 text-xs text-neutral-500">PostId: {postId}</p>
    </div>
  );
};
