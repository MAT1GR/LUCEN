import React, { useState, useEffect, useCallback } from 'react';
import { Customer } from '../../types';
import { Search } from 'lucide-react';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { CustomerCard } from './CustomerCard';
import { useDebounce } from '../../hooks/useDebounce';

export const CustomersTab: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // State for search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchCustomers = useCallback(async (page: number, term: string) => {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('page', String(page));
        if (term) params.append('searchTerm', term);

        try {
            const res = await fetch(`/api/customers?${params.toString()}`);
            const data = await res.json();
            setCustomers(data.customers || []);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || 1);
        } catch (err) {
            console.error(err);
            alert('Error al cargar los clientes.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm, fetchCustomers]);
    
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Clientes</h2>
            <p className="text-gray-500 mb-6">Explora y gestiona la información de tus clientes.</p>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar cliente por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Customers Grid */}
            {isLoading ? (
                 <div className="text-center p-8 text-gray-500">Cargando clientes...</div>
            ) : customers.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800">No se encontraron clientes</h3>
                    <p className="text-gray-500 mt-1">Intenta ajustar la búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customers.map((customer) => (
                        <CustomerCard 
                            key={customer.id} 
                            customer={customer}
                            onSelectCustomer={setSelectedCustomer}
                        />
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
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

            {selectedCustomer && <CustomerDetailsModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
        </div>
    );
};