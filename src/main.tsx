import { Devvit, useState } from '@devvit/public-api';
import { 
  DEVVIT_SETTINGS_KEYS, 
  AUTO_POST_JOB_NAME, 
  AUTO_POST_JOB_ID_KEY,
  POST_CATEGORY_KEY_PATTERN
} from './constants.js';
import { Preview } from './components/Preview.js';
import fs from 'fs';
import path from 'path';

Devvit.addSettings([
  {
    name: DEVVIT_SETTINGS_KEYS.SECRET_API_KEY,
    label: 'API Key for secret things',
    type: 'string',
    isSecret: true,
    scope: 'app',
  },
  {
    name: DEVVIT_SETTINGS_KEYS.R2_BUCKET_URL,
    label: 'R2 Bucket URL (e.g., https://detectivebucket.r2.dev)',
    type: 'string',
    scope: 'app',
  },
  {
    name: DEVVIT_SETTINGS_KEYS.ENABLE_AUTO_POSTING,
    label: 'Enable auto-posting of AI detection games every 6 hours',
    type: 'boolean',
    defaultValue: false,
    scope: 'app',
  },
]);

Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true,
});

// Function to get all images from output_images directory
async function getAllImages(): Promise<string[]> {
  const outputDir = path.join(process.cwd(), 'assets', 'output_images');
  try {
    const files = await fs.promises.readdir(outputDir);
    return files.filter(file => file.endsWith('.png'));
  } catch (error) {
    console.error('Error reading output_images directory:', error);
    return [];
  }
}

// Function to extract topic from filename
function getTopicFromFilename(filename: string): string {
  const match = filename.match(/^\d+_([^_]+)_/);
  return match ? match[1] : '';
}

// Function to get all images for a specific topic
function getImagesForTopic(images: string[], topic: string): string[] {
  return images.filter(img => getTopicFromFilename(img) === topic);
}

// Function to get unique topics from all images
function getUniqueTopics(images: string[]): string[] {
  const topics = new Set(images.map(img => getTopicFromFilename(img)));
  return Array.from(topics).filter(topic => topic !== '');
}

// Define the scheduler job that will create posts every 6 hours
Devvit.addSchedulerJob({
  name: AUTO_POST_JOB_NAME,
  onRun: async (event, context) => {
    try {
      const { reddit, redis } = context;
      const subreddit = await reddit.getCurrentSubreddit();
      
      // Get all available images
      const allImages = await getAllImages();
      const uniqueTopics = getUniqueTopics(allImages);
      
      // Get the set of previously used categories
      const previousCategories = await redis.get('previousCategories') || '[]';
      const usedCategories = JSON.parse(previousCategories);
      
      // Find the first topic that hasn't been used
      let selectedTopic = '';
      for (const topic of uniqueTopics) {
        if (!usedCategories.includes(topic)) {
          selectedTopic = topic;
          break;
        }
      }
      
      // If all topics have been used, reset the set
      if (!selectedTopic) {
        await redis.set('previousCategories', '[]');
        selectedTopic = uniqueTopics[0];
      }
      
      // Create a new post
      const post = await reddit.submitPost({
        title: `AI Image Detection Game - ${new Date().toLocaleString()}`,
        subredditName: subreddit.name,
        preview: <Preview text="Loading AI Image Detection Game..." />
      });
      
      // Store post initialization data in Redis
      try {
        // Set the category key
        const postCategoryKey = `post_category:${post.id}`;
        await redis.set(postCategoryKey, selectedTopic);
        
        // Get images for the selected topic
        const topicImages = getImagesForTopic(allImages, selectedTopic);
        
        // Use a deterministic shuffle based on postId
        const selectedImages = topicImages
          .map((img, index) => ({ 
            img, 
            sortKey: post.id ? (post.id.charCodeAt(index % post.id.length) + index) : index 
          }))
          .sort((a, b) => a.sortKey - b.sortKey)
          .slice(0, 4)
          .map(item => item.img);
        
        // Store the selected images in Redis
        const postImagesKey = `post_images:${post.id}`;
        await redis.set(postImagesKey, JSON.stringify(selectedImages));
        
        // Add the new category to the set of used categories
        usedCategories.push(selectedTopic);
        await redis.set('previousCategories', JSON.stringify(usedCategories));
        
        // Set initialization flags
        await redis.set(`post_initialized:${post.id}`, 'false');
        await redis.set(`post_category_set:${post.id}`, 'false');
        
        console.log(`Auto-post ${post.id} assigned category: ${selectedTopic} with initialization flags`);
      } catch (error) {
        console.error('Error storing auto-post category in Redis:', error);
      }
      
      console.log(`Auto-scheduled post created: ${post.id}`);
    } catch (error) {
      console.error('Error creating scheduled post:', error);
    }
  },
});

// Menu item to create a single post
Devvit.addMenuItem({
  label: 'Make my experience post MQ 3/25',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui, redis } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    
    // Get all available images and topics
    const allImages = await getAllImages();
    const uniqueTopics = getUniqueTopics(allImages);
    
    // Randomly select a topic
    const randomTopic = uniqueTopics[Math.floor(Math.random() * uniqueTopics.length)];
    
    // Create the post
    const post = await reddit.submitPost({
      title: 'AI Image Detection Game',
      subredditName: subreddit.name,
      preview: <Preview text="Loading AI Image Detection Game..." />
    });
    
    // Store post initialization data in Redis
    try {
      // Store the category in Redis under post_category:[postId]
      const postCategoryKey = `post_category:${post.id}`;
      await redis.set(postCategoryKey, randomTopic);
      
      // Get images for the selected topic
      const topicImages = getImagesForTopic(allImages, randomTopic);
      
      // Use a deterministic shuffle based on postId
      const selectedImages = topicImages
        .map((img, index) => ({ 
          img, 
          sortKey: post.id ? (post.id.charCodeAt(index % post.id.length) + index) : index 
        }))
        .sort((a, b) => a.sortKey - b.sortKey)
        .slice(0, 4)
        .map(item => item.img);
      
      // Store the selected images in Redis
      const postImagesKey = `post_images:${post.id}`;
      await redis.set(postImagesKey, JSON.stringify(selectedImages));
      
      // Set initialization flags
      await redis.set(`post_initialized:${post.id}`, 'false');
      await redis.set(`post_category_set:${post.id}`, 'false');
      
      console.log(`Post ${post.id} assigned category: ${randomTopic} with initialization flags`);
    } catch (error) {
      console.error('Error storing category in Redis:', error);
    }
    
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post.url);
  },
});

// Menu item to start the auto-post scheduler
Devvit.addMenuItem({
  label: 'Start auto-posting (every 6 hours)',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { scheduler, redis, ui, reddit } = context;
    
    // Check if a job is already running
    const existingJobId = await redis.get(AUTO_POST_JOB_ID_KEY);
    if (existingJobId) {
      ui.showToast({ 
        text: 'Auto-posting is already active! Use the stop option to cancel it first.'
      });
      return;
    }
    
    try {
      // First, immediately create a post so users don't have to wait for the first scheduled run
      const subreddit = await reddit.getCurrentSubreddit();
      
      ui.showToast({
        text: 'Creating your first post now...'
      });
      
      const post = await reddit.submitPost({
        title: `AI Image Detection Game - ${new Date().toLocaleString()}`,
        subredditName: subreddit.name,
        preview: <Preview text="Loading AI Image Detection Game..." />
      });
      
      // Store post initialization data in Redis
      const categories = ['gymnastics', 'Butterfly', 'Whale'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const postCategoryKey = `post_category:${post.id}`;
      
      await redis.set(postCategoryKey, randomCategory);
      
      // Set initialization flags
      await redis.set(`post_initialized:${post.id}`, 'false');
      await redis.set(`post_category_set:${post.id}`, 'false');
      
      console.log(`Initial auto-post ${post.id} assigned category: ${randomCategory} with initialization flags`);
      
      // Schedule the job to run every 6 hours
      // Cron format: minute hour day month day-of-week
      // "0 */6 * * *" means "at minute 0, every 6th hour, every day"
      const jobId = await scheduler.runJob({
        name: AUTO_POST_JOB_NAME,
        cron: '0 */6 * * *'
      });
      
      // Store the job ID so we can cancel it later if needed
      await redis.set(AUTO_POST_JOB_ID_KEY, jobId);
      
      // No need to update settings here, we're using Redis to track job status
      
      ui.showToast({ 
        text: 'Auto-posting scheduled successfully! A new post will be created every 6 hours.',
        appearance: 'success'
      });
      
      // Navigate to the newly created post
      ui.navigateTo(post.url);
    } catch (error) {
      console.error('Error scheduling auto-post job:', error);
      ui.showToast({ 
        text: 'Failed to schedule auto-posting. Please try again.'
      });
    }
  },
});

// Menu item to stop the auto-post scheduler
Devvit.addMenuItem({
  label: 'Stop auto-posting',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { scheduler, redis, ui } = context;
    
    // Get the job ID from Redis
    const jobId = await redis.get(AUTO_POST_JOB_ID_KEY);
    
    if (!jobId) {
      ui.showToast({ 
        text: 'No auto-posting schedule is currently active.'
      });
      return;
    }
    
    try {
      // Cancel the scheduled job
      await scheduler.cancelJob(jobId);
      
      // Remove the job ID from Redis
      await redis.del(AUTO_POST_JOB_ID_KEY);
      
      // No need to update settings here, we're using Redis to track job status
      
      ui.showToast({ 
        text: 'Auto-posting has been stopped successfully.',
        appearance: 'success'
      });
    } catch (error) {
      console.error('Error canceling auto-post job:', error);
      ui.showToast({ 
        text: 'Failed to stop auto-posting. Please try again.'
      });
    }
  },
});

Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render: (context) => {
    /** Each "image entry" includes a boolean `isAI` so we know which are correct. */
    type ImageEntry = {
      id: string;
      label: string;
      src: string;
      isAI: boolean;
    };

    /**
     * Creates ImageEntry objects from filenames
     */
    function createImageEntries(filenames: string[]): ImageEntry[] {
      return filenames.map((filename, index) => {
        // Determine if it's AI based on the filename (not containing PIXABAY)
        const isAI = !filename.includes('PIXABAY');
        
        // Extract the category from the filename for the label
        const categoryMatch = filename.match(/^\d+_([^_]+)_/);
        const category = categoryMatch ? categoryMatch[1] : 'Image';
        
        return {
          id: `image${index}`,
          label: `${category} Shot ${index + 1}`,
          src: filename,
          isAI
        };
      });
    }

    // Initialize state
    const [selected, setSelected] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [images, setImages] = useState<ImageEntry[]>([]);
    const [viewImagesMode, setViewImagesMode] = useState(false);
    const [category, setCategory] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    // Load images immediately
    (async () => {
      try {
        // Get the category from Redis
        const postCategoryKey = `post_category:${context.postId}`;
        const storedCategory = await context.redis.get(postCategoryKey);
        
        if (storedCategory) {
          setCategory(storedCategory);
          
          // Get the image paths from Redis
          const postImagesKey = `post_images:${context.postId}`;
          const storedImages = await context.redis.get(postImagesKey);
          
          if (storedImages) {
            const imagePaths = JSON.parse(storedImages);
            setImages(createImageEntries(imagePaths));
          }
        }
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setIsLoading(false);
      }
    })();

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

    // Show loading state
    if (isLoading) {
      return (
        <vstack height="100%" width="100%" gap="small" alignment="center middle">
          <text size="large" weight="bold">Loading...</text>
          <text>Please wait while we prepare your game.</text>
        </vstack>
      );
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
        {category && <text size="medium" weight="bold">Category: {category}</text>}

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
  },
});

export default Devvit;
