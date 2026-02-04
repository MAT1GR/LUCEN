import React, { useState } from 'react';
import { Star, Minus, Plus, Loader2, Zap, AlertCircle } from 'lucide-react';
import { Product } from '../../server/types';

interface ProductPurchaseCardProps {
  product: Product;
  averageRating: number;
  reviewsCount: number;
  onAddToCart: (quantity: number) => void;
  isAdding: boolean;
  showSuccess: boolean;
}

const ProductPurchaseCard: React.FC<ProductPurchaseCardProps> = ({
  product,
  averageRating,
  reviewsCount,
  onAddToCart,
  isAdding,
  showSuccess
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState('default');

  const handleAddToCartClick = () => {
    onAddToCart(quantity);
  };
  
  const originalPrice = product.price * 2;
  const isInStock = product.stock > 0;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-28">
      {/* Product Title */}
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {product.name}
      </h1>

      {/* Reviews Summary */}
      <div className="flex items-center gap-1 mt-2 mb-4 cursor-pointer w-fit group">
         <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
                <Star 
                   key={i} 
                   size={16} 
                   fill={i < Math.round(averageRating) ? "currentColor" : "none"} 
                   className={i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}
                />
            ))}
         </div>
         <span className="text-xs text-gray-500 group-hover:underline ml-1">
            {reviewsCount} reviews
         </span>
      </div>

      {/* Pricing */}
      <div className="mb-5">
        <span className="text-3xl font-bold text-gray-900">
          ${product.price.toLocaleString('es-AR')}
        </span>
        <span className="ml-2 text-lg font-medium text-gray-400 line-through">
          ${originalPrice.toLocaleString('es-AR')}
        </span>
      </div>

      {/* Special Offer */}
      <div className="bg-red-500 text-white text-center font-bold p-2 rounded-t-lg -mx-5 px-5">
        VALENTINE'S SPECIAL
      </div>
      <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 mb-5">
        <p className="text-lg font-bold text-gray-900">Buy 1, Get 1 Free!</p>
        <p className="text-2xl font-bold text-red-600">$29.00 <span className="text-gray-400 text-lg line-through">$80.00</span></p>
      </div>

      {/* Variant Selection */}
      <div className="mb-5">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Frame Color</h3>
        {/* This should be dynamic in a real app */}
        <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-red-500 border-2 border-blue-500 cursor-pointer"></div>
            <div className="w-10 h-10 rounded-full bg-orange-400 border-2 border-transparent hover:border-blue-500 cursor-pointer"></div>
            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-transparent hover:border-blue-500 cursor-pointer"></div>
            <div className="w-10 h-10 rounded-full bg-yellow-200 border-2 border-transparent hover:border-blue-500 cursor-pointer"></div>
        </div>
      </div>

      {/* Add to Cart */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center border border-gray-300 rounded-md">
          <button 
            onClick={() => setQuantity(q => Math.max(1, q - 1))} 
            className="p-3 text-gray-500 hover:text-gray-800 disabled:opacity-50"
            disabled={quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="px-4 font-semibold text-gray-800">{quantity}</span>
          <button 
            onClick={() => setQuantity(q => q + 1)} 
            className="p-3 text-gray-500 hover:text-gray-800 disabled:opacity-50"
            disabled={quantity >= product.stock}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <button
        onClick={handleAddToCartClick}
        disabled={!isInStock || isAdding || showSuccess}
        className={`w-full rounded-md font-bold text-lg py-3 transition-all flex items-center justify-center gap-2 shadow-lg ${
           isInStock 
             ? showSuccess 
                ? "bg-green-500 text-white" 
                : "bg-black hover:bg-gray-800 text-white"
             : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {isAdding ? <Loader2 className="animate-spin" size={24} /> : 
         showSuccess ? "Added!" : "Add to Cart"}
      </button>

      {/* Trust Badges */}
      <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-green-500" />
          <span>Fast Shipping</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle size={14} className="text-orange-500" />
          <span>Low Inventory</span>
        </div>
      </div>

    </div>
  );
};

export default ProductPurchaseCard;