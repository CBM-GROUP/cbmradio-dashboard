export type ArticleCategory = {
  id: number; name: string; slug: string; description: string;
  is_active: boolean; display_order: number; created_at: string; updated_at: string;
};

export type ArticleMark = { type: "bold" | "italic" | "link"; attrs?: { href?: string } };
export type ArticleNode = {
  type: string; text?: string; attrs?: Record<string, unknown>;
  marks?: ArticleMark[]; content?: ArticleNode[];
};
export type ArticleDocument = { type: "doc"; content: ArticleNode[] };

export type DashboardArticle = {
  id: string; slug: string; title: string; body: string; content: string;
  content_json: ArticleDocument | null; content_schema_version: number;
  category: ArticleCategory | null; author: string; cover_image: string;
  external_cover_image_url: string; coverImage: string; externalCoverImage: string;
  is_featured: boolean; is_published: boolean; published_at: string | null;
  created_at: string; updated_at: string; summary: string; status: "Draft" | "Published";
  views_count?: number;
};
