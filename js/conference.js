(function(){
  "use strict";
  const q=id=>document.getElementById(id);
  const sensorMeta={
    craneTilt:["Crane inclinometer","°","Monitors crane verticality and foundation stability."],
    concreteTemp:["Concrete temperature","°C","Tracks hydration heat and rapid-curing risk."],
    electricalLoad:["Temporary power","kW","Monitors abnormal demand and electrical safety."],
    dust:["Air-quality monitor","µg/m³","Tracks worker exposure to airborne particulate."],
    noise:["Noise dosimeter","dB(A)","Tracks occupational noise exposure."]
  };
  const impacts={
    "rapid-curing":[18,12500,6200,1380,"HIGH"],"formwork-overload":[36,48000,11000,2700,"CRITICAL"],
    "crane-instability":[24,85000,3500,920,"CRITICAL"],"dust-hazard":[8,7200,450,130,"HIGH"],
    "water-leak":[16,18000,4200,980,"HIGH"],"wet-material":[12,9600,3100,740,"MEDIUM"],
    "electrical-fault":[10,15500,780,260,"CRITICAL"],"sensor-drift":[5,4200,1200,310,"MEDIUM"]
  };
  const history={concreteTemp:[],concreteMoisture:[],strain:[],craneTilt:[],dust:[],noise:[]};
  let demoTimers=[],demoRunning=false;

  function state(){return window.constructionTwin?.getState?.()||{values:{},activeCase:null}}
  function openHotspot(key){
    const meta=sensorMeta[key]||[key,"",""]; const s=state(); const v=s.values[key];
    q("hotspotTitle").textContent=meta[0];q("hotspotReading").textContent=`${Number(v||0).toFixed(key==="craneTilt"?1:0)} ${meta[1]}`;
    q("hotspotNote").textContent=meta[2];q("hotspotPanel").classList.add("open");
  }
  document.querySelectorAll("[data-hotspot]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();openHotspot(el.dataset.hotspot)}));
  q("closeHotspot").addEventListener("click",()=>q("hotspotPanel").classList.remove("open"));

  function drawChart(canvas,series){
    const dpr=window.devicePixelRatio||1,w=canvas.clientWidth||360,h=150;canvas.width=w*dpr;canvas.height=h*dpr;
    const c=canvas.getContext("2d");c.scale(dpr,dpr);c.clearRect(0,0,w,h);c.strokeStyle="#dbe4ee";c.lineWidth=1;
    for(let y=20;y<h;y+=32){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
    const all=series.flatMap(s=>s.data);let min=Math.min(...all,0),max=Math.max(...all,1);if(max===min)max=min+1;
    series.forEach(s=>{c.strokeStyle=s.color;c.lineWidth=2.4;c.beginPath();s.data.forEach((v,i)=>{const x=(i/59)*w,y=h-8-(v-min)/(max-min)*(h-18);i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()});
    const fault=state().activeCase;if(fault){c.strokeStyle="#ef4444";c.setLineDash([4,4]);c.beginPath();c.moveTo(w-4,0);c.lineTo(w-4,h);c.stroke();c.setLineDash([])}
  }
  function updateCharts(){
    const v=state().values;Object.keys(history).forEach(k=>{history[k].push(Number(v[k]||0));if(history[k].length>60)history[k].shift();while(history[k].length<60)history[k].unshift(history[k][0]||0)});
    drawChart(q("concreteChart"),[{data:history.concreteTemp,color:"#ef4444"},{data:history.concreteMoisture,color:"#0ea5e9"}]);
    drawChart(q("structureChart"),[{data:history.strain.map(x=>x/10),color:"#8b5cf6"},{data:history.craneTilt,color:"#f59e0b"}]);
    drawChart(q("environmentChart"),[{data:history.dust.map(x=>x/5),color:"#64748b"},{data:history.noise,color:"#06b6d4"}]);
  }
  function updateImpact(){
    const id=state().activeCase?.id,data=impacts[id]||[0,0,0,0,"MONITORING"];
    q("impactDelay").textContent=`${data[0]} h`;q("impactCost").textContent=`€${data[1].toLocaleString()}`;q("impactWaste").textContent=`${data[2].toLocaleString()} kg`;q("impactCarbon").textContent=`${data[3].toLocaleString()} kg`;
    q("impactRisk").textContent=data[4];q("impactRisk").className=`badge ${id?"active":"neutral"}`;
  }
  setInterval(()=>{updateCharts();updateImpact();if(q("hotspotPanel").classList.contains("open")){const title=q("hotspotTitle").textContent;const key=Object.keys(sensorMeta).find(k=>sensorMeta[k][0]===title);if(key)openHotspot(key)}},1000);
  window.addEventListener("resize",updateCharts);

  function narrate(title,text,progress){q("demoTitle").textContent=title;q("demoNarration").textContent=text;q("demoProgress").style.width=`${progress}%`}
  function later(ms,fn){const id=setTimeout(fn,ms);demoTimers.push(id)}
  function stopDemo(){demoTimers.forEach(clearTimeout);demoTimers=[];demoRunning=false;q("demoOverlay").classList.remove("open");q("conferenceDemo").textContent="▶ Conference Demo"}
  function startDemo(){
    if(demoRunning){stopDemo();return} demoRunning=true;q("conferenceDemo").textContent="■ Stop Demo";q("demoOverlay").classList.add("open");window.scrollTo({top:0,behavior:"smooth"});window.constructionTwin.reset();narrate("1 · A connected construction site","Eight virtual IoT channels establish a normal operating baseline.",10);
    later(2500,()=>{window.constructionTwin.injectFault("crane-instability");narrate("2 · A hidden instability develops","The crane moves visibly while tilt telemetry rises beyond the safe training envelope.",30)});
    later(6000,()=>{document.querySelector("[data-agent='engineer']").click();narrate("3 · Site engineer consulted","The learner requests engineering analysis first—agents never answer simultaneously.",48);document.querySelector("#card-engineer").scrollIntoView({behavior:"smooth",block:"center"})});
    later(9000,()=>{document.querySelector("[data-agent='safety']").click();narrate("4 · Safety officer consulted","Human safety remains central: lifting stops and the slewing zone is cleared.",65)});
    later(12000,()=>{document.querySelector("[data-agent='sustainability']").click();narrate("5 · Sustainability and cost reviewed","The team connects safety action with avoided damage, waste, carbon and delay.",82)});
    later(15000,()=>{narrate("6 · Human-led coordinated decision","The learner now owns the final diagnosis. The twin supports—not replaces—professional judgment.",100);document.querySelector("#consensus").scrollIntoView({behavior:"smooth",block:"center"})});
    later(19500,stopDemo);
  }
  q("conferenceDemo").addEventListener("click",startDemo);q("stopDemo").addEventListener("click",stopDemo);
  q("fullscreenMode").addEventListener("click",async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(_){}});
  updateCharts();updateImpact();
})();
