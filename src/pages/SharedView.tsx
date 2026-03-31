import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { store } from '../lib/store';
import { Presentation } from '../types';
import Markdown from 'react-markdown';
import { FileText, Image as ImageIcon, Download, ArrowLeft, Palette, Type, Layout, Archive, Printer, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

export function SharedView() {
  const { id } = useParams<{ id: string }>();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'design'>('script');
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  useEffect(() => {
    const loadPresentation = async () => {
      if (id) {
        const p = await store.getPresentation(id);
        if (p && p.status === 'published') {
          setPresentation(p);
        }
      }
    };
    loadPresentation();
  }, [id]);

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Apresentação não encontrada</h1>
          <p className="text-gray-600 mb-6">
            O link pode estar quebrado ou a apresentação ainda não foi publicada pelo Diretor.
          </p>
          <Link to="/" className="text-blue-600 hover:underline">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
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
        let notesText = "NOTAS PARA DESIGNERS E DETALHES DOS ANÚNCIOS\n\n";
        presentation.designerNotes.forEach((note, index) => {
          const ann = presentation.announcements.find(a => a.id === note.announcementId);
          notesText += `======================================================\n`;
          notesText += `SLIDE ${index + 1}: ${ann?.title || ''}\n`;
          notesText += `Seção: ${ann?.section || ''}\n`;
          notesText += `======================================================\n\n`;
          
          notesText += `[ DETALHES DO ANÚNCIO (FORNECIDOS PELO DIRETOR) ]\n`;
          notesText += `Descrição Detalhada: ${ann?.description || 'N/A'}\n`;
          if (ann?.date) notesText += `Data: ${ann.date}\n`;
          if (ann?.time) notesText += `Horário: ${ann.time}\n`;
          if (ann?.location) notesText += `Local: ${ann.location}\n`;
          if (ann?.people) notesText += `Público-alvo/Responsáveis: ${ann.people}\n`;
          if (ann?.supportMaterial) notesText += `Material de Apoio: ${ann.supportMaterial}\n`;
          if (ann?.referenceLink) notesText += `Link de Referência: ${ann.referenceLink}\n`;
          notesText += `\n`;

          notesText += `[ SUGESTÕES DA INTELIGÊNCIA ARTIFICIAL PARA O CANVA ]\n`;
          notesText += `Título Sugerido: ${note.slideTitle}\n`;
          notesText += `Texto Principal: ${note.slideText}\n`;
          notesText += `Sugestão de Imagem: ${note.imageSuggestion}\n`;
          notesText += `Cores: ${note.designSuggestions.colors}\n`;
          notesText += `Fontes: ${note.designSuggestions.fonts}\n`;
          notesText += `Layout: ${note.designSuggestions.layout}\n\n\n`;
        });
        rootFolder.file("notas_design_e_detalhes.txt", notesText);
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
      alert("Erro ao gerar o arquivo ZIP.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm print:hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-[300px] md:max-w-md">
                {presentation.title}
              </h1>
            </div>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-blue-700 hover:bg-white mr-2"
                title="Salvar como PDF ou Imprimir"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Salvar PDF</span>
              </button>
              <button
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-blue-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                title="Baixar todos os arquivos (Roteiro, Notas, Imagens e PDF)"
              >
                {isDownloadingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                <span className="hidden sm:inline">{isDownloadingZip ? 'Gerando...' : 'Baixar Tudo (ZIP)'}</span>
              </button>
              <button
                onClick={() => setActiveTab('script')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'script' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Roteiro
              </button>
              <button
                onClick={() => setActiveTab('design')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'design' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Design (Canva)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Screen View */}
      <main className="container mx-auto px-4 max-w-5xl py-8 print:hidden">
        {activeTab === 'script' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
            <div className="prose prose-blue max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed">
              <Markdown>{presentation.script || ''}</Markdown>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="space-y-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-blue-900 mb-2">Instruções para Designers</h2>
              <p className="text-blue-800">
                Abaixo estão as sugestões de design e os textos gerados para cada slide da apresentação. 
                Se o diretor anexou alguma imagem de referência ou flyer, você poderá baixá-la diretamente aqui.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {presentation.designerNotes?.map((note, index) => {
                const originalAnn = presentation.announcements.find(a => a.id === note.announcementId);
                
                return (
                  <div key={note.announcementId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Slide {index + 1}: {originalAnn?.title}</h3>
                      <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                        {originalAnn?.section}
                      </span>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Textos para o Canva */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Textos para o Slide</h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-1">Título Sugerido</span>
                              <p className="font-bold text-gray-900 text-lg">{note.slideTitle}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-1">Texto Principal</span>
                              <p className="text-gray-700 whitespace-pre-wrap">{note.slideText}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Guia de Estilo</h4>
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Palette className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-gray-900 block">Cores</span>
                                <p className="text-sm text-gray-600">{note.designSuggestions.colors}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Type className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-gray-900 block">Fontes</span>
                                <p className="text-sm text-gray-600">{note.designSuggestions.fonts}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Layout className="w-5 h-5 text-gray-400 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-gray-900 block">Layout</span>
                                <p className="text-sm text-gray-600">{note.designSuggestions.layout}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Imagens e Referências */}
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Sugestão de Imagem</h4>
                          <p className="text-gray-700 text-sm bg-blue-50 p-4 rounded-lg border border-blue-100">
                            {note.imageSuggestion}
                          </p>
                        </div>

                        {((originalAnn?.images && originalAnn.images.length > 0) || originalAnn?.image || originalAnn?.referenceLink) && (
                          <div>
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Anexos e Referências do Diretor</h4>
                            
                            {originalAnn?.referenceLink && (
                              <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <span className="text-xs text-gray-500 font-medium block mb-1">Link de Referência</span>
                                <a 
                                  href={originalAnn.referenceLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline break-all text-sm"
                                >
                                  {originalAnn.referenceLink}
                                </a>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                              {/* Legacy image */}
                              {originalAnn?.image && (!originalAnn?.images || originalAnn.images.length === 0) && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  <img 
                                    src={originalAnn.image.previewUrl} 
                                    alt="Anexo" 
                                    className="w-full h-48 object-cover bg-gray-50"
                                  />
                                  <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{originalAnn.image.name}</span>
                                    <a 
                                      href={originalAnn.image.previewUrl}
                                      download={originalAnn.image.name}
                                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      <Download className="w-4 h-4" />
                                      Baixar
                                    </a>
                                  </div>
                                </div>
                              )}

                              {/* New images array */}
                              {originalAnn?.images?.map((img, imgIndex) => (
                                <div key={imgIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                  <img 
                                    src={img.previewUrl} 
                                    alt={`Anexo ${imgIndex + 1}`} 
                                    className="w-full h-48 object-cover bg-gray-50"
                                  />
                                  <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">{img.name}</span>
                                    <a 
                                      href={img.previewUrl}
                                      download={img.name}
                                      className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      <Download className="w-4 h-4" />
                                      Baixar
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

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
