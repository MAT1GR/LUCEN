import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Package, Users, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Order, Customer } from '../../types';

interface Stats {
  productCount: number;
  orderCount: number;
  customerCount: number;
  totalRevenue: number;
  recentOrders: Order[];
  recentCustomers: Customer[];
  orderStatusCounts: { [key: string]: number };
}

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
}

const StatCard = ({ icon: Icon, title, value, color }: StatCardProps) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border flex items-center gap-4">
        <div className={`bg-${color}-100 p-3 rounded-full`}>
            <Icon className={`text-${color}-600`} size={24} />
        </div>
        <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const statusDetails: { [key: string]: { icon: React.ElementType, label: string, color: string } } = {
    pending: { icon: Clock, label: 'Pendientes', color: 'yellow' },
    paid: { icon: CheckCircle, label: 'Pagadas', color: 'green' },
    shipped: { icon: Truck, label: 'Enviadas', color: 'blue' },
    delivered: { icon: CheckCircle, label: 'Entregadas', color: 'purple' },
    cancelled: { icon: XCircle, label: 'Canceladas', color: 'red' },
};

const OrderStatusSummary: React.FC<{ counts: { [key: string]: number } }> = ({ counts }) => (
    <div className="mt-8">
        <h3 className="font-bold text-lg mb-4">Estado de los Pedidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(statusDetails).map(([status, { icon: Icon, label, color }]) => (
                <div key={status} className="bg-white p-4 rounded-lg shadow-sm border flex flex-col items-center justify-center">
                    <Icon className={`text-${color}-500 mb-2`} size={28} />
                    <p className="text-2xl font-bold text-gray-900">{counts[status] || 0}</p>
                    <p className="text-sm text-gray-600">{label}</p>
                </div>
            ))}
        </div>
    </div>
);


const RecentActivity: React.FC<{ orders: Order[], customers: Customer[] }> = ({ orders, customers }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-bold text-lg mb-4">Últimos Pedidos</h3>
            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium text-gray-800">{order.customerName}</p>
                            <p className="text-gray-500">{order.items.length} producto(s)</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-900">${order.total.toLocaleString('es-AR')}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                                order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>{order.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-bold text-lg mb-4">Nuevos Clientes</h3>
            <div className="space-y-4">
                {customers.map(customer => (
                    <div key={customer.id} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium text-gray-800">{customer.name}</p>
                            <p className="text-gray-500">{customer.email}</p>
                        </div>
                        <p className="text-gray-600">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('es-AR') : ''}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const DashboardTab: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/dashboard/stats');
                if (!res.ok) {
                    throw new Error(`Error: ${res.status}`);
                }
                const data = await res.json();
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return <div className="p-8">Cargando estadísticas...</div>;
    }

    if (!stats) {
        return <div className="p-8">No se pudieron cargar las estadísticas.</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={DollarSign} title="Ingresos Totales" value={`$${stats.totalRevenue.toLocaleString('es-AR')}`} color="green" />
                <StatCard icon={ShoppingCart} title="Pedidos Totales" value={stats.orderCount} color="blue" />
                <StatCard icon={Users} title="Clientes Totales" value={stats.customerCount} color="purple" />
                <StatCard icon={Package} title="Productos Activos" value={stats.productCount} color="orange" />
            </div>

            {stats.orderStatusCounts && <OrderStatusSummary counts={stats.orderStatusCounts} />}

            <RecentActivity orders={stats.recentOrders} customers={stats.recentCustomers} />
        </div>
    );
};