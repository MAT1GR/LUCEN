import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import { DashboardTab } from '../components/admin/DashboardTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import SubscribersTab from '../components/admin/SubscribersTab'; // Import new tab
import { 
<<<<<<< HEAD
  BarChart3, Package, Tag, ShoppingCart, Users, Settings, LogOut, Mail // Import Mail icon
=======
  BarChart3, Package, ShoppingCart, Users, Settings, LogOut 
>>>>>>> cafede2b106befa8c646dad7d360d62d909ba4a3
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, component: <DashboardTab /> },
    { id: 'products', label: 'Productos', icon: Package, component: <ProductsTab /> },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart, component: <OrdersTab /> },
    { id: 'customers', label: 'Clientes', icon: Users, component: <CustomersTab /> },
    { id: 'subscribers', label: 'Suscriptores', icon: Mail, component: <SubscribersTab /> },
    { id: 'settings', label: 'Configuración', icon: Settings, component: <SettingsTab /> }
  ];

  const activeComponent = tabs.find(tab => tab.id === activeTab)?.component;


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600">Bienvenido, {user?.username}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center gap-2 transition-colors">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-2 space-y-1 sticky top-8">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors text-sm font-medium ${
                    activeTab === id ? 'bg-[#D8A7B1] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} /> {label}
                </button>
              ))}
            </div>
          </nav>
          <main className="flex-1">
            {activeComponent}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;