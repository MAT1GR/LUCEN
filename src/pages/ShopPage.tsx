import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard'; // Importar el nuevo componente
import { useScrollAnimation } from '../hooks/useScrollAnimation';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({
    sortBy: 'newest' as SortOption,
    page: 1,
  });

  const productsRef = useScrollAnimation();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: String(filters.page),
        sortBy: filters.sortBy,
      });

      try {
        // Simular un poco de retraso para ver el skeleton
        await new Promise(res => setTimeout(res, 500)); 
        const response = await fetch(`/api/products?${params.toString()}`);
        const data = await response.json();
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotalProducts(data.totalProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-white py-12 text-gray-900 font-sans">
      <div className="container mx-auto px-4 max-w-7xl">
          <main ref={productsRef} className="w-full scroll-animate">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4 border-b border-gray-100 pb-8">
              <h1 className="text-3xl font-bold uppercase tracking-tight">
                Colección <span className="text-sm font-normal text-gray-400 ml-2">({totalProducts} modelos)</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-500">Ordenar por:</span>
                <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="pl-2 pr-8 py-2 border-none bg-gray-50 text-sm font-bold text-gray-900 focus:ring-0 cursor-pointer uppercase tracking-wide rounded-sm hover:bg-gray-100 transition-colors"
                >
                    <option value="newest">Novedades</option>
                    <option value="popular">Más Populares</option>
                    <option value="price-asc">Menor Precio</option>
                    <option value="price-desc">Mayor Precio</option>
                </select>
              </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {products.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
            ) : (
                <div className="text-center py-24 bg-gray-50 rounded-lg">
                    <p className="text-xl text-gray-400 font-medium">No encontramos productos con esos filtros.</p>
                    <button onClick={() => setFilters({sortBy: 'newest', page: 1})} className="mt-4 text-black underline font-bold">Ver todos</button>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center mt-16 gap-4 border-t border-gray-100 pt-8">
                    <button 
                        onClick={() => handleFilterChange('page', filters.page - 1)} 
                        disabled={filters.page <= 1} 
                        className="p-3 border border-gray-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold tracking-widest text-gray-500">PÁGINA {filters.page} DE {totalPages}</span>
                    <button 
                        onClick={() => handleFilterChange('page', filters.page + 1)} 
                        disabled={filters.page >= totalPages} 
                        className="p-3 border border-gray-200 rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
          </main>
      </div>
    </div>
  );
};

export default ShopPage;