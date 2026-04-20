/* ============================================================
   SEEDLYNX ADMIN — admin.js
   ============================================================ */
'use strict';
const API = 'http://localhost:5000/api';
let token = localStorage.getItem('sl_token');
let bookings = [], pendingDel = null;

/* ── Canvas BG for Login (reuse particle code) ── */
(function() {
  const c = document.getElementById('loginCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, pts;
  function resize() { W = c.width = innerWidth; H = c.height = innerHeight; init(); }
  function init() { pts = Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()+.5})); }
  function draw() {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(14,196,184,.25)'; ctx.fill();
    });
    for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
      const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<120){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(14,196,184,${(1-d/120)*.12})`;ctx.lineWidth=.6;ctx.stroke();}
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', resize);
  resize(); draw();
})();

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  if (token) { showDash(); }
  setupLogin();
  setupSidebar();
  setupSearch();
  setupRefresh();
  setupEditModal();
  setupDeleteModal();
  setupLogout();
  setupPwToggle();
});

/* ── LOGIN ── */
function setupLogin() {
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const u = document.getElementById('lgUser').value.trim();
    const p = document.getElementById('lgPass').value;
    const errEl = document.getElementById('lgErr');
    errEl.style.display = 'none';
    setLoginLoad(true);
    try {
      const res  = await fetch(`${API}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
      const data = await res.json();
      if (!res.ok) { document.getElementById('lgErrMsg').textContent = data.message||'Invalid credentials.'; errEl.style.display='flex'; return; }
      token = data.token;
      localStorage.setItem('sl_token', token);
      showDash();
    } catch { document.getElementById('lgErrMsg').textContent='Could not connect to server.'; errEl.style.display='flex'; }
    finally { setLoginLoad(false); }
  });
}
function setLoginLoad(v) {
  const btn = document.getElementById('loginBtn');
  btn.disabled = v;
  btn.querySelector('.btext').style.display = v?'none':'flex';
  btn.querySelector('.bload').style.display  = v?'flex':'none';
}
function setupPwToggle() {
  document.getElementById('pwToggle')?.addEventListener('click',()=>{
    const i = document.getElementById('lgPass');
    const s = i.type==='text';
    i.type = s?'password':'text';
    document.getElementById('pwIcon').className = s?'fa-regular fa-eye':'fa-regular fa-eye-slash';
  });
}
function setupLogout() {
  document.getElementById('logoutBtn').addEventListener('click',()=>{
    localStorage.removeItem('sl_token'); token=null;
    document.getElementById('dashboard').style.display='none';
    document.getElementById('loginScreen').style.display='flex';
    document.getElementById('loginForm').reset();
  });
}
function showDash() {
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('dashboard').style.display='grid';
  fetchAll();
}

/* ── SIDEBAR ── */
function setupSidebar() {
  document.querySelectorAll('.sb-link[data-view]').forEach(l=>{
    l.addEventListener('click', e=>{ e.preventDefault(); switchView(l.dataset.view); if(window.innerWidth<900) closeSB(); });
  });
  document.getElementById('sbToggle').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
}
function closeSB() { document.getElementById('sidebar').classList.remove('open'); }
function switchView(name) {
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.sb-link[data-view]').forEach(l=>l.classList.remove('active'));
  document.getElementById(`view-${name}`)?.classList.add('active');
  document.querySelector(`.sb-link[data-view="${name}"]`)?.classList.add('active');
  document.getElementById('topbarTitle').textContent = ({overview:'Overview',bookings:'All Bookings',pending:'Pending Bookings'})[name]||name;
}

/* ── DATA ── */
async function fetchAll() {
  if (!token) return;
  try {
    const res = await fetch(`${API}/bookings`,{headers:{Authorization:`Bearer ${token}`}});
    if (res.status===401) { localStorage.removeItem('sl_token'); token=null; location.reload(); return; }
    const data = await res.json();
    bookings = data.bookings||data||[];
    renderAll();
  } catch { showToast('Failed to load bookings.','error'); }
}
function renderAll() { renderStats(); renderRecent(); renderTable(bookings); renderPending(); }

function renderStats() {
  const t=bookings.length, p=bookings.filter(b=>b.status==='pending').length,
        c=bookings.filter(b=>b.status==='confirmed').length, x=bookings.filter(b=>b.status==='cancelled').length;
  document.getElementById('sTotal').textContent=t;
  document.getElementById('sPending').textContent=p;
  document.getElementById('sConf').textContent=c;
  document.getElementById('sCanc').textContent=x;
  document.getElementById('pendingCount').textContent=p;
}

function renderRecent() {
  const recent=[...bookings].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);
  const w=document.getElementById('recentWrap');
  if(!recent.length){w.innerHTML='<p style="text-align:center;color:var(--muted);padding:2rem">No bookings yet.</p>';return;}
  w.innerHTML=buildTable(recent,true);
  attachActions(w);
}
function renderTable(rows) {
  const b=document.getElementById('allBody');
  if(!rows.length){b.innerHTML='<tr><td colspan="8" class="tbl-empty"><i class="fa-regular fa-calendar-xmark"></i> No bookings found.</td></tr>';return;}
  b.innerHTML=rows.map((r,i)=>buildRow(r,i+1,true)).join('');
  attachActions(document.getElementById('allTable'));
}
function renderPending() {
  const pend=bookings.filter(b=>b.status==='pending');
  const b=document.getElementById('pendBody');
  if(!pend.length){b.innerHTML='<tr><td colspan="7" class="tbl-empty" style="color:var(--green)"><i class="fa-solid fa-check-circle"></i> No pending bookings!</td></tr>';return;}
  b.innerHTML=pend.map((r,i)=>buildRow(r,i+1,false)).join('');
  attachActions(document.getElementById('view-pending'));
}

function buildTable(rows, showStatus) {
  const cols = showStatus
    ?'<th>#</th><th>Name</th><th>Email</th><th>Date</th><th>Time</th><th>Service</th><th>Status</th><th>Actions</th>'
    :'<th>#</th><th>Name</th><th>Email</th><th>Date</th><th>Time</th><th>Service</th><th>Actions</th>';
  return `<table class="data-table"><thead><tr>${cols}</tr></thead><tbody>${rows.map((r,i)=>buildRow(r,i+1,showStatus)).join('')}</tbody></table>`;
}

function buildRow(b, idx, showStatus) {
  const d = b.date?new Date(b.date).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}):'–';
  const t = fmtTime(b.time);
  const svc = svcLabel(b.service);
  const statusCell = showStatus?`<td><span class="s-badge ${b.status||'pending'}">${b.status||'pending'}</span></td>`:'';
  const okBtn = b.status==='pending'?`<button class="act-btn ab-ok" data-id="${b._id}" title="Confirm"><i class="fa-solid fa-check"></i></button>`:'';
  return `<tr>
    <td style="color:var(--muted)">${idx}</td>
    <td title="${esc(b.name)}">${esc(b.name)}</td>
    <td style="color:var(--muted)" title="${esc(b.email)}">${esc(b.email)}</td>
    <td>${d}</td><td>${t}</td>
    <td><span class="svc-chip">${svc}</span></td>
    ${statusCell}
    <td><div class="act-btns">${okBtn}<button class="act-btn ab-edit" data-id="${b._id}" title="Edit"><i class="fa-solid fa-pen"></i></button><button class="act-btn ab-del" data-id="${b._id}" data-name="${esc(b.name)}" title="Delete"><i class="fa-solid fa-trash"></i></button></div></td>
  </tr>`;
}

function attachActions(el) {
  el.querySelectorAll('.ab-edit').forEach(btn=>btn.addEventListener('click',()=>openEdit(btn.dataset.id)));
  el.querySelectorAll('.ab-del').forEach(btn=>btn.addEventListener('click',()=>openDelete(btn.dataset.id,btn.dataset.name)));
  el.querySelectorAll('.ab-ok').forEach(btn=>btn.addEventListener('click',()=>quickConfirm(btn.dataset.id)));
}

/* ── SEARCH & FILTER ── */
function setupSearch() {
  const s=document.getElementById('searchIn'), f=document.getElementById('statusFilter');
  const apply=()=>{
    const q=s.value.toLowerCase(), st=f.value;
    renderTable(bookings.filter(b=>(!q||b.name.toLowerCase().includes(q)||b.email.toLowerCase().includes(q))&&(!st||b.status===st)));
  };
  s.addEventListener('input',apply);
  f.addEventListener('change',apply);
}

/* ── REFRESH ── */
function setupRefresh() {
  const btn=document.getElementById('refreshBtn');
  btn.addEventListener('click',async()=>{
    btn.classList.add('spin');
    await fetchAll();
    setTimeout(()=>btn.classList.remove('spin'),700);
    showToast('Data refreshed','success');
  });
}

/* ── EDIT MODAL ── */
function setupEditModal() {
  document.getElementById('editClose').addEventListener('click',closeEdit);
  document.getElementById('editCancel').addEventListener('click',closeEdit);
  document.getElementById('editBg').addEventListener('click',e=>{if(e.target===document.getElementById('editBg'))closeEdit();});
  document.getElementById('editSave').addEventListener('click',saveEdit);
}
function openEdit(id) {
  const b=bookings.find(x=>x._id===id); if(!b) return;
  document.getElementById('editId').value=b._id;
  document.getElementById('editName').value=b.name;
  document.getElementById('editEmail').value=b.email;
  document.getElementById('editDate').value=b.date?b.date.split('T')[0]:'';
  document.getElementById('editTime').value=b.time;
  document.getElementById('editStatus').value=b.status||'pending';
  document.getElementById('editMsg').value=b.message||'';
  document.getElementById('editBg').style.display='flex';
}
function closeEdit(){document.getElementById('editBg').style.display='none';}
async function saveEdit() {
  const id=document.getElementById('editId').value;
  const payload={name:document.getElementById('editName').value.trim(),email:document.getElementById('editEmail').value.trim(),date:document.getElementById('editDate').value,time:document.getElementById('editTime').value,status:document.getElementById('editStatus').value,message:document.getElementById('editMsg').value.trim()};
  const btn=document.getElementById('editSave');
  btn.disabled=true; btn.textContent='Saving...';
  try {
    const res=await fetch(`${API}/bookings/${id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
    if(!res.ok) throw new Error();
    const data=await res.json();
    const i=bookings.findIndex(b=>b._id===id);
    if(i!==-1) bookings[i]={...bookings[i],...payload};
    closeEdit(); renderAll(); showToast('Booking updated','success');
  } catch { showToast('Failed to update','error'); }
  finally { btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-floppy-disk"></i> Save Changes'; }
}

/* ── DELETE MODAL ── */
function setupDeleteModal() {
  document.getElementById('delBg').addEventListener('click',e=>{if(e.target===document.getElementById('delBg'))closeDelete();});
  document.getElementById('confirmDel').addEventListener('click',doDelete);
}
function openDelete(id,name){pendingDel=id;document.getElementById('delName').textContent=name;document.getElementById('delBg').style.display='flex';}
function closeDelete(){pendingDel=null;document.getElementById('delBg').style.display='none';}
async function doDelete() {
  if(!pendingDel) return;
  const btn=document.getElementById('confirmDel'); btn.disabled=true;
  try {
    const res=await fetch(`${API}/bookings/${pendingDel}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
    if(!res.ok) throw new Error();
    bookings=bookings.filter(b=>b._id!==pendingDel);
    closeDelete(); renderAll(); showToast('Booking deleted','success');
  } catch { showToast('Failed to delete','error'); }
  finally { btn.disabled=false; }
}

/* ── QUICK CONFIRM ── */
async function quickConfirm(id) {
  try {
    const res=await fetch(`${API}/bookings/${id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({status:'confirmed'})});
    if(!res.ok) throw new Error();
    const i=bookings.findIndex(b=>b._id===id);
    if(i!==-1) bookings[i].status='confirmed';
    renderAll(); showToast('Booking confirmed!','success');
  } catch { showToast('Could not confirm','error'); }
}

/* ── TOAST ── */
let _tTimer;
function showToast(msg,type='success') {
  const t=document.getElementById('toast');
  t.innerHTML=`<i class="fa-solid ${type==='success'?'fa-circle-check':'fa-circle-exclamation'}"></i> ${msg}`;
  t.className=`toast ${type} show`;
  clearTimeout(_tTimer);
  _tTimer=setTimeout(()=>t.classList.remove('show'),3000);
}

/* ── HELPERS ── */
function fmtTime(t){if(!t)return'–';const[h,m]=t.split(':').map(Number);return`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;}
function svcLabel(s){return({web:'Web Dev',multimedia:'Multimedia',both:'Both',consultation:'Consultation'})[s]||s||'–';}
function esc(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}