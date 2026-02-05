import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { X, Trash2, Plus, Minus, ArrowRight, Truck } from "lucide-react";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { cartItems, removeFromCart, updateQuantity, getCartSummary, getTotalItems } =
    useCart();
  const summary = getCartSummary();
  const totalItems = getTotalItems();

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
        className={`fixed inset-0 bg-gris-oscuro/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-blanco-hueso shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col text-gris-oscuro ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gris-oscuro/10">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Tu Carrito</h2>
          <button onClick={onClose} className="p-2 hover:opacity-70 transition-opacity">
            <X size={24} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <p className="text-xl opacity-60 mb-8 font-medium">Tu carrito está vacío</p>
            <Link
              to="/tienda"
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-[#3E6F8F] hover:opacity-90 text-blanco-hueso px-8 py-3 rounded-sm font-bold uppercase tracking-wider transition-all group"
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
                    className="w-24 h-32 object-cover rounded-sm bg-gris-oscuro/5"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold uppercase text-sm tracking-tight leading-tight">{item.product.name}</h3>
                      </div>
                      <button
                        onClick={() =>
                          removeFromCart(item.product.id, item.size)
                        }
                        className="text-gris-oscuro/40 hover:text-gris-oscuro transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center border border-gris-oscuro/20 rounded-sm">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="px-2 py-1 disabled:opacity-30"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-2 py-1 disabled:opacity-30"
                        >
                          <Plus size={14} />
                        </button>
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
            <div className="p-6 border-t border-gris-oscuro/10 bg-blanco-hueso">
              {summary.discount > 0 && (
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold uppercase tracking-tight">Subtotal</span>
                  <span className="font-bold line-through text-gray-500">
                    ${summary.subtotal.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              {summary.discount > 0 && (
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold uppercase tracking-tight text-red-500">Descuento 3x2</span>
                  <span className="font-bold text-red-500">
                    -${summary.discount.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl">
                <span className="font-black uppercase tracking-tight">Total</span>
                <span className="font-black">
                  ${summary.total.toLocaleString("es-AR")}
                </span>
              </div>
              {summary.discount > 0 && totalItems >= 3 && (
                <p className="text-right text-xs opacity-80 mt-2">
                  Llevás 3, pagás 2 (${(summary.total / totalItems).toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u)
                </p>
              )}
              <p className="text-right text-xs opacity-60 mt-1">
                O 3 cuotas sin interés de ${" "}
                {(summary.total / 3).toLocaleString("es-AR", {
                  maximumFractionDigits: 0,
                })}
              </p>

              {/* Aviso de Envío Gratis en el Footer del Carrito */}
              {summary.total > 0 && (
                <div className="text-center text-[10px] bg-green-500 text-blanco-hueso p-2 rounded-sm font-black uppercase tracking-widest">
                  <p className="flex items-center justify-center gap-2">
                    <Truck size={14} /> ENVÍO GRATIS INCLUIDO.
                  </p>
                </div>
              )}

              <Link
                to="/checkout"
                onClick={onClose}
                className="w-full block text-center bg-[#3E6F8F] hover:opacity-90 text-blanco-hueso py-4 rounded-sm text-sm font-bold uppercase tracking-widest transition-all"
              >
                Iniciar Compra
              </Link>
              <div className="text-center">
                <Link
                  to="/tienda"
                  onClick={onClose}
                  className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity underline underline-offset-4"
                >
                  Seguir comprando
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
