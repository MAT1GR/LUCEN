import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Plus
} from "lucide-react";
import { Product, Review } from "../../server/types";
import { useCart } from "../hooks/useCart";
import ProductMediaGallery from "../components/ProductMediaGallery";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import ProductCard from "../components/ProductCard";
import { Helmet } from 'react-helmet-async';
import { track } from '../lib/meta';
import ReviewsSection from "../components/ReviewsSection";
import BlueLightFilter from '../components/BlueLightFilter';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState(1); // New state for bundle selection

  const navigate = useNavigate();


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
        // Ensure a valid bundle is selected if 'Lleva 2' was previously selected
        if (selectedBundle === 2) {
            setSelectedBundle(1);
        }
      }
    };
    fetchProductData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

    let quantityToAdd = 0;
    switch (selectedBundle) {
      case 1:
        quantityToAdd = 1;
        break;
      case 2:
        quantityToAdd = 2;
        break;
      case 3:
        quantityToAdd = 3;
        break;
      default:
        quantityToAdd = 1; // Default to 1 if no bundle is selected
    }

    addToCart(product, "default", quantityToAdd);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleBuyNow = () => {
    if (!product) return;

    let quantityToAdd = 0;
    switch (selectedBundle) {
      case 1:
        quantityToAdd = 1;
        break;
      case 2:
        quantityToAdd = 2;
        break;
      case 3:
        quantityToAdd = 3;
        break;
      default:
        quantityToAdd = 1; // Default to 1 if no bundle is selected
    }

    addToCart(product, "default", quantityToAdd);
    navigate("/checkout"); // Redirect to checkout page
  };

  const scrollToReviews = () => {
    const element = document.getElementById("reviews-section");
    if (element) {
        element.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-sans"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center font-sans">Producto no encontrado.</div>;

  const isInStock = product.stock > 0;

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


                
                <div className="flex items-center gap-2 text-[#0055FF] font-medium text-[14px]">
                   <Truck size={18} strokeWidth={2} /> <span>Envío gratis</span>
                </div>
              </div>

              {/* BUNDLE SELECTION */}
              <div className="mt-8 mb-4">
                <h3 className="flex items-center text-lg font-bold text-gray-800 mb-4">
                  <span className="flex-grow border-t-2 border-gray-700"></span>
                  <span className="mx-4">Compra en combo y ahorrá <span role="img" aria-label="fire emoji">🔥</span></span>
                  <span className="flex-grow border-t-2 border-gray-700"></span>
                </h3>

                <div className="space-y-4">
                  {/* Lleva 1 */}
                  <label htmlFor="bundle-1" className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${selectedBundle === 1 ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-gray-300 hover:border-gray-400'}`}>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="bundle-1"
                        name="bundle"
                        value="1"
                        checked={selectedBundle === 1}
                        onChange={() => setSelectedBundle(1)}
                        className="form-radio h-4 w-4 text-[#0055FF] border-gray-300 focus:ring-[#0055FF]"
                      />
                      <div className="ml-3">
                        <span className="font-extrabold text-gray-800 flex items-center">
                          Lleva 1 <span className="ml-2 px-2 py-0.5 text-xs border border-[#3E6F8F] bg-white text-[#3E6F8F] rounded-full font-bold">Envio Gratis</span>
                        </span>
                        <span className="block text-sm font-bold text-gray-800">Precio con 50% OFF</span>
                      </div>
                    </div>
                    <div>
                        <span className="font-bold text-gray-800 block">${product.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                        <span className="line-through block text-sm text-gray-500">${originalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </label>



                  {/* Lleva 3 (3x2 Offer) */}
                  <label htmlFor="bundle-3" className={`relative flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${selectedBundle === 3 ? 'border-[#0055FF] ring-1 ring-[#0055FF]' : 'border-gray-300 hover:border-gray-400'}`}>
                    <div className="absolute -top-3 right-4 bg-[#3E6F8F] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 uppercase">
                      Oferta 3x2
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="bundle-3"
                        name="bundle"
                        value="3"
                        checked={selectedBundle === 3}
                        onChange={() => setSelectedBundle(3)}
                        className="form-radio h-4 w-4 text-[#0055FF] border-gray-300 focus:ring-[#0055FF]"
                      />
                      <div className="ml-3">
                        <span className="font-extrabold text-gray-800 flex items-center">
                          Lleva 3 <span className="ml-2 px-2 py-0.5 text-xs border border-[#3E6F8F] bg-white text-[#3E6F8F] rounded-full font-bold">Envio Gratis</span>
                        </span>
                        <span className="block text-sm text-gray-500 font-bold">
                          Paga 2 y lleva 3
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block">${(product.price * 2).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      <span className="line-through block text-sm text-gray-500">${(product.price * 3).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </label>
                </div>
              </div>

                               <div className="mb-2">
                                  <button
                                     onClick={handleAddToCart}
                                     disabled={!isInStock || isAdding || showSuccess}
                                     className={`w-full rounded-[4px] font-bold text-[18px] py-3 transition-all flex items-center justify-center gap-2 shadow-sm ${
                                        isInStock
                                          ? showSuccess ? "bg-green-600 text-white" : "bg-[#0055FF] hover:bg-blue-600 text-white"
                                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                     }`}
                                  >
                                     {isAdding ? <Loader2 className="animate-spin" size={20} /> :
                                      showSuccess ? "AGREGADO" : "AGREGAR AL CARRITO"}
                                  </button>
                               </div>
              {/* BUY NOW BUTTON */}
              <div className="mb-8">
                 <button
                    onClick={handleBuyNow} // Call handleBuyNow
                    disabled={!isInStock || isAdding}
                    className={`w-full rounded-[4px] font-bold text-[18px] py-3 border-2 border-[#0055FF] text-[#0055FF] bg-white hover:bg-[#F0F7FF] transition-colors flex items-center justify-center gap-2 shadow-sm ${
                       !isInStock || isAdding ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                 >
                    COMPRAR AHORA
                 </button>
              </div>
              
              {/* PAYMENT ICONS */}
              <div className="flex justify-center items-center gap-4 mb-8">
                {/* Mercado Pago icon */}
                <svg class="icon icon--full-color" width="38" height="24" viewBox="0 0 38 24" fill="none" aria-labelledby="pi-mercadopago" role="img" xmlns="http://www.w3.org/2000/svg"><title id="pi-mercadopago">Mercado Pago</title><g clip-path="url(#pi-mercadopago-clip0_12388_39967)"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" fill="#000"></path><path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z" fill="#fff"></path><path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32z" fill="#FFE600"></path><path d="M19.502 5.263c-5.69 0-10.303 2.842-10.303 6.349 0 3.506 4.613 6.624 10.303 6.624s10.303-3.118 10.303-6.624c0-3.507-4.612-6.35-10.303-6.35z" fill="#00BCFF"></path><path d="M16.15 9.65c-.005.01-.105.11-.04.19.16.196.65.308 1.149.2.296-.063.676-.355 1.044-.636a4.206 4.206 0 011.192-.732 1.41 1.41 0 01.869-.02c.288.102.556.253.792.444.69.5 3.468 2.835 3.948 3.24a27.432 27.432 0 014.562-1.38c-.203-1.2-.951-2.343-2.1-3.24-1.6.647-3.686 1.034-5.6.135a5.461 5.461 0 00-2.064-.453c-1.518.034-2.175.667-2.87 1.336l-.882.916z" fill="#fff"></path><path d="M24.99 12.591c-.032-.027-3.265-2.752-3.997-3.284a1.822 1.822 0 00-.907-.415 1.288 1.288 0 00-.432.04c-.43.156-.83.386-1.182.68-.41.313-.796.61-1.154.687a1.93 1.93 0 01-1.272-.184.55.55 0 01-.211-.223.364.364 0 01.108-.407l.892-.93c.104-.1.208-.2.316-.297-.276.04-.548.099-.814.176a3.67 3.67 0 01-.95.17 9.384 9.384 0 01-.967-.145 16.312 16.312 0 01-2.781-.896c-1.27.91-2.095 2.026-2.34 3.279.182.045.66.15.783.176 2.87.615 3.765 1.248 3.927 1.38a.95.95 0 01.347-.236.984.984 0 01.827.046c.124.067.233.161.316.275.193-.15.435-.232.684-.232.14.003.278.026.41.07.128.04.246.104.346.191.1.088.179.194.232.313a.985.985 0 01.4-.082c.164.002.327.035.477.1.21.095.379.255.48.454a.95.95 0 01.084.643 1.162 1.162 0 01.919.317 1.063 1.063 0 01.197 1.293c.297.175.64.262.988.255a.651.651 0 00.462-.195c.03-.04.059-.085.03-.117l-.81-.867s-.132-.121-.09-.167c.047-.05.13.02.188.066.412.332.916.832.916.832.008.007.04.07.228.102a.872.872 0 00.64-.143.996.996 0 00.13-.133.403.403 0 00-.022-.514l-.946-1.023s-.135-.12-.088-.168c.04-.043.128.021.187.069.3.242.722.65 1.128 1.032a.794.794 0 00.907-.03.638.638 0 00.252-.24.61.61 0 00.084-.33.643.643 0 00-.2-.38l-1.291-1.252s-.137-.112-.09-.17c.04-.046.129.023.187.069.514.431 1.023.87 1.525 1.316a.805.805 0 00.877-.018.574.574 0 00.2-.189.549.549 0 00.037-.533.657.657 0 00-.166-.23z" fill="#fff"></path><path d="M18.726 14.177c-.152.02-.302.053-.448.096-.016-.01.012-.088.03-.132.02-.044.284-.81-.36-1.074a.784.784 0 00-.896.128c-.027.027-.039.025-.042-.01a.669.669 0 00-.143-.394.71.71 0 00-.355-.24c-.2-.06-.416-.055-.614.013a.968.968 0 00-.483.363.667.667 0 00-.207-.396.723.723 0 00-.865-.086.68.68 0 00-.286.348.653.653 0 00-.001.444.68.68 0 00.285.348.723.723 0 00.866-.082c.004.003.005.01.003.022a.864.864 0 00.091.617c.107.188.28.334.488.41a.715.715 0 00.68-.102c.055-.038.064-.022.056.029-.023.157.007.493.496.683a.65.65 0 00.736-.132c.063-.054.08-.045.083.04.008.168.067.33.169.463.103.136.244.24.405.297a.917.917 0 00.952-.21.825.825 0 00.174-.925.863.863 0 00-.326-.376.91.91 0 00-.488-.142z" fill="#fff"></path><path d="M19.5 5C13.703 5 9.002 7.971 9.002 11.615L9 12.002C9 15.87 13.109 19 19.5 19c6.429 0 10.5-3.13 10.5-6.997v-.388C30 7.971 25.3 5 19.5 5zm10.027 5.882c-1.513.323-2.99.785-4.41 1.381-.997-.837-3.299-2.765-3.922-3.215a2.77 2.77 0 00-.813-.456 1.344 1.344 0 00-.399-.06c-.172.002-.343.03-.506.082-.436.174-.84.42-1.193.728l-.02.015c-.361.277-.735.563-1.018.624-.124.027-.25.04-.377.04-.256.02-.51-.058-.709-.219-.017-.022-.006-.057.035-.107l.006-.007.876-.91c.686-.66 1.335-1.285 2.827-1.318h.074a5.455 5.455 0 011.962.447c.83.4 1.745.61 2.673.617a7.196 7.196 0 002.928-.674c1.065.862 1.771 1.9 1.986 3.032zM19.503 5.391c3.078 0 5.832.85 7.683 2.188a6.664 6.664 0 01-2.571.561 5.867 5.867 0 01-2.501-.58 5.805 5.805 0 00-2.135-.485h-.084a3.796 3.796 0 00-2.435.833c-.412.02-.82.093-1.214.214-.277.09-.565.142-.856.158-.11 0-.307-.01-.325-.01a17.145 17.145 0 01-3.067-.819c1.848-1.265 4.525-2.06 7.505-2.06zm-7.869 2.325c1.281.504 2.835.894 3.326.924.137.009.283.024.43.024a3.72 3.72 0 00.965-.173c.2-.056.403-.104.607-.144l-.173.165-.89.928a.416.416 0 00-.122.474.61.61 0 00.234.25c.288.156.614.236.945.23.127.001.253-.012.377-.038.373-.08.765-.38 1.18-.698a3.957 3.957 0 011.158-.668c.106-.027.214-.042.324-.043.027 0 .055.001.083.005.326.051.63.191.877.403.73.529 3.964 3.254 3.996 3.28a.6.6 0 01.194.458.486.486 0 01-.258.398.805.805 0 01-.425.127.72.72 0 01-.374-.104c-.012-.01-1.12-.988-1.528-1.317a.346.346 0 00-.191-.098.11.11 0 00-.085.038c-.064.076.008.182.092.25l1.294 1.255c.097.09.16.209.18.337a.552.552 0 01-.079.3.58.58 0 01-.229.217.854.854 0 01-.459.146.683.683 0 01-.369-.108l-.185-.176c-.34-.322-.69-.654-.947-.86a.348.348 0 00-.193-.097.109.109 0 00-.081.034c-.03.031-.05.087.024.18.02.025.041.049.065.07l.944 1.023a.341.341 0 01.021.436l-.033.04a1.034 1.034 0 01-.088.082.774.774 0 01-.462.14.75.75 0 01-.127-.01.327.327 0 01-.186-.075l-.012-.012c-.051-.051-.527-.52-.921-.836a.33.33 0 00-.184-.094.115.115 0 00-.085.036c-.078.082.039.205.089.25l.805.856a.17.17 0 01-.03.052c-.03.039-.127.133-.42.168a.835.835 0 01-.106.007 1.903 1.903 0 01-.789-.226 1.12 1.12 0 00-.072-1.113 1.183 1.183 0 00-.435-.394 1.236 1.236 0 00-.622-.143.995.995 0 00-.117-.641 1.05 1.05 0 00-.493-.445 1.306 1.306 0 00-.502-.107c-.126 0-.25.021-.369.064a1.003 1.003 0 00-.588-.48 1.366 1.366 0 00-.431-.074c-.24-.002-.475.07-.672.207a1.04 1.04 0 00-1.508-.082c-.25-.184-1.245-.793-3.907-1.375-.2-.049-.4-.102-.598-.159.25-1.15 1.01-2.202 2.135-3.064zm4.939 6.675l-.03-.025h-.028a.146.146 0 00-.082.032.7.7 0 01-.398.136.64.64 0 01-.222-.041.852.852 0 01-.456-.383.802.802 0 01-.082-.579.08.08 0 00-.027-.078l-.044-.035-.04.038a.658.658 0 01-1.029-.188.597.597 0 01.101-.663.663.663 0 01.669-.184.643.643 0 01.303.193.6.6 0 01.146.32l.022.165.094-.14a.886.886 0 01.45-.344.923.923 0 01.574-.007c.13.039.243.116.324.22a.61.61 0 01.13.36c.007.081.066.085.078.085a.109.109 0 00.074-.037.648.648 0 01.471-.192.94.94 0 01.354.077c.603.25.33.987.326.995-.052.122-.054.177-.005.208l.024.01h.018a.43.43 0 00.116-.029c.103-.04.212-.062.322-.068.216 0 .425.083.582.232a.79.79 0 01.241.56.767.767 0 01-.241.56.824.824 0 01-.582.233.834.834 0 01-.57-.218.772.772 0 01-.251-.538c-.001-.037-.005-.133-.09-.133a.158.158 0 00-.1.05.589.589 0 01-.403.176.732.732 0 01-.266-.056c-.469-.183-.475-.493-.456-.617a.11.11 0 00-.017-.095zm2.93 3.442c-5.576 0-10.096-2.785-10.096-6.221 0-.137.009-.274.024-.411.045.01.487.112.58.132 2.719.582 3.617 1.187 3.77 1.301a.95.95 0 00.092.922.998.998 0 00.367.321c.205.106.44.14.667.1.04.194.133.375.267.525.135.15.308.264.502.33.116.044.239.067.363.068.078 0 .156-.01.232-.028.093.19.24.35.421.465.183.114.394.178.612.184a.93.93 0 00.31-.053c.076.178.196.335.35.456a1.242 1.242 0 001.623-.089c.31.174.659.274 1.017.292.052 0 .103-.003.154-.01a.96.96 0 00.69-.324.505.505 0 00.042-.067c.106.031.216.048.326.05.239-.005.47-.085.657-.227a.872.872 0 00.39-.551c.072.014.145.021.22.021a1.25 1.25 0 00.675-.206.954.954 0 00.361-.354.91.91 0 00.123-.482c.296.06.604 0 .856-.166a.91.91 0 00.306-.293.87.87 0 00.134-.396.91.91 0 00-.14-.557 26.86 26.86 0 014.187-1.263c.008.103.013.206.013.31 0 3.436-4.52 6.221-10.095 6.221z" fill="#0A0080"></path></g><defs><clipPath id="pi-mercadopago-clip0_12388_39967"><path fill="#fff" d="M0 0h38v24H0z"></path></clipPath></defs></svg>
                <svg class="icon icon--full-color" viewBox="0 0 38 24"
   xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-visa"><title
   id="pi-visa">Visa</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3
   3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1
   0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9
   5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27
   8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5
   2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.4.9-.8 1.7-.8 1.2 0
   2.5 0 3.1.2h.1c-.1.6-.2 1.1-.4 1.7-.5-.2-1-.4-1.5-.4-.3 0-.6 0-.9.1-.2 0-.3.1-.4.2-.2.2-.2.5 0 .7l.5.4c.4.2.8.4
   1.1.6.5.3 1 .8 1.1 1.4.2.9-.1 1.7-.9 2.3-.5.4-.7.6-1.4.6-1.4 0-2.5.1-3.4-.2-.1.2-.1.2-.2.1zm-3.5.3c.1-.7.1-.7.2-1
   .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2M5
   8.2c0-.1.2-.2.3-.2h3.4c.5 0 .9.3 1 .8l.9 4.4c0 .1 0 .1.1.2 0-.1.1-.1.1-.1l2.1-5.1c-.1-.1 0-.2.1-.2h2.1c0 .1 0
   .1-.1.2l-3.1 7.3c-.1.2-.1.3-.2.4-.1.1-.3 0-.5 0H9.7c-.1 0-.2 0-.2-.2L7.9
   9.5c-.2-.2-.5-.5-.9-.6-.6-.3-1.7-.5-1.9-.5L5 8.2z" fill="#142688"></path></svg>
                <svg class="icon icon--full-color" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" role="img" width="38" height="24" aria-labelledby="pi-master"><title id="pi-master">Mastercard</title><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"></path><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32"></path><circle fill="#EB001B" cx="15" cy="12" r="7"></circle><circle fill="#F79E1B" cx="23" cy="12" r="7"></circle><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"></path></svg>
                <svg class="icon icon--full-color" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="pi-american_express" viewBox="0 0 38 24" width="38" height="24"><title id="pi-american_express">American Express</title><path fill="#000" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3Z" opacity=".07"></path><path fill="#006FCF" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32Z"></path><path fill="#FFF" d="M22.012 19.936v-8.421L37 11.528v2.326l-1.732 1.852L37 17.573v2.375h-2.766l-1.47-1.622-1.46 1.628-9.292-.02Z"></path><path fill="#006FCF" d="M23.013 19.012v-6.57h5.572v1.513h-3.768v1.028h3.678v1.488h-3.678v1.01h3.768v1.531h-5.572Z"></path><path fill="#006FCF" d="m28.557 19.012 3.083-3.289-3.083-3.282h2.386l1.884 2.083 1.89-2.082H37v.051l-3.017 3.23L37 18.92v.093h-2.307l-1.917-2.103-1.898 2.104h-2.321Z"></path><path fill="#FFF" d="M22.71 4.04h3.614l1.269 2.881V4.04h4.46l.77 2.159.771-2.159H37v8.421H19l3.71-8.421Z"></path><path fill="#006FCF" d="m23.395 4.955-2.916 6.566h2.000l.55-1.315h2.98l.55 1.315h2.05l-2.904-6.566h-2.31Zm.25 3.777.875-2.09.873 2.09h-1.748Z"></path><path fill="#006FCF" d="M28.581 11.52V4.953l2.811.01L32.84 9l1.456-4.046H37v6.565l-1.74.016v-4.51l-1.644 4.494h-1.59L30.35 7.01v4.51h-1.768Z"></path></svg>
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


                </button>
                {isDescriptionExpanded && (
                  <div className="pb-8 space-y-4 animate-fade-in-up">
                    <img src={img1} alt="1" className="w-full rounded shadow-sm" />
                    <img src={img4} alt="2" className="w-full rounded shadow-sm" />
                    <img src={imgHome} alt="3" className="w-full rounded shadow-sm" />
                    <img src={imgIA} alt="4" className="w-full rounded shadow-sm" />
                    <BlueLightFilter />
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