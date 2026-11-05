import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const FIREBASE_CONFIG = {
  "apiKey": "AIzaSyBXM3NXpwvZl8QlJbJPy37Swv5JVkzlwuw",
  "authDomain": "examforge-bbb80.firebaseapp.com",
  "databaseURL": "https://examforge-bbb80-default-rtdb.asia-southeast1.firebasedatabase.app/",
  "projectId": "examforge-bbb80",
  "appId": "1:1082015886102:web:66d9e8cf23c50c044f3e37"
};
const app=initializeApp(FIREBASE_CONFIG,'ExamForgePrivateAdmin');
const auth=getAuth(app), db=getDatabase(app);
const $=id=>document.getElementById(id);
let allRows=[], filteredRows=[], currentUser=null, loading=false;
const fmtDate=n=>{const x=Number(n);return x?new Date(x).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';};
const safeTxt=(value)=>String(value??'');
function setStatus(msg,error=false){const el=$('authStatus');el.textContent=msg;el.className='status '+(error?'error':'ok');}
function el(tag,text,cls){const x=document.createElement(tag);if(cls)x.className=cls;if(text!=null)x.textContent=safeTxt(text);return x;}
function num(n){return Number.isFinite(Number(n))?Number(n):null;}
function compactPercent(score){const n=num(score?.score),d=num(score?.maxScore);return n!==null&&d>0?100*n/d:null;}
function roomRows(rooms){
  const result=[];
  for(const [roomCode,room] of Object.entries(rooms||{})){
    const scores=room?.scores||{},subs=room?.submissions||{},members=room?.members||{};
    const uids=new Set([...Object.keys(scores),...Object.keys(subs),...Object.keys(members)]);
    for(const uid of uids){
      const score=scores[uid]||null, report=room?.reports?.[uid]||null,sub=subs[uid]||null;
      result.push({key:'room:'+roomCode+':'+uid,type:'room',room:roomCode,title:room?.meta?.title||'Untitled room',name:members[uid]?.name||'Unknown student',uid,score,report,submitted:!!sub,createdAt:num(score?.submittedAt)||num(sub?.submittedAt)||num(room?.meta?.createdAt)||0,roomStatus:room?.meta?.status||'unknown'});
    }
  }
  return result;
}
function soloRows(solo){
  const result=[];
  for(const [uid,entries] of Object.entries(solo||{}))for(const [id,item] of Object.entries(entries||{})){
    result.push({key:'solo:'+uid+':'+id,type:'solo',room:'—',title:item?.title||'Solo test',name:item?.name||'Student',uid,score:item?.score||null,report:item?.report||null,submitted:true,createdAt:num(item?.createdAt)||num(item?.clientCreatedAt)||0,roomStatus:'finished'});
  }
  return result;
}
async function refresh(){
  if(!currentUser||loading)return;
  loading=true;$('refreshBtn').disabled=true;setStatus('Reading all test history from Firebase…');
  try{
    // Only the approved Firebase UID can read either database root below.
    const [roomsSnap,soloSnap]=await Promise.all([get(ref(db,'rooms')),get(ref(db,'soloHistory'))]);
    const rooms=roomsSnap.val()||{},solo=soloSnap.val()||{};
    allRows=[...roomRows(rooms),...soloRows(solo)].sort((a,b)=>b.createdAt-a.createdAt);
    $('dashboard').hidden=false;
    $('roomCount').textContent=Object.keys(rooms).length;
    $('liveCount').textContent=allRows.filter(x=>x.type==='room'&&x.score).length;
    $('soloCount').textContent=allRows.filter(x=>x.type==='solo'&&x.score).length;
    const p=allRows.map(x=>compactPercent(x.score)).filter(x=>x!==null);
    $('avgPercent').textContent=p.length?(p.reduce((a,b)=>a+b,0)/p.length).toFixed(1)+'%':'—';
    applyFilters();setStatus(`Authorized admin. Loaded ${allRows.length} test records.`);
  }catch(e){
    $('dashboard').hidden=true;
    const m=String(e?.code||e?.message||e);
    if(/permission_denied|PERMISSION_DENIED|Permission denied/i.test(m))setStatus('Access denied. Copy the Firebase UID shown above, replace the placeholder in FIREBASE_SETUP/FIREBASE_DATABASE_RULES_ADMIN.json, and publish those rules in Firebase → Realtime Database → Rules. Then click Refresh.',true);
    else setStatus('Unable to load history: '+m,true);
  }finally{loading=false;$('refreshBtn').disabled=false;}
}
function applyFilters(){
  const term=$('searchInput').value.toLowerCase().trim(),type=$('typeSelect').value, status=$('statusSelect').value;
  filteredRows=allRows.filter(x=>(type==='all'||type===x.type)&&(status==='all'||(status==='scored'&&x.score)||(status==='pending'&&!x.score))&&(!term||[x.title,x.name,x.room,x.uid].some(v=>safeTxt(v).toLowerCase().includes(term))));
  const tbody=$('historyRows');tbody.replaceChildren();
  if(!filteredRows.length){const tr=el('tr'),td=el('td','No matching test attempts.');td.colSpan=9;tr.append(td);tbody.append(tr);}
  for(const entry of filteredRows){
    const tr=el('tr');
    const title=el('td',null,'cell-title');title.append(el('strong',entry.title));title.append(el('div',entry.type==='room'?'Room '+entry.room:'Solo practice','muted'));
    const score=entry.score,scoreText=score?`${score.score} / ${score.maxScore}`:'—';
    const status=score?'Scored':entry.submitted?'Awaiting scoring':'Not submitted';
    for(const cell of [el('td',fmtDate(entry.createdAt)),title,el('td',entry.name),el('td',entry.type==='room'?'Room':'Solo'),el('td',scoreText),el('td',score?.correct??'—'),el('td',score?.wrong??'—')])tr.append(cell);
    const stat=el('td');stat.append(el('span',status,'pill '+(score?'done':'pending')));tr.append(stat);
    const td=el('td'),btn=el('button','View','mini-button');btn.disabled=!entry.report;btn.addEventListener('click',()=>showReport(entry));td.append(btn);tr.append(td);tbody.append(tr);
  }
  $('resultCount').textContent=`Showing ${filteredRows.length} of ${allRows.length} attempts. Reports only exist after the host finishes scoring.`;
}
function showReport(row){
  if(!row.report)return;
  const box=$('details');box.hidden=false;
  $('detailTitle').textContent=`${row.name} · ${row.title}`;
  $('detailSub').textContent=`${row.type==='room'?'Room '+row.room:'Solo'} · ${fmtDate(row.createdAt)} · ${row.score?row.score.score+' / '+row.score.maxScore+' marks':'No score'}`;
  const stats=$('detailStats');stats.replaceChildren();
  for(const [label,value] of [['Score',row.score?.score??'—'],['Correct',row.score?.correct??'—'],['Wrong',row.score?.wrong??'—'],['Unanswered',row.score?.unanswered??'—']]){
    const c=el('article',null,'metric');c.append(el('small',label),el('strong',value));stats.append(c);
  }
  const questions=$('detailQuestions');questions.replaceChildren();
  const subjectStats=row.report?.subjectStats||{};
  if(Object.keys(subjectStats).length){const g=el('div',null,'subject-grid');for(const [subject,v] of Object.entries(subjectStats)){
    const item=el('article');item.append(el('small',subject),el('b',`${v.score}/${v.maxScore}`),el('span',`${v.correct} correct · ${v.wrong} wrong · ${v.unanswered} unanswered`));g.append(item);
  }questions.append(g);}
  for(const [index,q] of (row.report?.questions||[]).entries()){
    const item=el('article',null,'question');item.append(el('strong',`Q${index+1} · ${q.subject||''} · ${q.outcome||''} · ${q.points??0} marks`,q.outcome==='correct'?'qgood':'qbad'));
    if(q.text)item.append(el('p',q.text));item.append(el('p',`Student: ${q.chosen||'Not attempted'}  |  Correct: ${q.answer??'—'}`));
    if(q.explanation)item.append(el('p',q.explanation,'muted'));questions.append(item);
  }
  box.scrollIntoView({behavior:'smooth',block:'start'});
}
function downloadCsv(){
  const fields=['date','type','room','title','name','uid','score','maxScore','correct','wrong','unanswered','elapsedSeconds','status'];
  const escape=v=>'"'+safeTxt(v).replaceAll('"','""')+'"';
  const out=[fields.join(',')];
  for(const r of filteredRows){const obj={date:fmtDate(r.createdAt),type:r.type,room:r.room,title:r.title,name:r.name,uid:r.uid,score:r.score?.score??'',maxScore:r.score?.maxScore??'',correct:r.score?.correct??'',wrong:r.score?.wrong??'',unanswered:r.score?.unanswered??'',elapsedSeconds:r.score?.elapsedSeconds??'',status:r.score?'scored':r.submitted?'pending':'not submitted'};out.push(fields.map(k=>escape(obj[k])).join(','));}
  const url=URL.createObjectURL(new Blob(['﻿'+out.join('
')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='ExamForge_Private_History_'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
$('googleBtn').addEventListener('click',async()=>{try{await setPersistence(auth,browserSessionPersistence);await signInWithPopup(auth,new GoogleAuthProvider());}catch(e){setStatus('Google sign-in failed: '+String(e?.message||e),true);}});
$('signoutBtn').addEventListener('click',()=>signOut(auth));
$('copyUidBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(currentUser.uid);setStatus('UID copied. Paste it into the Firebase rules placeholder and Publish.');}catch(e){setStatus('Could not copy UID. Select it manually.',true);}});
$('refreshBtn').addEventListener('click',refresh);
$('exportBtn').addEventListener('click',downloadCsv);
$('closeDetailBtn').addEventListener('click',()=>{$('details').hidden=true;});
for(const name of ['searchInput','typeSelect','statusSelect'])$(name).addEventListener(name==='searchInput'?'input':'change',applyFilters);
onAuthStateChanged(auth,async user=>{
  currentUser=user;
  $('authName').textContent=user?.email||'Not signed in';$('googleBtn').hidden=!!user;$('signoutBtn').hidden=!user;
  $('currentUid').textContent=user?.uid||'Sign in first';$('copyUidBtn').disabled=!user;
  if(!user){$('dashboard').hidden=true;allRows=[];setStatus('Sign in with Google to continue.');return;}
  await refresh();
},err=>setStatus('Authentication error: '+String(err),true));
