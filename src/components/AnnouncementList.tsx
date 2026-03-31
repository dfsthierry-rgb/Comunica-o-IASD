import React from 'react';
import { Announcement } from '../types';
import { Trash2, Calendar, MapPin, Clock, Image as ImageIcon, Pencil, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  announcements: Announcement[];
  onRemove: (id: string) => void;
  onEdit: (announcement: Announcement) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function AnnouncementList({ announcements, onRemove, onEdit, onMoveUp, onMoveDown }: Props) {
  if (announcements.length === 0) {
    return (
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500">
        Nenhum anúncio adicionado ainda. Preencha o formulário ao lado para começar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Anúncios Adicionados ({announcements.length})</h2>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {announcements.map((announcement, index) => (
          <div key={announcement.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 relative group flex gap-3">
            
            {/* Reorder Controls */}
            <div className="flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onMoveUp(announcement.id)}
                disabled={index === 0}
                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                title="Mover para cima"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <button 
                onClick={() => onMoveDown(announcement.id)}
                disabled={index === announcements.length - 1}
                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-400"
                title="Mover para baixo"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 pr-16">
              <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-2">
                {announcement.section}
              </span>
              <h3 className="font-semibold text-gray-900 mb-1">{announcement.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{announcement.description}</p>
              
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                {announcement.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {announcement.date}
                  </div>
                )}
                {announcement.time && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {announcement.time}
                  </div>
                )}
                {announcement.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {announcement.location}
                  </div>
                )}
              </div>

              {((announcement.images && announcement.images.length > 0) || announcement.image) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <div className="flex -space-x-2">
                    {/* Legacy image */}
                    {announcement.image && (!announcement.images || announcement.images.length === 0) && (
                      <img 
                        src={announcement.image.previewUrl} 
                        alt="Anexo" 
                        className="w-8 h-8 object-cover rounded border border-white shadow-sm"
                      />
                    )}
                    {/* New images array */}
                    {announcement.images?.slice(0, 3).map((img, i) => (
                      <img 
                        key={i}
                        src={img.previewUrl} 
                        alt={`Anexo ${i + 1}`} 
                        className="w-8 h-8 object-cover rounded border border-white shadow-sm relative"
                        style={{ zIndex: 3 - i }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {announcement.images?.length || (announcement.image ? 1 : 0)} {(announcement.images?.length || (announcement.image ? 1 : 0)) === 1 ? 'Imagem anexada' : 'Imagens anexadas'}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(announcement)}
                className="p-1.5 text-gray-400 hover:text-blue-600 bg-white rounded-md hover:bg-blue-50 transition-colors"
                title="Editar anúncio"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRemove(announcement.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 bg-white rounded-md hover:bg-red-50 transition-colors"
                title="Remover anúncio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
