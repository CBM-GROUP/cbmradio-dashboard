import type { NormalizedApiError } from "../types/api";

export const SESSION_EXPIRED_EVENT = "dashboard:session-expired";
type ApiOptions = Omit<RequestInit,"body"|"headers"> & { body?:unknown|FormData; headers?:HeadersInit; timeoutMs?:number };

function collectFieldErrors(value:unknown):Record<string,string[]>|undefined {
  if(!value||typeof value!=="object"||Array.isArray(value))return;
  const ignored=new Set(["detail","message","error","code","non_field_errors","details"]); const result:Record<string,string[]>={};
  for(const [key,item] of Object.entries(value)){if(ignored.has(key))continue;if(Array.isArray(item)){const messages=item.filter((entry):entry is string=>typeof entry==="string");if(messages.length)result[key]=messages;}else if(typeof item==="string")result[key]=[item];}
  const nested=collectFieldErrors((value as Record<string,unknown>).details);if(nested)Object.assign(result,nested);
  return Object.keys(result).length?result:undefined;
}
function safeMessage(value:unknown):string|undefined { if(typeof value==="string"&&value.trim()&&!value.trim().startsWith("<"))return value.trim(); if(Array.isArray(value)){const first=value.find((entry)=>typeof entry==="string");return typeof first==="string"?first:undefined;} if(value&&typeof value==="object"){for(const key of ["message","detail","error","non_field_errors"]){const message=safeMessage((value as Record<string,unknown>)[key]);if(message)return message;}const details=(value as Record<string,unknown>).details;const nested=safeMessage(details);if(nested)return nested;for(const item of Object.values(value as Record<string,unknown>)){const message=safeMessage(item);if(message)return message;}} }
async function parseResponse(response:Response):Promise<unknown>{if(response.status===204)return undefined;const text=await response.text();if(!text)return undefined;const type=response.headers.get("content-type")||"";if(type.includes("json")){try{return JSON.parse(text) as unknown;}catch{return undefined;}}return text.trim().startsWith("<")?undefined:text;}

export async function apiRequest<T>(url:string, options:ApiOptions={}):Promise<T>{
  const {body,timeoutMs,signal,headers:incomingHeaders,...init}=options;const headers=new Headers(incomingHeaders);let requestBody:BodyInit|undefined;
  if(body instanceof FormData)requestBody=body;else if(body!==undefined){headers.set("Content-Type","application/json");requestBody=JSON.stringify(body);}
  const timeoutController=timeoutMs?new AbortController():null;const timeout=timeoutController?window.setTimeout(()=>timeoutController.abort(),timeoutMs):null;
  const combinedSignal=timeoutController&&signal?AbortSignal.any([signal,timeoutController.signal]):timeoutController?.signal||signal;
  try{const response=await fetch(url,{...init,headers,body:requestBody,signal:combinedSignal});const data=await parseResponse(response);if(!response.ok){const fallbackMessage=response.status===401?"Your administrator session has expired. Please sign in again.":response.status===403?"You do not have permission to perform this action.":response.status>=500?`The backend server encountered an error (HTTP ${response.status}).`:"The request could not be completed.";const error:NormalizedApiError={status:response.status,message:safeMessage(data)||fallbackMessage,fieldErrors:collectFieldErrors(data),code:data&&typeof data==="object"&&typeof(data as Record<string,unknown>).code==="string"?(data as Record<string,string>).code:undefined};if(response.status===401&&typeof window!=="undefined")window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT,{detail:error}));throw error;}return data as T;}finally{if(timeout!==null)window.clearTimeout(timeout);}
}
export const apiClient={get:<T>(url:string,options:ApiOptions={})=>apiRequest<T>(url,{...options,method:"GET"}),post:<T>(url:string,body?:unknown|FormData,options:ApiOptions={})=>apiRequest<T>(url,{...options,method:"POST",body}),put:<T>(url:string,body?:unknown|FormData,options:ApiOptions={})=>apiRequest<T>(url,{...options,method:"PUT",body}),patch:<T>(url:string,body?:unknown|FormData,options:ApiOptions={})=>apiRequest<T>(url,{...options,method:"PATCH",body}),delete:<T>(url:string,options:ApiOptions={})=>apiRequest<T>(url,{...options,method:"DELETE"})};
export function isApiError(error:unknown):error is NormalizedApiError{return Boolean(error&&typeof error==="object"&&typeof(error as NormalizedApiError).status==="number"&&typeof(error as NormalizedApiError).message==="string");}
