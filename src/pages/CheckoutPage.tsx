import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, CreditCard, Banknote } from "lucide-react";
import { useCart } from "../hooks/useCart";
import { CartItem as CartItemType } from "../../server/types";

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice } = useCart();
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
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("mercado-pago");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = subtotal + (selectedShipping?.cost || 0);
  const totalWithDiscount = total * 0.9;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/tienda");
    }
  }, [cartItems, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalculateShipping = useCallback(async () => {
    if (formData.postalCode.length < 4) return;
    setIsCalculatingShipping(true);
    setShippingOptions([]);
    setSelectedShipping(null);
    setError(null);
    try {
      const response = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: formData.postalCode }),
      });
      const data = await response.json();
      if (data.options && data.options.length > 0) {
        setShippingOptions(data.options);
        const cheapest = data.options.reduce((prev: any, current: any) =>
          prev.cost < current.cost ? prev : current
        );
        setSelectedShipping(cheapest);
      } else {
        setError(
          "No se encontraron opciones de envío para este código postal."
        );
      }
    } catch (error) {
      console.error("Error al calcular envío:", error);
      setError("No se pudo calcular el envío. Intenta de nuevo.");
    } finally {
      setIsCalculatingShipping(false);
    }
  }, [formData.postalCode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.postalCode.length >= 4) {
        handleCalculateShipping();
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [formData.postalCode, handleCalculateShipping]);

  const handleFinalizeOrder = async () => {
    setIsLoading(true);
    setError(null);

    const finalTotal =
      paymentMethod === "mercado-pago" ? totalWithDiscount : total;

    if (paymentMethod === "mercado-pago") {
      try {
        const response = await fetch("/api/payments/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems,
            shippingCost: selectedShipping?.cost || 0,
            shippingInfo: formData,
          }),
        });
        if (!response.ok)
          throw new Error("Error al crear la preferencia de pago.");
        const data = await response.json();
        if (data.init_point) {
          window.location.href = data.init_point; // Redirección inmediata
        } else {
          throw new Error("No se recibió la URL de pago.");
        }
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false); // Asegurarse de detener la carga en caso de error
      }
    } else if (paymentMethod === "mercado-pago") {
      try {
        const response = await fetch("/api/payments/create-transfer-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems,
            shippingInfo: formData,
            shipping: selectedShipping
              ? {
                  id: selectedShipping.id,
                  name: selectedShipping.name,
                  cost: selectedShipping.cost,
                }
              : null,
            total: finalTotal,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Error del servidor: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        const orderData = await response.json();

        navigate(`/pedido-pendiente/${orderData.id}`, {
          state: { order: orderData.order },
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormComplete =
    formData.email &&
    formData.firstName &&
    formData.lastName &&
    formData.streetName &&
    formData.streetNumber &&
    formData.phone &&
    selectedShipping;
  const displayedTotal =
    paymentMethod === "mercado-pago" ? totalWithDiscount : total;

  return (
    <div className="min-h-screen bg-blanco-hueso">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-16 gap-y-12">
          <div className="lg:pr-8 order-1 lg:order-1">
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <fieldset>
                <legend className="text-xl font-bold mb-4 text-gris-oscuro">
                  1. DATOS DE CONTACTO
                </legend>
                <InputField
                  name="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  type="email"
                />
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-xl font-bold mb-4 text-gris-oscuro">
                  2. DATOS DE ENVÍO
                </legend>
                <p className="text-sm text-gray-600 -mt-2 mb-4">Envíamos desde Rosario en 24–48h.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    name="firstName"
                    placeholder="Nombre"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                  <InputField
                    name="lastName"
                    placeholder="Apellido"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <InputField
                  name="phone"
                  placeholder="Teléfono (ej: 3411234567)"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  type="tel"
                />
                <InputField
                  name="postalCode"
                  placeholder="Código Postal"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                />

                {shippingOptions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer has-[:checked]:bg-arena/30 has-[:checked]:border-black"
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shippingOption"
                            value={option.id}
                            checked={selectedShipping?.id === option.id}
                            onChange={() => setSelectedShipping(option)}
                            className="h-4 w-4 text-black focus:ring-black"
                          />
                          <span className="ml-3 text-sm text-gris-oscuro">
                            {option.name}
                          </span>
                        </div>
                        <span className="font-medium text-sm">
                          ${option.cost.toLocaleString("es-AR").replace(/\./g, '')}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <InputField
                      name="streetName"
                      placeholder="Calle"
                      value={formData.streetName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <InputField
                    name="streetNumber"
                    placeholder="Número"
                    value={formData.streetNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <InputField
                  name="apartment"
                  placeholder="Departamento (opcional)"
                  value={formData.apartment}
                  onChange={handleChange}
                />
                <InputField
                  name="city"
                  placeholder="Ciudad"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </fieldset>
            </form>
          </div>

          <div className="lg:col-span-1 order-2 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-28 border border-arena">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4 text-gris-oscuro">
                Resumen del Pedido
              </h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItem
                    key={`${item.product.id}-${item.size}`}
                    item={item}
                  />
                ))}

                <div className="flex justify-between items-center text-gris-oscuro border-t border-arena pt-4">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    ${subtotal.toLocaleString("es-AR").replace(/\./g, '')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gris-oscuro">
                  <span>Envío</span>
                  <span className="font-medium">
                    {selectedShipping
                      ? `$${selectedShipping.cost.toLocaleString("es-AR").replace(/\./g, '')}`
                      : "A calcular"}
                  </span>
                </div>

                {paymentMethod === "mercado-pago" && selectedShipping && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Descuento MP (-10%)</span>
                    <span className="font-medium">
                      - ${(total * 0.1).toLocaleString("es-AR").replace(/\./g, '')}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xl font-bold border-t border-arena pt-4">
                  <span className="text-gris-oscuro">Total</span>
                  <span className="text-2xl text-black">
                    ${displayedTotal.toLocaleString("es-AR").replace(/\./g, '')}
                  </span>
                </div>

                <div className="border-t border-arena pt-4 mb-6"> {/* Separator before payment method */}
                  <h3 className="text-lg font-bold mb-3 text-gris-oscuro">Método de Pago</h3>
                  <div className="space-y-4">
                    <PaymentOption
                      id="mercado-pago"
                      title="Mercado Pago"
                      description="Tarjetas de crédito, débito y dinero en cuenta."
                      icon={<img src="https://logowik.com/content/uploads/images/mercado-pago1721074123.logowik.com.webp" alt="Mercado Pago" className="h-8 rounded-md" />}
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                      discount="-10% OFF"
                    />
                    <PaymentOption
                      id="transferencia"
                      title="Transferencia Bancaria"
                      description="Importante: tenés 20 min. para enviar el comprobante."
                      icon={<Banknote />}
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="my-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <button
                onClick={handleFinalizeOrder}
                disabled={isLoading || !isFormComplete}
                className="w-full mt-2 bg-black text-white py-3 rounded-lg text-lg font-bold transition-colors hover:opacity-80 disabled:opacity-50"
              >
                {isLoading
                  ? "Procesando..."
                  : paymentMethod === "mercado-pago"
                  ? "Ir a Pagar"
                  : "Finalizar Pedido"}
              </button>

              <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
                <Lock size={16} className="mr-2" />
                <span>Sitio seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full p-3 border border-arena rounded-lg focus:ring-2 focus:ring-black bg-white placeholder:text-gris-oscuro/50 text-gris-oscuro"
  />
);

const PaymentOption = ({
  id,
  title,
  description,
  icon,
  selected,
  onSelect,
  discount,
}: any) => (
  <div
    onClick={() => onSelect(id)}
    className={`p-4 border rounded-lg cursor-pointer flex items-center gap-4 transition-colors ${
      selected === id
        ? "border-black bg-arena/30"
        : "border-arena hover:bg-arena/20"
    }`}
  >
    {icon}
    <div className="flex-1">
      <p className="font-semibold">
        {title}{" "}
        {discount && (
          <span className="text-green-600 font-bold">{discount}</span>
        )}
      </p>
      <p className="text-sm text-gris-oscuro/70">{description}</p>
    </div>
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        selected === id ? "border-black" : "border-gris-oscuro/50"
      }`}
    >
      {selected === id && (
        <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
      )}
    </div>
  </div>
);

const CartItem = ({ item }: { item: CartItemType }) => {
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
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={getCorrectImageUrl(item.product.images[0])}
            className="w-16 h-16 rounded object-cover"
            alt={item.product.name}
          />
          <span className="absolute -top-2 -right-2 bg-gris-oscuro text-blanco-hueso text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {item.quantity}
          </span>
        </div>
        <div>
          <span className="text-gris-oscuro font-medium">
            {item.product.name}
          </span>
          <p className="text-gris-oscuro/70">Talle: {item.size}</p>
        </div>
      </div>
      <span className="font-semibold text-gris-oscuro">
        ${(item.product.price * item.quantity).toLocaleString("es-AR").replace(/\./g, '')}
      </span>
    </div>
  );
};

export default CheckoutPage;
