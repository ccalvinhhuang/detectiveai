import { Devvit, useState } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from '../constants.js';

/** Each "image entry" includes a boolean `isAI` so we know which are correct. */
type ImageEntry = {
  id: string;
  label: string;
  src: string;
  isAI: boolean;
};

/**
 * Groups images by their category based on filename patterns.
 * Filenames follow the pattern: output_images_[ID]_[CATEGORY]_[SOURCE]_[INDEX].png
 */
function groupImagesByCategory(fileList: string[]): Record<string, string[]> {
  const groupedImages: Record<string, string[]> = {};
  
  fileList.forEach(filename => {
    // Parse category from filename
    const match = filename.match(/output_images_\d+_([^_]+)_/);
    if (match && match[1]) {
      const category = match[1];
      if (!groupedImages[category]) {
        groupedImages[category] = [];
      }
      groupedImages[category].push(filename);
    }
  });
  
  return groupedImages;
}

/**
 * Selects a random category that has at least 4 images
 */
function selectRandomCategory(groupedImages: Record<string, string[]>): string {
  const eligibleCategories = Object.keys(groupedImages).filter(
    category => groupedImages[category].length >= 4
  );
  
  if (eligibleCategories.length === 0) {
    // Fallback to a category with the most images if none have 4+
    const categories = Object.keys(groupedImages);
    categories.sort((a, b) => 
      groupedImages[b].length - groupedImages[a].length
    );
    return categories[0] || 'gymnastics'; // Fallback to gymnastics if no categories
  }
  
  const randomIndex = Math.floor(Math.random() * eligibleCategories.length);
  return eligibleCategories[randomIndex];
}

/**
 * Creates ImageEntry objects from filenames
 */
function createImageEntries(filenames: string[]): ImageEntry[] {
  return filenames.map((filename, index) => {
    // Determine if it's AI based on the filename (not containing PIXABAY)
    const isAI = !filename.includes('PIXABAY');
    
    // Extract the category from the filename for the label
    const categoryMatch = filename.match(/output_images_\d+_([^_]+)_/);
    const category = categoryMatch ? categoryMatch[1] : 'Image';
    
    return {
      id: `image${index}`,
      label: `${category} Shot ${index + 1}`,
      src: filename,
      isAI
    };
  });
}

/**
 * Generate random images from the same category
 */
function generateRandomImages(): ImageEntry[] {
  // These are all the available image files - in a real app, this would be fetched dynamically
  const availableImages = [
    'output_images_2061597_gymnastics_FAL_flux-pro_v1.1-ultra_1.png',
    'output_images_2061597_gymnastics_FAL_flux-pro_v1.1_0.png',
    'output_images_2061597_gymnastics_FAL_flux_dev_2.png',
    'output_images_2061597_gymnastics_PIXABAY_0.png',
    'output_images_224317_Butterfly_PIXABAY_0.png',
    'output_images_224317_Butterfly_PIXABAY_1.png',
    'output_images_224317_Butterfly_PIXABAY_2.png',
    'output_images_224317_Butterfly_PIXABAY_3.png',
    'output_images_7781489_Whale_FAL_flux-pro_v1.1_2.png',
    'output_images_7781489_Whale_FAL_flux_dev_0.png',
    'output_images_7781489_Whale_FAL_imagen3_1.png',
    'output_images_7781489_Whale_PIXABAY_0.png'
  ];
  
  // Group images by category
  const groupedImages = groupImagesByCategory(availableImages);
  
  // Select a random category with at least 4 images
  const selectedCategory = selectRandomCategory(groupedImages);
  
  // Get all images from the selected category
  const categoryImages = groupedImages[selectedCategory] || [];
  
  // Shuffle and select the first 4 images
  const shuffledImages = [...categoryImages].sort(() => 0.5 - Math.random());
  const selectedImages = shuffledImages.slice(0, 4);
  
  // Create image entry objects
  return createImageEntries(selectedImages);
}

export const AIImagePage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [images, setImages] = useState<ImageEntry[]>(generateRandomImages());
  const [viewImagesMode, setViewImagesMode] = useState(false);

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
    
    // Special case: If there are no AI images and user selected none, they get a perfect score
    if (aiImageIDs.length === 0 && selected.length === 0) {
      userScore = 4;
    } else {
      // Deduct a point for each real image incorrectly selected as AI
      const incorrectlySelectedRealImages = selected.filter(id => realImageIDs.includes(id));
      userScore -= incorrectlySelectedRealImages.length;
      
      // Deduct a point for each AI image that wasn't selected
      const missedAIImages = aiImageIDs.filter(id => !selected.includes(id));
      userScore -= missedAIImages.length;
    }
    
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

    // If in view images mode, show a neat grid of images
    if (viewImagesMode) {
      return (
        <vstack height="100%" width="100%" gap="small" alignment="center top">
          <spacer size="medium" />
          <text size="xlarge" weight="bold">Image Gallery</text>
          <text>Here are the images from your game</text>
          
          <vstack gap="medium" width="90%" alignment="center middle">
            <hstack gap="medium" width="100%" alignment="center">
              {images.slice(0, 2).map((entry) => {
                const isAI = !entry.src.includes('PIXABAY');
                return (
                  <vstack key={entry.id} gap="small" alignment="center middle" width="160px">
                    <image 
                      url={entry.src}
                      imageHeight={160} 
                      imageWidth={160}
                    />
                    <text weight="bold">{entry.label}</text>
                    <text color={isAI ? "red" : "green"}>
                      {isAI ? "AI-Generated" : "Real Photo"}
                    </text>
                  </vstack>
                );
              })}
            </hstack>
            <hstack gap="medium" width="100%" alignment="center">
              {images.slice(2, 4).map((entry) => {
                const isAI = !entry.src.includes('PIXABAY');
                return (
                  <vstack key={entry.id} gap="small" alignment="center middle" width="160px">
                    <image 
                      url={entry.src}
                      imageHeight={160} 
                      imageWidth={160}
                    />
                    <text weight="bold">{entry.label}</text>
                    <text color={isAI ? "red" : "green"}>
                      {isAI ? "AI-Generated" : "Real Photo"}
                    </text>
                  </vstack>
                );
              })}
            </hstack>
          </vstack>

          <spacer size="medium" />
          
          <button
            onPress={() => {
              setViewImagesMode(false);
            }}
            size="medium"
          >
            Back to Results
          </button>
          
          <spacer size="small" />
        </vstack>
      );
    }

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
              setViewImagesMode(true);
            }}
            size="medium"
          >
            View Images
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
      <text>Select ALL images that you believe were created by AI (or none if you think all are real)</text>

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
          size="medium"
          appearance="primary"
        >
          SUBMIT
        </button>
      </vstack>
    </vstack>
  );
}; 