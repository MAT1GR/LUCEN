import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { X, Trash2, Plus, Minus, ArrowRight } from "lucide-react";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } =
    useCart();
  const total = getTotalPrice();

  const getCorrectImageUrl = (path: string) => {
    if (!path) return '';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    let processedPath = path;
    if (processedPath.startsWith('/uploads/')) {
      processedPath = `/api${processedPath}`;
    }
    return `${apiBaseUrl}${processedPath}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Tu Carrito</h2>
          <button onClick={onClose} className="p-2">
            <X size={24} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-xl text-gray-600 mb-8">Tu carrito está vacío</p>
            <Link
              to="/tienda"
              onClick={onClose}
              // CORRECCIÓN DE VISIBILIDAD: Cambiado a bg-black
              className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors group"
            >
              Ver productos
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          <>
            {/* Product List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-4"
                >
                  <img
                    src={getCorrectImageUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-gray-600 text-sm">
                          Talle: {item.size}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          removeFromCart(item.product.id, item.size)
                        }
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-lg">
                        $
                        {(item.product.price * item.quantity).toLocaleString(
                          "es-AR"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Section (Fixed at the bottom) */}
            <div className="p-6 border-t bg-white">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold">Subtotal</span>
                <span className="font-bold">
                  ${total.toLocaleString("es-AR")}
                </span>
              </div>
              <p className="text-right text-sm text-gray-500 mt-1 mb-4">
                O hasta 24 x ${" "}
                {(total / 24).toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <Link
                to="/checkout"
                onClick={onClose}
                // CORRECCIÓN DE VISIBILIDAD: Cambiado a bg-black y hover:bg-gray-800
                className="w-full block text-center bg-black hover:bg-gray-800 text-white py-3 rounded-lg text-lg font-bold transition-colors"
              >
                Iniciar Compra
              </Link>
              <div className="text-center mt-3">
                <Link
                  to="/tienda"
                  onClick={onClose}
                  className="text-sm font-medium text-brand-primary hover:underline"
                >
                  Ver más productos
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartSidebar;