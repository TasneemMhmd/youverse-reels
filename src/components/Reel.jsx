import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Volume2, VolumeX } from 'lucide-react';
import Comments from './Comments';
import { getYouTubeVideoId } from '../../utils/youtubeUtils';

// Global YouTube API management
let youtubeAPILoaded = false;
let youtubeAPIPromise = null;

const loadYouTubeAPI = () => {
    if (youtubeAPILoaded) return Promise.resolve();
    if (youtubeAPIPromise) return youtubeAPIPromise;

    youtubeAPIPromise = new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            youtubeAPILoaded = true;
            resolve();
            return;
        }

        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (!existingScript) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            tag.async = true;
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        const originalCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            youtubeAPILoaded = true;
            if (originalCallback) originalCallback();
            resolve();
        };
    });

    return youtubeAPIPromise;
};

const Reel = React.memo(({ video, transcription, isActive, onNext, onPrevious, isPreloading = false, clipData }) => {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const intervalRef = useRef(null);
    const initTimeoutRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [comments, setComments] = useState([
        {
            author: 'Sarah Johnson',
            text: 'Great explanation! This really helped me understand the concept better.',
            time: '2 hours ago'
        },
        {
            author: 'Mike Chen',
            text: 'Thanks for making learning so engaging!',
            time: '4 hours ago'
        },
        {
            author: 'Emma Davis',
            text: 'Could you do more videos on this topic?',
            time: '6 hours ago'
        }
    ]);

    const clipDuration = 10;
    const { startTime = 0 } = clipData || {};
    const videoId = getYouTubeVideoId(video?.url);
    const videoUniqueKey = `${videoId}_${startTime}`;

    // Reset states when video changes
    useEffect(() => {
        setIsPlaying(false);
        setVideoLoaded(false);
        setProgress(0);
        setCurrentTime(0);
        setHasError(false);
        setIsInitializing(false);
    }, [videoUniqueKey]);

    const destroyPlayer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        
        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
            initTimeoutRef.current = null;
        }

        if (playerRef.current) {
            try {
                if (typeof playerRef.current.destroy === 'function') {
                    playerRef.current.destroy();
                }
            } catch (err) {
                console.error('Error destroying player:', err);
            }
            playerRef.current = null;
        }
    }, []);

    const createPlayer = useCallback(async () => {
        if (!videoId || !containerRef.current || isInitializing) return;
        
        setIsInitializing(true);
        setHasError(false);

        try {
            // Ensure YouTube API is loaded
            await loadYouTubeAPI();
            
            // Destroy any existing player
            destroyPlayer();

            // Create iframe element directly for faster initialization
            const iframe = document.createElement('div');
            iframe.id = `youtube-player-${videoUniqueKey}`;
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(iframe);

            const player = new window.YT.Player(iframe, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    fs: 0,
                    cc_load_policy: 0,
                    iv_load_policy: 3,
                    autohide: 1,
                    start: Math.floor(startTime),
                    end: Math.floor(startTime + clipDuration),
                    mute: isMuted ? 1 : 0,
                    disablekb: 1,
                    playsinline: 1,
                    color: 'white',
                    origin: window.location.origin,
                    enablejsapi: 1,
                    html5: 1,
                    hd: 0,
                },
                events: {
                    onReady: (event) => {
                        playerRef.current = player;
                        setVideoLoaded(true);
                        setIsInitializing(false);
                        
                        if (isMuted) {
                            event.target.mute();
                        }

                        if (isActive && !isPreloading) {
                            initTimeoutRef.current = setTimeout(() => {
                                try {
                                    event.target.seekTo(startTime, true);
                                    event.target.playVideo();
                                } catch (err) {
                                    console.error('Error starting playback:', err);
                                }
                            }, 100);
                        }
                    },
                    onStateChange: (event) => {
                        const state = event.data;
                        
                        if (state === window.YT.PlayerState.PLAYING) {
                            setIsPlaying(true);
                            startProgressTracking();
                        } else if (state === window.YT.PlayerState.PAUSED) {
                            setIsPlaying(false);
                            stopProgressTracking();
                        } else if (state === window.YT.PlayerState.ENDED) {
                            onNext();
                        } else if (state === window.YT.PlayerState.BUFFERING) {
                            setIsPlaying(false);
                        }
                    },
                    onError: (error) => {
                        console.error('YouTube Player Error:', error.data);
                        setHasError(true);
                        setIsInitializing(false);
                        setVideoLoaded(false);
                    }
                },
            });

        } catch (err) {
            console.error('Error creating YouTube player:', err);
            setHasError(true);
            setIsInitializing(false);
        }
    }, [videoId, videoUniqueKey, startTime, clipDuration, isMuted, isActive, isPreloading, onNext, destroyPlayer]);

    // Initialize player when component mounts or video changes
    useEffect(() => {
        if (videoId && (isActive || isPreloading)) {
            createPlayer();
        }
        
        return () => {
            destroyPlayer();
        };
    }, [videoId, isActive, isPreloading, createPlayer, destroyPlayer]);

    const startProgressTracking = useCallback(() => {
        if (intervalRef.current) return; 
        
        intervalRef.current = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                try {
                    const currentVideoTime = playerRef.current.getCurrentTime();
                    const clipCurrentTime = currentVideoTime - startTime;
                    const progressPercent = Math.max(0, Math.min(100, (clipCurrentTime / clipDuration) * 100));

                    setProgress(progressPercent);
                    setCurrentTime(clipCurrentTime);

                    // Auto-advance when clip duration is reached
                    if (clipCurrentTime >= clipDuration - 0.5) {
                        onNext();
                    }
                } catch (err) {
                    console.error('Error tracking progress:', err);
                }
            }
        }, 200); // Reduced frequency for better performance
    }, [startTime, clipDuration, onNext]);

    const stopProgressTracking = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (!playerRef.current || isPreloading || !videoLoaded || isInitializing) return;

        try {
            if (isPlaying) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        } catch (err) {
            console.error('Error toggling play:', err);
        }
    }, [isPlaying, isPreloading, videoLoaded, isInitializing]);

    const toggleMute = useCallback(() => {
        if (!playerRef.current) return;

        try {
            if (isMuted) {
                playerRef.current.unMute();
                setIsMuted(false);
            } else {
                playerRef.current.mute();
                setIsMuted(true);
            }
        } catch (err) {
            console.error('Error toggling mute:', err);
        }
    }, [isMuted]);

    const handleAddComment = useCallback((commentText) => {
        const newComment = {
            author: 'You',
            text: commentText,
            time: 'Just now'
        };
        setComments(prev => [newComment, ...prev]);
    }, []);

    const handleShare = async () => {
        const shareData = {
            title: video.title || 'Educational Content',
            text: `Check out this educational content: ${video.title || 'Amazing learning experience!'}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                // Simple notification
                const notification = document.createElement('div');
                notification.textContent = 'Link copied to clipboard!';
                notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded-lg z-50 text-sm';
                document.body.appendChild(notification);
                setTimeout(() => document.body.removeChild(notification), 2000);
            }
        } catch (err) {
            console.log('Share cancelled or failed');
        }
    };

    // Handle active state changes
    useEffect(() => {
        if (isActive && videoLoaded && playerRef.current && !isPreloading) {
            try {
                playerRef.current.seekTo(startTime, true);
                setTimeout(() => {
                    if (playerRef.current) {
                        playerRef.current.playVideo();
                    }
                }, 200);
            } catch (err) {
                console.error('Error starting playback:', err);
            }
        } else if (!isActive && playerRef.current) {
            try {
                playerRef.current.pauseVideo();
            } catch (err) {
                console.error('Error pausing:', err);
            }
        }
    }, [isActive, videoLoaded, startTime, isPreloading]);

    // Keyboard controls (only for active reel)
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.key.toLowerCase() === 'm') {
                e.preventDefault();
                toggleMute();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, togglePlay, toggleMute]);

    if (!video || !videoId) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="text-white text-lg">Invalid video</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* YouTube Player Container */}
            <div 
                ref={containerRef}
                className="absolute inset-0 w-full h-full"
                style={{
                    transform: 'scale(1.02)',
                    transformOrigin: 'center center',
                }}
            />
            
            {/* Overlay to hide YouTube branding */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black via-transparent to-transparent opacity-60 z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 z-10"></div>
                <div className="absolute top-2 right-2 w-20 h-10 bg-black opacity-80 z-10 rounded"></div>
                <div className="absolute bottom-2 right-2 w-24 h-10 bg-black opacity-80 z-10 rounded"></div>
            </div>

            {/* Loading States */}
            {(isInitializing || (!videoLoaded && !hasError)) && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                    <div className="text-white text-sm">Loading video...</div>
                </div>
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                    <div className="text-red-400 text-lg mb-2">⚠️</div>
                    <div className="text-white text-sm mb-4">Failed to load video</div>
                    <button 
                        onClick={createPlayer}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-600 bg-opacity-50 z-30">
                <motion.div
                    className="h-full bg-white"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                />
            </div>

            {/* Play/Pause Overlay */}
            <div
                className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                onClick={togglePlay}
            >
                <AnimatePresence>
                    {!isPlaying && videoLoaded && !isInitializing && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-black bg-opacity-60 rounded-full p-4 backdrop-blur-sm"
                        >
                            <Play className="text-white" size={48} fill="white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-30">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMute}
                    className="bg-black bg-opacity-60 rounded-full p-2 text-white backdrop-blur-sm"
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </motion.button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-30">
                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className="flex flex-col items-center space-y-1"
                >
                    <div className={`p-3 rounded-full transition-all duration-200 ${
                        isLiked ? 'bg-red-500' : 'bg-black bg-opacity-60 backdrop-blur-sm'
                    }`}>
                        <Heart
                            size={24}
                            className={isLiked ? 'text-white fill-white' : 'text-white'}
                        />
                    </div>
                    <span className="text-white text-xs font-medium">{isLiked ? '1.2k' : '1.1k'}</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setShowComments(true)}
                    className="flex flex-col items-center space-y-1"
                >
                    <div className="bg-black bg-opacity-60 p-3 rounded-full backdrop-blur-sm">
                        <MessageCircle size={24} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">{comments.length}</span>
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={handleShare}
                    className="flex flex-col items-center space-y-1"
                >
                    <div className="bg-black bg-opacity-60 p-3 rounded-full backdrop-blur-sm">
                        <Share2 size={24} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium">Share</span>
                </motion.button>

                {/* Creator Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-2 border-white shadow-lg">
                    <span className="text-white font-bold text-lg">
                        {video.creator?.split(' ').map(n => n[0]).join('') || 'ED'}
                    </span>
                </div>
            </div>

            {/* Content Info */}
            <div className="absolute bottom-4 left-0 right-16 p-4 z-30">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                >
                    {/* Creator Info */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {video.creator?.split(' ').map(n => n[0]).join('') || 'ED'}
                            </span>
                        </div>
                        <div>
                            <div className="text-white font-semibold text-sm">{video.creator || 'Educational Creator'}</div>
                            <div className="text-gray-300 text-xs">{video.skill}</div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full">
                            {video.category}
                        </span>
                        <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                            {video.subcategory}
                        </span>
                    </div>

                    {/* Transcription */}
                    <div className="bg-black bg-opacity-70 rounded-lg p-3 backdrop-blur-sm">
                        <p className="text-white text-sm leading-relaxed line-clamp-3">
                            {transcription}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Comments Modal */}
            <Comments
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                videoTitle={video.title}
                comments={comments}
                onAddComment={handleAddComment}
            />
        </div>
    );
});

export default Reel;