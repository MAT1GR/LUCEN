import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail } from "lucide-react";
import logo from "../assets/LOGO.webp";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-8">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link to="/">
              <img 
                src={logo} 
                alt="LUCEN" 
                className="h-8 w-auto mb-6 brightness-0 invert" 
              />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
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

          {/* Links Column */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Tienda</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/tienda" className="hover:text-white transition-colors">Ver Todo</Link></li>
              <li><Link to="/tienda?category=hombre" className="hover:text-white transition-colors">Hombre</Link></li>
              <li><Link to="/tienda?category=mujer" className="hover:text-white transition-colors">Mujer</Link></li>
            </ul>
          </div>

          {/* Help Column */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Ayuda</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/cambios" className="hover:text-white transition-colors">Cambios y Devoluciones</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Envíos</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          {/* Newsletter (Simplified) */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Novedades</h4>
            <p className="text-gray-400 text-sm mb-4">Suscríbete para recibir ofertas exclusivas.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Tu email" 
                className="bg-gray-800 border-none text-white text-sm px-4 py-2 w-full focus:ring-1 focus:ring-white outline-none"
              />
              <button className="bg-white text-black text-xs font-bold px-4 py-2 uppercase hover:bg-gray-200 transition-colors">
                OK
              </button>
            </form>
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