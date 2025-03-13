import { Devvit, useState } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from './constants.js';

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

Devvit.addSettings([
  {
    name: DEVVIT_SETTINGS_KEYS.SECRET_API_KEY,
    label: 'API Key for secret things',
    type: 'string',
    isSecret: true,
    scope: 'app',
  },
]);

Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true,
});

Devvit.addMenuItem({
  label: 'Make my experience post',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'AI Image Detection Game',
      subredditName: subreddit.name,
      kind: 'image',
      videoPosterUrl: '/assets/default-snoovatar.png'
    });
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post.url);
  },
});

Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render: (context) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [score, setScore] = useState(0);
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

    if (isGameFinished) {
      return (
        <vstack height="100%" width="100%" gap="medium" alignment="center middle">
          <text size="xxlarge" weight="bold">All done!</text>
          <text>You've completed the challenge!</text>
          <text>Your score: {score} / 1</text>
          <hstack gap="large">
            <button
              onPress={() => {
                setScore(0);
                setSelected([]);
                setIsGameFinished(false);
              }}
            >
              Play again
            </button>
          </hstack>
        </vstack>
      );
    }

    return (
      <vstack height="100%" width="100%" gap="medium" alignment="center middle">
        <text size="xxlarge" weight="bold">Spot the AI-Generated Images!</text>
        <text>Select the TWO images that you believe were created by AI</text>
        <text color="secondary">Score: {score}</text>

        <vstack gap="medium">
          <hstack gap="medium">
            {images.slice(0, 2).map((entry) => {
              const isSelected = selected.includes(entry.id);
              return (
                <button
                  key={entry.id}
                  onPress={() => toggleSelected(entry.id)}
                  appearance={isSelected ? "primary" : "secondary"}
                >
                  {entry.label}
                </button>
              );
            })}
          </hstack>
          <hstack gap="medium">
            {images.slice(2, 4).map((entry) => {
              const isSelected = selected.includes(entry.id);
              return (
                <button
                  key={entry.id}
                  onPress={() => toggleSelected(entry.id)}
                  appearance={isSelected ? "primary" : "secondary"}
                >
                  {entry.label}
                </button>
              );
            })}
          </hstack>
        </vstack>

        <button
          onPress={handleSubmit}
          disabled={selected.length < 2}
        >
          Submit Answer
        </button>
      </vstack>
    );
  },
});

export default Devvit;
