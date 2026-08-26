(function(){
  "use strict";
  const API="https://api.open-meteo.com/v1/forecast?latitude=52.1205&longitude=11.6276&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day&wind_speed_unit=ms&timezone=Europe%2FBerlin";
  const REFRESH_MS=15*60*1000,CACHE_KEY="constructionTwinMagdeburgWeatherV1";
  const $=id=>document.getElementById(id);let nextRefreshAt=0,timer=null,currentWeather=null;
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  function setStatus(text,kind){$("liveStatus").textContent=text;$("liveStatus").className=`badge ${kind}`}
  function fmtTime(value){return new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(value))}
  function valid(c){return c&&["temperature_2m","relative_humidity_2m","precipitation","wind_speed_10m","wind_gusts_10m","wind_direction_10m"].every(k=>Number.isFinite(Number(c[k])))}
  function derive(c){
    const temp=Number(c.temperature_2m),humidity=Number(c.relative_humidity_2m),rain=Number(c.precipitation),wind=Number(c.wind_speed_10m),gust=Number(c.wind_gusts_10m);
    return {
      concreteTemp:clamp(temp+5,5,42),concreteMoisture:clamp(humidity*.72+rain*7,30,90),
      craneTilt:clamp(.3+Math.max(0,gust-8)*.035,.3,1.4),dust:clamp(12+(100-humidity)*.18+wind*.7-rain*8,5,60),
      materialMoisture:clamp(5+humidity*.055+rain*4,6,24)
    };
  }
  function risk(c){
    const gust=Number(c.wind_gusts_10m),rain=Number(c.precipitation),temp=Number(c.temperature_2m);
    if(gust>=17)return ["CRITICAL WIND CONTROL","Suspend crane lifting and inspect temporary structures.","live-error"];
    if(gust>=12)return ["HIGH WIND CAUTION","Review lifting plans, load radius and loose materials.","live-warn"];
    if(rain>=2)return ["HEAVY RAIN CONTROL","Protect materials, excavations and temporary electrical equipment.","live-warn"];
    if(rain>0)return ["WET-WEATHER PRECAUTION","Monitor slips, stored materials, drainage and electrical protection.","live-warn"];
    if(temp>=30)return ["HEAT AND CURING WATCH","Review concrete curing, hydration and worker heat exposure.","live-warn"];
    return ["NORMAL WEATHER ENVELOPE","Continue monitoring before lifting, pouring and outdoor work.","live-ok"];
  }
  function syncWeatherVisual(){if(!currentWeather||$("dataMode").value!=="live")return;const site=$("siteVisual");site.classList.toggle("weather-wet",Number(currentWeather.precipitation)>0);site.classList.toggle("weather-windy",Number(currentWeather.wind_gusts_10m)>=12);site.classList.toggle("weather-night",Number(currentWeather.is_day)===0)}
  function render(c,source){
    currentWeather=c;$("liveTemperature").textContent=Number(c.temperature_2m).toFixed(1);$("liveHumidity").textContent=Math.round(c.relative_humidity_2m);$("livePrecipitation").textContent=Number(c.precipitation).toFixed(1);$("liveWind").textContent=Number(c.wind_speed_10m).toFixed(1);$("liveGust").textContent=Number(c.wind_gusts_10m).toFixed(1);$("liveDirection").textContent=Math.round(c.wind_direction_10m);
    $("liveMeasuredAt").textContent=`Measured ${fmtTime(c.time)}`;const r=risk(c);$("weatherRisk").textContent=r[0];$("weatherAdvice").textContent=r[1];setStatus(source==="live"?"● LIVE DATA":"● CACHED DATA",source==="live"?r[2]:"live-warn");
    $("activeDataMode").textContent=source==="live"?"LIVE MAGDEBURG":"CACHED LIVE DATA";$("liveMessage").textContent=source==="live"?"Latest live regional reading received successfully.":"Connection unavailable; displaying the last valid regional reading.";
    syncWeatherVisual();
    window.constructionTwin?.applyLiveBaseline(derive(c));
  }
  async function refresh(){
    if($("dataMode").value!=="live")return;setStatus("CONNECTING","neutral");$("refreshLiveData").disabled=true;
    try{const response=await fetch(`${API}&_=${Date.now()}`,{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(!valid(data.current))throw new Error("Invalid weather packet");localStorage.setItem(CACHE_KEY,JSON.stringify(data.current));render(data.current,"live")}
    catch(error){const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");if(valid(cached))render(cached,"cache");else{setStatus("CONNECTION ERROR","live-error");$("activeDataMode").textContent="SIMULATION FALLBACK";$("liveMessage").textContent="Live weather is unavailable; the laboratory continues safely in simulation mode."}}
    finally{$("refreshLiveData").disabled=false;nextRefreshAt=Date.now()+REFRESH_MS}
  }
  function changeMode(){
    const live=$("dataMode").value==="live";$("refreshLiveData").disabled=!live;
    if(live)refresh();else{window.constructionTwin?.restoreSimulationBaseline();setStatus("SIMULATION MODE","neutral");$("activeDataMode").textContent="VIRTUAL IOT";$("liveMessage").textContent="Live weather is paused. Virtual laboratory baselines are active.";$("siteVisual").classList.remove("weather-wet","weather-windy","weather-night")}
  }
  $("refreshLiveData").addEventListener("click",refresh);$("dataMode").addEventListener("change",changeMode);
  timer=setInterval(()=>{syncWeatherVisual();if(nextRefreshAt){const seconds=Math.max(0,Math.ceil((nextRefreshAt-Date.now())/1000));$("nextRefresh").textContent=`Next refresh: ${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;if(seconds===0&&$("dataMode").value==="live")refresh()}},1000);
  window.addEventListener("online",()=>{if($("dataMode").value==="live")refresh()});
  changeMode();
})();
