import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../../server/types';

interface ProductCardProps {
  product: Product;
  theme?: 'light' | 'dark';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, theme = 'light' }) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Función auxiliar para corregir la ruta
  const getCorrectimageUrl = (path: string | undefined) => {
    if (!path) return '';
    let processedPath = path;
    if (processedPath.startsWith('/uploads/')) {
      processedPath = `/api${processedPath}`;
    }
    return `${apiBaseUrl}${processedPath}`;
  };

  // Procesar imagen principal
  const rawImage1 = (product.images && Array.isArray(product.images) && product.images[0]) ? product.images[0] : '';
  const imageUrl = rawImage1 ? getCorrectimageUrl(rawImage1) : 'https://via.placeholder.com/400x500';

  // Procesar segunda imagen (hover)
  const rawImage2 = (product.images && product.images.length > 1) ? product.images[1] : '';
  const secondImageUrl = getCorrectimageUrl(rawImage2);

  const textColor = theme === 'dark' ? 'text-white' : 'text-black';
  
  const totalStock = (product.sizes && typeof product.sizes === 'object')
    ? Object.values(product.sizes).reduce((acc, size) => acc + (size.stock || 0), 0)
    : 0;
  const isSoldOut = totalStock === 0;

  return (
    <Link to={`/producto/${product.id}`} className={`group block relative ${textColor}`}>
      <div className="bg-white relative rounded-[12px] overflow-hidden">
        {isSoldOut && (
          <div className="absolute top-2 left-2 bg-black text-white text-xs font-bold px-2 py-1 rounded z-20">
            AGOTADO
          </div>
        )}
        
        {/* Primera imagen (visible por defecto) */}
        <img
          src={imageUrl}
          alt={`Jean de mujer modelo ${product.name}`}
          className={`w-full h-full object-cover aspect-[3/4] transition-opacity duration-500 ${isSoldOut ? 'grayscale' : ''} ${secondImageUrl ? 'group-hover:opacity-0' : ''}`}
          loading="lazy"
        />

        {/* Segunda imagen (visible en hover) */}
        {secondImageUrl && (
          <img
            src={secondImageUrl}
            alt={`Jean de mujer modelo ${product.name} - Vista alternativa`}
            className={`absolute inset-0 w-full h-full object-cover aspect-[3/4] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isSoldOut ? 'grayscale' : ''}`}
            loading="lazy"
          />
        )}
      </div>
      <div className="pt-4 text-center">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-1 truncate group-hover:underline">
          {product.name}
        </h3>
        <p className="text-base font-normal text-gray-700">
          ${product.price.toLocaleString('es-AR')}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;