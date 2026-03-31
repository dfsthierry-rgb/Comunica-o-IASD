import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { store } from '../lib/store';
import { Presentation } from '../types';
import { PlusCircle, FileText, Calendar, ArrowRight, Trash2, Info } from 'lucide-react';

import { auth } from '../lib/firebase';

export function Dashboard() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [presentationToDelete, setPresentationToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPresentations = async () => {
      const data = await store.getPresentations();
      setPresentations(data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    };
    loadPresentations();
  }, []);

  const handleCreateNew = async () => {
    if (!auth.currentUser) return;
    try {
      setError(null);
      const newPresentation: Presentation = {
        id: crypto.randomUUID(),
        title: `Apresentação - ${new Date().toLocaleDateString('pt-BR')}`,
        createdAt: new Date().toISOString(),
        status: 'draft',
        authorUid: auth.currentUser.uid,
        announcements: []
      };
      await store.savePresentation(newPresentation);
      navigate(`/editor/${newPresentation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar apresentação.');
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPresentationToDelete(id);
  };

  const confirmDelete = async () => {
    if (!presentationToDelete) return;
    await store.deletePresentation(presentationToDelete);
    const data = await store.getPresentations();
    setPresentations(data.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setPresentationToDelete(null);
  };

  const cancelDelete = () => {
    setPresentationToDelete(null);
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel do Diretor</h1>
          <p className="text-gray-600 mt-1">Gerencie as apresentações e roteiros da igreja.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Nova Apresentação
        </button>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Erro</h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {presentations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma apresentação criada</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Comece criando sua primeira apresentação para o próximo sábado. Você poderá adicionar anúncios, gerar roteiros e compartilhar com a equipe.
          </p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Criar Primeira Apresentação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map(presentation => (
            <Link 
              key={presentation.id} 
              to={`/editor/${presentation.id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group relative"
            >
              <button
                onClick={(e) => handleDeleteClick(presentation.id, e)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  presentation.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {presentation.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{presentation.title}</h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(presentation.createdAt).toLocaleDateString('pt-BR')}
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {presentation.announcements.length} anúncios
                </div>
              </div>

              <div className="flex items-center text-blue-600 font-medium text-sm group-hover:gap-2 transition-all">
                {presentation.status === 'published' ? 'Ver/Editar Apresentação' : 'Continuar Editando'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {presentationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Apresentação</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta apresentação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
