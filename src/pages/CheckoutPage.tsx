import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Banknote } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { CartItem as CartItemType } from "../../server/types";
import { useSettings } from "../hooks/useSettings";
import { generateEventId } from '../lib/utils';
import { track } from '../lib/meta';

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, getCartSummary } = useCart();
  const { loading: settingsLoading } = useSettings();
  const { subtotal, discount, total: cartTotal } = getCartSummary();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    postalCode: "",
    firstName: "",
    lastName: "",
    phone: "",
    streetName: "",
    streetNumber: "",
    apartment: "",
    city: "",
    province: "Santa Fe",
    docNumber: "",
  });

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("mercado-pago");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cartTotal + (selectedShipping?.cost || 0);
  const totalWithDiscount = total * 0.95;

  useEffect(() => {
    if (step === 1) {
      const eventId = generateEventId();
      sessionStorage.setItem('meta_event_id', eventId);
      track('InitiateCheckout', {
          value: subtotal,
          currency: 'ARS',
          num_items: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          content_ids: cartItems.map(item => item.product.id),
          contents: cartItems.map(item => ({
              id: item.product.id,
              quantity: item.quantity,
              item_price: item.product.price
          })),
          content_type: 'product',
      }, eventId);
    }
  }, [step, subtotal, cartItems]);

  useEffect(() => {
    if (cartItems.length === 0) { 
      navigate("/tienda");
    }
  }, [cartItems, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmailBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email) && cartItems.length > 0) {
      try {
        await fetch('/api/carts/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, cartItems: cartItems }),
        });
      } catch (error) {
        console.error('Error capturing abandoned cart:', error);
      }
    }
  };

  const handleCalculateShipping = useCallback(async () => {
    if (formData.postalCode.length < 4 || settingsLoading) return;
    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: formData.postalCode }),
      });
      const data = await response.json();
      setShippingOptions([]); // Always clear options as they are not displayed
      if (data.options && data.options.length > 0) {
        // Assuming the first option is the desired default if any are returned
        setSelectedShipping(data.options[0]);
      } else {
        // Fallback to a fixed default if API returns no options
        setSelectedShipping({ id: 'correo', name: 'Correo Argentino', cost: 0 });
      }
    } catch (error) {
      console.error("Error al calcular envío:", error);
    }
  }, [formData.postalCode, settingsLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.postalCode.length >= 4) {
        handleCalculateShipping();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.postalCode, handleCalculateShipping]);

  const handleFinalizeOrder = async () => {
    setIsLoading(true);
    setError(null);
    const finalTotal = paymentMethod === "transferencia" ? totalWithDiscount : total;
    const eventId = sessionStorage.getItem('meta_event_id');
    const orderPayload = {
      items: cartItems,
      shippingInfo: formData,
      shipping: selectedShipping ? { id: selectedShipping.id, name: selectedShipping.name, cost: selectedShipping.cost } : { id: 'correo', name: 'Correo Argentino', cost: 0 },
      shippingDetails: selectedShipping?.name || 'Correo Argentino',
      total: finalTotal,
      eventId,
    };
    if (paymentMethod === "mercado-pago" || paymentMethod === "tarjeta-credito-debito") {
      try {
        const response = await fetch("/api/payments/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...orderPayload, shippingCost: 0 }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al iniciar pago.");
        }
        const data = await response.json();
        if (data.init_point) window.location.href = data.init_point;
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
      }
    } else if (paymentMethod === "transferencia") {
      try {
        const response = await fetch("/api/payments/create-transfer-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        if (!response.ok) throw new Error("Error al crear orden.");
        const orderData = await response.json();
        navigate(`/pedido-pendiente/${orderData.id}`, { state: { order: orderData.order } });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormComplete = formData.email && formData.firstName && formData.lastName && formData.docNumber && formData.streetName && formData.streetNumber && formData.phone && formData.postalCode;

  return (
    <div className="min-h-screen bg-blanco-hueso">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="col-12 col-md-8 mx-auto mb-8"> {/* Added mx-auto mb-8 for centering and spacing */}
          <ul className="breadcrumb-timeline flex justify-center items-center space-x-2"> {/* Added flex classes for layout */}
            <li>
              <button className={`breadcrumb-timeline-item ${step === 1 ? 'current' : ''} ${step > 1 ? 'disabled' : ''}`} aria-disabled={step > 1 ? true : false} tabIndex={step > 1 ? -1 : 0}>
                <div className="breadcrumb-timeline-item-icon">
                  {step > 1 ? ( // If step 2 or later, show checkmark
                    <svg className="svg" width="9px" height="9px" viewBox="0 0 1024 1024"><path d="M392.715 691.38L243.381 542.047C226.741 525.407 200.288 525.407 183.648 542.047C167.008 558.687 167.008 585.14 183.648 601.78L362.421 780.553C379.061 797.193 405.941 797.193 422.581 780.553L874.848 328.713C891.488 312.073 891.488 285.62 874.848 268.98C858.208 252.34 831.755 252.34 815.115 268.98L392.715 691.38Z"></path></svg>
                  ) : ( // Otherwise, show square (Datos is active or pending)
                    <svg className="svg" width="12px" height="12px" viewBox="0 0 1024 1024"><path d="M944.5 140.5C910.9 106.9 865.3 88 817.8 88H182.3c-47.5 0-93.1 18.9-126.7 52.5C21.9 174.1 3 219.7 3 267.2v456.3c0 47.5 18.9 93.1 52.5 126.7 33.6 33.6 79.2 52.5 126.7 52.5h635.5c47.5 0 93.1-18.9 126.7-52.5C978.1 816.6 997 771 997 723.5V267.2c0-47.5-18.9-93.1-52.5-126.7zm-37.1 583c0 23.8-9.4 46.6-26.2 63.4-16.8 16.8-39.6 26.2-63.4 26.2H182.3c-23.8 0-46.6-9.4-63.4-26.2-16.8-16.8-26.2-39.6-26.2-63.4V450.6h814.7v272.9zm0-362.6H92.7v-93.7c0-23.8 9.4-46.6 26.2-63.4 16.8-16.8 39.6-26.2 63.4-26.2h635.5c23.8 0 46.6 9.4 63.4 26.2 16.8 16.8 39.6 26.2 26.2 63.4v93.7z"></path></svg>
                  )}
                </div>
                <p className="breadcrumb-timeline-item-text">Datos</p>
              </button>
            </li>
            <li className="breadcrumb-timeline-line flex-1 h-px bg-gray-300 mx-2"></li>
            <li>
              <button className={`breadcrumb-timeline-item ${step === 2 ? 'current' : ''} ${step < 2 ? 'disabled' : ''}`} aria-disabled={step < 2 ? true : false} tabIndex={step < 2 ? -1 : 0}>
                <div className="breadcrumb-timeline-item-icon">
                  {step < 2 ? ( // If step 1 or earlier, show square
                    <svg className="svg" width="12px" height="12px" viewBox="0 0 1024 1024"><path d="M944.5 140.5C910.9 106.9 865.3 88 817.8 88H182.3c-47.5 0-93.1 18.9-126.7 52.5C21.9 174.1 3 219.7 3 267.2v456.3c0 47.5 18.9 93.1 52.5 126.7 33.6 33.6 79.2 52.5 126.7 52.5h635.5c47.5 0 93.1-18.9 126.7-52.5C978.1 816.6 997 771 997 723.5V267.2c0-47.5-18.9-93.1-52.5-126.7zm-37.1 583c0 23.8-9.4 46.6-26.2 63.4-16.8 16.8-39.6 26.2-63.4 26.2H182.3c-23.8 0-46.6-9.4-63.4-26.2-16.8-16.8-26.2-39.6-26.2-63.4V450.6h814.7v272.9zm0-362.6H92.7v-93.7c0-23.8 9.4-46.6 26.2-63.4 16.8-16.8 39.6-26.2 63.4-26.2h635.5c23.8 0 46.6 9.4 63.4 26.2 16.8 16.8 39.6 26.2 26.2 63.4v93.7z"></path></svg>
                  ) : ( // Otherwise, show checkmark
                    <svg className="svg" width="9px" height="9px" viewBox="0 0 1024 1024"><path d="M392.715 691.38L243.381 542.047C226.741 525.407 200.288 525.407 183.648 542.047C167.008 558.687 167.008 585.14 183.648 601.78L362.421 780.553C379.061 797.193 405.941 797.193 422.581 780.553L874.848 328.713C891.488 312.073 891.488 285.62 874.848 268.98C858.208 252.34 831.755 252.34 815.115 268.98L392.715 691.38Z"></path></svg>
                  )}
                </div>
                <p className="breadcrumb-timeline-item-text">Pago</p>
              </button>
            </li>
          </ul>
        </div>
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 gap-y-12">
            <div className="lg:pr-8 order-1">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <fieldset>
                  <legend className="text-xl font-bold mb-4 text-gris-oscuro">1. DATOS DE CONTACTO</legend>
                  <InputField name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} onBlur={handleEmailBlur} required type="email" />
                </fieldset>
                <fieldset className="space-y-4">
                  <legend className="text-xl font-bold mb-4 text-gris-oscuro">2. DATOS DE ENVÍO</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleChange} required />
                    <InputField name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleChange} required />
                  </div>
                  <InputField name="docNumber" placeholder="DNI" value={formData.docNumber} onChange={handleChange} required inputMode="numeric" pattern="[0-9]*" />
                  <InputField name="phone" placeholder="Teléfono (ej: 341...)" value={formData.phone} onChange={handleChange} required type="tel" inputMode="numeric" pattern="[0-9]*" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField name="postalCode" placeholder="Código Postal" value={formData.postalCode} onChange={handleChange} required />
                    <InputField name="city" placeholder="Ciudad" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <InputField name="streetName" placeholder="Calle" value={formData.streetName} onChange={handleChange} required />
                    </div>
                    <InputField name="streetNumber" placeholder="Número" value={formData.streetNumber} onChange={handleChange} required />
                  </div>
                  <InputField name="apartment" placeholder="Departamento (opcional)" value={formData.apartment} onChange={handleChange} />
                </fieldset>
              </form>
              <button onClick={() => setStep(2)} disabled={isLoading || !isFormComplete} className="w-full mt-6 bg-[#3F6E8F] text-white py-3 rounded-lg text-lg font-extrabold transition-colors hover:opacity-80 disabled:opacity-50">
                {isLoading ? "Procesando..." : "Continuar"}
              </button>
            </div>

          </div>
        )}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* 1. Resumen del Pedido */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-arena w-full">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gris-oscuro">1. Resumen del Pedido</h2>
              <div className="space-y-4">
                {cartItems.map((item) => ( <CartItem key={`${item.product.id}-${item.size}`} item={item} /> ))}
                <div className="flex justify-between items-center text-gris-oscuro border-t border-arena pt-4">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 font-bold">
                  <span>Envío</span>
                  <span>GRATIS</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600 text-base font-bold">
                    <span>Descuento 3x2</span>
                    <span>-${discount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                {paymentMethod === "transferencia" && (
                  <div className="flex justify-between items-center text-green-600 text-sm">
                    <span>Descuento Transferencia (-5%)</span>
                    <span>-${(total * 0.05).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-2xl font-black border-t border-arena pt-4">
                  <span className="text-gris-oscuro">Total</span>
                  <span className="text-2xl text-black">${(paymentMethod === "transferencia" ? totalWithDiscount : total).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            {/* 2. Confirmación de Entrega */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-gris-oscuro">2. Confirmación de Entrega</h3>
                <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline">Volver</button>
              </div>
              <div className="p-4 border rounded-lg bg-white">
                <p className="font-semibold">Llega entre el martes 10 y el jueves 12 de febrero.</p>
                <p className="text-sm text-gray-600">Método de envío: {selectedShipping?.name || 'Envío Estándar'}</p>
              </div>
            </div>

            {/* 3. Revisión de datos */}
            <div>
              <h3 className="text-lg font-bold text-gris-oscuro mb-2">3. Revisión de datos</h3>
              <div className="p-4 border rounded-lg bg-white text-sm text-gray-700">
                <p><strong>Dirección:</strong> {formData.streetName} {formData.streetNumber}, {formData.city}, {formData.province}</p>
                <p><strong>Contacto:</strong> {formData.email}</p>
              </div>
            </div>

            {/* 4. Método de Pago */}
            <div className="border-t border-arena pt-4">
              <h3 className="text-lg font-bold mb-3 text-gris-oscuro">4. Método de Pago</h3>
              <div className="space-y-4">
                                    <PaymentOption id="tarjeta-credito-debito" title="Tarjeta de crédito o débito" description="Paga con tu tarjeta de crédito o débito directamente. Hasta 3 cuotas sin interés." icon={<Banknote />} selected={paymentMethod} onSelect={setPaymentMethod} />
                    <PaymentOption id="mercado-pago" title="Mercado Pago" description="Tarjetas de crédito, débito y dinero en cuenta. Hasta 3 cuotas sin interés." icon={<img src="https://logowik.com/content/uploads/images/mercado-pago1721074123.logowik.com.webp" alt="MP" className="h-6" />} selected={paymentMethod} onSelect={setPaymentMethod} />                <PaymentOption id="transferencia" title="Transferencia Bancaria" description="Tenés 15 minutos para enviar el comprobante." icon={<Banknote />} selected={paymentMethod} onSelect={setPaymentMethod} discount="-5% OFF" />
              </div>
            </div>

            {/* 5. Boton de "Comprar" */}
            <div className="pt-4">
              {error && <div className="my-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"><strong>Error:</strong> {error}</div>}
              <button onClick={handleFinalizeOrder} disabled={isLoading} className="w-full mt-2 bg-[#0055FF] text-white py-3 rounded-lg text-lg font-extrabold transition-colors hover:opacity-80 disabled:opacity-50">
                {isLoading ? "Procesando..." : "Comprar"}
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">Tenés 30 días para cambios gratis. Garantía de protección visual LUCEN.</p>
              <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                <Lock size={16} className="mr-2" /><span>Sitio seguro</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full p-3 border border-arena rounded-lg focus:ring-2 focus:ring-black bg-white placeholder:text-gris-oscuro/50 text-gris-oscuro" />
);

const PaymentOption = ({ id, title, description, icon, selected, onSelect, discount }: any) => (
  <div onClick={() => onSelect(id)} className={`p-4 border rounded-lg cursor-pointer flex items-center gap-4 transition-colors relative ${selected === id ? "border-black bg-gray-50" : "border-arena hover:bg-gray-50"}`}>
    {id === "transferencia" && (
        <span className="absolute -top-3 right-3 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold z-10">-5% OFF</span>
    )}
    {icon}
    <div className="flex-1">
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected === id ? "border-black bg-black" : "border-gray-400"}`}>
      {selected === id && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
    </div>
  </div>
);

const CartItem = ({ item }: { item: CartItemType }) => {
  const getCorrectImageUrl = (path: string) => path.startsWith('/uploads/') ? `/api${path}` : path;
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={getCorrectImageUrl(item.product.images[0])} className="w-12 h-12 rounded object-cover" alt={item.product.name} />
          <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{item.quantity}</span>
        </div>
        <div>
          <span className="text-gray-800 font-medium">{item.product.name}</span>
          <p className="text-gray-500 text-xs">Talle: {item.size === "default" ? "Único" : item.size}</p>
        </div>
      </div>
      <span className="font-semibold">${(item.product.price * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
    </div>
  );
};

export default CheckoutPage;