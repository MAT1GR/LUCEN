import React, { useState } from 'react';
import { X, User, Phone } from 'lucide-react';
import Portal from './Portal';
import WhatsappLogo from '../assets/whatsapp-logo.png'; // Import the WhatsApp logo

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (name: string, phone: string) => void;
}

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ isOpen, onClose, onSubscribe }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onSubscribe(name, phone);
    }
  };

  return (
    <Portal>
      <div 
        className="fixed inset-0 bg-stone-300/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-[#25D366] mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden">
              <img src={WhatsappLogo} alt="WhatsApp Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
              ¿Querés ganarles de mano?
            </h2>
            <p className="text-gray-600 mb-6 text-sm font-medium">
              Nuestras piezas únicas vuelan en minutos. Dejanos tu número y te avisamos <strong>15 minutos antes</strong> de publicar en Instagram.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors font-medium"
                required
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Tu WhatsApp"
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:border-black transition-colors font-medium"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-black text-white font-black py-4 px-4 rounded-md hover:bg-gray-800 transition-all transform hover:-translate-y-1 shadow-md active:translate-y-0 uppercase tracking-widest text-sm"
            >
              Quiero Acceso VIP
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Sin spam. Solo te escribimos cuando hay Drop nuevo.
            </p>
          </form>
        </div>
      </div>
    </Portal>
  );
};

export default LeadCaptureModal;