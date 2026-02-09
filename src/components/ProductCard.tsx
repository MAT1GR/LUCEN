import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../server/types';
import { Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
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

  const isSoldOut = (product.stock || 0) === 0;

  const installmentPrice = (product.price / 3).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const discountPercentage = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="group flex flex-col h-full bg-white border border-transparent hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden">
      <Link to={`/producto/${product.id}`} className="flex flex-col h-full">
        {/* 1. IMAGE CONTAINER */}
        <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={`${product.name} - Vision`}
            className={`w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover:scale-105 ${isSoldOut ? 'grayscale' : ''}`}
            loading="lazy"
          />
          {isSoldOut && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <span className="text-black text-xs font-bold px-3 py-1 uppercase tracking-wider border border-black">
                    AGOTADO
                </span>
             </div>
          )}
        </div>

        {/* 2. INFO CONTAINER */}
        <div className="p-4 flex flex-col flex-1">
          {product.colors && product.colors.length > 0 && (
            <p className="text-xs text-gray-500 mb-2">{product.colors.length} colores</p>
          )}

          <div className="bg-[#3E6F8F] text-white text-xs font-bold uppercase tracking-wider py-1 px-2 mb-2 self-start rounded">
            LLEVÁ 3 Y PAGÁ 2
          </div>
          
          <h3 className="text-base font-bold text-gray-800 leading-snug mb-2 flex-grow">
            {product.name}
          </h3>

          {product.review_count && product.review_count > 0 && (
            <div className="flex items-center mb-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(product.review_average || 0) ? 'currentColor' : 'none'}
                    className={i < Math.round(product.review_average || 0) ? 'text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-2">({product.review_count})</span>
            </div>
          )}

          <div className="mb-3">
            {product.compare_at_price && (
              <p className="text-sm text-gray-400 line-through">
                ${product.compare_at_price.toLocaleString('es-AR')}
              </p>
            )}
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">
                ${product.price.toLocaleString('es-AR')}
              </p>
              {discountPercentage > 0 && (
                <p className="text-base font-extrabold text-[#3E6F8F]">{discountPercentage}% OFF</p>
              )}
            </div>
            {product.transfer_price && (
               <p className="text-sm font-bold text-[#3E6F8F] mt-1">
                ${product.transfer_price.toLocaleString('es-AR')} por Transferencia
              </p>
            )}
          </div>

          <div className="text-sm text-gray-700 mb-4">
            <span className="font-bold">3</span> cuotas de <span className="font-bold">${installmentPrice}</span> <span className="font-bold">sin interés</span>
          </div>

          <div className="mt-auto">
             <button className="w-full bg-[#3E6F8F] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#2B526A] transition-colors text-sm uppercase tracking-wider">
               Comprar
             </button>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;