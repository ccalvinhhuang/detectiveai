import { Devvit, useState } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from '../constants.js';

/** Each "image entry" includes a boolean `isAI` so we know which are correct. */
type ImageEntry = {
  id: string;
  label: string;
  src: string;
  isAI: boolean;
};

export const AIImagePage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  
  /** Single round of 4 images */
  const images: ImageEntry[] = [
    { 
      id: 'gymnastics1', 
      label: 'Gymnastics Shot 1', 
      src: 'output_images_2061597_gymnastics_PIXABAY_0.png',
      isAI: false 
    },
    {
      id: 'gymnastics2',
      label: 'Gymnastics Shot 2',
      src: 'output_images_2061597_gymnastics_FAL_flux-pro_v1.1-ultra_1.png',
      isAI: true,
    },
    {
      id: 'gymnastics3',
      label: 'Gymnastics Shot 3',
      src: 'output_images_2061597_gymnastics_FAL_flux-pro_v1.1_0.png',
      isAI: true,
    },
    { 
      id: 'gymnastics4', 
      label: 'Gymnastics Shot 4', 
      src: 'output_images_2061597_gymnastics_FAL_flux_dev_2.png', 
      isAI: false 
    },
  ];

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
                  imageHeight={150} 
                  imageWidth={150}
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
                  url= {entry.src}
                  imageHeight={150} 
                  imageWidth={150}
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