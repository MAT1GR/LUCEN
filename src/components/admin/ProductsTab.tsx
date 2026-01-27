import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { ProductForm } from './ProductForm';

// --- COMPONENTE TARJETA EDITABLE ---
const EditableProductCard = ({ product, onEdit, onDelete, onToggleActive }: any) => {
  
  const totalStock = product.stock || 0;
  const imageUrl = (product.images && product.images.length > 0) ? (product.images[0].startsWith('/uploads/') ? `/api${product.images[0]}` : product.images[0]) : 'https://via.placeholder.com/400x500';

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden relative group">
      
      {/* IMAGEN Y CONTENIDO */}
      <div className="relative">
        <img src={imageUrl} alt={product.name} className={`w-full h-48 object-contain ${!product.isActive ? 'grayscale' : ''}`} />
        
        {/* BOTONES DE ACCIÓN */}
        <div className="absolute top-2 right-2 flex flex-col gap-2">
           <button onClick={() => onToggleActive(product)} className="p-1.5 bg-white/90 shadow rounded-full text-gray-700 hover:text-black">
            {product.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button onClick={() => onEdit(product)} className="p-1.5 bg-white/90 shadow rounded-full text-blue-600 hover:bg-blue-50">
            <Edit size={14} />
          </button>
          <button onClick={() => onDelete(product.id)} className="p-1.5 bg-white/90 shadow rounded-full text-red-600 hover:bg-red-50">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-gray-800 truncate text-sm">{product.name}</h3>
        <div className="flex justify-between items-center mt-2">
          <p className="text-gray-700 font-semibold text-sm">${product.price.toLocaleString('es-AR')}</p>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${totalStock > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {totalStock > 0 ? `${totalStock} u.` : 'AGOTADO'}
          </span>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
export const ProductsTab: React.FC = () => {
  const [activeProducts, setActiveProducts] = useState<Product[]>([]); // Tienen Stock
  const [soldProducts, setSoldProducts] = useState<Product[]>([]);     // Agotados
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products/all', { headers });
      
      if (res.status === 401) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_user');
        window.location.reload();
        return;
      }

      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log('[ProductsTab] API Response data:', data);

      const inStock: Product[] = [];
      const outOfStock: Product[] = [];
      
      console.log('Fetched products:', data); // Debug log

      for (const p of data) {
        // Robust check for isActive
        const isActive = p.isActive === true || p.isActive === 1 || String(p.isActive) === 'true';
        
        if (isActive) {
            inStock.push(p);
        } else {
            outOfStock.push(p);
        }
      }

      // Sort by creation date or another relevant field, since sort_order is removed
      inStock.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      outOfStock.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActiveProducts(inStock);
      setSoldProducts(outOfStock);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar productos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenForm = (p: Product | null = null) => {
    setEditingProduct(p);
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (data: FormData) => {
    setIsSaving(true);
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        method,
        headers,
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
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`/api/products/${productId}`, { 
        method: 'DELETE',
        headers
      });
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
       const token = localStorage.getItem('auth_token');
       const headers: HeadersInit = {};
       if (token) headers['Authorization'] = `Bearer ${token}`;

       const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers,
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Stock</h2>
        <button onClick={() => handleOpenForm()} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          Error: {error}
        </div>
      )}

      {isLoading ? <div>Cargando...</div> : (
        <>
          {/* SECCIÓN ACTIVA */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                  🟢 En Vidriera
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {activeProducts.map((product) => (
                <EditableProductCard 
                  key={product.id} 
                  product={product}
                  onEdit={handleOpenForm}
                  onDelete={handleDeleteProduct}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>

            {activeProducts.length === 0 && <p className="text-gray-400 italic">No hay productos activos.</p>}
          </div>

          {/* SECCIÓN ARCHIVADOS */}
          <div className="pt-8 border-t border-gray-200 opacity-75">
            <h3 className="text-lg font-bold mb-4 text-gray-500 flex items-center gap-2">
                🔴 Archivados 
                <span className="text-xs font-normal text-gray-400">Productos desactivados manualmente</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 grayscale">
              {soldProducts.map((product) => (
                <EditableProductCard 
                  key={product.id} 
                  product={product}
                  onEdit={handleOpenForm}
                  onDelete={handleDeleteProduct}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
            {soldProducts.length === 0 && <p className="text-gray-400 italic">No hay productos archivados.</p>}
          </div>
        </>
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