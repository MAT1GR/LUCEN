import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CartItem, Product } from '../../server/types';
import { track } from '../lib/meta'; // Import meta tracker

interface CartContextType {
  cartItems: CartItem[];
  isAdding: boolean;
  addToCart: (product: Product, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  getCartSummary: () => { subtotal: number; discount: number; total: number; };
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('rosario-cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Error al cargar el carrito desde localStorage:", error);
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rosario-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, size: string, quantity: number = 1) => {
    track('AddToCart', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: product.price,
        currency: 'ARS',
    });
    setIsAdding(true);
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id && item.size === size);
      
      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + quantity, product.stock);
        return prev.map(item =>
          item.product.id === product.id && item.size === size
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      const newQuantity = Math.min(quantity, product.stock);
      return [...prev, { product, size, quantity: newQuantity }];
    });
    setTimeout(() => setIsAdding(false), 500);
  };

  const removeFromCart = (productId: string, size: string) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.size === size)));
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if (item.product.id === productId && item.size === size) {
          const newQuantity = Math.min(quantity, item.product.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartSummary = () => {
    const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

    let discount = 0;
    if (totalItems >= 3) {
      // Create a flat list of all items in the cart to sort them by price
      const allItems = cartItems.flatMap(item => Array(item.quantity).fill(item.product));
      allItems.sort((a, b) => a.price - b.price);
      
      const numberOfDiscounts = Math.floor(totalItems / 3);
      for (let i = 0; i < numberOfDiscounts; i++) {
        discount += allItems[i].price;
      }
    }

    let total = subtotal - discount;
    
    // Psychological rounding for the total price (e.g., 139940 -> 139990)
    // This rounds up to the nearest hundred, then subtracts 10 to get a .90 ending.
    // If we want a .99 ending, we could use -1.
    // Given the example, we'll aim for X.X90 or X.X99. Let's aim for 99.
    const lastTwoDigits = total % 100;
    if (lastTwoDigits !== 99 && lastTwoDigits !== 90 && total > 0) { // Only round if not already ending in 90 or 99
        total = Math.ceil(total / 100) * 100 - 1; // Rounds up to nearest hundred, then subtracts 1 for X99
        // Example: 139940 -> 140000 - 1 = 139999
        // Example: 139900 -> 139900 (not affected by ceil unless there are decimals)
        // Ensure it doesn't go too low if already close to 99
        if (total % 100 < 90) { // If rounding results in something like X00-1 = X99
            total = Math.ceil(total / 100) * 100 - 1;
        }
    }
    // Final check to ensure it ends in 99 if not 90
    if (total % 100 !== 90 && total % 100 !== 99 && total > 0) {
        total = Math.floor(total / 100) * 100 + 99; // Force to X99
    }

    return { subtotal, discount, total };
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  const value: CartContextType = {
    cartItems,
    isAdding,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartSummary,
    getTotalItems
  };

  return (
    <CartContext.Provider value={value}>
        {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};