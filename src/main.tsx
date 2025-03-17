import { Devvit } from '@devvit/public-api';
import { DEVVIT_SETTINGS_KEYS } from './constants.js';
import { AIImagePage } from './pages/AIImagePage.js';

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
  render: () => {
    return <AIImagePage />;
  },
});

export default Devvit;
