import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Truck, Mail, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '../hooks/useCart.tsx';
import { Order, CartItem } from '../../server/types/index.js';
import { track } from '../lib/meta';

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
        <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
        </div>
    </div>
);

const PaymentSuccessPage: React.FC = () => {
    const { clearCart } = useCart();
    const location = useLocation();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        clearCart();
        const queryParams = new URLSearchParams(location.search);
        const orderId = queryParams.get('orderId');

        // *** CORRECCIÓN CLAVE: Usamos AbortController para limpiar el fetch anterior ***
        const controller = new AbortController();
        const signal = controller.signal;

        if (orderId && !order) { // Solo si tenemos ID y la orden AÚN NO HA SIDO CARGADA
            const fetchOrder = async () => {
                setLoading(true);
                setError(null);
                try {
                    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
                    const fetchUrl = `${apiBaseUrl}/api/orders/${orderId}`;

                    const response = await fetch(fetchUrl, { signal });
                    
                    if (!response.ok) {
                        throw new Error(`No pudimos cargar los detalles de tu pedido. Código: ${response.status}`);
                    }
                    const data: Order = await response.json();
                    setOrder(data);
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error("Error fetching order:", err);
                        setError(err.message || 'Error de conexión. Intenta recargar.');
                    }
                } finally {
                    setLoading(false);
                }
            };
            fetchOrder();
        } else if (!orderId) {
            setError('No se encontró un número de pedido válido.');
            setLoading(false);
        } else if (order) {
            setLoading(false); // Si ya se cargó, simplemente desactivamos el loading.
        }

        // Función de limpieza: Se ejecuta si el componente se desmonta o el efecto se re-ejecuta
        return () => {
            controller.abort();
        };

    }, [clearCart, location.search, order]); // Añadido 'order' a dependencias para manejar el flujo

    useEffect(() => {
        if (order) {
            track('Purchase', {
                value: order.total,
                currency: 'ARS',
                num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
                content_ids: order.items.map(item => item.product.id),
                contents: order.items.map(item => ({
                    id: item.product.id,
                    quantity: item.quantity,
                    item_price: item.product.price
                })),
                content_type: 'product',
                order_id: order.id,
            });
        }
    }, [order]);

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '';
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
        let finalPath = imagePath;
        if (finalPath.startsWith('/uploads/')) {
            finalPath = `/api${finalPath}`;
        }
        return `${apiBaseUrl}${finalPath}`;
    }

    const getEstimatedDeliveryDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    };

    const renderContent = () => {
        if (loading) {
            return <SkeletonLoader />;
        }

        if (error || !order) {
            return (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Hubo un problema</h2>
                    <p className="text-gris-oscuro mb-6">{error || 'No se pudo cargar la información del pedido.'}</p>
                    <p className="text-sm text-gray-500">Si el pago fue debitado, por favor contactate con nosotros y proporciona el ID de la transacción de Mercado Pago.</p>
                    <Link
                        to="/contacto" // Assuming a contact page exists
                        className="mt-6 inline-block bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Contactar a Soporte
                    </Link>
                </div>
            );
        }

        const { id: orderId, items, shippingCost = 0, total } = order;

        return (
            <>
                <div className="flex flex-col items-center text-center">
                    <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
                    <h1 className="text-3xl font-bold text-gris-oscuro mb-2">¡Gracias por tu compra, {order.customerName.split(' ')[0]}!</h1>
                    <p className="text-gray-600 max-w-md">
                        Tu pedido fue recibido y ya lo estamos preparando con mucho cuidado.
                    </p>
                </div>

                <div className="mt-10 text-center">
                    <h3 className="text-lg font-semibold text-gris-oscuro mb-4">¿Qué sigue ahora?</h3>
                    <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm">
                        <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-arena"/><span>Recibirás un email de confirmación.</span></div>
                        <div className="flex items-center gap-3"><Package className="w-5 h-5 text-arena"/><span>Preparamos y despachamos tu pedido.</span></div>
                        <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-arena"/><span>Te notificamos con el n° de seguimiento.</span></div>
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-200 pt-8">
                    <h2 className="text-xl font-bold text-gris-oscuro mb-4">Resumen del pedido #{orderId.substring(0, 8)}</h2>
                    <div className="space-y-4 mb-4">
                        {items?.map((item: CartItem) => (
                            <div key={`${item.product.id}-${item.size}`} className="flex items-center gap-4">
                                <img src={getImageUrl(item.product.images[0])} alt={item.product.name} className="w-16 h-16 object-cover rounded-md" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">{item.product.name}</p>
                                    <p className="text-sm text-gray-500">Talle: {item.size}, Cantidad: {item.quantity}</p>
                                </div>
                                <span className="font-semibold text-gray-900">${(item.product.price * item.quantity).toLocaleString('es-AR')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 border-t pt-4">
                        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${(total - shippingCost).toLocaleString('es-AR')}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Costo de Envío</span><span>${shippingCost.toLocaleString('es-AR')}</span></div>
                        <div className="flex justify-between text-lg font-bold text-gray-900 border-t mt-4 pt-4"><span>Total</span><span className="text-arena">${total.toLocaleString('es-AR')}</span></div>
                    </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8 text-center">
                    <div className="inline-flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-lg">
                        <Truck size={24} />
                        <div>
                            <p className="font-semibold">Entrega estimada</p>
                            <p className="text-sm">Antes del <strong className="font-bold">{getEstimatedDeliveryDate()}</strong>.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <Link
                        to="/tienda"
                        className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-bold transition-colors"
                    >
                        <ShoppingCart size={20} />
                        Seguir Comprando
                    </Link>
                </div>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-blanco-hueso py-12 sm:py-16">
            <div className="container mx-auto max-w-2xl px-4">
                <div className="bg-white p-6 sm:p-10 rounded-lg shadow-sm border border-gray-200">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;