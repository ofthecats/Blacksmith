// BUILD: v4l-FIXED-EVENTS
window.__BUILD_ID="v4l-FIXED-EVENTS";

function escapeHtml(str){
  return String(str||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

// Hypertrophy Coach PWA (v4)
const $app = document.getElementById("app");
const $status = document.getElementById("status");
const KEY = "hc_v4_state";
const BACKUP_KEY = "hc_v4_backups";
function uid(prefix="id") { return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function roundToIncrement(value, inc) { const rounded = Math.round(value / inc) * inc; return Math.round(rounded * 100) / 100; }
function fmt(n) { const x = Number(n); if (Number.isNaN(x)) return ""; return (Math.round(x * 100) / 100).toString(); }
function nowISODate(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function setStatus(msg){ if($status) $status.textContent = msg; }
function loadState(){ const raw=localStorage.getItem(KEY); if(!raw) return null; try{return JSON.parse(raw);}catch{return null;} }
function saveState(s){ localStorage.setItem(KEY, JSON.stringify(s)); }


function loadBackups(){
  const raw = localStorage.getItem(BACKUP_KEY);
  if(!raw) return { meta:{}, items:[] };
  try{ return JSON.parse(raw); }catch{ return { meta:{}, items:[] }; }
}
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
    const snap = {
      id: "bk_" + uid("b"),
      at: now,
      date: nowISODate(),
      reason,
      size: payload.length,
      data: payload
    };
    b.items = [snap, ...(b.items||[])].slice(0, keep);
    b.meta = { lastAt: now };
    saveBackups(b);
    return true;
  }catch{ return false; }
}
function downloadText(filename, text, mime="application/json"){
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function fmtDT(ms){
  const d = new Date(ms);
  return d.toLocaleString();
}

function pct(n){ return Math.round(n*100); }
function recommendWarmups(ex, workWeight){
  const w = Number(workWeight);
  if(!Number.isFinite(w) || w <= 0) return [];
  const compound = !!ex?.compound;
  // Simple ramp warm-ups to prep without fatigue.
  const steps = compound
    ? [{p:.40,reps:8},{p:.60,reps:5},{p:.75,reps:3},{p:.85,reps:1}]
    : [{p:.50,reps:10},{p:.70,reps:6},{p:.85,reps:3}];
  const inc = Number(state?.settings?.loadIncrement || 2.5);
  return steps.map((s,i)=>{
    const weight = roundToIncrement(w*s.p, inc);
    return { id: "wu_"+uid("w"), idx:i+1, pct:pct(s.p), weight, reps:s.reps, done:false, rir: 6 };
  });
}


const MUSCLES = ["CHEST","BACK","DELTS","BICEPS","TRICEPS","QUADS","HAMSTRINGS","GLUTES","CALVES","ABS","TRAPS","FOREARMS","CORE"];

function seedExercises(){
  const E=[];
  const add=(id,name,muscles,compound,equipment,custom=false)=>E.push({id,name,muscles,compound,equipment,custom});
  // CHEST
  add("ex_bb_bench","Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_bb_incline_bench","Incline Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_bb_decline_bench","Decline Bench Press (Barbell)",["CHEST","TRICEPS","DELTS"],true,"barbell");
  add("ex_db_bench","Bench Press (Dumbbell)",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_db_incline_press","Incline Dumbbell Press",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_db_decline_press","Decline Dumbbell Press",["CHEST","TRICEPS","DELTS"],true,"dumbbell");
  add("ex_machine_chest_press","Chest Press (Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_machine_incline_press","Incline Press (Machine)",["CHEST","TRICEPS"],true,"machine");
  add("ex_db_fly","Dumbbell Fly",["CHEST"],false,"dumbbell");
  add("ex_cable_fly","Cable Fly",["CHEST"],false,"cable");
  add("ex_low_to_high_fly","Cable Fly (Low-to-High)",["CHEST"],false,"cable");
  add("ex_pec_deck","Pec Deck",["CHEST"],false,"machine");
  add("ex_pushup","Push-up",["CHEST","TRICEPS","DELTS"],true,"bodyweight");
  add("ex_dips","Dips (Assisted/Bodyweight)",["CHEST","TRICEPS"],true,"bodyweight");
  // BACK
  add("ex_pullup","Pull-up (Assisted/Bodyweight)",["BACK","BICEPS"],true,"bodyweight");
  add("ex_chinup","Chin-up (Assisted/Bodyweight)",["BACK","BICEPS"],true,"bodyweight");
  add("ex_lat_pulldown","Lat Pulldown",["BACK","BICEPS"],true,"cable");
  add("ex_neutral_pulldown","Pulldown (Neutral Grip)",["BACK","BICEPS"],true,"cable");
  add("ex_pullover_cable","Straight-Arm Pulldown",["BACK"],false,"cable");
  add("ex_bb_row","Bent-Over Row (Barbell)",["BACK","BICEPS","TRAPS"],true,"barbell");
  add("ex_pendlay_row","Pendlay Row (Barbell)",["BACK","BICEPS","TRAPS"],true,"barbell");
  add("ex_db_row","One-Arm Row (Dumbbell)",["BACK","BICEPS"],true,"dumbbell");
  add("ex_cs_row","Chest-Supported Row",["BACK","BICEPS"],true,"machine");
  add("ex_cable_row","Seated Cable Row",["BACK","BICEPS"],true,"cable");
  add("ex_tbar_row","T-Bar Row",["BACK","BICEPS","TRAPS"],true,"machine");
  add("ex_machine_row","Row (Machine)",["BACK","BICEPS"],true,"machine");
  add("ex_back_extension","Back Extension",["BACK","GLUTES","HAMSTRINGS"],true,"machine");
  add("ex_facepull","Face Pull",["DELTS","TRAPS","BACK"],false,"cable");
  add("ex_reverse_fly_cable","Reverse Fly (Cable)",["DELTS","BACK"],false,"cable");
  // SHOULDERS
  add("ex_ohp_bb","Overhead Press (Barbell)",["DELTS","TRICEPS"],true,"barbell");
  add("ex_ohp_db","Overhead Press (Dumbbell)",["DELTS","TRICEPS"],true,"dumbbell");
  add("ex_arnold","Arnold Press",["DELTS","TRICEPS"],true,"dumbbell");
  add("ex_machine_shoulder_press","Shoulder Press (Machine)",["DELTS","TRICEPS"],true,"machine");
  add("ex_lateral_raise","Lateral Raise (Dumbbell)",["DELTS"],false,"dumbbell");
  add("ex_cable_lateral","Cable Lateral Raise",["DELTS"],false,"cable");
  add("ex_machine_lateral","Lateral Raise (Machine)",["DELTS"],false,"machine");
  add("ex_rear_delt_fly","Rear Delt Fly (Machine)",["DELTS"],false,"machine");
  add("ex_rear_delt_db","Rear Delt Fly (Dumbbell)",["DELTS"],false,"dumbbell");
  add("ex_upright_row","Upright Row (Cable/Bar)",["DELTS","TRAPS"],true,"cable");
  // TRICEPS
  add("ex_pressdown","Triceps Pressdown",["TRICEPS"],false,"cable");
  add("ex_oh_tri","Overhead Triceps Extension (Cable)",["TRICEPS"],false,"cable");
  add("ex_db_oh_tri","Overhead Triceps Extension (DB)",["TRICEPS"],false,"dumbbell");
  add("ex_skullcrusher","Skullcrusher (EZ/BB)",["TRICEPS"],false,"barbell");
  add("ex_close_grip_bench","Close-Grip Bench Press",["TRICEPS","CHEST"],true,"barbell");
  add("ex_diamond_pushup","Diamond Push-up",["TRICEPS","CHEST"],true,"bodyweight");
  // BICEPS/FOREARMS
  add("ex_ez_curl","EZ-Bar Curl",["BICEPS"],false,"barbell");
  add("ex_bb_curl","Barbell Curl",["BICEPS"],false,"barbell");
  add("ex_db_curl","Dumbbell Curl",["BICEPS"],false,"dumbbell");
  add("ex_incline_db_curl","Incline Dumbbell Curl",["BICEPS"],false,"dumbbell");
  add("ex_hammer_curl","Hammer Curl",["BICEPS","FOREARMS"],false,"dumbbell");
  add("ex_preacher_curl","Preacher Curl (Machine/Bench)",["BICEPS"],false,"machine");
  add("ex_cable_curl","Cable Curl",["BICEPS"],false,"cable");
  add("ex_reverse_curl","Reverse Curl",["FOREARMS","BICEPS"],false,"barbell");
  add("ex_wrist_curl","Wrist Curl",["FOREARMS"],false,"dumbbell");
  add("ex_wrist_ext","Wrist Extension",["FOREARMS"],false,"dumbbell");
  // QUADS/GLUTES
  add("ex_back_squat","Back Squat (Barbell)",["QUADS","GLUTES"],true,"barbell");
  add("ex_front_squat","Front Squat (Barbell)",["QUADS","GLUTES"],true,"barbell");
  add("ex_box_squat","Box Squat",["QUADS","GLUTES"],true,"barbell");
  add("ex_hack_squat","Hack Squat (Machine)",["QUADS","GLUTES"],true,"machine");
  add("ex_leg_press","Leg Press",["QUADS","GLUTES"],true,"machine");
  add("ex_split_squat","Split Squat",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_lunge","Walking Lunge",["QUADS","GLUTES"],true,"dumbbell");
  add("ex_leg_ext","Leg Extension",["QUADS"],false,"machine");
  add("ex_sissy","Sissy Squat (Bodyweight)",["QUADS"],false,"bodyweight");
  add("ex_stepup","Step-up",["QUADS","GLUTES"],true,"dumbbell");
  // HAMSTRINGS/POSTERIOR
  add("ex_rdl","Romanian Deadlift (BB)",["HAMSTRINGS","GLUTES"],true,"barbell");
  add("ex_db_rdl","Romanian Deadlift (DB)",["HAMSTRINGS","GLUTES"],true,"dumbbell");
  add("ex_deadlift","Deadlift (Barbell)",["HAMSTRINGS","GLUTES","BACK","TRAPS"],true,"barbell");
  add("ex_sumo_deadlift","Deadlift (Sumo)",["HAMSTRINGS","GLUTES","BACK","TRAPS"],true,"barbell");
  add("ex_goodmorning","Good Morning (Barbell)",["HAMSTRINGS","GLUTES","BACK"],true,"barbell");
  add("ex_hip_thrust","Hip Thrust (BB/Machine)",["GLUTES","HAMSTRINGS"],true,"barbell");
  add("ex_glute_bridge","Glute Bridge (BB)",["GLUTES","HAMSTRINGS"],true,"barbell");
  add("ex_leg_curl_seated","Leg Curl (Seated)",["HAMSTRINGS"],false,"machine");
  add("ex_leg_curl_lying","Leg Curl (Lying)",["HAMSTRINGS"],false,"machine");
  add("ex_ghr","Glute-Ham Raise",["HAMSTRINGS","GLUTES"],true,"bodyweight");
  add("ex_cable_kickback","Glute Kickback (Cable)",["GLUTES"],false,"cable");
  add("ex_hip_abduction","Hip Abduction (Machine)",["GLUTES"],false,"machine");
  // CALVES
  add("ex_calf_standing","Calf Raise (Standing)",["CALVES"],false,"machine");
  add("ex_calf_seated","Calf Raise (Seated)",["CALVES"],false,"machine");
  add("ex_db_calf","Calf Raise (DB)",["CALVES"],false,"dumbbell");
  // ABS/CORE
  add("ex_cable_crunch","Cable Crunch",["ABS"],false,"cable");
  add("ex_hanging_knee","Hanging Knee Raise",["ABS"],false,"bodyweight");
  add("ex_ab_wheel","Ab Wheel Rollout",["ABS","CORE"],true,"bodyweight");
  add("ex_plank","Plank",["ABS","CORE"],true,"bodyweight");
  add("ex_side_plank","Side Plank",["CORE"],true,"bodyweight");
  // TRAPS/CARRIES
  add("ex_shrug_db","Shrug (DB)",["TRAPS"],false,"dumbbell");
  add("ex_shrug_bb","Shrug (BB)",["TRAPS"],false,"barbell");
  add("ex_farmer","Farmer Carry",["TRAPS","FOREARMS","CORE"],true,"dumbbell");
  return E;
}

function seedState(){
  const exercises = seedExercises();
  const days=[
    {id:"day_upper_a",name:"Upper A",index:0},
    {id:"day_lower_a",name:"Lower A",index:1},
    {id:"day_upper_b",name:"Upper B",index:2},
    {id:"day_lower_b",name:"Lower B",index:3},
  ];
  const slot=(dayId,order,exId,sets,repMin,repMax,targetRir,suggestedLoad)=>({id:uid("slot"),dayId,order,exId,sets,repMin,repMax,targetRir,repTarget:repMin,suggestedLoad});
  const slots=[
    slot("day_upper_a",0,"ex_db_incline_press",3,8,12,2,50),
    slot("day_upper_a",1,"ex_cable_fly",3,12,20,2,30),
    slot("day_upper_a",2,"ex_lateral_raise",3,12,20,2,15),
    slot("day_upper_a",3,"ex_pressdown",3,10,15,2,35),
    slot("day_upper_a",4,"ex_cs_row",2,8,12,2,60),
    slot("day_lower_a",0,"ex_leg_press",4,8,12,2,180),
    slot("day_lower_a",1,"ex_leg_ext",3,12,20,2,80),
    slot("day_lower_a",2,"ex_leg_curl_seated",3,10,15,2,70),
    slot("day_lower_a",3,"ex_calf_standing",4,10,15,2,90),
    slot("day_lower_a",4,"ex_cable_crunch",3,12,20,2,60),
    slot("day_upper_b",0,"ex_cs_row",3,8,12,2,60),
    slot("day_upper_b",1,"ex_lat_pulldown",3,8,12,2,120),
    slot("day_upper_b",2,"ex_rear_delt_fly",3,12,20,2,25),
    slot("day_upper_b",3,"ex_ez_curl",3,10,15,2,55),
    slot("day_upper_b",4,"ex_oh_tri",3,10,15,2,45),
    slot("day_lower_b",0,"ex_rdl",3,8,12,2,135),
    slot("day_lower_b",1,"ex_leg_curl_lying",3,10,15,2,70),
    slot("day_lower_b",2,"ex_split_squat",3,8,12,2,80),
    slot("day_lower_b",3,"ex_calf_seated",4,10,15,2,90),
    slot("day_lower_b",4,"ex_cable_crunch",3,12,20,2,60),
  ];
  return { meta:{version:4,createdAt:Date.now()}, settings:{daysPerWeek:4,loadIncrement:2.5,autoFillFromSuggestion:true,backupFreqHours:24,backupKeep:14}, exercises, days, slots, sessions:[] };
}

function readinessScore({sleep,energy,soreness,stress}){ return (sleep+energy+(6-soreness)+(6-stress))/4; }
function isIsolation(slot){ return slot.repMax>=15; }
function nextSlotFromLogs(slot,logs,lowReadiness,settings){
  if(!logs||logs.length===0) return slot;
  const avgRir=logs.reduce((s,x)=>s+Number(x.achievedRir||0),0)/logs.length;
  const allSetsCompleted=logs.length>0;
  const adjustedSets=(lowReadiness&&isIsolation(slot))?clamp(slot.sets-1,2,20):slot.sets;
  const inc=settings.loadIncrement||2.5;
  if(!allSetsCompleted||avgRir<slot.targetRir-0.5){
    return {...slot,sets:adjustedSets,suggestedLoad:roundToIncrement(Math.max(0,slot.suggestedLoad*0.95),inc)};
  }
  if(avgRir>slot.targetRir+0.5){
    const nextRep=clamp(slot.repTarget+1,slot.repMin,slot.repMax);
    if(nextRep<slot.repMax) return {...slot,sets:adjustedSets,repTarget:nextRep};
    return {...slot,sets:adjustedSets,suggestedLoad:roundToIncrement(Math.max(0,slot.suggestedLoad*1.03),inc),repTarget:slot.repMin};
  }
  return {...slot,sets:adjustedSets,repTarget:clamp(slot.repTarget+1,slot.repMin,slot.repMax)};
}

let state = loadState() || seedState(); saveState(state);
let route = {name:"home",params:{}};
function lastWorkedDayId(){ const s=[...state.sessions].sort((a,b)=>b.startedAt-a.startedAt)[0]; const fallback=state.days.sort((a,b)=>a.index-b.index)[0]?.id; return s?.dayId||fallback; }
function navigate(name,params={}){ route={name,params}; render(); }
function exById(id){ return state.exercises.find(e=>e.id===id); }
function dayById(id){ return state.days.find(d=>d.id===id); }
function slotsForDay(dayId){ return state.slots.filter(s=>s.dayId===dayId).sort((a,b)=>a.order-b.order); }
function html(strings,...vals){ return strings.map((s,i)=>s+(vals[i]??"")).join(""); }

function viewHome(){
  const today=nowISODate();
  return html`<div class="h1">Today</div>
  <div class="grid two">
    <div class="card">
      <div class="h2">Pick a workout template</div>
      <p class="p">Add/remove workouts in <b>Settings → Program builder</b>.</p>
      <div class="row">${state.days.sort((a,b)=>a.index-b.index).map(d=>html`<button class="btn" data-start="${d.id}">${escapeHtml(d.name)}</button>`).join("")}</div>
      <hr/>
      <div class="row">
        <span class="badge">Date: ${today}</span>
        <span class="badge">Days/week: ${state.settings.daysPerWeek}</span>
        <span class="badge">Load inc: ${state.settings.loadIncrement}</span>
        <span class="badge accent">Offline: yes</span>
      </div>
    </div>
    <div class="card">
      <div class="h2">Quick controls</div>
      <div class="row">
        <button class="btn secondary" data-navto="workoutLast">Resume last</button>
        <button class="btn secondary" data-navto="library">Exercise library</button>
        <button class="btn secondary" data-navto="settings">Settings</button>
      </div>
      <hr/>
      <p class="p"><b>Tip:</b> Add custom exercises in Library. Export/import in Settings.</p>
    </div>
  </div>`;
}

function viewLibrary(){
  const q=window.__lib_q??"";
  const filterMuscle=window.__lib_m??"ALL";
  const filterEquip=window.__lib_e??"ALL";
  const equipOptions=["ALL","barbell","dumbbell","machine","cable","bodyweight","other","unknown"];
  const list=state.exercises
    .filter(e=>filterMuscle==="ALL"?true:(e.muscles||[]).includes(filterMuscle))
    .filter(e=>filterEquip==="ALL"?true:((e.equipment||"unknown")===filterEquip))
    .filter(e=>e.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>a.name.localeCompare(b.name));
  return html`
  <div class="spread">
    <div><div class="h1">Library</div><div class="p">Search + filter. Add custom exercises.</div></div>
    <div class="row"><button class="btn secondary" data-navto="home">Back</button></div>
  </div>
  <div class="grid two">
    <div class="card">
      <div class="h2">Filters</div>
      <label for="libSearch">Search</label>
      <input class="input" id="libSearch" placeholder="e.g., bench, pulldown, curl" value="${q}"/>
      <div class="kv" style="margin-top:10px">
        <div>
          <label for="libMuscle">Muscle</label>
          <select class="select" id="libMuscle">
            <option value="ALL" ${filterMuscle==="ALL"?"selected":""}>All</option>
            ${MUSCLES.map(m=>`<option value="${m}" ${filterMuscle===m?"selected":""}>${m}</option>`).join("")}
          </select>
        </div>
        <div>
          <label for="libEquip">Equipment</label>
          <select class="select" id="libEquip">
            ${equipOptions.map(e=>`<option value="${e}" ${filterEquip===e?"selected":""}>${e}</option>`).join("")}
          </select>
        </div>
      </div>
      <hr/>
      <div class="h2">Add custom exercise</div>
      <label for="custName">Name</label>
      <input class="input" id="custName" placeholder="e.g., Machine Chest Press" />
      <div class="kv" style="margin-top:10px">
        <div><label for="custMuscle">Primary muscle</label>
          <select class="select" id="custMuscle">${MUSCLES.map(m=>`<option value="${m}">${m}</option>`).join("")}</select>
        </div>
        <div><label for="custEquip">Equipment</label>
          <select class="select" id="custEquip">${equipOptions.filter(x=>x!=="ALL").map(e=>`<option value="${e}">${e}</option>`).join("")}</select>
        </div>
      </div>
      <div class="kv" style="margin-top:10px">
        <div><label for="custCompound">Compound?</label>
          <select class="select" id="custCompound"><option value="true">Yes</option><option value="false" selected>No</option></select>
        </div>
        <div><label>&nbsp;</label><button class="btn ok" data-action="add-custom-ex">Add</button></div>
      </div>
      <p class="small">To delete a custom exercise, it must not be used in a workout template.</p>
    </div>

    <div class="card">
      <div class="spread">
        <div><div class="h2">Exercises (${list.length})</div><div class="small">Delete appears only for custom exercises.</div></div>
        <span class="badge">${state.exercises.filter(x=>x.custom).length} custom</span>
      </div>
      <hr/>
      ${list.slice(0,160).map(e=>`
        <div class="spread" style="padding:10px 0; border-top:1px solid var(--line)">
          <div>
            <b>${escapeHtml(e.name)}</b>
            <div class="small">${(e.muscles||[]).join(", ")} • ${(e.equipment||"unknown")} • ${e.compound?"compound":"isolation"} ${e.custom?"• custom":""}</div>
          </div>
          ${e.custom?`<button class="btn danger" data-del-ex="${e.id}">Delete</button>`:""}
        </div>`).join("")}
      ${list.length>160?`<p class="small">Showing first 160—refine search.</p>`:""}
    </div>
  </div>`;
}

function viewProgress(){
  const recent=[...state.sessions].sort((a,b)=>b.startedAt-a.startedAt).slice(0,15);
  return html`<div class="h1">Progress</div>
    <div class="card">
      <div class="h2">Recent sessions</div>
      ${recent.length===0?`<p class="p">No sessions yet.</p>`:`
        <table class="table">
          <thead><tr><th>Date</th><th>Workout</th><th>Readiness</th><th>Sets logged</th></tr></thead>
          <tbody>${recent.map(s=>`
            <tr><td>${s.date}</td><td><b>${dayById(s.dayId)?.name??"(deleted workout)"}</b></td><td>${fmt(s.readinessScore)}</td><td>${(s.logs?.length??0)}</td></tr>`).join("")}</tbody>
        </table>`}
    </div>`;
}




function addWorkoutModal(){
  const ui = window.__workoutUI || {};
  if(!ui.__showAddWorkout) return "";
  return `
  <div class="modalOverlay" data-action="hide-add-workout">
    <div class="modal" data-stopprop="1">
      <div class="h2">New workout</div>
      <p class="small">Create a workout day you can add exercises to.</p>
      <label for="newWorkoutName">Workout name</label>
      <input class="input" id="newWorkoutName" placeholder="e.g. Upper A" value="${escapeHtml(ui.__addWorkoutName||"")}">
      <div class="row" style="margin-top:12px">
        <button class="btn ok" data-action="create-workout">Create</button>
        <button class="btn secondary" data-action="hide-add-workout">Cancel</button>
      </div>
    </div>
  </div>`;
}

function viewSettings(){
  const daysSorted=state.days.sort((a,b)=>a.index-b.index);
  return html`<div class="h1">Settings</div>
  <div class="grid two">
    <div class="card">
      <div class="h2">General</div>
      <label for="daysPerWeek">Days per week</label>
      <select class="select" id="daysPerWeek">${[2,3,4,5,6,7].map(n=>`<option value="${n}" ${n===state.settings.daysPerWeek?"selected":""}>${n}</option>`).join("")}</select>
      <label for="loadIncrement">Load increment</label>
      <select class="select" id="loadIncrement">${[1,2.5,5].map(n=>`<option value="${n}" ${n===state.settings.loadIncrement?"selected":""}>${n}</option>`).join("")}</select>
      <label for="autoFill">Auto-fill from suggestion</label>
      <select class="select" id="autoFill"><option value="true" ${state.settings.autoFillFromSuggestion?"selected":""}>On</option><option value="false" ${!state.settings.autoFillFromSuggestion?"selected":""}>Off</option></select>
      <hr/><button class="btn" data-action="save-settings">Save</button>
    </div>
    <div class="card">
      <div class="h2">Export / Import</div>
      <div class="row">
        <button class="btn secondary" data-action="export-json">Export JSON</button>
        <button class="btn secondary" data-action="copy-json">Copy JSON</button>
      </div>
      <hr/>
      <label for="importFile">Import JSON</label>
      <input class="input" type="file" id="importFile" accept="application/json" />
      <div class="row" style="margin-top:10px">
        <button class="btn ok" data-action="import-json">Import</button>
        <button class="btn danger" data-action="reset-all">Reset all data</button>
      </div>
      <p class="small">Import overwrites local data on this device.</p>
    </div>
  </div>
    <div class="card">
      <div class="h2">Auto backups</div>
      <p class="small">Backups are stored on your device (inside the app). Updating the app won’t wipe them, but clearing site data will.</p>

      <div class="kv">
        <div>
          <label for="backupFreq">Backup frequency (hours)</label>
          <select class="select" id="backupFreq">
            ${[6,12,24,48,72].map(n=>`<option value="${n}" ${n===state.settings.backupFreqHours?"selected":""}>${n}</option>`).join("")}
          </select>
        </div>
        <div>
          <label for="backupKeep">Keep last (count)</label>
          <select class="select" id="backupKeep">
            ${[7,14,30,60].map(n=>`<option value="${n}" ${n===state.settings.backupKeep?"selected":""}>${n}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="row" style="margin-top:10px">
        <button class="btn ok" data-action="backup-now">Backup now</button>
        <button class="btn secondary" data-action="backup-download-latest">Download latest</button>
      </div>

      <hr/>
      ${(() => {
        const b = loadBackups();
        const items = (b.items||[]);
        if(items.length===0) return `<p class="p">No backups yet.</p>`;
        return items.slice(0,10).map(x => `
          <div class="spread" style="padding:10px 0; border-top:1px solid var(--line)">
            <div>
              <b>${x.date}</b>
              <div class="small">${fmtDT(x.at)} • ${x.reason} • ${Math.round((x.size||0)/1024)} KB</div>
            </div>
            <div class="row">
              <button class="btn secondary" data-bk-dl="${x.id}">Download</button>
              <button class="btn danger" data-bk-del="${x.id}">Delete</button>
            </div>
          </div>
        `).join("");
      })()}
    </div>

<div class="card">
    <div class="spread">
      <div><div class="h2">Program builder</div><div class="small">Add/remove workout templates. Open a workout to add/remove exercises.</div></div>
      <button class="btn ok" data-action="toggle-add-day">Add workout</button>
    </div>
    ${(() => {
      const su = window.__settingsUI || (window.__settingsUI = { addDayOpen:false, addDayName:"" });
      if(!su.addDayOpen) return "";
      return `
        <div class="card" style="margin-top:12px">
          <div class="h2">New workout</div>
          <div class="kv">
            <div style="grid-column: 1 / -1">
              <label for="newDayName">Workout name</label>
              <input class="input" id="newDayName" placeholder="e.g., Upper A" value="${escapeHtml(su.addDayName||"")}">
            </div>
          </div>
          <div class="row" style="margin-top:10px">
            <button class="btn ok" data-action="confirm-add-day">Create</button>
            <button class="btn secondary" data-action="toggle-add-day">Cancel</button>
          </div>
        </div>
      `;
    })()}
    <hr/>
    ${daysSorted.map(d=>`
      <div class="spread" style="padding:10px 0; border-top:1px solid var(--line)">
        <div><b>${escapeHtml(d.name)}</b><div class="small">${slotsForDay(d.id).length} exercises</div></div>
        <div class="row">
          <button class="btn secondary" data-edit-day="${d.id}">Open</button>
          <button class="btn danger" data-del-day="${d.id}">Remove</button>
        </div>
      </div>`).join("")}
  </div>`;
}

function slider(label,key,val){
  return html`<div style="margin:10px 0">
    <div class="spread"><label>${label}</label><span class="badge">${val}</span></div>
    <input type="range" min="1" max="5" step="1" value="${val}" data-slider="${key}" style="width:100%">
  </div>`;
}

function ensureDraftForSlot(slot,ui){
  if(!ui.setDrafts[slot.id]){
    ui.setDrafts[slot.id]={sets:Array.from({length:slot.sets}).map(()=>({weight:state.settings.autoFillFromSuggestion?slot.suggestedLoad:"",reps:state.settings.autoFillFromSuggestion?slot.repTarget:"",rir:state.settings.autoFillFromSuggestion?slot.targetRir:"",done:false}))};
  }else{
    const cur=ui.setDrafts[slot.id];
    if(cur.sets.length!==slot.sets){
      const next=Array.from({length:slot.sets}).map((_,i)=>cur.sets[i]||({weight:state.settings.autoFillFromSuggestion?slot.suggestedLoad:"",reps:state.settings.autoFillFromSuggestion?slot.repTarget:"",rir:state.settings.autoFillFromSuggestion?slot.targetRir:"",done:false}));
      ui.setDrafts[slot.id]={...cur,sets:next};
    }
  }
  return ui.setDrafts[slot.id];
}

function setRow(slot,idx,s){
  return html`<div class="setRow">
    <div class="badge">${idx+1}</div>
    <div>
      <label>Weight
        <input class="input" type="number" step="0.5" data-set="${slot.id}" data-field="weight" data-idx="${idx}" value="${s.weight}">
      </label>
    </div>
    <div>
      <label>Reps
        <input class="input" type="number" min="0" max="100" data-set="${slot.id}" data-field="reps" data-idx="${idx}" value="${s.reps}">
      </label>
    </div>
    <div>
      <label>RIR
        <input class="input" type="number" step="0.5" min="0" max="10" data-set="${slot.id}" data-field="rir" data-idx="${idx}" value="${s.rir}">
      </label>
    </div>
    <div><label>&nbsp;</label><button class="btn ${s.done?"ok":"secondary"}" data-markdone="${slot.id}" data-idx="${idx}">${s.done?"Done":"Mark done"}</button></div>
  </div>`;
}

function exerciseCard(slot,ui){
  const ex=exById(slot.exId)||{id:slot.exId,name:"(missing exercise)",muscles:[],equipment:"unknown",compound:false};
  const draft=ensureDraftForSlot(slot,ui);
  const pool=state.exercises.filter(e=>e.id!==ex.id).filter(e=>(e.muscles||[]).some(m=>(ex.muscles||[]).includes(m))).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,80);
  return html`<div class="exerciseCard ${ui.collapsed?.[slot.id]?"collapsed":""}" style="margin-bottom:12px">
    <div class="spread exHeader" data-toggle="${slot.id}">
      <div>
        <div><span class="chev">▾</span><b>${escapeHtml(ex.name)}</b></div>
        <div class="small">${(ex.muscles||[]).join(", ")} • ${(ex.equipment||"unknown")} • ${ex.compound?"compound":"isolation"}</div>
      </div>
      <div class="row">
        <span class="badge">${slot.sets}×${slot.repTarget} (${slot.repMin}-${slot.repMax})</span>
        <span class="badge">Target RIR ${slot.targetRir}</span>
        <span class="badge accent">Suggest ${fmt(slot.suggestedLoad)}</span>
      </div>
    </div>
    <div class="exBody">
      <div style="margin-top:10px" class="kv3">
        <div><label>Swap exercise</label>
          <select class="select" data-swap="${slot.id}">
            <option value="${ex.id}" selected>${ex.name}</option>
            ${pool.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}
          </select>
        </div>
        <div><label>Quick fill</label><button class="btn secondary" data-fill="${slot.id}">Fill all sets</button></div>
        <div><label>Slot</label><button class="btn danger" data-del-slot="${slot.id}">Remove exercise</button></div>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn secondary" data-addset="${slot.id}">Add set</button>
        <button class="btn secondary" data-remset="${slot.id}">Remove last set</button>
        <button class="btn secondary" data-applysets="${slot.id}">Apply set count to template</button>
      </div>
      <div class="chips" style="margin-top:10px">
        <button class="chip" data-quick="${slot.id}" data-q="reps+">Reps +1</button>
        <button class="chip" data-quick="${slot.id}" data-q="reps-">Reps -1</button>
        <button class="chip" data-quick="${slot.id}" data-q="load+">Load +inc</button>
        <button class="chip" data-quick="${slot.id}" data-q="load-">Load -inc</button>
        <button class="chip" data-quick="${slot.id}" data-q="rir+">RIR +0.5</button>
        <button class="chip" data-quick="${slot.id}" data-q="rir-">RIR -0.5</button>
      </div>
      <div style="margin-top:12px">
        <div class="spread" style="margin-bottom:8px">
          <div><b>Recommended warm-up sets</b><div class="small">Ramp up weight without fatigue. Mark as done.</div></div>
          <button class="btn secondary" data-genwu="${slot.id}">Generate</button>
        </div>
        <div id="wu_${slot.id}">${(() => {
          const list = (ui.warmups?.[slot.id]) || [];
          if(!list.length) return `<div class="small">Tap Generate to create warm-ups.</div>`;
          return list.map((w,i)=>`
            <div class="setRow" style="grid-template-columns: 44px 1fr 1fr 1fr 76px;">
              <div class="badge">${w.idx}</div>
              <div>
                <label>Weight
                  <input class="input" type="number" step="0.5" data-wu="${slot.id}" data-field="weight" data-idx="${i}" value="${w.weight}">
                </label>
              </div>
              <div>
                <label>Reps
                  <input class="input" type="number" min="0" max="50" data-wu="${slot.id}" data-field="reps" data-idx="${i}" value="${w.reps}">
                </label>
              </div>
              <div>
                <label>RIR
                  <input class="input" type="number" step="0.5" min="0" max="10" data-wu="${slot.id}" data-field="rir" data-idx="${i}" value="${w.rir ?? 6}">
                </label>
              </div>
              <div><label>&nbsp;</label><button class="btn ${w.done?"ok":"secondary"}" data-wudone="${slot.id}" data-idx="${i}">${w.done?"Done":"Mark"}</button></div>
            </div>
          `).join("");
        })()}</div>
        <hr/>
        <b>Working sets</b>
        <div class="small">Log each set’s RIR.</div>
        ${draft.sets.map((s,idx)=>setRow(slot,idx,s)).join("")}
      </div>
    </div>
  </div>`;
}

function viewWorkout(dayId){
  const day=dayById(dayId)||{id:dayId,name:"(deleted workout)"};
  const slots=slotsForDay(dayId);
  const ui=window.__workoutUI||{readiness:{sleep:3,energy:3,soreness:3,stress:3},started:false,sessionId:null,startedAt:null,collapsed:{},setDrafts:{},warmups:{},__showAdd:false,__showAddWorkout:false,__addWorkoutName:''};
  window.__workoutUI=ui;
  const score=readinessScore(ui.readiness);
  const low=score<2.5;
  for(const slot of slots) ensureDraftForSlot(slot,ui);
  let done=0,total=0;
  for(const slot of slots){ total+=slot.sets; done+=ui.setDrafts[slot.id].sets.filter(x=>x.done).length; }
  const pct=total?Math.round((done/total)*100):0;
  const elapsed=ui.startedAt?Math.max(0,Math.floor((Date.now()-ui.startedAt)/1000)):0;
  const timerStr=ui.started?`${String(Math.floor(elapsed/60)).padStart(2,"0")}:${String(elapsed%60).padStart(2,"0")}`:"—";
  const exOptions=state.exercises.slice().sort((a,b)=>a.name.localeCompare(b.name));
  return html`<div class="spread">
    <div>
      <div class="h1">${escapeHtml(day.name)}</div>
      <div class="row">
        <span class="pill">Readiness <b>${fmt(score)}</b> ${low?`<span class="badge warn">low</span>`:""}</span>
        <span class="pill">Time <b id="sessionTimer">${timerStr}</b></span>
        <span class="pill">Complete <b>${pct}%</b></span>
      </div>
      <div class="meter"><div style="width:${pct}%"></div></div>
    </div>
    <div class="row">
      <button class="btn secondary" data-navto="home">Back</button>
      ${ui.started?`<span class="badge accent">Session started</span>`:`<button class="btn" data-action="start-session">Start session</button>`}
    </div>
  </div>
  <div class="grid two">
    <div class="card">
      <div class="h2">Readiness (1–5)</div>
      ${slider("Sleep","sleep",ui.readiness.sleep)}
      ${slider("Energy","energy",ui.readiness.energy)}
      ${slider("Soreness","soreness",ui.readiness.soreness)}
      ${slider("Stress","stress",ui.readiness.stress)}
      <hr/><p class="small">Low readiness trims isolation sets by ~1.</p>
    </div>
    <div class="card">
      <div class="h2">Session actions</div>
      <div class="stickyActions">
        <div class="row">
          <button class="btn secondary" data-action="clear-session">Clear drafts</button>
          <button class="btn" data-action="finish-adjust">Finish & Adjust</button>
        </div>
      </div>
      <hr/><p class="small">Use chips for quick changes.</p>
    </div>
  </div>
  <div class="card">
    <div class="spread">
      <div><div class="h2">Exercises</div><div class="small">Tap name to collapse/expand. Add/remove slots.</div></div>
      <button class="btn ok" data-action="toggle-add-ex">Add exercise</button>
    </div>
    ${ui.__showAdd?`
      <hr/>
      <div class="exerciseCard">
        <div class="h2">Add exercise to this workout</div>
        <div class="kv3">
          <div><label for="addExId">Exercise</label>
            <select class="select" id="addExId">${exOptions.map(e=>`<option value="${e.id}">${e.name}</option>`).join("")}</select>
          </div>
          <div><label for="addSets">Sets</label><input class="input" id="addSets" type="number" min="1" max="20" value="3"></div>
          <div><label for="addRir">Target RIR</label><input class="input" id="addRir" type="number" step="0.5" min="0" max="10" value="2"></div>
        </div>
        <div class="kv3" style="margin-top:10px">
          <div><label for="addRepMin">Rep min</label><input class="input" id="addRepMin" type="number" min="1" max="50" value="8"></div>
          <div><label for="addRepMax">Rep max</label><input class="input" id="addRepMax" type="number" min="1" max="50" value="12"></div>
          <div><label for="addLoad">Suggested load</label><input class="input" id="addLoad" type="number" step="0.5" min="0" value="0"></div>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn ok" data-action="confirm-add-ex">Add to workout</button>
          <button class="btn secondary" data-action="toggle-add-ex">Cancel</button>
        </div>
      </div>`:""}
    <hr/>
    ${slots.length===0?`<p class="p">No exercises yet. Tap “Add exercise”.</p>`:""}
    ${slots.map(s=>exerciseCard(s,ui)).join("")}
  </div>`;
}

function render(){
  document.querySelectorAll(".bnavbtn").forEach(b=>b.classList.toggle("active", b.dataset.nav===route.name || (b.dataset.nav==="workoutLast" && route.name==="workout")));
  if(route.name==="home") $app.innerHTML=viewHome();
  else if(route.name==="workout") $app.innerHTML=viewWorkout(route.params.dayId);
  else if(route.name==="workoutLast") $app.innerHTML=viewWorkout(lastWorkedDayId());
  else if(route.name==="library") $app.innerHTML=viewLibrary();
  else if(route.name==="progress") $app.innerHTML=viewProgress();
  else if(route.name==="settings") $app.innerHTML=viewSettings();
  else $app.innerHTML=viewHome();
  wire();
}

function wire(){
  // Delegated handlers (more reliable in PWAs on Android)
  if(!window.__delegatedActions){
    window.__delegatedActions=true;
    document.addEventListener("click",(e)=>{
      const a=e.target.closest("[data-action]");
      if(a){
        e.preventDefault();
        e.stopPropagation();
        handleAction(a.dataset.action);
        return;
      }
      const n=e.target.closest("[data-navto]");
      if(n){
        e.preventDefault();
        e.stopPropagation();
        navigate(n.dataset.navto);
        return;
      }
      const s=e.target.closest("[data-start]");
      if(s){
        e.preventDefault();
        e.stopPropagation();
        const dayId=s.dataset.start;
        navigate("workout",{dayId});
        return;
      }
    }, {passive:false});
  }

  // Bind specific Inputs / Selects (non-delegated)
  document.querySelectorAll(".navbtn").forEach(btn=>btn.onclick=()=>navigate(btn.dataset.nav));
  document.querySelectorAll(".bnavbtn").forEach(btn=>btn.onclick=()=>btn.dataset.nav==="workoutLast"?navigate("workoutLast"):navigate(btn.dataset.nav));
  document.querySelectorAll("[data-navto]").forEach(el=>el.onclick=()=>el.dataset.navto==="workoutLast"?navigate("workoutLast"):navigate(el.dataset.navto));
  document.querySelectorAll("[data-start]").forEach(btn=>btn.onclick=()=>{ window.__workoutUI=null; navigate("workout",{dayId:btn.dataset.start}); });
  
  const libSearch=document.getElementById("libSearch"); if(libSearch) libSearch.oninput=e=>{window.__lib_q=e.target.value; render();};
  const libMuscle=document.getElementById("libMuscle"); if(libMuscle) libMuscle.onchange=e=>{window.__lib_m=e.target.value; render();};
  const libEquip=document.getElementById("libEquip"); if(libEquip) libEquip.onchange=e=>{window.__lib_e=e.target.value; render();};

  // Specific buttons that DO NOT use data-action (these are safe to keep as specific handlers)
  document.querySelectorAll("[data-del-ex]").forEach(btn=>btn.onclick=()=>{
    const id=btn.dataset.delEx;
    const ex=exById(id);
    if(!ex?.custom) return;
    if(!confirm(`Delete custom exercise "${ex.name}"?`)) return;
    const used=state.slots.some(s=>s.exId===id);
    if(used){ alert("This exercise is used in a workout template. Swap it out first, then delete."); return; }
    state.exercises=state.exercises.filter(e=>e.id!==id);
    saveState(state); setStatus("Deleted custom exercise."); render();
  });
  document.querySelectorAll("[data-del-day]").forEach(btn=>btn.onclick=()=>{
    const dayId=btn.dataset.delDay; const day=dayById(dayId); if(!day) return;
    if(!confirm(`Remove workout "${day.name}" and its exercises?`)) return;
    state.days=state.days.filter(d=>d.id!==dayId);
    state.slots=state.slots.filter(s=>s.dayId!==dayId);
    saveState(state); setStatus("Removed workout."); render();
  });
  document.querySelectorAll("[data-edit-day]").forEach(btn=>btn.onclick=()=>navigate("workout",{dayId:btn.dataset.editDay}));

  document.querySelectorAll("[data-slider]").forEach(sl=>sl.oninput=e=>{ const key=sl.dataset.slider; const ui=window.__workoutUI; ui.readiness[key]=Number(e.target.value); render(); });
  document.querySelectorAll("[data-toggle]").forEach(h=>h.onclick=()=>{ const id=h.dataset.toggle; const ui=window.__workoutUI; ui.collapsed[id]=!ui.collapsed[id]; render(); });
  document.querySelectorAll("[data-swap]").forEach(sel=>sel.onchange=e=>{ const slotId=sel.dataset.swap; const slot=state.slots.find(s=>s.id===slotId); if(!slot) return; slot.exId=e.target.value; saveState(state); setStatus("Swapped exercise."); render(); });
  
  document.querySelectorAll("[data-addset]").forEach(btn=>btn.onclick=()=>{
    const slotId = btn.dataset.addset;
    const slot = state.slots.find(s=>s.id===slotId);
    const ui = window.__workoutUI;
    const draft = ui?.setDrafts?.[slotId];
    if(!slot||!draft) return;
    draft.sets.push({weight: state.settings.autoFillFromSuggestion?slot.suggestedLoad:"", reps: state.settings.autoFillFromSuggestion?slot.repTarget:"", rir: state.settings.autoFillFromSuggestion?slot.targetRir:"", done:false});
    setStatus("Added a set (session only).");
    render();
  });
  document.querySelectorAll("[data-remset]").forEach(btn=>btn.onclick=()=>{
    const slotId = btn.dataset.remset;
    const ui = window.__workoutUI;
    const draft = ui?.setDrafts?.[slotId];
    if(!draft) return;
    if(draft.sets.length<=1){ alert("Can't go below 1 set."); return; }
    draft.sets.pop();
    setStatus("Removed last set (session only).");
    render();
  });
  document.querySelectorAll("[data-applysets]").forEach(btn=>btn.onclick=()=>{
    const slotId = btn.dataset.applysets;
    const slot = state.slots.find(s=>s.id===slotId);
    const ui = window.__workoutUI;
    const draft = ui?.setDrafts?.[slotId];
    if(!slot||!draft) return;
    const n = draft.sets.length;
    if(!confirm(`Set this exercise's template sets to ${n}?`)) return;
    slot.sets = n;
    saveState(state);
    setStatus("Updated template set count.");
    render();
  });
  document.querySelectorAll("[data-genwu]").forEach(btn=>btn.onclick=()=>{
    const slotId = btn.dataset.genwu;
    const slot = state.slots.find(s=>s.id===slotId);
    const ui = window.__workoutUI;
    const draft = ui?.setDrafts?.[slotId];
    if(!slot||!ui||!draft) return;
    const ex = exById(slot.exId);
    const baseW = Number((draft.sets.find(x=>Number.isFinite(Number(x.weight)) && Number(x.weight)>0)?.weight) || slot.suggestedLoad || 0);
    ui.warmups[slotId] = recommendWarmups(ex, baseW);
    setStatus("Generated warm-up sets.");
    render();
  });
  document.querySelectorAll("[data-wu]").forEach(inp=>inp.oninput=e=>{
    const slotId = inp.dataset.wu, field = inp.dataset.field, idx = Number(inp.dataset.idx);
    const ui = window.__workoutUI;
    const list = ui?.warmups?.[slotId];
    if(!list || !list[idx]) return;
    list[idx][field] = e.target.value==="" ? "" : Number(e.target.value);
  });
  document.querySelectorAll("[data-wudone]").forEach(btn=>btn.onclick=()=>{
    const slotId = btn.dataset.wudone, idx = Number(btn.dataset.idx);
    const ui = window.__workoutUI;
    const list = ui?.warmups?.[slotId];
    if(!list || !list[idx]) return;
    list[idx].done = !list[idx].done;
    render();
  });

document.querySelectorAll("[data-fill]").forEach(btn=>btn.onclick=()=>{
    const slotId=btn.dataset.fill; const slot=state.slots.find(s=>s.id===slotId); const ui=window.__workoutUI; const draft=ui?.setDrafts?.[slotId];
    if(!slot||!draft) return;
    draft.sets=draft.sets.map(x=>({...x,weight:slot.suggestedLoad,reps:slot.repTarget,rir:slot.targetRir}));
    setStatus("Filled sets."); render();
  });
  document.querySelectorAll("[data-set]").forEach(inp=>inp.oninput=e=>{
    const slotId=inp.dataset.set, field=inp.dataset.field, idx=Number(inp.dataset.idx);
    const ui=window.__workoutUI; const draft=ui?.setDrafts?.[slotId]; if(!draft) return;
    draft.sets[idx][field]=e.target.value===""?"":Number(e.target.value);
  });
  document.querySelectorAll("[data-markdone]").forEach(btn=>btn.onclick=()=>{
    const slotId=btn.dataset.markdone, idx=Number(btn.dataset.idx);
    const ui=window.__workoutUI; const draft=ui?.setDrafts?.[slotId]; if(!draft) return;
    draft.sets[idx].done=!draft.sets[idx].done; render();
  });
  document.querySelectorAll("[data-quick]").forEach(btn=>btn.onclick=()=>{
    const slotId=btn.dataset.quick, q=btn.dataset.q;
    const slot=state.slots.find(s=>s.id===slotId); const ui=window.__workoutUI; const draft=ui?.setDrafts?.[slotId];
    if(!slot||!draft) return;
    const inc=Number(state.settings.loadIncrement||2.5);
    for(const row of draft.sets){
      const w=Number(row.weight), r=Number(row.reps), rir=Number(row.rir);
      if(q==="reps+") row.reps=Number.isFinite(r)?r+1:slot.repTarget+1;
      if(q==="reps-") row.reps=Number.isFinite(r)?Math.max(0,r-1):Math.max(0,slot.repTarget-1);
      if(q==="load+") row.weight=Number.isFinite(w)?(w+inc):(slot.suggestedLoad+inc);
      if(q==="load-") row.weight=Number.isFinite(w)?Math.max(0,w-inc):Math.max(0,slot.suggestedLoad-inc);
      if(q==="rir+") row.rir=Number.isFinite(rir)?(rir+0.5):(slot.targetRir+0.5);
      if(q==="rir-") row.rir=Number.isFinite(rir)?Math.max(0,rir-0.5):Math.max(0,slot.targetRir-0.5);
    }
    render();
  });
  
  document.querySelectorAll("[data-bk-dl]").forEach(btn=>btn.onclick=()=>{
    const id = btn.dataset.bkDl;
    const b = loadBackups();
    const x = (b.items||[]).find(it=>it.id===id);
    if(!x){ alert("Backup not found."); return; }
    downloadText(`hypertrophy-coach-backup-${x.date}.json`, x.data);
    setStatus("Downloaded backup.");
  });
  document.querySelectorAll("[data-bk-del]").forEach(btn=>btn.onclick=()=>{
    const id = btn.dataset.bkDel;
    const b = loadBackups();
    const x = (b.items||[]).find(it=>it.id===id);
    if(!x) return;
    if(!confirm("Delete this backup?")) return;
    b.items = (b.items||[]).filter(it=>it.id!==id);
    saveBackups(b);
    setStatus("Deleted backup.");
    render();
  });

document.querySelectorAll("[data-del-slot]").forEach(btn=>btn.onclick=()=>{
    const slotId=btn.dataset.delSlot; const slot=state.slots.find(s=>s.id===slotId); if(!slot) return;
    if(!confirm("Remove this exercise from the workout template?")) return;
    state.slots=state.slots.filter(s=>s.id!==slotId); saveState(state); setStatus("Removed exercise slot.");
    if(window.__workoutUI?.setDrafts) delete window.__workoutUI.setDrafts[slotId];
    render();
  });
  
  document.querySelectorAll("[data-stopprop]").forEach(el=>el.onclick=(e)=>e.stopPropagation());
  
  // REMOVED: The problematic loop that overwrote data-action handlers
  // document.querySelectorAll("[data-action]").forEach(...)  <-- DELETED
}

function handleAction(action){
  // MOVED: Custom Exercise Logic from wire() to here
  if(action==="add-custom-ex"){
    const name=(document.getElementById("custName")?.value||"").trim();
    const muscle=document.getElementById("custMuscle")?.value||"CHEST";
    const equip=document.getElementById("custEquip")?.value||"other";
    const compound=(document.getElementById("custCompound")?.value||"false")==="true";
    if(!name){ alert("Enter a name."); return; }
    const id="ex_custom_"+uid("x");
    state.exercises.push({id,name,muscles:[muscle],compound,equipment:equip,custom:true});
    saveState(state); setStatus("Added custom exercise.");
    const cn=document.getElementById("custName"); if(cn) cn.value="";
    render();
    return;
  }

  if(action==="toggle-add-ex"){ const ui=window.__workoutUI||(window.__workoutUI={}); ui.__showAdd=!ui.__showAdd; render(); return; }
  if(action==="confirm-add-ex"){
    const dayId=route.params.dayId||lastWorkedDayId();
    const exId=document.getElementById("addExId")?.value;
    const sets=Number(document.getElementById("addSets")?.value||3);
    const repMin=Number(document.getElementById("addRepMin")?.value||8);
    const repMax=Number(document.getElementById("addRepMax")?.value||12);
    const targetRir=Number(document.getElementById("addRir")?.value||2);
    const suggestedLoad=Number(document.getElementById("addLoad")?.value||0);
    if(!exId){ alert("Choose an exercise."); return; }
    if(!(sets>=1&&sets<=20)){ alert("Sets must be 1–20."); return; }
    if(!(repMin>=1&&repMax>=repMin&&repMax<=50)){ alert("Rep range invalid."); return; }
    const order=Math.max(-1,...state.slots.filter(s=>s.dayId===dayId).map(s=>s.order))+1;
    state.slots.push({id:uid("slot"),dayId,order,exId,sets,repMin,repMax,targetRir,repTarget:repMin,suggestedLoad});
    saveState(state); setStatus("Added exercise to workout template.");
    const ui=window.__workoutUI; ui.__showAdd=false; render(); return;
  }
  if(action==="start-session"){ const ui=window.__workoutUI; ui.started=true; ui.sessionId=uid("session"); ui.startedAt=Date.now(); setStatus("Session started."); render(); return; }
  if(action==="clear-session"){ if(!confirm("Clear current workout drafts?")) return; const ui=window.__workoutUI; ui.setDrafts={}; setStatus("Cleared drafts."); render(); return; }
  if(action==="finish-adjust"){
    const ui=window.__workoutUI; if(!ui?.started){ alert("Start the session first."); return; }
    const dayId=route.params.dayId||lastWorkedDayId();
    const rScore=readinessScore(ui.readiness); const low=rScore<2.5;
    const daySlots=slotsForDay(dayId);
    const logs=[];
    for(const slot of daySlots){
      const d=ui.setDrafts?.[slot.id]; if(!d) continue;
      d.sets.forEach((row,idx)=>{
        const weight=Number(row.weight), reps=Number(row.reps), rir=Number(row.rir);
        if(!Number.isFinite(weight)||!Number.isFinite(reps)||!Number.isFinite(rir)) return;
        logs.push({slotId:slot.id,setIndex:idx+1,weight,reps,achievedRir:rir});
      });
    }
    
    // Warm-up logs (simple tracking). Only saves marked warm-up sets.
    try{
      const wuBySlot = ui.warmups || {};
      for(const slot of daySlots){
        const list = wuBySlot[slot.id] || [];
        list.forEach((w, i) => {
          const weight = Number(w.weight), reps = Number(w.reps), rir = Number(w.rir);
          if(!Number.isFinite(weight)||!Number.isFinite(reps)||!Number.isFinite(rir)) return;
          if(!w.done) return;
          logs.push({slotId: slot.id, setIndex: -(i+1), weight, reps, achievedRir: rir, isWarmup:true});
        });
      }
    }catch(e){}
state.sessions.push({id:ui.sessionId||uid("session"),date:nowISODate(),dayId,readiness:{...ui.readiness},readinessScore:rScore,startedAt:ui.startedAt||Date.now(),logs});
    const updated = daySlots.map(slot => nextSlotFromLogs(slot, logs.filter(l => l.slotId === slot.id && !l.isWarmup), low, state.settings));
    const map=new Map(updated.map(s=>[s.id,s])); state.slots=state.slots.map(s=>map.get(s.id)||s);
    saveState(state); window.__workoutUI=null; setStatus("Saved session + adjusted next workout."); makeAutoBackup("auto");
  navigate("home"); return;
  }
  
  if(action==="backup-now"){
    const did = makeAutoBackup("manual");
    setStatus(did ? "Backup created." : "Backup failed.");
    render();
    return;
  }
  if(action==="backup-download-latest"){
    const b = loadBackups();
    const x = (b.items||[])[0];
    if(!x){ alert("No backups yet."); return; }
    downloadText(`hypertrophy-coach-backup-${x.date}.json`, x.data);
    setStatus("Downloaded latest backup.");
    return;
  }

  if(action==="toggle-add-day"){
    const su = window.__settingsUI || (window.__settingsUI = { addDayOpen:false, addDayName:"" });
    su.addDayOpen = !su.addDayOpen;
    if(!su.addDayOpen) su.addDayName = "";
    render();
    return;
  }
  if(action==="confirm-add-day"){
    const su = window.__settingsUI || (window.__settingsUI = { addDayOpen:false, addDayName:"" });
    const input = document.getElementById("newDayName");
    const name = (input?.value || su.addDayName || "").trim();
    if(!name){ alert("Please enter a workout name."); return; }
    const nextIndex = Math.max(...state.days.map(d=>d.index), -1) + 1;
    state.days.push({ id: "day_" + uid("d"), name, index: nextIndex });
    saveState(state);
    su.addDayOpen = false;
    su.addDayName = "";
    setStatus("Added workout.");
    render();
    return;
  }

  if(action==="show-add-workout"){
    const ui = window.__workoutUI;
    ui.__showAddWorkout = true;
    ui.__addWorkoutName = "";
    render();
    return;
  }
  if(action==="hide-add-workout"){
    const ui = window.__workoutUI;
    ui.__showAddWorkout = false;
    ui.__addWorkoutName = "";
    render();
    return;
  }
  if(action==="create-workout"){
    const ui = window.__workoutUI;
    const name = (document.getElementById("newWorkoutName")?.value || "").trim();
    if(!name){ alert("Please enter a workout name."); return; }
    const exists = state.days?.some(d => (d.name||"").toLowerCase() === name.toLowerCase());
    if(exists && !confirm("A workout with that name already exists. Create anyway?")) return;
    const nextIndex = Math.max(...state.days.map(d=>d.index), -1) + 1;
    const day = { id: "day_"+uid("d"), name, index: nextIndex };
    state.days.push(day);
    saveState(state);
    ui.__showAddWorkout = false;
    ui.__addWorkoutName = "";
    setStatus("Workout created.");
    render();
    return;
  }

if(action==="save-settings"){
    state.settings.daysPerWeek=Number(document.getElementById("daysPerWeek")?.value||4);
    state.settings.loadIncrement=Number(document.getElementById("loadIncrement")?.value||2.5);
    state.settings.autoFillFromSuggestion=(document.getElementById("autoFill")?.value||"true")==="true";
    const bf=document.getElementById("backupFreq");
    const bk=document.getElementById("backupKeep");
    if(bf) state.settings.backupFreqHours=Number(bf.value||24);
    if(bk) state.settings.backupKeep=Number(bk.value||14);

    saveState(state); setStatus("Settings saved."); navigate("home"); return;
  }
  if(action==="export-json"){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`hypertrophy-coach-backup-${nowISODate()}.json`; a.click(); URL.revokeObjectURL(a.href);
    setStatus("Exported JSON."); return;
  }
  if(action==="copy-json"){
    const text=JSON.stringify(state);
    navigator.clipboard?.writeText(text).then(()=>setStatus("Copied JSON to clipboard.")).catch(()=>{ prompt("Copy JSON:",text); setStatus("Copy JSON via prompt."); });
    return;
  }
  if(action==="import-json"){
    const file=document.getElementById("importFile")?.files?.[0]; if(!file){ alert("Choose a JSON file first."); return; }
    if(!confirm("Import will overwrite current data on this device. Continue?")) return;
    const reader=new FileReader();
    reader.onload=()=>{ try{ const imported=JSON.parse(String(reader.result||""));
      if(!imported||!imported.meta||!imported.exercises||!imported.slots||!imported.days) throw new Error("Invalid backup.");
      state=imported; saveState(state); window.__workoutUI=null; setStatus("Import complete."); navigate("home");
    }catch(e){ alert("Import failed: "+(e?.message||"unknown error")); } };
    reader.readAsText(file); return;
  }
  if(action==="reset-all"){ if(!confirm("Reset ALL data? This cannot be undone.")) return; state=seedState(); saveState(state); window.__workoutUI=null; setStatus("Reset complete."); navigate("home"); return; }
}

(async function boot(){
  try{ if("serviceWorker" in navigator){ await navigator.serviceWorker.register("./sw.js"); setStatus("Offline ready (service worker active)."); } }
  catch{ setStatus("Service worker failed (still usable)."); }
  navigate("home");
  setInterval(() => {
    const ui = window.__workoutUI;
    if ((route.name === "workout" || route.name === "workoutLast") && ui?.started && ui?.startedAt) {
      const elapsed = Math.max(0, Math.floor((Date.now() - ui.startedAt) / 1000));
      const timerStr = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
      const el = document.getElementById("sessionTimer");
      if (el) el.textContent = timerStr;
    }
  }, 1000);
})();