import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { ProductForm } from './ProductForm';

// New component for the product card in admin
const AdminProductCard: React.FC<{
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleActive: (product: Product) => void;
}> = ({ product, onEdit, onDelete, onToggleActive }) => {
  const totalStock = Object.values(product.sizes || {}).reduce((acc, size) => acc + (size.stock || 0), 0);
  const imageUrl = (product.images && product.images.length > 0 && product.images[0].startsWith('/uploads/'))
    ? `/api${product.images[0]}`
    : 'https://via.placeholder.com/400x500';

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-all duration-300 ${!product.isActive ? 'opacity-60' : ''}`}>
      <div className="relative">
        <img src={imageUrl} alt={product.name} className={`w-full h-56 object-contain ${!product.isActive ? 'grayscale' : ''}`} />
        <div className="absolute top-2 right-2 flex gap-2">
           <button onClick={() => onToggleActive(product)} className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 hover:bg-white hover:text-black transition-colors">
            {product.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button onClick={() => onEdit(product)} className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-blue-600 hover:bg-white transition-colors"><Edit size={16} /></button>
          <button onClick={() => onDelete(product.id)} className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-600 hover:bg-white transition-colors"><Trash2 size={16} /></button>
        </div>
        <div className="absolute bottom-2 left-2 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100">
              Last Drop
            </span>
          )}
          {product.isBestSeller && (
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-100">
              Más Vendido
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="text-gray-700 font-semibold">${product.price.toLocaleString('es-AR')}</p>
          <p className={`text-sm font-medium ${totalStock > 0 ? 'text-gray-600' : 'text-red-500'}`}>
            {totalStock} en stock
          </p>
        </div>
      </div>
    </div>
  );
};


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
      const data = await res.json();
      // Sort by active first, then by name
      data.sort((a: Product, b: Product) => {
        if (a.isActive === b.isActive) {
          return a.name.localeCompare(b.name);
        }
        return a.isActive ? -1 : 1;
      });
      setProducts(data);
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
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción es irreversible.')) return;
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

  const handleToggleActive = async (product: Product) => {
    const isActive = !product.isActive;
    if (!window.confirm(`¿Estás seguro de que quieres ${isActive ? 'activar' : 'desactivar'} este producto?`)) return;

    const formData = new FormData();
    formData.append('isActive', String(isActive));
  
    try {
       const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error('Error al actualizar el producto');
      
      await fetchProducts();
      alert(`Producto ${isActive ? 'activado' : 'desactivado'} con éxito.`);
    } catch (error) {
      console.error(error);
      alert('Hubo un error al actualizar el producto.');
    }
  }

  const handleOpenForm = (product: Product | null = null) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button onClick={() => handleOpenForm()} className="bg-[#D8A7B1] hover:bg-[#c69ba5] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <AdminProductCard 
              key={product.id}
              product={product} 
              onEdit={handleOpenForm}
              onDelete={handleDeleteProduct}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

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
