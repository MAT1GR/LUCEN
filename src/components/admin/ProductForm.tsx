import React, { useState, FormEvent, useEffect } from 'react';
import { Product } from '../../types';
import { Plus, Trash2, UploadCloud, Image, Video, GripVertical, X } from 'lucide-react';
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

// --- INTERFACES ---
interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (data: FormData) => void;
  isSaving: boolean;
}

interface ColorRow {
  id: string;
  name: string;
  hex: string;
}

interface SortableImage {
  id: string;
  file: File | string; 
  url: string; 
}

// --- SORTABLE IMAGE COMPONENT ---
const SortableImageItem: React.FC<{ image: SortableImage; onRemove: (id: string) => void }> = ({ image, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group w-24 h-24">
      <img src={image.url} alt={`Previsualización`} className="w-full h-full object-cover rounded shadow-sm"/>
      <button type="button" onClick={() => onRemove(image.id)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
      <div {...attributes} {...listeners} className="absolute bottom-1 left-1 bg-black/50 text-white rounded-full p-1 cursor-grab active:cursor-grabbing"><GripVertical size={14}/></div>
    </div>
  );
};


// --- MAIN FORM COMPONENT ---
export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSave, isSaving }) => {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState<number | ''>(product?.price || '');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>(product?.compare_at_price || '');
  const [transferPrice, setTransferPrice] = useState<number | ''>(product?.transfer_price || '');
  const [stock, setStock] = useState<number | ''>(product?.stock || '');
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [colors, setColors] = useState<ColorRow[]>(product?.colors || []);
  const [sortableImages, setSortableImages] = useState<SortableImage[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(product?.video || null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    const initialImages = (product?.images || []).map((imgUrl): SortableImage => ({
      id: `existing-${imgUrl}-${Math.random()}`,
      file: imgUrl,
      url: getCorrectImageUrl(imgUrl as string),
    }));
    setSortableImages(initialImages);
  }, [product]);

  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSortableImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleNewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newSortableImages: SortableImage[] = newFiles.map(file => ({
        id: `new-${file.name}-${Date.now()}-${Math.random()}`,
        file: file,
        url: URL.createObjectURL(file),
      }));
      setSortableImages(prev => [...prev, ...newSortableImages]);
    }
  };

  const handleRemoveImage = (idToRemove: string) => {
    setSortableImages(prev => {
      const imageToRemove = prev.find(img => img.id === idToRemove);
      if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== idToRemove);
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = new FormData();

    data.append('name', name);
    data.append('price', String(price));
    data.append('compare_at_price', String(compareAtPrice || 0));
    data.append('transfer_price', String(transferPrice || 0));
    data.append('stock', String(stock || 0));
    data.append('isActive', String(isActive));
    data.append('colors', JSON.stringify(colors));

    const existingImagesPaths = sortableImages
      .map(img => img.file)
      .filter(file => typeof file === 'string') as string[];
      
    const newImageFiles = sortableImages
      .map(img => img.file)
      .filter(file => typeof file !== 'string') as File[];
    
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
  
    const handleColorChange = (id: string, field: 'name' | 'hex', value: string) => {
        setColors(colors.map(color => color.id === id ? { ...color, [field]: value } : color));
    };

    const addColor = () => {
        setColors([...colors, { id: `color-${Date.now()}`, name: '', hex: '#000000' }]);
    };

    const removeColor = (id: string) => {
        setColors(colors.filter(color => color.id !== id));
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
  
  const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
        setter('');
    } else {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            setter(num);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b px-8 py-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <div>
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
            Cerrar
          </button>
        </div>
      </header>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda */}
            <div className="lg:col-span-2 space-y-8">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Información Principal</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto <span className="text-red-500">*</span></label>
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Jean Mom Fit Vintage" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" required />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Precio y Stock</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio <span className="text-red-500">*</span></label>
                        <input id="price" type="number" value={price} onChange={handleNumericChange(setPrice)} placeholder="Ej: 25000" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" required />
                    </div>
                    <div>
                        <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-1">Precio Tachado (Opcional)</label>
                        <input id="compareAtPrice" type="number" value={compareAtPrice} onChange={handleNumericChange(setCompareAtPrice)} placeholder="Ej: 30000" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                    </div>
                    <div>
                        <label htmlFor="transferPrice" className="block text-sm font-medium text-gray-700 mb-1">Precio con Transferencia (Opcional)</label>
                        <input id="transferPrice" type="number" value={transferPrice} onChange={handleNumericChange(setTransferPrice)} placeholder="Ej: 22000" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" />
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock Total <span className="text-red-500">*</span></label>
                        <input id="stock" type="number" value={stock} onChange={handleNumericChange(setStock)} placeholder="Ej: 50" className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" required />
                    </div>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Colores</h3>
                 <div className="space-y-3">
                    {colors.map((color) => (
                        <div key={color.id} className="grid grid-cols-12 gap-3 items-center p-2 border rounded-md">
                            <div className="col-span-5">
                                <label className="sr-only">Nombre del Color</label>
                                <input value={color.name} onChange={(e) => handleColorChange(color.id, 'name', e.target.value)} placeholder="Nombre (ej: Azul)" className="w-full p-2 border-gray-300 rounded-md text-sm"/>
                            </div>
                            <div className="col-span-5 flex items-center gap-2">
                                <label className="sr-only">Código Hex</label>
                                <input value={color.hex} onChange={(e) => handleColorChange(color.id, 'hex', e.target.value)} placeholder="#0000ff" className="w-full p-2 border-gray-300 rounded-md text-sm"/>
                                <input type="color" value={color.hex} onChange={(e) => handleColorChange(color.id, 'hex', e.target.value)} className="w-8 h-8 p-0 border-none rounded cursor-pointer"/>
                            </div>
                            <div className="col-span-2 flex justify-end">
                                <button type="button" onClick={() => removeColor(color.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addColor} className="mt-2 flex items-center gap-2 text-sm font-semibold text-black hover:text-gray-800 px-3 py-1.5 rounded-md border border-dashed border-black/50">
                        <Plus size={16}/> Añadir Color
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
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sortableImages.map(img => img.id)} strategy={rectSortingStrategy}>
                        <div className="flex flex-wrap gap-3 mb-4 p-2 border rounded-md bg-gray-50 min-h-[6rem]">
                          {sortableImages.map((image) => (
                            <SortableImageItem 
                              key={image.id}
                              image={image}
                              onRemove={handleRemoveImage}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <div className="border-2 border-dashed rounded-lg p-6 text-center mt-2">
                      <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                        <label htmlFor="file-upload" className="mt-2 block text-sm font-semibold text-black hover:text-gray-800 cursor-pointer">Añadir imágenes
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
                          <video src={videoPreview} controls className="w-full rounded shadow-sm" />
                          <button type="button" onClick={handleRemoveVideo} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
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
                    <input type="checkbox" name="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"/> 
                    <span className="ml-3 text-sm">Producto Activo (visible en la tienda)</span>
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
