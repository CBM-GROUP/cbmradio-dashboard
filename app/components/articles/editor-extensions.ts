import Image from "@tiptap/extension-image";
import { Node, mergeAttributes } from "@tiptap/core";

export const ArticleImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(), media_id: { default: "" }, alt: { default: "" },
      caption: { default: "" }, src: { default: "" },
    };
  },
  renderHTML({ HTMLAttributes }) { return ["img", mergeAttributes(HTMLAttributes, { "data-media-id": HTMLAttributes.media_id })]; },
});

export const ArticleYouTube = Node.create({
  name: "youtube", group: "block", atom: true, selectable: true,
  addAttributes() { return { media_id: { default: "" }, url: { default: "" }, caption: { default: "" } }; },
  parseHTML() { return [{ tag: "iframe[data-article-youtube]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", { class: "article-video-node" }, ["iframe", {
      src: HTMLAttributes.url, title: HTMLAttributes.caption || "Article video",
      "data-article-youtube": "true", "data-media-id": HTMLAttributes.media_id,
      allowfullscreen: "true",
    }]];
  },
});
