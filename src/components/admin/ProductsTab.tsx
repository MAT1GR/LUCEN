import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ProductForm } from './ProductForm';

export const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products/all');
      if (!res.ok) throw new Error('Failed to fetch');
      setProducts(await res.json());
    } catch (err) {
      console.error(err);
      alert('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProduct = async (data: FormData) => {
    setIsSaving(true);
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

    try {
      const response = await fetch(url, {
        method,
        body: data,
      });

      if (!response.ok) throw new Error('Error al guardar el producto');
      
      await fetchProducts();
      handleCloseForm();
      alert(`Producto ${editingProduct ? 'actualizado' : 'creado'} con éxito.`);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');
      
      await fetchProducts();
      alert('Producto eliminado con éxito.');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al eliminar el producto.');
    }
  };

  const handleOpenForm = (product: Product | null = null) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button onClick={() => handleOpenForm()} className="bg-[#D8A7B1] hover:bg-[#c69ba5] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left font-medium text-sm text-gray-600">Producto</th>
              <th className="p-4 text-left font-medium text-sm text-gray-600">Precio</th>
              <th className="p-4 text-left font-medium text-sm text-gray-600">Stock</th>
              <th className="p-4 text-left font-medium text-sm text-gray-600">Status</th>
              <th className="p-4 text-left font-medium text-sm text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Cargando...</td></tr>
            ) : products.map((product) => {
              const totalStock = Object.values(product.sizes).reduce((acc, size) => acc + (size.stock || 0), 0);
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4 flex items-center gap-3">
                    <img src={getCorrectImageUrl(product.images[0])} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    <span className="font-medium text-gray-800">{product.name}</span>
                  </td>
                  <td className="p-4 text-gray-700">${product.price.toLocaleString('es-AR')}</td>
                  <td className="p-4 text-gray-700">{totalStock} unidades</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      {product.isNew && (
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100 w-fit">
                          Last Drop
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-100 w-fit">
                          Más Vendido
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenForm(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProductForm 
          product={editingProduct}
          onClose={handleCloseForm}
          onSave={handleSaveProduct}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
