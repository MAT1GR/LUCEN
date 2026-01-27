import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Truck,
  ShieldCheck,
  Undo2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  Minus,
  Plus,
  CreditCard
} from "lucide-react";
import { Product, Review } from "../../server/types";
import { useCart } from "../hooks/useCart";
import ProductMediaGallery from "../components/ProductMediaGallery";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import ProductCard from "../components/ProductCard";
import { Helmet } from 'react-helmet-async';
import { track } from '../lib/meta';
import ReviewsSection from "../components/ReviewsSection";

// Hardcoded images for the description area
import img1 from '../assets/1.webp';
import img4 from '../assets/4.webp';
import imgHome from '../assets/home.webp';
import imgIA from '../assets/ia.webp';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, isAdding } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);

  const [reviewsCount, setReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const relatedRef = useScrollAnimation<HTMLElement>();

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      setIsLoading(true);
      window.scrollTo(0, 0);
      try {
        const productRes = await fetch(`/api/products/${id}`);
        if (productRes.ok) {
          const productData = await productRes.json();
          setProduct(productData);

          const availableSizes = Object.keys(productData.sizes).filter(
            (size) => productData.sizes[size].available && productData.sizes[size].stock > 0
          );
          if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);

          const allProductsRes = await fetch("/api/products/all");
          if (allProductsRes.ok) {
            const allProducts = await allProductsRes.json();
            const filtered = allProducts
              .filter((p: Product) => p.id !== productData.id)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
          
          const reviewsRes = await fetch(`/api/reviews/${id}`);
          if (reviewsRes.ok) {
            const reviewsData: Review[] = await reviewsRes.json();
            setReviewsCount(reviewsData.length);
            if (reviewsData.length > 0) {
                const total = reviewsData.reduce((acc, r) => acc + r.rating, 0);
                setAverageRating(total / reviewsData.length);
            } else {
                setAverageRating(0); 
            }
          }
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedSize) return;
    addToCart(product, selectedSize, quantity);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const scrollToReviews = () => {
    const element = document.getElementById("reviews-section");
    if (element) {
        element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-sans"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-sans">Producto no encontrado.</div>;

  const selectedVariantInfo = selectedSize ? product.sizes[selectedSize] : null;
  const isInStock = selectedVariantInfo?.available && selectedVariantInfo?.stock > 0;
  const availableVariants = Object.keys(product.sizes).filter(k => product.sizes[k].available && product.sizes[k].stock > 0);
  const allVariantNames = Object.keys(product.sizes);

  // Pricing Logic (Simulada para igualar referencia)
  const originalPrice = product.price * 2; // 50% OFF real
  const transferPrice = product.price * 0.9; // 10% OFF extra
  const installmentPrice = product.price / 3;
  const priceWithoutTax = product.price / 1.21; // Simulando IVA

  return (
    <>
      <Helmet>
        <title>{product.name} | LUCEN</title>
      </Helmet>

      <div className="bg-white text-[#1a1a1a] font-sans min-h-screen pb-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* COLUMN 1: MEDIA */}
            <div className="lg:w-[60%]">
              <ProductMediaGallery images={product.images} video={product.video} />
            </div>

            {/* COLUMN 2: INFO */}
            <div className="lg:w-[40%] lg:sticky lg:top-24 h-fit">
              
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-gray-800 leading-tight">
                {product.name}
              </h1>

              {/* REVIEWS HEADER */}
              <div 
                className="flex items-center gap-1 mb-4 cursor-pointer w-fit group"
                onClick={scrollToReviews}
              >
                 <div className="flex text-[#FFB800]">
                    {[...Array(5)].map((_, i) => (
                        <Star 
                           key={i} 
                           size={14} 
                           fill={i < Math.round(averageRating) ? "currentColor" : "none"} 
                           className={i < Math.round(averageRating) ? "text-[#FFB800]" : "text-gray-300"}
                        />
                    ))}
                 </div>
                 <span className="text-xs text-blue-600 group-hover:underline ml-1">
                    ({reviewsCount})
                 </span>
              </div>

              {/* PRICING SECTION - Refined Match */}
              <div className="mb-6">
                <p className="text-[#888] text-[13px] line-through decoration-1">
                   ${originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
                
                <div className="flex items-baseline gap-2 mb-1">
                   <p className="text-[32px] font-normal text-black leading-none tracking-tight">
                      ${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                   </p>
                   <span className="text-[#4A90E2] font-medium text-[13px] uppercase tracking-wide transform -translate-y-1">
                      50% OFF
                   </span>
                </div>
                
                <p className="text-[#0055FF] font-bold text-[16px] mb-1">
                   $ {transferPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })} <span className="text-[#666] font-normal text-[14px]">por Transferencia</span>
                </p>

                <p className="text-[14px] text-[#333] mb-0.5">
                   <span className="font-bold">3</span> cuotas de <span className="font-bold text-black">${installmentPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span> sin interés
                </p>

                <p className="text-[10px] text-[#999] mb-3">
                    Precio sin impuestos ${priceWithoutTax.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>

                <p className="text-[13px] text-[#0055FF] mb-3 leading-snug">
                   10% de descuento pagando con Transferencia o depósito
                </p>

                <a href="#details" className="text-[12px] text-gray-500 underline mb-4 block hover:text-black">
                    Ver más detalles
                </a>
                
                <div className="flex items-center gap-2 text-[#0055FF] font-medium text-[14px]">
                   <Truck size={18} strokeWidth={2} /> <span>Envío gratis</span>
                </div>
              </div>

              {/* VARIANT SELECTOR */}
              <div className="mb-6">
                 <label className="block text-[13px] text-[#333] mb-2">
                   Color: <span className="font-bold text-black">{selectedSize}</span>
                 </label>
                 <div className="flex flex-wrap gap-2">
                   {availableVariants.map(variant => {
                     const imageIndex = allVariantNames.indexOf(variant);
                     // Fallback to the first image if the corresponding one isn't available
                     const imageUrl = product.images[imageIndex] || product.images[0];

                     return (
                       <button
                         key={variant}
                         onClick={() => setSelectedSize(variant)}
                         className={`w-[50px] h-[50px] rounded-[4px] border box-border p-0.5 transition-all ${
                           selectedSize === variant 
                             ? "border-black ring-1 ring-black" 
                             : "border-gray-300 hover:border-gray-400"
                         }`}
                       >
                          <div className="w-full h-full rounded-[2px] overflow-hidden">
                              <img src={imageUrl} alt={variant} className="w-full h-full object-cover" />
                          </div>
                       </button>
                     )
                   })}
                 </div>
              </div>

              {/* QUANTITY & ADD TO CART */}
              <div className="flex gap-3 mb-8 h-[48px]">
                 <div className="flex items-center border border-[#ccc] rounded-[4px] w-[100px] justify-between px-2 bg-white hover:border-gray-400 transition-colors">
                    <button 
                        onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                        className="text-gray-500 hover:text-black p-1 disabled:opacity-30"
                        disabled={quantity <= 1}
                    >
                        <Minus size={14} />
                    </button>
                    <span className="font-normal text-[16px] text-black">{quantity}</span>
                    <button 
                        onClick={() => setQuantity(q => q + 1)} 
                        className="text-gray-500 hover:text-black p-1"
                    >
                        <Plus size={14} />
                    </button>
                 </div>

                 <button
                    onClick={handleAddToCart}
                    disabled={!isInStock || isAdding || showSuccess}
                    className={`flex-1 rounded-[4px] font-bold text-[15px] transition-all flex items-center justify-center gap-2 shadow-sm ${
                       isInStock 
                         ? showSuccess ? "bg-green-600 text-white" : "bg-[#0055FF] hover:bg-blue-600 text-white"
                         : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                 >
                    {isAdding ? <Loader2 className="animate-spin" size={20} /> : 
                     showSuccess ? "Agregado" : "Agregar al carrito"}
                 </button>
              </div>

              {/* TRUST BADGES - List */}
              <div className="space-y-4 pt-2 mb-8">
                 <div className="flex gap-3 items-start">
                    <div className="mt-0.5 min-w-[18px]">
                        <CheckCircle size={18} className="text-[#25D366]" fill="white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-[14px] text-black leading-tight">Tecnología visual certificada</h4>
                        <p className="text-[12px] text-[#666] mt-0.5 leading-snug">Diseñados para acompañarte en tu día a día.</p>
                    </div>
                 </div>
                 <div className="flex gap-3 items-start">
                    <div className="mt-0.5 min-w-[18px]">
                        <CheckCircle size={18} className="text-[#25D366]" fill="white" />
                    </div>
                    <div>
                        <h4 className="font-bold text-[14px] text-black leading-tight">10 días de prueba + Envíos rápidos</h4>
                        <p className="text-[12px] text-[#666] mt-0.5 leading-snug">Probalos sin riesgo. Si no te convencen, podés cambiarlos o pedir el reembolso. Envíos rápidos y gratis a todo el país.</p>
                    </div>
                 </div>
              </div>

              {/* DESCRIPTION ACCORDION */}
              <div className="border-t border-gray-200" id="details">
                <button 
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="w-full py-4 flex justify-between items-center text-left font-bold text-[14px] uppercase text-black"
                >
                  Descripción
                  {isDescriptionExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </button>
                {isDescriptionExpanded && (
                  <div className="pb-8 space-y-4 animate-fade-in-up">
                    <img src={img1} alt="1" className="w-full rounded shadow-sm" />
                    <img src={img4} alt="2" className="w-full rounded shadow-sm" />
                    <img src={imgHome} alt="3" className="w-full rounded shadow-sm" />
                    <img src={imgIA} alt="4" className="w-full rounded shadow-sm" />
                  </div>
                )}
              </div>

              <ReviewsSection productId={product.id} />
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductPage;