import { GoogleGenAI, Type } from '@google/genai';
import { Announcement, DesignerNote } from '../types';

export async function generateScriptAndSlides(announcements: Announcement[]): Promise<{ script: string, designerNotes: DesignerNote[] }> {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

  const parts: any[] = [];
  
  parts.push({
    text: `Você é um Gerador de Apresentações de Anúncios e Roteiros para a Comunicação da Igreja Adventista do Sétimo Dia Central de Itapevi. Seu papel é transformar informações de anúncios em slides organizados e um roteiro dinâmico para apresentadores.
    
Aqui estão os anúncios cadastrados para esta semana:`
  });

  announcements.forEach((ann, index) => {
    let annText = `\n\n--- ANÚNCIO (ID: ${ann.id}) ---\n`;
    annText += `Título: ${ann.title}\n`;
    annText += `Seção: ${ann.section}\n`;
    annText += `Descrição: ${ann.description}\n`;
    if (ann.date) annText += `Data: ${ann.date}\n`;
    if (ann.time) annText += `Horário: ${ann.time}\n`;
    if (ann.location) annText += `Local: ${ann.location}\n`;
    if (ann.people) annText += `Pessoas/Ministérios: ${ann.people}\n`;
    if (ann.expiration) annText += `Validade: ${ann.expiration}\n`;
    if (ann.supportMaterial) annText += `Material de Apoio (Texto): ${ann.supportMaterial}\n`;
    if (ann.referenceLink) annText += `Link: ${ann.referenceLink}\n`;
    
    parts.push({ text: annText });

    if (ann.image && (!ann.images || ann.images.length === 0)) {
      parts.push({ text: `\n[Imagem anexada para o anúncio ${ann.id}]:\n` });
      parts.push({
        inlineData: {
          data: ann.image.data,
          mimeType: ann.image.mimeType
        }
      });
    }

    if (ann.images && ann.images.length > 0) {
      parts.push({ text: `\n[${ann.images.length} Imagens anexadas para o anúncio ${ann.id}]:\n` });
      ann.images.forEach((img) => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });
    }
  });

  parts.push({
    text: `\n\nPor favor, gere o seguinte:

1. Para CADA anúncio, forneça sugestões de design e texto para o Canva.
2. Em seguida, gere o ROTEIRO COMPLETO PARA APRESENTAÇÃO DE SÁBADO em formato Markdown:
**[ROTEIRO COMPLETO PARA APRESENTAÇÃO DE SÁBADO]**
**Introdução (Apresentador 1):** [Saudação e breve introdução à comunicação da semana]
**Bloco 1: O Que Acontece na Igreja (Apresentador 2):** [Transição suave e texto para cada anúncio desta seção. Duração sugerida para fala: ~15-20 segundos por anúncio.]
**Bloco 2: Anote na Agenda (Apresentador 1):** [Transição suave e texto para cada anúncio desta seção com foco em datas. Duração sugerida para fala: ~15-20 segundos por anúncio.]
**Bloco 3: Notícias Adventistas (Apresentador 2):** [Transição suave e texto para cada anúncio desta seção destacando a relevância. Duração sugerida para fala: ~20-25 segundos por notícia.]
**Conclusão (Apresentador 1 e 2):** [Mensagem final de encorajamento, convite à participação, desejo de bom sábado/semana, agradecimentos e fechamento.]

Considerações para o Roteiro:
* A linguagem deve ser acolhedora, clara e incentivadora.
* Alternar os apresentadores entre os blocos para dinamismo.
* Manter um tom positivo e inspirador.
* Enfatizar os "calls to action" (convites para participar, orar, etc.).`
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: { 
              type: Type.STRING, 
              description: "O roteiro completo em Markdown para os apresentadores lerem." 
            },
            designerNotes: {
              type: Type.ARRAY,
              description: "Dicas de design e textos para os slides de cada anúncio.",
              items: {
                type: Type.OBJECT,
                properties: {
                  announcementId: { type: Type.STRING, description: "O ID exato do anúncio" },
                  slideTitle: { type: Type.STRING, description: "Título curto e impactante para o slide" },
                  slideText: { type: Type.STRING, description: "Descrição concisa para o slide" },
                  imageSuggestion: { type: Type.STRING, description: "Descrição detalhada da imagem a ser usada ou como usar a imagem anexada" },
                  designSuggestions: {
                    type: Type.OBJECT,
                    properties: {
                      colors: { type: Type.STRING, description: "2-3 cores primárias, 1-2 secundárias" },
                      fonts: { type: Type.STRING, description: "Sugestões de tipos de fontes" },
                      layout: { type: Type.STRING, description: "Breve descrição do layout" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!response.text) throw new Error("Resposta vazia da IA.");
    
    let text = response.text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error(`Falha ao gerar o roteiro: ${error instanceof Error ? error.message : String(error)}`);
  }
}
