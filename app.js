// BUILD: Blacksmith-v5.1-FULL-LIB
window.__BUILD_ID="v5.1";

// --- UTILS ---
function escapeHtml(str){ return String(str||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function uid(prefix="id") { return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function roundToIncrement(value, inc) { const rounded = Math.round(value / inc) * inc; return Math.round(rounded * 100) / 100; }
function fmt(n) { const x = Number(n); if (Number.isNaN(x)) return ""; return (Math.round(x * 100) / 100).toString(); }
function nowISODate(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function setStatus(msg){ const el=document.getElementById("status"); if(el) el.textContent = msg; }

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
  
  // CHEST
  add("ex_bb_bench","Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_bb_incline_bench","Incline Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_bb_decline_bench","Decline Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_db_bench","Bench Press (Dumbbell)",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_db_incline_press","Incline Dumbbell Press",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_machine_chest_press","Chest Press (Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_machine_incline_press","Incline Press (Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_db_fly","Dumbbell Fly",["CHEST"],false,"dumbbell");
  add("ex_cable_fly","Cable Fly",["CHEST"],false,"cable");
  add("ex_pec_deck","Pec Deck",["CHEST"],false,"machine");
  add("ex_pushup","Push-up",["CHEST","TRICEPS","DELTS"],true,"bodyweight");
  add("ex_dips","Dips (Assisted/Bodyweight)",["CHEST","TRICEPS"],true,"bodyweight");

  // BACK
  add("ex_pullup","Pull-up",["BACK","BICEPS"],true,"bodyweight");
  add("ex_chinup","Chin-up",["BACK","BICEPS"],true,"bodyweight");
  add("ex_lat_pulldown","Lat Pulldown",["BACK","BICEPS"],true,"cable");
  add("ex_neutral_pulldown","Pulldown (Neutral Grip)",["BACK","BICEPS"],true,"cable");
  add("ex_bb_row","Bent-Over Row (Barbell)",["BACK","BICEPS","TRAPS"],true,"barbell");
  add("ex_db_row","One-Arm Row (Dumbbell)",["BACK","BICEPS"],true,"dumbbell");
  add("ex_cable_row","Seated Cable Row",["BACK","BICEPS"],true,"cable");
  add("ex_machine_row","Row (Machine)",["BACK","BICEPS"],true,"machine");
  add("ex_tbar_row","T-Bar Row",["BACK","BICEPS","TRAPS"],true,"machine");
  add("ex_facepull","Face Pull",["DELTS","TRAPS","BACK"],false,"cable");
  add("ex_shrug_db","Shrug (DB)",["TRAPS"],false,"dumbbell");

  // SHOULDERS
  add("ex_ohp_bb","Overhead Press (Barbell)",["DELTS","TRICEPS"],true,"barbell");
  add("ex_ohp_db","Overhead Press (Dumbbell)",["DELTS","TRICEPS"],true,"dumbbell");
  add("ex_machine_shoulder_press","Shoulder Press (Machine)",["DELTS","TRICEPS"],true,"machine");
  add("ex_lateral_raise","Lateral Raise (Dumbbell)",["DELTS"],false,"dumbbell");
  add("ex_cable_lateral","Cable Lateral Raise",["DELTS"],false,"cable");
  add("ex_rear_delt_fly","Rear Delt Fly (Machine)",["DELTS"],false,"machine");
  add("ex_rear_delt_db","Rear Delt Fly (Dumbbell)",["DELTS"],false,"dumbbell");

  // ARMS
  add("ex_pressdown","Triceps Pressdown",["TRICEPS"],false,"cable");
  add("ex_oh_tri","Overhead Triceps Ext (Cable)",["TRICEPS"],false,"cable");
  add("ex_skullcrusher","Skullcrusher",["TRICEPS"],false,"barbell");
  add("ex_close_grip_bench","Close-Grip Bench Press",["TRICEPS","CHEST"],true,"barbell");
  add("ex_ez_curl","EZ-Bar Curl",["BICEPS"],false,"barbell");
  add("ex_db_curl","Dumbbell Curl",["BICEPS"],false,"dumbbell");
  add("ex_hammer_curl","Hammer Curl",["BICEPS","FOREARMS"],false,"dumbbell");
  add("ex_cable_curl","Cable Curl",["BICEPS"],false,"cable");
  add("ex_preacher_curl","Preacher Curl",["BICEPS"],false,"machine");

  // LEGS
  add("ex_back_squat","Back Squat (Barbell)",["QUADS","GLUTES"],true,"barbell");
  add("ex_front_squat","Front Squat (Barbell)",["QUADS","GLUTES"],true,"barbell");
  add("ex_hack_squat","Hack Squat",["QUADS","GLUTES"],true,"machine");
  add("ex_leg_press","Leg Press",["QUADS","GLUTES"],true,"machine");
  add("ex_split_squat","Split Squat",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_lunge","Walking Lunge",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_leg_ext","Leg Extension",["QUADS"],false,"machine");
  add("ex_rdl","Romanian Deadlift (BB)",["HAMSTRINGS","GLUTES"],true,"barbell");
  add("ex_deadlift","Deadlift (Conventional)",["HAMSTRINGS","GLUTES","BACK"],true,"barbell");
  add("ex_leg_curl_seated","Leg Curl (Seated)",["HAMSTRINGS"],false,"machine");
  add("ex_leg_curl_lying","Leg Curl (Lying)",["HAMSTRINGS"],false,"machine");
  add("ex_calf_standing","Calf Raise (Standing)",["CALVES"],false,"machine");
  add("ex_calf_seated","Calf Raise (Seated)",["CALVES"],false,"machine");

  // ABS
  add("ex_cable_crunch","Cable Crunch",["ABS"],false,"cable");
  add("ex_hanging_knee","Hanging Knee Raise",["ABS"],false,"bodyweight");
  add("ex_plank","Plank",["ABS","CORE"],true,"bodyweight");
  add("ex_ab_wheel","Ab Wheel",["ABS","CORE"],true,"bodyweight");

  return E;
}

function seedState(){
  const exercises = seedExercises();
  const days=[
    {id:"day_upper_a",name:"Upper A",index:0},
    {id:"day_lower_a",name:"Lower A",index:1}
  ];
  const slot=(dayId,order,exId,sets,repMin,repMax,targetRir,suggestedLoad)=>({id:uid("slot"),dayId,order,exId,sets,repMin,repMax,targetRir,repTarget:repMin,suggestedLoad});
  const slots=[
    slot("day_upper_a",0,"ex_db_incline_press",3,8,12,2,50),
    slot("day_upper_a",1,"ex_lat_pulldown",3,10,15,2,120),
    slot("day_upper_a",2,"ex_lateral_raise",3,12,20,2,20),
    slot("day_upper_a",3,"ex_pressdown",3,10,15,2,40),
    slot("day_lower_a",0,"ex_leg_press",4,8,12,2,200),
    slot("day_lower_a",1,"ex_leg_ext",3,12,20,2,100),
    slot("day_lower_a",2,"ex_leg_curl_seated",3,10,15,2,80)
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
  return html`<div class="exerciseCard" style="margin-bottom:12px; border:${isSkipped?'1px solid var(--warn)':'1px solid var(--line)'}">
    <div class="spread exHeader">
      <div><b>${escapeHtml(ex.name)}</b> ${isSkipped?'(SKIPPED)':''}</div>
      <div class="row"><span class="badge">${slot.sets}×${slot.repTarget}</span><span class="badge accent">Rec: ${fmt(slot.suggestedLoad)}</span></div>
    </div>
    <div class="exBody">
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
  const ui=window.__workoutUI||(window.__workoutUI={readiness:{sleep:3,energy:3,soreness:3,stress:3},started:false,setDrafts:{},warmups:{},skips:{}});
  
  slots.forEach(s=>{ 
    if(!ui.setDrafts[s.id]) {
      ui.setDrafts[s.id]={sets:Array.from({length:s.sets}).map(()=>({weight:s.suggestedLoad,reps:s.repTarget,rir:s.targetRir,done:false}))}; 
    }
  });

  const timerStr = ui.startedAt ? "Running" : "—";
  return html`<div class="spread"><div><div class="h1">${day?day.name:"Workout"}</div><div class="pill">Time <b id="sessionTimer">${timerStr}</b></div></div><button class="btn" data-action="start-session">${ui.started?'Started':'Start Session'}</button></div>
  <div class="grid two"><div class="card"><label>Energy Level</label><input type="range" min="1" max="5" value="${ui.readiness.energy}" oninput="window.__workoutUI.readiness.energy=Number(this.value)"></div><div class="card"><button class="btn" data-action="finish-adjust">Finish & Adjust</button><button class="btn warn" data-action="open-skip-session">Skip Session</button></div></div>
  <div class="card">${slots.map(s=>exerciseCard(s,ui)).join("")}</div>
  ${ui.showSkipSessionModal ? `<div class="modal"><div class="h2">Skip Session Reason</div>${SKIP_REASONS.map(r=>`<button class="btn secondary" data-action="do-skip-session" data-reason="${r}">${r}</button>`).join("")}<button class="btn" data-action="close-skip-session" style="margin-top:10px">Cancel</button></div>`:""}`;
}

// --- RENDER & ROUTER ---
function render(){
  const r = route.name;
  let v = viewHome();
  if(r==="workout") v = viewWorkout(route.params.dayId);
  else if(r==="library") v = viewLibrary();
  else if(r==="progress") v = viewProgress();
  else if(r==="settings") v = viewSettings();
  $app.innerHTML = v;

  // Active state & Click Bindings
  document.querySelectorAll(".bnavbtn").forEach(b => {
    b.classList.toggle("active", b.dataset.nav === r || (b.dataset.nav === "workoutLast" && r === "workout"));
    // FORCE CLICK (Bottom bar fix)
    b.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const n = b.dataset.nav;
      if(n === "workoutLast") navigate("workoutLast");
      else navigate(n);
    };
  });
}

function navigate(name,params={}){ route={name,params}; render(); }
function lastWorkedDayId(){ const s=[...state.sessions].sort((a,b)=>b.startedAt-a.startedAt)[0]; return s?.dayId||state.days[0]?.id; }

// --- GLOBAL EVENT DELEGATION ---
document.addEventListener("click", e => {
  const btn = e.target.closest("button");
  if(!btn) return;
  const ds = btn.dataset;

  // 1. Navigation (Top nav only, bottom is handled in render)
  if(ds.navto) { e.preventDefault(); if(ds.navto==="workoutLast") navigate("workoutLast"); else navigate(ds.navto); return; }
  if(ds.start) { e.preventDefault(); navigate("workout", {dayId: ds.start}); return; }
  if(ds.editDay) { e.preventDefault(); navigate("workout", {dayId: ds.editDay}); return; }
  
  // 2. Actions
  if(ds.action) { e.preventDefault(); handleAction(ds.action, ds); return; }

  // 3. Workout Logic
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

  // 4. Deletion
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
