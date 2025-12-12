import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const ReturnsPolicyPage: React.FC = () => {
  const contentRef = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div ref={contentRef} className="container mx-auto max-w-4xl px-4 scroll-animate">

        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="text-center mb-12">
            <Package className="mx-auto text-gray-800 mb-4" size={48} />
            <h1 className="text-4xl md:text-5xl font-black text-brand-primary-text tracking-tighter">
              Envíos y Devoluciones
            </h1>
            <p className="mt-4 text-lg text-brand-secondary-text">
              Información clara para que compres con total confianza.
            </p>
          </div>

          <div className="space-y-10 mt-12">

            {/* Card Cambios y Devoluciones */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="flex items-center mb-4">
                <RefreshCw className="text-green-500 mr-3 flex-shrink-0" size={24} />
                <h2 className="text-xl md:text-2xl font-bold">Cambios y Devoluciones sin Complicaciones</h2>
              </div>
              <p className="text-brand-secondary-text mb-4 text-sm md:text-base">
                Queremos que ames tu jean. Si no te queda como esperabas o simplemente cambiaste de opinión, no hay problema. Tu confianza es nuestra prioridad.
              </p>
              <ul className="list-disc list-inside space-y-3 text-brand-primary-text text-sm md:text-base">
                <li>Tenés <strong>30 días corridos</strong> desde que recibís tu compra para solicitar un cambio o devolución.</li>
                <li>Podés cambiarlo por otro talle, otro modelo o solicitar la devolución de tu dinero.</li>
                <li><strong>Condición:</strong> El producto debe estar en perfectas condiciones, sin uso, sin lavar y con sus etiquetas originales.</li>
                <li><strong>Costo de envío:</strong> El costo del envío de vuelta a nuestro depósito corre por tu cuenta. Sin embargo, si es un cambio por otro producto, <strong>el envío de vuelta a tu casa es gratis</strong>.</li>
                 <li>Para iniciar el proceso, simplemente escribinos a nuestro <a href="https://wa.me/543413981584" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">WhatsApp 3413981584</a>.</li>
              </ul>
            </div>

            {/* Garantía de Calidad */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" size={24} />
                <h2 className="text-xl md:text-2xl font-bold">Garantía de Calidad</h2>
              </div>
              <p className="text-brand-secondary-text mb-4 text-sm md:text-base">
                Si tu producto presenta una falla de fábrica, nos hacemos cargo de todo.
              </p>
              <ul className="list-disc list-inside space-y-2 text-brand-primary-text text-sm md:text-base">
                <li>El reclamo debe realizarse dentro de los <strong>30 días</strong> de haber recibido el producto.</li>
                <li>Nosotros nos hacemos cargo de <strong>todos los costos de envío</strong> para la reposición del producto o la devolución del dinero.</li>
                <li>La falla será evaluada por nuestro equipo para asegurar la calidad de nuestros procesos.</li>
              </ul>
            </div>
            
            {/* Card Envíos */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="flex items-center mb-4">
                <Truck className="text-blue-500 mr-3 flex-shrink-0" size={24} />
                <h2 className="text-xl md:text-2xl font-bold">Envíos a todo el País</h2>
              </div>
              <p className="text-brand-secondary-text mb-4 text-sm md:text-base">
                Llegamos a cada rincón de Argentina para que tengas tu jean.
              </p>
              <ul className="list-disc list-inside space-y-2 text-brand-primary-text text-sm md:text-base">
                <li>Despachamos los pedidos de <strong>4 a 7 días hábiles</strong> luego de acreditado el pago.</li>
                <li>El costo de envío se calcula en el checkout con tu código postal. ¡Recordá que muchas veces es gratis!</li>
                <li>Recibirás un código de seguimiento por mail para ver el estado de tu pedido en todo momento.</li>
                <li>Los envíos se realizan a través de Correo Argentino, Andreani o comisionista según la zona.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsPolicyPage;