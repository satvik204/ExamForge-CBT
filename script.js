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
          ".validate": "newData.hasChildren([\"hostUid\", \"title\", \"status\", \"createdAt\", \"durationMinutes\", \"shareReports\", \"examChat\", \"marking\"]) && newData.child(\"hostUid\").isString() && newData.child(\"title\").isString() && newData.child(\"title\").val().length <= 150 && newData.child(\"status\").isString() && (newData.child(\"status\").val() === \"lobby\" || newData.child(\"status\").val() === \"started\" || newData.child(\"status\").val() === \"finished\") && newData.child(\"durationMinutes\").isNumber() && newData.child(\"durationMinutes\").val() >= 1 && newData.child(\"durationMinutes\").val() <= 300 && newData.child(\"shareReports\").isBoolean() && newData.child(\"examChat\").isBoolean() && (!data.exists() || newData.child(\"hostUid\").val() === data.child(\"hostUid\").val()) && newData.child('createdAt').isNumber() && newData.child('marking/correct').isNumber() && newData.child('marking/wrong').isNumber() && (!data.exists() || (newData.child('title').val() === data.child('title').val() && newData.child('durationMinutes').val() === data.child('durationMinutes').val() && newData.child('shareReports').val() === data.child('shareReports').val() && newData.child('examChat').val() === data.child('examChat').val() && newData.child('marking/correct').val() === data.child('marking/correct').val() && newData.child('marking/wrong').val() === data.child('marking/wrong').val() && newData.child('createdAt').val() === data.child('createdAt').val() && ((data.child('status').val() === 'lobby' && (newData.child('status').val() === 'lobby' || (newData.child('status').val() === 'started' && newData.child('startedAt').isNumber()))) || (data.child('status').val() === 'started' && (newData.child('status').val() === 'started' || (newData.child('status').val() === 'finished' && newData.child('finishedAt').isNumber()))) || (data.child('status').val() === 'finished' && newData.child('status').val() === 'finished')) && (!data.child('startedAt').exists() || newData.child('startedAt').val() === data.child('startedAt').val()) && (!data.child('finishedAt').exists() || newData.child('finishedAt').val() === data.child('finishedAt').val())))"
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
            ".validate": "newData.hasChildren([\"answers\", \"submittedAt\", \"elapsedSeconds\"]) && newData.child(\"submittedAt\").isNumber() && newData.child(\"elapsedSeconds\").isNumber() && newData.child(\"elapsedSeconds\").val() >= 0 && newData.child('elapsedSeconds').val() <= root.child('rooms/' + $room + '/meta/durationMinutes').val() * 60 + 10 && newData.child('submittedAt').val() <= now + 60000 && newData.child('submittedAt').val() >= root.child('rooms/' + $room + '/meta/startedAt').val() - 60000"
          }
        },
        "scores": {
          ".read": "auth != null && (root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid || root.child(\"rooms/\" + $room + \"/members/\" + auth.uid).exists())",
          "$uid": {
            ".write": "auth != null && root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid && root.child(\"rooms/\" + $room + \"/submissions/\" + $uid).exists() && !data.exists() && newData.exists()",
            ".validate": "newData.hasChildren([\"score\", \"correct\", \"wrong\", \"unanswered\", \"maxScore\", \"elapsedSeconds\"]) && newData.child(\"score\").isNumber() && newData.child(\"correct\").isNumber() && newData.child(\"wrong\").isNumber() && newData.child(\"unanswered\").isNumber() && newData.child(\"maxScore\").isNumber() && newData.child(\"elapsedSeconds\").isNumber() && newData.child('correct').val() >= 0 && newData.child('wrong').val() >= 0 && newData.child('unanswered').val() >= 0 && newData.child('correct').val() + newData.child('wrong').val() + newData.child('unanswered').val() <= 300 && newData.child('correct').val() + newData.child('wrong').val() + newData.child('unanswered').val() > 0 && newData.child('elapsedSeconds').val() >= 0 && newData.child('elapsedSeconds').val() <= root.child('rooms/' + $room + '/meta/durationMinutes').val() * 60 + 10 && newData.child('maxScore').val() >= 0 && newData.child('maxScore').val() <= 100000"
          }
        },
        "reports": {
          "$uid": {
            ".read": "auth != null && (auth.uid === $uid || auth.uid === 'PASTE_YOUR_GOOGLE_AUTH_UID_HERE' || (root.child('rooms/' + $room + '/meta/shareReports').val() === true && root.child('rooms/' + $room + '/members/' + auth.uid).exists() && root.child('rooms/' + $room + '/submissions/' + auth.uid).exists() && root.child('rooms/' + $room + '/scores/' + auth.uid).exists() && root.child('rooms/' + $room + '/scores/' + $uid).exists() && root.child('rooms/' + $room + '/resultSessions/' + auth.uid).val() === true))",
            ".write": "auth != null && root.child(\"rooms/\" + $room + \"/meta/hostUid\").val() === auth.uid && root.child(\"rooms/\" + $room + \"/submissions/\" + $uid).exists() && !data.exists() && newData.exists()",
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
    "errorBookTags": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous'",
        ".write": "auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous' && !newData.exists()",
        "$entry": {
          ".write": "auth != null && auth.uid === $uid && auth.token.firebase.sign_in_provider !== 'anonymous' && newData.exists()",
          ".validate": "newData.hasChildren(['chapter','note']) && newData.child('chapter').isString() && newData.child('chapter').val().length <= 100 && newData.child('note').isString() && newData.child('note').val().length <= 1000",
          "chapter": {
            ".validate": "newData.isString()"
          },
          "note": {
            ".validate": "newData.isString()"
          },
          "$other": {
            ".validate": false
          }
        }
      }
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
    return { id: cleanText(q.id || `Q${i+1}`,40), subject,...(cleanText(q.chapter,100)?{chapter:cleanText(q.chapter,100)}:{}),type,text,image,options,answer,tolerance,marks,negativeMarks,explanation:cleanText(q.explanation,7000),bonus:Boolean(q.bonus),...(Number.isInteger(Number(q.paperPage))&&Number(q.paperPage)>=1&&Number(q.paperPage)<=1000?{paperPage:Number(q.paperPage)}:{}) };
  });
  const pack={version:1,title,durationMinutes,marking:{correct,wrong},questions};
  const paperUrl=validPaperUrl(input.paperUrl); if(paperUrl)pack.paperUrl=paperUrl;
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
  return {title:pack.title,...(pack.paperUrl?{paperUrl:pack.paperUrl}:{}),...(efAttachment?.pack===pack?{paperDocument:efAttachment.document}:{}),questions:pack.questions.map(({id,subject,chapter,type,text,image,options,bonus,paperPage})=>({id,subject,...(chapter?{chapter}:{}),type,text,image,options,bonus,...(paperPage?{paperPage}:{})}))};
}

/* Read-only paper and image viewers. No answer data is rendered or shared. */
function validPaperUrl(value){
  try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=2000?u.href:'';}catch{return '';}
}
function paperLink(url,page){
  const link=validPaperUrl(url);if(!link)return '';
  const u=new URL(link);u.hash=page?'page='+page:'';return u.href;
}
function viewerButton(label,action){
  const b=document.createElement('button');b.type='button';b.className='btn btn-outline ef-paper-control';b.textContent=label;b.onclick=action;return b;
}
function viewerAnchor(label,url){
  const a=document.createElement('a');a.className='btn btn-outline ef-paper-control';a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function makeViewer(title){
  const d=document.createElement('dialog');
  d.setAttribute('aria-label',title);d.className='ef-paper-dialog';
  Object.assign(d.style,{width:'min(96vw,1100px)',maxWidth:'96vw',height:'min(90vh,900px)',maxHeight:'90vh',padding:'12px',border:'1px solid #64748b',borderRadius:'12px',background:'#111827',color:'#f1f5f9',overflow:'hidden',boxSizing:'border-box'});
  const bar=document.createElement('div');Object.assign(bar.style,{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'8px',paddingBottom:'8px'});
  const h=document.createElement('strong');h.textContent=title;h.style.flex='1';bar.append(h);
  const body=document.createElement('div');body.className='ef-paper-scroll';Object.assign(body.style,{overflow:'auto',flex:'1',minHeight:'0',overscrollBehavior:'contain',touchAction:'pan-x pan-y',scrollbarGutter:'stable'});
  const wrapper=document.createElement('div');Object.assign(wrapper.style,{display:'flex',flexDirection:'column',height:'100%',minHeight:'0'});
  const close=viewerButton('Close',()=>d.close());bar.append(close);wrapper.append(bar,body);d.append(wrapper);
  d.addEventListener('close',()=>{d.remove();});
  document.body.append(d);d.showModal();return {d,bar,body};
}
function openImageZoom(src,alt){
  if(!safeImage(src))return;
  const {bar,body}=makeViewer('Image zoom');
  const img=document.createElement('img');img.src=src;img.alt=alt||'Question illustration';
  Object.assign(img.style,{display:'block',maxWidth:'none',height:'auto',margin:'0 auto'});
  let zoom=1;
  function apply(){img.style.width=Math.round(zoom*100)+'%';label.textContent=Math.round(zoom*100)+'%';}
  const label=document.createElement('span');label.setAttribute('aria-live','polite');
  bar.append(viewerButton('−',()=>{zoom=Math.max(.5,zoom-.25);apply();}),label,viewerButton('+',()=>{zoom=Math.min(4,zoom+.25);apply();}),viewerButton('Fit',()=>{zoom=1;apply();}));
  body.append(img);apply();
}
function addZoomImage(parent,src,alt,compact=false){
  if(!safeImage(src))return;
  const b=document.createElement('button');b.type='button';b.title='Click to zoom image';b.setAttribute('aria-label','Zoom '+alt);
  Object.assign(b.style,{display:'block',maxWidth:'100%',border:0,background:'transparent',padding:'0',cursor:'zoom-in',textAlign:'left'});
  const img=document.createElement('img');img.src=src;img.alt=alt;img.loading='lazy';img.style.maxWidth='100%';img.style.height='auto';if(compact)img.style.maxHeight='250px';
  const caption=document.createElement('span');caption.textContent='Click image to zoom';caption.style.display='block';caption.style.fontSize='12px';caption.style.opacity='.8';caption.style.color='inherit';b.style.color='inherit';
  b.append(img,caption);b.onclick=()=>openImageZoom(src,alt);parent.append(b);
}

let efPdfModule,efLocalPdf=null,efLocalPdfTitle='';
const EF_PDF_LIMIT=5*1024*1024;
let efAttachment=null,efAttachmentSerial=0,efAttachmentBusy=false;
function resetPaperAttachment(){
  efAttachmentSerial++;efAttachment=null;efAttachmentBusy=false;
  efLocalPdf=null;efLocalPdfTitle='';
  const input=$('paperPdfInput');if(input)input.value='';
  const label=$('paperPdfStatus');if(label)label.textContent='No PDF attached. Optional: upload the original question paper only.';
  const remove=$('removePaperPdfBtn');if(remove)remove.disabled=true;
}
function pdfBlobFromPaper(p){
  const item=p?.paperDocument;
  if(!item||typeof item.base64!=='string'||item.base64.length>Math.ceil(EF_PDF_LIMIT/3)*4||!item.base64.length)return null;
  try{
    const raw=atob(item.base64);
    if(raw.length!==item.size||raw.length>EF_PDF_LIMIT||!raw.slice(0,1024).includes('%PDF-'))return null;
    const data=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)data[i]=raw.charCodeAt(i);
    return new Blob([data],{type:'application/pdf'});
  }catch{return null;}
}
async function attachOriginalPaper(file){
  if(!S.pack){resetPaperAttachment();toast('Import the EF1 test code first.',true);return;}
  resetPaperAttachment();const serial=efAttachmentSerial,pack=S.pack;
  efAttachmentBusy=true;setText('paperPdfStatus','Checking and attaching PDF…');
  $('removePaperPdfBtn').disabled=false;
  try{
    if(!file.size||file.size>EF_PDF_LIMIT)throw Error('Choose a PDF no larger than 5 MiB. Compress a larger PDF first.');
    const data=new Uint8Array(await file.arrayBuffer());
    if(!new TextDecoder().decode(data.subarray(0,1024)).includes('%PDF-'))throw Error('This is not a valid PDF file.');
    let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));
    const document={name:cleanText(file.name,150)||'question-paper.pdf',size:data.length,base64:btoa(binary)};
    if(serial!==efAttachmentSerial||S.pack!==pack)return;
    efAttachment={pack,document};
    setText('paperPdfStatus',document.name+' · '+(data.length/1048576).toFixed(2)+' MiB · Ready to share with room members');
    $('removePaperPdfBtn').disabled=false;
  }catch(e){if(serial===efAttachmentSerial){setText('paperPdfStatus',e.message);$('removePaperPdfBtn').disabled=true;}}
  finally{if(serial===efAttachmentSerial)efAttachmentBusy=false;}
}
async function pdfModule(){
  if(!efPdfModule)efPdfModule=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs').then(m=>{m.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';return m;}).catch(e=>{efPdfModule=null;throw e;});
  return efPdfModule;
}
async function openPdf(source){
  const m=await pdfModule();return m.getDocument(typeof source==='string'?{url:source}:{data:new Uint8Array(await source.arrayBuffer())}).promise;
}
function selectLocalPdf(cb){
  const input=document.createElement('input');input.type='file';input.accept='application/pdf,.pdf';input.onchange=()=>{if(input.files?.[0])cb(input.files[0]);};input.click();
}
function renderQuestionList(body,p){
  body.replaceChildren();const list=document.createElement('div');
  p.questions.forEach((q,i)=>{
    const section=document.createElement('section');section.style.cssText='border-bottom:1px solid #475569;padding:16px 4px';
    section.append(addText('strong','','Q'+(i+1)+' · '+(q.subject||'General')));
    if(q.text)section.append(addText('div','question-body',q.text));
    addZoomImage(section,q.image,'Question '+(i+1));
    (q.options||[]).forEach((option,j)=>section.append(addText('div','',ABC[j]+'. '+option)));
    if(q.type==='numerical')section.append(addText('div','muted','Numerical answer'));
    list.append(section);
  });body.append(list);typeset(list);
}
function openTestPaper(page){
  const p=S.paper;if(!p?.questions?.length)return;
  const {bar,body,d}=makeViewer('Complete test paper');
  const url=paperLink(p.paperUrl);const attached=pdfBlobFromPaper(p);let generation=0,doc=null,zoom=1;
  let pageEls=[],observer=null;
  const cleanup=()=>{generation++;observer?.disconnect();observer=null;if(doc){const old=doc;doc=null;old.destroy().catch(()=>{});}};
  d.addEventListener('close',cleanup);
  const showList=()=>{cleanup();renderQuestionList(body,p);};
  const note=(msg)=>{body.replaceChildren(addText('p','',msg));};
  function setZoom(value){zoom=Math.max(.5,Math.min(3,value));for(const el of pageEls){el.style.width=Math.round(zoom*100)+'%';}zoomText.textContent=Math.round(zoom*100)+'%';}
  const zoomText=addText('span','','100%');
  bar.append(viewerButton('−',()=>setZoom(zoom-.25)),zoomText,viewerButton('+',()=>setZoom(zoom+.25)),viewerButton('Fit',()=>setZoom(1)));
  bar.append(viewerButton('Question list',showList));
  if(attached){
    const objectUrl=URL.createObjectURL(attached);
    const link=viewerAnchor('Download original PDF',objectUrl);link.download=p.paperDocument.name||'question-paper.pdf';bar.append(link);
    d.addEventListener('close',()=>URL.revokeObjectURL(objectUrl));
  }else if(url)bar.append(viewerAnchor('Open original PDF',url));
  async function showPdf(source){
    cleanup();const current=generation;pageEls=[];note('Loading original PDF…');
    try{
      const loaded=await openPdf(source);
      if(current!==generation||!d.open){await loaded.destroy();return;}doc=loaded;
      const pages=document.createElement('div');pages.className='ef-paper-pages';body.replaceChildren(pages);
      for(let n=1;n<=doc.numPages;n++){
        const wrap=document.createElement('section');wrap.className='ef-pdf-page';wrap.dataset.page=String(n);
        wrap.append(addText('div','ef-pdf-label','Page '+n+' / '+doc.numPages));
        const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Original PDF page '+n);canvas.style.aspectRatio='210 / 297';wrap.append(canvas);pages.append(wrap);pageEls.push(wrap);
      }
      setZoom(zoom);
      const activeDoc=doc;
      async function paint(el){
        if(el.dataset.rendered||current!==generation)return;el.dataset.rendered='loading';
        try{
          const pg=await activeDoc.getPage(Number(el.dataset.page));if(current!==generation)return;
          const v0=pg.getViewport({scale:1});const v=pg.getViewport({scale:Math.min(3,1800/v0.width)});
          const canvas=el.querySelector('canvas');canvas.width=Math.ceil(v.width);canvas.height=Math.ceil(v.height);canvas.style.aspectRatio=v.width+' / '+v.height;
          await pg.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;el.dataset.rendered='yes';
        }catch(e){if(current===generation){el.dataset.rendered='error';el.append(addText('p','','Page could not be rendered. Use Open original PDF.'));}}
      }
      observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer?.unobserve(entry.target);paint(entry.target);}}, {root:body,rootMargin:'700px'});
      for(const el of pageEls)observer.observe(el);
      const target=pageEls[Math.max(0,Math.min(pageEls.length-1,Number(page||1)-1))];if(target){target.scrollIntoView({block:'start'});paint(target);}
    }catch(e){
      if(current!==generation)return;
      note('The PDF could not be rendered. Check your internet connection for the PDF viewer, download the original PDF if available, or use Question list.');
    }
  }
  bar.append(viewerButton('Load local PDF',()=>selectLocalPdf(file=>{efLocalPdf=file;efLocalPdfTitle=p.title;showPdf(file);})));
  if(attached||url)bar.append(viewerButton('Original pages',()=>showPdf(attached||url)));
  if(attached)showPdf(attached);else if(efLocalPdf&&efLocalPdfTitle===p.title)showPdf(efLocalPdf);else if(url)showPdf(url);else showList();
}
/* Build a private EF1 with actual crops from a locally supplied NTA-format PDF.
   Detect all numbered headers before changing the imported pack. */
async function attachNtaImages(file,button){
  const original=S.pack;if(!original?.questions?.length){toast('Import the matching EF1 first.',true);return;}
  let doc=null;button.disabled=true;
  const progress=(msg)=>status(msg);
  try{
    progress('Reading local PDF and checking question numbering…');doc=await openPdf(file);
    const headers=[],pages=[];
    for(let n=1;n<=doc.numPages;n++){
      const page=await doc.getPage(n),v=page.getViewport({scale:1}),tc=await page.getTextContent();
      const lines=[];
      for(const item of tc.items){if(!item.str||!item.transform)continue;const xy=v.convertToViewportPoint(item.transform[4],item.transform[5]);let row=lines.find(r=>Math.abs(r.y-xy[1])<2.5);if(!row){row={y:xy[1],h:item.height||10,items:[]};lines.push(row);}row.h=Math.max(row.h,item.height||10);row.items.push({x:xy[0],str:item.str});}
      for(const row of lines){const text=row.items.sort((a,b)=>a.x-b.x).map(x=>x.str).join(' ');const m=text.match(/Question\s*Number\s*:\s*(\d+)\s+Question\s*Id\s*:\s*(\d+)/i);if(m)headers.push({q:Number(m[1]),id:m[2],page:n,top:Math.max(0,row.y-row.h-3)});}
      pages.push({width:v.width,height:v.height});
    }
    headers.sort((a,b)=>a.page-b.page||a.top-b.top);
    if(headers.length!==original.questions.length||headers.some((h,i)=>h.q!==i+1))throw Error('Detected '+headers.length+' question headers; expected '+original.questions.length+' consecutive numbers. Use the matching original NTA PDF. No images were changed.');
    if(original.questions.some((q,i)=>q.paperPage&&Math.abs(q.paperPage-headers[i].page)>0))throw Error('PDF page numbers do not match this EF1. No images were changed.');
    const crops=[];let cachedPage=0,cachedCanvas=null,scale=1.8;
    async function raster(n){
      if(cachedPage===n)return cachedCanvas;
      const pg=await doc.getPage(n),v=pg.getViewport({scale});const c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);
      const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
      await pg.render({canvasContext:ctx,viewport:v}).promise;cachedCanvas=c;cachedPage=n;return c;
    }
    for(let i=0;i<headers.length;i++){
      if(S.pack!==original)throw Error('Imported test changed during processing.');
      const h=headers[i],next=headers[i+1],last=next?next.page:doc.numPages,parts=[];
      for(let n=h.page;n<=last;n++){
        const src=await raster(n);const y0=n===h.page?Math.floor(h.top*scale):0;
        const y1=next&&n===next.page?Math.floor(next.top*scale):src.height;
        if(y1<=y0+2)continue;
        const ctx=src.getContext('2d');const pixels=ctx.getImageData(0,y0,src.width,y1-y0).data;let l=src.width,r=-1,t=y1-y0,b=-1;
        for(let y=0;y<y1-y0;y++)for(let x=0;x<src.width;x++){const k=4*(y*src.width+x);if(Math.min(pixels[k],pixels[k+1],pixels[k+2])<220){if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;}}
        if(r<l)continue;
        l=Math.max(0,l-8);r=Math.min(src.width-1,r+8);t=Math.max(0,t-8);b=Math.min(y1-y0-1,b+8);
        const part=document.createElement('canvas');part.width=r-l+1;part.height=b-t+1;part.getContext('2d',{alpha:false}).drawImage(src,l,y0+t,part.width,part.height,0,0,part.width,part.height);parts.push(part);
      }
      if(!parts.length)throw Error('Empty crop for Q'+(i+1));
      const c=document.createElement('canvas');c.width=Math.max(...parts.map(p=>p.width));c.height=parts.reduce((a,p)=>a+p.height,0)+8*(parts.length-1);
      const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);let y=0;for(const part of parts){ctx.drawImage(part,0,y);y+=part.height+8;}
      crops.push(c);progress('Preparing question images: '+(i+1)+' / '+headers.length);
      if(i%4===0)await new Promise(r=>setTimeout(r,0));
    }
    let pack=null;
    for(const [width,quality] of [[1100,.8],[1000,.7],[900,.62],[800,.52],[700,.46],[600,.4],[500,.36]]){
      const questions=original.questions.map((q,i)=>{
        const src=crops[i],c=document.createElement('canvas');const ratio=Math.min(1,width/src.width);c.width=Math.max(1,Math.round(src.width*ratio));c.height=Math.max(1,Math.round(src.height*ratio));c.getContext('2d',{alpha:false}).drawImage(src,0,0,c.width,c.height);
        let image=c.toDataURL('image/webp',quality);if(!image.startsWith('data:image/webp'))image=c.toDataURL('image/jpeg',quality);
        return {...q,image,paperPage:headers[i].page,text:'Question '+(i+1)+' — select the option in the image, or open the original paper if the crop is unclear.'};
      });
      const candidate={...original,questions};if(questions.every(q=>q.image.length<=180000)&&JSON.stringify(candidate).length<=890000){pack=candidate;break;}
    }
    if(!pack)throw Error('The images exceed the existing room size limit. No images were changed.');
    if(S.pack!==original)throw Error('Imported test changed during processing.');
    importPack(pack);efLocalPdf=file;efLocalPdfTitle=pack.title;
    status('Added '+pack.questions.length+' images. Review the crops against the original PDF before hosting. Use Copy test code or Download image EF1.');
    downloadFile('ExamForge-with-images-EF1.txt',encodePack(S.pack),'text/plain');
  }catch(e){status(e.message||String(e),true);}finally{button.disabled=false;if(doc)await doc.destroy().catch(()=>{});}
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
function importPack(pack){const next=normalizePack(pack);resetPaperAttachment();S.pack=next;$('packInput').value=JSON.stringify(S.pack,null,2);$('previewPanel').hidden=false;
  setText('previewTitle',S.pack.title);setText('previewMeta',`${S.pack.questions.length} questions · ${S.pack.durationMinutes} min · +${S.pack.marking.correct}/${S.pack.marking.wrong} marks`);
  $('packSummary').hidden=false;$('packSummary').replaceChildren(...[
    `${S.pack.questions.length} questions`,`${new Set(S.pack.questions.map(q=>q.subject)).size} sections`,`${S.pack.durationMinutes} minutes`].map(x=>addText('span','',x)));
  const node=$('previewQuestions');node.replaceChildren();
  for(const [i,q] of S.pack.questions.entries()){
    if(i>=20){node.append(addText('p','muted',`...and ${S.pack.questions.length-20} more questions ready.`));break;}
    const box=addText('article','preview-item','');box.append(addText('div','mini',`${i+1} · ${q.subject} · ${q.type} · Answer: ${Array.isArray(q.answer)?q.answer.join(','):q.answer}`),addText('p','',q.text || '[image question]'));
    if(q.options.length)box.append(addText('div','option-lines',q.options.map((o,j)=>`${ABC[j]}. ${o}`).join('\n')));
    addZoomImage(box,q.image,'Diagram for question '+(i+1),true);
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
  stopErrorBook();
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
  if(google){startErrorBook(user.uid);flushPendingSoloHistory().catch(()=>{});}else stopErrorBook();
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
  identityReady=false;S.uid=null;stopErrorBook();
  try{await signOut(S.auth);presentIdentityGate();}
  catch(e){toast('Sign-out failed: '+errorMessage(e),true);if(isGoogleUser()){S.uid=S.auth.currentUser.uid;identityReady=true;startErrorBook(S.uid);}}
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
    requireLive(); if(!S.pack)throw Error('Import a valid test code first.');if(efAttachmentBusy)throw Error('Wait for the PDF attachment to finish.');const pack=S.pack,paper=publicPaper(pack);const name=displayName();if(!name)throw Error('Enter your display name.');
    $('createRoomBtn').disabled=true;
    localStorage.setItem('ef-display-name',name);
    const room=makeRoomCode();
    const meta={hostUid:S.uid,title:pack.title,status:'lobby',durationMinutes:pack.durationMinutes,marking:pack.marking,shareReports:$('shareReportToggle').checked,examChat:$('examChatToggle').checked,createdAt:serverTimestamp()};
    // Each write is authorized separately. Keep key only in the host's browser.
    await set(ref(S.db,`rooms/${room}/meta`),meta);
    await set(ref(S.db,`rooms/${room}/paper`),paper);
    await set(ref(S.db,`rooms/${room}/members/${S.uid}`),{name,joinedAt:serverTimestamp()});
    try{localStorage.setItem(`ef-host-paper:${room}`,JSON.stringify(pack));}catch{toast('Storage is full: keep the host tab open until all exams are scored.',true);}
    S.pack=pack;await enterRoom(room);toast('Room created! Share the invite with your friends.');
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
  const historyRef=ref(S.db,`studentHistory/${S.uid}/${S.room}`);
  if((await get(historyRef)).exists())return;
  await set(historyRef,{
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
  addZoomImage(body,q.image,`Illustration for question ${S.currentIdx+1}`);
  if((S.paper.paperDocument||validPaperUrl(S.paper.paperUrl))&&q.paperPage)body.append(viewerButton('View question page '+q.paperPage,()=>openTestPaper(q.paperPage)));
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
    return {id:q.id,subject:q.subject,...(q.chapter?{chapter:q.chapter}:{}),...(q.paperPage?{paperPage:q.paperPage}:{}),...(q.image?{hasImage:true}:{}),...(q.bonus?{bonus:true}:{}),text:q.text,chosen,answer:q.bonus?'DROPPED (+4 bonus)':(Array.isArray(q.answer)?q.answer.join(','):String(q.answer)),outcome,points:pts,explanation:q.explanation||''};
  });
  sum.score=Number(sum.score.toFixed(4));sum.maxScore=Number(sum.maxScore.toFixed(4));
  return {score:sum,report:{questions,subjectStats,chapterStatsVersion:1}};
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
  if(S.solo){view('results');setText('resultsTitle','Solo result');setText('resultsSub','Practice score calculated locally. Not independently verified.');}
  else {view('results');setText('resultsTitle','Squad results & leaderboard');setText('resultsSub',(S.meta?.status==='finished'?'All available results are in. ':'Results update automatically as participants submit. ')+'Scores come from the host browser and are not independently verified.');}
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
function startSolo(){try{if(!S.pack)throw Error('Import a test code first.');if(efAttachmentBusy)throw Error('Wait for the PDF attachment to finish.');S.solo=true;S.room=null;S.paper=publicPaper(S.pack);S.meta=null;S.exam=null;S.myReport=null;S.reportCache={};S.scores={};S.members={};S.currentIdx=0;S.uid=S.uid||'solo';S.soloStartedAt=Date.now();S.selectedReportUid=S.uid||'solo';localStorage.removeItem(attemptStorageKey());beginExam(true);}catch(e){toast(errorMessage(e),true);}}
function home(){if(S.isHost && S.meta?.status==='started' && Object.keys(S.scores).length<Object.keys(S.members).length && !confirm('You are hosting a live room. Leaving this page stops automatic scoring for friends until you reopen the room. Leave anyway?'))return;clearRoomListeners();S.room=null;S.meta=null;S.paper=null;S.exam=null;S.solo=false;S.isHost=false;S.selectedReportUid=S.uid;urlRoom('');view('home');}
function downloadFile(filename,contents,mime){const blob=new Blob([contents],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}


// Chapter-wise error book. Derive entries from private, immutable saved reports;
// never add answer keys to public papers or duplicate embedded images in history.
const EB_CHAPTERS = [
 ['Chemistry','Solutions',/\b(raoult|henry.s law|azeotrop|colligative|van.t hoff|osmotic pressure|freezing.point depression|boiling.point elevation|mole fraction|molality)\b/i],
 ['Chemistry','Electrochemistry',/\b(electrochem|electrolysis|nernst|kohlrausch|molar conductivity|salt bridge|galvanic cell|electrolytic cell|daniell cell|faraday.s law|lead storage battery|fuel cell|standard hydrogen electrode|cell constant|sacrificial anode)\b/i],
 ['Chemistry','Chemical Kinetics',/\b(chemical kinetics|rate law|rate constant|reaction order|molecularity|activation energy|arrhenius|first.order reaction|zero.order reaction|pseudo.first.order|half.life of a reaction)\b/i],
 ['Chemistry','d- and f-Block Elements',/\b(d.and.f.block|d.block|f.block|lanthanoid|lanthanide|actinoid|actinide|interstitial compounds?|transition metals?|potassium permanganate|potassium dichromate)\b/i],
 ['Chemistry','Coordination Compounds',/\b(coordination compounds?|coordination number|crystal field|metal carbonyl|ligands?|chelating|coordination sphere)\b/i],
 ['Chemistry','Haloalkanes and Haloarenes',/\b(haloalkanes?|haloarenes?|alkyl halides?|aryl halides?|wurtz reaction|finkelstein)\b/i],
 ['Chemistry','Alcohols, Phenols and Ethers',/\b(alcohols?,? phenols? and ethers?|phenols?|ethers?|williamson synthesis)\b/i],
 ['Chemistry','Aldehydes, Ketones and Carboxylic Acids',/\b(aldehydes?|ketones?|carboxylic acids?|cannizzaro|aldol|tollens|fehling|clemmensen)\b/i],
 ['Chemistry','Amines',/\b(amines?|diazonium|gabriel phthalimide|carbylamine|hinsberg)\b/i],
 ['Chemistry','Biomolecules',/\b(biomolecules|anomers?|glycosidic|peptide bond|amino acids?|monosaccharides?|vitamins?)\b/i],
 ['Chemistry','Some Basic Concepts of Chemistry',/\b(mole concept|stoichiometry|limiting reagent|empirical formula|molar mass of a compound)\b/i],
 ['Chemistry','Structure of Atom',/\b(atomic structure|structure of atom|quantum numbers?|atomic orbitals?|heisenberg|bohr model|aufbau)\b/i],
 ['Chemistry','Classification and Periodicity',/\b(periodic table|periodicity|periodic trends|electronegativity|electron gain enthalpy)\b/i],
 ['Chemistry','Chemical Bonding',/\b(chemical bonding|vsepr|hybridisation|hybridization|bond order|molecular orbital|dipole moment)\b/i],
 ['Chemistry','Thermodynamics',/\b(thermodynamics|hess.s law|enthalpy of formation|entropy|gibbs free energy)\b/i],
 ['Chemistry','Equilibrium',/\b(chemical equilibrium|ionic equilibrium|solubility product|buffer solution|common ion effect|le chatelier|pH of)\b/i],
 ['Chemistry','Redox Reactions',/\b(redox reactions?|oxidation number|oxidation state|disproportionation)\b/i],
 ['Chemistry','Organic Chemistry – Basic Principles',/\b(general organic chemistry|inductive effect|resonance effect|carbocations?|carbanions?|hyperconjugation|carius method)\b/i],
 ['Chemistry','Hydrocarbons',/\b(hydrocarbons?|alkanes?|alkenes?|alkynes?|ozonolysis|aromaticity|friedel.crafts)\b/i],
 ['Chemistry','Practical Chemistry',/\b(titrimetric analysis|salt analysis|group reagent|qualitative analysis|chemical tests?)\b/i],
 ['Chemistry','p-Block Elements',/\b(p.block|noble gases|halogens?|group 1[345678] elements)\b/i],
 ['Physics','Units and Measurements',/\b(vernier|screw gauge|dimensional formula|least count|significant figures|units and measurements)\b/i],
 ['Physics','Kinematics',/\b(kinematics|projectile|uniform acceleration|free fall|dropped from rest)\b/i],
 ['Physics','Laws of Motion',/\b(laws of motion|friction|pulley|wedge|newton.s law)\b/i],
 ['Physics','Work, Energy and Power',/\b(work.energy|kinetic energy|conservation of energy|power delivered)\b/i],
 ['Physics','Rotational Motion',/\b(rotational motion|moment of inertia|angular momentum|centre of mass|center of mass|rolling without slipping)\b/i],
 ['Physics','Gravitation',/\b(gravitation|escape velocity|satellite|earth.s surface|orbital velocity)\b/i],
 ['Physics','Mechanical Properties of Solids',/\b(young.s modulus|breaking stress|modulus of rigidity|elasticity|shear strain)\b/i],
 ['Physics','Mechanical Properties of Fluids',/\b(bernoulli|viscosity|surface tension|fluid mechanics|buoyancy)\b/i],
 ['Physics','Thermal Properties of Matter',/\b(thermal expansion|calorimetry|heat transfer|specific heat|thermal conductivity)\b/i],
 ['Physics','Thermodynamics',/\b(thermodynamics|isothermal|adiabatic|carnot|internal energy)\b/i],
 ['Physics','Kinetic Theory of Gases',/\b(kinetic theory|degrees? of freedom|rms speed|equipartition)\b/i],
 ['Physics','Oscillations',/\b(simple harmonic|shm|oscillations?|pendulum)\b/i],
 ['Physics','Waves',/\b(transverse wave|standing waves?|stationary waves?|successive crests|doppler effect)\b/i],
 ['Physics','Electrostatics',/\b(electrostatics|electric flux|gauss.s law|electric potential|electric field|capacitor|capacitance)\b/i],
 ['Physics','Current Electricity',/\b(current electricity|kirchhoff|wheatstone|resistivity|resistor network|potential divider)\b/i],
 ['Physics','Moving Charges and Magnetism',/\b(moving charges|magnetic field|lorentz force|cyclotron|biot.savart)\b/i],
 ['Physics','Magnetism and Matter',/\b(magnetism and matter|diamagnet|paramagnet|ferromagnet|magnetic susceptibility)\b/i],
 ['Physics','Electromagnetic Induction',/\b(electromagnetic induction|lenz.s law|inductance|inductor|induced emf)\b/i],
 ['Physics','Alternating Current',/\b(alternating current|reactance|impedance|rlc circuit|a\.c\. source|power factor)\b/i],
 ['Physics','Electromagnetic Waves',/\b(displacement current|electromagnetic waves?|electromagnetic spectrum)\b/i],
 ['Physics','Ray Optics',/\b(ray optics|prism|microscope|telescope|lens|total internal reflection)\b/i],
 ['Physics','Wave Optics',/\b(wave optics|double slit|fringe width|diffraction|polarisation|polarization)\b/i],
 ['Physics','Dual Nature of Radiation and Matter',/\b(de broglie|photo.electric|photoelectrons?|stopping potential|work function)\b/i],
 ['Physics','Atoms',/\b(hydrogen atom|rydberg|bohr orbit|atomic spectra)\b/i],
 ['Physics','Nuclei',/\b(nuclei|nuclear|radioactive|binding energy|mass defect)\b/i],
 ['Physics','Semiconductor Electronics',/\b(semiconductor|logic gates?|logic circuit|diode|transistor|led)\b/i],
 ['Mathematics','Sets, Relations and Functions',/\b(sets|relations?|one.one functions?|onto functions?|injective|surjective)\b/i],
 ['Mathematics','Complex Numbers and Quadratic Equations',/\b(complex numbers?|quadratic equation|argand|roots of unity)\b/i],
 ['Mathematics','Sequences and Series',/\b(sequences?|arithmetic progression|geometric progression|a\.p\.|g\.p\.)/i],
 ['Mathematics','Permutations and Combinations',/\b(permutations?|combinations?|number of ways|number of arrangements)\b/i],
 ['Mathematics','Binomial Theorem',/\b(binomial|coefficients? of.*expansion)\b/i],
 ['Mathematics','Matrices and Determinants',/\b(matrix|matrices|determinants?|det\(|adj\(|system of linear equations)\b/i],
 ['Mathematics','Trigonometry',/\b(trigonometry|trigonometric|tan a|sin x|cos x)\b/i],
 ['Mathematics','Inverse Trigonometric Functions',/\b(inverse trigonometric|arctan|arcsin|arccos)\b/i],
 ['Mathematics','Straight Lines',/\b(straight lines?|orthocentre|orthocenter|slope of a line)\b/i],
 ['Mathematics','Circles',/\b(circles?|radius of the circle)\b/i],
 ['Mathematics','Conic Sections',/\b(ellipse|parabola|hyperbola|conic sections?)\b/i],
 ['Mathematics','Limits, Continuity and Differentiability',/\b(limits?|continuity|differentiability|differentiable|continuous function)\b/i],
 ['Mathematics','Applications of Derivatives',/\b(critical points?|maximum value|minimum value|increasing function|decreasing function)\b/i],
 ['Mathematics','Integrals',/\b(integrals?|integration)\b/i],
 ['Mathematics','Applications of Integrals',/\b(area of the region|area bounded)\b/i],
 ['Mathematics','Differential Equations',/\b(differential equations?)\b/i],
 ['Mathematics','Vector Algebra',/\b(vector algebra|cross product|dot product|scalar triple product)\b/i],
 ['Mathematics','Three-Dimensional Geometry',/\b(three.dimensional|3d geometry|distance of the point.*line|skew lines?)\b/i],
 ['Mathematics','Probability',/\b(probability|bayes|random variable)\b/i],
 ['Mathematics','Statistics',/\b(statistics|mean deviation|standard deviation|variance)\b/i]
];
const EB_UNTAGGED='Unclassified';
const EB_STATS_START=Date.parse('2026-11-27T16:13:45+05:30');
const EB_SUBJECTS=['Physics','Chemistry','Mathematics'];
const EB = {uid:null, unsub:[], data:{}, loading:{}, errors:{}, edits:new Map(), pending:new Map(), cloud:'local', cloudReady:false, cloudBusy:false, generation:0, subject:'Physics', sort:'error-desc', scope:'all', query:'', selectedChapter:null};
function ebSubject(value){
  const v=String(value||'General').trim();
  return /^math(s|ematics)?$/i.test(v)?'Mathematics':/^phy(sics)?$/i.test(v)?'Physics':/^chem(istry)?$/i.test(v)?'Chemistry':v||'General';
}
function ebCanonical(value,subject){
  const v=String(value||'').trim().slice(0,100);
  if(!v)return '';
  const row=EB_CHAPTERS.find(x=>x[0]===subject&&x[1].toLowerCase()===v.toLowerCase());
  return row?row[1]:v;
}

/* Retroactive mappings of supplied ExamForge papers. Indexed by original Q1–Q75.
 * Cross-chapter questions use the principal tested concept. Never change grading. */
const EB_PAPER_MAPS = [
 {title:'JEE Main 2026 | 5 April Morning Shift',chapters:["Complex Numbers and Quadratic Equations","Sequences and Series","Matrices and Determinants","Matrices and Determinants","Sequences and Series","Trigonometry","Probability","Statistics","Conic Sections","Circles","Straight Lines","Trigonometry","Three-Dimensional Geometry","Vector Algebra","Three-Dimensional Geometry","Applications of Integrals","Limits, Continuity and Differentiability","Integrals","Applications of Derivatives","Integrals","Sets, Relations and Functions","Permutations and Combinations","Binomial Theorem","Inverse Trigonometric Functions","Differential Equations","Units and Measurements","Units and Measurements","Gravitation","Laws of Motion","Laws of Motion","Mechanical Properties of Solids","Kinetic Theory of Gases","Thermodynamics","Current Electricity","Dual Nature of Radiation and Matter","Atoms","Electromagnetic Waves","Current Electricity","Wave Optics","Ray Optics","Dual Nature of Radiation and Matter","Ray Optics","Mechanical Properties of Solids","Alternating Current","Semiconductor Electronics","Mechanical Properties of Solids","Kinematics","Waves","Moving Charges and Magnetism","Electromagnetic Induction","Some Basic Concepts of Chemistry","Structure of Atom","Structure of Atom","Solutions","Equilibrium","Equilibrium","Chemical Kinetics","Redox Reactions","p-Block Elements","d- and f-Block Elements","Coordination Compounds","Coordination Compounds","Organic Chemistry – Basic Principles","Hydrocarbons","Hydrocarbons","Amines","Alcohols, Phenols and Ethers","Amines","Biomolecules","Practical Chemistry","Chemical Bonding","Organic Chemistry – Basic Principles","Alcohols, Phenols and Ethers","Thermodynamics","Chemical Kinetics"]},
 {title:'JEE Main 2026 | 4 April Evening Shift (supplied paper key)',chapters:["Sets, Relations and Functions","Complex Numbers and Quadratic Equations","Matrices and Determinants","Complex Numbers and Quadratic Equations","Complex Numbers and Quadratic Equations","Matrices and Determinants","Sequences and Series","Statistics","Binomial Theorem","Conic Sections","Conic Sections","Applications of Derivatives","Three-Dimensional Geometry","Three-Dimensional Geometry","Vector Algebra","Sets, Relations and Functions","Permutations and Combinations","Applications of Integrals","Differential Equations","Integrals","Probability","Limits, Continuity and Differentiability","Straight Lines","Conic Sections","Limits, Continuity and Differentiability","Units and Measurements","Kinematics","Laws of Motion","Kinematics","Gravitation","Mechanical Properties of Solids","Mechanical Properties of Fluids","Kinetic Theory of Gases","Thermal Properties of Matter","Oscillations","Electrostatics","Electrostatics","Electrostatics","Magnetism and Matter","Electromagnetic Waves","Ray Optics","Wave Optics","Atoms","Dual Nature of Radiation and Matter","Semiconductor Electronics","Semiconductor Electronics","Kinematics","Magnetism and Matter","Moving Charges and Magnetism","Wave Optics","Some Basic Concepts of Chemistry","Structure of Atom","Chemical Bonding","Solutions","Equilibrium","Organic Chemistry – Basic Principles","Classification and Periodicity","p-Block Elements","d- and f-Block Elements","Coordination Compounds","Organic Chemistry – Basic Principles","d- and f-Block Elements","Chemical Kinetics","Hydrocarbons","Organic Chemistry – Basic Principles","Organic Chemistry – Basic Principles","Amines","Biomolecules","Practical Chemistry","Practical Chemistry","Thermodynamics","Equilibrium","Electrochemistry","Chemical Kinetics","Organic Chemistry – Basic Principles"]}
];
function ebTitleKey(value){return String(value||'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');}
function ebPaperChapter(q,title,index,total){
  const paper=EB_PAPER_MAPS.find(p=>ebTitleKey(p.title)===ebTitleKey(title));
  if(!paper||total!==75)return '';
  const n=Number(index)+1;
  if(!Number.isInteger(n)||n<1||n>75||String(q.id||'').toUpperCase()!=='Q'+n)return '';
  const expected=n<=25?'Mathematics':n<=50?'Physics':'Chemistry';
  if(ebSubject(q.subject)!==expected)return '';
  return paper.chapters[n-1]||'';
}

function ebInfer(q,title,index,total){
  const subject=ebSubject(q.subject);
  if(q.chapter)return {name:ebCanonical(q.chapter,subject),source:'Tagged'};
  const mapped=ebPaperChapter(q,title,index,total);
  if(mapped)return {name:mapped,source:'Earlier paper mapping'};
  const candidates=EB_CHAPTERS.filter(x=>x[0]===subject);
  // A whole chapter title is good evidence; broad mixed papers stay unclassified.
  const exactTitle=candidates.filter(x=>String(title||'').toLowerCase().includes(x[1].toLowerCase()));
  if(exactTitle.length===1)return {name:exactTitle[0][1],source:'Suggested from test title'};
  const text=String(q.text||'');
  const matches=candidates.filter(x=>x[2].test(text));
  if(matches.length===1)return {name:matches[0][1],source:'Suggested from question text'};
  return {name:EB_UNTAGGED,source:'Needs chapter'};
}
function ebAttemptTime(r){
  return Number(r.score?.submittedAt)||Number(r.clientCreatedAt)||Number(r.createdAt)||0;
}
function ebIsEarlierMapped(r){
  const qs=r.report?.questions||{};
  if(Object.keys(qs).length!==75)return false;
  return Object.entries(qs).every(([i,q])=>q&&!!ebPaperChapter(q,r.title,i,75));
}
function ebEligible(r){
  if(!r||typeof r!=='object'||!r.report?.questions)return false;
  if(ebIsEarlierMapped(r))return true;
  const time=ebAttemptTime(r);
  return time?time>=EB_STATS_START:Number(r.report.chapterStatsVersion)===1;
}
function ebIsBonus(q){
  return q.bonus===true||String(q.answer||'').startsWith('DROPPED (');
}
function ebEntries(data,edits){
  const out=[];
  for(const [kind,attempts] of Object.entries(data)){
    for(const [id,r] of Object.entries(attempts||{})){
      if(!ebEligible(r))continue;
      const questions=r.report.questions||[];
      const total=Object.keys(questions).length;
      for(const [index,q] of Object.entries(questions)){
        if(!q||ebIsBonus(q)||!['wrong','correct','unanswered'].includes(q.outcome))continue;
        const key=kind+':'+id+':'+index;
        const subject=ebSubject(q.subject);
        const manual=edits.get(key);
        const chapter=manual?.chapter?{name:ebCanonical(manual.chapter,subject),source:'Your chapter tag'}:ebInfer(q,r.title,index,total);
        out.push({key,subject,chapter:chapter.name,source:chapter.source,q,
          number:Number.isFinite(Number(index))?Number(index)+1:index,
          title:r.title||'Untitled test',kind,id,time:ebAttemptTime(r),manual});
      }
    }
  }
  return out.sort((a,b)=>b.time-a.time||Number(a.number)-Number(b.number));
}
function ebChapterStats(entries,subject){
  const map=new Map();
  const ensure=chapter=>{
    const key=chapter.trim().toLowerCase();
    if(!map.has(key))map.set(key,{chapter,correct:0,wrong:0,attempted:0,skipped:0,items:[]});
    return map.get(key);
  };
  for(const row of EB_CHAPTERS)if(row[0]===subject)ensure(row[1]);
  for(const e of entries){
    if(e.subject!==subject)continue;
    const st=ensure(e.chapter||EB_UNTAGGED);
    st.items.push(e);
    if(e.q.outcome==='unanswered')st.skipped++;
    else{st.attempted++;st[e.q.outcome]++;}
  }
  return [...map.values()].map(st=>({...st,errorRate:st.attempted?100*st.wrong/st.attempted:null,accuracy:st.attempted?100*st.correct/st.attempted:null}));
}
function ebSortStats(rows,sort){
  const pct=(a,b,key,dir)=>{
    if(a[key]===null&&b[key]===null)return 0;
    if(a[key]===null)return 1;
    if(b[key]===null)return -1;
    return dir*(a[key]-b[key]);
  };
  return [...rows].sort((a,b)=>{
    let d=0;
    switch(sort){
      case 'error-desc':d=pct(a,b,'errorRate',-1);break;
      case 'error-asc':d=pct(a,b,'errorRate',1);break;
      case 'accuracy-desc':d=pct(a,b,'accuracy',-1);break;
      case 'accuracy-asc':d=pct(a,b,'accuracy',1);break;
      case 'wrong-desc':d=b.wrong-a.wrong;break;
      case 'attempt-desc':d=b.attempted-a.attempted;break;
      case 'correct-desc':d=b.correct-a.correct;break;
      case 'name':return a.chapter.localeCompare(b.chapter);
    }
    return d||b.attempted-a.attempted||b.wrong-a.wrong||a.chapter.localeCompare(b.chapter);
  });
}
function ebFilterStats(rows,scope,query){
  const term=String(query||'').trim().toLowerCase();
  return rows.filter(r=>(!term||r.chapter.toLowerCase().includes(term))&&
    (scope==='all'||(scope==='attempted'&&r.attempted>0)||(scope==='wrong'&&r.wrong>0)||(scope==='untagged'&&r.chapter===EB_UNTAGGED)));
}

function ebLocalKey(uid){return 'ef-error-book-tags-v1:'+uid;}
function ebPendingKey(uid){return 'ef-error-book-pending-v1:'+uid;}
function ebReadMap(key){
  try{
    const raw=JSON.parse(localStorage.getItem(key)||'[]');
    return new Map(Array.isArray(raw)?raw.filter(x=>Array.isArray(x)&&x.length===2&&typeof x[0]==='string'&&x[1]&&typeof x[1]==='object'):[]);
  }catch{return new Map();}
}
function ebReadEdits(uid){return ebReadMap(ebLocalKey(uid));}
function ebTagValue(v){return {chapter:String(v?.chapter||'').slice(0,100),note:String(v?.note||'').slice(0,1000)};}
function ebTagActive(v){return !!(v.chapter||v.note);}
function ebPersist(){
  if(!EB.uid)return;
  localStorage.setItem(ebPendingKey(EB.uid),JSON.stringify([...EB.pending]));
  localStorage.setItem(ebLocalKey(EB.uid),JSON.stringify([...EB.edits]));
}
function ebSaveEdit(key,value){return ebSaveEdits([[key,value]]);}
function ebSaveEdits(changes){
  if(!EB.uid||S.auth?.currentUser?.uid!==EB.uid)return false;
  const next=new Map(EB.edits), pending=new Map(EB.pending);
  for(const [key,value] of changes){const v=ebTagValue(value);pending.set(key,v);if(ebTagActive(v))next.set(key,v);else next.delete(key);}
  try{
    localStorage.setItem(ebPendingKey(EB.uid),JSON.stringify([...pending]));
    localStorage.setItem(ebLocalKey(EB.uid),JSON.stringify([...next]));
    EB.edits=next;EB.pending=pending;ebFlushTags();return true;
  }catch{toast('Could not save the chapter tag on this device.',true);return false;}
}
function ebCloudKey(key){return encodeURIComponent(key).replace(/\./g,'%2E');}
function ebMergeTags(remote,local,pending,migrate){
  const next=new Map(), known=new Set(), queue=new Map(pending);
  for(const [encoded,value] of Object.entries(remote||{})){
    let key;try{key=decodeURIComponent(encoded);}catch{continue;}
    const v=ebTagValue(value);known.add(key);if(ebTagActive(v))next.set(key,v);
  }
  if(migrate)for(const [key,v] of local)if(!known.has(key)&&!queue.has(key))queue.set(key,ebTagValue(v));
  for(const [key,v] of queue){if(ebTagActive(v))next.set(key,v);else next.delete(key);}
  return {next,queue};
}
function ebCloudStatus(){
  const el=$('ebCloudStatus');if(!el)return;
  el.textContent=EB.cloud==='synced'?(EB.pending.size?'Account sync enabled · '+EB.pending.size+' changes waiting to sync.':'Chapter corrections and notes synced to your account.'):
    EB.cloud==='checking'?'Checking account sync…':'Corrections saved on this browser. Enable the latest Firebase Error Book rules for cross-device sync.';
}
async function ebFlushTags(){
  if(!EB.cloudReady||EB.cloudBusy||!EB.pending.size||!EB.uid||S.auth?.currentUser?.uid!==EB.uid)return;
  const uid=EB.uid,gen=EB.generation,batch=new Map(EB.pending);EB.cloudBusy=true;ebCloudStatus();
  try{
    const changes={};for(const [key,v] of batch)changes[ebCloudKey(key)]=ebTagValue(v);
    await update(ref(S.db,'errorBookTags/'+uid),changes);
    if(EB.uid!==uid||EB.generation!==gen)return;
    for(const [key,v] of batch)if(JSON.stringify(EB.pending.get(key))===JSON.stringify(v))EB.pending.delete(key);
    try{ebPersist();}catch{}
    EB.cloud='synced';
  }catch(e){if(EB.uid===uid&&EB.generation===gen){EB.cloud='local';EB.cloudReady=false;console.warn('Error Book account sync unavailable',e);}}
  finally{
    if(EB.uid===uid&&EB.generation===gen){EB.cloudBusy=false;ebCloudStatus();if(EB.cloudReady&&EB.pending.size)ebFlushTags();}
  }
}
function ebWatchTags(uid){
  const gen=EB.generation;
  EB.cloud='checking';ebCloudStatus();
  const unsub=onValue(ref(S.db,'errorBookTags/'+uid),snap=>{
    if(EB.uid!==uid||EB.generation!==gen||S.auth.currentUser?.uid!==uid)return;
    const merged=ebMergeTags(snap.val()||{},EB.edits,EB.pending,!EB.cloudReady);
    EB.edits=merged.next;EB.pending=merged.queue;EB.cloudReady=true;EB.cloud='synced';
    try{ebPersist();}catch{}
    ebRender();ebCloudStatus();ebFlushTags();
  },()=>{
    if(EB.uid!==uid||EB.generation!==gen)return;
    EB.cloudReady=false;EB.cloud='local';ebCloudStatus();
  });
  EB.unsub.push(unsub);
}
function ebElement(tag,text,cls){
  const e=document.createElement(tag);if(cls)e.className=cls;if(text!==null)e.textContent=text;return e;
}
function ebOption(value,label){const o=ebElement('option',label);o.value=value;return o;}
function ebButton(text,fn){
  const b=ebElement('button',text,'btn btn-outline');b.type='button';b.addEventListener('click',fn);return b;
}
function ebCreatePanel(){
  if($('errorBookPanel'))return;
  const css=document.createElement('style');
  css.textContent='#errorBookPanel{margin:18px 0}#errorBookPanel[hidden]{display:none!important}.eb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0}.eb-metric{border:1px solid rgba(127,140,160,.27);padding:12px;border-radius:12px;display:grid;gap:4px}.eb-metric strong{font-size:1.45rem}.eb-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 10px}.eb-tabs button{flex:1;min-width:90px}.eb-tabs button[aria-pressed=true]{background:#237f9c;color:white;border-color:#237f9c}.eb-controls{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:12px 0}.eb-controls label{flex:1;min-width:145px}.eb-controls input,.eb-controls select,.eb-editor input,.eb-editor textarea{width:100%;box-sizing:border-box}.eb-table-wrap{overflow-x:auto;border:1px solid rgba(127,140,160,.27);border-radius:12px;margin:12px 0}.eb-table{width:100%;border-collapse:collapse;min-width:620px;font-variant-numeric:tabular-nums}.eb-table th,.eb-table td{padding:12px 10px;border-bottom:1px solid rgba(127,140,160,.2);text-align:right;white-space:nowrap}.eb-table th{font-size:.78rem;text-transform:uppercase;letter-spacing:.03em;background:rgba(127,140,160,.08)}.eb-table th:first-child,.eb-table td:first-child{text-align:left;white-space:normal;min-width:170px}.eb-table tr:last-child td{border-bottom:0}.eb-chapter-link{background:none;border:0;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px}.eb-weak{color:#f87171;font-weight:700}.eb-good{color:#34d399;font-weight:700}.eb-zero{opacity:.6}.eb-group{border:1px solid rgba(127,140,160,.27);border-radius:12px;padding:12px;margin:8px 0}.eb-group summary,.eb-item summary{cursor:pointer;overflow-wrap:anywhere}.eb-item{padding:11px 0;border-top:1px solid rgba(127,140,160,.23);margin-top:8px}.eb-item p{white-space:pre-wrap;overflow-wrap:anywhere}.eb-editor{display:grid;gap:6px;margin-top:10px}.eb-editor textarea{min-height:68px}.eb-answer{display:flex;flex-wrap:wrap;gap:10px}.eb-item .muted{font-size:.84rem}';
  document.head.append(css);
  const panel=ebElement('section',null,'panel');panel.id='errorBookPanel';panel.hidden=true;
  const head=ebElement('div',null,'panel-heading');
  const title=ebElement('div',null);
  title.append(ebElement('span','YOUR REVISION DASHBOARD','section-tag'),ebElement('h2','Chapter-wise Error Book'),ebElement('p','Cumulative attempted questions, mistakes and accuracy for each chapter.'));
  head.append(title,ebButton('Refresh',()=>{if(EB.uid)startErrorBook(EB.uid,true);}));
  const tabs=ebElement('div',null,'eb-tabs');tabs.id='ebTabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Choose subject');
  for(const subject of EB_SUBJECTS){
    const b=ebButton(subject,()=>{EB.subject=subject;EB.selectedChapter=null;ebRender();});b.dataset.subject=subject;b.setAttribute('aria-pressed','false');tabs.append(b);
  }
  const metrics=ebElement('div',null,'eb-grid');metrics.id='ebMetrics';
  const controls=ebElement('div',null,'eb-controls');
  const sort=ebElement('select',null);sort.id='ebSort';
  for(const [value,label] of [['error-desc','Incorrect % — highest first'],['error-asc','Incorrect % — lowest first'],['accuracy-asc','Accuracy — lowest first'],['accuracy-desc','Accuracy — highest first'],['wrong-desc','Most incorrect questions'],['attempt-desc','Most attempted questions'],['correct-desc','Most correct questions'],['name','Chapter name A–Z']])sort.append(ebOption(value,label));
  const scope=ebElement('select',null);scope.id='ebScope';
  for(const [value,label] of [['all','All chapters'],['attempted','Attempted chapters only'],['wrong','Chapters with mistakes'],['untagged','Unclassified questions']])scope.append(ebOption(value,label));
  const search=ebElement('input',null);search.id='ebSearch';search.type='search';search.placeholder='Find chapter';
  for(const [name,control] of [['Sort by',sort],['Filter',scope],['Search chapter',search]]){const label=ebElement('label',name);label.append(control);controls.append(label);}
  sort.onchange=()=>{EB.sort=sort.value;ebRender();};scope.onchange=()=>{EB.scope=scope.value;ebRender();};search.oninput=()=>{EB.query=search.value;ebRender();};
  const status=ebElement('p','Loading your report history…','muted');status.id='ebStatus';status.setAttribute('role','status');
  const table=ebElement('div',null,'eb-table-wrap');table.id='ebTable';
  const groups=ebElement('div',null);groups.id='ebGroups';
  const bulk=ebElement('details',null,'eb-group');bulk.id='ebBulk';bulk.append(ebElement('summary','Optional: correct chapter tags in bulk'));
  const bulkBody=ebElement('div',null);bulkBody.id='ebBulkBody';bulk.append(bulkBody);
  bulk.addEventListener('toggle',()=>{if(bulk.open)ebRenderBulk();});
  const cloudStatus=ebElement('p','Checking account sync…','muted');cloudStatus.id='ebCloudStatus';cloudStatus.setAttribute('role','status');
  const foot=ebElement('p','Attempted = correct + incorrect. Incorrect % = incorrect / attempted; accuracy = correct / attempted. Skipped and bonus questions do not affect either percentage. Earlier history includes only 4 April evening and 5 April morning mapped papers; all tests submitted from 27 November 2026, 4:13 PM IST onward are included. Untagged questions remain Unclassified until a chapter is assigned.','fine-print');
  panel.append(head,tabs,metrics,controls,status,table,groups,bulk,cloudStatus,foot);
  const home=$('homeView'),hero=home.querySelector('.hero');
  if(hero)hero.after(panel);else home.prepend(panel);
}
function ebRender(){
  if(!EB.uid||S.auth?.currentUser?.uid!==EB.uid)return;
  const entries=ebEntries(EB.data,EB.edits);
  if(!EB_SUBJECTS.includes(EB.subject))EB.subject='Physics';
  for(const b of $('ebTabs').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.subject===EB.subject));
  $('ebSort').value=EB.sort;$('ebScope').value=EB.scope;
  if($('ebBulk')?.open)ebRenderBulk();
  const allRows=ebChapterStats(entries,EB.subject);
  const relevant=entries.filter(e=>e.subject===EB.subject);
  const totals=allRows.reduce((a,r)=>({wrong:a.wrong+r.wrong,correct:a.correct+r.correct,attempted:a.attempted+r.attempted,skipped:a.skipped+r.skipped}),{wrong:0,correct:0,attempted:0,skipped:0});
  const fmtPercent=n=>n===null?'—':n.toFixed(1)+'%';
  const metrics=$('ebMetrics');metrics.replaceChildren();
  for(const [label,n] of [['Attempted',totals.attempted],['Incorrect',totals.wrong],['Correct',totals.correct],['Accuracy',fmtPercent(totals.attempted?100*totals.correct/totals.attempted:null)]]){
    const item=ebElement('div',null,'eb-metric');item.append(ebElement('span',label,'muted'),ebElement('strong',String(n)));metrics.append(item);
  }
  const eligibleCount=Object.values(EB.data).reduce((n,v)=>n+Object.values(v||{}).filter(ebEligible).length,0);
  const allCount=Object.values(EB.data).reduce((n,v)=>n+Object.keys(v||{}).length,0);
  const pending=Object.values(EB.loading).some(Boolean),errorList=Object.values(EB.errors).filter(Boolean);
  const unclassified=relevant.filter(e=>e.chapter===EB_UNTAGGED).length;
  $('ebStatus').textContent=(pending?'Loading history… ':errorList.length?'Some reports could not load. Check history rules and refresh. ':'')+eligibleCount+' included test'+(eligibleCount===1?'':'s')+' · '+(allCount-eligibleCount)+' older tests excluded · '+unclassified+' unclassified '+EB.subject.toLowerCase()+' question'+(unclassified===1?'':'s')+'.';
  const rows=ebSortStats(ebFilterStats(allRows,EB.scope,EB.query),EB.sort);
  const tableHost=$('ebTable');tableHost.replaceChildren();
  const table=ebElement('table',null,'eb-table');
  const thead=ebElement('thead',null),header=ebElement('tr',null);
  for(const label of ['Chapter name','Incorrect','Attempted','Correct','Incorrect %','Accuracy %']){
    const th=ebElement('th',label);th.scope='col';header.append(th);
  }
  thead.append(header);const body=ebElement('tbody',null);
  for(const row of rows){
    const tr=ebElement('tr',null);if(!row.attempted)tr.className='eb-zero';
    const name=ebElement('td',null);
    if(row.items.length){
      const link=ebElement('button',row.chapter,'eb-chapter-link');link.type='button';link.title='View question details';link.onclick=()=>{EB.selectedChapter=EB.selectedChapter===row.chapter?null:row.chapter;ebRenderDetails(allRows);};name.append(link);
    }else name.textContent=row.chapter;
    tr.append(name,ebElement('td',String(row.wrong),row.wrong?'eb-weak':''),ebElement('td',String(row.attempted)),ebElement('td',String(row.correct),row.correct?'eb-good':''),ebElement('td',fmtPercent(row.errorRate),row.wrong?'eb-weak':''),ebElement('td',fmtPercent(row.accuracy),row.correct?'eb-good':''));
    body.append(tr);
  }
  if(!rows.length){const tr=ebElement('tr',null),td=ebElement('td','No chapters match these filters.');td.colSpan=6;tr.append(td);body.append(tr);}
  table.append(thead,body);tableHost.append(table);
  ebRenderDetails(allRows);
}
function ebRenderDetails(rows){
  const host=$('ebGroups');host.replaceChildren();
  const row=rows.find(r=>r.chapter===EB.selectedChapter);
  if(!row||!row.items.length)return;
  const details=ebElement('section',null,'eb-group');
  const top=ebElement('div',null,'panel-heading');top.append(ebElement('h3',row.chapter+' · '+row.attempted+' attempted'),ebButton('Close details',()=>{EB.selectedChapter=null;host.replaceChildren();}));
  const filter=ebElement('select',null);filter.setAttribute('aria-label','Question outcome');
  for(const [v,l] of [['wrong','Incorrect questions'],['correct','Correct questions'],['unanswered','Skipped questions'],['all','All questions']])filter.append(ebOption(v,l));
  filter.value=row.wrong?'wrong':row.correct?'correct':'unanswered';
  const list=ebElement('div',null);
  const render=()=>{list.replaceChildren();const selected=row.items.filter(e=>filter.value==='all'||filter.value===e.q.outcome);if(!selected.length)list.append(ebElement('p','No questions with this outcome.','muted'));for(const e of selected)list.append(ebQuestion(e));typeset(list);};
  filter.onchange=render;details.append(top,filter,list);host.append(details);render();
}

function ebRenderBulk(){
  const box=$('ebBulkBody');if(!box||!EB.uid)return;
  const entries=ebEntries(EB.data,EB.edits);
  const previous=box.querySelector('select')?.value||'';
  box.replaceChildren(ebElement('p','Choose an included test, select questions (correct, incorrect or skipped), and assign a chapter. Scores and notes are preserved.','muted'));
  const attempts=new Map();
  for(const e of entries){const k=e.kind+':'+e.id;if(!attempts.has(k))attempts.set(k,[]);attempts.get(k).push(e);}
  if(!attempts.size){box.append(ebElement('p','No included questions to tag.','muted'));return;}
  const test=ebElement('select',null);test.setAttribute('aria-label','Saved test');
  for(const [id,items] of attempts)test.append(ebOption(id,items[0].title+' · '+(items[0].time?new Date(items[0].time).toLocaleString('en-IN'):'Unknown date')+' · '+items.length+' questions'));
  if(attempts.has(previous))test.value=previous;
  const form=ebElement('div',null,'eb-editor');box.append(test,form);
  function renderAttempt(){
    form.replaceChildren();
    const items=attempts.get(test.value)||[];
    const subject=ebElement('select',null);subject.setAttribute('aria-label','Subject');
    for(const name of [...new Set(items.map(e=>e.subject))])subject.append(ebOption(name,name));
    const area=ebElement('div',null);form.append(subject,area);
    function renderSubject(){
      area.replaceChildren();
      const subset=items.filter(e=>e.subject===subject.value);
      const chapter=ebElement('input',null);chapter.maxLength=100;chapter.placeholder='Choose or enter chapter';chapter.setAttribute('aria-label','New chapter');
      const list=ebElement('datalist',null);list.id='ebBulkChapters';
      for(const row of EB_CHAPTERS.filter(x=>x[0]===subject.value))list.append(ebOption(row[1],row[1]));
      chapter.setAttribute('list',list.id);
      const rows=ebElement('div',null);rows.style.maxHeight='300px';rows.style.overflowY='auto';
      const choices=[];
      for(const e of subset){
        const label=ebElement('label',null);label.style.display='block';
        const cb=ebElement('input',null);cb.type='checkbox';cb.style.marginRight='8px';
        label.append(cb,document.createTextNode('Q'+e.number+' · '+e.chapter+' · '+e.q.outcome));rows.append(label);choices.push({cb,e});
      }
      const buttons=ebElement('div',null,'button-row');
      buttons.append(ebButton('Select unclassified',()=>choices.forEach(x=>x.cb.checked=x.e.chapter===EB_UNTAGGED)),
        ebButton('Select all',()=>choices.forEach(x=>x.cb.checked=true)),
        ebButton('Clear selection',()=>choices.forEach(x=>x.cb.checked=false)));
      area.append(chapter,list,buttons,rows,ebButton('Apply chapter to selected',()=>{
        const name=chapter.value.trim();const selected=choices.filter(x=>x.cb.checked);
        if(!name||!selected.length){toast('Enter a chapter and select at least one question.',true);return;}
        if(ebSaveEdits(selected.map(({e})=>[e.key,{chapter:name,note:e.manual?.note||''}]))){toast('Updated '+selected.length+' questions.');ebRender();}
      }));
    }
    subject.onchange=renderSubject;renderSubject();
  }
  test.onchange=renderAttempt;renderAttempt();
}

function ebQuestion(e){
  const q=e.q,item=ebElement('details',null,'eb-item');
  item.append(ebElement('summary','Q'+e.number+' · '+e.title+' · '+(q.outcome==='wrong'?'Incorrect':q.outcome==='correct'?'Correct':'Unattempted')));
  const when=e.time?new Date(e.time).toLocaleDateString('en-IN'):'Date unknown';
  item.append(ebElement('p',(e.kind==='room'?'Live room':'Solo practice')+' · '+when+' · '+e.source+(q.paperPage?' · Paper page '+q.paperPage:''),'muted'));
  item.append(ebElement('p',q.text||'Image-based question — refer to the original question paper.'));
  if(q.hasImage)item.append(ebElement('p','This question contains an image. The original image is not duplicated in saved history.','muted'));
  const answers=ebElement('div',null,'eb-answer');
  answers.append(ebElement('strong','Your answer: '+(q.chosen==null||q.chosen===''?'Not attempted':String(q.chosen)),q.outcome==='correct'?'correct':'wrong'),ebElement('strong','Correct: '+String(q.answer??'—'),'correct'));
  item.append(answers);
  if(q.explanation)item.append(ebElement('p','Explanation: '+q.explanation));
  const editor=ebElement('div',null,'eb-editor');
  const chapter=ebElement('input',null);chapter.type='text';chapter.maxLength=100;chapter.placeholder='Choose or enter a chapter';chapter.value=e.chapter===EB_UNTAGGED?'':e.chapter;
  const list=ebElement('datalist',null);list.id='eb-chapters-'+e.key.replace(/[^a-zA-Z0-9_-]/g,'_');
  for(const x of EB_CHAPTERS.filter(x=>x[0]===e.subject))list.append(ebOption(x[1],x[1]));
  chapter.setAttribute('list',list.id);chapter.setAttribute('aria-label','Chapter for question '+e.number);
  const note=ebElement('textarea',null);note.maxLength=1000;note.placeholder='Optional: why I got this wrong / what to remember';note.value=e.manual?.note||'';note.setAttribute('aria-label','Revision note');
  const buttons=ebElement('div',null,'button-row');
  buttons.append(ebButton('Save chapter / note',()=>{if(ebSaveEdit(e.key,{chapter:chapter.value.trim(),note:note.value.trim()})){toast('Saved in your Error Book.');ebRender();}}),ebButton('Reset manual tag',()=>{if(ebSaveEdit(e.key,{chapter:'',note:e.manual?.note||''})){ebRender();}}));
  editor.append(ebElement('label','Chapter'),chapter,list,ebElement('label','My correction note'),note,buttons);
  item.append(editor);
  return item;
}
function stopErrorBook(){
  for(const unsub of EB.unsub)try{unsub();}catch{}
  EB.generation++;EB.unsub=[];EB.uid=null;EB.data={};EB.errors={};EB.loading={};EB.edits=new Map();EB.pending=new Map();EB.cloud='local';EB.cloudReady=false;EB.cloudBusy=false;EB.subject='Physics';EB.sort='error-desc';EB.scope='all';EB.query='';EB.selectedChapter=null;
  const panel=$('errorBookPanel');
  if(panel){panel.hidden=true;$('ebBulk').open=false;$('ebBulkBody').replaceChildren();$('ebGroups').replaceChildren();$('ebTable').replaceChildren();$('ebMetrics').replaceChildren();$('ebSearch').value='';$('ebStatus').textContent='';}
}
function startErrorBook(uid,refresh=false){
  if(!S.db||!uid||!isGoogleUser()||S.auth.currentUser.uid!==uid)return;
  if(EB.uid===uid&&EB.unsub.length&&!refresh)return;
  const filters=refresh&&EB.uid===uid?{subject:EB.subject,sort:EB.sort,scope:EB.scope,query:EB.query,selectedChapter:EB.selectedChapter}:null;
  stopErrorBook();ebCreatePanel();EB.uid=uid;EB.edits=ebReadEdits(uid);EB.pending=ebReadMap(ebPendingKey(uid));
  for(const [key,v] of EB.pending){if(ebTagActive(v))EB.edits.set(key,v);else EB.edits.delete(key);}
  if(filters)Object.assign(EB,filters);
  $('ebSearch').value=EB.query;$('errorBookPanel').hidden=false;
  EB.loading={room:true,solo:true};ebRender();ebWatchTags(uid);
  for(const [kind,path] of [['room','studentHistory/'],['solo','soloHistory/']]){
    const unsub=onValue(ref(S.db,path+uid),snap=>{
      if(EB.uid!==uid||S.auth.currentUser?.uid!==uid)return;
      EB.data[kind]=snap.val()||{};EB.loading[kind]=false;delete EB.errors[kind];ebRender();
    },err=>{
      if(EB.uid!==uid)return;
      EB.loading[kind]=false;EB.errors[kind]=String(err?.message||err);ebRender();
    });
    EB.unsub.push(unsub);
  }
}

// DOM EVENTS
$('importBtn').addEventListener('click',()=>{try{importPack(parsePack($('packInput').value));}catch(e){status(e.message,true);}});
$('demoBtn').addEventListener('click',()=>importPack(DEMO_PACK));
$('paperPdfInput').addEventListener('change',()=>{const f=$('paperPdfInput').files?.[0];if(f)attachOriginalPaper(f);});
$('removePaperPdfBtn').addEventListener('click',resetPaperAttachment);
$('exportBtn').addEventListener('click',()=>{if(!S.pack)return toast('Import a test first.',true);copyText(encodePack(S.pack));});
$('clearBtn').addEventListener('click',()=>{$('packInput').value='';S.pack=null;resetPaperAttachment();$('packSummary').hidden=true;$('previewPanel').hidden=true;$('packStatus').hidden=true;});
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
const testPaperButton=viewerButton('Test paper',()=>openTestPaper());testPaperButton.id='testPaperBtn';$('submitBtn').before(testPaperButton);
$('submitBtn').addEventListener('click',()=>finalizeSubmission().catch(e=>toast(errorMessage(e),true)));
$('resultsHomeBtn').addEventListener('click',exitResults);
$('reportSelect').addEventListener('change',selectReport);


// Recover name and previously imported paper for convenience.
$('nameInput').value=localStorage.getItem('ef-display-name')||'';
S.currentIdx=0;
connectFirebase();
