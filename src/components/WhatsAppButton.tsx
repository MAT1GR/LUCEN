import React from 'react';
import whatsappLogo from '../assets/whatsapp-logo.webp';

const WhatsAppButton: React.FC = () => {
  const phoneNumber = '+543413981584';
  const whatsappLink = `https://wa.me/${phoneNumber.replace('+', '')}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 bg-[#25D366] p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 transform hover:scale-110"
      aria-label="Contactar por WhatsApp"
    >
      <img src={whatsappLogo} alt="WhatsApp" className="w-8 h-8" />
    </a>
  );
};

export default WhatsAppButton;
