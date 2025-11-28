import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { useCart } from "../hooks/useCart.tsx";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const CartPage: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    clearCart,
  } = useCart();
  const navigate = useNavigate();
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

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-blanco-hueso py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-8 text-gris-oscuro">
            Tu Carrito
          </h1>
          <p className="text-xl text-gris-oscuro/80 mb-8">
            Tu carrito está vacío
          </p>
          <Link
            to="/tienda"
            className="inline-block bg-caramelo hover:opacity-90 text-blanco-hueso px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blanco-hueso py-8">
      <div className="container mx-auto px-4">
        <Link
          to="/tienda"
          className="inline-flex items-center text-gris-oscuro/80 hover:text-gris-oscuro mb-8 transition-colors"
        >
          <ArrowLeft className="mr-2" size={20} />
          Continuar comprando
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-blanco-hueso rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gris-oscuro">
                Tu Carrito
              </h1>
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}`}
                  className="flex gap-4 py-4 border-b border-arena"
                >
                  <img
                    src={getCorrectImageUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-lg text-gris-oscuro">
                          {item.product.name}
                        </h3>
                        <p className="text-gris-oscuro/80">
                          Talle: {item.size}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.size)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center border border-arena rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                          className="p-2 text-gris-oscuro/80 hover:text-gris-oscuro transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 py-1 border-x border-arena">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                          className="p-2 text-gris-oscuro/80 hover:text-gris-oscuro transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gris-oscuro">
                          ${(item.product.price * item.quantity).toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-blanco-hueso rounded-lg shadow-sm p-6 sticky top-28 border border-arena">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gris-oscuro">
                Resumen del Pedido
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-gris-oscuro">Subtotal</span>
                  <span className="text-2xl text-caramelo">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
                <p className="text-sm text-gris-oscuro/70">El costo de envío se calculará en el siguiente paso.</p>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-caramelo text-blanco-hueso py-3 rounded-lg text-lg font-bold transition-colors hover:opacity-90"
              >
                Continuar Compra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;