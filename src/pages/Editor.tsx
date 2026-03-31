import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AnnouncementForm } from '../components/AnnouncementForm';
import { AnnouncementList } from '../components/AnnouncementList';
import { Announcement, Presentation } from '../types';
import { generateScriptAndSlides } from '../lib/gemini';
import { store } from '../lib/store';
import { Loader2, CheckCircle2, ArrowLeft, Share2, AlertTriangle, Archive, Copy, Check } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import Markdown from 'react-markdown';

export function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPresentation = async () => {
      if (id) {
        const p = await store.getPresentation(id);
        if (p) {
          setPresentation(p);
        } else {
          navigate('/');
        }
      }
    };
    loadPresentation();
  }, [id, navigate]);

  const handleCopyLink = () => {
    if (!presentation) return;
    
    // The current URL is usually ais-dev-... which requires AI Studio login.
    // We need to replace ais-dev with ais-pre to get the public Shared App URL.
    const currentOrigin = window.location.origin;
    const publicOrigin = currentOrigin.replace('ais-dev', 'ais-pre');
    const publicUrl = `${publicOrigin}/#/shared/${presentation.id}`;
    
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!presentation) return null;

  const handleAddAnnouncement = async (announcement: Announcement) => {
    try {
      setError(null);
      const updated = {
        ...presentation,
        status: 'draft' as const,
        announcements: [...presentation.announcements, announcement]
      };
      await store.savePresentation(updated);
      setPresentation(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar anúncio.');
    }
  };

  const handleUpdateAnnouncement = async (announcement: Announcement) => {
    try {
      setError(null);
      const updated = {
        ...presentation,
        status: 'draft' as const,
        announcements: presentation.announcements.map((a) => 
          a.id === announcement.id ? announcement : a
        )
      };
      await store.savePresentation(updated);
      setPresentation(updated);
      setEditingAnnouncement(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar anúncio.');
    }
  };

  const handleRemoveAnnouncement = async (annId: string) => {
    try {
      setError(null);
      const updated = {
        ...presentation,
        status: 'draft' as const,
        announcements: presentation.announcements.filter((a) => a.id !== annId)
      };
      await store.savePresentation(updated);
      setPresentation(updated);
      if (editingAnnouncement?.id === annId) {
        setEditingAnnouncement(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover anúncio.');
    }
  };

  const handleMoveUp = async (annId: string) => {
    try {
      setError(null);
      const index = presentation.announcements.findIndex(a => a.id === annId);
      if (index > 0) {
        const newAnnouncements = [...presentation.announcements];
        [newAnnouncements[index - 1], newAnnouncements[index]] = [newAnnouncements[index], newAnnouncements[index - 1]];
        const updated = { ...presentation, status: 'draft' as const, announcements: newAnnouncements };
        await store.savePresentation(updated);
        setPresentation(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover anúncio.');
    }
  };

  const handleMoveDown = async (annId: string) => {
    try {
      setError(null);
      const index = presentation.announcements.findIndex(a => a.id === annId);
      if (index < presentation.announcements.length - 1) {
        const newAnnouncements = [...presentation.announcements];
        [newAnnouncements[index + 1], newAnnouncements[index]] = [newAnnouncements[index], newAnnouncements[index + 1]];
        const updated = { ...presentation, status: 'draft' as const, announcements: newAnnouncements };
        await store.savePresentation(updated);
        setPresentation(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao mover anúncio.');
    }
  };

  const handleGenerate = async () => {
    if (presentation.announcements.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await generateScriptAndSlides(presentation.announcements);
      
      const updated: Presentation = {
        ...presentation,
        status: 'published',
        script: result.script,
        designerNotes: result.designerNotes
      };
      
      setPresentation(updated);
      await store.savePresentation(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      const updated = { ...presentation, title: e.target.value };
      await store.savePresentation(updated);
      setPresentation(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar título.');
    }
  };

  const handleDownloadZip = async () => {
    if (!presentation || isDownloadingZip) return;
    
    setIsDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folderName = `Apresentacao_${presentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      const rootFolder = zip.folder(folderName);
      
      if (!rootFolder) return;
      
      // Add script
      if (presentation.script) {
        rootFolder.file("roteiro.txt", presentation.script);
      }
      
      // Add designer notes
      if (presentation.designerNotes) {
        let notesText = "NOTAS PARA DESIGNERS\n\n";
        presentation.designerNotes.forEach((note, index) => {
          const ann = presentation.announcements.find(a => a.id === note.announcementId);
          notesText += `--- SLIDE ${index + 1}: ${ann?.title || ''} ---\n`;
          notesText += `Título: ${note.slideTitle}\n`;
          notesText += `Texto: ${note.slideText}\n`;
          notesText += `Sugestão de Imagem: ${note.imageSuggestion}\n`;
          notesText += `Cores: ${note.designSuggestions.colors}\n`;
          notesText += `Fontes: ${note.designSuggestions.fonts}\n`;
          notesText += `Layout: ${note.designSuggestions.layout}\n\n`;
        });
        rootFolder.file("notas_design.txt", notesText);
      }
      
      // Add images
      const imgFolder = rootFolder.folder("imagens_anexadas");
      presentation.announcements.forEach((ann, index) => {
        if (ann.image && (!ann.images || ann.images.length === 0) && imgFolder) {
          // Convert base64 to blob
          const byteString = atob(ann.image.data);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: ann.image.mimeType });
          
          // Extract extension from mimeType or name
          const ext = ann.image.name.split('.').pop() || 'png';
          const fileName = `slide_${index + 1}_${ann.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
          
          imgFolder.file(fileName, blob);
        }

        if (ann.images && ann.images.length > 0 && imgFolder) {
          ann.images.forEach((img, imgIndex) => {
            const byteString = atob(img.data);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: img.mimeType });
            
            const ext = img.name.split('.').pop() || 'png';
            const fileName = `slide_${index + 1}_img${imgIndex + 1}_${ann.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`;
            
            imgFolder.file(fileName, blob);
          });
        }
      });
      
      // Generate PDF
      const printElement = document.getElementById('print-content');
      if (printElement) {
        // Clone the element to avoid showing it to the user or messing up the layout
        const clone = printElement.cloneNode(true) as HTMLElement;
        clone.removeAttribute('id');
        clone.classList.remove('hidden');
        clone.classList.remove('print:block');
        
        // Create a wrapper to hide the clone from the user but keep it visible to html2canvas
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.zIndex = '-9999';
        // We don't use opacity: 0 because html2canvas might copy it
        wrapper.appendChild(clone);
        document.body.appendChild(wrapper);
        
        const opt = {
          margin:       10,
          filename:     'apresentacao.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, windowWidth: document.documentElement.offsetWidth },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        try {
          // Use explicit Promise to ensure await works correctly with html2pdf's custom thenable
          const pdfBlob = await new Promise<Blob>((resolve, reject) => {
            // @ts-ignore
            const generatorFn = typeof html2pdf === 'function' ? html2pdf : (html2pdf && typeof html2pdf.default === 'function' ? html2pdf.default : null);
            
            if (!generatorFn) {
              reject(new Error("html2pdf library not loaded correctly"));
              return;
            }
            
            generatorFn()
              .set(opt)
              .from(clone)
              .output('blob')
              .then((blob: Blob) => resolve(blob))
              .catch(reject);
          });
          
          rootFolder.file("apresentacao_completa.pdf", pdfBlob);
        } catch (err) {
          console.error("Error generating PDF for ZIP:", err);
        } finally {
          // Clean up
          document.body.removeChild(wrapper);
        }
      }
      
      // Generate and download
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${folderName}.zip`);
    } catch (err) {
      console.error("Error generating ZIP:", err);
      setError("Erro ao gerar o arquivo ZIP.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-6xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <input 
            type="text" 
            value={presentation.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors px-1 py-0.5"
          />
        </div>
        
        {presentation.status === 'published' && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="flex items-center gap-2 bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:bg-blue-50 disabled:text-blue-400 font-medium py-2 px-4 rounded-lg transition-colors"
              title="Baixar todos os arquivos (Roteiro, Notas, Imagens e PDF)"
            >
              {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              <span className="hidden sm:inline">{isDownloadingZip ? 'Gerando...' : 'Baixar Tudo (ZIP)'}</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 bg-purple-100 text-purple-800 hover:bg-purple-200 font-medium py-2 px-4 rounded-lg transition-colors"
              title="Copiar link público para compartilhar"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <Link 
              to={`/shared/${presentation.id}`}
              target="_blank"
              className="flex items-center gap-2 bg-green-100 text-green-800 hover:bg-green-200 font-medium py-2 px-4 rounded-lg transition-colors"
              title="Abrir área pública (pode exigir login se não for o link público)"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Visualizar</span>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Erro</h3>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {presentation.status === 'published' && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Share2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Apresentação Publicada e Online!</h3>
            <p className="text-sm text-green-800 mt-1">
              Os dados estão salvos na nuvem. Você pode clicar em <strong>"Abrir Área Pública"</strong> e enviar o link dessa página para qualquer pessoa (designers, apresentadores, grupo do WhatsApp).
              <br/><br/>
              Eles poderão visualizar o roteiro, as notas e baixar as imagens diretamente pelo link, sem precisar fazer login.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <AnnouncementForm 
            onAdd={handleAddAnnouncement} 
            onUpdate={handleUpdateAnnouncement}
            editingAnnouncement={editingAnnouncement}
            onCancelEdit={() => setEditingAnnouncement(null)}
          />
        </div>
        
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="flex-grow">
            <AnnouncementList 
              announcements={presentation.announcements} 
              onRemove={handleRemoveAnnouncement}
              onEdit={setEditingAnnouncement}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleGenerate}
              disabled={presentation.announcements.length === 0 || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-sm transition-all text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Gerando Roteiro e Slides...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  {presentation.status === 'published' ? 'ATUALIZAR PUBLICAÇÃO' : 'FINALIZAR E PUBLICAR'}
                </>
              )}
            </button>
            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Print View (Hidden on Screen) */}
      <div id="print-content" className="hidden print:block p-8 bg-white text-black">
        <h1 className="text-3xl font-bold mb-8 text-center">{presentation.title}</h1>
        
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Roteiro da Apresentação</h2>
          <div className="prose max-w-none">
            <Markdown>{presentation.script || ''}</Markdown>
          </div>
        </div>

        <div className="break-before-page">
          <h2 className="text-2xl font-bold mb-6 border-b pb-2">Instruções de Design e Anexos</h2>
          
          <div className="space-y-10">
            {presentation.designerNotes?.map((note, index) => {
              const originalAnn = presentation.announcements.find(a => a.id === note.announcementId);
              
              return (
                <div key={note.announcementId} className="border border-gray-300 rounded-lg p-6 break-inside-avoid">
                  <h3 className="text-xl font-bold mb-4 bg-gray-100 p-2 rounded">
                    Slide {index + 1}: {originalAnn?.title}
                    {originalAnn?.section && <span className="ml-2 text-sm font-normal text-gray-600">({originalAnn.section})</span>}
                  </h3>
                  
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 uppercase text-sm border-b border-gray-200 pb-2">Detalhes do Anúncio (Fornecidos pelo Diretor)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="col-span-full">
                        <span className="font-bold text-gray-700">Descrição Detalhada:</span>
                        <p className="mt-1">{originalAnn?.description || 'N/A'}</p>
                      </div>
                      {originalAnn?.date && (
                        <div>
                          <span className="font-bold text-gray-700">Data:</span> {originalAnn.date}
                        </div>
                      )}
                      {originalAnn?.time && (
                        <div>
                          <span className="font-bold text-gray-700">Horário:</span> {originalAnn.time}
                        </div>
                      )}
                      {originalAnn?.location && (
                        <div>
                          <span className="font-bold text-gray-700">Local:</span> {originalAnn.location}
                        </div>
                      )}
                      {originalAnn?.people && (
                        <div>
                          <span className="font-bold text-gray-700">Público-alvo/Responsáveis:</span> {originalAnn.people}
                        </div>
                      )}
                      {originalAnn?.supportMaterial && (
                        <div className="col-span-full">
                          <span className="font-bold text-gray-700">Material de Apoio:</span>
                          <p className="mt-1">{originalAnn.supportMaterial}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-3 uppercase text-sm border-b border-gray-200 pb-2">Sugestões da Inteligência Artificial para o Canva</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">Textos para o Slide</h5>
                        <div className="mb-4">
                          <span className="text-sm font-bold block">Título:</span>
                          <p className="text-lg">{note.slideTitle}</p>
                        </div>
                        <div>
                          <span className="text-sm font-bold block">Texto Principal:</span>
                          <p className="whitespace-pre-wrap">{note.slideText}</p>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-bold text-gray-700 mb-2">Guia de Estilo</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li><strong>Cores:</strong> {note.designSuggestions.colors}</li>
                          <li><strong>Fontes:</strong> {note.designSuggestions.fonts}</li>
                          <li><strong>Layout:</strong> {note.designSuggestions.layout}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-3 uppercase text-sm">Imagens e Referências</h4>
                    <p className="text-sm mb-4"><strong>Sugestão de Imagem (IA):</strong> {note.imageSuggestion}</p>
                    
                    {originalAnn?.referenceLink && (
                      <p className="text-sm mb-4">
                        <strong>Link de Referência:</strong> <a href={originalAnn.referenceLink} className="text-blue-600 underline break-all">{originalAnn.referenceLink}</a>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {originalAnn?.image && (!originalAnn?.images || originalAnn.images.length === 0) && (
                        <div className="border p-2 rounded flex flex-col items-center">
                          <img src={originalAnn.image.previewUrl} alt="Anexo" className="w-full h-auto max-h-64 object-contain mb-2" />
                          <p className="text-xs text-center text-gray-500">{originalAnn.image.name}</p>
                        </div>
                      )}

                      {originalAnn?.images?.map((img, imgIndex) => (
                        <div key={imgIndex} className="border p-2 rounded flex flex-col items-center">
                          <img src={img.previewUrl} alt={`Anexo ${imgIndex + 1}`} className="w-full h-auto max-h-64 object-contain mb-2" />
                          <p className="text-xs text-center text-gray-500">{img.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
