import React from "react";
import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";

const Footer: React.FC = () => {
  const helpLinks = [
    { href: "/cambios-y-devoluciones", label: "Envíos y Devoluciones" },
  ];

  const legalLinks = [
    { href: "/privacy-policy", label: "Políticas de Privacidad" },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y Descripción */}
          <div className="md:col-span-1">
            <Link
              to="/"
              className="font-poppins text-xl font-bold tracking-widest uppercase"
            >
              <span className="font-semibold text-white">denim</span>
              <span className="font-light text-gray-400">rosario</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Redefiniendo el denim con un calce perfecto y un estilo que
              perdura.
            </p>
          </div>

          {/* Ayuda */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase text-gray-300">Ayuda</h3>
            <ul className="mt-4 space-y-2">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold tracking-wider uppercase text-gray-300">Legal</h3>
            <ul className="mt-4 space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-gray-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="text-left md:text-right">
            <h3 className="font-semibold tracking-wider uppercase text-gray-300">Social</h3>
            <div className="flex mt-4 space-x-4 md:justify-end">
              <a href="https://www.instagram.com/denimrosario/" className="text-gray-400 hover:text-white transition-colors"><Instagram size={20} /></a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} DenimRosario. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
