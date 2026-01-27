import React from "react";

const MarqueeContent = () => (
  <div className="flex-shrink-0 flex items-center whitespace-nowrap">
    <span className="mx-8">3x2 EN TODOS LOS PRODUCTOS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">ENVÍO GRATIS A TODO EL PAÍS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">6 CUOTAS SIN INTERÉS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">CAMBIOS GRATIS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">3x2 EN TODOS LOS PRODUCTOS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">ENVÍO GRATIS A TODO EL PAÍS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">6 CUOTAS SIN INTERÉS</span>
    <span className="text-white/50">✦</span>
    <span className="mx-8">CAMBIOS GRATIS</span>
    <span className="text-white/50">✦</span>
  </div>
);

const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-[#406F8F] text-white py-2 overflow-hidden font-sans text-xs font-bold tracking-widest uppercase fixed top-0 left-0 right-0 z-50 h-10 flex items-center">
      <div className="flex animate-marquee-scroll w-max">
        <MarqueeContent />
        <MarqueeContent />
      </div>
    </div>
  );
};

export default AnnouncementBar;