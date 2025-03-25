import { Devvit } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from './constants.js';
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
]);

Devvit.configure({
  redditAPI: true,
  http: true,
  redis: true,
  realtime: true,
});

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

Devvit.addCustomPostType({
  name: 'Experience Post',
  height: 'tall',
  render: () => {
    return <AIImagePage />;
  },
});

export default Devvit;
