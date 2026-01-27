import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../server/types';

interface ProductCardProps {
  product: Product;
  theme?: 'light' | 'dark';
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const getCorrectImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('/uploads/')) return `/api${path}`;
    return path;
  };

  const imageUrl = (product.images && product.images.length > 0)
    ? getCorrectImageUrl(product.images[0])
    : 'https://via.placeholder.com/400x500?text=Vision+Product';

  const secondImageUrl = (product.images && product.images.length > 1)
    ? getCorrectImageUrl(product.images[1])
    : '';

  // Stock logic (reused)
  const totalStock = Object.values(product.sizes || {}).reduce((acc, s) => acc + (s.stock || 0), 0);
  const isSoldOut = totalStock === 0;

  // Pricing
  const installmentPrice = (product.price / 3).toLocaleString('es-AR', { maximumFractionDigits: 0 });

  return (
    <Link to={`/producto/${product.id}`} className="group block h-full">
      
      {/* CARD CONTAINER: Clean, minimal, no heavy borders */}
      <div className="flex flex-col h-full bg-white overflow-hidden transition-all duration-300">
        
        {/* 1. IMAGE CONTAINER */}
        <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${product.name} - Vision`}
            className={`w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 ${isSoldOut ? 'grayscale opacity-60' : ''} ${secondImageUrl ? 'group-hover:opacity-0' : ''}`}
            loading="lazy"
          />
          {secondImageUrl && !isSoldOut && (
            <img
              src={secondImageUrl}
              alt={`${product.name} alternate view`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          )}
          {isSoldOut && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                <span className="text-black text-xs font-bold px-4 py-2 uppercase tracking-widest border border-black">
                    AGOTADO
                </span>
             </div>
          )}
          {/* Badge: New / Sale (Optional) */}
          {product.isNew && !isSoldOut && (
            <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
              Nuevo
            </div>
          )}
        </div>

        {/* 2. INFO CONTAINER */}
        <div className="pt-4 pb-2 flex flex-col flex-1 text-center md:text-left">
          
          <h3 className="text-sm font-medium text-gray-900 tracking-tight leading-snug mb-1 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
            <p className="text-sm font-bold text-gray-900">
              ${product.price.toLocaleString('es-AR')}
            </p>
            {!isSoldOut && (
              <span className="text-[10px] text-green-600 font-bold uppercase tracking-wide">
                Envío Gratis
              </span>
            )}
          </div>

          <div className="mt-1">
            <p className="text-xs text-gray-500">
                3 cuotas de <span className="font-semibold text-gray-900">${installmentPrice}</span>
            </p>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;