import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, CreditCard, ArrowRight } from "lucide-react";
import { Product } from "../../server/types";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import heroImage from '../assets/hero.webp';
import homeImage1 from '../assets/home1.webp';
import homeImage2 from '../assets/home2.webp';
import { Helmet } from 'react-helmet-async';
import InstagramFeed from '../components/InstagramFeed';
import Accordion from "../components/Accordion";

const HomePage: React.FC = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [newProductsRes, bestSellersRes] = await Promise.all([
          fetch("/api/products/newest?limit=4"),
          fetch("/api/products/bestsellers?limit=4")
        ]);

        if (!newProductsRes.ok) throw new Error('Failed to fetch new products');
        if (!bestSellersRes.ok) throw new Error('Failed to fetch best sellers');

        const newProductsData = await newProductsRes.json();
        const bestSellersData = await bestSellersRes.json();

        setNewProducts(newProductsData);
        setBestSellers(bestSellersData);
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
        <section className="relative w-full h-[65vh] bg-gray-100 overflow-hidden">
          <img
            src={heroImage}
            alt="Protege tu vista con estilo"
            className="w-full h-full object-cover"
          />
        </section>

        {/* BEST SELLERS SECTION */}
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Mas vendidos...</h2>
              </div>
              <Link to="/tienda" className="hidden md:flex items-center text-sm font-bold uppercase tracking-wide hover:text-blue-600 transition-colors">
                Ver todo <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestSellers.map(p => <ProductCard product={p} key={p.id} theme="light" />)}
              </div>
            )}
            
            <div className="mt-10 text-center md:hidden">
            </div>
          </div>
        </section>

        {/* CUSTOM IMAGE SECTION */}
        <section className="py-0 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative h-[300px] overflow-hidden rounded-lg">
                <img src={homeImage2} alt="LUCEN Blue Light 2" className="w-full h-full object-contain" />
              </div>
              <div className="relative h-[300px] overflow-hidden rounded-lg">
                <img src={homeImage1} alt="LUCEN Blue Light 1" className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        </section>











      </div>

    </>
  );
};

export default HomePage;
