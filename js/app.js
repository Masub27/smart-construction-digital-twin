const CASES={
 "rapid-curing":{name:"Rapid Concrete Curing",evidence:"Concrete temperature is rising while surface moisture is falling rapidly.",targets:{concreteTemp:43,concreteMoisture:34},levels:{concreteTemp:"alarm",concreteMoisture:"alarm"},action:"control-curing",solution:"SHADE SURFACE → CONTROL TEMPERATURE → RESTORE MOISTURE → INSPECT CRACKING → DOCUMENT CURING",agents:{engineer:"The temperature–moisture pattern indicates accelerated hydration and evaporation. Protect the pour, restore controlled moisture and inspect for thermal or shrinkage cracking.",safety:"Restrict access to the pour area during corrective work. Control slip hazards and verify that curing covers and water equipment are safely installed.",sustainability:"Early intervention prevents demolition and recasting. Controlled curing uses fewer materials and avoids embodied-carbon loss."}},
 "formwork-overload":{name:"Formwork Overload",evidence:"Structural strain and vibration are increasing around the active concrete deck.",targets:{strain:610,noise:82},levels:{strain:"alarm",noise:"warning"},action:"unload-formwork",solution:"STOP POUR → EXCLUDE AREA → REDUCE LOAD → ENGINEER INSPECTION → VERIFY FORMWORK",agents:{engineer:"Measured strain exceeds the training limit. Stop loading, check supports, bracing, pour sequence and formwork deformation.",safety:"Treat the zone as a potential collapse area. Stop work, establish an exclusion zone and do not enter below the formwork.",sustainability:"Controlled unloading and early inspection reduce the chance of formwork failure, concrete waste and schedule loss."}},
 "crane-instability":{name:"Crane Instability",evidence:"Crane inclination is increasing during lifting activity.",targets:{craneTilt:4.8,noise:79},levels:{craneTilt:"alarm"},action:"secure-crane",solution:"STOP LIFT → LOWER LOAD → EXCLUDE SLEWING ZONE → SECURE CRANE → INSPECT FOUNDATION",agents:{engineer:"The tilt reading is outside the simulated operating envelope. Lower the load and inspect crane setup, foundation, outriggers and load radius.",safety:"Stop lifting immediately. Clear the lifting and slewing zones and prevent crane operation until authorised.",sustainability:"Avoiding an incident protects equipment, materials and schedule. Reschedule lifting rather than accepting instability risk."}},
 "dust-hazard":{name:"Dust Exposure Hazard",evidence:"Particulate concentration is rising during cutting activity.",targets:{dust:240,noise:91},levels:{dust:"alarm",noise:"alarm"},action:"dust-control",solution:"STOP CUTTING → ISOLATE AREA → APPLY EXTRACTION/WET METHOD → VERIFY AIR → RESUME WITH PPE",agents:{engineer:"The process is generating excessive airborne dust. Use local extraction or wet cutting and verify the source controls.",safety:"Stop exposure, restrict the area and use suitable respiratory, eye and hearing protection before controlled restart.",sustainability:"Source capture improves worker health and prevents dust contamination, cleaning effort and material loss."}},
 "water-leak":{name:"Water Leakage",evidence:"Unexpected moisture is increasing near stored materials and temporary electrical services.",targets:{materialMoisture:38,electricalLoad:12},levels:{materialMoisture:"alarm",electricalLoad:"warning"},action:"stop-leak",solution:"ISOLATE WATER → PROTECT ELECTRICAL AREA → TRACE LEAK → DRY MATERIALS → VERIFY",agents:{engineer:"The moisture pattern indicates an active leak. Isolate the supply, trace the source and inspect affected assemblies.",safety:"Keep workers away from wet temporary electrical equipment. Apply water and electrical isolation before inspection.",sustainability:"Rapid containment reduces water use and prevents damage to insulation, boards and stored construction materials."}},
 "wet-material":{name:"Wet Construction Material",evidence:"Stored construction materials show persistent moisture above the acceptable training range.",targets:{materialMoisture:29,concreteMoisture:78},levels:{materialMoisture:"alarm"},action:"quarantine-material",solution:"QUARANTINE MATERIAL → IDENTIFY SOURCE → DRY/TEST → REUSE IF COMPLIANT → DOCUMENT",agents:{engineer:"Do not install wet material. Quarantine it, check manufacturer limits and test again after controlled drying.",safety:"Secure unstable or water-damaged stacks and prevent handling until storage conditions are safe.",sustainability:"Test before disposal. Compliant material can be recovered after controlled drying, reducing waste and replacement cost."}},
 "electrical-fault":{name:"Temporary Electrical Fault",evidence:"Temporary-site power demand is unstable and the distribution state is abnormal.",targets:{electricalLoad:48,noise:74},levels:{electricalLoad:"alarm"},action:"electrical-isolation",solution:"STOP EQUIPMENT → ELECTRICAL ISOLATION → TEST CIRCUIT → CORRECT FAULT → AUTHORISED RECONNECT",agents:{engineer:"The temporary distribution load is abnormal. Inspect connected equipment, protection devices, cables and load balance.",safety:"Electrical isolation and lockout are required. Only an authorised competent person may test or reconnect the circuit.",sustainability:"Finding the defective load prevents energy loss, damaged tools and avoidable replacement of cables or equipment."}},
 "sensor-drift":{name:"Sensor Calibration Drift",evidence:"One measurement changes slowly without matching evidence from related construction processes.",targets:{concreteTemp:61,concreteMoisture:70},levels:{concreteTemp:"warning"},action:"calibrate-sensor",solution:"COMPARE REDUNDANT MEASUREMENT → INSPECT SENSOR → CALIBRATE → VALIDATE → RESTORE CHANNEL",agents:{engineer:"The isolated temperature rise conflicts with the normal moisture and process state. Verify with a reference instrument before changing construction work.",safety:"Treat the reading cautiously until independently verified. Do not ignore it, but avoid unnecessary intervention based on one unconfirmed channel.",sustainability:"Calibration prevents unnecessary material rejection and avoids incorrect energy-intensive corrective work."}}
};

const NORMAL={concreteTemp:24,concreteMoisture:72,strain:120,craneTilt:.4,dust:18,noise:68,materialMoisture:8,electricalLoad:18.5};
const SIMULATION_NORMAL={...NORMAL};
const UNIT_DIGITS={concreteTemp:1,concreteMoisture:0,strain:0,craneTilt:1,dust:0,noise:0,materialMoisture:0,electricalLoad:1};
let values={...NORMAL},target={...NORMAL},activeCase=null,consulted=new Set(),startedAt=null,timer=null,totalScore=0;
const $=id=>document.getElementById(id);
function log(message){const e=document.createElement("div");e.className="log-entry";e.textContent=`[${new Date().toLocaleTimeString()}] ${message}`;$("eventLog").prepend(e)}
function setSensor(key,value,level="normal"){$(key).textContent=Number(value).toFixed(UNIT_DIGITS[key]);const card=document.querySelector(`[data-key="${key}"]`);card.className=`sensor ${level==="normal"?"":level}`.trim();$(`${key}State`).textContent=level==="alarm"?"ALARM":level==="warning"?"WARNING":"NORMAL"}
function tick(){Object.keys(values).forEach(k=>{values[k]+=(target[k]-values[k])*.12;const level=activeCase?.levels[k]||"normal";setSensor(k,values[k],level)});$("packetTime").textContent=new Date().toLocaleTimeString();if(startedAt){const s=Math.floor((Date.now()-startedAt)/1000);$("missionTimer").textContent=`Elapsed time: ${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}}
function resetAgents(){consulted=new Set();document.querySelectorAll(".agent").forEach(card=>card.classList.remove("consulted"));document.querySelectorAll(".agent button").forEach(b=>{b.disabled=!activeCase;b.textContent=b.dataset.agent==="engineer"?"Consult Site Engineer":b.dataset.agent==="safety"?"Consult Safety Officer":"Consult Sustainability Agent"});["engineer","safety","sustainability"].forEach(a=>$("agent-"+a).textContent=activeCase?"Ready to analyse. Select this specialist to request a report.":"Start a scenario, then consult this specialist.");$("consensus").className="consensus locked";$("consensus").innerHTML="<small>THREE-AGENT CONSENSUS</small><h3>🔒 Coordinated construction decision locked</h3><p>Consult all three workplace agents. (0 of 3 completed)</p>";$("submitDecision").disabled=true;$("submitDecision").textContent="Consult all agents before submitting"}
function startScenario(){const keys=Object.keys(CASES);activeCase=CASES[keys[Math.floor(Math.random()*keys.length)]];activeCase.id=keys.find(k=>CASES[k]===activeCase);target={...NORMAL,...activeCase.targets};startedAt=Date.now();$("siteVisual").className=`site-visual fault-${activeCase.id}`;$("workOrder").textContent=`CS-${Math.floor(100+Math.random()*900)} · Diagnose abnormal site condition`;$("siteAlert").textContent="ABNORMAL CONDITION";$("siteAlert").className="site-alert active";$("evidenceBadge").textContent="UNKNOWN FAULT";$("evidenceBadge").className="badge active";document.querySelector(".investigation").classList.add("active");$("evidenceText").innerHTML=`<strong>Initial observation:</strong> ${activeCase.evidence}<br><span>The root cause is hidden. Inspect sensors and consult each workplace specialist.</span>`;$("feedback").className="feedback hidden";$("diagnosis").value="";$("action").value="";$("reason").value="";resetAgents();log("New hidden construction scenario started.")}
function consult(name){if(!activeCase)return;$("agent-"+name).textContent=activeCase.agents[name];consulted.add(name);const card=$("card-"+name);card.classList.add("consulted");const button=card.querySelector("button");button.disabled=true;button.textContent="✓ Consultation completed";$("cAgent").textContent=`${Math.round(consulted.size/3*20)}/20`;if(consulted.size===3){$("consensus").className="consensus";$("consensus").innerHTML=`<small>THREE-AGENT CONSENSUS</small><h3>Coordinated construction response</h3><p>${activeCase.solution}</p>`;$("submitDecision").disabled=false;$("submitDecision").textContent="Submit Diagnosis and Decision"}else{$("consensus").querySelector("p").textContent=`Continue investigation: ${consulted.size} of 3 agents consulted.`}log(`${name} specialist consulted.`)}
function submit(){if(!activeCase)return;const diagnosis=$("diagnosis").value,action=$("action").value,reason=$("reason").value.trim();const d=diagnosis===activeCase.id,a=action===activeCase.action,r=reason.length>=25;const sensor=diagnosis?20:0,agent=consulted.size===3?20:0,safety=a?25:0,diag=d?25:0,why=r?10:0;totalScore=sensor+agent+safety+diag+why;$("cSensor").textContent=`${sensor}/20`;$("cAgent").textContent=`${agent}/20`;$("cSafety").textContent=`${safety}/25`;$("cDiagnosis").textContent=`${diag}/25`;$("cReason").textContent=`${why}/10`;$("score").textContent=`Score: ${totalScore}/100`;const ok=d&&a&&r;$("feedback").className=`feedback ${ok?"success":"danger"}`;$("feedback").innerHTML=ok?`<strong>✓ Correct professional decision</strong><br>You identified <b>${activeCase.name}</b>, selected the appropriate immediate action and justified it with evidence.`:`<strong>✗ Decision requires review</strong><br>Actual condition: <b>${activeCase.name}</b>. Recommended response: ${activeCase.solution}. ${!r?"Your justification must contain at least 25 characters.":"Compare your selection with the evidence and agent reports."}`;$("evidenceBadge").textContent=activeCase.name.toUpperCase();log(`Learner submitted decision: ${ok?"competent":"review required"} (${totalScore}/100).`)}
function reset(){activeCase=null;target={...NORMAL};startedAt=null;$("siteVisual").className="site-visual";$("workOrder").textContent="No scenario active";$("missionTimer").textContent="Elapsed time: 00:00";$("siteAlert").textContent="SITE NORMAL";$("siteAlert").className="site-alert";$("evidenceBadge").textContent="NO ACTIVE CASE";$("evidenceBadge").className="badge neutral";document.querySelector(".investigation").classList.remove("active");$("evidenceText").textContent="Start a mystery scenario to receive a construction work order.";["cSensor","cAgent","cSafety","cDiagnosis","cReason"].forEach((id,i)=>$(id).textContent=`0/${[20,20,25,25,10][i]}`);$("score").textContent="Score: 0";$("feedback").className="feedback hidden";resetAgents();log("Laboratory reset.")}

function injectInstructorFault(){
  const id=$("instructorFault").value;
  activeCase=CASES[id];
  activeCase.id=id;
  target={...NORMAL,...activeCase.targets};
  $("siteVisual").className=`site-visual fault-${id}`;
  startedAt=Date.now();
  $("workOrder").textContent=`DEMO-${Math.floor(100+Math.random()*900)} · ${activeCase.name}`;
  $("siteAlert").textContent="FAULT INJECTED";
  $("siteAlert").className="site-alert active";
  $("evidenceBadge").textContent="INSTRUCTOR DEMO";
  $("evidenceBadge").className="badge active";
  document.querySelector(".investigation").classList.add("active");
  $("evidenceText").innerHTML=`<strong>Injected fault:</strong> ${activeCase.name}<br><span>${activeCase.evidence}</span>`;
  $("feedback").className="feedback hidden";
  $("diagnosis").value="";
  $("action").value="";
  $("reason").value="";
  resetAgents();
  log(`Instructor injected fault: ${activeCase.name}.`);
}

$("startScenario").addEventListener("click",startScenario);
$("injectInstructorFault").addEventListener("click",injectInstructorFault);
$("resetLab").addEventListener("click",reset);
document.querySelectorAll(".agent button").forEach(b=>b.addEventListener("click",()=>consult(b.dataset.agent)));
$("submitDecision").addEventListener("click",submit);
setInterval(tick,1000);
reset();
log("Smart Construction Site Digital Twin initialized.");

window.constructionTwin={
  startScenario,
  injectFault(id){$("instructorFault").value=id;injectInstructorFault()},
  consult,
  reset,
  applyLiveBaseline(baseline){
    Object.entries(baseline).forEach(([key,value])=>{
      if(!(key in NORMAL)||!Number.isFinite(Number(value)))return;
      NORMAL[key]=Number(value);
      if(!activeCase||!(key in activeCase.targets))target[key]=Number(value);
    });
    log("Live Magdeburg context synchronized with the virtual sensor baseline.");
  },
  restoreSimulationBaseline(){
    Object.assign(NORMAL,SIMULATION_NORMAL);
    if(!activeCase)target={...NORMAL};
    log("Virtual laboratory baseline restored.");
  },
  getState(){return {activeCase,values:{...values},target:{...target},consulted:[...consulted]}}
};
