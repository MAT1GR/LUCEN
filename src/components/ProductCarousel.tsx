import React from 'react';
import { Product } from '../../server/types';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
  theme?: 'light' | 'dark';
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, theme }) => {
  return (
    <div className="relative">
      <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="w-72 flex-shrink-0">
            <ProductCard product={product} theme={theme} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;