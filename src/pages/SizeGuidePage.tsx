import React from "react";
import { Ruler, ArrowLeft, Heart, Scale } from "lucide-react";
import WhatsAppLogo from '../assets/whatsapp-logo.png';
import { Link } from "react-router-dom";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import JeanMeasureImage from "../assets/4.webp";

const SizeGuidePage: React.FC = () => {
  const contentRef = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div
        ref={contentRef}
        className="container mx-auto px-4 max-w-4xl scroll-animate"
      >
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="bg-gray-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <Ruler className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold mb-4">¡Encontrá tu Talle Perfecto!</h1>
            {/* Removed the introductory paragraph as requested */}
          </div>

          <div className="grid grid-cols-1 gap-12 mb-12"> {/* Changed to grid-cols-1 */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Medí tu Jean Favorito
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Para encontrar tu talle ideal, agarrá un jean que te encante cómo te queda, extendelo en una superficie plana y medí lo siguiente:
              </p>

              <div className="space-y-6">
                <div className="flex gap-4 items-start">
                  <div className="bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Cintura (A)</h3>
                    <p className="text-gray-600 text-sm">
                      Medí el contorno de la cintura del jean, de borde a borde. No estires la tela.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Tiro Delantero (B)</h3>
                    <p className="text-gray-600 text-sm">
                      Medí desde la costura de la entrepierna hasta el botón de la cintura.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Largo (C)</h3>
                    <p className="text-gray-600 text-sm">
                      Medí desde la costura de la entrepierna hasta abajo, a lo largo de la pierna.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div> {/* End of grid container */}

          <div className="mt-8"> {/* Added margin-top for spacing */}
            <img src={JeanMeasureImage} alt="Guía de medidas del jean" className="rounded-lg shadow-md w-full" />
          </div>

          <div className="text-center bg-gray-100 p-8 rounded-lg mt-12">
            <h3 className="text-xl font-bold mb-4">¿Te quedó alguna duda?</h3>
            {/* Removed descriptive paragraph as requested */}
            <a
              href="https://wa.me/543541374915?text=Hola%20tengo%20una%20duda%20sobre%20el%20talle"
              className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#1DA851] text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <img src={WhatsAppLogo} alt="WhatsApp Logo" className="inline mr-2" style={{ height: '18px', width: '18px' }} /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuidePage;