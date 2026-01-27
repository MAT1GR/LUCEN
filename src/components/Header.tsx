import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react"; 
import { useCart } from "../hooks/useCart.tsx";
import logo from "../assets/LOGO.webp"; 

interface HeaderProps {
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { href: "/tienda", label: "Colección" },
    { href: "/blue-light-info", label: "¿Qué es?" }, 
  ];

  return (
    <>
      <header 
        className={`fixed top-10 left-0 right-0 z-40 transition-all duration-300 border-b ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-gray-100" : "bg-white border-transparent"
        }`}
      >
        <div className="w-full px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-20">
            
            {/* 1. LEFT: Navigation (Desktop) / Menu Icon (Mobile) */}
            <div className="flex-1 flex items-center">
              <nav className="hidden md:flex items-center space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-[11px] font-bold text-gray-900 hover:text-blue-600 transition-colors uppercase tracking-[0.2em]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <button
                className="md:hidden p-2 text-gray-600 -ml-2"
                onClick={() => setIsMenuOpen(true)}
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>

            {/* 2. CENTER: Logo (Perfectly Centered) */}
            <div className="flex-shrink-0 flex justify-center">
              <Link to="/">
                <img 
                  src={logo} 
                  alt="LUCEN" 
                  className="h-8 md:h-10 w-auto object-contain transition-all" 
                />
              </Link>
            </div>

            {/* 3. RIGHT: Icons */}
            <div className="flex-1 flex justify-end items-center space-x-2 md:space-x-4">
              <button className="hidden sm:block p-2 text-gray-600 hover:text-black transition-colors">
                <Search size={18} strokeWidth={1.5} />
              </button>
              
              <button
                onClick={onCartClick}
                className="relative p-2 text-gray-600 hover:text-black transition-colors"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-black text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${
          isMenuOpen ? "visible" : "invisible"
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className={`absolute top-0 left-0 h-full w-[80%] max-w-sm bg-white shadow-2xl p-8 transition-transform duration-300 ease-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center mb-12">
            <span className="text-sm font-bold tracking-widest uppercase text-gray-400">Menú</span>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-black">
              <X size={24} />
            </button>
          </div>
          <nav className="flex flex-col space-y-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xl font-bold text-gray-900 uppercase tracking-tighter border-b border-gray-50 pb-4"
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
