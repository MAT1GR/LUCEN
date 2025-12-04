import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import homeImage from '../assets/home.webp'; // Re-using an existing image as placeholder

const placeholderPosts = [
  { id: 1, image: homeImage, likes: 234, comments: 15 },
  { id: 2, image: 'https://via.placeholder.com/300x300.webp?text=Jean+Style+2', likes: 189, comments: 22 },
  { id: 3, image: 'https://via.placeholder.com/300x300.webp?text=Jean+Style+3', likes: 301, comments: 45 },
  { id: 4, image: 'https://via.placeholder.com/300x300.webp?text=Jean+Style+4', likes: 250, comments: 18 },
];

const InstagramFeed: React.FC = () => {
  return (
    <div className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase">
          Seguinos en Instagram
        </h2>
        <a 
          href="https://www.instagram.com/denimrosario" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-2xl text-gray-700 mt-2 block hover:text-black font-semibold"
        >
          @denimrosario
        </a>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-12">
          {placeholderPosts.map(post => (
            <a 
              key={post.id}
              href="https://www.instagram.com/denim.rosario"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group aspect-square"
            >
              <img 
                src={post.id === 1 ? post.image : post.image.replace('?text=', `?text=${encodeURIComponent('Jean Style ' + post.id)}`)}
                alt={`Instagram post ${post.id}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 text-white">
                  <div className="flex items-center gap-2">
                    <Heart size={20} fill="white" />
                    <span className="font-bold text-lg">{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle size={20} fill="white" />
                    <span className="font-bold text-lg">{post.comments}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramFeed;
