import React from 'react';
import { Order } from '../../types';
import { X, Calendar, DollarSign, Package, User, MapPin, Truck, ShoppingCart, Tag } from 'lucide-react';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  const statusColors: { [key: string]: string } = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    shipped: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
  };

  // --- DICCIONARIO DE TRADUCCIÓN ---
  const statusTranslations: { [key: string]: string } = {
    pending: 'Pendiente',
    paid: 'Pagado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    pending_payment: 'Pendiente de Pago',
  };

  const fullAddress = [
    order.shippingStreetName,
    order.shippingStreetNumber,
    order.shippingApartment,
  ].filter(Boolean).join(', ');

  const subtotal = order.items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discount = subtotal + (order.shippingCost || 0) - order.total;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6">Detalles del Pedido #{order.id}</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2"><User size={18} /> Cliente</div>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-gray-500">{order.customerEmail}</p>
              <p className="text-sm text-gray-500">{order.customerPhone}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-2"><Calendar size={18} /> Fecha y Hora</div>
              <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('es-AR')}</p>
              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2"><MapPin size={18} /> Dirección de Envío</div>
            <p className="font-medium">{fullAddress}</p>
            <p className="text-sm text-gray-500">
              {order.shippingCity} ({order.shippingPostalCode})
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">Productos</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border rounded-lg p-4 bg-gray-50">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <img src={getCorrectImageUrl(item.product.images[0])} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Talle: {item.size} &middot; Cantidad: {item.quantity}</p>
                  </div>
                  <span className="font-semibold">${(item.product.price * item.quantity).toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h3 className="font-bold text-lg mb-2">Resumen de Pago</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center gap-2"><ShoppingCart size={16}/> Productos (Subtotal)</span>
              <span className="font-medium">${subtotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 flex items-center gap-2"><Truck size={16}/> Envío ({order.shippingName || 'No especificado'})</span>
              <span className="font-medium">${(order.shippingCost || 0).toLocaleString('es-AR')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span className="flex items-center gap-2"><Tag size={16}/> Descuento</span>
                <span className="font-medium">-${discount.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-bold border-t pt-3 mt-2">
              <span>Total</span>
              <span>${order.total.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2"><Package size={18} /> Estado del Pedido</div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full capitalize ${statusColors[order.status]}`}>
              {statusTranslations[order.status] || order.status}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
