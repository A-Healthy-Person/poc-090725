// --- State ---
let currentStep = 1;
let selectedRegion = null;
let selectedMFA = null;
const vault = { files: [], selectedId: null };

// --- Helpers ---
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

// --- Navigation links always work ---
function goToSection(id){
  qs('#workflow-demo').classList.remove('active');
  qs('#landing-page').style.display = 'block';
  document.body.style.paddingTop = '80px';
  const el = qs(id);
  if(el) el.scrollIntoView({behavior:'smooth'});
}
qsa('[data-nav]').forEach(a=>{
  a.addEventListener('click', (e)=>{ e.preventDefault(); goToSection(a.getAttribute('href')); });
});

// Start demo buttons
qs('#start-demo').onclick = startWorkflow;
qs('#setup-vault').onclick = startWorkflow;

function startWorkflow(){
  qs('#landing-page').style.display='none';
  qs('#workflow-demo').classList.add('active');
  document.body.style.paddingTop='0';
  currentStep=1; updateWorkflowStep();
}

qs('#back-btn').onclick = handleBackButton;
function handleBackButton(){
  if(qs('#aws-setup').classList.contains('active')){ showStep('step-1'); return; }
  if(currentStep>1){ currentStep--; updateWorkflowStep(); return; }
  goToSection('#features');
}

function updateWorkflowStep(){
  qsa('.step-container').forEach(s=>s.classList.remove('active'));
  qsa('.workflow-step').forEach(s=>s.classList.remove('active'));
  qs(`#step-${currentStep}`)?.classList.add('active');
  qs(`.workflow-step[data-step="${currentStep}"]`)?.classList.add('active');
}
function showStep(id){ qsa('.step-container').forEach(s=>s.classList.remove('active')); qs('#'+id).classList.add('active'); }

// Step 1 interactions
qs('#continue-1').onclick = () => { currentStep = 2; updateWorkflowStep(); };
document.addEventListener('click', (e)=>{
  const card = e.target.closest('.choice-card[data-choice]');
  if(!card) return;
  qsa('.choice-card[data-choice]').forEach(c=>c.classList.remove('selected'));
  card.classList.add('selected');
  selectedRegion = card.dataset.choice;
  if(selectedRegion==='us') showStep('aws-setup');
});

// MFA selection (robust)
document.addEventListener('click', (e)=>{
  const mfa = e.target.closest('.mfa-option');
  if(!mfa) return;
  qsa('.mfa-option').forEach(x=>x.classList.remove('selected'));
  mfa.classList.add('selected');
  selectedMFA = mfa.dataset.mfa;
});

// Proceed AWS (fix: correctly detect MFA choice)
qs('#proceed-aws').onclick = () => {
  const email = qs('#aws-email').value.trim();
  if(!email || !email.includes('@')){ alert('Please enter a valid email address'); return; }
  if(!selectedMFA){ alert('Please select an MFA method'); return; }
  alert(`🚀 Initiating AWS Setup for ${email}\n\n• S3 bucket + encryption\n• Cognito user pool\n• KMS CMK (${selectedMFA})\n• CloudTrail auditing`);
  currentStep = 2; updateWorkflowStep();
};

// Vault login (demo)
qs('#open-vault').onclick = () => {
  const email = qs('#vault-login-email').value.trim();
  const pass = qs('#vault-login-password').value.trim();
  const mfa  = qs('#vault-login-mfa').value.trim();
  if(!email || !pass || mfa.length<6){ alert('Enter email, password, and a 6-digit MFA code.'); return; }
  showStep('vault');
};

// Tabs
document.addEventListener('click', (e)=>{
  const tab = e.target.closest('.tab');
  if(!tab) return;
  qsa('.tab').forEach(t=>t.classList.remove('active'));
  tab.classList.add('active');
  qsa('.panel').forEach(p=>p.classList.remove('active'));
  qs('#panel-'+tab.dataset.panel).classList.add('active');
});

// Simple ID generator
const uid = () => Math.random().toString(36).slice(2,9);

// Add general files
qs('#add-files').onclick = () => {
  const input = qs('#file-input');
  if(!input.files.length){ alert('Choose at least one file.'); return; }
  const tags = qs('#file-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  [...input.files].forEach(f=>{
    vault.files.push({ id:uid(), name:f.name, size:f.size, type:f.type || 'application/octet-stream', concept:'Admin', tags:[...tags], notes:'', kind:'Document', date:new Date().toISOString() });
  });
  input.value=''; qs('#file-tags').value='';
  renderLibrary(); alert('Added to vault (demo).');
};

// Add DICOM (mock)
qs('#add-dicom').onclick = () => {
  const input = qs('#dicom-input');
  if(!input.files.length){ alert('Choose DICOM files.'); return; }
  [...input.files].forEach(f=>{
    vault.files.push({ id:uid(), name:f.name, size:f.size, type:'application/dicom', concept:'Imaging', tags:['DICOM'], notes:'', kind:'Imaging', date:new Date().toISOString() });
  });
  input.value=''; renderLibrary(); alert('DICOM files listed (viewer not included in demo).');
};

// Provider search (mock FastenHealth)
const demoProviders = [
  { id:'kaiser', name:'Kaiser Permanente Northern California', details:'Epic • real-time sync' },
  { id:'johns', name:'Johns Hopkins Medicine', details:'Epic • labs & imaging' },
  { id:'mount', name:'Mount Sinai Health System', details:'Epic • NYC' }
];
qs('#prov-search-btn').onclick = () => {
  const q = qs('#prov-search').value.toLowerCase();
  const results = demoProviders.filter(p=>p.name.toLowerCase().includes(q));
  const box = qs('#prov-results');
  if(!results.length){ box.style.display='block'; box.innerHTML = '<em>No matches in demo.</em>'; return; }
  box.style.display='block';
  box.innerHTML = results.map(r => `<div style="padding:8px; border-left:4px solid #a7bc8f; margin:6px 0; cursor:pointer;" data-prov="${r.id}"><strong>${r.name}</strong><br/><small style="color:#7f8c8d;">${r.details}</small></div>`).join('');
};

document.addEventListener('click', (e)=>{
  const el = e.target.closest('[data-prov]');
  if(!el) return;
  const p = demoProviders.find(x=>x.id===el.dataset.prov);
  const user = prompt(`Connect to ${p.name}. Enter patient portal username (demo):`);
  if(!user){ alert('Username required.'); return; }
  alert(`🔄 Connecting to ${p.name}...\n✅ Authenticated\n✅ Retrieved 47 records (8y)\n✅ Synced to your vault`);
  const now = new Date().toISOString();
  vault.files.push(
    { id:uid(), name:`CBC - ${new Date().toLocaleDateString()}.pdf`, size:12000, type:'application/pdf', concept:'Labs', tags:['CBC','FastenHealth'], notes:'', kind:'Document', date:now },
    { id:uid(), name:`MRI Brain.dcm`, size:34000000, type:'application/dicom', concept:'Imaging', tags:['MRI','FastenHealth'], notes:'', kind:'Imaging', date:now },
    { id:uid(), name:`Metformin 500mg List.txt`, size:800, type:'text/plain', concept:'Medications', tags:['Metformin','FastenHealth'], notes:'', kind:'Document', date:now }
  );
  renderLibrary();
});

// Library render & selection
function renderLibrary(filter='All'){
  const wrap = qs('#library');
  const items = vault.files.filter(f => filter==='All' ? true : f.concept===filter);
  wrap.innerHTML = items.map(f => `
    <div class="file-card" data-file="${f.id}">
      <strong>${f.name}</strong><br/>
      <small>${(f.size/1024).toFixed(1)} KB • ${f.concept}</small>
      <div>${f.tags.map(t=>`<span class='tag'>${t}</span>`).join('')}</div>
    </div>`).join('');
}

// Filter by tree
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-filter]');
  if(!btn) return;
  renderLibrary(btn.dataset.filter);
});

// Select file for notes
document.addEventListener('click', (e)=>{
  const el = e.target.closest('[data-file]');
  if(!el) return;
  const f = vault.files.find(x=>x.id===el.dataset.file);
  vault.selectedId = f.id;
  qs('#notes-file-name').textContent = f.name;
  qs('#notes-category').value = f.concept;
  qs('#notes-tags').value = f.tags.join(',');
  qs('#notes-text').value = f.notes || '';
  qsa('.tab').forEach(t=>t.classList.remove('active'));
  qsa('.panel').forEach(p=>p.classList.remove('active'));
  qs('.tab[data-panel="notes"]').classList.add('active');
  qs('#panel-notes').classList.add('active');
  qs('#notes-area').style.display='block';
});

// Save notes/tags/category
qs('#save-notes').onclick = () => {
  if(!vault.selectedId){ alert('Select a file in Library first.'); return; }
  const f = vault.files.find(x=>x.id===vault.selectedId);
  f.concept = qs('#notes-category').value;
  f.tags = qs('#notes-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  f.notes = qs('#notes-text').value.trim();
  renderLibrary();
  alert('Saved.');
};

// Utility: expose function for step switch
function showAWSSetup(){ showStep('aws-setup'); }
