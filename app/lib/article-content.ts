import type { JSONContent } from "@tiptap/react";
import type { ArticleDocument, ArticleMark, ArticleNode, DashboardArticle } from "../types/articles";

const nodes = new Set(["doc", "paragraph", "heading", "text", "bulletList", "orderedList", "listItem", "blockquote", "image", "youtube", "horizontalRule", "hardBreak"]);
const marks = new Set(["bold", "italic", "link"]);

function safeMark(mark: JSONContent): ArticleMark | null {
  if (!mark.type || !marks.has(mark.type)) return null;
  if (mark.type === "link") {
    const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
    if (!safeHref(href)) return null;
    return { type: "link", attrs: { href } };
  }
  return { type: mark.type as "bold" | "italic" };
}

function sanitizeNode(value: JSONContent): ArticleNode | null {
  if (!value.type || !nodes.has(value.type)) return null;
  const node: ArticleNode = { type: value.type };
  if (value.type === "text") node.text = value.text || "";
  if (Array.isArray(value.marks)) {
    const safe = value.marks.map(safeMark).filter((item): item is ArticleMark => Boolean(item));
    if (safe.length) node.marks = safe;
  }
  const attrs=value.attrs&&typeof value.attrs==="object"?value.attrs:{};
  if(value.type==="heading")node.attrs={level:attrs.level};
  if(value.type==="orderedList")node.attrs={start:attrs.start};
  if(value.type==="image")node.attrs={media_id:attrs.media_id,src:attrs.src,alt:attrs.alt,caption:attrs.caption};
  if(value.type==="youtube")node.attrs={media_id:attrs.media_id,url:attrs.url,caption:attrs.caption};
  if (Array.isArray(value.content)) {
    node.content = value.content.map(sanitizeNode).filter((item): item is ArticleNode => Boolean(item));
  }
  return node;
}

export function editorJsonToArticleDocument(json: JSONContent): ArticleDocument {
  const sanitized = sanitizeNode(json);
  return sanitized?.type === "doc"
    ? { type: "doc", content: sanitized.content || [] }
    : { type: "doc", content: [] };
}

export function legacyBodyToDocument(body: string): ArticleDocument {
  const paragraphs = body.replace(/\r\n/g, "\n").split(/\n{2,}/).map((value) => value.trim()).filter(Boolean);
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: paragraph.split("\n").flatMap((line, index) => [
        ...(index ? [{ type: "hardBreak" } satisfies ArticleNode] : []),
        { type: "text", text: line } satisfies ArticleNode,
      ]),
    })),
  };
}

export function articleToEditorDocument(article: Pick<DashboardArticle, "content_json" | "body">): ArticleDocument {
  return article.content_json || legacyBodyToDocument(article.body || "");
}

export function buildArticlePayload(article: {
  title: string; author: string; categoryId: number | null; document: ArticleDocument;
  isFeatured: boolean; coverImage: string; publishedAt: string | null;
}, action: "draft" | "publish", existing?: Pick<DashboardArticle, "is_published" | "published_at">) {
  const publishing = action === "publish";
  return {
    title: article.title.trim(), author: article.author.trim(), category_id: article.categoryId,
    content_json: article.document, content_schema_version: 1,
    is_featured: article.isFeatured, cover_image: article.coverImage.trim(),
    is_published: publishing,
    published_at: publishing ? existing?.published_at || article.publishedAt || new Date().toISOString() : null,
  };
}

export function safeHref(value: string) {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try { return ["http:", "https:", "mailto:", "tel:"].includes(new URL(href).protocol); }
  catch { return false; }
}
