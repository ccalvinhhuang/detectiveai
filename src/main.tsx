import { Devvit, useState } from '@devvit/public-api';
import { 
  DEVVIT_SETTINGS_KEYS, 
  AUTO_POST_JOB_NAME, 
  AUTO_POST_JOB_ID_KEY,
  POST_CATEGORY_KEY_PATTERN
} from './constants.js';
import { Preview } from './components/Preview.js';
import imageData from './imageData.json' assert { type: 'json' };

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

// Define the scheduler job that will create posts every 6 hours
Devvit.addSchedulerJob({
  name: AUTO_POST_JOB_NAME,
  onRun: async (event, context) => {
    try {
      const { reddit, redis } = context;
      const subreddit = await reddit.getCurrentSubreddit();
      
      // Get all available topics
      const uniqueTopics = getUniqueTopics();
      console.log('Available topics:', uniqueTopics);
      
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
      
      console.log('Selected topic:', selectedTopic);
      
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
        console.log(`Stored category in Redis: ${selectedTopic}`);
        
        // Get shuffled images for the selected topic
        const selectedImages = getShuffledImagesForTopic(selectedTopic, post.id);
        console.log('Selected images:', selectedImages);
        
        // Store the selected images in Redis
        const postImagesKey = `post_images:${post.id}`;
        await redis.set(postImagesKey, JSON.stringify(selectedImages));
        console.log('Stored images in Redis:', selectedImages);
        
        // Add the new category to the set of used categories
        usedCategories.push(selectedTopic);
        await redis.set('previousCategories', JSON.stringify(usedCategories));
        
        // Set initialization flags
        await redis.set(`post_initialized:${post.id}`, 'true');
        await redis.set(`post_category_set:${post.id}`, 'true');
        
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

// Set up auto-posting when the app is installed (if enabled in settings)
Devvit.addTrigger({
  event: 'AppInstall',
  onEvent: async (event, context) => {
    try {
      // Get the enable auto-posting setting
      const settings = await context.settings.getAll();
      const enableAutoPosting = !!settings[DEVVIT_SETTINGS_KEYS.ENABLE_AUTO_POSTING];
      
      if (enableAutoPosting) {
        // Check if a job is already running
        const existingJobId = await context.redis.get(AUTO_POST_JOB_ID_KEY);
        if (existingJobId) {
          // Job already exists, no need to create a new one
          console.log('Auto-posting job already exists, skipping setup');
          return;
        }
        
        // Schedule the job to run every 6 hours
        const jobId = await context.scheduler.runJob({
          name: AUTO_POST_JOB_NAME,
          cron: '0 */6 * * *'
        });
        
        // Store the job ID in Redis
        await context.redis.set(AUTO_POST_JOB_ID_KEY, jobId);
        
        console.log('Auto-posting job scheduled on app install');
      }
    } catch (error) {
      console.error('Error setting up auto-posting on app install:', error);
    }
  },
});

// Menu item to create a single post
Devvit.addMenuItem({
  label: 'Make my experience post MQ 3/26',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui, redis } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    
    // Create the post
    const post = await reddit.submitPost({
      title: 'AI Image Detection Game',
      subredditName: subreddit.name,
      preview: <Preview text="Loading AI Image Detection Game..." />
    });
    
    // Store post initialization data in Redis
    try {
      // Get all available topics and previously used categories
      const uniqueTopics = getUniqueTopics();
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
      
      // Store the category in Redis under post_category:[postId]
      const postCategoryKey = `post_category:${post.id}`;
      await redis.set(postCategoryKey, selectedTopic);
      
      // Add the new category to the set of used categories
      usedCategories.push(selectedTopic);
      await redis.set('previousCategories', JSON.stringify(usedCategories));
      
      // Set initialization flags
      await redis.set(`post_initialized:${post.id}`, 'true');
      await redis.set(`post_category_set:${post.id}`, 'true');
      
      console.log(`Post ${post.id} assigned category: ${selectedTopic} with initialization flags`);
    } catch (error) {
      console.error('Error storing category in Redis:', error);
    }
    
    ui.showToast({ text: 'Created post!' });
    ui.navigateTo(post.url);
  },
});

// Define types for our image data and sorting
type ImageData = {
  [key: string]: string[];
};

type ImageSortItem = {
  img: string;
  sortKey: number;
};

// Helper functions for image data management
const getUniqueTopics = (): string[] => {
  return Object.keys(imageData as ImageData);
};

const getImagesForTopic = (topic: string): string[] => {
  return (imageData as ImageData)[topic] || [];
};

// Function to get deterministically shuffled images for a topic
function getShuffledImagesForTopic(topic: string, postId: string): string[] {
  const topicImages = getImagesForTopic(topic);
  
  return topicImages
    .map((img: string, index: number): ImageSortItem => ({ 
      img, 
      sortKey: postId ? (postId.charCodeAt(index % postId.length) + index) : index 
    }))
    .sort((a: ImageSortItem, b: ImageSortItem) => a.sortKey - b.sortKey)
    .slice(0, 4)
    .map((item: ImageSortItem) => item.img);
}

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
      const uniqueTopics = getUniqueTopics();
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
      
      const postCategoryKey = `post_category:${post.id}`;
      await redis.set(postCategoryKey, selectedTopic);
      
      // Add the new category to the set of used categories
      usedCategories.push(selectedTopic);
      await redis.set('previousCategories', JSON.stringify(usedCategories));
      
      // Get shuffled images for the selected topic
      const selectedImages = getShuffledImagesForTopic(selectedTopic, post.id);
      
      // Store the selected images in Redis
      const postImagesKey = `post_images:${post.id}`;
      await redis.set(postImagesKey, JSON.stringify(selectedImages));
      
      // Set initialization flags
      await redis.set(`post_initialized:${post.id}`, 'true');
      await redis.set(`post_category_set:${post.id}`, 'true');
      
      console.log(`Initial auto-post ${post.id} assigned category: ${selectedTopic} with initialization flags`);
      
      // Schedule the job to run every 6 hours
      const jobId = await scheduler.runJob({
        name: AUTO_POST_JOB_NAME,
        cron: '0 */6 * * *'
      });
      
      // Store the job ID so we can cancel it later if needed
      await redis.set(AUTO_POST_JOB_ID_KEY, jobId);
      
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

    // Load category from Redis - fetch it before the component renders
    let storedCategory: string | null = null;
    try {
      // This is just to initialize the variable, we'll use it later in a non-async way
      // This will execute synchronously when the component renders
      const postCategoryKey = `post_category:${context.postId}`;
      context.redis.get(postCategoryKey).then(category => {
        // We can't use the result here, but we can store it for later use
        if (category) {
          storedCategory = category;
          
          // If needed, regenerate images with the stored category
          const newData = generateImagesFromPostId();
          setImages(newData.images);
          setCategory(newData.category);
        }
      }).catch(error => {
        console.error('Error fetching category from Redis:', error);
      });
    } catch (error) {
      console.error('Error fetching category from Redis:', error);
    }
    
    // Generate the images based on postId
    const generateImagesFromPostId = () => {
      // Use stored category if available, otherwise generate deterministically
      const determinedCategory = storedCategory || (() => {
        // Generate deterministic category based on postId
        const categories = getUniqueTopics();
        let hash = 0;
        if (context.postId) {
          for (let i = 0; i < context.postId.length; i++) {
            hash = (hash + context.postId.charCodeAt(i)) % categories.length;
          }
        }
        return categories[hash];
      })();
      
      // Get images for the determined category
      const categoryName = typeof determinedCategory === 'string' ? determinedCategory : 'gymnastics';
      const categoryImages = getImagesForTopic(categoryName);
      
      // Use a deterministic shuffle based on postId
      const selectedImages = categoryImages
        .map((img: string, index: number) => ({ 
          img, 
          sortKey: context.postId ? (context.postId.charCodeAt(index % context.postId.length) + index) : index 
        }))
        .sort((a: {img: string, sortKey: number}, b: {img: string, sortKey: number}) => a.sortKey - b.sortKey)
        .slice(0, 4)
        .map((item: {img: string, sortKey: number}) => item.img);
      
      return {
        category: determinedCategory,
        images: createImageEntries(selectedImages)
      };
    };
    
    // Initialize our state
    const generatedData = generateImagesFromPostId();
    
    const [selected, setSelected] = useState<string[]>([]);
    const [score, setScore] = useState(0);
    const [isGameFinished, setIsGameFinished] = useState(false);
    const [images, setImages] = useState<ImageEntry[]>(generatedData.images);
    const [viewImagesMode, setViewImagesMode] = useState(false);
    const [category, setCategory] = useState<string>(typeof generatedData.category === 'string' ? generatedData.category : '');

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
  },
});

export default Devvit;
