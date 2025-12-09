import React from 'react';
import { Product } from '../types';
import { Ruler, Tag, Sparkles } from 'lucide-react'; // Importamos iconos nuevos

interface ProductDetailsProps {
  product: Product;
}

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string | undefined }> = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="text-gris-oscuro/80 mt-0.5">{icon}</div>
      <div>
        <span className="font-bold">{label}:</span> {value}
      </div>
    </div>
  );
};

const MeasurementsTable: React.FC<{ measurements: Product['measurements'] }> = ({ measurements }) => {
  if (!measurements) return null;
  return (
    <div className="mt-2 text-sm">
      <p className="font-bold mb-1">Medidas en plano:</p>
      <ul className="list-disc list-inside pl-2">
        {measurements.cintura && <li>Cintura (de lado a lado): {measurements.cintura}cm</li>}
        {measurements.largo && <li>Largo: {measurements.largo}cm</li>}
        {measurements.tiro && <li>Tiro: {measurements.tiro}cm</li>}
      </ul>
    </div>
  );
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  // Construct measurements object from product properties
  const measurements = {
    cintura: product.waist_flat,
    largo: product.length,
    tiro: product.rise,
  };

  // Check if there are any details to show (brand, or any measurement)
  const hasDetails = product.brand || measurements.cintura || measurements.largo || measurements.tiro;

  if (!hasDetails) return null;

  return (
    <div className="mt-8 py-6 border-y border-arena/50 space-y-4">
      
      {/* 1. Aclaración de Marca (Curaduría) */}
      {product.brand && (
        <div className="flex items-start gap-3 text-sm">
          <div className="text-gris-oscuro/80 mt-0.5"><Tag size={18} /></div>
          <div>
            <span className="font-bold">Marca:</span> 
            <span className="ml-1 text-gray-700">
               {product.brand}
            </span>
          </div>
        </div>
      )}

      {/* 2. Garantía de Nuevo */}
      <div className="flex items-start gap-3 text-sm">
        <div className="text-gris-oscuro/80 mt-0.5"><Sparkles size={18} /></div>
        <div>
          <span className="font-bold">Condición:</span> 
          <span className="ml-1 text-gray-700 font-medium">
            Nuevo
          </span>
        </div>
      </div>
      
      {/* Measurements Section */}
      {(measurements.cintura || measurements.largo || measurements.tiro) && (
        <div className="flex items-start gap-3 text-sm">
          <div className="text-gris-oscuro/80 mt-0.5"><Ruler size={18} /></div>
          <MeasurementsTable measurements={measurements} />
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
