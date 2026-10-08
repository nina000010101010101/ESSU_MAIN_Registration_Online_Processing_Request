const CATEGORIES = [
  "Transcript of Records","Certification","Authentication","Diploma",
  "Honorable Dismissal","Completion Form","Informative Copy","Others"
];
const STATUSES = ["Submitted","Processing","Released","Cancelled"];

const requests = [
  {id:"REQ-2026-0001", name:"Marie Antonette Fernandez", sno:"2021-00214", course:"BS Information Technology", type:"Certification", docs:"Certification of Enrollment", status:"Released", filed:"2026-09-14", purpose:"Scholarship application", contact:"0917 234 5566"},
  {id:"REQ-2026-0002", name:"Jhon Rey Delos Santos", sno:"2019-00871", course:"BS Civil Engineering", type:"Transcript of Records", docs:"Transcript of Records ×2", status:"Processing", filed:"2026-09-20", purpose:"Job application", contact:"0928 118 3342"},
  {id:"REQ-2026-0003", name:"Angel Kim Bautista", sno:"2022-01345", course:"BS Elementary Education", type:"Informative Copy", docs:"Informative Copy", status:"Submitted", filed:"2026-09-22", purpose:"Board exam requirement", contact:"0906 552 0091"},
  {id:"REQ-2026-0004", name:"Rafael Miguel Ong", sno:"2020-00456", course:"BS Accountancy", type:"Diploma", docs:"Diploma (2nd copy)", status:"Processing", filed:"2026-09-18", purpose:"Employment abroad", contact:"0917 902 4471"},
  {id:"REQ-2026-0005", name:"Kristine Joy Mercado", sno:"2018-00230", course:"BS Nursing", type:"Authentication", docs:"Authentication of TOR", status:"Released", filed:"2026-09-10", purpose:"CGFNS verification", contact:"0935 771 6620"},
  {id:"REQ-2026-0006", name:"Paulo Enrico Salazar", sno:"2023-00998", course:"BS Criminology", type:"Honorable Dismissal", docs:"Honorable Dismissal", status:"Submitted", filed:"2026-09-21", purpose:"Transfer to another university", contact:"0912 445 9081"},
  {id:"REQ-2026-0007", name:"Diane Rose Villanueva", sno:"2021-00789", course:"BS Hospitality Management", type:"Completion Form", docs:"Completion Form", status:"Cancelled", filed:"2026-09-05", purpose:"Requirement for OJT", contact:"0917 663 2201"},
  {id:"REQ-2026-0008", name:"Christian Dave Abello", sno:"2019-01120", course:"BS Electrical Engineering", type:"Transcript of Records", docs:"Transcript of Records", status:"Released", filed:"2026-09-09", purpose:"Board exam application", contact:"0908 234 7712"},
  {id:"REQ-2026-0009", name:"Bea Alexandra Cruz", sno:"2022-00512", course:"BS Psychology", type:"Certification", docs:"Certification of Good Moral", status:"Submitted", filed:"2026-09-23", purpose:"Transferee requirement", contact:"0926 118 9034"},
  {id:"REQ-2026-0010", name:"Michael John Rivera", sno:"2020-00981", course:"BS Computer Science", type:"Others", docs:"Special Order copy", status:"Processing", filed:"2026-09-17", purpose:"Graduate school requirement", contact:"0917 550 2210"},
  {id:"REQ-2026-0011", name:"Trisha Mae Gonzales", sno:"2021-00034", course:"BS Agriculture", type:"Informative Copy", docs:"Informative Copy ×2", status:"Released", filed:"2026-09-08", purpose:"DA scholarship renewal", contact:"0919 887 4423"},
  {id:"REQ-2026-0012", name:"Vincent Carl Padilla", sno:"2018-00654", course:"BS Civil Engineering", type:"Diploma", docs:"Diploma", status:"Released", filed:"2026-08-30", purpose:"Board exam application", contact:"0917 220 9915"},
  {id:"REQ-2026-0013", name:"Josephine Anne Torres", sno:"2023-00187", course:"BEEd", type:"Authentication", docs:"Authentication of Diploma", status:"Submitted", filed:"2026-09-22", purpose:"CAV application, DFA", contact:"0928 774 3210"},
  {id:"REQ-2026-0014", name:"Adrian Kyle Espino", sno:"2019-00345", course:"BS Marine Transportation", type:"Certification", docs:"Certification of Units Earned", status:"Cancelled", filed:"2026-09-02", purpose:"Manning agency requirement", contact:"0906 331 8802"},
  {id:"REQ-2026-0015", name:"Camille Faith Reyes", sno:"2020-00789", course:"BS Accountancy", type:"Transcript of Records", docs:"Transcript of Records", status:"Submitted", filed:"2026-09-23", purpose:"CPA board application", contact:"0917 004 5561"},
  {id:"REQ-2026-0016", name:"Ronnel Jay Aquino", sno:"2022-00456", course:"BS Criminology", type:"Honorable Dismissal", docs:"Honorable Dismissal", status:"Processing", filed:"2026-09-19", purpose:"Shift to PNP academy", contact:"0912 887 0033"},
  {id:"REQ-2026-0017", name:"Alyssa Marie Domingo", sno:"2021-00223", course:"BS Hospitality Management", type:"Completion Form", docs:"Completion Form", status:"Released", filed:"2026-09-01", purpose:"OJT clearance", contact:"0917 990 2244"},
  {id:"REQ-2026-0018", name:"Francis Neil Bautista", sno:"2018-00112", course:"BS Electrical Engineering", type:"Diploma", docs:"Diploma (replacement)", status:"Processing", filed:"2026-09-16", purpose:"Lost original copy", contact:"0928 663 5510"},
  {id:"REQ-2026-0019", name:"Grace Anne Villareal", sno:"2023-00902", course:"BS Psychology", type:"Others", docs:"Certified true copy of grades", status:"Submitted", filed:"2026-09-23", purpose:"Internship requirement", contact:"0906 118 7743"},
  {id:"REQ-2026-0020", name:"Julius Caezar Marquez", sno:"2019-00567", course:"BS Computer Science", type:"Informative Copy", docs:"Informative Copy", status:"Released", filed:"2026-09-07", purpose:"Graduate school application", contact:"0917 552 8801"},
];

let currentType = "All";
let currentStatus = "All";
let searchTerm = "";
let editingId = null;

function counts(){
  const c = { All: requests.length };
  CATEGORIES.forEach(cat => c[cat] = requests.filter(r => r.type === cat).length);
  return c;
}

function statusCounts(list){
  const c = { Submitted:0, Processing:0, Released:0, Cancelled:0 };
  list.forEach(r => c[r.status]++);
  return c;
}

function filteredByType(){
  return currentType === "All" ? requests : requests.filter(r => r.type === currentType);
}

function fullyFiltered(){
  let list = filteredByType();
  if (currentStatus !== "All") list = list.filter(r => r.status === currentStatus);
  const term = searchTerm.trim().toLowerCase();
  if (term) list = list.filter(r =>
    r.name.toLowerCase().includes(term) ||
    r.id.toLowerCase().includes(term) ||
    r.sno.toLowerCase().includes(term)
  );
  return list;
}

function renderSidebar(){
  const c = counts();
  const list = document.getElementById('folderList');
  const items = [{name:"All", label:"All requests"}, ...CATEGORIES.map(cat => ({name:cat, label:cat}))];
  list.innerHTML = items.map(it => `
    <li>
      <button class="folder-btn ${currentType===it.name?'active':''}" data-type="${it.name}">
        <span>${it.label}</span>
        <span class="count">${c[it.name]}</span>
      </button>
    </li>
  `).join('');
  list.querySelectorAll('.folder-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{ currentType = btn.dataset.type; render(); });
  });
}

function renderHead(){
  document.getElementById('panelTitle').textContent = currentType === "All" ? "All requests" : currentType;
  document.getElementById('panelSub').textContent = currentType === "All"
    ? "Every credential request filed by students, across all document types."
    : `Requests filed for ${currentType.toLowerCase()}.`;
}

function renderStats(){
  const typeList = filteredByType();
  const sc = statusCounts(typeList);
  const cards = [
    {num: typeList.length, lbl:"Total", gold:true},
    {num: sc.Submitted, lbl:"Submitted"},
    {num: sc.Processing, lbl:"Processing"},
    {num: sc.Released, lbl:"Released"},
    {num: sc.Cancelled, lbl:"Cancelled"},
  ];
  document.getElementById('statRow').innerHTML = cards.map(c => `
    <div class="stat-card ${c.gold?'gold':''}">
      <div class="num">${c.num}</div>
      <div class="lbl">${c.lbl}</div>
    </div>
  `).join('');
}

function renderTable(){
  const list = fullyFiltered();
  const body = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  if (list.length === 0){
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  body.innerHTML = list.map(r => `
    <tr>
      <td data-label="Request no." class="req-no">${r.id}</td>
      <td data-label="Student">
        <div class="student-name">${r.name}</div>
        <div class="student-meta">${r.sno} · ${r.course}</div>
      </td>
      <td data-label="Document">${r.docs}</td>
      <td data-label="Status"><span class="badge ${r.status}">${r.status}</span></td>
      <td data-label="Filed">${formatDate(r.filed)}</td>
      <td data-label=""><button class="view-btn" data-id="${r.id}">View</button></td>
    </tr>
  `).join('');
  body.querySelectorAll('.view-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openModal(btn.dataset.id));
  });
}

function formatDate(iso){
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
}

function render(){
  renderSidebar();
  renderHead();
  renderStats();
  renderTable();
}

/* status pill toolbar */
document.querySelectorAll('.pill').forEach(p=>{
  p.addEventListener('click', ()=>{
    document.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    currentStatus = p.dataset.status;
    renderTable();
  });
});

document.getElementById('localSearch').addEventListener('input', (e)=>{
  searchTerm = e.target.value;
  renderTable();
});
document.getElementById('globalSearch').addEventListener('input', (e)=>{
  searchTerm = e.target.value;
  currentType = "All";
  render();
  document.getElementById('localSearch').value = e.target.value;
});

/* modal */
const overlay = document.getElementById('overlay');
function openModal(id){
  const r = requests.find(x=>x.id===id);
  if (!r) return;
  editingId = id;
  document.getElementById('mReqNo').textContent = r.id;
  document.getElementById('mBody').innerHTML = `
    <div class="mrow"><span class="k">Student</span><span class="v">${r.name}</span></div>
    <div class="mrow"><span class="k">Student no.</span><span class="v">${r.sno}</span></div>
    <div class="mrow"><span class="k">Course</span><span class="v">${r.course}</span></div>
    <div class="mrow"><span class="k">Document requested</span><span class="v">${r.docs}</span></div>
    <div class="mrow"><span class="k">Purpose</span><span class="v">${r.purpose}</span></div>
    <div class="mrow"><span class="k">Contact no.</span><span class="v">${r.contact}</span></div>
    <div class="mrow" style="border-bottom:none;"><span class="k">Filed</span><span class="v">${formatDate(r.filed)}</span></div>
    <div class="status-select">
      <label for="statusSelect">Update status</label>
      <select id="statusSelect">
        ${STATUSES.map(s => `<option value="${s}" ${s===r.status?'selected':''}>${s}</option>`).join('')}
      </select>
    </div>
  `;
  overlay.classList.add('open');
}
function closeModal(){ overlay.classList.remove('open'); editingId = null; }
document.getElementById('mClose').addEventListener('click', closeModal);
document.getElementById('mCancel').addEventListener('click', closeModal);
overlay.addEventListener('click', (e)=>{ if (e.target === overlay) closeModal(); });
document.getElementById('mSave').addEventListener('click', ()=>{
  const sel = document.getElementById('statusSelect');
  const r = requests.find(x=>x.id===editingId);
  if (r && sel){ r.status = sel.value; }
  closeModal();
  render();
});

render();

/* ---- Nav tabs: Dashboard / Profile ---- */
const tabDashboard = document.getElementById('tabDashboard');
const tabProfile = document.getElementById('tabProfile');
const dashboardView = document.getElementById('dashboardView');
const profileView = document.getElementById('profileView');

function showView(view){
  const isDashboard = view === 'dashboard';
  dashboardView.style.display = isDashboard ? 'flex' : 'none';
  profileView.style.display = isDashboard ? 'none' : 'block';
  tabDashboard.classList.toggle('active', isDashboard);
  tabProfile.classList.toggle('active', !isDashboard);
}
tabDashboard.addEventListener('click', ()=> showView('dashboard'));
tabProfile.addEventListener('click', ()=> showView('profile'));

/* ---- Profile form: save (in-memory only — wire this to your backend) ---- */
const profileForm = document.getElementById('profileForm');
const savedNote = document.getElementById('savedNote');
const pFullName = document.getElementById('pFullName');
const adminNameChip = document.getElementById('adminNameChip');

function updateAdminNameChip(){
  const val = pFullName && pFullName.value.trim();
  adminNameChip.textContent = val || 'Admin';
  adminNameChip.title = val ? `Signed in as ${val}` : 'Signed in as Admin';
}

profileForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  updateAdminNameChip();
  savedNote.classList.add('show');
  setTimeout(()=> savedNote.classList.remove('show'), 2200);
});

updateAdminNameChip();

/* ---- Log out: return to the login page ---- */
document.getElementById('logoutBtn').addEventListener('click', ()=>{
  window.location.href = 'index.html';
});

/* ---- Block the browser back button while on the dashboard ----
   This keeps a logged-in user from landing back on a previous page (e.g. the
   login screen) via the browser's Back arrow. It's a front-end deterrent, not
   a security boundary — real access control still has to happen server-side,
   since a determined user can bypass client-side history tricks. */
history.pushState(null, "", location.href);
window.addEventListener("popstate", function(){
  history.pushState(null, "", location.href);
});
