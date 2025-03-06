import { useState } from 'react';
import { cn } from '../utils';
import { useSetPage } from '../hooks/usePage';

/** Each "text entry" includes a boolean `isAI` so we know which are correct. */
type TextEntry = {
  id: string;
  title: string;
  content: string;
  isAI: boolean;
};

/** Each "round" is just an array of 4 text samples. */
const allRounds: TextEntry[][] = [
  [
    {
      id: 'news1',
      title: 'News Excerpt',
      content:
        'The city council approved the new budget yesterday after a heated debate that lasted over three hours. The final vote was 7-3 in favor of the proposal, which includes funding for infrastructure improvements.',
      isAI: false,
    },
    {
      id: 'poem1',
      title: 'Poem',
      content:
        "Whispers of dawn embrace the sky, As morning light begins to fly. Dew-kissed petals unfold with care, Nature's beauty beyond compare.",
      isAI: true,
    },
    {
      id: 'recipe1',
      title: 'Recipe Instructions',
      content:
        'Mix the flour and butter until crumbly. Add water one tablespoon at a time until the dough forms. Refrigerate for 30 minutes before rolling out on a floured surface.',
      isAI: false,
    },
    {
      id: 'review1',
      title: 'Product Review',
      content:
        'This smartphone exceeds expectations in every way. The camera quality is exceptional, battery life impressive, and the user interface intuitive. Definitely worth the investment for tech enthusiasts.',
      isAI: true,
    },
  ],
  [
    {
      id: 'news2',
      title: 'News Excerpt',
      content:
        'Scientists have discovered a new species of deep-sea fish that can withstand extreme pressure. The finding could lead to advancements in materials science and medical applications, according to the research team.',
      isAI: true,
    },
    {
      id: 'poem2',
      title: 'Poem',
      content:
        'The old oak stands, silent and tall, Weathered by seasons, witnessing all. Roots deep in soil, branches reach high, A sentinel under the watchful sky.',
      isAI: false,
    },
    {
      id: 'recipe2',
      title: 'Recipe Instructions',
      content:
        'Simmer the broth gently until reduced by half. Add the freshly chopped herbs and a squeeze of lemon. Season to taste with salt and pepper, then serve immediately with crusty bread.',
      isAI: true,
    },
    {
      id: 'review2',
      title: 'Product Review',
      content:
        "I was disappointed by this vacuum cleaner. It constantly loses suction and the battery doesn't last as advertised. The attachments are flimsy and difficult to connect. Save your money and look elsewhere.",
      isAI: false,
    },
  ],
  [
    {
      id: 'news3',
      title: 'News Excerpt',
      content:
        'The annual arts festival drew record crowds this weekend, with over 15,000 attendees enjoying performances from local and international artists. "We\'ve never seen such enthusiasm," said event organizer Maria Chen.',
      isAI: false,
    },
    {
      id: 'poem3',
      title: 'Poem',
      content:
        'Digital dreams in pixelated streams, Virtual worlds beyond what seems. Coded reality, syntaxed emotion, Algorithms flowing like an endless ocean.',
      isAI: true,
    },
    {
      id: 'recipe3',
      title: 'Recipe Instructions',
      content:
        'Marinate the chicken in the spice mixture for at least four hours, preferably overnight. Preheat the grill to medium-high heat. Cook for 6-7 minutes per side until the internal temperature reaches 165°F.',
      isAI: true,
    },
    {
      id: 'review3',
      title: 'Product Review',
      content:
        'These headphones offer solid performance for the price point. The sound quality is good though not exceptional, and the comfort level is adequate for extended listening sessions. Battery life is as advertised.',
      isAI: false,
    },
  ],
  [
    {
      id: 'news4',
      title: 'News Excerpt',
      content:
        'A breakthrough in renewable energy storage was announced today by researchers at the National Laboratory. The new technology could potentially solve the intermittency problem that has plagued solar and wind power adoption.',
      isAI: true,
    },
    {
      id: 'poem4',
      title: 'Poem',
      content:
        "I wandered lonely as a cloud That floats on high o'er vales and hills, When all at once I saw a crowd, A host, of golden daffodils.",
      isAI: false,
    },
    {
      id: 'recipe4',
      title: 'Recipe Instructions',
      content:
        'Toast the spices in a dry pan until fragrant, about 30 seconds. Grind to a fine powder using a spice grinder or mortar and pestle. Store in an airtight container away from direct sunlight.',
      isAI: true,
    },
    {
      id: 'review4',
      title: 'Product Review',
      content:
        'This fitness tracker has completely transformed my workout routine. The accuracy of the heart rate monitor is impressive, and the sleep tracking feature has provided valuable insights into my rest patterns.',
      isAI: false,
    },
  ],
  [
    {
      id: 'news5',
      title: 'News Excerpt',
      content:
        "Local residents expressed concerns at yesterday's town hall meeting regarding the proposed shopping development. Traffic congestion and environmental impact were cited as primary objections to the plan.",
      isAI: true,
    },
    {
      id: 'poem5',
      title: 'Poem',
      content:
        'Midnight whispers secrets untold, Stories of silver and tales of gold. Moonbeams dancing on waters still, Time suspended against our will.',
      isAI: true,
    },
    {
      id: 'recipe5',
      title: 'Recipe Instructions',
      content:
        "Fold the whipped cream gently into the chocolate mixture. Be careful not to overmix or you'll lose the airy texture. Spoon into serving glasses and refrigerate for at least two hours before serving.",
      isAI: false,
    },
    {
      id: 'review5',
      title: 'Product Review',
      content:
        "After using this skincare product for a month, I've noticed significant improvement in texture and tone. My pores appear smaller and the redness has reduced considerably. Worth every penny for the results delivered.",
      isAI: false,
    },
  ],
];

export const AITextPage = () => {
  const setPage = useSetPage();

  /** Round # (1-based). We'll also track an index for allRounds. */
  const [round, setRound] = useState(1);
  /** The user's total score. */
  const [score, setScore] = useState(0);
  /** Which text samples are selected? (2 picks per round) */
  const [selected, setSelected] = useState<string[]>([]);
  /** Currently expanded text */
  const [expanded, setExpanded] = useState<string | null>(null);

  /** Our current round's data. If round > 5, we are "done". */
  const currentRoundIndex = round - 1;
  const isGameFinished = round > 5;

  let entries: TextEntry[] = [];
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

  function toggleExpanded(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function handleSubmit() {
    if (isGameFinished) return; // do nothing if we've finished all 5 rounds

    // Check if the user's picks match the "isAI: true" text samples
    const correctIDs = entries.filter((text) => text.isAI).map((text) => text.id);

    if (selected.length === 2) {
      if (correctIDs.length === 2 && selected.every((id) => correctIDs.includes(id))) {
        setScore((prev) => prev + 1);
      }
    }

    // Move to next round
    const nextRound = round + 1;
    setRound(nextRound);
    setSelected([]);
    setExpanded(null);
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
                setExpanded(null);
              }}
              className="rounded-full bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
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
            Spot the AI-Generated Text!
          </h1>
          <p className="mt-2 text-sm text-neutral-300">
            Read and select the TWO text samples that you believe were created by AI
          </p>
          <p className="mt-2 text-sm text-neutral-400">
            Round: {round} / 5 | Score: {score}
          </p>

          {/* Show 4 text samples for the current round */}
          <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-4">
            {entries.map((entry) => {
              const isSelected = selected.includes(entry.id);
              const isExpanded = expanded === entry.id;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex flex-col rounded-lg border p-4 transition',
                    isSelected ? 'border-purple-500 bg-slate-800' : 'border-slate-700 bg-slate-900'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">{entry.title}</h3>
                    <button
                      onClick={() => toggleExpanded(entry.id)}
                      className="text-neutral-400 hover:text-white"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>

                  <div
                    className={cn(
                      'mt-2 overflow-hidden transition-all duration-300',
                      isExpanded ? 'max-h-96' : 'max-h-16'
                    )}
                  >
                    <p className="text-neutral-300">{entry.content}</p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => toggleSelected(entry.id)}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs',
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      )}
                    >
                      {isSelected ? 'Selected' : 'Select as AI'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={selected.length < 2}
            className="mt-6 rounded-full bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 disabled:bg-gray-500"
          >
            Submit Answer
          </button>
        </>
      )}
    </div>
  );
};
