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
      isAI: true 
    },
  ];

  function toggleSelected(id: string) {
    setSelected((prev) => {
      // If already selected, unselect
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      // Otherwise add it, with no limit on selections
      return [...prev, id];
    });
  }

  function handleSubmit() {
    if (isGameFinished) return;

    // Determine which images are AI by checking if they DON'T have "PIXABAY" in the filename
    const aiImages = images.map(img => ({
      ...img,
      isAI: !img.src.includes('PIXABAY')
    }));

    // Get the IDs of the actual AI images (AI-generated)
    const aiImageIDs = aiImages.filter((img) => img.isAI).map((img) => img.id);
    
    // Get the IDs of the real images (not AI-generated)
    const realImageIDs = aiImages.filter((img) => !img.isAI).map((img) => img.id);
    
    // Calculate score out of 4
    let userScore = 4;
    
    // Deduct a point for each real image incorrectly selected as AI
    const incorrectlySelectedRealImages = selected.filter(id => realImageIDs.includes(id));
    userScore -= incorrectlySelectedRealImages.length;
    
    // Deduct a point for each AI image that wasn't selected
    const missedAIImages = aiImageIDs.filter(id => !selected.includes(id));
    userScore -= missedAIImages.length;
    
    // Ensure score isn't negative
    userScore = Math.max(0, userScore);
    
    setScore(userScore);
    setIsGameFinished(true);
  }

  if (isGameFinished) {
    // Determine which images are AI after submission
    const aiImageIDs = images
      .filter(img => !img.src.includes('PIXABAY'))
      .map(img => img.id);

    // Calculate score descriptions for feedback
    const perfectScore = score === 4;
    const goodScore = score >= 2 && score < 4;
    const lowScore = score < 2;

    return (
      <vstack height="100%" width="100%" gap="small" alignment="center top">
        <spacer size="medium" />
        <text size="xlarge" weight="bold">All done!</text>
        <text>Your score: {score} / 4</text>
        <text color={perfectScore ? "green" : (goodScore ? "orange" : "red")}>
          {perfectScore 
            ? "Perfect! You correctly identified all images!" 
            : (goodScore 
                ? "Good job! You got most images right." 
                : "Try again! You missed several images.")}
        </text>
        
        <vstack gap="small" width="90%" alignment="start">
          <text weight="bold">Results:</text>
          <vstack gap="small">
            {images.map(img => {
              const isAI = !img.src.includes('PIXABAY');
              const wasSelected = selected.includes(img.id);
              const isCorrect = (isAI && wasSelected) || (!isAI && !wasSelected);
              
              // Determine the status message and color
              let statusMessage = '';
              let statusColor = '';
              
              if (isAI && wasSelected) {
                statusMessage = "✓ Correctly identified as AI";
                statusColor = "green";
              } else if (isAI && !wasSelected) {
                statusMessage = "✗ You missed this AI image";
                statusColor = "red";
              } else if (!isAI && !wasSelected) {
                statusMessage = "✓ Correctly left unselected (Real photo)";
                statusColor = "green";
              } else if (!isAI && wasSelected) {
                statusMessage = "✗ Incorrectly selected (Real photo)";
                statusColor = "red";
              }
              
              return (
                <vstack key={img.id} gap="small" padding="small" width="100%">
                  <text weight="bold">{img.label}</text>
                  <text color={statusColor}>{statusMessage}</text>
                </vstack>
              );
            })}
          </vstack>
        </vstack>

        <spacer size="medium" />
        
        <hstack gap="large">
          <button
            onPress={() => {
              setScore(0);
              setSelected([]);
              setIsGameFinished(false);
            }}
            size="medium"
          >
            Play again
          </button>
        </hstack>
        
        <spacer size="small" />
      </vstack>
    );
  }

  return (
    <vstack height="100%" width="100%" gap="small" alignment="center top">
      <spacer size="medium" />
      <text size="large" weight="bold">Spot the AI-Generated Images!</text>
      <text>Select ALL images that you believe were created by AI</text>

      <vstack gap="medium" width="400px" alignment="center middle">
        <hstack gap="medium" width="100%" alignment="center">
          {images.slice(0, 2).map((entry) => {
            const isSelected = selected.includes(entry.id);
            return (
              <vstack key={entry.id} gap="small" alignment="center middle" width="160px">
                <image 
                  url={entry.src}
                  imageHeight={120} 
                  imageWidth={120}
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
        <hstack gap="medium" width="100%" alignment="center">
          {images.slice(2, 4).map((entry) => {
            const isSelected = selected.includes(entry.id);
            return (
              <vstack key={entry.id} gap="small" alignment="center middle" width="160px">
                <image 
                  url= {entry.src}
                  imageHeight={120} 
                  imageWidth={120}
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

      <spacer size="small" />

      <vstack width="200px" alignment="center">
        <button
          onPress={handleSubmit}
          disabled={selected.length === 0}
          size="medium"
          appearance="primary"
        >
          SUBMIT
        </button>
      </vstack>
    </vstack>
  );
}; 