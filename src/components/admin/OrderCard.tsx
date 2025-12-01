import React from 'react';
import { Order } from '../../types';
import { Package, Truck, CheckCircle, XCircle, Calendar, User, Mail, DollarSign, CreditCard, Phone } from 'lucide-react';
import { StockCountdownTimer } from '../StockCountdownTimer'; // Import the new reusable component

const statusOptions = [
    { value: 'pending_payment', label: 'Pendiente de Pago', icon: Package, color: 'yellow' },
    { value: 'paid', label: 'Pagado', icon: CheckCircle, color: 'green' },
    { value: 'shipped', label: 'Enviado', icon: Truck, color: 'blue' },
    { value: 'delivered', label: 'Entregado', icon: CheckCircle, color: 'purple' },
    { value: 'cancelled', label: 'Cancelado', icon: XCircle, color: 'red' },
];

interface OrderCardProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: string) => void;
    onSelectOrder: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange, onSelectOrder }) => {
    const currentStatus = statusOptions.find(s => s.value === order.status) || statusOptions[0];
    const StatusIcon = currentStatus.icon;

    const isPendingTransfer = order.paymentMethod === 'transferencia' && order.status === 'pending_payment';

    const getPaymentMethodName = (method: string) => {
        if (method === 'mercado-pago') return 'Mercado Pago';
        if (method === 'transferencia') return 'Transferencia Bancaria';
        return 'No especificado';
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
            <div className={`p-4 border-l-4 border-${currentStatus.color}-500`}>
                <div className="flex justify-between items-start">
                    <button 
                        onClick={() => onSelectOrder(order)} 
                        className="text-lg font-bold text-blue-600 hover:underline"
                    >
                        Pedido #{order.id.substring(0, 8)}...
                    </button>
                    <div className={`flex items-center text-sm font-semibold py-1 px-3 rounded-full bg-${currentStatus.color}-100 text-${currentStatus.color}-800`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {currentStatus.label}
                    </div>
                </div>
                
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-800">{order.customerName}</span>
                    </div>
                     <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Teléfono: {order.customerPhone}</span>
                    </div>
                    <div className="flex items-center sm:col-span-2">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{order.customerEmail}</span>
                    </div>
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                     <div className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="capitalize">{getPaymentMethodName(order.paymentMethod)}</span>
                    </div>
                    <div className="flex items-center sm:col-span-2">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-semibold text-xl text-gray-900">${order.total.toLocaleString('es-AR')}</span>
                    </div>
                </div>

                {isPendingTransfer && (
                  <StockCountdownTimer 
                    createdAt={order.createdAt} 
                    orderId={order.id} 
                    onOrderCancel={() => onStatusChange(order.id, 'cancelled')} 
                  />
                )}

                <div className="mt-4">
                    <label htmlFor={`status-${order.id}`} className="sr-only">Cambiar estado</label>
                    <select
                        id={`status-${order.id}`}
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value)}
                        className={`w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-${currentStatus.color}-400 bg-gray-50`}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
