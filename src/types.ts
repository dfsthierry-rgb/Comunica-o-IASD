export type Section = 'O que Acontece na Igreja' | 'Anote na Agenda' | 'Notícias Adventistas';

export interface AnnouncementImage {
  data: string;
  mimeType: string;
  previewUrl: string;
  name: string;
}

export interface Announcement {
  id: string;
  title: string;
  section: Section;
  description: string;
  date: string;
  time: string;
  location: string;
  people: string;
  expiration: string;
  supportMaterial: string;
  referenceLink: string;
  image?: AnnouncementImage; // Deprecated, use images
  images?: AnnouncementImage[];
}

export interface DesignerNote {
  announcementId: string;
  slideTitle: string;
  slideText: string;
  imageSuggestion: string;
  designSuggestions: {
    colors: string;
    fonts: string;
    layout: string;
  };
}

export interface Presentation {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'published';
  authorUid: string;
  announcements: Announcement[];
  script?: string;
  designerNotes?: DesignerNote[];
}
