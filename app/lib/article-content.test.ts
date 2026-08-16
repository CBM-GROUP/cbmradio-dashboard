import assert from "node:assert/strict";
import test from "node:test";
import { articleToEditorDocument, buildArticlePayload, editorJsonToArticleDocument, legacyBodyToDocument } from "./article-content.ts";

test("sanitizes editor JSON to the CBM schema and preserves supported marks/media ids", () => {
  const document = editorJsonToArticleDocument({ type: "doc", content: [
    { type: "paragraph", content: [{ type: "text", text: "Hello", marks: [{ type: "bold" }, { type: "strike" }] }] },
    { type: "image", attrs: { media_id: "public-uuid", src: "/media/a.png", alt: "Alt", caption: "Caption", numeric_id: 99 } },
  ] });
  assert.equal(document.content[0].content?.[0].marks?.length, 1);
  assert.equal(document.content[1].attrs?.media_id, "public-uuid");
  assert.notEqual(document.content[1].attrs?.media_id, 99);
  assert.equal(document.content[1].attrs?.numeric_id, undefined);
});

test("converts legacy body conservatively", () => {
  const document = legacyBodyToDocument("First line\ncontinued\n\nSecond paragraph");
  assert.equal(document.content.length, 2);
  assert.equal(document.content[0].content?.[1].type, "hardBreak");
  assert.deepEqual(articleToEditorDocument({ content_json: null, body: "Legacy" }), legacyBodyToDocument("Legacy"));
});

test("publishing preserves an existing timestamp and draft clears it", () => {
  const base = { title: "Title", author: "Author", categoryId: null, document: legacyBodyToDocument("Body"), isFeatured: false, coverImage: "", publishedAt: null };
  assert.equal(buildArticlePayload(base, "publish", { is_published: true, published_at: "2025-01-02T03:04:05Z" }).published_at, "2025-01-02T03:04:05Z");
  assert.equal(typeof buildArticlePayload(base, "publish").published_at, "string");
  assert.equal(buildArticlePayload(base, "draft", { is_published: true, published_at: "2025-01-02T03:04:05Z" }).published_at, null);
  assert.equal(buildArticlePayload(base, "draft").is_published, false);
});
