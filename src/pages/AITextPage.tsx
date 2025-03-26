import { Devvit, useState } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from '../constants.js';

/** Each "text entry" includes a boolean `isAI` so we know which are correct. */
type TextEntry = {
  id: string;
  label: string;
  content: string;
  isAI: boolean;
};

/**
 * Generate random text entries
 */
function generateRandomTexts(): TextEntry[] {
  // These are all the available text files - in a real app, this would be fetched dynamically
  const availableTexts = [
    'output_posts_1601389_Sometimesstrangers_just_g_GOOGLE_4_ai.txt',
    'output_posts_1601389_Sometimesstrangers_just_g_comment_1.txt',
    'output_posts_1601389_Sometimesstrangers_just_g_comment_2.txt',
    'output_posts_1601389_Sometimesstrangers_just_g_comment_3.txt'
  ];
  
  // Shuffle and select up to 4 texts
  const shuffledTexts = [...availableTexts].sort(() => 0.5 - Math.random());
  const selectedTexts = shuffledTexts.slice(0, 4);
  
  // Create text entries with content
  return selectedTexts.map((filename, index) => {
    // Determine if it's AI based on the filename (containing "_ai")
    const isAI = filename.includes('_ai');
    
    // Extract a label from the filename
    const descriptionMatch = filename.match(/output_posts_\d+_([^_]+)_/);
    const description = descriptionMatch ? descriptionMatch[1].replace(/_/g, ' ') : 'Text';
    
    // Get content based on filename
    let content = "Text content not available";
    if (filename.includes('GOOGLE_4_ai')) {
      content = "That's so sweet! Sometimes the smallest things can really make a difference when you're feeling down. It's amazing how a simple cookie and a kind word can brighten someone's day. I'm glad you had that experience, it's a good reminder that there's still a lot of good in the world. And that cookie looks delicious!";
    } else if (filename.includes('comment_1')) {
      content = "Definitely I'll be sure to pay it forward whenever I get the chance. Thanks for the kind words";
    } else if (filename.includes('comment_2')) {
      content = "Those little moments are what keep you going during the storms of life. Keep your chin up, you've got this!";
    } else if (filename.includes('comment_3')) {
      content = "I had something similar happen to me last week. A stranger paid for my coffee when I was having the worst day. It's amazing how these small acts of kindness can completely change your outlook.";
    }
    
    return {
      id: `text${index}`,
      label: `${description} ${index + 1}`,
      content,
      isAI
    };
  });
}

export const AITextPage = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [texts, setTexts] = useState<TextEntry[]>(generateRandomTexts());
  const [viewTextsMode, setViewTextsMode] = useState(false);

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

    // Get the IDs of the actual AI texts
    const aiTextIDs = texts.filter((text) => text.isAI).map((text) => text.id);
    
    // Get the IDs of the real texts (not AI-generated)
    const realTextIDs = texts.filter((text) => !text.isAI).map((text) => text.id);
    
    // Calculate score out of 4
    let userScore = 4;
    
    // Special case: If there are no AI texts and user selected none, they get a perfect score
    if (aiTextIDs.length === 0 && selected.length === 0) {
      userScore = 4;
    } else {
      // Deduct a point for each real text incorrectly selected as AI
      const incorrectlySelectedRealTexts = selected.filter(id => realTextIDs.includes(id));
      userScore -= incorrectlySelectedRealTexts.length;
      
      // Deduct a point for each AI text that wasn't selected
      const missedAITexts = aiTextIDs.filter(id => !selected.includes(id));
      userScore -= missedAITexts.length;
    }
    
    // Ensure score isn't negative
    userScore = Math.max(0, userScore);
    
    setScore(userScore);
    setIsGameFinished(true);
  }

  if (isGameFinished) {
    // If in view texts mode, show a neat grid of texts
    if (viewTextsMode) {
      return (
        <vstack height="100%" width="100%" gap="small" alignment="center top">
          <spacer size="medium" />
          <text size="xlarge" weight="bold">Text Analysis Results</text>
          <text>Here are the texts from your game</text>
          
          <vstack gap="medium" width="90%" alignment="center middle">
            {texts.map((entry) => {
              return (
                <vstack key={entry.id} gap="small" alignment="start" width="100%" padding="medium" border="thin">
                  <text weight="bold">{entry.label}</text>
                  <text wrap>{entry.content}</text>
                  <text color={entry.isAI ? "red" : "green"} weight="bold">
                    {entry.isAI ? "AI-Generated" : "Human-Written"}
                  </text>
                </vstack>
              );
            })}
          </vstack>

          <spacer size="medium" />
          
          <button
            onPress={() => {
              setViewTextsMode(false);
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
        <text color={score === 4 ? "green" : (score >= 2 ? "orange" : "red")}>
          {score === 4 
            ? "Perfect! You correctly identified all texts!" 
            : (score >= 2 
                ? "Good job! You got most texts right." 
                : "Try again! You missed several texts.")}
        </text>
        
        <vstack gap="small" width="90%" alignment="start">
          <text weight="bold">Results:</text>
          <vstack gap="small">
            {texts.map(text => {
              const wasSelected = selected.includes(text.id);
              const isCorrect = (text.isAI && wasSelected) || (!text.isAI && !wasSelected);
              
              // Determine the status message and color
              let statusMessage = '';
              let statusColor = '';
              
              if (text.isAI && wasSelected) {
                statusMessage = "✓ Correctly identified as AI";
                statusColor = "green";
              } else if (text.isAI && !wasSelected) {
                statusMessage = "✗ You missed this AI text";
                statusColor = "red";
              } else if (!text.isAI && !wasSelected) {
                statusMessage = "✓ Correctly left unselected (Human-written)";
                statusColor = "green";
              } else if (!text.isAI && wasSelected) {
                statusMessage = "✗ Incorrectly selected (Human-written)";
                statusColor = "red";
              }
              
              return (
                <vstack key={text.id} gap="small" padding="small" width="100%">
                  <text weight="bold">{text.label}</text>
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
              setViewTextsMode(true);
            }}
            size="medium"
          >
            View Texts
          </button>
        </hstack>
        
        <spacer size="small" />
      </vstack>
    );
  }

  return (
    <vstack height="100%" width="100%" gap="small" alignment="center top">
      <spacer size="medium" />
      <text size="large" weight="bold">Spot the AI-Generated Texts!</text>
      <text>Select ALL texts that you believe were created by AI (or none if you think all are human-written)</text>

      <vstack gap="medium" width="90%" alignment="center middle">
        {texts.map((entry) => {
          const isSelected = selected.includes(entry.id);
          return (
            <vstack key={entry.id} gap="small" alignment="start" width="100%" padding="medium" border={isSelected ? "thick" : "thin"}>
              <text wrap>{entry.content}</text>
              <button
                onPress={() => toggleSelected(entry.id)}
                appearance={isSelected ? "primary" : "secondary"}
              >
                {isSelected ? "Selected as AI" : "Select as AI"}
              </button>
            </vstack>
          );
        })}
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