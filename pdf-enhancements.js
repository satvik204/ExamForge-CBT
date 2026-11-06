// ExamForge PDF enhancements: manual LaTeX + in-browser diagram cropping.
// Both features edit the existing PDF draft JSON, without sending PDF files to a server.
const byId=id=>document.getElementById(id);
let pdfDoc=null, rendering=false, selection=null, start=null;
function draft(){const data=JSON.parse(byId('pdfDraftJson').value);if(!Array.isArray(data.questions)||!data.questions.length)throw Error('Extract a question paper first.');return data;}
function saveDraft(data){byId('pdfDraftJson').value=JSON.stringify(data,null,2);}
function refreshQuestions(){
  let data;try{data=draft();}catch{return;}
  for(const id of ['pdfMathQuestion','pdfCropQuestion']){
    const select=byId(id),old=select.value;select.replaceChildren();
    data.questions.forEach((q,i)=>{const el=document.createElement('option');el.value=i;el.textContent='Q'+(i+1)+' — '+(q.subject||'General');select.append(el);});
    if(old && Number(old)<data.questions.length)select.value=old;
  }
}
function reportError(err){byId('pdfCropStatus').textContent=String(err?.message||err);}
function mathPreview(){
  const data=draft(),q=data.questions[Number(byId('pdfMathQuestion').value)];if(!q)throw Error('Select a question.');
  const el=byId('pdfMathPreview');el.replaceChildren();
  const p=document.createElement('p');p.textContent=q.text||'';el.append(p);
  for(const [i,option] of (q.options||[]).entries()){
    const line=document.createElement('p');line.textContent='ABCDEF'[i]+'. '+option;el.append(line);
  }
  window.MathJax?.typesetPromise?.([el]).catch(()=>{});
}
function insertMath(){
  const data=draft(),q=data.questions[Number(byId('pdfMathQuestion').value)];
  if(!q)throw Error('Select a question.');
  const expr=byId('pdfMathText').value.trim().replace(/^\$+|\$+$/g,'');
  if(!expr || expr.length>1500)throw Error('Enter a LaTeX expression shorter than 1500 characters.');
  const fragment='$'+expr+'$';
  const target=byId('pdfMathTarget').value;
  if(target==='text')q.text=(q.text||'')+' '+fragment;
  else{
    const idx=Number(target);
    if(!Array.isArray(q.options)||idx>=q.options.length)throw Error('The selected question does not contain that option.');
    q.options[idx]=String(q.options[idx]||'')+' '+fragment;
  }
  saveDraft(data);mathPreview();
}
async function loadDocument(){
  const file=byId('pdfQuestionFile').files?.[0];
  if(!file)throw Error('Select a question-paper PDF first.');
  if(file.size>25*1024*1024)throw Error('Use a PDF smaller than 25 MB.');
  if(pdfDoc){await pdfDoc.destroy();pdfDoc=null;}
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
  pdfDoc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const sel=byId('pdfCropPage');sel.replaceChildren();
  for(let i=1;i<=pdfDoc.numPages;i++){const op=document.createElement('option');op.value=i;op.textContent='Page '+i;sel.append(op);}
  byId('pdfCropStatus').textContent='Select the PDF page and click Show page.';
}
async function showPage(){
  if(rendering)return;
  rendering=true;
  try{
    if(!pdfDoc)await loadDocument();
    const page=await pdfDoc.getPage(Number(byId('pdfCropPage').value));
    const source=page.getViewport({scale:1}),vp=page.getViewport({scale:Math.min(2,1000/source.width)});
    const c=byId('pdfCropCanvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
    byId('pdfCropStage').hidden=false;byId('pdfCropRect').hidden=true;byId('pdfCropSave').disabled=true;
    selection=null;
    await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;
    byId('pdfCropStatus').textContent='Drag to select a diagram or equation. Then click Attach crop.';
  }finally{rendering=false;}
}
const canvas=byId('pdfCropCanvas');
function pos(e){
  const rect=canvas.getBoundingClientRect();
  return {x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))};
}
function draw(a,b){
  const overlay=byId('pdfCropRect');overlay.hidden=false;
  overlay.style.left=(100*Math.min(a.x,b.x))+'%';
  overlay.style.top=(100*Math.min(a.y,b.y))+'%';
  overlay.style.width=(100*Math.abs(a.x-b.x))+'%';
  overlay.style.height=(100*Math.abs(a.y-b.y))+'%';
}
canvas.addEventListener('pointerdown',e=>{
  if(rendering)return;
  start=pos(e);selection=null;byId('pdfCropSave').disabled=true;
  canvas.setPointerCapture(e.pointerId);draw(start,start);
});
canvas.addEventListener('pointermove',e=>{if(start)draw(start,pos(e));});
canvas.addEventListener('pointerup',e=>{
  if(!start)return;
  const end=pos(e),a=start;start=null;draw(a,end);
  const width=Math.abs(end.x-a.x),height=Math.abs(end.y-a.y);
  if(width<.012||height<.012){byId('pdfCropRect').hidden=true;return;}
  selection={x:Math.min(a.x,end.x),y:Math.min(a.y,end.y),w:width,h:height};
  byId('pdfCropSave').disabled=false;
});
canvas.addEventListener('pointercancel',()=>{start=null;});
function saveCrop(){
  if(!selection)throw Error('Select a rectangle on the page first.');
  const data=draft(),i=Number(byId('pdfCropQuestion').value),q=data.questions[i];
  if(!q)throw Error('Choose a question.');
  const sx=Math.floor(selection.x*canvas.width),sy=Math.floor(selection.y*canvas.height);
  const sw=Math.max(1,Math.floor(selection.w*canvas.width)),sh=Math.max(1,Math.floor(selection.h*canvas.height));
  const out=document.createElement('canvas');let scale=Math.min(1,900/sw,900/sh),src='';
  for(let n=0;n<9;n++){
    out.width=Math.max(1,Math.floor(sw*scale));out.height=Math.max(1,Math.floor(sh*scale));
    out.getContext('2d').drawImage(canvas,sx,sy,sw,sh,0,0,out.width,out.height);
    src=out.toDataURL('image/jpeg',Math.max(.45,.8-n*.04));
    if(src.length<160000)break;
    scale*=.75;
  }
  if(src.length>=160000)throw Error('Crop remains too large. Select a smaller diagram.');
  q.image=src;saveDraft(data);
  byId('pdfCropStatus').textContent='Crop attached to Q'+(i+1)+'. Check its image in the CBT preview. To recrop, select again.';
  byId('pdfCropSave').disabled=true;selection=null;byId('pdfCropRect').hidden=true;
}
byId('pdfMathInsert').addEventListener('click',()=>{try{insertMath();}catch(e){reportError(e);}});
byId('pdfMathPreviewBtn').addEventListener('click',()=>{try{mathPreview();}catch(e){reportError(e);}});
byId('pdfCropOpen').addEventListener('click',()=>showPage().catch(reportError));
byId('pdfCropSave').addEventListener('click',()=>{try{saveCrop();}catch(e){reportError(e);}});
byId('pdfCropPage').addEventListener('change',()=>showPage().catch(reportError));
byId('pdfDraftJson').addEventListener('change',refreshQuestions);
byId('pdfDraftJson').addEventListener('input',()=>{if(byId('pdfMathQuestion').options.length===0)refreshQuestions();});
byId('pdfQuestionFile').addEventListener('change',()=>{
  if(pdfDoc){pdfDoc.destroy().catch(()=>{});pdfDoc=null;}
  byId('pdfCropPage').replaceChildren();byId('pdfCropStage').hidden=true;
});
byId('pdfCropOpen').addEventListener('focus',refreshQuestions);
byId('pdfMathQuestion').addEventListener('focus',refreshQuestions);
