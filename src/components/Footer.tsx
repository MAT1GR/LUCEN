import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import logo from "../assets/LOGO.webp";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-8">
      <div className="container mx-auto max-w-7xl px-6">
        {/* Brand Column */}
        <div className="flex flex-col items-center text-center mb-12">
          <Link to="/">
            <img 
              src={logo} 
              alt="LUCEN" 
              className="h-10 w-auto mb-4 brightness-0 invert" 
            />
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mb-6">
            Protegemos tu visión digital con tecnología de vanguardia y diseño premium.
            Tus ojos merecen descansar con LUCEN.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="mailto:hola@lucen.com.ar" className="text-gray-400 hover:text-white transition-colors">
              <Mail size={20} />
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} LUCEN. Todos los derechos reservados.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span>Privacidad</span>
            <span>Términos</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;