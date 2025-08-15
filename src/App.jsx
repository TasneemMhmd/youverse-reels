import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Reel from './components/Reel';
import Loading from './components/Loading';
import Error from './components/Error';
import { shuffleArray, ensureNoConsecutiveClips } from '../utils/shuffleUtils';

// API endpoints
const VIDEOS_API_URL = 'https://api.jsonbin.io/v3/b/689b3a9cae596e708fc82c19/latest?meta=false';
const TRANSCRIPTIONS_API_URL = 'https://api.jsonbin.io/v3/b/689b3ab243b1c97be91c75da/latest?meta=false';

const App = () => {
  const [videos, setVideos] = useState([]);
  const [transcriptions, setTranscriptions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoClipData, setVideoClipData] = useState({});
  const [videoStates, setVideoStates] = useState({}); // Track video states for previous/next navigation

  // Fetch data from APIs
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [videosResponse, transcriptionsResponse] = await Promise.all([
          fetch(VIDEOS_API_URL),
          fetch(TRANSCRIPTIONS_API_URL)
        ]);

        if (!videosResponse.ok || !transcriptionsResponse.ok) {
          throw new Error('Failed to fetch data from API');
        }

        const videosData = await videosResponse.json();
        const transcriptionsData = await transcriptionsResponse.json();

        if (!isMounted) return;

        // Shuffle videos for random order every time
        const shuffledVideos = shuffleArray(videosData || []);
        setVideos(shuffledVideos);
        setTranscriptions(transcriptionsData || {});

        // Create unique clip data with no consecutive clips from same video
        const clipData = {};
        shuffledVideos.forEach((video, index) => {
          const uniqueId = `${video.id}_${index}_${Date.now()}`;
          let startTime;
          
          // Ensure different start times for same video
          const existingClips = Object.values(clipData).filter(clip => 
            clip.originalVideoId === video.id
          );
          
          do {
            startTime = Math.floor(Math.random() * 290) + 10;
          } while (
            existingClips.some(clip => 
              Math.abs(startTime - clip.startTime) < 30
            )
          );
          
          clipData[uniqueId] = { 
            startTime, 
            originalVideoId: video.id,
            videoIndex: index 
          };
          
          // Add video reference to clip data for easy lookup
          video.uniqueId = uniqueId;
        });
        
        setVideoClipData(clipData);

      } catch (err) {
        if (isMounted) {
          console.error('Error fetching data:', err);
          setError('Failed to load educational content. Please check your internet connection.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCurrentTranscription = useCallback(() => {
    if (!videos[currentIndex] || !transcriptions) return '';
    
    const category = videos[currentIndex].category;
    const categoryTranscriptions = transcriptions[category];
    
    if (!categoryTranscriptions || categoryTranscriptions.length === 0) return '';
    
    const randomIndex = Math.floor(Math.random() * categoryTranscriptions.length);
    return categoryTranscriptions[randomIndex];
  }, [videos, transcriptions, currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = (prev + 1) % videos.length;
      const nextVideo = videos[nextIndex];
      
      if (nextVideo) {
        // Generate new clip data for next video if it doesn't exist
        if (!videoClipData[nextVideo.uniqueId]) {
          const newStartTime = Math.floor(Math.random() * 290) + 10;
          setVideoClipData(prevData => ({
            ...prevData,
            [nextVideo.uniqueId]: { 
              startTime: newStartTime, 
              originalVideoId: nextVideo.id,
              videoIndex: nextIndex 
            }
          }));
        }
      }
      
      // Preload the video after next
      const preloadIndex = (nextIndex + 1) % videos.length;
      const preloadVideo = videos[preloadIndex];
      if (preloadVideo && !videoClipData[preloadVideo.uniqueId]) {
        const newStartTime = Math.floor(Math.random() * 290) + 10;
        setVideoClipData(prevData => ({
          ...prevData,
          [preloadVideo.uniqueId]: { 
            startTime: newStartTime, 
            originalVideoId: preloadVideo.id,
            videoIndex: preloadIndex 
          }
        }));
      }
      
      return nextIndex;
    });
  }, [videos, videoClipData]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => {
      const prevIndex = prev === 0 ? videos.length - 1 : prev - 1;
      const prevVideo = videos[prevIndex];
      
      // Ensure previous video clip data exists (it should, but just in case)
      if (prevVideo && !videoClipData[prevVideo.uniqueId]) {
        const newStartTime = Math.floor(Math.random() * 290) + 10;
        setVideoClipData(prevData => ({
          ...prevData,
          [prevVideo.uniqueId]: { 
            startTime: newStartTime, 
            originalVideoId: prevVideo.id,
            videoIndex: prevIndex 
          }
        }));
      }
      
      return prevIndex;
    });
  }, [videos, videoClipData]);

  // Mouse wheel handling
  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout;

    const handleWheel = (e) => {
      if (isScrolling) return;
      
      e.preventDefault();
      
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
      
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 500);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [handleNext, handlePrevious]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key.toLowerCase()) {
        case 'arrowup':
          e.preventDefault();
          handlePrevious();
          break;
        case 'arrowdown':
          e.preventDefault();
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious]);

  // Handle swipe gestures
  const handleTouchStart = useRef({ x: 0, y: 0 });
  
  const onTouchStart = (e) => {
    handleTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const onTouchEnd = (e) => {
    if (!handleTouchStart.current.x || !handleTouchStart.current.y) return;

    const xDiff = handleTouchStart.current.x - e.changedTouches[0].clientX;
    const yDiff = handleTouchStart.current.y - e.changedTouches[0].clientY;

    if (Math.abs(yDiff) > Math.abs(xDiff) && Math.abs(yDiff) > 50) {
      if (yDiff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} onRetry={() => window.location.reload()} />;
  if (!videos.length) return <Error message="No educational content available" onRetry={() => window.location.reload()} />;

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 500 }}
          className="absolute inset-0"
        >
          <Reel
            video={videos[currentIndex]}
            transcription={getCurrentTranscription()}
            isActive={true}
            onNext={handleNext}
            onPrevious={handlePrevious}
            clipData={videoClipData[videos[currentIndex]?.uniqueId]}
          />
        </motion.div>
      </AnimatePresence>

      {/* Preload next video - Always preload when current video is active */}
      {videos[(currentIndex + 1) % videos.length] && (
        <div className="absolute inset-0 pointer-events-none opacity-0" style={{ zIndex: -1 }}>
          <Reel
            video={videos[(currentIndex + 1) % videos.length]}
            transcription=""
            isActive={false}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isPreloading={true}
            clipData={videoClipData[videos[(currentIndex + 1) % videos.length]?.uniqueId]}
          />
        </div>
      )}
      
      {/* Preload the one after next for even smoother experience */}
      {videos[(currentIndex + 2) % videos.length] && (
        <div className="absolute inset-0 pointer-events-none opacity-0" style={{ zIndex: -2 }}>
          <Reel
            video={videos[(currentIndex + 2) % videos.length]}
            transcription=""
            isActive={false}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isPreloading={true}
            clipData={videoClipData[videos[(currentIndex + 2) % videos.length]?.uniqueId]}
          />
        </div>
      )}
    </div>
  );
};

export default App;