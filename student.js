import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, linkWithPopup, signInWithPopup, signOut, reauthenticateWithPopup, deleteUser } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase, ref, get, remove } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const firebaseConfig={
  apiKey:'AIzaSyBXM3NXpwvZl8QlJbJPy37Swv5JVkzlwuw',
  authDomain:'examforge-bbb80.firebaseapp.com',
  databaseURL:'https://examforge-bbb80-default-rtdb.asia-southeast1.firebasedatabase.app/',
  projectId:'examforge-bbb80',
  appId:'1:1082015886102:web:66d9e8cf23c50c044f3e37'
};
const app=initializeApp(firebaseConfig);
const auth=getAuth(app),db=getDatabase(app),$=id=>document.getElementById(id);
let rows=[],activeUid=null,loading=false;
const safe=v=>String(v??'');
const fmt=n=>Number(n)?new Date(Number(n)).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
const element=(tag,text,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=safe(text);return e;};
function status(msg,err=false){const e=$('studentStatus');e.textContent=msg;e.className='status'+(err?' error':'');}
async function googleLogin(){
  try{
    const user=auth.currentUser;
    if(user?.isAnonymous)await linkWithPopup(user,new GoogleAuthProvider());
    else await signInWithPopup(auth,new GoogleAuthProvider());
  }catch(e){
    const code=e?.code||'';
    if(code==='auth/credential-already-in-use'||code==='auth/email-already-in-use'){
      $('existingLoginBtn').hidden=false;
      status('That Google account already exists in Firebase. You may sign into it using the separate button. Important: doing so changes your UID; old anonymous test history will remain with the previous UID unless migrated by the administrator.',true);
    }else status('Google sign-in failed: '+safe(e?.message||e),true);
  }
}
$('googleLoginBtn').addEventListener('click',googleLogin);
$('existingLoginBtn').addEventListener('click',async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider());$('existingLoginBtn').hidden=true;}catch(e){status('Existing account sign-in failed: '+safe(e?.message||e),true);}});
$('signoutBtn').addEventListener('click',async()=>{try{await signOut(auth);}catch(e){status('Sign-out failed: '+safe(e?.message||e),true);}});
$('deleteAccountBtn').addEventListener('click',async()=>{
  const u=auth.currentUser;
  if(!u||u.isAnonymous)return;
  if(!confirm('Delete your ExamForge Google-linked account and private saved report history? Live-room records will remain with the organizer. This cannot be undone.'))return;
  if(prompt('Type DELETE to confirm account deletion')!=='DELETE')return;
  try{
    await reauthenticateWithPopup(u,new GoogleAuthProvider());
    await remove(ref(db,'studentHistory/'+u.uid));
    await remove(ref(db,'soloHistory/'+u.uid));
    await deleteUser(u);
    rows=[];$('dashboard').hidden=true;status('Account and personal history deleted. Live-room records remain for room integrity.');
  }catch(e){status('Deletion could not be completed: '+safe(e?.message||e)+'. Personal history may have been partially deleted. Contact the site administrator if you need assistance.',true);}
});
$('refreshBtn').addEventListener('click',refresh);
$('searchInput').addEventListener('input',render);
$('typeSelect').addEventListener('change',render);
$('closeReportBtn').addEventListener('click',()=>{$('reportPanel').hidden=true;});
onAuthStateChanged(auth,async user=>{
  activeUid=user?.uid||null;
  $('studentAccount').textContent=user?.email||(user?'Guest (anonymous)':'Not signed in');
  $('googleLoginBtn').hidden=!!user&&!user.isAnonymous&&user.providerData.some(p=>p.providerId==='google.com');
  $('signoutBtn').hidden=!user||user.isAnonymous;
  if(!user){$('dashboard').hidden=true;status('Sign in with Google to see your saved test reports, or return to ExamForge to continue as a guest.');return;}
  if(user.isAnonymous){$('dashboard').hidden=true;status('Guest session detected. Choose Continue with Google to link this session and keep its reports, or return to the original test room to view your existing score.');return;}
  await refresh();
});
async function refresh(){
  const uid=auth.currentUser?.uid;
  if(!uid||auth.currentUser.isAnonymous||loading)return;
  loading=true;$('refreshBtn').disabled=true;status('Loading your private report history…');
  try{
    const [roomSnap,soloSnap]=await Promise.all([get(ref(db,'studentHistory/'+uid)),get(ref(db,'soloHistory/'+uid))]);
    if(uid!==auth.currentUser?.uid)return;
    const roomEntries=Object.entries(roomSnap.val()||{}).map(([id,r])=>({...r,key:'room:'+id,type:'room',id}));
    const soloEntries=Object.entries(soloSnap.val()||{}).map(([id,r])=>({...r,key:'solo:'+id,type:'solo',id}));
    rows=[...roomEntries,...soloEntries].sort((a,b)=>(Number(b.createdAt)||Number(b.clientCreatedAt)||0)-(Number(a.createdAt)||Number(a.clientCreatedAt)||0));
    $('dashboard').hidden=false;
    $('attemptCount').textContent=rows.length;
    $('roomCount').textContent=roomEntries.length;
    $('soloCount').textContent=soloEntries.length;
    $('latestScore').textContent=rows[0]?.score?rows[0].score.score+' / '+rows[0].score.maxScore:'—';
    render();status('Signed in as '+safe(auth.currentUser.email)+' · '+rows.length+' saved reports found.');
  }catch(e){$('dashboard').hidden=true;status('Could not read your history: '+safe(e?.message||e)+'. Publish the updated studentHistory Firebase rules before retrying.',true);}
  finally{loading=false;$('refreshBtn').disabled=false;}
}
function render(){
  const term=$('searchInput').value.trim().toLowerCase(),type=$('typeSelect').value;
  const body=$('reportRows');body.replaceChildren();
  const found=rows.filter(r=>(type==='all'||r.type===type)&&(!term||[r.title,r.room,r.name].some(x=>safe(x).toLowerCase().includes(term))));
  if(!found.length){const tr=element('tr'),td=element('td','No saved reports yet. Reopen your old live-room link on the same account to import that report.');td.colSpan=7;tr.append(td);body.append(tr);}
  for(const r of found){
    const tr=element('tr');
    for(const t of [fmt(r.createdAt||r.clientCreatedAt),r.title||'Untitled',r.type==='room'?'Live room':'Solo',r.score?.score+' / '+r.score?.maxScore,r.score?.correct??'—',r.score?.wrong??'—'])tr.append(element('td',t));
    const td=element('td'),btn=element('button','View report','outline');btn.disabled=!r.report;btn.addEventListener('click',()=>show(r));td.append(btn);tr.append(td);body.append(tr);
  }
}
function show(r){
  $('reportPanel').hidden=false;
  $('reportTitle').textContent=r.title||'Saved report';
  $('reportSummary').textContent=(r.type==='room'?'Room '+r.room:'Solo practice')+' · '+fmt(r.createdAt||r.clientCreatedAt)+' · '+safe(r.score?.score)+' / '+safe(r.score?.maxScore)+' marks';
  const ss=$('subjectStats');ss.replaceChildren();
  for(const [subject,stat] of Object.entries(r.report?.subjectStats||{})){
    const item=element('article',null,'metric');
    item.append(element('small',subject),element('strong',stat.score+' / '+stat.maxScore),element('small',stat.correct+' correct · '+stat.wrong+' incorrect'));
    ss.append(item);
  }
  const box=$('reportQuestions');box.replaceChildren();
  for(const [i,q] of (r.report?.questions||[]).entries()){
    const item=element('article',null,'question');
    item.append(element('strong','Q'+(i+1)+' · '+safe(q.subject)+' · '+safe(q.outcome)+' · '+safe(q.points)+' marks'));
    if(q.text)item.append(element('p',q.text));
    item.append(element('p','Student: '+safe(q.chosen||'Not attempted')+' | Correct: '+safe(q.answer)));
    if(q.explanation)item.append(element('p',q.explanation));
    box.append(item);
  }
  $('reportPanel').scrollIntoView({behavior:'smooth',block:'start'});
}