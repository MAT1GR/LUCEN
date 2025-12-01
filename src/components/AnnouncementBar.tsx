import React from "react";

// Move MarqueeContent outside AnnouncementBar
const MarqueeContent = () => (
  <div className="flex-shrink-0 flex items-center whitespace-nowrap">
    <span className="mx-16">A PARTIR DE $45.000 ENVÍO GRATIS</span>
    <span className="text-white">❀</span>
    <span className="mx-16">10% OFF PAGANDO POR TRANSFERENCIA</span>
    <span className="text-white">❀</span>
    <span className="mx-16">A PARTIR DE $45.000 ENVÍO GRATIS</span>
    <span className="text-white">❀</span>
    <span className="mx-16">10% OFF PAGANDO POR TRANSFERENCIA</span>
    <span className="text-white">❀</span>
    <span className="mx-16">A PARTIR DE $45.000 ENVÍO GRATIS</span>
    <span className="text-white">❀</span>
    <span className="mx-16">10% OFF PAGANDO POR TRANSFERENCIA</span>
    <span className="text-white">❀</span>
  </div>
);

const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-black text-white py-2.5 overflow-hidden font-poppins text-sm font-medium tracking-wider fixed top-0 w-full z-50">
      <div className="flex animate-marquee-scroll">
        <MarqueeContent />
        <MarqueeContent />
      </div>
    </div>
  );
};

export default AnnouncementBar;
