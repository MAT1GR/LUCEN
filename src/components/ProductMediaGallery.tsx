import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayCircle } from 'lucide-react';

interface ProductMediaGalleryProps {
  images: string[];
  video?: string;
}

const ProductMediaGallery: React.FC<ProductMediaGalleryProps> = ({ images, video }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mainGalleryRef = useRef<HTMLDivElement>(null);

  // For swipe functionality (still relevant for scrolling behavior)
  const touchStartX = useRef(0);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mediaItems = [...images, ...(video ? [video] : [])];

  useEffect(() => {
    // Ensure mediaRefs is always the correct size
    mediaRefs.current = mediaRefs.current.slice(0, mediaItems.length);
  }, [mediaItems]);

  // Scroll to the current media item when currentMediaIndex changes
    useEffect(() => {
      // Pause video if currentMediaIndex changes to a non-video item
      if (videoRef.current && mediaItems[currentMediaIndex] !== video) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }, [currentMediaIndex, mediaItems, video]);
  const getMediaUrl = (mediaPath: string) => {
    if (!mediaPath) return '';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    
    let finalPath = mediaPath;
    if (finalPath.startsWith('/uploads/')) {
      finalPath = `/api${finalPath}`;
    }
    return `${apiBaseUrl}${finalPath}`;
  };

  const isVideo = useCallback((mediaPath: string) => video && mediaPath === video, [video]);

  const togglePlay = () => {
    if (videoRef.current) {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }
  }

  const handlePrev = () => {
    setCurrentMediaIndex(prevIndex => (prevIndex - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleNext = () => {
    setCurrentMediaIndex(prevIndex => (prevIndex + 1) % mediaItems.length);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentMediaIndex(index);
  };

  // Swipe handlers for the main gallery container
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touchEndX = e.changedTouches[0].clientX;
    const swipeDistance = touchEndX - touchStartX.current;
    const swipeThreshold = 50; // pixels

    if (swipeDistance > swipeThreshold) {
      // Swiped right (previous)
      handlePrev();
    } else if (swipeDistance < -swipeThreshold) {
      // Swiped left (next)
      handleNext();
    }
  };


  if (mediaItems.length === 0) {
    return (
      <div className="flex-1 aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Media no disponible</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Miniaturas */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden">
        {mediaItems.map((media, index) => (
          <div
            key={index}
            className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-colors ${currentMediaIndex === index ? 'border-brand-pink' : 'border-transparent hover:border-gray-300'}`}
            onClick={() => handleThumbnailClick(index)}
          >
            <img
              src={isVideo(media) ? getMediaUrl(images[0]) : getMediaUrl(media)} // Show first image as thumbnail for video
              alt={`Miniatura ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {isVideo(media) && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <PlayCircle className="text-white" size={32} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Media Gallery */}
                      <div
                          ref={mainGalleryRef} // This will now be the outer container with overflow-hidden
                          className="flex-1 w-full overflow-hidden bg-gray-50 relative flex items-center min-h-[400px] touch-pan-y" // Removed scroll-smooth overscroll-x-contain, added overflow-hidden
                          onTouchStart={handleTouchStart}
                          onTouchEnd={handleTouchEnd}
                      >
                           {mediaItems.length > 0 && (
                                <div className="absolute top-4 right-4 bg-black/50 text-white text-sm px-2 py-1 rounded-full z-10">
                                    {currentMediaIndex + 1}/{mediaItems.length}
                                </div>
                            )}
                          <div
                              className="flex h-full w-full transition-transform duration-300 ease-in-out" // Inner container for sliding
                              style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
                          >
        {mediaItems.map((media, index) => (
          <div
            key={index}
            ref={el => mediaRefs.current[index] = el}
            className="flex-shrink-0 w-full flex items-center justify-center h-full"
          >
            {isVideo(media) ? (
              <>
                <video
                  ref={videoRef}
                  src={getMediaUrl(media)}
                  className="max-h-full max-w-full object-cover"
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  loop
                  muted
                  playsInline
                />
                {!isPlaying && currentMediaIndex === index && ( // Only show play button for current video
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <PlayCircle className="text-white" size={64} />
                    </div>
                )}
              </>
            ) : (
              <img
                src={getMediaUrl(media)}
                alt={`Imagen principal del producto ${index + 1}`}
                className="max-h-full max-w-full object-cover"
              />
            )}
          </div>
        ))}
                           </div> {/* Closing the inner flex div */}

        {/* Navigation Arrows (Bottom Center) */}
        {mediaItems.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 z-10">
            <button
                className="text-black"
                onClick={handlePrev}
            >
                <span className="text-2xl">&larr;</span>
            </button>
            <button
                className="text-black"
                onClick={handleNext}
            >
                <span className="text-2xl">&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductMediaGallery;
