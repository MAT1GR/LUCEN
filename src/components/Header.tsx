import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, User, Search } from "lucide-react";
import { useCart } from "../hooks/useCart.tsx";

interface HeaderProps {
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (isHomePage) {
        setIsScrolled(scrollTop > window.innerHeight * 0.8);
      } else {
        setIsScrolled(scrollTop > 10);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); 
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: "/tallas", label: "Guía de Talles" },
    { href: "/cambios-y-devoluciones", label: "Devoluciones" },
  ];

  const headerClasses = `
    fixed top-0 left-0 right-0 z-40 transition-all duration-300
    ${isScrolled ? "bg-white/90 backdrop-blur-lg shadow-sm" : "bg-transparent"}
    ${isHomePage && !isScrolled ? "text-white" : "text-black"}
  `;

  const linkClasses = `
    font-poppins text-sm font-medium hover:text-opacity-80
    relative after:content-[''] after:absolute after:w-full after:h-[1px] 
    after:bottom-[-4px] after:left-0 after:bg-current after:transition-transform 
    after:duration-300
    ${isScrolled ? "text-black" : isHomePage ? "text-white" : "text-black"}
  `;

  return (
    <>
      <header className={headerClasses}>
        <div className="w-full px-4">
          <div className="flex items-center h-20">
            {/* Navegación (Izquierda - para pantallas grandes) */}
            <div className="flex-1 hidden md:block">
              <nav className="flex items-center space-x-8 pl-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`${linkClasses} ${
                      location.pathname === link.href
                        ? "after:scale-x-100"
                        : "after:scale-x-0 hover:after:scale-x-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Logo (Centro) */}
            <div className="md:flex-none flex-1 text-center md:text-left">
              <Link
                to="/"
                className="font-poppins text-2xl tracking-[0.2em] uppercase inline-block"
              >
                <span className="font-semibold">denim</span>
                <span className="font-light opacity-80">rosario</span>
              </Link>
            </div>

            {/* Iconos (Derecha) */}
            <div className="flex-1 flex justify-end items-center space-x-2">
              
              
              <button
                onClick={onCartClick}
                className="relative p-2"
              >
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className={`absolute top-0 right-0 text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold ${isScrolled || !isHomePage ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    {totalItems}
                  </span>
                )}
              </button>
              <div className="md:hidden">
                <button
                  className="p-2"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Menú Móvil */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 h-full w-3/4 max-w-xs bg-white shadow-xl p-6 transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end items-center mb-12">
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-black">
              <X />
            </button>
          </div>
          <nav className="flex flex-col space-y-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-2xl font-bold font-poppins text-black ${
                  location.pathname === link.href ? "underline" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Header;
