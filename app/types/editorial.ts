export interface ProgramEditorial {
  id: string; title: string; slug: string; short_description: string; description: string;
  presenter: string; schedule: string; coverImage: string; externalCoverImage?: string;
  promoVideoUrl: string; display_order: number; is_featured: boolean; is_active: boolean;
}

export interface EpisodeEditorial {
  id: string; programId: number; programTitle: string; title: string; description: string;
  thumbnailImage: string; externalThumbnailImage?: string; youtubeLink: string;
  youtubeEmbedUrl: string; publishDate: string; is_featured: boolean;
  featured_order: number; is_active: boolean;
}

export interface ProgramOption { id: string; title: string; is_active: boolean }
