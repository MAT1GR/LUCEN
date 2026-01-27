import React from "react";
import { Ruler, Info } from "lucide-react";
import { Link } from "react-router-dom";

const SizeGuidePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white py-12 text-gray-900 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-gray-100 rounded-full mb-6">
             <Ruler size={32} className="text-black" />
          </div>
          <h1 className="text-4xl font-bold uppercase tracking-tight mb-4">Guía de Medidas</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Encontrar el lente perfecto es fácil. Te enseñamos cómo entender las medidas de nuestros marcos para que elijas con confianza.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
           
           {/* Visual Aid (CSS Graphic) */}
           <div className="bg-gray-50 p-10 rounded-lg flex items-center justify-center h-80 relative border border-gray-100">
              {/* Abstract Glasses Drawing */}
              <div className="relative w-64 h-24 border-4 border-black rounded-lg flex items-center justify-center">
                 <div className="absolute top-1/2 left-0 w-full h-[1px] border-t border-dashed border-gray-400 -translate-y-1/2" />
                 <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-2 text-xs font-bold text-gray-500">ANCHO TOTAL</span>
                 
                 <div className="w-[1px] h-full bg-transparent mx-auto relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-2 bg-black rounded-full" /> {/* Bridge */}
                 </div>
              </div>
              {/* Arm */}
              <div className="absolute right-10 top-1/2 w-20 h-1 bg-black rotate-12 origin-left opacity-20"></div>
           </div>

           {/* Instructions */}
           <div className="space-y-8">
              <div>
                 <h3 className="font-bold text-lg mb-2">1. Ancho del Marco</h3>
                 <p className="text-sm text-gray-600 leading-relaxed">
                    Es la medida total de frente, de bisagra a bisagra. Si tienes un rostro pequeño, busca medidas entre 130mm y 135mm. Para rostros medianos/grandes, de 136mm en adelante.
                 </p>
              </div>
              <div>
                 <h3 className="font-bold text-lg mb-2">2. Alto del Lente</h3>
                 <p className="text-sm text-gray-600 leading-relaxed">
                    Importante para lentes progresivos o de sol. Un alto mayor ofrece más campo de visión y protección.
                 </p>
              </div>
              <div>
                 <h3 className="font-bold text-lg mb-2">3. Largo de Patilla</h3>
                 <p className="text-sm text-gray-600 leading-relaxed">
                    La mayoría de los lentes estándar tienen patillas de 140mm o 145mm. Esto asegura que se apoyen cómodamente detrás de tus orejas.
                 </p>
              </div>
           </div>
        </div>

        {/* Pro Tip */}
        <div className="bg-blue-50 p-8 rounded-lg border border-blue-100 flex gap-4 items-start">
           <Info className="text-blue-600 shrink-0 mt-1" />
           <div>
              <h4 className="font-bold text-blue-900 mb-2">Tip de Experto</h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                 Si ya usas lentes, mira en la parte interior de la patilla. A menudo verás tres números (ej. 52-18-140). Esos corresponden al <strong>ancho del lente</strong>, <strong>ancho del puente</strong> y <strong>largo de patilla</strong> respectivamente.
              </p>
           </div>
        </div>

        <div className="text-center mt-12">
           <Link to="/tienda" className="inline-block bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Ir a la Tienda
           </Link>
        </div>

      </div>
    </div>
  );
};

export default SizeGuidePage;
