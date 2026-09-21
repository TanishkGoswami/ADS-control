import type { DetectionEvidence } from '../detector/types.ts';

interface Account { id:string; name:string; internalAlias?:string; metaAdAccountId:string; }
interface AssistantContext { paired:boolean; exactAccountId?:string; accounts?:Account[]; lots?:Array<{id:string;availableAmountMinor:string;status:string}>; requests?:Array<{id:string;referenceCode:string;purpose:string;amountMinor:string;targetAdAccountId?:string}>; error?:string; }
type Send=(message:Record<string,unknown>)=>Promise<any>;
const money=(minor?:string)=>minor?new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(minor)/100):'Amount unavailable';
const shortId=(id?:string)=>id&&id.length>4?`ending ${id.slice(-4)}`:'';

function row(label:string,value:string,detail?:string){const item=document.createElement('div');item.className='ac-row';const key=document.createElement('span');key.textContent=label;const content=document.createElement('div');const strong=document.createElement('strong');strong.textContent=value;content.append(strong);if(detail){const small=document.createElement('small');small.textContent=detail;content.append(small);}item.append(key,content);return item;}
function field(label:string,control:HTMLElement){const wrap=document.createElement('label');wrap.className='ac-field';const text=document.createElement('span');text.textContent=label;wrap.append(text,control);return wrap;}
function button(label:string){const el=document.createElement('button');el.type='button';el.className='ac-button';el.textContent=label;return el;}
function message(text:string,tone:'info'|'error'='info'){const el=document.createElement('p');el.className=`ac-feedback ${tone==='error'?'ac-feedback--error':''}`;el.textContent=text;return el;}

export function renderOverlay(container:HTMLElement,evidence:DetectionEvidence,context:AssistantContext,send:Send,onClose:()=>void):void{
  container.replaceChildren();
  const account=context.accounts?.find(item=>item.id===context.exactAccountId);const detectedName=evidence.visibleAccountName||account?.internalAlias||account?.name||'Meta ad account';const detectedId=evidence.visibleAccountId||evidence.urlAccountId;
  const header=document.createElement('div');header.className='ac-header';const title=document.createElement('strong');title.textContent='Ads Control assistant';const actions=document.createElement('div');actions.className='ac-header-actions';const status=document.createElement('span');status.className=evidence.blocked||!context.exactAccountId?'ac-status ac-status--blocked':'ac-status';status.textContent=evidence.blocked?'Mismatch':context.exactAccountId?'Account matched':'Not connected';const close=document.createElement('button');close.type='button';close.className='ac-close';close.title='Close assistant';close.setAttribute('aria-label','Close assistant');close.textContent='×';close.onclick=onClose;actions.append(status,close);header.append(title,actions);
  const body=document.createElement('div');body.className='ac-body';body.append(row('Account',detectedName,shortId(detectedId)),row('Amount',evidence.amountText??'Not detected'),row('Payment','QR ready'));

  if(!context.paired){body.append(message('Pair this browser from the extension icon before mapping funds.','error'));}
  else if(evidence.blocked){body.append(message('The account in the URL and payment dialog do not match. Mapping is blocked.','error'));}
  else if(!context.exactAccountId){body.append(message(`${detectedName} is not synced or assigned in ADS Control. Sync Meta assets, then reopen this payment QR.`,'error'));}
  else if(!evidence.amountMinor||evidence.currencyCode!=='INR'){body.append(message('A valid INR payment amount could not be detected.','error'));}
  else {
    const source=document.createElement('select');source.append(new Option('Select approved source',''));
    for(const request of context.requests??[]){if(request.amountMinor!==evidence.amountMinor||request.targetAdAccountId&&request.targetAdAccountId!==account!.id)continue;source.append(new Option(`${request.referenceCode} · ${request.purpose} · ${money(request.amountMinor)}`,`FUNDING_REQUEST:${request.id}`));}
    for(const lot of context.lots??[]){if(BigInt(lot.availableAmountMinor||'0')<BigInt(evidence.amountMinor))continue;source.append(new Option(`Available funds · ${money(lot.availableAmountMinor)}`,`FUND_LOT:${lot.id}`));}
    body.append(field('Funding source',source));
    if(source.options.length===1){body.append(message(`No approved source can cover ${money(evidence.amountMinor)}. Create and approve a funding request, or add an eligible INR fund lot.`,'error'));}
    const map=button('Map approved funds');map.disabled=true;source.onchange=()=>{map.disabled=!source.value;};const feedback=message('');map.onclick=async()=>{map.disabled=true;feedback.textContent='Mapping funds...';const [sourceType,sourceId]=source.value.split(':');const result=await send({type:'MAP_TOPUP',evidence,selectedAdAccountId:account!.id,sourceType,sourceId});feedback.textContent=result?.error||'Mapped. Complete the payment in Meta; success will be sent for review.';feedback.className=`ac-feedback ${result?.error?'ac-feedback--error':''}`;if(result?.error)map.disabled=false;};body.append(map,feedback);
  }
  container.append(header,body);
}
