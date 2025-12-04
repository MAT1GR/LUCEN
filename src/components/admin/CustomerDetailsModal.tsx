import React, { useState, useEffect } from 'react';
import { Customer, CustomerOrder, Order } from '../../../server/types';
import { X, Mail, Phone, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';

interface CustomerDetailsModalProps {
  customer: Customer;
  onClose: () => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({ customer, onClose }) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        const res = await fetch(`/api/customers/${customer.id}/orders`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        alert('Error al cargar los pedidos del cliente.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomerOrders();
  }, [customer.id]);

  const customerOrderToOrder = (customerOrder: CustomerOrder): Order => ({
    ...customerOrder,
    customerName: customer.name,
    customerEmail: customer.email,
    customerId: customer.id,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6">Detalles del Cliente</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2"><Mail size={18} /> Nombre</div>
                <p className="font-medium text-gray-800">{customer.name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2"><Mail size={18} /> Email</div>
                <p className="font-medium text-gray-800">{customer.email}</p>
            </div>
             <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2"><ShoppingCart size={18} /> Total Pedidos</div>
                <p className="font-medium text-gray-800">{customer.order_count || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-2"><DollarSign size={18} /> Total Gastado</div>
                <p className="font-medium text-gray-800">${(customer.total_spent || 0).toLocaleString('es-AR')}</p>
            </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-4">Historial de Pedidos</h3>
          {isLoading ? (
            <p className="text-center text-gray-500">Cargando historial...</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-500">Este cliente no tiene pedidos registrados.</p>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-x-auto border">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">ID Pedido</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Fecha</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="border-t hover:bg-gray-50">
                      <td className="p-4">
                        <button onClick={() => setSelectedOrder(customerOrderToOrder(order))} className="font-mono text-sm text-blue-500 hover:underline">#{order.id}</button>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{new Date(order.createdAt).toLocaleDateString('es-AR')}</td>
                      <td className="p-4 font-medium text-gray-800">${order.total.toLocaleString('es-AR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};