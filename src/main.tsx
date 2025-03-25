import { Devvit } from '@devvit/public-api';
import { 
  DEVVIT_SETTINGS_KEYS, 
  AUTO_POST_JOB_NAME, 
  AUTO_POST_JOB_ID_KEY 
} from './constants.js';
import { AIImagePage } from './pages/AIImagePage.js';
import { Preview } from './components/Preview.js';

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
      const { reddit } = context;
      const subreddit = await reddit.getCurrentSubreddit();
      
      // Create a new post
      const post = await reddit.submitPost({
        title: `AI Image Detection Game - ${new Date().toLocaleString()}`,
        subredditName: subreddit.name,
        preview: <Preview text="Loading AI Image Detection Game..." />
      });
      
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
  label: 'Make my experience post AX 3/24',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: 'AI Image Detection Game',
      subredditName: subreddit.name,
      preview: <Preview text="Loading AI Image Detection Game..." />
    });
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
  render: () => {
    return <AIImagePage />;
  },
});

export default Devvit;
