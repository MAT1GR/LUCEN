import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { ProductForm } from './ProductForm';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- COMPONENTE TARJETA DRAGGABLE ---
const SortableProductCard = ({ product, onEdit, onDelete, onToggleActive }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const totalStock = Object.values(product.sizes || {}).reduce((acc: any, size: any) => acc + (size.stock || 0), 0);
  const imageUrl = (product.images && product.images.length > 0) ? (product.images[0].startsWith('/uploads/') ? `/api${product.images[0]}` : product.images[0]) : 'https://via.placeholder.com/400x500';

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg shadow-sm border overflow-hidden relative group">
      
      {/* HEADER CON ORDEN Y GRIP */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-1 flex justify-between items-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-white p-1 hover:bg-white/20 rounded">
            <GripVertical size={18} />
        </div>
        <span className="text-xs font-mono text-white font-bold bg-black px-2 py-0.5 rounded">
            #{product.sort_order}
        </span>
      </div>

      {/* IMAGEN Y CONTENIDO */}
      <div className="relative">
        <img src={imageUrl} alt={product.name} className={`w-full h-48 object-contain ${!product.isActive ? 'grayscale' : ''}`} />
        
        {/* BOTONES DE ACCIÓN (Siempre visibles o al hover) */}
        <div className="absolute top-8 right-2 flex flex-col gap-2">
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
        <div className="flex justify-between items-center mt-1">
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
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Configuración de sensores para DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products/all');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      const inStock: Product[] = [];
      const outOfStock: Product[] = [];
      
      for (const p of data) {
        const totalStock = Object.values(p.sizes || {}).reduce((acc: any, s: any) => acc + (s.stock || 0), 0);
        if (totalStock > 0 && p.isActive) {
            inStock.push(p);
        } else {
            outOfStock.push(p);
        }
      }

      inStock.sort((a, b) => (a.sort_order || 9999) - (b.sort_order || 9999));
      
      outOfStock.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActiveProducts(inStock);
      setSoldProducts(outOfStock);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = activeProducts.findIndex((p) => p.id === active.id);
      const newIndex = activeProducts.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(activeProducts, oldIndex, newIndex);
      
      const updatedProducts = newOrder.map((p, index) => ({
        ...p,
        sort_order: index
      }));

      setActiveProducts(updatedProducts);

      try {
        const itemsToSend = updatedProducts.map(p => ({ id: p.id, sort_order: p.sort_order }));
        await fetch('/api/products/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToSend })
        });
      } catch (error) {
        console.error("Error guardando el orden:", error);
        alert("Error al guardar el orden");
        // Optionally revert state on error
        fetchProducts();
      }
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Stock</h2>
        <button onClick={() => handleOpenForm()} className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800">
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {isLoading ? <div>Cargando...</div> : (
        <>
          {/* SECCIÓN ACTIVA (DRAGGABLE) */}
          <div className="mb-12">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                🟢 En Vidriera (Orden Manual)
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Arrastrá para ordenar</span>
            </h3>
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activeProducts.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {activeProducts.map((product) => (
                    <SortableProductCard 
                      key={product.id} 
                      product={product}
                      onEdit={handleOpenForm}
                      onDelete={handleDeleteProduct}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {activeProducts.length === 0 && <p className="text-gray-400 italic">No hay productos activos.</p>}
          </div>

          {/* SECCIÓN VENDIDOS (ESTÁTICA AL FONDO) */}
          <div className="pt-8 border-t border-gray-200 opacity-75">
            <h3 className="text-lg font-bold mb-4 text-gray-500 flex items-center gap-2">
                🔴 Agotados / Archivados 
                <span className="text-xs font-normal text-gray-400">Se mueven acá automáticamente</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 grayscale">
                {soldProducts.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded border p-4 relative">
                        <span className="absolute top-2 right-2 bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded">VENDIDO</span>
                        <img src={product.images[0] ? `/api${product.images[0]}` : ''} className="w-full h-32 object-contain opacity-50" />
                        <p className="font-bold text-sm mt-2 text-gray-600 truncate">{product.name}</p>
                        <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={() => handleOpenForm(product)}><Edit size={14} /></button>
                            <button onClick={() => handleDeleteProduct(product.id)}><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>
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