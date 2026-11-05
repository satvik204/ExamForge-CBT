/* ExamForge Apr4 inline image + bonus patch v1 */
/**
 * ExamForge CBT — static GitHub Pages frontend + Firebase Realtime Database.
 * SETUP: Paste your Firebase WEB APP config below. Enable Anonymous Auth,
 * create Realtime Database, and paste DATABASE_RULES into its Rules tab.
 * No test answer key is uploaded to the room's public paper. The host browser
 * scores submissions and must remain connected while friends finish.
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInAnonymously, signInWithPopup, linkWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase, ref, get, set, update, onValue, push, serverTimestamp, onDisconnect } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBXM3NXpwvZl8QlJbJPy37Swv5JVkzlwuw',
  authDomain: 'examforge-bbb80.firebaseapp.com',
  databaseURL: 'https://examforge-bbb80-default-rtdb.asia-southeast1.firebasedatabase.app/',
  projectId: 'examforge-bbb80',
  appId: '1:1082015886102:web:66d9e8cf23c50c044f3e37'
};

// Click "Copy Firebase database rules" in the setup panel to copy this JSON.
// These rules are for friendly private rooms, not secure/proctored high-stakes exams.
const DATABASE_RULES = {
  "rules": {
    "rooms": {
      ".read": "auth != null && auth.uid === \"PASTE_YOUR_GOOGLE_AUTH_UID_HERE\"",
      "$room": {
        "meta": {
          ".read": "auth != null",
          ".write": "auth != null && auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE' || (auth != null && ((!data.exists() && newData.child(\"hostUid\").val() === auth.uid) || (data.child(\"hostUid\").val() === auth.uid && newData.child(\"hostUid\").val() === auth.uid)))",
          ".validate": "newData.hasChildren([\"hostUid\", \"title\", \"status\", \"createdAt\", \"durationMinutes\", \"shareReports\", \"examChat\", \"marking\"]) && newData.child(\"hostUid\").isString() && newData.child(\"title\").isString() && newData.child(\"title\").val().length <= 150 && newData.child(\"status\").isString() && (newData.child(\"status\").val() === \"lobby\" || newData.child(\"status\").val() === \"started\" || newData.child(\"status\").val() === \"finished\") && newData.child(\"durationMinutes\").isNumber() && newData.child(\"durationMinutes\").val() >= 1 && newData.child(\"durationMinutes\").val() <= 300 && newData.child(\"shareReports\").isBoolean() && newData.child(\"examChat\").isBoolean() && (!data.exists() || newData.child(\"hostUid\").val() === data.child(\"hostUid\").val())"
        },
        "paper": {
          ".read": "auth != null && (root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid || root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists())",
          ".write": "auth != null && root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid && root.child(\"rooms/\" + $room + \"/meta/status\").val() === \"lobby\"",
          ".validate": "newData.hasChildren([\"title\", \"questions\"])"
        },
        "members": {
          ".read": "auth != null && (root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid || root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists())",
          "$uid": {
            ".read": "auth != null && auth.uid === $uid",
            ".write": "auth != null && auth.uid === $uid && !data.exists() && root.child(\"rooms/\" + $room + \"/meta/status\").val() === \"lobby\"",
            ".validate": "newData.hasChildren([\"name\", \"joinedAt\"]) && newData.child(\"name\").isString() && newData.child(\"name\").val().length > 0 && newData.child(\"name\").val().length <= 30 && newData.child(\"joinedAt\").isNumber()"
          }
        },
        "messages": {
          ".read": "auth != null && (root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid || root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists())",
          "$message": {
            ".write": "auth != null && !data.exists() && root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists() && (root.child(\"rooms/\" + $room + \"/meta/status\").val() === \"lobby\" || root.child(\"rooms/\" + $room + \"/meta/examChat\").val() === true)",
            ".validate": "newData.hasChildren([\"uid\", \"text\", \"sentAt\"]) && newData.child(\"uid\").val() === auth.uid && newData.child(\"text\").isString() && newData.child(\"text\").val().length > 0 && newData.child(\"text\").val().length <= 300 && newData.child(\"sentAt\").isNumber()"
          }
        },
        "submissions": {
          ".read": "auth != null && root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid",
          "$uid": {
            ".read": "auth != null && (auth.uid === $uid || root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid)",
            ".write": "auth != null && auth.uid === $uid && !data.exists() && root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists() && root.child(\"rooms/\" + $room + \"/meta/status\").val() === \"started\"",
            ".validate": "newData.hasChildren([\"answers\", \"submittedAt\", \"elapsedSeconds\"]) && newData.child(\"submittedAt\").isNumber() && newData.child(\"elapsedSeconds\").isNumber() && newData.child(\"elapsedSeconds\").val() >= 0"
          }
        },
        "scores": {
          ".read": "auth != null && (root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid || root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists())",
          "$uid": {
            ".write": "auth != null && root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid && root.child(\"rooms/\" + $room + \"/submissions/\" + $uid).exists()",
            ".validate": "newData.hasChildren([\"score\", \"correct\", \"wrong\", \"unanswered\", \"maxScore\", \"elapsedSeconds\"]) && newData.child(\"score\").isNumber() && newData.child(\"correct\").isNumber() && newData.child(\"wrong\").isNumber() && newData.child(\"unanswered\").isNumber() && newData.child(\"maxScore\").isNumber() && newData.child(\"elapsedSeconds\").isNumber()"
          }
        },
        "reports": {
          "$uid": {
            ".read": "auth != null && (auth.uid === $uid || auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE' || (root.child('rooms/' + $room + '/meta/shareReports').val() === true && root.child('rooms/' + $room + '/members/' + auth.uid).exists() && root.child('rooms/' + $room + '/submissions/' + auth.uid).exists() && root.child('rooms/' + $room + '/scores/' + auth.uid).exists() && root.child('rooms/' + $room + '/scores/' + $uid).exists() && root.child('rooms/' + $room + '/resultSessions/' + auth.uid).val() === true))",
            ".write": "auth != null && root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid && root.child(\"rooms/\" + $room + \"/submissions/\" + $uid).exists()",
            ".validate": "newData.hasChildren([\"questions\", \"subjectStats\"])"
          }
        },
        ".write": "auth != null && auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE' && !newData.exists()",
        "resultSessions": {
          "$uid": {
            ".read": "auth != null && (auth.uid === $uid || auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE')",
            ".write": "auth != null && auth.uid === $uid && root.child('rooms/' + $room + '/members/' + auth.uid).exists() && ((!data.exists() && (newData.val() === true || newData.val() === false) && root.child('rooms/' + $room + '/submissions/' + auth.uid).exists() && root.child('rooms/' + $room + '/scores/' + auth.uid).exists()) || (data.val() === true && newData.val() === false))",
            ".validate": "newData.isBoolean()"
          }
        }
      }
    },
    "studentHistory": {
      "$uid": {
        ".read": "auth != null && auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE' || (auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous')",
        "$room": {
          ".write": "auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous' && newData.exists() && !data.exists() && root.child('rooms/' + $room + '/members/' + auth.uid).exists() && root.child('rooms/' + $room + '/scores/' + auth.uid).exists() && root.child('rooms/' + $room + '/reports/' + auth.uid).exists()",
          ".validate": "newData.hasChildren([\"uid\", \"room\", \"title\", \"name\", \"createdAt\", \"score\", \"report\"]) && newData.child(\"uid\").val() === auth.uid && newData.child(\"room\").val() === $room && newData.child(\"title\").isString() && newData.child(\"title\").val().length <= 150 && newData.child(\"score/score\").isNumber() && newData.child(\"report/questions\").exists() && newData.child('score/score').val() === root.child('rooms/' + $room + '/scores/' + auth.uid + '/score').val() && newData.child('score/maxScore').val() === root.child('rooms/' + $room + '/scores/' + auth.uid + '/maxScore').val()"
        },
        ".write": "auth != null && auth.uid === $uid && !newData.exists()"
      },
      ".read": "auth != null && auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE'"
    },
    "soloHistory": {
      ".read": "auth != null && auth.uid === \"PASTE_YOUR_GOOGLE_AUTH_UID_HERE\"",
      "$uid": {
        ".read": "auth != null && auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE' || (auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous')",
        "$attempt": {
          ".write": "auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous' && !data.exists() && newData.exists()",
          ".validate": "newData.hasChildren([\"uid\", \"name\", \"title\", \"createdAt\", \"clientCreatedAt\", \"score\", \"report\"]) && newData.child(\"uid\").val() === auth.uid && newData.child(\"name\").isString() && newData.child(\"name\").val().length <= 30 && newData.child(\"title\").isString() && newData.child(\"title\").val().length <= 150 && newData.child(\"createdAt\").isNumber() && newData.child(\"clientCreatedAt\").isNumber() && newData.child(\"score/score\").isNumber() && newData.child(\"score/maxScore\").isNumber()"
        },
        ".write": "auth != null && auth.uid === $uid && !newData.exists()"
      }
    }
  }
};

const $ = (id) => document.getElementById(id);
const S = {
  app: null, db: null, auth: null, uid: null, offset: 0, pack: null,
  room: null, meta: null, paper: null, members: {}, scores: {}, messages: {},
  myReport: null, isHost: false, ownSubmission: null,
  unsub: [], clock: null, exam: null, view: 'home', solo: false,
  selectedReportUid: '', reportCache: {}, busyScoring: new Set(),
  syncing: false, toastTimer: null, lastRoomStatus: null,
  peerSessionKnown: false, peerSessionState: 'new', peerSessionRoom: null, peerSessionPromise: null
};

const DEMO_PACK = {
  version: 1, title: 'ExamForge Demo • JEE-Style Mini Mock', durationMinutes: 12,
  marking: {correct: 4, wrong: -1},
  questions: [
    {id:'P1',subject:'Physics',type:'single',text:'A body starts from rest and accelerates uniformly at $2\\,\\mathrm{m/s^2}$. What is its speed after 5 s?',options:['5 m/s','10 m/s','15 m/s','20 m/s'],answer:'B',explanation:'$v = u + at = 0 + 2(5) = 10$ m/s.'},
    {id:'P2',subject:'Physics',type:'single',text:'Which is the SI unit of electric capacitance?',options:['Ohm','Farad','Henry','Tesla'],answer:'B',explanation:'Capacitance is measured in farads (F).'},
    {id:'C1',subject:'Chemistry',type:'single',text:'The atomic number of oxygen is:',options:['6','7','8','9'],answer:'C'},
    {id:'C2',subject:'Chemistry',type:'multi',text:'Which of the following are noble gases?',options:['Helium','Nitrogen','Neon','Oxygen'],answer:['A','C']},
    {id:'M1',subject:'Mathematics',type:'single',text:'If $f(x)=x^2$, then $f\'(3)$ is:',options:['3','6','9','12'],answer:'B',explanation:'The derivative is $2x$, so $f\'(3)=6$.'},
    {id:'M2',subject:'Mathematics',type:'numerical',text:'Evaluate $\\int_0^2 3x^2\\,dx$. Enter the numerical value.',answer:8,tolerance:0.001}
  ]
};

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function errorMessage(e) {
  const text = e?.message || String(e);
  if (text.includes('PERMISSION_DENIED') || text.includes('permission_denied')) return 'Firebase blocked that action. Check that you copied the database security rules and published them.';
  if (text.includes('auth/operation-not-allowed')) return 'Enable Anonymous sign-in in Firebase Authentication first.';
  if (text.includes('auth/unauthorized-domain')) return 'Add your GitHub Pages domain under Firebase Authentication → Settings → Authorized domains.';
  if (text.includes('auth/invalid-api-key')) return 'Your Firebase configuration is incorrect. Recheck the apiKey.';
  return text;
}
function toast(message, bad = false) {
  const el = $('toast');
  el.textContent = message; el.classList.toggle('error', bad); el.classList.add('show');
  clearTimeout(S.toastTimer); S.toastTimer = setTimeout(() => el.classList.remove('show'), 4500);
}
function status(msg, bad = false) {
  const el=$('packStatus'); el.hidden = false; el.textContent=msg; el.className=`inline-status${bad?' error':''}`;
}
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
function parsePack(code) {
  code=String(code).trim();
  if (!code) throw Error('Paste a test code or JSON first.');
  if (code.startsWith('EF1:')) {
    const str=code.substring(4).replace(/-/g,'+').replace(/_/g,'/');
    const decoded=atob(str.padEnd(Math.ceil(str.length/4)*4,'='));
    return normalizePack(JSON.parse(new TextDecoder().decode(Uint8Array.from(decoded,c=>c.charCodeAt(0)))));
  }
  return normalizePack(JSON.parse(code));
}
function publicPaper(pack) {
  return {title:pack.title,questions:pack.questions.map(({id,subject,type,text,image,options,bonus})=>({id,subject,type,text,image,options,bonus}))};
}
function view(name) {
  S.view=name; for(const x of ['home','room','exam','results']) $(`${x}View`).hidden=x!==name;
  window.scrollTo({top:0,behavior:'instant'});
}
function formatTime(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/3600)).padStart(2,'0')}:${String(Math.floor(sec/60)%60).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function serverNow(){return Date.now()+S.offset;}
function displayName(){return cleanText($('nameInput').value || localStorage.getItem('ef-display-name') || '',30);}
function safeImage(src){return typeof src==='string' && /^(?:https:\/\/|data:image\/(?:webp|png|jpeg);base64,)/i.test(src)?src:'';}
function addText(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=text;return el;}
function typeset(el){if(window.MathJax?.typesetPromise) window.MathJax.typesetPromise([el]).catch(()=>{});}
function setText(id,text){$(id).textContent=text;}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast('Copied to clipboard!');}catch{toast('Clipboard unavailable. Select and copy the text manually.',true);}}
function importPack(pack){S.pack=normalizePack(pack);$('packInput').value=JSON.stringify(S.pack,null,2);$('previewPanel').hidden=false;
  setText('previewTitle',S.pack.title);setText('previewMeta',`${S.pack.questions.length} questions · ${S.pack.durationMinutes} min · +${S.pack.marking.correct}/${S.pack.marking.wrong} marks`);
  $('packSummary').hidden=false;$('packSummary').replaceChildren(...[
    `${S.pack.questions.length} questions`,`${new Set(S.pack.questions.map(q=>q.subject)).size} sections`,`${S.pack.durationMinutes} minutes`].map(x=>addText('span','',x)));
  const node=$('previewQuestions');node.replaceChildren();
  for(const [i,q] of S.pack.questions.entries()){
    if(i>=20){node.append(addText('p','muted',`...and ${S.pack.questions.length-20} more questions ready.`));break;}
    const box=addText('article','preview-item','');box.append(addText('div','mini',`${i+1} · ${q.subject} · ${q.type} · Answer: ${Array.isArray(q.answer)?q.answer.join(','):q.answer}`),addText('p','',q.text || '[image question]'));
    if(q.options.length)box.append(addText('div','option-lines',q.options.map((o,j)=>`${ABC[j]}. ${o}`).join('\n')));
    node.append(box);
  }
  typeset(node);status(`${S.pack.questions.length} questions imported with answer key. Preview before hosting.`);
}
function newAttempt(){const n=S.paper.questions.length;return {answers:Array(n).fill(null),visited:Array(n).fill(false),review:Array(n).fill(false)};}
function attemptStorageKey(){return S.solo?`ef-solo:${S.pack?.title}`:`ef-attempt:${S.room}:${S.uid}`;}
function loadAttempt(){const empty=newAttempt();try{const saved=JSON.parse(localStorage.getItem(attemptStorageKey())||'null');if(saved && Array.isArray(saved.answers)&&saved.answers.length===empty.answers.length){return {answers:saved.answers,visited:saved.visited||empty.visited,review:saved.review||empty.review};}}catch{}return empty;}
function saveAttempt(){if(S.exam && !S.exam.submitted)try{localStorage.setItem(attemptStorageKey(),JSON.stringify(S.exam));}catch{}}
function clearExamClock(){if(S.clock){clearInterval(S.clock);S.clock=null;}}
function clearRoomListeners(){for(const fn of S.unsub)try{fn();}catch{}S.unsub=[];clearExamClock();S.busyScoring.clear();}
function watch(path,callback){const f=onValue(ref(S.db,path), snap=>callback(snap.val()), err=>toast(`Live connection: ${errorMessage(err)}`,true));S.unsub.push(f);return f;}
function badge(message,connected){const el=$('connectionBadge');el.innerHTML='';const dot=addText('span','status-dot','');el.append(dot,document.createTextNode(message));el.classList.toggle('offline',!connected);}
function configReady(){return FIREBASE_CONFIG.apiKey && !Object.values(FIREBASE_CONFIG).some(v=>String(v).startsWith('PASTE_')||String(v).includes('PASTE_'));}
const ADMIN_UID='aDoKGJYtSddgooKQDwdcGGefeiv1';
let identityReady=false,clockReady=false;
function isGoogleUser(){return !!S.auth?.currentUser?.providerData?.some(p=>p.providerId==='google.com');}
function authNote(message,bad=false){const e=$('authGateStatus');e.textContent=message;e.classList.toggle('error',bad);}
function presentIdentityGate(){
  $('authGate').hidden=false;
  document.body.classList.add('auth-locked');
  $('identityLabel').textContent='Choose how to enter ExamForge';
  authNote(S.auth?.currentUser?.isAnonymous?'Existing guest session detected. You may continue as guest or link this identity to Google.':'Google accounts keep their personal test history. Guests can take tests but do not have saved account history.');
}
async function finishIdentity(){
  const user=S.auth?.currentUser;
  if(!user)return;
  if(identityReady && S.uid===user.uid)return;
  S.uid=user.uid;identityReady=true;
  $('authGate').hidden=true;document.body.classList.remove('auth-locked');
  const google=isGoogleUser();
  $('accountName').textContent=google?(user.email||'Google student'):'Guest';
  $('myReportsLink').hidden=!google;
  $('adminPanelLink').hidden=!(google&&S.uid===ADMIN_UID);
  $('switchAccountBtn').hidden=false;
  $('upgradeAccountBtn').hidden=google;
  badge(google?'Google account connected':'Guest · live rooms ready',true);
  if(!clockReady){watchServerClock();clockReady=true;}
  if(google)flushPendingSoloHistory().catch(()=>{});
  const fromUrl=new URLSearchParams(location.search).get('room');
  if(fromUrl){
    const code=fromUrl.toUpperCase();
    $('joinCodeInput').value=code;
    try{
      const existing=await get(ref(S.db,`rooms/${code}/meta`));
      if(existing.exists()){
        const member=await get(ref(S.db,`rooms/${code}/members/${S.uid}`));
        if(member.exists())await enterRoom(code);
        else toast('Invite detected! Enter your name and click Join room.');
      }else toast('Room not found. Double-check your invite.',true);
    }catch(e){toast(errorMessage(e),true);}
  }
}
async function connectFirebase(){
  if(!configReady()){badge('Configure Firebase for live rooms',false);presentIdentityGate();authNote('Firebase configuration is missing.',true);return;}
  try{
    S.app=initializeApp(FIREBASE_CONFIG);S.auth=getAuth(S.app);S.db=getDatabase(S.app);
    await new Promise((resolve,reject)=>{const unsub=onAuthStateChanged(S.auth,u=>{unsub();resolve(u);},reject);});
    if(S.auth.currentUser && !S.auth.currentUser.isAnonymous)await finishIdentity();
    else presentIdentityGate();
  }catch(e){badge('Firebase connection failed',false);presentIdentityGate();authNote(errorMessage(e),true);}
}
$('guestEntryBtn').addEventListener('click',async()=>{
  try{
    $('guestEntryBtn').disabled=true;
    if(!S.auth.currentUser)await signInAnonymously(S.auth);
    if(!S.auth.currentUser.isAnonymous){authNote('You are already signed in with Google. Use Switch account to leave that account.',true);return;}
    await finishIdentity();
  }catch(e){authNote('Guest sign-in failed: '+errorMessage(e),true);}
  finally{$('guestEntryBtn').disabled=false;}
});
$('googleEntryBtn').addEventListener('click',async()=>{
  try{
    $('googleEntryBtn').disabled=true;
    if(S.auth.currentUser?.isAnonymous){
      try{await linkWithPopup(S.auth.currentUser,new GoogleAuthProvider());}
      catch(e){
        if(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use'){
          authNote('This Google account already exists. Sign in to that account; old guest results cannot automatically transfer to it.');
          await signInWithPopup(S.auth,new GoogleAuthProvider());
        }else throw e;
      }
    }else await signInWithPopup(S.auth,new GoogleAuthProvider());
    identityReady=false;await finishIdentity();
  }catch(e){authNote('Google sign-in failed: '+String(e?.message||e),true);}
  finally{$('googleEntryBtn').disabled=false;}
});
$('upgradeAccountBtn').addEventListener('click',async()=>{
  const user=S.auth?.currentUser;
  if(!user?.isAnonymous)return;
  try{
    await linkWithPopup(user,new GoogleAuthProvider());
    identityReady=false;await finishIdentity();
    if(S.room&&S.myReport)archiveMyRoomReport().catch(()=>{});
    toast('Guest identity linked to Google. Your Firebase UID is unchanged.');
  }catch(e){
    if(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use')
      toast('That Google account already exists. Finish this test first; signing into that account would change your UID and cannot automatically merge old guest history.',true);
    else toast('Google upgrade failed: '+String(e?.message||e),true);
  }
});
$('switchAccountBtn').addEventListener('click',async()=>{
  if(S.view==='exam'&&!confirm('Leave this active test? Your unsent answers remain on this device.'))return;
  if(S.room && S.view==='results'){await exitResults();if(S.room)return;}
  else if(S.room){home();if(S.room)return;}
  identityReady=false;S.uid=null;
  try{await signOut(S.auth);presentIdentityGate();}
  catch(e){toast('Sign-out failed: '+errorMessage(e),true);}
});

function watchServerClock(){onValue(ref(S.db,'.info/serverTimeOffset'),s=>{S.offset=Number(s.val())||0;});}

// Admin history: solo reports are private to the student and the approved Firebase admin.
// Queue unsent records locally if the connection is unavailable; sending never blocks solo CBT.
const SOLO_HISTORY_QUEUE = 'ef-admin-solo-pending-v1';
function loadPendingSoloHistory(){
  try { const items=JSON.parse(localStorage.getItem(SOLO_HISTORY_QUEUE)||'[]'); return Array.isArray(items)?items:[]; }
  catch { return []; }
}
function addPendingSoloHistory(score,report){
  try {
    const pending=loadPendingSoloHistory();
    const id='s'+Date.now().toString(36)+'_'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    pending.push({id, uid:S.uid||null, name:displayName()||'Student', title:S.pack?.title||'Solo CBT', clientCreatedAt:Date.now(), score,report});
    localStorage.setItem(SOLO_HISTORY_QUEUE,JSON.stringify(pending.slice(-100)));
    flushPendingSoloHistory().catch(()=>{});
  } catch(e){ console.warn('Could not queue solo report for admin history:',e); }
}
let soloArchiveFlushing=false;
async function flushPendingSoloHistory(){
  if(soloArchiveFlushing||!S.db||!S.uid)return;
  soloArchiveFlushing=true;
  try {
    let pending=loadPendingSoloHistory();
    for(const item of pending){
      if(item.uid && item.uid!==S.uid)continue; // Never claim another person's result.
      const path=`soloHistory/${S.uid}/${item.id}`;
      try {
        const target=ref(S.db,path);
        const old=await get(target); // idempotent after interrupted requests
        if(!old.exists()) await set(target,{
          uid:S.uid,name:item.name,title:item.title,clientCreatedAt:item.clientCreatedAt,
          createdAt:serverTimestamp(),score:item.score,report:item.report
        });
        pending=loadPendingSoloHistory().filter(x=>x.id!==item.id);
        localStorage.setItem(SOLO_HISTORY_QUEUE,JSON.stringify(pending));
      }catch(e){console.warn('Solo result will retry syncing to admin history:',e);break;}
    }
  }finally{soloArchiveFlushing=false;}
}

function requireLive(){if(!S.db||!S.uid)throw Error('Live rooms need Firebase setup. Expand “First-time live-room setup” on the home screen.');}
function makeRoomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=new Uint8Array(14);crypto.getRandomValues(bytes);return Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');}
function inviteUrl(code){const u=new URL(location.href);u.search=`?room=${encodeURIComponent(code)}`;u.hash='';return u.toString();}
function urlRoom(code){const u=new URL(location.href);if(code)u.searchParams.set('room',code);else u.searchParams.delete('room');history.replaceState(null,'',u);}
function roomName(uid){return S.members?.[uid]?.name || (uid===S.uid?displayName():'Member');}
async function createRoom(){
  try{
    requireLive(); if(!S.pack)throw Error('Import a valid test code first.');const name=displayName();if(!name)throw Error('Enter your display name.');
    $('createRoomBtn').disabled=true;
    localStorage.setItem('ef-display-name',name);
    const room=makeRoomCode();
    const meta={hostUid:S.uid,title:S.pack.title,status:'lobby',durationMinutes:S.pack.durationMinutes,marking:S.pack.marking,shareReports:$('shareReportToggle').checked,examChat:$('examChatToggle').checked,createdAt:serverTimestamp()};
    // Each write is authorized separately. Keep key only in the host's browser.
    await set(ref(S.db,`rooms/${room}/meta`),meta);
    await set(ref(S.db,`rooms/${room}/paper`),publicPaper(S.pack));
    await set(ref(S.db,`rooms/${room}/members/${S.uid}`),{name,joinedAt:serverTimestamp()});
    try{localStorage.setItem(`ef-host-paper:${room}`,JSON.stringify(S.pack));}catch{toast('Storage is full: keep the host tab open until all exams are scored.',true);}
    await enterRoom(room);toast('Room created! Share the invite with your friends.');
  }catch(e){toast(errorMessage(e),true);}finally{$('createRoomBtn').disabled=false;}
}
function getRoomCode(text){let raw=cleanText(text,1000);try{if(raw.includes('?room='))raw=new URL(raw).searchParams.get('room')||raw;}catch{}return raw.replace(/[^A-Za-z0-9]/g,'').toUpperCase();}
async function joinRoom(){
  try{
    requireLive();const room=getRoomCode($('joinCodeInput').value);if(!room)throw Error('Paste an invitation link or room code.');
    const name=displayName();if(!name)throw Error('Enter your display name before joining.');
    $('joinRoomBtn').disabled=true;
    const snap=await get(ref(S.db,`rooms/${room}/meta`));if(!snap.exists())throw Error('Room not found. Ask the host for the correct invite link.');
    const meta=snap.val();
    const current=await get(ref(S.db,`rooms/${room}/members/${S.uid}`));
    if(!current.exists()){
      if(meta.status!=='lobby')throw Error('This exam has already started. Ask the host to create a new room.');
      await set(ref(S.db,`rooms/${room}/members/${S.uid}`),{name,joinedAt:serverTimestamp()});
    }
    localStorage.setItem('ef-display-name',name);
    await enterRoom(room);
  }catch(e){toast(errorMessage(e),true);}finally{$('joinRoomBtn').disabled=false;}
}
async function enterRoom(room){
  requireLive();clearRoomListeners();S.room=room;S.solo=false;S.exam=null;S.currentIdx=0;S.meta=null;S.paper=null;S.members={};S.scores={};S.messages={};S.myReport=null;S.ownSubmission=null;S.reportCache={};S.selectedReportUid=S.uid;S.lastRoomStatus=null;S.peerSessionKnown=false;S.peerSessionState='new';S.peerSessionRoom=room;S.peerSessionPromise=null;
  const snap=await get(ref(S.db,`rooms/${room}/meta`));if(!snap.exists())throw Error('Room not found.');
  S.meta=snap.val();S.isHost=S.meta.hostUid===S.uid;
  if(S.isHost && !S.pack){try{S.pack=normalizePack(JSON.parse(localStorage.getItem(`ef-host-paper:${room}`)||'null'));}catch{}}
  urlRoom(room);view('room');setText('roomCodeTag',room);$('startRoomBtn').hidden=!S.isHost;
  watch(`rooms/${room}/meta`,data=>{if(!data){toast('Room was deleted.',true);return;}S.meta=data;renderRoomHeader();applyRoomStatus();});
  watch(`rooms/${room}/paper`,data=>{S.paper=data;if(S.meta)applyRoomStatus();});
  watch(`rooms/${room}/members`,data=>{S.members=data||{};renderMembers();renderLeaderboard();if(S.isHost){maybeFinishRoom();get(ref(S.db,`rooms/${room}/submissions`)).then(s=>scoreIncoming(s.val()||{})).catch(e=>toast(errorMessage(e),true));}});
  watch(`rooms/${room}/messages`,data=>{S.messages=data||{};renderMessages();});
  watch(`rooms/${room}/scores`,data=>{S.scores=data||{};renderLeaderboard();if(S.myReport){renderReportSelector();archiveMyRoomReport().catch(e=>console.warn('Student history sync pending:',e));}if(S.isHost)maybeFinishRoom();});
  watch(`rooms/${room}/submissions/${S.uid}`,data=>{S.ownSubmission=data;if(data){if(S.exam)S.exam.submitted=true;applyRoomStatus();}});
  watch(`rooms/${room}/resultSessions/${S.uid}`,data=>{
    if(S.room!==room)return;
    S.peerSessionKnown=true;
    if(data===true){S.peerSessionState='active';}
    else if(data===false){
      S.peerSessionState='closed';
      discardPeerReportCache();
    }
    if(S.view==='results' && S.myReport){
      renderReportSelector();renderLeaderboard();
    }
    if(data===null && S.view==='results' && S.myReport && S.scores?.[S.uid])ensurePeerSession().catch(e=>toast('Report sharing: '+errorMessage(e),true));
  });
  watch(`rooms/${room}/reports/${S.uid}`,data=>{S.myReport=data;S.reportCache[S.uid]=data;if(data){applyRoomStatus();renderReportSelector();archiveMyRoomReport().catch(e=>console.warn('Student history sync pending:',e));}});
  if(S.isHost){
    watch(`rooms/${room}/submissions`,data=>{scoreIncoming(data||{}).catch(e=>toast(`Scoring error: ${errorMessage(e)}`,true));});
  }
}
async function archiveMyRoomReport(){
  if(!S.db||!S.uid||!S.room||!S.myReport||!isGoogleUser())return;
  const score=S.scores?.[S.uid]||((await get(ref(S.db,`rooms/${S.room}/scores/${S.uid}`))).val());
  if(!score)return;
  await set(ref(S.db,`studentHistory/${S.uid}/${S.room}`),{
    uid:S.uid,room:S.room,title:S.meta?.title||'Live CBT',
    name:S.members?.[S.uid]?.name||displayName()||'Student',
    createdAt:Number(score.submittedAt)||Date.now(),score,report:S.myReport
  });
}
function renderRoomHeader(){if(!S.meta)return;setText('roomTitle',S.meta.title);setText('roomStatusTag',S.meta.status==='lobby'?'Lobby':S.meta.status==='started'?'In progress':'Finished');setText('roomCountTag',`${Object.keys(S.members).length} member(s)`);setText('hostHint',S.isHost?'You are the host. Keep this tab open until results are calculated.':'Waiting for the host to start the exam.');}
function renderMembers(){if(!S.room)return;const list=$('memberList');list.replaceChildren();const entries=Object.entries(S.members||{});
  for(const [uid,m] of entries){
    const item=addText('div','member-item','');item.append(addText('div','avatar',(m.name||'?')[0].toUpperCase()));
    const details=addText('div','','');details.append(addText('strong','',m.name+(uid===S.uid?' (you)':'')),addText('small','',uid===S.meta?.hostUid?'Host':S.scores?.[uid]?'Submitted & scored':'Participant'));
    item.append(details);list.append(item);
  }
  setText('roomCountTag',`${entries.length} member(s)`);
}
function renderMessages(){const vals=Object.values(S.messages||{}).sort((a,b)=>(a.sentAt||0)-(b.sentAt||0)).slice(-100);
  for(const id of ['lobbyChatMessages','examChatMessages']){
    const root=$(id);if(!root)continue;root.replaceChildren();
    for(const m of vals){const line=addText('div',`chat-message${m.uid===S.uid?' me':''}`,'');line.append(addText('strong','',roomName(m.uid)),addText('span','',m.text));root.append(line);}root.scrollTop=root.scrollHeight;
  }
}
async function sendChat(ev,field){ev.preventDefault();try{if(!S.room||!S.meta)throw Error('You are not in a room.');if(S.meta.status!=='lobby'&&!S.meta.examChat)throw Error('Chat during the exam is disabled for this room.');
  const inp=$(field);const message=cleanText(inp.value,300);if(!message)return;
  await set(push(ref(S.db,`rooms/${S.room}/messages`)),{uid:S.uid,text:message,sentAt:serverTimestamp()});inp.value='';
}catch(e){toast(errorMessage(e),true);}}
async function startRoom(){
  try{if(!S.isHost||!S.room||!S.meta)throw Error('Only the host can start the room.');
    if(!S.pack)throw Error('Host answer key not found in this browser. Do not start; reimport the original test code first.');
    if(Object.keys(S.members).length<2 && !confirm('No friends have joined yet. Start anyway?'))return;
    if(!confirm('Start the same timed CBT for everyone in the room now?'))return;
    $('startRoomBtn').disabled=true;
    await update(ref(S.db,`rooms/${S.room}/meta`),{status:'started',startedAt:serverTimestamp()});
  }catch(e){toast(errorMessage(e),true);}finally{$('startRoomBtn').disabled=false;}
}
function applyRoomStatus(){
  if(!S.meta||!S.paper)return;
  if(S.meta.status==='lobby'){
    if(S.view==='results'||S.view==='exam')return;view('room');$('lobbyView').hidden=false;renderRoomHeader();return;
  }
  if(S.ownSubmission || S.meta.status==='finished'){
    if(S.meta.status==='finished'&&!S.ownSubmission&&S.exam&&!S.exam.submitted){S.exam.submitted=true;clearExamClock();toast('The room has closed. Your answers were not submitted before the deadline.',true);}
    renderResults();return;
  }
  if(S.meta.status==='started')beginExam(false);
}
function beginExam(isSolo){
  if(!S.paper||!S.paper.questions?.length)return;
  S.solo=isSolo;
  if(!S.exam){S.exam=loadAttempt();S.exam.submitted=false;S.exam.visited[0]=true;saveAttempt();}
  if(S.view!=='exam')view('exam');
  setText('examModeLabel',isSolo?'SOLO PRACTICE':'LIVE ROOM · '+S.room);
  setText('examTitle',S.paper.title);
  $('examChatBox').hidden=isSolo || !S.meta?.examChat;
  renderExam();
  if(!S.clock)S.clock=setInterval(updateClock,1000);updateClock();
}
function totalSeconds(){return (S.solo?S.pack.durationMinutes:S.meta.durationMinutes)*60;}
function remainingSeconds(){const start=S.solo?S.soloStartedAt:S.meta?.startedAt;return Math.max(0,totalSeconds()-Math.floor((serverNow()-Number(start))/1000));}
function updateClock(){if(S.view!=='exam'||S.exam?.submitted)return;const remain=remainingSeconds();setText('timerText',formatTime(remain));$('timerText').parentElement.classList.toggle('low',remain<=300);if(remain<=0)finalizeSubmission(true).catch(e=>toast(errorMessage(e),true));}
function markCurrentVisited(){if(!S.exam)return;S.exam.visited[S.currentIdx]=true;saveAttempt();}
function sections(){return [...new Set(S.paper.questions.map(q=>q.subject||'General'))];}
function renderExam(){if(!S.exam||!S.paper)return;const q=S.paper.questions[S.currentIdx];if(!q)return;
  const tabs=$('sectionTabs');tabs.replaceChildren();for(const subj of sections()){
    const b=addText('button',`subject-tab${subj===q.subject?' selected':''}`,subj);b.type='button';b.onclick=()=>gotoQuestion(S.paper.questions.findIndex(qq=>qq.subject===subj));tabs.append(b);
  }
  setText('questionNumber',`Question ${S.currentIdx+1} of ${S.paper.questions.length}${q.bonus?' · DROPPED (+4 bonus)':''}`);
  setText('questionTypeTag',q.type==='numerical'?'Numerical value':q.type==='multi'?'Multiple correct':'Single correct');
  const body=$('questionBody');body.replaceChildren(addText('div','',q.text||'[Image question]'));
  if(safeImage(q.image)){const img=document.createElement('img');img.src=q.image;img.alt=`Illustration for question ${S.currentIdx+1}`;img.loading='lazy';body.append(img);}
  const opts=$('questionOptions');opts.replaceChildren();const selected=S.exam.answers[S.currentIdx];
  if(q.type==='numerical'){
    opts.append(addText('label','numeric-label','Enter your numerical answer:'));
    const inp=document.createElement('input');inp.type='number';inp.step='any';inp.className='numeric-input';inp.placeholder='Type a number';inp.value=selected??'';
    inp.oninput=()=>{const v=inp.value.trim();S.exam.answers[S.currentIdx]=v===''?null:v;saveAttempt();renderPalette();};opts.append(inp);
  }else{
    q.options.forEach((option,i)=>{
      const letter=ABC[i];const active=q.type==='multi'?Array.isArray(selected)&&selected.includes(letter):selected===letter;
      const btn=addText('button',`option-btn${active?' selected':''}`,'');btn.type='button';btn.append(addText('span','option-letter',letter),addText('span','',option));
      btn.onclick=()=>{
        if(q.type==='multi'){const cur=Array.isArray(S.exam.answers[S.currentIdx])?[...S.exam.answers[S.currentIdx]]:[];S.exam.answers[S.currentIdx]=cur.includes(letter)?cur.filter(x=>x!==letter):[...cur,letter].sort();if(!S.exam.answers[S.currentIdx].length)S.exam.answers[S.currentIdx]=null;}
        else S.exam.answers[S.currentIdx]=letter;
        saveAttempt();renderExam();
      };opts.append(btn);
    });
  }
  $('prevBtn').disabled=S.currentIdx===0;
  $('saveNextBtn').textContent=S.currentIdx===S.paper.questions.length-1?'Save answer':'Save & next →';
  $('reviewBtn').textContent=S.exam.review[S.currentIdx]?'Remove review flag':'Mark for review';
  renderPalette();typeset(body);typeset(opts);
}
function answerSet(v){return v!==null&&v!==undefined&&v!==''&&(!Array.isArray(v)||v.length>0);}
function colorClass(i){const a=answerSet(S.exam.answers[i]),r=!!S.exam.review[i],v=!!S.exam.visited[i];return r?(a?'both':'review'):(a?'answer':(v?'notanswer':'unseen'));}
function renderPalette(){if(!S.exam||!S.paper)return;
  const grid=$('paletteGrid');grid.replaceChildren();
  const subject=S.paper.questions[S.currentIdx]?.subject||'General';
  let done=0,sectionDone=0,sectionReview=0,sectionCount=0;
  S.paper.questions.forEach((q,i)=>{
    if(answerSet(S.exam.answers[i]))done++;
    if((q.subject||'General')!==subject)return;
    sectionCount++;
    if(answerSet(S.exam.answers[i]))sectionDone++;
    if(S.exam.review[i])sectionReview++;
    const cl=colorClass(i);
    const b=addText('button',`palette-q ${cl}${i===S.currentIdx?' current':''}`,String(i+1));
    b.type='button';b.title=`${subject} · Question ${i+1} (${cl})`;b.onclick=()=>gotoQuestion(i);grid.append(b);
  });
  setText('paletteSection',`${subject} · ${sectionCount} questions`);
  setText('questionCounts',`${subject}: ${sectionDone}/${sectionCount} answered · ${sectionReview} review | Total: ${done}/${S.paper.questions.length} answered`);
}
function gotoQuestion(i){if(!S.exam || i<0 || i>=S.paper.questions.length)return;S.currentIdx=i;markCurrentVisited();renderExam();}
function elapsedSeconds(){const start=S.solo?S.soloStartedAt:S.meta?.startedAt;return Math.min(totalSeconds(),Math.max(0,Math.floor((serverNow()-Number(start))/1000)));}
function answersForTransport(){return S.exam.answers.map(a=>a??'').map(a=>Array.isArray(a)?a.join(','):String(a));}
async function finalizeSubmission(auto=false){
  if(!S.exam||S.exam.submitted||S.syncing)return;
  if(!auto){const unanswered=S.exam.answers.filter(x=>!answerSet(x)).length;if(!confirm(`Submit your paper now? ${unanswered} unanswered question(s) will receive 0 marks.`))return;}
  S.syncing=true;
  try{
    if(S.solo){S.exam.submitted=true;clearExamClock();const submission={answers:answersForTransport(),elapsedSeconds:elapsedSeconds(),submittedAt:Date.now()};
      const {score,report}=grade(S.pack,submission);S.scores={[S.uid||'solo']:score};S.myReport=report;S.reportCache={[S.uid||'solo']:report};S.members={[S.uid||'solo']:{name:displayName()||'You'}};if(isGoogleUser())addPendingSoloHistory(score,report);renderResults();toast('Submitted! Your score is ready.');return;}
    if(S.meta?.status!=='started')throw Error('This room is no longer accepting submissions.');
    const submission={answers:answersForTransport(),elapsedSeconds:elapsedSeconds(),submittedAt:serverTimestamp()};
    await set(ref(S.db,`rooms/${S.room}/submissions/${S.uid}`),submission);
    S.exam.submitted=true;saveAttempt();localStorage.removeItem(attemptStorageKey());clearExamClock();renderResults();toast('Submitted! Calculating score on the host device…');
  }finally{S.syncing=false;}
}
function isCorrectAnswer(q,value){
  if(!answerSet(value))return false;
  if(q.type==='numerical'){
    const n=Number(value);return Number.isFinite(n)&&Math.abs(n-Number(q.answer))<=Number(q.tolerance??0.001);
  }
  const actual=answerLetters(q.answer),v=answerLetters(value);
  return actual.length===v.length&&actual.every((a,i)=>a===v[i]);
}
function grade(pack,submission){
  const qs=pack.questions,values=submission.answers||[];
  const sum={score:0,correct:0,wrong:0,unanswered:0,maxScore:0,elapsedSeconds:Number(submission.elapsedSeconds)||0,submittedAt:Number(submission.submittedAt)||Date.now()};
  const subjectStats={};
  const questions=qs.map((q,i)=>{
    const chosen=values[i]??'';const attempted=answerSet(chosen),correct=Boolean(q.bonus)||(attempted&&isCorrectAnswer(q,chosen));
    const outcome=q.bonus?'correct':attempted?(correct?'correct':'wrong'):'unanswered';
    const pts=q.bonus?q.marks:(outcome==='correct'?q.marks:outcome==='wrong'?q.negativeMarks:0);
    sum.score+=pts;sum.maxScore+=q.marks;sum[outcome]++;
    if(!subjectStats[q.subject])subjectStats[q.subject]={score:0,correct:0,wrong:0,unanswered:0,maxScore:0};
    const st=subjectStats[q.subject];st.score+=pts;st.maxScore+=q.marks;st[outcome]++;
    return {id:q.id,subject:q.subject,text:q.text,chosen,answer:q.bonus?'DROPPED (+4 bonus)':(Array.isArray(q.answer)?q.answer.join(','):String(q.answer)),outcome,points:pts,explanation:q.explanation||''};
  });
  sum.score=Number(sum.score.toFixed(4));sum.maxScore=Number(sum.maxScore.toFixed(4));
  return {score:sum,report:{questions,subjectStats}};
}
async function scoreIncoming(submissions){
  if(!S.isHost||!S.room||!S.meta||S.meta.status==='lobby')return;
  if(!S.pack){try{S.pack=normalizePack(JSON.parse(localStorage.getItem(`ef-host-paper:${S.room}`)||'null'));}catch{}
    if(!S.pack){toast('Host answer key missing. Reopen this room from the browser that created it.',true);return;}
  }
  for(const [uid,submission] of Object.entries(submissions)){
    if(S.scores?.[uid]||S.busyScoring.has(uid)||!S.members[uid])continue;
    S.busyScoring.add(uid);
    try{
      const {score,report}=grade(S.pack,submission);
      // Write report first so the student's result details are ready when score appears.
      await set(ref(S.db,`rooms/${S.room}/reports/${uid}`),report);
      await set(ref(S.db,`rooms/${S.room}/scores/${uid}`),score);
    }catch(e){toast(`Scoring ${roomName(uid)} failed: ${errorMessage(e)}`,true);}
    finally{S.busyScoring.delete(uid);}
  }
  maybeFinishRoom();
}
function maybeFinishRoom(){
  if(!S.isHost||!S.meta||S.meta.status!=='started'||!Object.keys(S.members||{}).length)return;
  const all=Object.keys(S.members).every(id=>S.scores[id]);
  const timeout=Number(S.meta.startedAt)&&serverNow()>Number(S.meta.startedAt)+S.meta.durationMinutes*60000+30000;
  if((all||timeout)&&!S.finishing){S.finishing=true;update(ref(S.db,`rooms/${S.room}/meta`),{status:'finished',finishedAt:serverTimestamp()}).catch(e=>toast(errorMessage(e),true)).finally(()=>S.finishing=false);}
}
function renderResults(){
  if(S.solo){view('results');setText('resultsTitle','Solo result');setText('resultsSub','Your answers were checked automatically against the imported answer key.');}
  else {view('results');setText('resultsTitle','Squad results & leaderboard');setText('resultsSub',S.meta?.status==='finished'?'All available results are in.':'Results update automatically as participants submit.');}
  const ready=!!S.myReport;
  $('waitingResults').hidden=ready;
  $('resultsContent').hidden=!ready;
  if(!ready){const w=$('waitingResults');w.querySelector('h2').textContent=S.meta?.status==='finished'&&!S.ownSubmission?'Room closed':'Paper submitted!';w.querySelector('p').textContent=S.meta?.status==='finished'&&!S.ownSubmission?'Your answers were not submitted before the room closed. Contact the host.':'Waiting for the host browser to calculate your score. Keep the host tab open.';return;}
  if(!S.solo&&S.peerSessionKnown&&S.peerSessionState==='new'&&S.scores?.[S.uid])
    ensurePeerSession().catch(e=>toast('Report sharing: '+errorMessage(e),true));
  renderLeaderboard();renderReportSelector();renderReport(S.reportCache[S.selectedReportUid]||S.myReport);
}
function orderedLeaderboard(){return Object.entries(S.scores||{}).sort((a,b)=>(b[1].score-a[1].score)||(b[1].correct-a[1].correct)||(a[1].elapsedSeconds-b[1].elapsedSeconds));}
function renderLeaderboard(){if(S.view!=='results'||!S.myReport)return;const board=orderedLeaderboard();const list=$('leaderboardList');list.replaceChildren();
  for(const [idx,[uid,score]] of board.entries()){
    const entry=addText('div','leader-row','');entry.append(addText('span','rank',`#${idx+1}`));
    const box=addText('div','','');box.append(addText('strong','',`${roomName(uid)}${uid===S.uid?' (you)':''}`),addText('small','',`${score.correct} correct · ${score.wrong} wrong · ${formatTime(score.elapsedSeconds)} used`));
    entry.append(box,addText('span','points',`${score.score} / ${score.maxScore}`));
    if(!S.solo&&(uid===S.uid||S.uid===ADMIN_UID||canViewCurrentRoomPeers())){
      entry.classList.add('leader-selectable');entry.title='View '+roomName(uid)+' report';entry.tabIndex=0;entry.setAttribute('role','button');
      const open=()=>{const selector=$('reportSelect');if([...selector.options].some(o=>o.value===uid)){selector.value=uid;selectReport();}};
      entry.addEventListener('click',open);entry.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open();}});
    }
    list.append(entry);
  }
  const yourScore=S.scores?.[S.uid]||S.scores?.['solo'];
  if(yourScore){$('statCards').replaceChildren(...[
    ['Your score',`${yourScore.score} / ${yourScore.maxScore}`],['Correct',yourScore.correct],['Incorrect',yourScore.wrong],['Accuracy',`${Math.round(100*yourScore.correct/Math.max(1,yourScore.correct+yourScore.wrong))}%`]
  ].map(([label,val])=>{const c=addText('div','stat-card','');c.append(addText('strong','',String(val)),addText('small','',label));return c;}));}
}
function discardPeerReportCache(){
  if(!S.uid)return;
  for(const uid of Object.keys(S.reportCache||{}))if(uid!==S.uid)delete S.reportCache[uid];
  S.selectedReportUid=S.uid;
  if(S.view==='results'&&S.myReport){
    renderReportSelector();
    renderReport(S.myReport);
  }
}
// A participant's peer-report session may be opened only once, after they submit
// and are scored. Firebase rules reject any attempt to reopen after it is closed.
async function ensurePeerSession(){
  if(S.solo||!S.room||!S.myReport||!S.ownSubmission||!S.scores?.[S.uid]||!S.meta?.shareReports||!S.peerSessionKnown||S.peerSessionState!=='new'||S.peerSessionPromise)return;
  const room=S.room,uid=S.uid;
  S.peerSessionState='opening';
  const path=ref(S.db,`rooms/${room}/resultSessions/${uid}`);
  S.peerSessionPromise=(async()=>{
    try{
      // Register server-side revocation BEFORE granting peer access.
      await onDisconnect(path).set(false);
      await set(path,true);
      if(S.room!==room||S.uid!==uid||S.view!=='results'){
        await set(path,false);
        S.peerSessionState='closed';
        discardPeerReportCache();
        return;
      }
      S.peerSessionState='active';
      renderReportSelector();renderLeaderboard();
    }catch(e){
      // Fail closed if the disconnection safeguard cannot be registered.
      try{await set(path,false);}catch{}
      S.peerSessionState='closed';
      discardPeerReportCache();
      throw e;
    }finally{S.peerSessionPromise=null;}
  })();
  return S.peerSessionPromise;
}
function canViewCurrentRoomPeers(){
  return !S.solo && !!S.myReport && !!S.ownSubmission && !!S.scores?.[S.uid] &&
    !!S.meta?.shareReports && S.peerSessionState==='active' && S.view==='results';
}
async function exitResults(){
  const room=S.room,uid=S.uid;
  if(room && S.peerSessionState==='opening' && S.peerSessionPromise){
    try{await S.peerSessionPromise;}catch{}
  }
  if(room && S.peerSessionState==='active'){
    try{await set(ref(S.db,`rooms/${room}/resultSessions/${uid}`),false);}
    catch(e){
      toast('Could not close results sharing. Try Exit again, or close this browser tab to trigger automatic revocation: '+errorMessage(e),true);
      return;
    }
  }
  S.peerSessionState='closed';
  discardPeerReportCache();
  home();
}
function renderReportSelector(){
  if(!S.myReport)return;
  const box=$('reportSelect'),prior=S.selectedReportUid||S.uid;
  box.replaceChildren();
  const allowAll=S.solo||S.uid===ADMIN_UID||canViewCurrentRoomPeers();
  const candidates=allowAll?Object.keys(S.scores||{}):[S.uid];
  if(!candidates.includes(S.uid))candidates.unshift(S.uid);
  for(const uid of candidates){
    const opt=document.createElement('option');opt.value=uid;opt.textContent=roomName(uid);
    box.append(opt);
  }
  S.selectedReportUid=candidates.includes(prior)?prior:S.uid;
  box.value=S.selectedReportUid;
  box.parentElement.hidden=candidates.length<=1;
  $('reportSharingHint').textContent=S.solo?'Your solo report':
    S.uid===ADMIN_UID?'Admin view: all scored participants':
    canViewCurrentRoomPeers()?'Open a scored participant to compare reports. Peer access ends permanently when you exit these results or disconnect.':
    'Other detailed reports are not shared for this room. Your own report remains available.';
}
async function selectReport(){const uid=$('reportSelect').value;
  if(!S.solo&&uid!==S.uid&&S.uid!==ADMIN_UID&&!canViewCurrentRoomPeers())return;
  S.selectedReportUid=uid;
  if(S.reportCache[uid]){renderReport(S.reportCache[uid]);return;}
  $('reportHeading').textContent='Loading '+roomName(uid)+' report…';
  $('subjectBreakdown').replaceChildren();$('reportQuestions').replaceChildren();
  try{const snap=await get(ref(S.db,`rooms/${S.room}/reports/${uid}`));
    if(uid!==S.selectedReportUid)return;
    if(snap.exists()){S.reportCache[uid]=snap.val();renderReport(snap.val());}
    else $('reportHeading').textContent=roomName(uid)+' report not yet available';
  }catch(e){toast(errorMessage(e),true);S.selectedReportUid=S.uid;$('reportSelect').value=S.uid;renderReport(S.myReport);}
}
function renderReport(report){if(!report)return;setText('reportHeading',`${roomName(S.selectedReportUid)}'s report`);
  const stats=$('subjectBreakdown');stats.replaceChildren();for(const [subject,data] of Object.entries(report.subjectStats||{})){
    const card=addText('div','subject-stat',subject);card.append(addText('b','',`${data.score}/${data.maxScore} · ${data.correct} correct`));stats.append(card);
  }
  const qs=$('reportQuestions');qs.replaceChildren();for(const [i,q] of (report.questions||[]).entries()){
    const item=addText('article','report-item','');item.append(addText('div','mini',`${i+1} · ${q.subject} · ${q.outcome.toUpperCase()} · ${q.points>=0?'+':''}${q.points}`),addText('p','',q.text||'[Image question]'));
    item.append(addText('div',q.outcome==='correct'?'correct':'wrong',`Your answer: ${q.chosen||'Not attempted'}  |  Correct answer: ${q.answer}`));
    if(q.explanation)item.append(addText('p','',`Explanation: ${q.explanation}`));qs.append(item);
  }typeset(qs);
}
function startSolo(){try{if(!S.pack)throw Error('Import a test code first.');S.solo=true;S.room=null;S.paper=publicPaper(S.pack);S.meta=null;S.exam=null;S.myReport=null;S.reportCache={};S.scores={};S.members={};S.currentIdx=0;S.uid=S.uid||'solo';S.soloStartedAt=Date.now();S.selectedReportUid=S.uid||'solo';localStorage.removeItem(attemptStorageKey());beginExam(true);}catch(e){toast(errorMessage(e),true);}}
function home(){if(S.isHost && S.meta?.status==='started' && Object.keys(S.scores).length<Object.keys(S.members).length && !confirm('You are hosting a live room. Leaving this page stops automatic scoring for friends until you reopen the room. Leave anyway?'))return;clearRoomListeners();S.room=null;S.meta=null;S.paper=null;S.exam=null;S.solo=false;S.isHost=false;S.selectedReportUid=S.uid;urlRoom('');view('home');}
function downloadFile(filename,contents,mime){const blob=new Blob([contents],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

// DOM EVENTS
$('importBtn').addEventListener('click',()=>{try{importPack(parsePack($('packInput').value));}catch(e){status(e.message,true);}});
$('demoBtn').addEventListener('click',()=>importPack(DEMO_PACK));
$('exportBtn').addEventListener('click',()=>{if(!S.pack)return toast('Import a test first.',true);copyText(encodePack(S.pack));});
$('clearBtn').addEventListener('click',()=>{$('packInput').value='';S.pack=null;$('packSummary').hidden=true;$('previewPanel').hidden=true;$('packStatus').hidden=true;});
$('downloadJsonBtn').addEventListener('click',()=>{if(!S.pack)return;downloadFile('examforge-test.json',JSON.stringify(S.pack,null,2),'application/json');});
$('copyRulesBtn').addEventListener('click',()=>copyText(JSON.stringify(DATABASE_RULES,null,2)));
$('createRoomBtn').addEventListener('click',createRoom);
$('joinRoomBtn').addEventListener('click',joinRoom);
$('soloBtn').addEventListener('click',startSolo);
$('copyInviteBtn').addEventListener('click',()=>S.room&&copyText(inviteUrl(S.room)));
$('leaveRoomBtn').addEventListener('click',home);
$('startRoomBtn').addEventListener('click',startRoom);
$('lobbyChatForm').addEventListener('submit',ev=>sendChat(ev,'lobbyChatInput'));
$('examChatForm').addEventListener('submit',ev=>sendChat(ev,'examChatInput'));
$('prevBtn').addEventListener('click',()=>gotoQuestion(S.currentIdx-1));
$('saveNextBtn').addEventListener('click',()=>gotoQuestion(Math.min(S.currentIdx+1,S.paper.questions.length-1)));
$('reviewBtn').addEventListener('click',()=>{if(!S.exam)return;S.exam.review[S.currentIdx]=!S.exam.review[S.currentIdx];saveAttempt();renderExam();});
$('clearAnswerBtn').addEventListener('click',()=>{if(!S.exam)return;S.exam.answers[S.currentIdx]=null;saveAttempt();renderExam();});
$('submitBtn').addEventListener('click',()=>finalizeSubmission().catch(e=>toast(errorMessage(e),true)));
$('resultsHomeBtn').addEventListener('click',exitResults);
$('reportSelect').addEventListener('change',selectReport);


// Recover name and previously imported paper for convenience.
$('nameInput').value=localStorage.getItem('ef-display-name')||'';
S.currentIdx=0;
connectFirebase();
