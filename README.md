## DetectiveAI

A Reddit app built with Devvit for detecting AI-generated images.

### Tech Stack

- [Devvit](https://developers.reddit.com/docs/): Reddit's Developer Platform that lets you build powerful apps and experiences to enhance the communities you love.
- [Vite](https://vite.dev/): Advanced build tool for the web
- [TailwindCSS](https://tailwindcss.com/): Utility first CSS framework
- [Typescript](https://www.typescriptlang.org/): Strongly typed Javascript superset

## Getting Started

> Make sure you have Node 22 downloaded on your machine before running!

```sh
git clone ....

cd ...

npm install
```

Before continuing, make a subreddit on Reddit.com. This will be where you do your own development. Go to Reddit.com, scroll the left side bar down to communities, and click "Create a community."

Next, go to the `package.json` and update the `dev:devvit` command with your subreddit name.

Finally, go to `devvit.yaml` and name your app (must be 0-16 characters). Once you have, click save, and run `npm run upload` from the root of the repository.

Now all you have to do is run `npm run dev` and navigate to your subreddit.

Run the following line:
devvit settings set R2_BUCKET_URL
And enter the R2 bucket's R2.dev url.


There is one last step! You need to make a new post before you can see it. You can do so by going to your subreddit, clicking the three dots, and tapping "Make my experience post". After you start developing your app, please update the menu item copy (found in `src/main.tsx`).

## Commands

- `npm run dev`: Starts a development server where you can develop your application live on Reddit
- `npm run upload`: Uploads a new version of your app
- `npm run vite`: Runs the Vite development server for quick styling and development

## Project Structure

- `src/main.tsx`: The main entry point of the application
- `src/pages/`: Contains the main pages of the application
- `src/components/`: Reusable UI components
- `src/constants.ts`: Environment variables and constants
- `assets/`: Public folder for static assets

### Key Components

- `AIImagePage.tsx`: The main game interface for detecting AI-generated images
- `Preview.tsx`: Loading state component
