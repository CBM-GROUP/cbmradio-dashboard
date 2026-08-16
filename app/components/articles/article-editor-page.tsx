"use client";

import { ArrowLeft, Save, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "../toast";
import { SiteImageFields } from "../site-image-fields";
import { Button, ButtonLink } from "../ui/button";
import { Checkbox, Input, Select } from "../ui/form-controls";
import { Card, ErrorState, LoadingState, PageHeader, StatusBadge } from "../ui/surfaces";
import { apiClient, isApiError } from "../../lib/api-client";
import { articleToEditorDocument, buildArticlePayload, legacyBodyToDocument } from "../../lib/article-content";
import type { PaginatedResponse } from "../../types/api";
import type { ArticleCategory, ArticleDocument, DashboardArticle } from "../../types/articles";
import type { ArticleMedia } from "../../types/article-media";
import RichArticleEditor from "./rich-article-editor";

async function loadActiveCategories() {
  const categories: ArticleCategory[]=[]; let next="/api/article-categories?page=1&ordering=display_order,name"; const visited=new Set<string>();
  while(next&&!visited.has(next)&&visited.size<25){visited.add(next);const page=await apiClient.get<PaginatedResponse<ArticleCategory>>(next);categories.push(...page.results.filter(item=>item.is_active));if(!page.next)break;next=`/api/article-categories${new URL(page.next).search}`;}
  return categories;
}
async function loadArticleMedia(articleId:string){const records:ArticleMedia[]=[];let next=`/api/article-media?article=${encodeURIComponent(articleId)}&page=1`;const visited=new Set<string>();while(next&&!visited.has(next)&&visited.size<25){visited.add(next);const page=await apiClient.get<PaginatedResponse<ArticleMedia>>(next);records.push(...page.results);if(!page.next)break;next=`/api/article-media${new URL(page.next).search}`;}return records;}

export default function ArticleEditorPage({ slug }: { slug?:string }) {
  const router=useRouter(); const [article,setArticle]=useState<DashboardArticle|null>(null); const [categories,setCategories]=useState<ArticleCategory[]>([]);
  const [loading,setLoading]=useState(Boolean(slug)); const [loadError,setLoadError]=useState(""); const [categoriesError,setCategoriesError]=useState("");
  const [title,setTitle]=useState(""); const [author,setAuthor]=useState("CBM Radio"); const [categoryId,setCategoryId]=useState<number|null>(null); const [isFeatured,setIsFeatured]=useState(false);
  const [coverImage,setCoverImage]=useState(""); const [coverFile,setCoverFile]=useState<File|null>(null); const [document,setDocument]=useState<ArticleDocument>(()=>legacyBodyToDocument(""));
  const [publishedAt,setPublishedAt]=useState<string|null>(null); const [dirty,setDirty]=useState(false); const [saving,setSaving]=useState<"draft"|"publish"|null>(null);
  const [publicationChanged,setPublicationChanged]=useState(false); const [existingMedia,setExistingMedia]=useState<ArticleMedia[]>([]);
  const [formError,setFormError]=useState(""); const [fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({}); const [toast,setToast]=useState<string|null>(null);
  const populate=useCallback((item:DashboardArticle)=>{setArticle(item);setTitle(item.title);setAuthor(item.author);setCategoryId(item.category?.id||null);setIsFeatured(item.is_featured);setCoverImage(item.external_cover_image_url||"");setPublishedAt(item.published_at);setPublicationChanged(false);setDocument(articleToEditorDocument(item));setDirty(false);},[]);
  const load=useCallback(async()=>{if(!slug)return;setLoading(true);setLoadError("");try{const item=await apiClient.get<DashboardArticle>(`/api/articles?slug=${encodeURIComponent(slug)}`);populate(item);setExistingMedia(await loadArticleMedia(item.id));}catch(value){setLoadError(isApiError(value)&&value.status===404?"This Article could not be found.":isApiError(value)?value.message:"Unable to load the Article.");}finally{setLoading(false);}},[populate,slug]);
  useEffect(()=>{const timer=window.setTimeout(()=>{void load();loadActiveCategories().then(setCategories).catch(value=>setCategoriesError(isApiError(value)?value.message:"Categories could not be loaded."));},0);return()=>window.clearTimeout(timer);},[load]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue="";}};window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
  const publishLabel=article?.is_published?"Update published article":"Publish article";
  const publicationInput=useMemo(()=>publishedAt?toLocalDateTime(publishedAt):"",[publishedAt]);
  const save=async(action:"draft"|"publish")=>{if(saving)return;if(!title.trim()){setFieldErrors({title:["Enter an Article title."]});return;}setSaving(action);setFormError("");setFieldErrors({});const existingPublication=article?{...article,published_at:publicationChanged?null:article.published_at}:undefined;const payload=buildArticlePayload({title,author,categoryId,document,isFeatured,coverImage,publishedAt},action,existingPublication);try{let saved:DashboardArticle;if(coverFile){const form=new FormData();if(slug)form.set("slug",slug);for(const [key,value] of Object.entries(payload)){if(key==="content_json")form.set(key,JSON.stringify(value));else if(value===null)form.set(key,"");else form.set(key,String(value));}form.set("uploaded_cover_image",coverFile);saved=await (slug?apiClient.put("/api/articles",form):apiClient.post("/api/articles",form));}else{saved=await (slug?apiClient.put("/api/articles",{slug,...payload}):apiClient.post("/api/articles",payload));}populate(saved);setCoverFile(null);setToast(action==="publish"?"Article published successfully.":"Draft saved successfully.");if(!slug)router.replace(`/dashboard/articles/${encodeURIComponent(saved.slug)}/edit`);}catch(value){if(isApiError(value)){setFormError(value.message);setFieldErrors(value.fieldErrors||{});}else setFormError("Unable to save the Article.");}finally{setSaving(null);}};
  if(loading)return <LoadingState label="Loading Article editor…"/>;
  if(loadError)return <ErrorState title="Article unavailable" message={loadError} onRetry={()=>void load()}/>;
  return <div className="article-editor-page view-fade"><Toast message={toast} onDismiss={()=>setToast(null)}/><PageHeader title={slug?"Edit Article":"Create Article"} description="Write structured content and manage publication settings." secondaryAction={<ButtonLink href="/dashboard/articles" variant="outline" icon={<ArrowLeft/>}>Articles</ButtonLink>} primaryAction={article?<StatusBadge status={article.is_published?"published":"draft"}/>:undefined}/>
    <div className="article-editor-layout"><main className="article-writing-column"><Card className="article-title-card"><Input label="Article title" required value={title} error={fieldErrors.title?.[0]} onChange={event=>{setTitle(event.target.value);setDirty(true);}} placeholder="Enter a clear headline"/></Card><Card className="article-canvas-card"><RichArticleEditor initialDocument={document} existingMedia={existingMedia} onChange={value=>{setDocument(value);setDirty(true);}}/>{fieldErrors.content_json?.[0]&&<p className="ui-field-error">{fieldErrors.content_json[0]}</p>}</Card></main>
    <aside className="article-settings-column"><Card><h2>Editorial settings</h2><Select label="Category" value={categoryId||""} error={fieldErrors.category_id?.[0]} onChange={event=>{setCategoryId(event.target.value?Number(event.target.value):null);setDirty(true);}}><option value="">No category</option>{categories.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select>{categoriesError&&<p className="ui-field-error">{categoriesError}</p>}<Input label="Author" required value={author} error={fieldErrors.author?.[0]} onChange={event=>{setAuthor(event.target.value);setDirty(true);}}/><Checkbox label="Feature this Article" checked={isFeatured} onChange={event=>{setIsFeatured(event.target.checked);setDirty(true);}}/></Card>
    <Card><h2>Featured image</h2><SiteImageFields currentUrl={article?.cover_image} externalUrl={coverImage} file={coverFile} onExternalUrlChange={value=>{setCoverImage(value);setDirty(true);}} onFileChange={value=>{setCoverFile(value);setDirty(true);}}/></Card>
    <Card><h2>Publication</h2><Input label="Publication date and time" type="datetime-local" value={publicationInput} helperText="Optional for first publication. Existing publication time is preserved unless changed here." onChange={event=>{setPublishedAt(event.target.value?new Date(event.target.value).toISOString():null);setPublicationChanged(true);setDirty(true);}}/>{formError&&<p className="ui-field-error" role="alert">{formError}</p>}<div className="publishing-actions"><Button variant="outline" icon={<Save/>} loading={saving==="draft"} disabled={Boolean(saving)} onClick={()=>void save("draft")}>{article?.is_published?"Return to draft":"Save draft"}</Button><Button icon={<Send/>} loading={saving==="publish"} disabled={Boolean(saving)} onClick={()=>void save("publish")}>{publishLabel}</Button></div></Card></aside></div>
  </div>;
}

function toLocalDateTime(value:string){const date=new Date(value);if(Number.isNaN(date.getTime()))return "";const offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,16);}
