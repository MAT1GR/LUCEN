

// --- COMPONENTE DE MEDIDAS (Minimalista) ---
const ProductMeasurements: React.FC<{ product: Product }> = ({ product }) => {
  const measurements = {
    cintura: (product as any).waist_flat || "--",
    alto: (product as any).length || "--",
    tiro_cm: (product as any).rise_cm || "--",
    tiro: (product as any).rise || "--",
  };

  return (
    <div className="py-5 border-y border-gray-100 my-6">
      <div className="flex items-center justify-center mb-3">
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-gray-400" />
          <span className="text-base font-bold text-black uppercase tracking-widest">
            Medidas
          </span>
        </div>
      </div>

      <div className="text-center px-4 mb-6 text-sm text-gray-600">
        <p>Si dudás entre dos talles, recomendamos elegir el más chico o escribirnos.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm text-gray-800">
        <div className="flex flex-col text-center">
          <span className="text-xs text-gray-400 mb-1">Cintura</span>
          <span className="font-medium">{measurements.cintura} cm</span>
          {product.isWaistStretchy && <span className="text-xs text-gray-500">Elastizado</span>}
        </div>
        <div className="flex flex-col text-center">
          <span className="text-xs text-gray-400 mb-1">Tiro</span>
          <span className="font-medium">{measurements.tiro_cm} cm</span>
          <span className="text-xs text-gray-500">{measurements.tiro}</span>
        </div>
        <div className="flex flex-col text-center">
          <span className="text-xs text-gray-400 mb-1">Alto</span>
          <span className="font-medium">{measurements.alto} cm</span>
        </div>
      </div>

      <div className="text-center mt-6">
                  <Link to="/tallas" className="text-sm text-gray-500 hover:text-black hover:underline transition-colors">
                    Ver guía de talles
                  </Link>      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Truck,
  ShieldCheck,
  Undo2,
  Ruler,
  ShoppingCart,
  Loader2,
  FileText,
  MessageCircle
} from "lucide-react";
import { Product } from "../../server/types";
import { useCart } from "../hooks/useCart";
import ProductMediaGallery from "../components/ProductMediaGallery";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import ProductCard from "../components/ProductCard";
import { Helmet } from 'react-helmet-async';
import Accordion from '../components/Accordion'; // Import the Accordion component
import { track } from '../lib/meta'; // Import meta tracker

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  deliveryEstimate: string;
}


const Breadcrumbs: React.FC<{ product: Product }> = ({ product }) => (
  <nav className="text-sm text-gris-oscuro/70 mb-4">
    <Link to="/" className="hover:text-gris-oscuro">
      Inicio
    </Link>
    <span className="mx-2">/</span>
    <Link to="/tienda" className="hover:text-gris-oscuro uppercase">
      {product.category}
    </Link>
  </nav>
);

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart, isAdding } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [postalCode, setPostalCode] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
    const descriptionRef = useRef<HTMLDivElement>(null);
    const relatedRef = useScrollAnimation<HTMLElement>();

    const getDeliveryDate = () => {
      const today = new Date();
      let deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 2);
  
      if (deliveryDate.getDay() === 0) { // Sunday
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
  
      const optionsWeekday: Intl.DateTimeFormatOptions = { weekday: 'long' };
      const optionsDay: Intl.DateTimeFormatOptions = { day: 'numeric' };
      const weekday = deliveryDate.toLocaleDateString('es-ES', optionsWeekday);
      const day = deliveryDate.toLocaleDateString('es-ES', optionsDay);
      return `<strong>${weekday}</strong> <strong>${day}</strong>`;
    };
  
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
              (size) =>
                productData.sizes[size].available &&
                productData.sizes[size].stock > 0
            );
            if (availableSizes.length > 0) setSelectedSize(availableSizes[0]);
  
            const allProductsRes = await fetch("/api/products/all");
            if (allProductsRes.ok) {
              const allProducts = await allProductsRes.json();
              
              // Prioritize same category
              let filtered = allProducts.filter(
                (p: Product) =>
                  p.id !== productData.id && p.category === productData.category
              );
              
              // If not enough, fill with other products
              if (filtered.length < 4) {
                const otherProducts = allProducts.filter(
                  (p: Product) =>
                    p.id !== productData.id && p.category !== productData.category
                );
                const needed = 4 - filtered.length;
                filtered = [...filtered, ...otherProducts.slice(0, needed)];
              }
  
              setRelatedProducts(filtered.slice(0, 4));
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
  
      useEffect(() => {
        const charLimit = 200; // Character limit to trigger "Read More"
        if (product?.description && product.description.length > charLimit) {
            setShowReadMore(true);
        } else {
            setShowReadMore(false);
        }
      }, [product?.description]);    
  
      const handleAddToCart = () => {
      if (!product || !selectedSize) return;
      addToCart(product, selectedSize, 1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    };

    useEffect(() => {
        if (product) {
            track('ViewContent', {
                content_name: product.name,
                content_ids: [product.id],
                content_type: 'product',
                value: product.price,
                currency: 'ARS',
            });
        }
    }, [product]);

    const handleCalculateShipping = async () => {
      if (!postalCode) return;
      setIsCalculatingShipping(true);
      setShippingOptions([]);
      try {
        const res = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postalCode }),
        });
        if (!res.ok) {
          throw new Error('No se pudo calcular el envío.');
        }
        const data = await res.json();
        setShippingOptions(data.options || []);
      } catch (err) {
        console.error("Shipping calculation error:", err);
        // Maybe set an error state here to show in the UI
      } finally {
        setIsCalculatingShipping(false);
      }
    };
  
    if (isLoading)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Cargando producto...</p>
        </div>
      );
  
    if (!product)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Producto no encontrado.</p>
        </div>
      );
  
    const selectedSizeInfo = selectedSize ? product.sizes[selectedSize] : null;
    const isInStock = selectedSizeInfo?.available && selectedSizeInfo?.stock > 0;
  
    return (
      <>

        <Helmet>
          <title>{product.name} | Denim Rosario</title>
          <meta name="description" content={`Comprá ${product.name} en Denim Rosario. ${product.description.substring(0, 150)}...`} />
          <meta name="keywords" content={`jeans ${product.name}, denim, ropa mujer, pantalones tiro alto, ${product.category}`} />
          {/* Schema.org JSON-LD */}
          <script type="application/ld+json">{`
            {
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": "${product.name}",
              "image": "${product.images[0]}",
              "description": "${product.description}",
              "brand": {
                "@type": "Brand",
                "name": "Denim Rosario"
              },
              "offers": {
                "@type": "Offer",
                "url": "${import.meta.env.VITE_APP_BASE_URL}/producto/${product.id}",
                "priceCurrency": "ARS",
                "price": "${product.price}",
                "availability": "${product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}"
              }
            }
          `}</script>
        </Helmet>
        <div className="bg-blanco-hueso text-gris-oscuro">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-0">
            <div className="flex flex-col lg:flex-row lg:gap-16">
              <div className="lg:w-1/2">
                <ProductMediaGallery images={product.images} video={product.video} />
              </div>
  
              <div className="lg:w-1/2 w-full lg:sticky lg:top-28 h-fit">
                <div className="py-8 lg:py-0">
                  <Breadcrumbs product={product} />
  
                  <h1 className="text-4xl font-black tracking-tight uppercase">
                    {product.name}
                  </h1>
  
                  <p className="text-3xl mt-2 font-bold">${product.price.toLocaleString('es-AR')}</p>
                  <p className="text-base text-gray-600 mt-2">
                    Jean de calce relajado, tiro medio y denim firme para uso diario.
                  </p>
  
                                                        
  
                  {/* BOTONES DE COMPRA */}
                  <div className="mt-12 mb-6">
                    <div className="relative w-full">
                      <div className="absolute bottom-full w-full bg-green-600 text-white text-xs font-bold text-center py-1 rounded-t-md">
                        <Truck size={12} className="inline-block mr-1" />
                        <span dangerouslySetInnerHTML={{ __html: `Recibilo <strong>gratis</strong> a partir del ${getDeliveryDate()}` }} />
                      </div>

                      <button
                        onClick={handleAddToCart}
                        disabled={!selectedSize || !isInStock || isAdding || showSuccess}
                        className={`w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-b-md border transition-all duration-300 ${
                          !selectedSize || !isInStock
                            ? "bg-arena/50 text-gray-400 cursor-not-allowed border-transparent"
                            : showSuccess
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-black text-white border-black hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        {isAdding ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : showSuccess ? (
                          <>
                            <CheckCircle size={20} />
                            AGREGADO
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={16} />
                            AGREGAR AL CARRITO
                          </>
                        )}
                      </button>
                    </div>
                  </div>                  {/* ICONOS */}
                  <div className="mt-3 space-y-3 text-[#7a7a7a] text-sm">
                    <div className="flex gap-3">
                      <ShieldCheck size={18} /> Compra segura con Mercado Pago
                    </div>
                    <div className="flex gap-3">
                      <Undo2 size={18} /> 30 días para cambios
                    </div>
                    <div className="flex gap-3">
                      <MessageCircle size={18} /> Atención al cliente personalizada
                    </div>
                  </div>
  
                  <ProductMeasurements product={product} />

                  {/* DESCRIPCIÓN */}
                  {product.description && (
                    <div>
                      <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400" />
                          <span className="text-base font-bold text-black uppercase tracking-widest">
                            Descripción
                          </span>
                        </div>
                      </div>
  
                      <div
                        ref={descriptionRef}
                        className={`relative px-4 ${
                          !isDescriptionExpanded ? "max-h-16 overflow-hidden" : ""
                        }`}
                      >
                        <p>{product.description}</p>
  
                        {!isDescriptionExpanded && showReadMore && (
                          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-blanco-hueso to-transparent" />
                        )}
                      </div>
  
                      {showReadMore && (
                        <button
                          onClick={() =>
                            setIsDescriptionExpanded(!isDescriptionExpanded)
                          }
                          className="text-black font-bold mt-2 px-4"
                        >
                          {isDescriptionExpanded ? "Leer menos" : "Leer más"}
                        </button>
                      )}
                    </div>
                  )}
                  


                  {/* PREGUNTAS FRECUENTES (Product Specific) */}
                  {Array.isArray(product.faqs) && product.faqs.length > 0 && (
                    <div className="py-8 border-t border-gray-200 mt-6">
                      <h3 className="text-xl font-bold mb-4">Preguntas Frecuentes</h3>
                      <div className="space-y-4">
                        {product.faqs.map((faq, index) => (
                          <Accordion key={index} title={faq.question} content={faq.answer} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
  
          {/* RELACIONADOS */}
          {relatedProducts.length > 0 && (
            <section ref={relatedRef} className="pt-24 pb-12">
              <div className="container mx-auto max-w-7xl px-4">
                <h2 className="text-2xl font-bold text-center mb-12 tracking-wider">
                  PRODUCTOS SUGERIDOS
                </h2>
  
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {relatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
  
                      </>
    );
  };
  
  export default ProductPage;
  
