# Youverse Reels

A TikTok-style educational video app that plays random 10-second clips from YouTube videos.

## Features

- **Vertical scrolling** through educational content
- **10-second clips** from random YouTube videos
- **Interactive controls** - like, comment, share
- **Auto-advance** to next video
- **Keyboard shortcuts** - Space (play/pause), M (mute), Arrow keys (navigate)
- **Touch gestures** - Swipe up/down to navigate
- **Mouse wheel** navigation

## Structure

src/
├── components/
│   ├── Reel.jsx           # Main video player component
│   ├── Comments.jsx       # Comments modal
│   ├── Loading.jsx        # Loading screen
│   └── Error.jsx          # Error handling
├── utils/
│   ├── youtubeUtils.js    # YouTube video ID extraction
│   └── shuffleUtils.js    # Array shuffling utilities
├── App.jsx                # Main application component
└── main.jsx              # Application entry point

## Controls

- **Scroll wheel** or **Arrow keys** - Navigate videos
- **Space** - Play/pause
- **M** - Toggle mute
- **Tap screen** - Play/pause
- **Swipe up/down** - Navigate on mobile

## Tech Stack

- React + Framer Motion
- YouTube Iframe API
- Tailwind CSS
- Lucide React icons

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open in browser

## API Data

The app fetches video data and transcriptions from JSONBin APIs configured in the main App component.

## Performance

- Preloads next 2 videos for smooth scrolling
- Optimized YouTube player initialization
- Efficient state management
