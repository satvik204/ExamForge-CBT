// Experimental standalone PDF conversion tool. Does not authenticate or write to Firebase.
const $=id=>document.getElementById(id);
function errorMessage(e){return String(e?.message||e);}
function toast(message,bad=false){$('pdfImportStatus').textContent=(bad?'Error: ':'')+message;}
const ABC='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function cleanText(x, max=25000) { return String(x ?? '').trim().slice(0,max); }
function numeric(x, field, min, max) {
  const n=Number(x); if (!Number.isFinite(n) || n<min || n>max) throw Error(`${field} must be between ${min} and ${max}.`); return n;
}
function normalizeOptions(opts) {
  if (Array.isArray(opts)) return opts.map(v => cleanText(v,5000));
  if (opts && typeof opts === 'object') return Object.keys(opts).sort().map(k => cleanText(opts[k],5000));
  return [];
}
function answerLetters(answer) {
  const a = Array.isArray(answer) ? answer.map(String) : String(answer ?? '').split(/[;,\s]+/);
  return [...new Set(a.map(x=>x.trim().toUpperCase()).filter(Boolean))].sort();
}
function normalizePack(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.questions)) throw Error('Use a JSON object containing a "questions" array.');
  const title=cleanText(input.title || 'Untitled CBT',140);
  const durationMinutes=numeric(input.durationMinutes ?? input.duration ?? 180,'Duration',1,300);
  const correct=numeric(input.marking?.correct ?? 4,'Marks for correct answer',0,20);
  const wrong=numeric(input.marking?.wrong ?? -1,'Marks for incorrect answer',-20,0);
  if (!input.questions.length || input.questions.length>300) throw Error('A test must contain 1–300 questions.');
  const questions=input.questions.map((q,i)=>{
    const subject=cleanText(q.subject || 'General',48) || 'General';
    const type=({mcq:'single',single:'single',multi:'multi',multiple:'multi',numerical:'numerical',numeric:'numerical',integer:'numerical'})[String(q.type||'single').toLowerCase()];
    if (!type) throw Error(`Question ${i+1}: type must be single, multi, or numerical.`);
    const text=cleanText(q.text || q.question,18000);
    const image=cleanText(q.image || '',180000);
    if (!text && !image) throw Error(`Question ${i+1} has no text or image.`);
    if (image && !/^(?:https:\/\/|data:image\/(?:webp|png|jpeg);base64,)/i.test(image)) throw Error(`Question ${i+1}: image must be an HTTPS URL or an embedded WebP/PNG/JPEG data URL.`);
    let options=normalizeOptions(q.options);
    let answer;
    if (type==='numerical') {
      options=[]; answer=numeric(q.answer,`Question ${i+1} numerical answer`,-1e12,1e12);
    } else {
      if (options.length<2 || options.length>6 || options.some(x=>!x)) throw Error(`Question ${i+1}: include 2–6 nonempty options.`);
      const letters=answerLetters(q.answer);
      if (!letters.length || letters.some(x=>x.length!==1 || !ABC.slice(0,options.length).includes(x))) throw Error(`Question ${i+1}: invalid correct option(s).`);
      if (type==='single' && letters.length!==1) throw Error(`Question ${i+1}: single correct needs exactly one answer.`);
      answer=type==='single'?letters[0]:letters;
    }
    const tolerance=type==='numerical'?numeric(q.tolerance??0.001,'Tolerance',0,100):0;
    const marks=q.marks == null ? correct : numeric(q.marks,`Question ${i+1} marks`,0,20);
    const negativeMarks=q.negativeMarks == null ? wrong : numeric(q.negativeMarks,`Question ${i+1} negative marks`,-20,0);
    return { id: cleanText(q.id || `Q${i+1}`,40), subject,type,text,image,options,answer,tolerance,marks,negativeMarks,explanation:cleanText(q.explanation,7000),bonus:Boolean(q.bonus) };
  });
  const pack={version:1,title,durationMinutes,marking:{correct,wrong},questions};
  if (JSON.stringify(pack).length>900000) throw Error('This test is too large for a live room. Reduce image/text length or split the paper.');
  return pack;
}
function encodePack(pack) {
  const bytes=new TextEncoder().encode(JSON.stringify(pack));
  let binary=''; for(let i=0;i<bytes.length;i+=8192) binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return 'EF1:'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
// Browser-only PDF importer. PDF.js extracts selectable text; it cannot OCR scans,
// rebuild diagrams or guarantee correct option segmentation. All results require review.
let pdfJsLoader=null;
async function pdfJs(){
  if(!pdfJsLoader)pdfJsLoader=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs').then(lib=>{
    lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    return lib;
  });
  return pdfJsLoader;
}
async function extractPdfText(file){
  if(!file)return '';
  if(file.size>25*1024*1024)throw Error('PDF is over the 25 MB browser-import limit.');
  const lib=await pdfJs(),doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  if(doc.numPages>120)throw Error('Please split PDFs longer than 120 pages.');
  const pages=[];
  for(let n=1;n<=doc.numPages;n++){
    const page=await doc.getPage(n),content=await page.getTextContent();
    // Rebuild lines from PDF text positions to avoid joining option boundaries.
    const lines=[];let lastY=null,line='';
    for(const item of content.items){
      if(!('str' in item))continue;
      const y=Math.round(item.transform?.[5]||0);
      if(lastY!==null&&Math.abs(y-lastY)>3){if(line.trim())lines.push(line.trim());line='';}
      line+=(line&& !item.str.startsWith(' ')?' ':'')+item.str;
      lastY=y;
      if(item.hasEOL){if(line.trim())lines.push(line.trim());line='';lastY=null;}
    }
    if(line.trim())lines.push(line.trim());
    pages.push(lines.join('\n'));
    if(n%10===0)$('pdfImportStatus').textContent=`Extracted ${n} of ${doc.numPages} pages…`;
  }
  return pages.join('\n');
}
function questionsFromPdfText(text){
  const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const questions=[];let current=null,subject='General',activeOption=-1;
  const finish=()=>{if(current){if(!current.text)current.text='[Review missing question text]';questions.push(current);}current=null;activeOption=-1;};
  for(const line of lines){
    if(/^(physics|chemistry|mathematics|maths)\s*(?:section|part)?\s*[:\-]?$/i.test(line)){
      subject=/math/i.test(line)?'Mathematics':/^physics/i.test(line)?'Physics':'Chemistry';continue;
    }
    const q=line.match(/^(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.):-]\s*(.+)$/i);
    if(q&&Number(q[1])>=1 && Number(q[1])<=300 && (line.match(/^(?:Q(?:uestion)?\.?\s*)/i)||Number(q[1])===questions.length+(current?2:1))){
      finish();current={id:'Q'+q[1],subject,type:'single',text:q[2],options:[],answer:''};continue;
    }
    if(!current)continue;
    if(/^(?:sample created for testing|upload this pdf|page \d+ of \d+)/i.test(line))continue;
    const option=line.match(/^(?:\(?([A-D])\)|([A-D])[.):])\s*(.+)$/i);
    if(option){
      const letter=(option[1]||option[2]).toUpperCase(),idx='ABCD'.indexOf(letter);
      if(idx>=0){current.options[idx]=option[3];activeOption=idx;continue;}
    }
    if(activeOption>=0&&current.options[activeOption]!=null)current.options[activeOption]+=' '+line;
    else current.text+=' '+line;
  }
  finish();
  return questions.filter(q=>q.options.filter(x=>String(x||'').trim()).length>=2);
}
function answersFromPdfText(text){
  const matches=[...text.matchAll(/(?:^|\n)\s*(\d{1,3})\s*[.):\-]?\s*(?:Ans(?:wer)?\s*[:\-]?\s*)?\(?([A-D])\)?\s*(?=\n|$)/gi)];
  return matches.map(x=>x[1]+' '+x[2].toUpperCase()).join('\n');
}
async function extractPdfDraft(){
  const paper=$('pdfQuestionFile').files?.[0];
  if(!paper)throw Error('Select a question paper PDF first.');
  $('pdfExtractBtn').disabled=true;
  try{
    $('pdfImportStatus').textContent='Extracting selectable text from question paper…';
    const text=await extractPdfText(paper);
    if(text.trim().length<80)throw Error('No usable selectable text found. This may be a scanned PDF; OCR is not included yet.');
    const questions=questionsFromPdfText(text);
    if(!questions.length)throw Error('PDF text was found, but no reliable MCQ blocks were recognized. Try a numbered paper or convert it to editable JSON.');
    const draft={version:1,title:$('pdfTestTitle').value.trim()||paper.name.replace(/\.pdf$/i,''),durationMinutes:Number($('pdfTestDuration').value)||180,marking:{correct:4,wrong:-1},questions};
    $('pdfDraftJson').value=JSON.stringify(draft,null,2);
    $('pdfDraftEditor').hidden=false;
    $('pdfImportStatus').textContent=`Found ${questions.length} possible MCQs (text only). Review the JSON and all answers before creating a test; diagrams are not preserved.`;
    const key=$('pdfAnswerFile').files?.[0];
    if(key){
      $('pdfImportStatus').textContent+=' Extracting answer-key PDF…';
      const keyText=await extractPdfText(key);
      const draftAnswers=answersFromPdfText(keyText);
      if(draftAnswers)$('pdfKeyText').value=draftAnswers;
      $('pdfImportStatus').textContent+=draftAnswers?' Key candidates added—verify them.':' No simple numbered A–D key recognized; paste answers manually.';
    }
  }finally{$('pdfExtractBtn').disabled=false;}
}
function createPdfPack(){
  const draft=JSON.parse($('pdfDraftJson').value);
  if(!draft.questions?.length)throw Error('No questions found in edited JSON.');
  const map=new Map(),lines=$('pdfKeyText').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  for(const [i,line] of lines.entries()){
    const numbered=line.match(/^(\d{1,3})\s*[.):\-]?\s+(?:Ans(?:wer)?\s*[:\-]?\s*)?(.+)$/i);
    const number=numbered?Number(numbered[1]):i+1,ans=(numbered?numbered[2]:line).trim().replace(/^\((.*)\)$/,'$1').toUpperCase();
    if(map.has(number))throw Error('Duplicate answer for question '+number);
    map.set(number,ans);
  }
  draft.questions.forEach((q,i)=>{
    // The editor can include verified answers; supplied key overrides those answers.
    if(map.has(i+1))q.answer=map.get(i+1);
    if(q.type==='numerical'&&q.answer!=='')q.answer=Number(q.answer);
    if(q.type==='multi'&&typeof q.answer==='string')q.answer=q.answer.replace(/[^A-F]/g,'').split('');
    if(q.answer==null||q.answer===''||(Array.isArray(q.answer)&&!q.answer.length))throw Error(`Missing answer for question ${i+1}. Add a verified answer before importing.`);
    if(!q.options?.length&&q.type!=='numerical')throw Error(`Question ${i+1} has no options. Edit the JSON before importing.`);
  });
  const pack=normalizePack(draft);
  const code=encodePack(pack);
  document.getElementById('converterOutputPanel').hidden=false;
  document.getElementById('converterCode').value=code;
  document.getElementById('converterResult').textContent=pack.questions.length+' validated questions · '+pack.durationMinutes+' minutes. The answer key and all imported text must be checked manually.';
  const preview=document.getElementById('converterPreview');preview.replaceChildren();
  for(const [i,q] of pack.questions.slice(0,30).entries()){
    const article=document.createElement('article');article.className='preview-item';
    const head=document.createElement('strong');head.textContent='Q'+(i+1)+' · '+q.subject+' · answer: '+(Array.isArray(q.answer)?q.answer.join(','):q.answer);
    const paragraph=document.createElement('p');paragraph.textContent=q.text;
    article.append(head,paragraph);
    q.options.forEach((value,j)=>{const line=document.createElement('p');line.textContent='ABCDEF'[j]+'. '+value;article.append(line);});
    if(q.image){const img=document.createElement('img');img.src=q.image;img.alt='Q'+(i+1)+' diagram';img.style.maxWidth='100%';img.style.maxHeight='250px';article.append(img);}
    preview.append(article);
  }
  window.MathJax?.typesetPromise?.([preview]).catch(()=>{});
  document.getElementById('converterOutputPanel').scrollIntoView({behavior:'smooth'});
  $('pdfImportStatus').textContent='Test validated. Export the EF1 code or JSON for ExamForge CBT.';
}
$('pdfExtractBtn').addEventListener('click',()=>extractPdfDraft().catch(e=>{$('pdfImportStatus').textContent='PDF import error: '+errorMessage(e);toast(errorMessage(e),true);}));
$('pdfCreateTestBtn').addEventListener('click',()=>{try{createPdfPack();}catch(e){$('pdfImportStatus').textContent='Validation: '+errorMessage(e);toast(errorMessage(e),true);}});

let exportPack=null;
$('converterCopyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('converterCode').value);toast('EF1 test code copied!');}catch(e){toast(errorMessage(e),true);}});
$('converterDownloadBtn').addEventListener('click',()=>{
  try{
    const pack=normalizePack(JSON.parse($('pdfDraftJson').value));
    const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='examforge-converted-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }catch(e){toast(errorMessage(e),true);}
});
