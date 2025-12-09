import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const NuestraMisionPage: React.FC = () => {
  const contentRef = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div ref={contentRef} className="container mx-auto max-w-4xl px-4 scroll-animate">
        <Link
          to="/tienda"
          className="inline-flex items-center text-gray-600 hover:text-[#D8A7B1] mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Volver a la tienda
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <Target className="mx-auto text-[#D8A7B1] mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-black text-brand-primary-text tracking-tighter">
              Nuestra Misión
            </h1>
            <p className="mt-4 text-lg text-brand-secondary-text max-w-2xl mx-auto">
              No vendemos ropa. Nos especializamos en una sola cosa: encontrar el jean perfecto para vos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-2">
              <img 
                src="https://images.pexels.com/photos/774909/pexels-photo-774909.webp?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Foto del equipo de Rosario Denim"
                className="rounded-lg object-cover w-full h-full shadow-md"
              />
            </div>
            <div className="md:col-span-3">
              <div className="space-y-6 text-brand-primary-text">
                <p className="text-2xl font-bold">
                  Somos Rosario Denim.
                </p>
                
                {/* Párrafo Nuevo: Explicando la Curaduría de Marcas Nuevas */}
                <p className="text-base">
                  Funcionamos como una <span className="font-bold">Boutique de Denim</span>. Recorremos las mejores fábricas y marcas del país buscando esos modelos nuevos y únicos que ya no se consiguen en los shoppings tradicionales.
                </p>

                <p className="text-base">
                  Nacimos de una frustración simple: comprar jeans online era una lotería. Talles que no coincidían, calces que no favorecían y una falta total de confianza.
                </p>
                <p className="text-base">
                  Por eso, decidimos dejar de vender "ropa" y obsesionarnos con una única misión: garantizar que cada jean que enviamos sea exactamente lo que esperas.
                </p>
                <p className="font-semibold text-base">
                  Medimos cada prenda a mano para asegurar que el talle que ves en nuestra web es el talle real que recibes en tu casa. Sin sorpresas. Sin decepciones.
                </p>
                <p className="text-base">
                  Somos tu garantía de que el calce perfecto existe, y estamos acá para ayudarte a encontrarlo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NuestraMisionPage;