import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Banknote } from "lucide-react"; // Sacamos CreditCard si no se usa directo
import { useCart } from "../hooks/useCart";
import { CartItem as CartItemType } from "../../server/types";
import { useSettings } from "../hooks/useSettings";
import { CadeteDaySelector } from "../components/CadeteDaySelector";
import { generateEventId } from '../lib/utils';
import { track } from '../lib/meta';

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice } = useCart();
  const { loading: settingsLoading } = useSettings();
  const subtotal = getTotalPrice();

  const [formData, setFormData] = useState({
    email: "",
    postalCode: "",
    firstName: "",
    lastName: "",
    phone: "",
    streetName: "",
    streetNumber: "",
    apartment: "",
    neighborhood: "",
    city: "Rosario",
    province: "Santa Fe",
    docNumber: "",
    description: "",
  });

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [selectedCadeteDay, setSelectedCadeteDay] = useState<{ value: string, label: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("mercado-pago");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRosario, setIsRosario] = useState(false);

  // Precio Total (Siempre es igual al subtotal porque envío es 0)
  const total = subtotal + (selectedShipping?.cost || 0);
  const totalWithDiscount = total * 0.9;

  useEffect(() => {
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
  }, []); // Run only once to track the initiation

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
    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && emailRegex.test(email) && cartItems.length > 0) {
      try {
        await fetch('/api/carts/capture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            cartItems: cartItems,
          }),
        });
        // This is a "fire and forget" request, no need to handle response
      } catch (error) {
        console.error('Error capturing abandoned cart:', error);
      }
    }
  };

  // Auto-cálculo de envío cuando cambia el CP
  const handleCalculateShipping = useCallback(async () => {
    if (formData.postalCode.length < 4 || settingsLoading) return;

    try {
      // Si es Rosario, asumimos Cadete por defecto para simplificar, o mostramos ambos
      if (formData.postalCode === '2000' || formData.postalCode.startsWith('2000')) {
         setIsRosario(true);
         setShippingOptions([]);
         setSelectedShipping({ id: 'cadete', name: 'Cadete (Solo Rosario)', cost: 0 }); // Pre-seleccionar Cadete
      } else {
        setIsRosario(false);
        const response = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postalCode: formData.postalCode }),
        });
        const data = await response.json();
        if (data.options && data.options.length > 0) {
          setShippingOptions(data.options);
          setSelectedShipping(data.options[0]); // Auto-seleccionar el primero
        }
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
      shipping: selectedShipping
        ? { id: selectedShipping.id, name: selectedShipping.name, cost: 0 }
        : { id: 'correo', name: 'Envío Gratis', cost: 0 }, // Fallback
      shippingDetails: selectedShipping?.id === 'cadete' ? selectedCadeteDay?.label : selectedShipping?.name || 'Envío Estándar',
      total: finalTotal,
      eventId, // Include the event_id for deduplication
    };

    if (paymentMethod === "mercado-pago") {
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
  const displayedTotal = paymentMethod === "mercado-pago" ? totalWithDiscount : total;

  return (
    <div className="min-h-screen bg-blanco-hueso">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 gap-y-12">
          
          {/* COLUMNA IZQUIERDA: DATOS */}
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
                <InputField name="docNumber" placeholder="DNI" value={formData.docNumber} onChange={handleChange} required />
                <InputField name="phone" placeholder="Teléfono (ej: 341...)" value={formData.phone} onChange={handleChange} required type="tel" />
                
                {/* CP dispara el cálculo automático */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField name="postalCode" placeholder="Código Postal" value={formData.postalCode} onChange={handleChange} required />
                  <InputField name="city" placeholder="Ciudad" value={formData.city} onChange={handleChange} required />
                </div>

                {/* Si hay opciones (ej: Rosario), las mostramos simplificadas */}
                {isRosario ? (
                  <div className="space-y-2">
                    <CadeteDaySelector
                      selectedDay={selectedCadeteDay}
                      onDaySelect={setSelectedCadeteDay}
                    />
                  </div>
                ) : (
                  shippingOptions.length > 0 && (
                      <div className="space-y-2">
                          {shippingOptions.map((option) => (
                               <label key={option.id} className="flex items-center p-3 border rounded-lg cursor-pointer has-[:checked]:bg-gray-100">
                                  <input type="radio" name="shipping" value={option.id} checked={selectedShipping?.id === option.id} onChange={() => setSelectedShipping(option)} className="h-4 w-4 text-black focus:ring-black"/>
                                  <span className="ml-2 text-sm font-medium">{option.name}
                                    {option.cost === 0 && <span className="ml-2 text-green-600 font-bold">GRATIS</span>}
                                  </span>
                               </label>
                          ))}
                      </div>
                  )
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <InputField name="streetName" placeholder="Calle" value={formData.streetName} onChange={handleChange} required />
                  </div>
                  <InputField name="streetNumber" placeholder="Número" value={formData.streetNumber} onChange={handleChange} required />
                </div>
                <InputField name="apartment" placeholder="Departamento (opcional)" value={formData.apartment} onChange={handleChange} />
              </fieldset>
            </form>
          </div>

          {/* COLUMNA DERECHA: RESUMEN Y PAGO */}
          <div className="lg:col-span-1 order-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-28 border border-arena">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gris-oscuro">Resumen del Pedido</h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItem key={`${item.product.id}-${item.size}`} item={item} />
                ))}

                <div className="flex justify-between items-center text-gris-oscuro border-t border-arena pt-4">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 font-bold">
                  <span>Envío</span>
                  <span>GRATIS</span>
                </div>
                
                {paymentMethod === "transferencia" && (
                  <div className="flex justify-between items-center text-green-600 text-sm">
                    <span>Descuento Transferencia (-10%)</span>
                    <span>-${(total * 0.1).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xl font-bold border-t border-arena pt-4">
                  <span className="text-gris-oscuro">Total</span>
                  {/* AQUÍ ESTABA EL ERROR DEL PUNTO, AHORA ESTÁ CORREGIDO */}
                  <span className="text-2xl text-black">${(paymentMethod === "transferencia" ? totalWithDiscount : total).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>

                <div className="border-t border-arena pt-4 mb-6">
                  <h3 className="text-lg font-bold mb-3 text-gris-oscuro">Método de Pago</h3>
                  <div className="space-y-4">
                    <PaymentOption
                      id="mercado-pago"
                      title="Mercado Pago"
                      description="Tarjetas de crédito, débito y dinero en cuenta."
                      icon={<img src="https://logowik.com/content/uploads/images/mercado-pago1721074123.logowik.com.webp" alt="MP" className="h-6" />}
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                    <PaymentOption
                      id="transferencia"
                      title="Transferencia Bancaria"
                      description="Tenés 15 minutos para enviar el comprobante."
                      icon={<Banknote />}
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                      discount="-10% OFF"
                    />
                  </div>
                </div>
              </div>

              {error && <div className="my-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm"><strong>Error:</strong> {error}</div>}

              <button onClick={handleFinalizeOrder} disabled={isLoading || !isFormComplete} className="w-full mt-2 bg-black text-white py-3 rounded-lg text-lg font-bold transition-colors hover:opacity-80 disabled:opacity-50">
                {isLoading ? "Procesando..." : "Finalizar Pedido"}
              </button>

              <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                <Lock size={16} className="mr-2" /><span>Sitio seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full p-3 border border-arena rounded-lg focus:ring-2 focus:ring-black bg-white placeholder:text-gris-oscuro/50 text-gris-oscuro" />
);

const PaymentOption = ({ id, title, description, icon, selected, onSelect, discount }: any) => (
  <div onClick={() => onSelect(id)} className={`p-4 border rounded-lg cursor-pointer flex items-center gap-4 transition-colors ${selected === id ? "border-black bg-gray-50" : "border-arena hover:bg-gray-50"}`}>
    {icon}
    <div className="flex-1">
      <p className="font-semibold">{title}</p>
      {discount && <p className="text-green-600 text-sm font-bold mb-1">{discount}</p>}
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
          <p className="text-gray-500 text-xs">Talle: {item.size}</p>
        </div>
      </div>
      <span className="font-semibold">${(item.product.price * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
    </div>
  );
};

export default CheckoutPage;