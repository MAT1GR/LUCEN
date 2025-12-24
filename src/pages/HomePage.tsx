import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkle, Box, Eye, Target } from "lucide-react";
import { Product, Testimonial } from "../../server/types";
import TestimonialCard from "../components/TestimonialCard";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import WhatsAppButton from "../components/WhatsAppButton";
import homeImage from '../assets/home.webp'; // Import the image
import homeImageDesktop from '../assets/1.webp';
import CountdownTimer from "../components/CountdownTimer"; // Importado
import { Helmet } from 'react-helmet-async';
import Accordion from "../components/Accordion";
import LeadCaptureModal from '../components/LeadCaptureModal';
import InstagramFeed from '../components/InstagramFeed';

const HomePage: React.FC = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWhatsAppButton, setShowWhatsAppButton] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasModalBeenShown, setHasModalBeenShown] = useState(false);
  // Hardcoded testimonials data
  const hardcodedTestimonials = [
    {
      id: 1,
      customerName: '@ornellamagi',
      content: 'Holis, ya retiré las cositas. Enamorada del jean realmente 🙏🏻',
      rating: 5,
      productName: 'Jean',
    },
    {
      id: 2,
      customerName: '@alaniisleo',
      content: 'Gracias bella! Me encanto el jean blanco 😍',
      rating: 5,
      productName: 'Jean Blanco',
    },
    {
      id: 3,
      customerName: '@_leimai.',
      content: 'Ya me llego, esta muy bueno el jean. Gracias.',
      rating: 5,
      productName: 'Jean',
    },
  ];

  const lastDropSectionRef = useRef<HTMLElement>(null);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const newProductsRes = await fetch("/api/products/newest?limit=4");
        

        if (!newProductsRes.ok) {
          throw new Error('Failed to fetch products');
        }

        const newProductsData = await newProductsRes.json();
        
        // Sort products: available ones first
        const sortedProducts = [...newProductsData].sort((a, b) => {
          const aInStock = Object.values(a.sizes).some((s: any) => s.available && s.stock > 0);
          const bInStock = Object.values(b.sizes).some((s: any) => s.available && s.stock > 0);
          if (aInStock && !bInStock) return -1;
          if (!aInStock && bInStock) return 1;
          return 0;
        });

        setNewProducts(sortedProducts);
        

      } catch (error) {
        setError("Error al cargar los productos. Por favor, intentá de nuevo más tarde.");
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowWhatsAppButton(true);
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1, // Trigger when 10% of the section is visible
      }
    );

    if (lastDropSectionRef.current) {
      observer.observe(lastDropSectionRef.current);
    }

    return () => {
      if (lastDropSectionRef.current) {
        observer.unobserve(lastDropSectionRef.current);
      }
    };
  }, [lastDropSectionRef]);

  useEffect(() => {
    const handleScroll = () => {
      if (hasModalBeenShown) {
        window.removeEventListener('scroll', handleScroll);
        return;
      }

      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrollPercentage > 70) {
        setIsModalOpen(true);
        setHasModalBeenShown(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasModalBeenShown]);

  // Effect to prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to ensure scroll is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'unset'; 
    };
  }, [isModalOpen]);




  const renderSkeletons = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  const handleScrollToLastDrop = () => {
    lastDropSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubscribe = async (name: string, phone: string) => {
    try {
      const response = await fetch('/api/notifications/drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      });
      const data = await response.json();
      alert(data.message); // Simple feedback for the user
      if(response.ok) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Subscription fetch error:", error);
      alert("Hubo un error al procesar la suscripción. Por favor, intentá de nuevo.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Denim Rosario | Jeans Premium y Ropa de Mujer</title>
        <meta name="description" content="Encontrá los mejores jeans de calce perfecto en Rosario. Envíos a todo el país. Calidad premium sin seguir modas rápidas." />
        <meta name="keywords" content="jeans rosario, denim, ropa mujer, pantalones tiro alto" />
      </Helmet>

      <LeadCaptureModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubscribe={handleSubscribe}
      />

      <div className={`bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] text-white transition-all duration-300 ${isModalOpen ? '' : ''}`}>
                    <section
                      className="min-h-[70vh] lg:min-h-screen relative flex flex-col items-center justify-start text-center px-4 pt-32 pb-20 lg:pt-48"
                    >
                      <picture className="absolute top-0 left-0 w-full h-full">
                        <source media="(min-width: 1024px)" srcSet={homeImageDesktop} />
                        <img
                          src={homeImage}
                          alt="Modelo vistiendo jeans de Denim Rosario"
                          fetchpriority="high"
                          className="w-full h-full object-cover"
                        />
                      </picture>
                      <div className="absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)]" />
                      <div className="z-10 w-full px-4">
            <div className="countdown-section mt-12 mb-0">
              <p className="text-sm md:text-base font-medium tracking-normal uppercase text-white/80 mb-1">
                PRÓXIMO DROP EN:
              </p>
              <div className="mx-auto">
                <CountdownTimer /> 
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-0 -mt-6"> 
              <button
                onClick={handleScrollToLastDrop}
                className="inline-flex items-center gap-2 bg-[#F5F5DC] text-[#2C3E50] px-4 sm:px-10 py-2 sm:py-3 rounded-sm text-sm font-bold group transition-colors"
              >
                VER EL DROP
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
          {/* Mensaje de Envío Gratis y cambios arriba de la flecha */}
          <div className="absolute bottom-24 left-0 w-full flex flex-col items-center gap-2 z-10">
            <p className="text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase text-white/60">
              Envíos a todo Argentina
            </p>
            <div className="w-8 h-[1px] bg-white/20" />
            <p className="text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase text-white/60">
              Cambios sin problema
            </p>
          </div>
          {/* Solo se deja el indicador de flecha */}
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-base text-white animate-pulse-slow">
            ↓
          </p>
        </section>

        <div className="h-1 bg-[#f7f7f7]" />
        {/* Last Drop Section */}
        <section ref={lastDropSectionRef} className="pt-[40px] pb-[60px] bg-white text-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-medium tracking-[1px] uppercase">
                ÚLTIMO DROP
              </h2>
              <p className="mt-2 text-sm text-gray-500 uppercase tracking-widest">
                Modelos disponibles ahora
              </p>
            </div>
            {loading ? renderSkeletons() : error ? <p className="text-center text-red-500">{error}</p> : newProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                {newProducts.map(p => <ProductCard product={p} key={p.id} theme="light" />)}
              </div>
            ) : (
              <p className="text-center text-gray-500">No hay nuevos productos disponibles.</p>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 lg:py-24 bg-neutral-100 text-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase">
                Opiniones
              </h2>
              <p className="text-gray-500 mt-2">Mensajes reales de quienes ya nos escribieron.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hardcodedTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-white text-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase">
                Lo que nos hace diferentes
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center max-w-4xl mx-auto">
  
  {/* Ítem 1: Mantenemos la exclusividad */}
  <div className="flex flex-col items-center">
    <Sparkle className="w-10 h-10 mb-4 text-gray-800" />
    <h3 className="text-lg font-semibold uppercase tracking-wider">Un solo jean por modelo</h3>
    <p className="mt-2 text-sm text-gray-600">
      Stock único y exclusivo.<br /> <span className="font-bold">Si te gusta, llevalo porque no se repite.</span>
    </p>
  </div>

  {/* Ítem 2: Calidad */}
  <div className="flex flex-col items-center">
    <Eye className="w-10 h-10 mb-4 text-gray-800" />
    <h3 className="text-lg font-semibold uppercase tracking-wider">CALIDAD RÍGIDA</h3>
    <p className="mt-2 text-sm text-gray-600">
      Priorizamos el denim 100% algodón.<br /> <span className="font-bold">Telas nobles que duran años.</span>
    </p>
  </div>

</div>
          </div>
        </section>

        {/* Size Guide Section */}
        <section className="py-16 lg:py-24 bg-neutral-100 text-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase">
              Encontrá tu talle en 10 segundos
            </h2>
            <Link to="/tallas" className="mt-6 inline-block bg-black text-white px-10 py-3 rounded-sm text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
              Ver guía
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-24 bg-white text-black">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight uppercase text-center mb-12">
              Preguntas Frecuentes
            </h2>
            <div className="max-w-3xl mx-auto">
              <Accordion 
                title="¿Cuál es nuestra misión?"
                content={
                  <>
                    <p>
                      Funcionamos como una Boutique de Denim: recorremos las mejores fábricas seleccionando modelos nuevos y únicos de distintas marcas. 
                    </p>
                    <p className="mt-2">
                      Olvidate de la lotería de los talles; medimos cada prenda a mano para garantizarte el calce perfecto. <span className="font-bold">Tu calce ideal, garantizado.</span>
                    </p>
                  </>
                }
              />
              <Accordion title="¿Cuáles son los métodos de pago?" content="Aceptamos tarjetas de crédito, débito y efectivo a través de Mercado Pago." />
              <Accordion title="¿Hacen envíos a todo el país?" content="Sí, hacemos envíos a todo el país a través de Correo Argentino a domicilio o a sucursal." />
              <Accordion title="¿Cuánto tiempo tarda en llegar mi pedido?" content="Una vez despachado, el tiempo de entrega estimado es de 3 a 7 días hábiles, dependiendo de tu ubicación." />
              <Accordion title="¿Puedo realizar una devolución?" content="Sí, podés consultar nuestra política de devoluciones en la sección 'Devoluciónes' de nuestra web." />
              <Accordion title="¿Cómo elijo mi talle correctamente?" content="Te recomendamos visitar nuestra 'Guía de Talles' para aprender a tomar tus medidas y encontrar el calce perfecto." />
              <Accordion title="¿Qué hago si mi pedido llega dañado o incorrecto?" content="En caso de recibir un producto dañado o diferente al solicitado, por favor contactanos de inmediato con fotos y el número de tu pedido para que podamos solucionarlo." />
            </div>
          </div>
        </section>
      </div>
      <InstagramFeed />
    </>
  );
};

export default HomePage;