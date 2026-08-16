"use client";

import { Plus, Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Toast, { type ToastVariant } from "../../../components/toast";
import { Button, ButtonLink } from "../../../components/ui/button";
import { ConfirmationDialog } from "../../../components/ui/confirmation-dialog";
import { Checkbox, Input, Textarea } from "../../../components/ui/form-controls";
import { Pagination } from "../../../components/ui/pagination";
import { Card, EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge } from "../../../components/ui/surfaces";
import { apiClient, isApiError } from "../../../lib/api-client";
import type { PaginatedResponse } from "../../../types/api";
import type { ArticleCategory } from "../../../types/articles";

const emptyPage: PaginatedResponse<ArticleCategory> = { count: 0, next: null, previous: null, results: [] };
type Form = { name: string; description: string; is_active: boolean; display_order: number };
const emptyForm: Form = { name: "", description: "", is_active: true, display_order: 0 };

export default function ArticleCategoriesPage() {
  const [data,setData]=useState(emptyPage); const [page,setPage]=useState(1); const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [editing,setEditing]=useState<ArticleCategory|null>(null);
  const [form,setForm]=useState<Form>(emptyForm); const [showForm,setShowForm]=useState(false); const [saving,setSaving]=useState(false);
  const [formError,setFormError]=useState(""); const [fieldErrors,setFieldErrors]=useState<Record<string,string[]>>({});
  const [deleteTarget,setDeleteTarget]=useState<ArticleCategory|null>(null); const [deleteError,setDeleteError]=useState(""); const [deleting,setDeleting]=useState(false);
  const [toast,setToast]=useState<{message:string;variant:ToastVariant}|null>(null);
  const load=useCallback(async()=>{const params=new URLSearchParams({page:String(page),ordering:"display_order,name"});if(search.trim())params.set("search",search.trim());setError("");try{setData(await apiClient.get(`/api/article-categories?${params}`));}catch(value){setError(isApiError(value)?value.message:"Unable to load categories.");}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),250);return()=>window.clearTimeout(timer);},[load]);
  const close=()=>{setShowForm(false);setEditing(null);setForm(emptyForm);setFormError("");setFieldErrors({});};
  const edit=(item:ArticleCategory)=>{setEditing(item);setForm({name:item.name,description:item.description,is_active:item.is_active,display_order:item.display_order});setShowForm(true);};
  const save=async(event:React.FormEvent)=>{event.preventDefault();setSaving(true);setFormError("");setFieldErrors({});try{const payload={...form,...(editing?{slug:editing.slug}:{})};await(editing?apiClient.put("/api/article-categories",payload):apiClient.post("/api/article-categories",payload));setToast({message:editing?"Category updated.":"Category created.",variant:"success"});close();await load();}catch(value){if(isApiError(value)){setFormError(value.message);setFieldErrors(value.fieldErrors||{});}else setFormError("Unable to save category.");}finally{setSaving(false);}};
  const remove=async()=>{if(!deleteTarget)return;setDeleting(true);setDeleteError("");try{await apiClient.delete(`/api/article-categories?slug=${encodeURIComponent(deleteTarget.slug)}`);setToast({message:"Category deleted.",variant:"success"});setDeleteTarget(null);await load();}catch(value){setDeleteError(isApiError(value)?value.message:"Unable to delete category.");}finally{setDeleting(false);}};
  return <div className="space-y-6 view-fade"><Toast message={toast?.message||null} variant={toast?.variant} onDismiss={()=>setToast(null)}/>
    <PageHeader title="Article Categories" description="Organize news content and control which categories are available publicly." secondaryAction={<ButtonLink href="/dashboard/articles" variant="outline">Back to articles</ButtonLink>} primaryAction={<Button icon={<Plus/>} onClick={()=>showForm?close():setShowForm(true)}>{showForm?"Close form":"Add category"}</Button>}/>
    {showForm&&<Card><form onSubmit={save} className="category-form"><Input label="Name" required value={form.name} error={fieldErrors.name?.[0]} onChange={event=>setForm({...form,name:event.target.value})}/><Textarea label="Description" value={form.description} error={fieldErrors.description?.[0]} onChange={event=>setForm({...form,description:event.target.value})}/><Input label="Display order" type="number" min={0} value={form.display_order} error={fieldErrors.display_order?.[0]} onChange={event=>setForm({...form,display_order:Number(event.target.value)})}/><Checkbox label="Active and available publicly" checked={form.is_active} onChange={event=>setForm({...form,is_active:event.target.checked})}/>{editing&&<p className="ui-field-help">Slug: {editing.slug}</p>}{formError&&<p className="ui-field-error" role="alert">{formError}</p>}<div className="editor-actions"><Button variant="outline" onClick={close} disabled={saving}>Cancel</Button><Button type="submit" loading={saving} loadingLabel="Saving…">{editing?"Update category":"Create category"}</Button></div></form></Card>}
    <Input label="Search categories" value={search} onChange={event=>{setSearch(event.target.value);setPage(1);}}/>
    {loading?<LoadingState label="Loading categories…"/>:error&&!data.results.length?<ErrorState message={error} onRetry={()=>void load()}/>:!data.results.length?<EmptyState icon={<Tags/>} title="No categories found" description="Create a category to organize Articles."/>:<><div className="category-grid">{data.results.map(item=><Card key={item.id} className="category-card"><div><div className="editor-heading-row"><h2>{item.name}</h2><StatusBadge status={item.is_active?"active":"inactive"}/></div><p>{item.description||"No description."}</p><small>/{item.slug} · Order {item.display_order}</small></div><div className="editor-actions"><Button variant="ghost" onClick={()=>edit(item)}>Edit</Button><Button variant="ghost" className="program-delete-button" onClick={()=>setDeleteTarget(item)}>Delete</Button></div></Card>)}</div><Pagination count={data.count} currentPage={page} hasNext={Boolean(data.next)} hasPrevious={Boolean(data.previous)} onNext={()=>setPage(value=>value+1)} onPrevious={()=>setPage(value=>Math.max(1,value-1))}/></>}
    <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete category?" description={deleteTarget?`Delete “${deleteTarget.name}”? Categories assigned to Articles cannot be deleted; deactivate them instead.`:""} loading={deleting} error={deleteError} onConfirm={()=>void remove()} onCancel={()=>{setDeleteTarget(null);setDeleteError("");}}/>
  </div>;
}
