import React, { useState, FormEvent } from 'react';
import { Category } from '../../server/types';

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
  onSave: (data: Omit<Category, 'id'>) => void;
  isSaving: boolean;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image: category?.image || '',
    sort_order: category?.sort_order || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'sort_order' ? Number(value) : value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-6">{category ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" className="w-full p-2 border rounded" required />
          <input name="slug" value={formData.slug} onChange={handleChange} placeholder="Slug (ej: mom-jeans)" className="w-full p-2 border rounded" />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descripción (opcional)" className="w-full p-2 border rounded" />
          <input name="image" value={formData.image} onChange={handleChange} placeholder="URL de imagen (opcional)" className="w-full p-2 border rounded" />
          <input name="sort_order" type="number" value={formData.sort_order} onChange={handleChange} placeholder="Orden" className="w-full p-2 border rounded" />
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 border rounded hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 bg-[#D8A7B1] text-white rounded hover:bg-[#c69ba5] disabled:opacity-50">
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};