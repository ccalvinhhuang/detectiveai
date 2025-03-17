import { Devvit, useState } from '@devvit/public-api';

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

      <vstack gap="large" width="400px" alignment="center middle">
        <hstack gap="large" width="100%" alignment="center">
          {images.slice(0, 2).map((entry) => {
            const isSelected = selected.includes(entry.id);
            return (
              <vstack key={entry.id} gap="small" alignment="center middle" width="160px">
                <image 
                  url={entry.src} 
                  imageWidth={100} 
                  imageHeight={100}
                />
                <button
                  onPress={() => toggleSelected(entry.id)}
                  appearance={isSelected ? "primary" : "secondary"}
                >
                  {entry.label}
                </button>
              </vstack>
            );
          })}
        </hstack>
        <hstack gap="large" width="100%" alignment="center">
          {images.slice(2, 4).map((entry) => {
            const isSelected = selected.includes(entry.id);
            return (
              <vstack key={entry.id} gap="small" alignment="center middle" width="160px">
                <image 
                  url={entry.src} 
                  imageWidth={100} 
                  imageHeight={100}
                />
                <button
                  onPress={() => toggleSelected(entry.id)}
                  appearance={isSelected ? "primary" : "secondary"}
                >
                  {entry.label}
                </button>
              </vstack>
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
}; 