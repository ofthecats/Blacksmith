// BUILD: Blacksmith-v9-MEGA-LIBRARY
window.__BUILD_ID="v9.0";

// --- ERROR HANDLING ---
window.onerror = function(msg, source, lineno, colno, error) {
  const status = document.getElementById("status");
  if(status) {
    status.style.display = "block";
    status.style.background = "#ff5c7a";
    status.style.color = "#fff";
    status.textContent = `CRASH: ${msg}`;
  }
};

// --- UTILS ---
function escapeHtml(str){ return String(str||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function uid(prefix="id") { return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function roundToIncrement(value, inc) { const rounded = Math.round(value / inc) * inc; return Math.round(rounded * 100) / 100; }
function fmt(n) { const x = Number(n); if (Number.isNaN(x)) return ""; return (Math.round(x * 100) / 100).toString(); }
function nowISODate(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function setStatus(msg){ 
  const el=document.getElementById("status"); 
  if(el) {
    el.textContent = msg;
    el.style.display = msg ? "block" : "none"; 
    if(msg) setTimeout(() => { el.style.display = "none"; }, 3000);
  }
}

// --- STATE MANAGEMENT ---
const KEY = "hc_v4_state";
const BACKUP_KEY = "hc_v4_backups";

function loadState(){ const raw=localStorage.getItem(KEY); if(!raw) return null; try{return JSON.parse(raw);}catch{return null;} }
function saveState(s){ localStorage.setItem(KEY, JSON.stringify(s)); }

function loadBackups(){ const raw = localStorage.getItem(BACKUP_KEY); try{ return JSON.parse(raw||'{"meta":{},"items":[]}'); }catch{ return { meta:{}, items:[] }; } }
function saveBackups(b){ localStorage.setItem(BACKUP_KEY, JSON.stringify(b)); }

function makeAutoBackup(reason="auto"){
  try{
    const b = loadBackups();
    const keep = Number(state?.settings?.backupKeep || 14);
    const freqHrs = Number(state?.settings?.backupFreqHours || 24);
    const now = Date.now();
    const last = Number(b.meta?.lastAt || 0);
    const due = (now - last) >= (freqHrs * 3600 * 1000);
    if(reason !== "manual" && !due) return false;
    const payload = JSON.stringify(state);
    const snap = { id: "bk_" + uid("b"), at: now, date: nowISODate(), reason, size: payload.length, data: payload };
    b.items = [snap, ...(b.items||[])].slice(0, keep);
    b.meta = { lastAt: now };
    saveBackups(b); 
    return true;
  }catch{ return false; }
}

// --- DOM & RENDER ---
const $app = document.getElementById("app");
let state = loadState() || seedState(); saveState(state);
let route = {name:"home",params:{}};

// --- CORE DATA SEEDING ---
const MUSCLES = ["CHEST","BACK","DELTS","BICEPS","TRICEPS","QUADS","HAMSTRINGS","GLUTES","CALVES","ABS","TRAPS","FOREARMS","CORE"];
const SKIP_REASONS = ["Fatigue", "Pain/Injury", "Time/Scheduling", "Equipment Busy", "Other"];

function seedExercises(){
  const E=[];
  const add=(id,name,muscles,compound,equipment,custom=false)=>E.push({id,name,muscles,compound,equipment,custom});
  
  // --- CHEST ---
  add("ex_bb_bench","Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_bb_incline","Incline Bench (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_bb_decline","Decline Bench (Barbell)",["CHEST","TRICEPS"],true,"barbell");
  add("ex_db_bench","Bench Press (Dumbbell)",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_db_incline","Incline Press (Dumbbell)",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_db_decline","Decline Press (Dumbbell)",["CHEST","TRICEPS"],true,"dumbbell");
  add("ex_mach_chest","Chest Press (Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_mach_incline","Incline Press (Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_smith_bench","Bench Press (Smith Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_smith_incline","Incline Press (Smith Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_cable_fly_hi","Cable Fly (High-to-Low)",["CHEST"],false,"cable");
  add("ex_cable_fly_mid","Cable Fly (Mid-Chest)",["CHEST"],false,"cable");
  add("ex_cable_fly_lo","Cable Fly (Low-to-High)",["CHEST"],false,"cable");
  add("ex_pec_deck","Pec Deck / Machine Fly",["CHEST"],false,"machine");
  add("ex_db_fly","Dumbbell Fly",["CHEST"],false,"dumbbell");
  add("ex_dips","Dips (Chest Focus)",["CHEST","TRICEPS"],true,"bodyweight");
  add("ex_pushup","Push-up",["CHEST","TRICEPS","CORE"],true,"bodyweight");

  // --- BACK ---
  add("ex_pullup","Pull-up (Overhand)",["BACK","BICEPS"],true,"bodyweight");
  add("ex_chinup","Chin-up (Underhand)",["BACK","BICEPS"],true,"bodyweight");
  add("ex_lat_pulldown","Lat Pulldown (Wide)",["BACK","BICEPS"],true,"cable");
  add("ex_lat_pulldown_neu","Lat Pulldown (Neutral)",["BACK","BICEPS"],true,"cable");
  add("ex_lat_pulldown_sup","Lat Pulldown (Underhand)",["BACK","BICEPS"],true,"cable");
  add("ex_bb_row","Bent Over Row (Barbell)",["BACK","BICEPS","TRAPS"],true,"barbell");
  add("ex_pendlay_row","Pendlay Row",["BACK","BICEPS","TRAPS"],true,"barbell");
  add("ex_db_row","One-Arm Dumbbell Row",["BACK","BICEPS"],true,"dumbbell");
  add("ex_cable_row","Seated Cable Row",["BACK","BICEPS"],true,"cable");
  add("ex_tbar_row","T-Bar Row",["BACK","BICEPS","TRAPS"],true,"machine");
  add("ex_chest_supp_row","Chest-Supported Row",["BACK","BICEPS"],true,"machine");
  add("ex_mach_row_lo","Low Row (Machine)",["BACK","BICEPS"],true,"machine");
  add("ex_mach_row_hi","High Row (Machine)",["BACK","BICEPS"],true,"machine");
  add("ex_pullover_cable","Straight-Arm Pulldown",["BACK"],false,"cable");
  add("ex_pullover_db","Dumbbell Pullover",["BACK","CHEST"],false,"dumbbell");
  add("ex_facepull","Face Pull",["DELTS","TRAPS","BACK"],false,"cable");
  add("ex_shrug_bb","Shrug (Barbell)",["TRAPS"],false,"barbell");
  add("ex_shrug_db","Shrug (Dumbbell)",["TRAPS"],false,"dumbbell");
  add("ex_back_ext","Back Extension",["BACK","GLUTES"],false,"bodyweight");

  // --- SHOULDERS ---
  add("ex_ohp_bb","Overhead Press (Barbell)",["DELTS","TRICEPS"],true,"barbell");
  add("ex_ohp_db","Overhead Press (Dumbbell)",["DELTS","TRICEPS"],true,"dumbbell");
  add("ex_arnold","Arnold Press",["DELTS","TRICEPS"],true,"dumbbell");
  add("ex_mach_shoulder","Shoulder Press (Machine)",["DELTS","TRICEPS"],true,"machine");
  add("ex_lat_raise_db","Lateral Raise (Dumbbell)",["DELTS"],false,"dumbbell");
  add("ex_lat_raise_c","Lateral Raise (Cable)",["DELTS"],false,"cable");
  add("ex_lat_raise_m","Lateral Raise (Machine)",["DELTS"],false,"machine");
  add("ex_front_raise","Front Raise",["DELTS"],false,"dumbbell");
  add("ex_upright_row","Upright Row",["DELTS","TRAPS"],true,"barbell");
  add("ex_rear_fly_db","Rear Delt Fly (Dumbbell)",["DELTS"],false,"dumbbell");
  add("ex_rear_fly_m","Rear Delt Fly (Machine)",["DELTS"],false,"machine");
  add("ex_rear_fly_c","Rear Delt Fly (Cable)",["DELTS"],false,"cable");

  // --- LEGS (QUADS) ---
  add("ex_squat_bb","Back Squat (Barbell)",["QUADS","GLUTES"],true,"barbell");
  add("ex_squat_front","Front Squat (Barbell)",["QUADS","GLUTES"],true,"barbell");
  add("ex_leg_press","Leg Press",["QUADS","GLUTES"],true,"machine");
  add("ex_hack_squat","Hack Squat",["QUADS","GLUTES"],true,"machine");
  add("ex_pendulum","Pendulum Squat",["QUADS","GLUTES"],true,"machine");
  add("ex_goblet","Goblet Squat",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_lunge_walk","Walking Lunge",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_lunge_rev","Reverse Lunge",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_split_squat","Bulgarian Split Squat",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_leg_ext","Leg Extension",["QUADS"],false,"machine");
  add("ex_step_up","Step Up",["QUADS","GLUTES"],true,"dumbbell");

  // --- LEGS (HAMSTRINGS/GLUTES) ---
  add("ex_dl_conv","Deadlift (Conventional)",["HAMSTRINGS","GLUTES","BACK"],true,"barbell");
  add("ex_dl_sumo","Deadlift (Sumo)",["HAMSTRINGS","GLUTES","QUADS"],true,"barbell");
  add("ex_rdl_bb","Romanian Deadlift (Barbell)",["HAMSTRINGS","GLUTES"],true,"barbell");
  add("ex_rdl_db","Romanian Deadlift (Dumbbell)",["HAMSTRINGS","GLUTES"],true,"dumbbell");
  add("ex_leg_curl_seat","Leg Curl (Seated)",["HAMSTRINGS"],false,"machine");
  add("ex_leg_curl_lie","Leg Curl (Lying)",["HAMSTRINGS"],false,"machine");
  add("ex_good_morn","Good Morning",["HAMSTRINGS","GLUTES"],true,"barbell");
  add("ex_hip_thrust","Hip Thrust",["GLUTES"],true,"barbell");
  add("ex_glute_bridge","Glute Bridge",["GLUTES"],true,"barbell");
  add("ex_cable_kick","Glute Kickback",["GLUTES"],false,"cable");
  add("ex_hyperext","Hyperextension (Glute Focus)",["GLUTES","HAMSTRINGS"],false,"bodyweight");
  add("ex_abductor","Hip Abduction (Machine)",["GLUTES"],false,"machine");

  // --- CALVES ---
  add("ex_calf_stand","Standing Calf Raise",["CALVES"],false,"machine");
  add("ex_calf_seat","Seated Calf Raise",["CALVES"],false,"machine");
  add("ex_calf_legp","Leg Press Calf Raise",["CALVES"],false,"machine");
  add("ex_calf_db","Single Leg Calf Raise (DB)",["CALVES"],false,"dumbbell");

  // --- BICEPS ---
  add("ex_curl_bb","Barbell Curl",["BICEPS"],false,"barbell");
  add("ex_curl_ez","EZ-Bar Curl",["BICEPS"],false,"barbell");
  add("ex_curl_db","Dumbbell Curl (Standing)",["BICEPS"],false,"dumbbell");
  add("ex_curl_hammer","Hammer Curl",["BICEPS","FOREARMS"],false,"dumbbell");
  add("ex_curl_inc","Incline Dumbbell Curl",["BICEPS"],false,"dumbbell");
  add("ex_curl_preach","Preacher Curl",["BICEPS"],false,"machine");
  add("ex_curl_cable","Cable Curl",["BICEPS"],false,"cable");
  add("ex_curl_conc","Concentration Curl",["BICEPS"],false,"dumbbell");
  add("ex_curl_bay","Bayesian Curl (Cable)",["BICEPS"],false,"cable");

  // --- TRICEPS ---
  add("ex_tri_pushdown","Triceps Pushdown (Rope)",["TRICEPS"],false,"cable");
  add("ex_tri_push_bar","Triceps Pushdown (Bar)",["TRICEPS"],false,"cable");
  add("ex_skullcrusher","Skullcrusher (EZ Bar)",["TRICEPS"],false,"barbell");
  add("ex_tri_oh_db","Overhead Extension (Dumbbell)",["TRICEPS"],false,"dumbbell");
  add("ex_tri_oh_cab","Overhead Extension (Cable)",["TRICEPS"],false,"cable");
  add("ex_jm_press","JM Press",["TRICEPS"],true,"barbell");
  add("ex_close_bench","Close-Grip Bench Press",["TRICEPS","CHEST"],true,"barbell");
  add("ex_kickback","Triceps Kickback",["TRICEPS"],false,"cable");

  // --- ABS ---
  add("ex_cable_crunch","Cable Crunch",["ABS"],false,"cable");
  add("ex_leg_raise","Hanging Leg Raise",["ABS"],false,"bodyweight");
  add("ex_knee_raise","Captain's Chair Knee Raise",["ABS"],false,"machine");
  add("ex_ab_wheel","Ab Wheel Rollout",["ABS","CORE"],true,"bodyweight");
  add("ex_plank","Plank",["ABS","CORE"],true,"bodyweight");
  add("ex_woodchop","Cable Woodchop",["ABS","CORE"],false,"cable");
  add("ex_crunch_mach","Ab Crunch Machine",["ABS"],false,"machine");

  return E;
}

function seedState(){
  const exercises = seedExercises();
  const days=[{id:"day_upper",name:"Upper Body",index:0}];
  const slot=(dayId,order,exId,sets,repMin,repMax,targetRir,suggestedLoad)=>({id:uid("slot"),dayId,order,exId,sets,repMin,repMax,targetRir,repTarget:repMin,suggestedLoad});
  const slots=[
    slot("day_upper",0,"ex_db_incline",3,8,12,2,50),
    slot("day_upper",1,"ex_lat_pulldown",3,10,15,2,120)
  ];
  return { meta:{version:4,createdAt:Date.now()}, settings:{daysPerWeek:4,loadIncrement:2.5,autoFillFromSuggestion:true,backupFreqHours:24,backupKeep:14}, exercises, days, slots, sessions:[] };
}

// --- LOGIC HELPER ---
function exById(id){ return state.exercises.find(e=>e.id===id) || {id, name:"Unknown", muscles:[]}; }
function dayById(id){ return state.days.find(d=>d.id===id); }
function slotsForDay(dayId){ return state.slots.filter(s=>s.dayId===dayId).sort((a,b)=>a.order-b.order); }
function readinessScore({sleep,energy,soreness,stress}){ return (sleep+energy+(6-soreness)+(6-stress))/4; }
function isIsolation(slot){ return slot.repMax>=15; }

function nextSlotFromLogs(slot,logs,lowReadiness,settings){
  if(!logs||logs.length===0) return slot;
  const avgRir=logs.reduce((s,x)=>s+Number(x.achievedRir||0),0)/logs.length;
  const adjustedSets=(lowReadiness&&isIsolation(slot))?clamp(slot.sets-1,2,20):slot.sets;
  const inc=settings.loadIncrement||2.5;
  if(avgRir<slot.targetRir-0.5) return {...slot,sets:adjustedSets,suggestedLoad:roundToIncrement(Math.max(0,slot.suggestedLoad*0.95),inc)};
  if(avgRir>slot.targetRir+0.5){
    const nextRep=clamp(slot.repTarget+1,slot.repMin,slot.repMax);
    if(nextRep<slot.repMax) return {...slot,sets:adjustedSets,repTarget:nextRep};
    return {...slot,sets:adjustedSets,suggestedLoad:roundToIncrement(Math.max(0,slot.suggestedLoad*1.03),inc),repTarget:slot.repMin};
  }
  return {...slot,sets:adjustedSets,repTarget:clamp(slot.repTarget+1,slot.repMin,slot.repMax)};
}

function exportHistoryCSV() {
  const headers = ["Date", "Workout Name", "Exercise", "Muscle Groups", "Set Order", "Weight", "Reps", "RIR", "Type"];
  const rows = [headers.join(",")];
  const sessions = [...state.sessions].sort((a,b) => b.startedAt - a.startedAt);
  sessions.forEach(sess => {
    const date = sess.date;
    const dayName = (dayById(sess.dayId)?.name || "Deleted Workout").replace(/,/g, "");
    if (sess.skipped) {
      rows.push(`${date},${dayName},SKIPPED SESSION (${sess.skipReason || "No reason"}),,,,,`);
      return;
    }
    (sess.logs||[]).forEach(log => {
      const slot = state.slots.find(s => s.id === log.slotId);
      let exName = "Unknown", muscles = "";
      if (slot) {
        const ex = exById(slot.exId);
        exName = ex.name.replace(/,/g, "");
        muscles = (ex.muscles || []).join("/").replace(/,/g, "");
      }
      rows.push(`${date},${dayName},${exName},${muscles},${Math.abs(log.setIndex)},${log.weight},${log.reps},${log.achievedRir},${log.isWarmup ? "Warmup" : "Working"}`);
    });
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `blacksmith_history_${nowISODate()}.csv`;
  a.click();
}


// --- VIEW FUNCTIONS ---
function html(strings,...vals){ return strings.map((s,i)=>s+(vals[i]??"")).join(""); }

function viewHome(){
  return html`<div class="h1">Blacksmith <span style="font-size:12px;opacity:0.5;font-weight:normal">${window.__BUILD_ID}</span></div>
  <div class="grid two">
    <div class="card">
      <div class="h2">Templates</div>
      <div class="row">${state.days.sort((a,b)=>a.index-b.index).map(d=>html`<button class="btn" data-start="${d.id}">${escapeHtml(d.name)}</button>`).join("")}</div>
    </div>
    <div class="card">
      <div class="h2">Menu</div>
      <div class="row">
        <button class="btn secondary" data-navto="workoutLast">Resume Last</button>
        <button class="btn secondary" data-navto="library">Library</button>
        <button class="btn secondary" data-navto="settings">Settings</button>
      </div>
    </div>
  </div>`;
}

function viewLibrary(){
  const q=window.__lib_q??"", filterMuscle=window.__lib_m??"ALL";
  const list=state.exercises.filter(e=>(filterMuscle==="ALL"||(e.muscles||[]).includes(filterMuscle)) && e.name.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
  return html`
  <div class="spread"><div><div class="h1">Library</div></div><button class="btn secondary" data-navto="home">Back</button></div>
  <div class="grid two">
    <div class="card">
      <div class="h2">Add Custom Exercise</div>
      <label>Name</label><input class="input" id="custName" />
      <div style="margin:10px 0"><label>Muscles</label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px; max-height:100px; overflow-y:auto; border:1px solid var(--line); padding:5px; border-radius:8px;">
          ${MUSCLES.map(m=>`<label style="font-size:12px"><input type="checkbox" name="custMuscle" value="${m}"> ${m}</label>`).join("")}
        </div>
      </div>
      <button class="btn ok" data-action="add-custom-ex">Add Exercise</button>
    </div>
    <div class="card">
      <div class="h2">Exercises (${list.length})</div>
      <input class="input" placeholder="Search..." oninput="window.__lib_q=this.value; render()" value="${q}" style="margin-bottom:10px">
      ${list.slice(0,50).map(e=>`<div class="spread" style="padding:5px 0; border-bottom:1px solid var(--line)"><b>${escapeHtml(e.name)}</b>${e.custom?`<button class="btn danger" data-del-ex="${e.id}">×</button>`:""}</div>`).join("")}
    </div>
  </div>`;
}

function viewProgress(){
  const recent=[...state.sessions].sort((a,b)=>b.startedAt-a.startedAt).slice(0,10);
  return html`<div class="h1">Progress</div>
    <div class="card">
      ${recent.map(s=>`<div class="spread" style="padding:10px 0; border-top:1px solid var(--line)"><div>${s.date} • <b>${dayById(s.dayId)?.name}</b></div><span class="badge ${s.skipped?"warn":"ok"}">${s.skipped?"Skipped":s.logs.length+" sets"}</span></div>`).join("")}
    </div>`;
}

function viewSettings(){
  return html`<div class="h1">Settings</div>
  <div class="grid two">
    <div class="card"><div class="h2">General</div><button class="btn ok" data-action="save-settings">Save Defaults</button></div>
    <div class="card">
      <div class="h2">Data</div>
      <div class="row"><button class="btn secondary" data-action="export-csv">Export CSV</button><button class="btn secondary" data-action="export-json">Export JSON</button></div>
      <hr/><button class="btn danger" data-action="reset-all">Reset All Data</button>
    </div>
  </div>
  <div class="card">
    <div class="spread"><div><div class="h2">Program Builder</div></div><button class="btn ok" data-action="toggle-add-day">Add Workout</button></div>
    ${window.__settingsUI?.addDayOpen ? `<div class="card" style="border:1px solid var(--accent); margin-top:10px"><input class="input" id="newDayName" placeholder="Workout Name"><button class="btn ok" data-action="confirm-add-day" style="margin-top:10px">Create</button></div>` : ""}
    ${state.days.map(d=>`<div class="spread" style="padding:10px 0; border-bottom:1px solid var(--line)"><b>${d.name}</b><div><button class="btn secondary" data-edit-day="${d.id}">Edit</button><button class="btn danger" data-del-day="${d.id}">×</button></div></div>`).join("")}
  </div>`;
}

function setRow(slot,idx,s){
  return html`<div class="setRow" style="grid-template-columns: 30px 1fr 1fr 1fr 40px 50px;">
    <div class="badge">${idx+1}</div>
    <div><label>Wt<input class="input" type="number" data-set="${slot.id}" data-field="weight" data-idx="${idx}" value="${s.weight}"></label></div>
    <div><label>Reps<input class="input" type="number" data-set="${slot.id}" data-field="reps" data-idx="${idx}" value="${s.reps}"></label></div>
    <div><label>RIR<input class="input" type="number" data-set="${slot.id}" data-field="rir" data-idx="${idx}" value="${s.rir}"></label></div>
    <div><label>&nbsp;</label><button class="btn danger" data-del-set-row="${slot.id}" data-idx="${idx}">×</button></div>
    <div><label>&nbsp;</label><button class="btn ${s.done?"ok":"secondary"}" data-markdone="${slot.id}" data-idx="${idx}">${s.done?"✓":""}</button></div>
  </div>`;
}

function exerciseCard(slot,ui){
  const ex=exById(slot.exId); 
  const draft=ui.setDrafts[slot.id]; 
  const isSkipped = ui.skips[slot.id];
  const isCollapsed = ui.collapsed[slot.id];

  return html`<div class="exerciseCard" style="margin-bottom:12px; border:${isSkipped?'1px solid var(--warn)':'1px solid var(--line)'}">
    <div class="spread exHeader" data-toggle="${slot.id}" style="cursor:pointer; padding-bottom:8px">
      <div>
        <span class="chev" style="display:inline-block; transform: ${isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'}">▼</span> 
        <b>${escapeHtml(ex.name)}</b> 
        ${isSkipped?'(SKIPPED)':''}
      </div>
      <div class="row"><span class="badge">${slot.sets}×${slot.repTarget}</span><span class="badge accent">Rec: ${fmt(slot.suggestedLoad)}</span></div>
    </div>
    <div class="exBody" style="${isCollapsed ? 'display:none' : 'display:block'}">
      <hr style="opacity:0.3; margin: 8px 0" />
      ${isSkipped ? `<button class="btn" data-undo-skip="${slot.id}">Undo Skip</button>` : `
      <div class="row" style="margin-top:10px">
        <button class="btn secondary" data-addset="${slot.id}">Add Set</button>
        <button class="btn ok" data-action="save-slot-default" data-slotid="${slot.id}">Save Default</button>
        <button class="btn warn" data-open-skip="${slot.id}">Skip</button>
      </div>
      <div style="margin-top:12px">${draft.sets.map((s,idx)=>setRow(slot,idx,s)).join("")}</div>`}
      ${ui.skipModalFor === slot.id ? `<div class="modal"><div class="h2">Reason?</div>${SKIP_REASONS.map(r=>`<button class="btn secondary" data-confirm-skip="${slot.id}" data-reason="${r}">${r}</button>`).join("")}</div>` : ""}
    </div>
  </div>`;
}

function viewWorkout(dayId){
  const day=dayById(dayId); 
  const slots=slotsForDay(dayId);
  const ui=window.__workoutUI||(window.__workoutUI={readiness:{sleep:3,energy:3,soreness:3,stress:3},started:false,setDrafts:{},warmups:{},skips:{},collapsed:{},__showAdd:false});
  
  slots.forEach(s=>{ 
    if(!ui.setDrafts[s.id]) {
      ui.setDrafts[s.id]={sets:Array.from({length:s.sets}).map(()=>({weight:s.suggestedLoad,reps:s.repTarget,rir:s.targetRir,done:false}))}; 
    }
  });

  const exOptions = state.exercises.slice().sort((a,b)=>a.name.localeCompare(b.name));
  const timerStr = ui.startedAt ? "Running" : "—";
  
  return html`<div class="spread"><div><div class="h1">${day?day.name:"Workout"}</div><div class="pill">Time <b id="sessionTimer">${timerStr}</b></div></div><button class="btn" data-action="start-session">${ui.started?'Started':'Start Session'}</button></div>
  <div class="grid two"><div class="card"><label>Energy Level</label><input type="range" min="1" max="5" value="${ui.readiness.energy}" oninput="window.__workoutUI.readiness.energy=Number(this.value)"></div><div class="card"><button class="btn" data-action="finish-adjust">Finish & Adjust</button><button class="btn warn" data-action="open-skip-session">Skip Session</button></div></div>
  <div class="card">
    <div class="spread">
       <div class="h2">Exercises</div>
       <button class="btn ok" data-action="toggle-add-ex">Add Exercise</button>
    </div>
    ${ui.__showAdd ? `
      <div class="card" style="border:1px solid var(--accent); margin-top:10px; margin-bottom:15px; padding:10px;">
        <label>Select Exercise</label>
        <select class="input" id="addExId" style="margin-bottom:10px">
          ${exOptions.map(e=>`<option value="${e.id}">${escapeHtml(e.name)}</option>`).join("")}
        </select>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
          <div><label>Sets</label><input type="number" class="input" id="addSets" value="3"></div>
          <div><label>RIR</label><input type="number" class="input" id="addRir" value="2"></div>
        </div>
        <div class="row">
          <button class="btn ok" data-action="confirm-add-ex">Add to Workout</button>
          <button class="btn secondary" data-action="toggle-add-ex">Cancel</button>
        </div>
      </div>
    ` : ""}
    ${slots.length === 0 ? `<div style="padding:40px 20px; text-align:center; opacity:0.6; border: 1px dashed var(--line); margin-top:20px; border-radius:12px;">No exercises here yet.<br><br>Click <b>Add Exercise</b> above to start building.</div>` : ""}
    ${slots.map(s=>exerciseCard(s,ui)).join("")}
  </div>
  ${ui.showSkipSessionModal ? `<div class="modal"><div class="h2">Skip Session Reason</div>${SKIP_REASONS.map(r=>`<button class="btn secondary" data-action="do-skip-session" data-reason="${r}">${r}</button>`).join("")}<button class="btn" data-action="close-skip-session" style="margin-top:10px">Cancel</button></div>`:""}`;
}

// --- RENDER & ROUTER ---
function render(){
  try {
    setStatus(""); 
    const r = route.name;
    let v = viewHome();
    if(r==="workout") v = viewWorkout(route.params.dayId);
    else if(r==="workoutLast") v = viewWorkout(lastWorkedDayId());
    else if(r==="library") v = viewLibrary();
    else if(r==="progress") v = viewProgress();
    else if(r==="settings") v = viewSettings();
    $app.innerHTML = v;

    document.querySelectorAll(".bnavbtn").forEach(b => {
      b.classList.toggle("active", b.dataset.nav === r || (b.dataset.nav === "workoutLast" && r === "workout"));
      b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); const n = b.dataset.nav; if(n === "workoutLast") navigate("workoutLast"); else navigate(n); };
    });
  } catch (err) {
    setStatus("RENDER ERROR: " + err.message);
    console.error(err);
  }
}

function navigate(name,params={}){ route={name,params}; render(); }
function lastWorkedDayId(){ const s=[...state.sessions].sort((a,b)=>b.startedAt-a.startedAt)[0]; return s?.dayId||state.days[0]?.id; }

// --- DELEGATION ---
document.addEventListener("click", e => {
  const toggle = e.target.closest("[data-toggle]");
  if(toggle) {
    const id = toggle.dataset.toggle;
    const ui = window.__workoutUI;
    if(ui) { ui.collapsed[id] = !ui.collapsed[id]; render(); }
    return;
  }

  const btn = e.target.closest("button");
  if(!btn) return;
  const ds = btn.dataset;

  if(ds.navto) { e.preventDefault(); if(ds.navto==="workoutLast") navigate("workoutLast"); else navigate(ds.navto); return; }
  if(ds.start) { e.preventDefault(); navigate("workout", {dayId: ds.start}); return; }
  if(ds.editDay) { e.preventDefault(); navigate("workout", {dayId: ds.editDay}); return; }
  
  if(ds.action) { e.preventDefault(); handleAction(ds.action, ds); return; }

  const ui = window.__workoutUI;
  if(ui) {
    if(ds.markdone) { ui.setDrafts[ds.markdone].sets[ds.idx].done = !ui.setDrafts[ds.markdone].sets[ds.idx].done; render(); return; }
    if(ds.addset) { ui.setDrafts[ds.addset].sets.push({weight:"",reps:"",rir:"",done:false}); render(); return; }
    if(ds.delSetRow) { ui.setDrafts[ds.delSetRow].sets.splice(ds.idx, 1); render(); return; }
    if(ds.openSkip) { ui.skipModalFor = ds.openSkip; render(); return; }
    if(ds.confirmSkip) { ui.skips[ds.confirmSkip] = {reason: ds.reason}; ui.skipModalFor = null; render(); return; }
    if(ds.undoSkip) { delete ui.skips[ds.undoSkip]; render(); return; }
    if(ds.saveSlotDefault) { handleAction("save-slot-default", ds); return; }
  }

  if(ds.delEx) { if(confirm("Delete custom exercise?")) { state.exercises = state.exercises.filter(x=>x.id!==ds.delEx); saveState(state); render(); } return; }
  if(ds.delDay) { if(confirm("Delete workout?")) { state.days = state.days.filter(x=>x.id!==ds.delDay); state.slots=state.slots.filter(s=>s.dayId!==ds.delDay); saveState(state); render(); } return; }
});

document.addEventListener("input", e => {
  const ds = e.target.dataset;
  const ui = window.__workoutUI;
  if(ds.set && ui) {
    ui.setDrafts[ds.set].sets[ds.idx][ds.field] = e.target.value;
  }
});


function handleAction(action, data){
  if(action==="add-custom-ex"){
    const name=document.getElementById("custName").value; 
    const muscles=Array.from(document.querySelectorAll('input[name="custMuscle"]:checked')).map(c=>c.value);
    if(name&&muscles.length){ state.exercises.push({id:uid("ex"),name,muscles,custom:true}); saveState(state); render(); }
  }
  if(action==="save-slot-default"){
    const slot=state.slots.find(s=>s.id===data.slotid); const draft=window.__workoutUI.setDrafts[data.slotid];
    if(confirm("Save this weight/rep/set count as the new default?")){
      slot.suggestedLoad=Number(draft.sets[0].weight); slot.repTarget=Number(draft.sets[0].reps); slot.sets=draft.sets.length;
      saveState(state); setStatus("Default Saved."); render();
    }
  }
  if(action==="start-session"){ const ui=window.__workoutUI; ui.started=true; ui.startedAt=Date.now(); render(); }
  
  if(action==="toggle-add-ex"){ const ui=window.__workoutUI; ui.__showAdd=!ui.__showAdd; render(); }
  if(action==="confirm-add-ex"){
    const dayId = (route.name==="workoutLast") ? lastWorkedDayId() : route.params.dayId;
    const exId = document.getElementById("addExId").value;
    const sets = Number(document.getElementById("addSets").value) || 3;
    const rir = Number(document.getElementById("addRir").value) || 2;
    const existing = state.slots.filter(s=>s.dayId===dayId);
    const order = existing.length ? Math.max(...existing.map(s=>s.order))+1 : 0;
    
    state.slots.push({id:uid("slot"), dayId, order, exId, sets, repMin:8, repMax:12, targetRir:rir, repTarget:8, suggestedLoad:0});
    saveState(state);
    window.__workoutUI.__showAdd = false;
    render();
  }

  if(action==="finish-adjust"){
    const ui=window.__workoutUI; const dayId=route.params.dayId; const logs=[];
    Object.keys(ui.setDrafts).forEach(sid=>{
      if(ui.skips[sid]) return;
      ui.setDrafts[sid].sets.forEach((s,i)=>{ if(s.done) logs.push({slotId:sid,setIndex:i+1,weight:Number(s.weight),reps:Number(s.reps),achievedRir:Number(s.rir)}); });
    });
    state.sessions.push({id:uid("sess"),date:nowISODate(),dayId,logs});
    const updated = slotsForDay(dayId).map(s=>nextSlotFromLogs(s, logs.filter(l=>l.slotId===s.id), false, state.settings));
    const map=new Map(updated.map(s=>[s.id,s])); state.slots=state.slots.map(s=>map.get(s.id)||s);
    saveState(state); makeAutoBackup("auto"); window.__workoutUI=null; navigate("home");
  }
  
  if(action==="open-skip-session"){ window.__workoutUI.showSkipSessionModal = true; render(); }
  if(action==="close-skip-session"){ window.__workoutUI.showSkipSessionModal = false; render(); }
  if(action==="do-skip-session"){
    const ui=window.__workoutUI;
    state.sessions.push({id:uid("sess"), date:nowISODate(), dayId:route.params.dayId, skipped:true, skipReason:data.reason});
    saveState(state); makeAutoBackup("auto"); window.__workoutUI=null; navigate("home");
  }

  if(action==="export-csv"){ exportHistoryCSV(); }
  if(action==="export-json"){ const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`blacksmith-backup-${nowISODate()}.json`; a.click(); }
  if(action==="toggle-add-day"){ window.__settingsUI=(window.__settingsUI||{}); window.__settingsUI.addDayOpen=!window.__settingsUI.addDayOpen; render(); }
  if(action==="confirm-add-day"){ const name=document.getElementById("newDayName").value; if(name) { state.days.push({id:uid("d"),name,index:state.days.length}); saveState(state); render(); } }
  if(action==="reset-all"){ if(confirm("Wipe all data?")) { state=seedState(); saveState(state); navigate("home"); } }
}

// --- BOOT ---
(async function boot(){
  try{ if("serviceWorker" in navigator){ await navigator.serviceWorker.register("./sw.js"); } }catch{}
  navigate("home");
  setInterval(() => {
    const ui = window.__workoutUI;
    if (ui?.startedAt) {
      const elapsed = Math.floor((Date.now() - ui.startedAt) / 1000);
      const el = document.getElementById("sessionTimer");
      if (el) el.textContent = `${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,"0")}`;
    }
  }, 1000);
})();
