export type ArticleMediaType = "image" | "video";
export type ArticleMediaSourceType = "upload" | "external";

export interface ArticleMedia {
  id: number;
  public_id: string;
  article: number | null;
  media_type: ArticleMediaType;
  source_type: ArticleMediaSourceType;
  uploaded_file: string | null;
  external_url: string;
  resolved_url: string;
  alt_text: string;
  caption: string;
  created_by: number;
  upload_session: string | null;
  created_at: string;
  updated_at: string;
}
