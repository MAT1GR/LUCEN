import React, { useEffect, useState, useRef } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import {
  Copy,
  Check,
  AlertTriangle,
  Loader,
  Clock,
} from "lucide-react";
import whatsappLogo from '../assets/whatsapp-logo.webp'; // Import the WhatsApp logo

import { Order } from "../types";
import { useCart } from "../hooks/useCart";
import { StockCountdownTimer } from "../components/StockCountdownTimer";
import { useSettings } from "../hooks/useSettings";

const TransferPendingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { settings, loading: settingsLoading } = useSettings();

  const [order, setOrder] = useState<Order | null>(
    location.state?.order || null
  );
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(order?.status === 'awaiting_confirmation');
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/orders/${id}`);
          if (!response.ok) {
            throw new Error("No se pudo encontrar la orden.");
          }
          const data = await response.json();
          setOrder(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    } else if (location.state?.order) {
      setLoading(false);
    }
  }, [id, order, location.state]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/confirm-payment`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('No se pudo confirmar el pago.');
      }
      setPaymentConfirmed(true);
      // Optionally update the order status in the local state
      setOrder(prev => prev ? { ...prev, status: 'awaiting_confirmation' } : null);
    } catch (err: any) {
      console.error("Error confirming payment:", err);
      // Optionally show an error to the user
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Loader className="animate-spin mb-4 text-gray-400" size={48} />
        <p className="text-gray-600">Cargando detalles de la orden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <AlertTriangle className="text-red-500 mb-4" size={48} />
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/" className="text-blue-500 hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center h-screen">
        Verificando datos de la orden...
      </div>
    );
  }

  const bankDetails = {
    bank: (order as any).bankDetails?.bank || "No disponible",
    cvu: (order as any).bankDetails?.cvu || "No disponible",
    alias: (order as any).bankDetails?.alias || "No disponible",
    titular: (order as any).bankDetails?.titular || "No disponible",
    cuit: (order as any).bankDetails?.cuit || "No disponible",
    whatsappNumber: settings.whatsapp_number || null, // This can still come from settings
  };

  const subtotal = order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('/uploads/')) {
      return `/api${imagePath}`;
    }
    return imagePath;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Columna Izquierda */}
          <div className="lg:w-2/3 w-full">
            {/* Payment Status & Instructions */}
            {order.status === 'awaiting_confirmation' || paymentConfirmed ? (
              <div className="border border-blue-400 bg-blue-50 rounded-md p-6 mb-6">
                <div className="flex items-center mb-4">
                  <Check className="w-6 h-6 text-blue-600 mr-4" />
                  <h2 className="text-xl font-bold text-blue-800">¡Gracias! Estamos verificando tu pago.</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Tu stock ha sido reservado. Por favor, envía el comprobante por WhatsApp para que podamos finalizar la validación.
                </p>
              </div>
            ) : (
              <>
                <div className="border border-yellow-400 bg-yellow-50 rounded-md p-4 flex items-center mb-6">
                  <Clock className="w-6 h-6 text-yellow-600 mr-4" />
                  <span className="font-semibold text-lg text-yellow-800">
                    Pago Pendiente
                  </span>
                </div>
                <StockCountdownTimer createdAt={order.createdAt} orderId={order.id} onOrderCancel={()=> setOrder(prev => prev ? {...prev, status: 'cancelled'} : null)} />
              </>
            )}
            
            {/* Instrucciones de pago */}
            <div className="border border-gray-200 rounded-md p-6 bg-white mb-6">
              <h2 className="text-xl font-bold mb-4">1. Realiza el Pago</h2>
              <p className="text-gray-600 mb-4">
                Podés hacer transferencia o depósito a la siguiente cuenta:
              </p>
              <div className="space-y-3 text-sm text-gray-800 bg-gray-50 p-4 rounded-md">
                <p><strong>Nombre del banco:</strong> {bankDetails.bank}</p>
                <div className="flex items-center justify-between">
                  <p><strong>CVU:</strong> {bankDetails.cvu}</p>
                  <button onClick={() => handleCopy(bankDetails.cvu, "cvu")} className="text-blue-500 hover:text-blue-700">
                    {copied === "cvu" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                 <div className="flex items-center justify-between">
                  <p><strong>Alias:</strong> {bankDetails.alias}</p>
                  <button onClick={() => handleCopy(bankDetails.alias, "alias")} className="text-blue-500 hover:text-blue-700">
                    {copied === "alias" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p><strong>Titular de la cuenta:</strong> {bankDetails.titular}</p>
                <p><strong>DNI:</strong> {bankDetails.cuit}</p>
              </div>
            </div>

            {/* Confirmar y Enviar Comprobante */}
            <div className="border border-green-300 rounded-md p-6 bg-white">
              <h2 className="text-xl font-bold mb-4">2. Confirmar y Enviar Comprobante</h2>
              {order.status !== 'awaiting_confirmation' && !paymentConfirmed ? (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    Una vez que hayas realizado el pago, haz clic en el botón de abajo para notificarnos. Esto reservará tu stock y evitará que tu orden se cancele.
                  </p>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isConfirming}
                    className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-md mt-4 hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                  >
                    {isConfirming ? 'Confirmando...' : 'Ya realicé el pago'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-sm mb-4">
                    ¡Gracias por confirmar! Ahora, por favor envíanos el comprobante por WhatsApp para finalizar el proceso.
                  </p>
                  <button 
                    onClick={() => {
                      if (!order) return;
                      const message = encodeURIComponent(`¡Hola! 👋 Quiero enviar el comprobante de pago para la orden #${order.id}.`);
                      const whatsappUrl = `https://wa.me/3413981584?text=${message}`;
                      window.open(whatsappUrl, "_blank");
                    }}
                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-md mt-4 hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                    <img src={whatsappLogo} alt="WhatsApp" className="w-8 h-8 mr-2" />
                    Enviar Comprobante por WhatsApp
                  </button>
                  <p className="text-center text-gray-500 text-sm mt-2">También podes contactarnos al 3413981584</p>
                </>
              )}
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="lg:w-1/3 w-full">
            <div className="bg-white border rounded-md p-6 sticky top-10">
              <h2 className="text-xl font-bold mb-6">Mi pedido #{order.id.substring(0, 8)}</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={getImageUrl(item.product.images[0])}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-md mr-4"
                      />
                      <div>
                        <p className="font-semibold">{item.product.name} ({item.size})</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} unidad
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      ${(item.product.price * item.quantity).toLocaleString("es-AR")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t my-6"></div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>${subtotal.toLocaleString("es-AR")}</p>
                </div>
                <div className="flex justify-between">
                  <p>Descuento</p>
                  <p>-${(subtotal + (order.shippingCost || 0) - order.total).toLocaleString("es-AR")}</p>
                </div>
                <div className="flex justify-between">
                    <p>{order.shippingName?.replace(/\s-\sGRATIS/i, '') || 'Envío'}</p>
                    {order.shippingName && order.shippingName.toLowerCase().includes('cadete') ? (
                        <p className="font-bold text-green-600">GRATIS</p>
                    ) : (
                        <p>${order.shippingCost?.toLocaleString("es-AR") ?? 'N/A'}</p>
                    )}
                </div>
              </div>
              <div className="border-t my-6"></div>
              <div className="flex justify-between font-bold text-lg">
                <p>Total</p>
                <p>${order.total.toLocaleString("es-AR")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferPendingPage;
