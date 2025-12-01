import React from 'react';
import { Customer } from '../../types';
import { Mail, Phone, ShoppingBag, DollarSign, User } from 'lucide-react';

interface CustomerCardProps {
    customer: Customer;
    onSelectCustomer: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onSelectCustomer }) => {
    return (
        <div 
            onClick={() => onSelectCustomer(customer)}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-300 cursor-pointer"
        >
            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                         <div className="bg-gray-100 p-3 rounded-full">
                            <User className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{customer.name}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Mail size={14} /> {customer.email}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Teléfono</span>
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                           <Phone size={14} />
                           <span>{customer.phone || 'No disponible'}</span>
                        </div>
                    </div>
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">Pedidos</span>
                        <div className="flex items-center gap-2 font-medium text-gray-700">
                           <ShoppingBag size={14} />
                           <span>{customer.order_count || 0}</span>
                        </div>
                    </div>
                    <div className="flex flex-col col-span-2">
                        <span className="text-xs text-gray-500 mb-1">Total Gastado</span>
                        <div className="flex items-center gap-2 font-semibold text-lg text-gray-800">
                           <DollarSign size={16} />
                           <span>{(customer.total_spent || 0).toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
