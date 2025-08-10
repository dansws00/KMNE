// Common dataset (not unlimited): most-used sizes + 5-8 in-betweens
const DATA = {
  metric: {
    bolts: ['M3','M4','M5','M6','M7','M8','M9','M10','M12','M14','M16','M18','M20'],
    pitches: {
      'M3':['0.5'],
      'M4':['0.7'],
      'M5':['0.8'],
      'M6':['1.0'],
      'M7':['1.0'],
      'M8':['1.25','1.0'],
      'M9':['1.25'],
      'M10':['1.5','1.25'],
      'M12':['1.75','1.25'],
      'M14':['2.0','1.5'],
      'M16':['2.0','1.5'],
      'M18':['2.5','1.5'],
      'M20':['2.5','1.5']
    },
    washerOD_mm: {'M3':6,'M4':8,'M5':10,'M6':12,'M7':14,'M8':16,'M9':18,'M10':20,'M12':24,'M14':28,'M16':32,'M18':34,'M20':40}
  },
  uss: {
    bolts: ['#4','#6','#8','#10','3/16\"','1/4\"','9/32\"','5/16\"','3/8\"','7/16\"','1/2\"','9/16\"','5/8\"','3/4\"'],
    tpi: {'#4':40,'#6':32,'#8':32,'#10':24,'1/4\"':20,'5/16\"':18,'3/8\"':16,'7/16\"':14,'1/2\"':13,'9/16\"':12,'5/8\"':11,'3/4\"':10},
    washerOD_in: {'#4':0.22,'#6':0.26,'#8':0.30,'#10':0.35,'3/16\"':0.38,'1/4\"':0.50,'9/32\"':0.56,'5/16\"':0.62,'3/8\"':0.75,'7/16\"':0.90,'1/2\"':1.00,'9/16\"':1.06,'5/8\"':1.20,'3/4\"':1.45}
  },
  sae: {
    bolts: ['1/4-20','1/4-28','5/16-18','5/16-24','3/8-16','3/8-24','7/16-14','7/16-20','1/2-13','1/2-20','5/8-11','5/8-18','3/4-10','3/4-16']
  }
};

// Simple equivalence for bolt nominal diameters (approx)
const EQUIV = {
  metricToIn: {'M3':0.118,'M4':0.157,'M5':0.197,'M6':0.236,'M7':0.276,'M8':0.315,'M9':0.354,'M10':0.394,'M12':0.472,'M14':0.551,'M16':0.630,'M18':0.709,'M20':0.787},
  inToMetric: {0.190:'#10',0.1875:'3/16\"',0.250:'1/4\"',0.3125:'5/16\"',0.375:'3/8\"',0.4375:'7/16\"',0.500:'1/2\"',0.5625:'9/16\"',0.625:'5/8\"',0.750:'3/4\"'}
};

// Populate type + standard controls
const typeEl = document.getElementById('type');
const stdEls = document.querySelectorAll('input[name="std"]');
const sizeEl = document.getElementById('size');
const pitchWrap = document.getElementById('pitchWrap');
const pitchEl = document.getElementById('pitch');

function refreshSizes(){
  const std = document.querySelector('input[name="std"]:checked').value;
  sizeEl.innerHTML = '';
  let list = [];
  if(std==='metric'){ list = DATA.metric.bolts; }
  if(std==='uss'){ list = DATA.uss.bolts; }
  if(std==='sae'){ list = DATA.sae.bolts; }
  list.forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    sizeEl.appendChild(opt);
  });
  refreshPitch();
}

function refreshPitch(){
  const std = document.querySelector('input[name="std"]:checked').value;
  const value = sizeEl.value;
  pitchEl.innerHTML = '';
  if(std==='metric'){
    const arr = DATA.metric.pitches[value] || [];
    if(arr.length){
      pitchWrap.style.display = 'block';
      arr.forEach(p=>{
        const o = document.createElement('option'); o.value = p; o.textContent = p + ' mm';
        pitchEl.appendChild(o);
      });
    } else {
      pitchWrap.style.display = 'none';
    }
  } else if(std==='sae'){
    pitchWrap.style.display = 'block';
    const tpi = (value && value.includes('-')) ? value.split('-')[1] : '';
    const o = document.createElement('option'); o.value = tpi; o.textContent = tpi ? (tpi + ' TPI') : '—';
    pitchEl.appendChild(o);
  } else {
    // USS (show TPI if known)
    const t = DATA.uss.tpi[value];
    if(t){
      pitchWrap.style.display = 'block';
      const o = document.createElement('option'); o.value = t; o.textContent = t + ' TPI';
      pitchEl.appendChild(o);
    } else {
      pitchWrap.style.display = 'none';
    }
  }
}

function findMatches(){
  const std = document.querySelector('input[name="std"]:checked').value;
  const type = typeEl.value; // bolt/nut/flat/lock
  const size = sizeEl.value;
  const pitch = pitchEl.value;

  // Build a simple recommendation payload
  let metric = null, uss = null, sae = null;

  if(std==='metric'){
    metric = size;
    // find nearest uss by inch diameter
    const approx_in = EQUIV.metricToIn[size] || null;
    if(approx_in){
      // map to closest from inToMetric keys
      let best=null, bestDiff=1e9, label=null;
      for(const inch of Object.keys(EQUIV.inToMetric)){
        const f = parseFloat(inch);
        const diff = Math.abs(f - approx_in);
        if(diff < bestDiff){ bestDiff=diff; best= f; label = EQUIV.inToMetric[inch]; }
      }
      uss = label;
      // choose SAE coarse that matches closest nominal
      const SAE_LIST = DATA.sae.bolts;
      let bestSAE=null, diffSAE=1e9;
      SAE_LIST.forEach(s=>{
        const nom = s.split('-')[0];
        const mm = {'1/4':0.25,'5/16':0.3125,'3/8':0.375,'7/16':0.4375,'1/2':0.5,'5/8':0.625,'3/4':0.75}[nom];
        if(!mm) return;
        const d = Math.abs(mm - approx_in);
        if(d<diffSAE){diffSAE=d; bestSAE=s;}
      });
      sae = bestSAE;
    }
  } else if(std==='uss'){
    uss = size.replace('\\"','"');
    // rough back map to metric via inch lookup
    const inchMap = {
      '#10':0.190,'3/16"':0.1875,'1/4"':0.25,'9/32"':0.2813,'5/16"':0.3125,'3/8"':0.375,'7/16"':0.4375,'1/2"':0.5,'9/16"':0.5625,'5/8"':0.625,'3/4"':0.75
    };
    let approx = inchMap[uss] || null;
    if(uss in inchMap) approx = inchMap[uss];
    // choose metric closest
    if(approx){
      let bestM=null,diff=1e9;
      for(const m of DATA.metric.bolts){
        const a = EQUIV.metricToIn[m];
        const d = Math.abs(a - approx);
        if(d<diff){diff=d;bestM=m;}
      }
      metric = bestM;
      // pick SAE matching nominal
      const SAE_LIST = DATA.sae.bolts;
      let bestSAE=null, diffSAE=1e9;
      SAE_LIST.forEach(s=>{
        const nom = s.split('-')[0];
        const inchNom = {'1/4':0.25,'5/16':0.3125,'3/8':0.375,'7/16':0.4375,'1/2':0.5,'5/8':0.625,'3/4':0.75}[nom];
        if(!inchNom) return;
        const d = Math.abs(inchNom - (approx || 0));
        if(d<diffSAE){diffSAE=d; bestSAE=s;}
      });
      sae = bestSAE;
    }
  } else { // sae
    sae = size;
    const nom = sae.split('-')[0];
    const inchNom = {'1/4':0.25,'5/16':0.3125,'3/8':0.375,'7/16':0.4375,'1/2':0.5,'5/8':0.625,'3/4':0.75}[nom];
    // map to metric
    let bestM=null, diff=1e9;
    for(const m of DATA.metric.bolts){
      const a = EQUIV.metricToIn[m];
      const d = Math.abs(a - (inchNom||0));
      if(d<diff){diff=d;bestM=m;}
    }
    metric = bestM;
    // map to uss label by closest
    let bestU=null, d2=1e9, label=null;
    for(const inch of Object.keys(EQUIV.inToMetric)){
      const f = parseFloat(inch);
      const dd = Math.abs(f - (inchNom||0));
      if(dd<d2){d2=dd; bestU=f; label=EQUIV.inToMetric[inch];}
    }
    uss = label;
  }

  // Build recommended set
  const recommend = (m)=>{
    if(!m) return {};
    const washer_mm = (DATA.metric.washerOD_mm[m] || 0);
    return {
      nut: m + ' nut',
      flat: `Flat washer ${m} (OD ~ ${washer_mm} mm / ${(washer_mm/25.4).toFixed(2)}")`,
      lock: `Split lock washer ${m}`
    };
  };
  const rec = recommend(metric);

  // Output
  const out = document.getElementById('output');
  out.innerHTML = `
    <strong>Input:</strong> ${type} (${std.toUpperCase()}) — ${size} ${pitch? '· pitch/TPI '+pitch: ''}<br>
    <hr>
    <strong>Matches:</strong><br>
    Metric: ${metric || '—'}<br>
    USS: ${uss || '—'}<br>
    SAE: ${sae || '—'}<br>
    <hr>
    <strong>Recommended:</strong><br>
    Nut: ${rec.nut || '—'}<br>
    Flat washer: ${rec.flat || '—'}<br>
    Lock washer: ${rec.lock || '—'}
  `;
}

document.getElementById('find').addEventListener('click', (e)=>{ e.preventDefault(); findMatches(); });

// init
refreshSizes();
sizeEl.addEventListener('change', refreshPitch);
stdEls.forEach(r=> r.addEventListener('change', ()=>{ refreshSizes(); }));