import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, CreditCard, ArrowRight } from "lucide-react";
import { Product } from "../../server/types";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import heroImage from '../assets/hero-placeholder.svg'; // Using the placeholder I created
import { Helmet } from 'react-helmet-async';
import InstagramFeed from '../components/InstagramFeed';
import Accordion from "../components/Accordion";

const HomePage: React.FC = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newProductsRes = await fetch("/api/products/newest?limit=4");
        if (!newProductsRes.ok) throw new Error('Failed to fetch products');
        const newProductsData = await newProductsRes.json();
        setNewProducts(newProductsData);
      } catch (error) {
        setError("Error cargando productos.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Helmet>
        <title>LUCEN | Lentes Blue Light y Descanso Visual</title>
        <meta name="description" content="Protege tu vista de las pantallas con LUCEN. Lentes Blue Light con diseño premium y descanso visual garantizado. Envíos a todo el país." />
      </Helmet>

      <div className="bg-white text-gray-900 font-sans">
        
        {/* HERO SECTION */}
        <section className="relative w-full h-[80vh] bg-gray-100 overflow-hidden">
          <img
            src={heroImage}
            alt="Protege tu vista con estilo"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/10">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md tracking-tight">
              PROTEGE TU VISIÓN
            </h1>
            <p className="text-lg md:text-xl text-white mb-8 max-w-2xl drop-shadow-sm font-light">
              Lentes con filtro de luz azul para quienes viven frente a una pantalla.
            </p>
            <Link 
              to="/tienda" 
              className="bg-white text-black px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg"
            >
              Ver Colección
            </Link>
          </div>
        </section>

        {/* ICONS / USP BAR */}
        <section className="py-10 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
              <div className="flex flex-col items-center p-4">
                <Truck className="w-8 h-8 mb-3 text-gray-800" strokeWidth={1.5} />
                <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Envío Gratis</h3>
                <p className="text-xs text-gray-500">A partir de $60.000 a todo el país</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <CreditCard className="w-8 h-8 mb-3 text-gray-800" strokeWidth={1.5} />
                <h3 className="font-bold text-sm uppercase tracking-wide mb-1">3 Cuotas Sin Interés</h3>
                <p className="text-xs text-gray-500">Con todas las tarjetas bancarias</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <ShieldCheck className="w-8 h-8 mb-3 text-gray-800" strokeWidth={1.5} />
                <h3 className="font-bold text-sm uppercase tracking-wide mb-1">Garantía de Calidad</h3>
                <p className="text-xs text-gray-500">Compra protegida y devoluciones simples</p>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES GRID (Placeholders) */}
        <section className="py-16">
          <div className="container mx-auto px-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category 1 */}
                <div className="relative group h-[500px] overflow-hidden bg-gray-200 cursor-pointer">
                   <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-400 font-bold text-2xl">
                      IMG MUJER
                   </div>
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                   <div className="absolute bottom-10 left-10">
                      <h3 className="text-white text-3xl font-bold mb-2">MUJER</h3>
                      <Link to="/tienda?category=mujer" className="text-white text-sm font-bold uppercase tracking-widest border-b-2 border-white pb-1 hover:text-gray-200 hover:border-gray-200">
                        Ver Modelos
                      </Link>
                   </div>
                </div>
                {/* Category 2 */}
                <div className="relative group h-[500px] overflow-hidden bg-gray-200 cursor-pointer">
                   <div className="absolute inset-0 bg-gray-300 flex items-center justify-center text-gray-400 font-bold text-2xl">
                      IMG HOMBRE
                   </div>
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                   <div className="absolute bottom-10 left-10">
                      <h3 className="text-white text-3xl font-bold mb-2">HOMBRE</h3>
                      <Link to="/tienda?category=hombre" className="text-white text-sm font-bold uppercase tracking-widest border-b-2 border-white pb-1 hover:text-gray-200 hover:border-gray-200">
                        Ver Modelos
                      </Link>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* FEATURED PRODUCTS (NEW ARRIVALS) */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Novedades</h2>
                <p className="text-gray-500 text-sm">Lo último en protección visual.</p>
              </div>
              <Link to="/tienda" className="hidden md:flex items-center text-sm font-bold uppercase tracking-wide hover:text-blue-600 transition-colors">
                Ver todo <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {newProducts.map(p => <ProductCard product={p} key={p.id} theme="light" />)}
              </div>
            )}
            
            <div className="mt-10 text-center md:hidden">
               <Link to="/tienda" className="inline-block border border-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                  Ver todo los modelos
               </Link>
            </div>
          </div>
        </section>

        {/* INFO / EDUCATION SECTION */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                   <h2 className="text-3xl font-bold mb-6 leading-tight">¿Por qué usar lentes <span className="text-blue-600">Blue Light</span>?</h2>
                   <div className="space-y-6">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
                         <div>
                            <h4 className="font-bold mb-1">Reduce la fatiga visual</h4>
                            <p className="text-sm text-gray-600">Alivia el cansancio, ojos rojos y sequedad tras horas frente a pantallas.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
                         <div>
                            <h4 className="font-bold mb-1">Mejora el sueño</h4>
                            <p className="text-sm text-gray-600">La luz azul inhibe la melatonina. Nuestros lentes te ayudan a descansar mejor.</p>
                         </div>
                      </div>
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">3</div>
                         <div>
                            <h4 className="font-bold mb-1">Prevención a largo plazo</h4>
                            <p className="text-sm text-gray-600">Cuida tu retina de la sobreexposición diaria a dispositivos digitales.</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="h-[400px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                   {/* Placeholder for Education Image */}
                   IMAGEN EDUCATIVA
                </div>
             </div>
          </div>
        </section>

        {/* FAQ SECTION (Simplified) */}
        <section className="py-20 border-t border-gray-100">
           <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-3xl font-bold text-center mb-12">Preguntas Frecuentes</h2>
              <Accordion title="¿Tienen graduación?" content="Nuestros lentes vienen sin graduación (neutros), listos para usar como protección. Si necesitas graduación, puedes llevar el marco a tu óptica de confianza." />
              <Accordion title="¿Cómo sé si me quedan bien?" content="Todos nuestros modelos incluyen las medidas exactas en la descripción. Recomendamos comparar con un lente que ya tengas." />
              <Accordion title="¿Hacen envíos a todo el país?" content="Sí, despachamos a toda Argentina. El envío es gratis superando el monto mínimo de compra." />
           </div>
        </section>

      </div>
      <InstagramFeed />
    </>
  );
};

export default HomePage;
