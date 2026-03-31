import React, { useState, useRef, useEffect } from 'react';
import { Announcement, Section, AnnouncementImage } from '../types';
import { PlusCircle, Image as ImageIcon, X, Save, XCircle } from 'lucide-react';
import { generateUUID } from '../lib/utils';

interface Props {
  onAdd: (announcement: Announcement) => void;
  onUpdate?: (announcement: Announcement) => void;
  editingAnnouncement?: Announcement | null;
  onCancelEdit?: () => void;
}

const defaultFormData: Omit<Announcement, 'id'> = {
  title: '',
  section: 'O que Acontece na Igreja',
  description: '',
  date: '',
  time: '',
  location: '',
  people: '',
  expiration: '',
  supportMaterial: '',
  referenceLink: '',
  images: [],
};

export function AnnouncementForm({ onAdd, onUpdate, editingAnnouncement, onCancelEdit }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Announcement>({
    ...defaultFormData,
    id: '',
  });

  useEffect(() => {
    if (editingAnnouncement) {
      setFormData(editingAnnouncement);
    } else {
      setFormData({ ...defaultFormData, id: '' });
    }
  }, [editingAnnouncement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    if (editingAnnouncement && onUpdate) {
      onUpdate(formData);
    } else {
      onAdd({
        ...formData,
        id: generateUUID(),
      });
    }

    // Reset form
    setFormData({ ...defaultFormData, id: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions (reduced to prevent Firestore 1MB limit per document)
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to WEBP with 0.5 quality for much smaller file size
          const dataUrl = canvas.toDataURL('image/webp', 0.5);
          const base64Data = dataUrl.split(',')[1];
          
          setFormData((prev) => {
            const newImages = [...(prev.images || [])];
            // If there's a legacy image, migrate it to the array
            if (prev.image && newImages.length === 0) {
              newImages.push(prev.image);
            }
            
            newImages.push({
              data: base64Data,
              mimeType: 'image/webp',
              previewUrl: dataUrl,
              name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
            });
            
            return {
              ...prev,
              image: undefined, // Clear legacy image
              images: newImages,
            };
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const currentImages = prev.images || [];
      // Handle legacy image if it exists
      if (prev.image && currentImages.length === 0) {
        return { ...prev, image: undefined };
      }
      
      return {
        ...prev,
        images: currentImages.filter((_, index) => index !== indexToRemove)
      };
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    setFormData({ ...defaultFormData, id: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 p-6 rounded-xl shadow-sm border ${editingAnnouncement ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {editingAnnouncement ? 'Editar Anúncio' : 'Novo Anúncio'}
        </h2>
        {editingAnnouncement && (
          <button type="button" onClick={handleCancel} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium">
            <XCircle className="w-4 h-4" /> Cancelar Edição
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Título do Anúncio (Interno) *</label>
          <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Ex: Caminhada no Parque" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Seção *</label>
          <select required name="section" value={formData.section} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
            <option value="O que Acontece na Igreja">O que Acontece na Igreja</option>
            <option value="Anote na Agenda">Anote na Agenda</option>
            <option value="Notícias Adventistas">Notícias Adventistas</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Descrição Detalhada *</label>
        <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="O que, quando, como, quem, onde, por que é importante..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Data(s) do Evento</label>
          <input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Ex: Domingo; 28/03" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Horário(s)</label>
          <input type="text" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Ex: 19h" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Local</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Ex: IASD Central" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Pessoas/Ministérios Envolvidos</label>
          <input type="text" name="people" value={formData.people} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Ex: Min. Saúde" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Data de Validade/Término</label>
          <input type="text" name="expiration" value={formData.expiration} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Ex: 04/04/2026 ou Contínuo" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Material de Apoio (Texto)</label>
          <input type="text" name="supportMaterial" value={formData.supportMaterial} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="Descreva imagens/logos" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Link de Referência (Opcional)</label>
          <input type="url" name="referenceLink" value={formData.referenceLink} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" placeholder="https://..." />
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <label className="text-sm font-medium text-gray-700 block">Anexar Imagens (Opcional)</label>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                <p className="text-xs text-gray-500">PNG, JPG ou WEBP (Max. 5MB por imagem)</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                multiple
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleImageChange} 
              />
            </label>
          </div>

          {/* Display Images */}
          {((formData.images && formData.images.length > 0) || formData.image) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* Legacy image support */}
              {formData.image && (!formData.images || formData.images.length === 0) && (
                <div className="relative inline-block">
                  <img 
                    src={formData.image.previewUrl} 
                    alt="Preview" 
                    className="h-24 w-full object-cover rounded-lg border border-gray-200 shadow-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(0)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate w-full">{formData.image.name}</p>
                </div>
              )}

              {/* New images array */}
              {formData.images?.map((img, index) => (
                <div key={index} className="relative inline-block">
                  <img 
                    src={img.previewUrl} 
                    alt={`Preview ${index + 1}`} 
                    className="h-24 w-full object-cover rounded-lg border border-gray-200 shadow-sm bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate w-full">{img.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors">
          {editingAnnouncement ? (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              Adicionar Anúncio à Lista
            </>
          )}
        </button>
      </div>
    </form>
  );
}
