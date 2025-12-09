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
    : 'https://via.placeholder.com/400x500';

  const secondImageUrl = (product.images && product.images.length > 1)
    ? getCorrectImageUrl(product.images[1])
    : '';

  // Stock
  const totalStock = Object.values(product.sizes || {}).reduce((acc, s) => acc + (s.stock || 0), 0);
  const isSoldOut = totalStock === 0;

  // Precios
  const installmentPrice = (product.price / 3).toLocaleString('es-AR', { maximumFractionDigits: 0 });

  return (
    <Link to={`/producto/${product.id}`} className="group block h-full">
      
      {/* CONTENEDOR TARJETA */}
      <div className="flex flex-col h-full bg-white border border-gray-200 rounded-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300">
        
        {/* 1. IMAGEN (Ocupa todo el ancho) */}
        <div className="relative aspect-[3/4] w-full bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={`Jean ${product.name}`}
            className={`w-full h-full object-cover transition-opacity duration-500 ${isSoldOut ? 'grayscale opacity-60' : ''} ${secondImageUrl ? 'group-hover:opacity-0' : ''}`}
            loading="lazy"
          />
          {secondImageUrl && !isSoldOut && (
            <img
              src={secondImageUrl}
              alt={`Jean ${product.name} vista trasera`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          )}
          {isSoldOut && (
             <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <span className="bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                    VENDIDO
                </span>
             </div>
          )}
        </div>

        {/* 2. INFO (Padding reducido a p-2 para aprovechar el espacio) */}
        <div className="p-2 flex flex-col flex-1 text-left justify-between">
          <div>
            {/* A. NOMBRE (Texto un poco más grande para llenar) */}
            <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-tight leading-tight mb-1 line-clamp-2">
              {product.name}
            </h3>
            
            {/* B. PRECIO + ENVÍO */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <p className="text-lg font-bold text-gray-900 leading-none">
                ${product.price.toLocaleString('es-AR')}
              </p>
              {!isSoldOut && (
                <span className="whitespace-nowrap bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border border-green-100">
                  + Envío Gratis
                </span>
              )}
            </div>
          </div>

          {/* C. CUOTAS */}
          <div className="mt-0.5">
            <p className="text-xs text-gray-500 font-medium">
                3 cuotas de <span className="text-black font-bold">${installmentPrice}</span>
            </p>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;