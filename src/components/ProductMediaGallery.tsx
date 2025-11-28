import React, { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';

interface ProductMediaGalleryProps {
  images: string[];
  video?: string;
}

const ProductMediaGallery: React.FC<ProductMediaGalleryProps> = ({ images, video }) => {
  const [selectedMedia, setSelectedMedia] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (images && images.length > 0 && !selectedMedia) {
      setSelectedMedia(images[0]);
    }
  }, [images, selectedMedia]);

  const getMediaUrl = (mediaPath: string) => {
    if (!mediaPath) return '';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    
    // CORRECCIÓN: Si la ruta empieza con /uploads/, le agregamos /api
    let finalPath = mediaPath;
    if (finalPath.startsWith('/uploads/')) {
      finalPath = `/api${finalPath}`;
    }

    return `${apiBaseUrl}${finalPath}`;
  };

  const handleThumbnailClick = (media: string) => {
    if (media === selectedMedia) return;

    setTransitioning(true);

    setTimeout(() => {
      setSelectedMedia(media);
      setTransitioning(false);
    }, 200);
  };

  const isVideo = (mediaPath: string) => video && mediaPath === video;

  if ((!images || images.length === 0) && !video) {
    return (
      <div className="flex-1 aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Media no disponible</p>
      </div>
    );
  }

  const mediaItems = [...images, ...(video ? [video] : [])];

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Miniaturas */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden">
        {mediaItems.map((media, index) => (
          <div
            key={index}
            className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-colors ${selectedMedia === media ? 'border-brand-pink' : 'border-transparent hover:border-gray-300'}`}
            onClick={() => handleThumbnailClick(media)}
          >
            <img
              src={isVideo(media) ? getMediaUrl(images[0]) : getMediaUrl(media)}
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

      {/* Media Principal */}
      <div className="flex-1 w-full overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center min-h-[400px]">
        {selectedMedia && (
          isVideo(selectedMedia) ? (
            <video
              src={getMediaUrl(selectedMedia)}
              controls
              className={`max-h-full max-w-full object-contain transition-opacity duration-200 ease-in-out ${transitioning ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <img
              src={getMediaUrl(selectedMedia)}
              alt="Imagen principal del producto"
              className={`max-h-full max-w-full object-contain transition-opacity duration-200 ease-in-out ${transitioning ? 'opacity-0' : 'opacity-100'}`}
            />
          )
        )}
      </div>
    </div>
  );
};

export default ProductMediaGallery;