import { Page } from './shared';
import { PokemonPage } from './pages/PokemonPage';
import { HomePage } from './pages/HomePage';
import { AIImagePage } from './pages/AiImagePage';
import { AIAudioPage } from './pages/AiAudioPage';
import { AITextPage } from './pages/AiTextPage';
import { LeaderboardPage } from './pages/Leaderboard';
import { usePage } from './hooks/usePage';
import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';

const getPage = (page: Page, { postId }: { postId: string }) => {
  switch (page) {
    case 'home':
      return <HomePage postId={postId} />;
    case 'aiImage':
      return <AIImagePage />;
    case 'aiAudio':
      return <AIAudioPage />;
    case 'aiText':
      return <AITextPage />;
    case 'leaderboard':
      return <LeaderboardPage />;
    case 'pokemon':
      return <PokemonPage />;
    default:
      throw new Error(`Unknown page: ${page satisfies never}`);
  }
};

export const App = () => {
  const [postId, setPostId] = useState('');
  const page = usePage();
  const initData = useDevvitListener('INIT_RESPONSE');

  useEffect(() => {
    sendToDevvit({ type: 'INIT' });
  }, []);

  useEffect(() => {
    if (initData) {
      setPostId(initData.postId);
    }
  }, [initData, setPostId]);

  return <div className="h-full">{getPage(page, { postId })}</div>;
};
