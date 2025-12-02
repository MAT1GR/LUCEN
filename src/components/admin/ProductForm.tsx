import React, { useState, FormEvent, useEffect } from 'react';
import { Product } from '../../types';
import { Plus, Trash2, UploadCloud, Image, Video, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (data: FormData) => void;
  isSaving: boolean;
}

interface SizeRow {
  size: string;
  available: boolean;
  stock: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSave, isSaving }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || 0,
    category: product?.category || '',
    description: product?.description || '',
    material: product?.material || '',
    rise: product?.rise || 'Medio',
    rise_cm: product?.rise_cm || 0,
    fit: product?.fit || '',
    waist_flat: product?.waist_flat || 0,
    length: product?.length || 0,
    isWaistStretchy: product?.isWaistStretchy || false,
    isNew: product?.isNew || false,
    isActive: product?.isActive ?? true,
  });

  const [allImages, setAllImages] = useState<(File | string)[]>(product?.images || []);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(product?.video || null);

  const initialSizes = product?.sizes 
    ? Object.entries(product.sizes).map(([size, details]) => ({ size, ...details }))
    : [{ size: '', available: true, stock: 0 }];

  const [sizeRows, setSizeRows] = useState<SizeRow[]>(initialSizes);
  
  const defaultFaq = { question: '¿Cómo debo lavarlo?', answer: 'Recomendamos lavar del revés, con agua fría y evitar el uso de secadoras para mantener la forma y el color.' };
  const [faqs, setFaqs] = useState(product?.faqs && product.faqs.length > 0 ? product.faqs : (product ? [] : [defaultFaq]));

  const getCorrectImageUrl = (path: string) => {
    if (!path) return '';
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    let processedPath = path;
    if (processedPath.startsWith('/uploads/')) {
      processedPath = `/api${processedPath}`;
    }
    return `${apiBaseUrl}${processedPath}`;
  };

  useEffect(() => {
    const urls = allImages.map(img => {
      if (typeof img === 'string') return getCorrectImageUrl(img);
      return URL.createObjectURL(img);
    });
    setPreviewUrls(urls);

    return () => {
      urls.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [allImages]);
  
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(allImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setAllImages(items);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };
  
  const handleSizeChange = (index: number, field: keyof SizeRow, value: string | number | boolean) => {
    const newSizes = [...sizeRows];
    const sizeToUpdate = { ...newSizes[index] };
    
    switch (field) {
      case 'size':
        if (typeof value === 'string') sizeToUpdate.size = value;
        break;
      case 'stock':
        if (typeof value === 'number') sizeToUpdate.stock = value;
        break;
      case 'available':
        if (typeof value === 'boolean') sizeToUpdate.available = value;
        break;
    }

    newSizes[index] = sizeToUpdate;
    setSizeRows(newSizes);
  };

  const addSizeRow = () => {
    setSizeRows([...sizeRows, { size: '', available: true, stock: 0 }]);
  };

  const removeSizeRow = (index: number) => {
    setSizeRows(sizeRows.filter((_, i) => i !== index));
  };
  
  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAllImages(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setAllImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });

    const sizesAsObject = sizeRows.reduce((acc, row) => {
      if (row.size.trim() !== '') {
        acc[row.size] = {
          available: row.available,
          stock: Number(row.stock),
        };
      }
      return acc;
    }, {} as Product['sizes']);
    data.append('sizes', JSON.stringify(sizesAsObject));
    data.append('faqs', JSON.stringify(faqs));

    const existingImagesPaths = allImages.filter(img => typeof img === 'string') as string[];
    const newImageFiles = allImages.filter(img => typeof img !== 'string') as File[];
    
    data.append('existingImages', JSON.stringify(existingImagesPaths));
    newImageFiles.forEach(file => {
      data.append('newImages', file);
    });

    if (videoFile) {
      data.append('video', videoFile);
    } else if (videoPreview) {
      data.append('existingVideoUrl', videoPreview);
    }
    
    onSave(data);
  };
  
  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b px-8 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
          Cerrar
        </button>
      </header>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda */}
            <div className="lg:col-span-2 space-y-8">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Información Esencial</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto <span className="text-red-500">*</span></label>
                    <input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Jean Mom Fit Vintage" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" required />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-red-500">*</span></label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Descripción detallada del producto." className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" rows={4} required />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Detalles y Medidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría <span className="text-red-500">*</span></label>
                    <input id="category" name="category" value={formData.category} onChange={handleChange} placeholder="Ej: Jeans" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" required />
                  </div>
                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                    <input id="material" name="material" value={formData.material} onChange={handleChange} placeholder="Ej: Denim Rígido" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                  </div>
                  <div>
                    <label htmlFor="fit" className="block text-sm font-medium text-gray-700 mb-1">Calce</label>
                    <input id="fit" name="fit" value={formData.fit} onChange={handleChange} placeholder="Ej: Mom Fit" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">Alto (cm)</label>
                    <input id="length" name="length" type="number" value={formData.length} onChange={handleChange} placeholder="105" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="waist_flat" className="block text-sm font-medium text-gray-700 mb-1">Cintura (cm)</label>
                    <input id="waist_flat" name="waist_flat" type="number" value={formData.waist_flat} onChange={handleChange} placeholder="38" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                    <label className="flex items-center text-sm text-gray-600 mt-2">
                      <input type="checkbox" name="isWaistStretchy" checked={formData.isWaistStretchy} onChange={handleChange} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"/>
                      <span className="ml-2">Elastizado</span>
                    </label>
                  </div>
                  <div>
                    <label htmlFor="rise" className="block text-sm font-medium text-gray-700 mb-1">Tiro</label>
                    <select id="rise" name="rise" value={formData.rise} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black">
                      <option value="Bajo">Bajo</option>
                      <option value="Medio">Medio</option>
                      <option value="Alto">Alto</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rise_cm" className="block text-sm font-medium text-gray-700 mb-1">Tiro (cm)</label>
                    <input id="rise_cm" name="rise_cm" type="number" value={formData.rise_cm} onChange={handleChange} placeholder="30" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Precio y Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio <span className="text-red-500">*</span></label>
                      <input id="price" name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Ej: 8500" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" required />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Tallas Disponibles</h4>
                        {sizeRows.map((row, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-5">
                                <label className="sr-only">Talle</label>
                                <input value={row.size} onChange={(e) => handleSizeChange(index, 'size', e.target.value)} placeholder="Talle (40)" className="w-full p-2 border border-gray-300 rounded-md text-sm"/>
                              </div>
                              <div className="col-span-4">
                                <label className="sr-only">Stock</label>
                                <input value={row.stock} type="number" onChange={(e) => handleSizeChange(index, 'stock', Number(e.target.value))} placeholder="Stock" className="w-full p-2 border border-gray-300 rounded-md text-sm"/>
                              </div>
                              <label className="col-span-2 flex items-center justify-center text-xs gap-1">
                                  <input type="checkbox" checked={row.available} onChange={(e) => handleSizeChange(index, 'available', e.target.checked)} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"/>
                              </label>
                              <button type="button" onClick={() => removeSizeRow(index)} className="col-span-1 text-red-500 hover:text-red-700 justify-self-end"><Trash2 size={16}/></button>
                          </div>
                        ))}
                        <button type="button" onClick={addSizeRow} className="mt-2 flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-800 px-3 py-1.5 rounded-md border border-dashed border-black/50">
                            <Plus size={16}/> Añadir Talle
                        </button>
                    </div>
                </div>
              </div>

              {/* FAQs Section */}
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Preguntas Frecuentes (Opcional)</h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-4 border rounded-md bg-gray-50 relative">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Pregunta</label>
                          <input 
                            value={faq.question} 
                            onChange={(e) => handleFaqChange(index, 'question', e.target.value)} 
                            placeholder="Ej: ¿Este jean es elastizado?"
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Respuesta</label>
                          <textarea 
                            value={faq.answer} 
                            onChange={(e) => handleFaqChange(index, 'answer', e.target.value)} 
                            placeholder="Ej: Sí, este modelo contiene un 2% de elastano..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFaq(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><Trash2 size={12}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={addFaq} className="mt-2 flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-800 px-3 py-1.5 rounded-md border border-dashed border-black/50">
                      <Plus size={16}/> Añadir Pregunta
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="lg:col-span-1 space-y-8">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Multimedia</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Image size={18}/> Imágenes <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 border p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-3">Arrastra para reordenar. La primera imagen es la principal.</p>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                      <Droppable droppableId="images" direction="horizontal">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-wrap gap-3 mb-4 p-2 border rounded-md bg-gray-50 min-h-[6rem]">
                            {previewUrls.map((url, index) => (
                              <Draggable key={url} draggableId={url} index={index}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="relative group w-24 h-24">
                                    <img src={url} alt={`Previsualización ${index + 1}`} className="w-full h-full object-cover rounded shadow-sm"/>
                                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                    <div className="absolute bottom-1 left-1 bg-black/50 text-white rounded-full p-1 cursor-grab active:cursor-grabbing"><GripVertical size={14}/></div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>

                    <div className="border-2 border-dashed rounded-lg p-6 text-center mt-2">
                      <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                                             <label htmlFor="file-upload" className="mt-2 block text-sm font-semibold text-black hover:text-gray-800 cursor-pointer">                        Añadir imágenes
                        <input id="file-upload" name="newImages" type="file" multiple className="sr-only" onChange={handleNewImagesChange} accept="image/png, image/jpeg, image/webp" />
                      </label>
                      <p className="text-xs leading-5 text-gray-500 mt-1">PNG, JPG, WEBP</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Video size={18}/> Video (Opcional)
                  </label>
                  <div className="mt-1 border p-4 rounded-lg">
                    {videoPreview && (
                                        <div className="relative group max-w-xs mx-auto mb-4">
                                          <video src={videoPreview} controls className="w-full rounded shadow-sm" />                        <button type="button" onClick={handleRemoveVideo} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                      </div>
                    )}
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                       <label htmlFor="video-upload" className="mt-2 block text-sm font-semibold text-black hover:text-gray-800 cursor-pointer">
                        Añadir un video
                        <input id="video-upload" name="video" type="file" className="sr-only" onChange={handleVideoChange} accept="video/mp4,video/quicktime,video/webm" />
                      </label>
                      <p className="text-xs leading-5 text-gray-500 mt-1">MP4, MOV, WEBM</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Visibilidad</h3>
                <div className="space-y-4">
                  <label className="flex items-center text-gray-700 cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"/> 
                    <span className="ml-3 text-sm">Producto Activo (visible en la tienda)</span>
                  </label>
                  <label className="flex items-center text-gray-700 cursor-pointer">
                    <input type="checkbox" name="isNew" checked={formData.isNew} onChange={handleChange} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"/> 
                    <span className="ml-3 text-sm">Marcar como "Last Drop" (aparece en Homepage)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 bg-white border-t px-8 py-4 flex items-center justify-end space-x-4">
        <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={handleSubmit} disabled={isSaving} className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2">
          {isSaving ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </footer>
    </div>
  );
};