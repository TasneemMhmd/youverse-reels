// Fisher-Yates shuffle algorithm for true randomization
export const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Ensure no consecutive clips from same video
export const ensureNoConsecutiveClips = (videos, clipData) => {
    const videoIds = videos.map(v => v.id);
    const usedRanges = new Map();

    // Generate unique time ranges for each video instance
    const newClipData = { ...clipData };

    videoIds.forEach((videoId, index) => {
        if (!usedRanges.has(videoId)) {
            usedRanges.set(videoId, []);
        }

        let startTime;
        let attempts = 0;
        const maxAttempts = 20;

        do {
            startTime = Math.floor(Math.random() * 290) + 10;
            attempts++;
        } while (
            attempts < maxAttempts &&
            usedRanges.get(videoId).some(range =>
                Math.abs(startTime - range) < 30 // Ensure at least 30 seconds difference
            )
        );

        usedRanges.get(videoId).push(startTime);
        newClipData[`${videoId}_${index}`] = { startTime };
    });

    return newClipData;
};