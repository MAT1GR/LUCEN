import React, { useState, useEffect } from 'react';
import { Category } from '../../../server/types';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { CategoryForm } from './CategoryForm';

export const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      setCategories(await res.json());
    } catch (err) { alert('Error al cargar categorías'); } 
    finally { setIsLoading(false); }
  };

  const handleSave = async (data: Omit<Category, 'id'>) => {
    setIsSaving(true);
    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('Error al guardar');
      await fetchCategories();
      handleCloseForm();
      alert('Categoría guardada.');
    } catch (err) { alert('Error al guardar categoría.'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      await fetchCategories();
      alert('Categoría eliminada.');
    } catch (err) { alert('Error al eliminar.'); }
  };
  
  const handleOpenForm = (category: Category | null = null) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Categorías</h2>
        <button onClick={() => handleOpenForm()} className="bg-[#D8A7B1] hover:bg-[#c69ba5] text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Nueva Categoría
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left font-medium">Nombre</th>
              <th className="p-4 text-left font-medium">Slug</th>
              <th className="p-4 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={3} className="p-8 text-center">Cargando...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id}>
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4 text-gray-600">{cat.slug}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenForm(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <CategoryForm category={editingCategory} onClose={handleCloseForm} onSave={handleSave} isSaving={isSaving} />}
    </div>
  );
};