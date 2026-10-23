/** Framework-independent typed-ish client for either React implementation.
 * No UI/UX choices; no authorization tokens stored here; both options use same backend contract.
 * Wire to approved auth/context adapter. API operations are PROVISIONAL pending runtime verification.
 */
export type FormAnswer = {
  fieldCode:string; optionCode?:string; optionCodes?:string[];
  valueText?:string; valueNumber?:number; valueBoolean?:boolean; valueDate?:string;
};
export type CreateServiceItem = {sellableItemUuid:string; answers:FormAnswer[]; isRedo?:boolean;redoOfItemUuid?:string;serviceNotes?:string};
export type ServiceItem = {uuid:string;orderUuid:string;sellableItemUuid:string;status:string;answers:FormAnswer[];
  lineNumber?:number;isRedo?:boolean;isInvoiced?:boolean;currencyCode?:string;unitPrice?:string;lineTotal?:string;serviceNotes?:string};
export type TokenSource = ()=>Promise<string> | string;
export class ApiError extends Error {constructor(public status:number,public body:unknown){super('New CP API request failed ('+status+')')}}
export function makeNewCpDemoClient(baseUrl:string, tokenSource:TokenSource) {
  const root=baseUrl.replace(/\/$/,'');
  async function invoke<T>(path:string, init:RequestInit={}):Promise<T> {
    const token=await tokenSource();
    const res=await fetch(root+path,{...init,headers:{'Authorization':'Bearer '+token,'Accept':'application/json',
      ...(init.body?{'Content-Type':'application/json'}:{}),...(init.headers||{})}});
    const body=await res.json().catch(()=>null);
    if(!res.ok)throw new ApiError(res.status,body);
    return body as T;
  }
  const esc=encodeURIComponent;
  return {
    catalog: (categoryCode?:string)=>invoke<unknown[]>(`/api/v1/catalog/services${categoryCode?'?categoryCode='+esc(categoryCode):''}`),
    formSchema: (serviceUuid:string)=>invoke<unknown>(`/api/v1/catalog/services/${esc(serviceUuid)}/form-schema`),
    orderItems: (orderUuid:string)=>invoke<ServiceItem[]>(`/api/v1/orders/${esc(orderUuid)}/services`),
    create: (orderUuid:string,item:CreateServiceItem,idempotencyKey?:string)=>invoke<ServiceItem>(`/api/v1/orders/${esc(orderUuid)}/services`,
      {method:'POST',headers:idempotencyKey?{'Idempotency-Key':idempotencyKey}:{},body:JSON.stringify(item)}),
    item: (serviceItemUuid:string)=>invoke<ServiceItem>(`/api/v1/services/${esc(serviceItemUuid)}`),
    edit: (serviceItemUuid:string,patch:Partial<Pick<ServiceItem,'answers'|'isRedo'|'serviceNotes'>>)=>invoke<ServiceItem>(`/api/v1/services/${esc(serviceItemUuid)}`,
      {method:'PATCH',body:JSON.stringify(patch)}),
    availableTransitions: (serviceItemUuid:string)=>invoke<unknown[]>(`/api/v1/services/${esc(serviceItemUuid)}/available-transitions`),
    transition: (serviceItemUuid:string,transitionId:number)=>invoke<unknown>(`/api/v1/services/${esc(serviceItemUuid)}/transitions`,
      {method:'POST',body:JSON.stringify({transitionId})}),
    history: (serviceItemUuid:string)=>invoke<unknown[]>(`/api/v1/services/${esc(serviceItemUuid)}/history`)
  };
}
