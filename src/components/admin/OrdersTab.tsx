import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '../../types';
import { Package, Truck, CheckCircle, XCircle, Search } from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';
import { OrderCard } from './OrderCard'; // Import the new OrderCard component
import { useDebounce } from '../../hooks/useDebounce';

const statusOptions = [
    { value: 'pending_payment', label: 'Pendiente de Pago', icon: Package, color: 'yellow' },
    { value: 'paid', label: 'Pagado', icon: CheckCircle, color: 'green' },
    { value: 'shipped', label: 'Enviado', icon: Truck, color: 'blue' },
    { value: 'delivered', label: 'Entregado', icon: CheckCircle, color: 'purple' },
    { value: 'cancelled', label: 'Cancelado', icon: XCircle, color: 'red' },
];

export const OrdersTab: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0); // New state for total orders

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            const params = new URLSearchParams();
            params.append('page', String(currentPage));
            if (debouncedSearchTerm) params.append('searchTerm', debouncedSearchTerm);
            if (statusFilter) params.append('status', statusFilter);

            try {
                const res = await fetch(`/api/orders?${params.toString()}`);
                const data = await res.json();
                setOrders(data.orders || []);
                setTotalPages(data.totalPages || 1);
                setCurrentPage(data.currentPage || 1);
                setTotalOrders(data.totalOrders || 0);
            } catch (err) {
                console.error(err);
                alert('Error al cargar los pedidos.');
                setOrders([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [currentPage, debouncedSearchTerm, statusFilter]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error('Error al actualizar estado');
            
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
            // No alert needed for a smoother experience
        } catch (err) {
            console.error(err);
            alert('Error al actualizar el estado del pedido.');
        }
    };
    
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Pedidos</h2>
            <p className="text-gray-500 mb-6">Gestiona y revisa todos los pedidos de tus clientes.</p>

            {/* Filter and Search Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, cliente o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full p-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todos los estados</option>
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div className="text-center p-8 text-gray-500">Cargando pedidos...</div>
            ) : orders.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800">No se encontraron pedidos</h3>
                    <p className="text-gray-500 mt-1">Intenta ajustar los filtros de búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            onStatusChange={handleStatusChange}
                            onSelectOrder={setSelectedOrder}
                        />
                    ))}
                </div>
            )}
            
            {/* Pagination Controls */}
            {totalOrders > 15 && (
                <div className="flex justify-between items-center mt-8">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </div>
    );
};