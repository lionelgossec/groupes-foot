(() => {
'use strict';
const KEY='groupes-foot-v18';
const DEFAULT_LEVELS=[
{id:4,name:'Confirmés',emoji:'🟢',weight:4},
{id:3,name:'Intermédiaire +',emoji:'🔵',weight:3},
{id:2,name:'Intermédiaire −',emoji:'🟡',weight:2},
{id:1,name:'Débutants',emoji:'🔴',weight:1}
];
const LEVEL_COLORS=['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16','#f97316','#64748b'];
const GROUP_COLORS=['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'];
const DEFAULT_PLAYERS=[["Adam OA",4],["Perlin",4],["Nelya",4],["Esteban",4],["Thiago P",4],["Nathan",4],["Raphaël",4],["Amir",4],["Eden",4],["Landry",4],["Léo",3],["Lucas G",3],["Louka",3],["Emir",3],["Siméon",3],["Noa",3],["Adam EG",3],["Enzo",3],["Noé",3],["Naïm B",3],["Ezel",3],["Timéo",3],["Théo D",3],["Warren",2],["Naïm S",2],["Louis",2],["Elyn",2],["Robin",2],["Zayd",2],["Ambre",2],["Noah",1],["Marin",1],["Lucas T",1],["Dino",1],["Khalis",1],["Ethan",1],["Théo W",1],["Clarence",1],["Younoussa",1],["Thiago W",1]];
const DEFAULT_GOALKEEPERS=new Set([]);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function freshState(){return {players:DEFAULT_PLAYERS.map((x,i)=>({id:i+1,name:x[0],level:x[1],goalkeeper:DEFAULT_GOALKEEPERS.has(x[0]),defender:false,attacker:false,winger:false})),levels:DEFAULT_LEVELS.map(x=>({...x})),rules:[],history:[],postes:{enabled:false,defender:false,attacker:false,winger:false}}}
let root;
let state;
let currentFolderId=null;
function normalizeFolderData(data){
  data=data&&typeof data==='object'?data:freshState();
  data.players=Array.isArray(data.players)?data.players:[];
  data.levels=Array.isArray(data.levels)&&data.levels.length?data.levels:DEFAULT_LEVELS.map(x=>({...x}));
  const usedColors=new Set(); data.levels.forEach((l,i)=>{if(!LEVEL_COLORS.includes(l.color)||usedColors.has(l.color)){const free=LEVEL_COLORS.find(c=>!usedColors.has(c));l.color=free||LEVEL_COLORS[i%LEVEL_COLORS.length];} usedColors.add(l.color);});
  data.rules=Array.isArray(data.rules)?data.rules:[];
  data.history=Array.isArray(data.history)?data.history:[];
  data.players.forEach(p=>{
    if(!data.levels.some(l=>l.id===p.level))p.level=data.levels[0].id;
    if(typeof p.goalkeeper!=='boolean')p.goalkeeper=false;
    if(typeof p.defender!=='boolean')p.defender=false;
    if(typeof p.attacker!=='boolean')p.attacker=false;
    if(typeof p.winger!=='boolean')p.winger=false;
    if(typeof p.locked!=='boolean')p.locked=false;
  });
  return data;
}
function loadRoot(){
  let raw=null; try{raw=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
  if(raw&&Array.isArray(raw.folders)){
    root=raw; root.folders=root.folders.map(f=>({id:f.id,name:f.name||'Groupe',data:normalizeFolderData(f.data)}));
  }else{
    const legacy=normalizeFolderData(raw&&Array.isArray(raw.players)?raw:freshState());
    root={folders:[{id:Date.now(),name:'U9',data:legacy}],currentFolderId:null};
  }
  if(!root.folders.length){root.folders=[{id:Date.now(),name:'U9',data:freshState()}];}
  currentFolderId=root.currentFolderId&&root.folders.some(f=>f.id===root.currentFolderId)?root.currentFolderId:null;
  state=currentFolderId?root.folders.find(f=>f.id===currentFolderId).data:null;
  localStorage.setItem(KEY,JSON.stringify(root));
}
function saveRoot(){root.currentFolderId=currentFolderId;localStorage.setItem(KEY,JSON.stringify(root))}
function save(){if(!currentFolderId)return;const f=root.folders.find(x=>x.id===currentFolderId);if(f)f.data=state;saveRoot()}
loadRoot();
let editingId=null, currentGroups=null, manualPool=[], currentPool=[], applyRestrictions=true, historyEditingId=null, manualSort='name';
const els={
 pages:$$('.page'), nav:$$('.nav-btn'), btnHome:$('#btnHome'), btnAddFolder:$('#btnAddFolder'), folderList:$('#folderList'), playerCount:$('#playerCount'), playerSearch:$('#playerSearch'), playerList:$('#playerList'),
 btnAddPlayer:$('#btnAddPlayer'),btnImportPlayers:$('#btnImportPlayers'),btnExportPlayers:$('#btnExportPlayers'),playerImportFile:$('#playerImportFile'), dialog:$('#playerDialog'), form:$('#playerForm'), dialogTitle:$('#dialogTitle'), playerName:$('#playerName'), playerLevel:$('#playerLevel'), playerGoalkeeper:$('#playerGoalkeeper'), btnCancelDialog:$('#btnCancelDialog'),
 distName:$('#distName'),distType:$('#distType'),groupCount:$('#groupCount'),attendance:$('#attendance'),attendanceCount:$('#attendanceCount'),btnAll:$('#btnAll'),btnNone:$('#btnNone'),btnGenerate:$('#btnGenerate'),result:$('#result'),
 levelsSettings:$('#levelsSettings'),newLevelName:$('#newLevelName'),newLevelEmoji:$('#newLevelEmoji'),postesEnabled:$('#postesEnabled'),postesOptions:$('#postesOptions'),postesDefender:$('#postesDefender'),postesAttacker:$('#postesAttacker'),postesWinger:$('#postesWinger'),playerDefender:$('#playerDefender'),playerAttacker:$('#playerAttacker'),playerWinger:$('#playerWinger'),playerPostesBox:$('#playerPostesBox'),btnAddLevel:$('#btnAddLevel'),ruleA:$('#ruleA'),ruleB:$('#ruleB'),btnAddRule:$('#btnAddRule'),rulesList:$('#rulesList'),applyRestrictions:$('#applyRestrictions'),manualSort:$('#manualSort'),manualTargetGroup:$('#manualTargetGroup'),historyList:$('#historyList')
};
function level(id){return state.levels.find(l=>l.id===Number(id))||state.levels[0]}
function levelLabel(id){const l=level(id);return `${l?.emoji||'⚪'} ${esc(l?.name||'Niveau')}`}
function showPage(page){els.pages.forEach(x=>x.classList.toggle('active',x.id===`page-${page}`));els.nav.forEach(x=>x.classList.toggle('active',x.dataset.page===page));if(page==='home')renderHome();if(page==='create'&&state)renderCreate();if(page==='settings'&&state)renderSettings();if(page==='history'&&state)renderHistory();if(page!=='home'&&!state){page='home';els.pages.forEach(x=>x.classList.toggle('active',x.id==='page-home'));renderHome()}}
function renderHome(){
  if(!els.folderList)return;
  els.folderList.innerHTML=root.folders.map(f=>{
    const d=normalizeFolderData(f.data);
    return `<div class="folder-card" data-open-folder="${f.id}">
      <div class="folder-head"><h2>⚽ ${esc(f.name)}</h2><button type="button" class="danger small-btn" data-delete-folder="${f.id}" title="Supprimer ce groupe">🗑️</button></div>
      <div class="muted">${d.players.length} joueur${d.players.length>1?'s':''} • ${d.history.length} répartition${d.history.length>1?'s':''}</div>
      <div class="folder-open">Ouvrir →</div>
    </div>`;
  }).join('')||'<div class="folder-empty">Aucun groupe. Clique sur ＋ Nouveau groupe pour commencer.</div>';
}
function deleteFolder(id){
  const f=root.folders.find(x=>x.id===Number(id)); if(!f)return;
  if(!confirm(`Supprimer le groupe « ${f.name} » ?\n\nSes joueurs, paramètres et historiques seront supprimés de cet appareil.`))return;
  root.folders=root.folders.filter(x=>x.id!==f.id);
  if(currentFolderId===f.id){currentFolderId=null;state=null;root.currentFolderId=null;}
  if(!root.folders.length){const id2=Date.now();root.folders.push({id:id2,name:'U9',data:freshState()});}
  saveRoot(); renderHome();
  if(!currentFolderId) showPage('home');
}
function openFolder(id){
  const f=root.folders.find(x=>x.id===Number(id)); if(!f)return;
  currentFolderId=f.id; state=normalizeFolderData(f.data); root.currentFolderId=currentFolderId; saveRoot();
  currentGroups=null; manualPool=[]; currentPool=[]; manualSelectedIds.clear();
  showPage('players'); renderPlayers(); renderCreate(); renderSettings(); renderHistory();
}
function addFolder(){
  const name=prompt('Nom du groupe (ex. U9, U7...)','U9'); if(name===null)return; const clean=name.trim(); if(!clean){alert('Indique un nom.');return}
  const id=Date.now()+Math.floor(Math.random()*1000); root.folders.push({id,name:clean,data:freshState()}); saveRoot(); renderHome(); openFolder(id);
}
function renderPlayers(){
  els.playerCount.textContent=`(${state.players.length})`;
  const q=normalizeImportName(els.playerSearch?.value||'').toLocaleLowerCase('fr-FR');
  const players=[...state.players].filter(p=>!q||p.name.toLocaleLowerCase('fr-FR').includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
  const counts=state.levels.map(l=>({l,n:state.players.filter(p=>p.level===l.id).length}));
  const summary=`<div class="level-summary"><b>Effectif par niveau</b><div class="level-summary-list">${counts.map(x=>`<span class="level-summary-item"><i style="background:${x.l.color}"></i>${esc(x.l.name)} <strong>${x.n}</strong></span>`).join('')}<span class="level-summary-total">Total <strong>${state.players.length}</strong></span></div></div>`;
  els.playerList.innerHTML=summary+players.map(p=>`<div class="player"><div class="left"><span class="level-dot" style="background:${level(p.level)?.color||LEVEL_COLORS[0]}" title="${esc(level(p.level)?.name||'Niveau')}"></span><b>${esc(p.name)}</b><span class="muted">${esc(level(p.level)?.name||'Niveau')}</span></div><button type="button" data-edit="${p.id}">Modifier</button></div>`).join('')||summary+'<div class="empty">Aucun joueur correspondant.</div>';
}

function normalizeImportName(v){return String(v??'').trim().replace(/\s+/g,' ')}
function findLevelByName(name){
  const q=normalizeImportName(name).toLocaleLowerCase('fr-FR');
  return state.levels.find(l=>normalizeImportName(l.name).toLocaleLowerCase('fr-FR')===q);
}
function parseCSVLine(line, sep){
  const out=[];let cur='';let quoted=false;
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(c==='"'){ if(quoted && line[i+1]==='"'){cur+='"';i++;} else quoted=!quoted; }
    else if(c===sep && !quoted){out.push(cur.trim());cur='';}
    else cur+=c;
  }
  out.push(cur.trim()); return out;
}
function normalizeHeader(v){
  return normalizeImportName(v).toLocaleLowerCase('fr-FR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[?']/g,'').trim();
}
function parseImportText(text){
  text=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(!text)return [];
  const lines=text.split('\n').filter(x=>x.trim());
  const first=lines[0];
  const sep=first.includes(';')?';':first.includes('\t')?'\t':',';
  const rawHeaders=parseCSVLine(first,sep);
  const normalized=rawHeaders.map(normalizeHeader);
  const headerAliases={
    name:['nom prenom','nom','prenom','joueur','joueurs','name'],
    level:['niveau','level'],
    keeper:['gardien','peut jouer gardien','goalkeeper','keeper'],
    defender:['defenseur','peut jouer defenseur','defender'],
    attacker:['attaquant','peut jouer attaquant','attacker'],
    winger:['joueur de cote','peut jouer de cote','cote','ailier','winger']
  };
  const hasHeader=Object.values(headerAliases).some(list=>normalized.some(h=>list.includes(h)));
  const headers=hasHeader?normalized:null;
  const start=hasHeader?1:0;
  const idxOf=(aliases)=>headers?headers.findIndex(h=>aliases.includes(h)):-1;
  const get=(cells,aliases,fallback='')=>{const i=idxOf(aliases);return i>=0?cells[i]??fallback:fallback};
  return lines.slice(start).map(line=>{
    const c=parseCSVLine(line,sep);
    if(!headers){
      // Minimal files: one column = name; two columns = name + level; extra columns follow the standard order.
      return {name:normalizeImportName(c[0]),levelName:normalizeImportName(c[1]||''),keeper:c[2]||'',defender:c[3]||'',attacker:c[4]||'',winger:c[5]||''};
    }
    return {
      name:normalizeImportName(get(c,headerAliases.name,c[0]||'')),
      levelName:normalizeImportName(get(c,headerAliases.level,'')),
      keeper:get(c,headerAliases.keeper,''),
      defender:get(c,headerAliases.defender,''),
      attacker:get(c,headerAliases.attacker,''),
      winger:get(c,headerAliases.winger,'')
    };
  }).filter(x=>x.name);
}
function keeperValue(v){return /^(oui|o|yes|y|1|true|x|✓|🧤)$/i.test(normalizeImportName(v));}
function importPlayersText(text){
  const rows=parseImportText(text); if(!rows.length){alert('Aucun joueur reconnu dans le fichier.');return;}
  let added=0,updated=0,unknownLevels=new Set(),defaultedLevels=0;
  const byName=new Map(state.players.map(p=>[normalizeImportName(p.name).toLocaleLowerCase('fr-FR'),p]));
  rows.forEach(r=>{
    const key=r.name.toLocaleLowerCase('fr-FR');
    let p=byName.get(key);
    if(p){updated++;}else{
      p={id:Date.now()+Math.floor(Math.random()*1000000),name:r.name,level:state.levels[0]?.id||1,goalkeeper:false,defender:false,attacker:false,winger:false};
      state.players.push(p);byName.set(key,p);added++;
    }
    if(r.levelName){
      const l=findLevelByName(r.levelName);
      if(l)p.level=l.id;else unknownLevels.add(r.levelName);
    }else{
      defaultedLevels++;
    }
    if(String(r.keeper||'').trim()!=='')p.goalkeeper=keeperValue(r.keeper);
    if(String(r.defender||'').trim()!=='')p.defender=keeperValue(r.defender);
    if(String(r.attacker||'').trim()!=='')p.attacker=keeperValue(r.attacker);
    if(String(r.winger||'').trim()!=='')p.winger=keeperValue(r.winger);
  });
  save();renderPlayers();renderCreate();renderSettings();
  let msg=`Import terminé : ${added} nouveau${added>1?'x':''} joueur${added>1?'s':''}, ${updated} joueur${updated>1?'s':''} déjà présent${updated>1?'s':''} mis à jour.`;
  if(defaultedLevels)msg+=`\\n\\n${defaultedLevels} joueur${defaultedLevels>1?'s':''} sans niveau : niveau « ${state.levels[0]?.name||'par défaut'} » utilisé.`;
  if(unknownLevels.size)msg+=`\\n\\nNiveau${unknownLevels.size>1?'x':''} non reconnu${unknownLevels.size>1?'s':''} : ${[...unknownLevels].join(', ')}. Ces joueurs gardent leur niveau actuel.`;
  alert(msg);
}
function importPlayersFile(file){const reader=new FileReader();reader.onload=()=>importPlayersText(reader.result);reader.onerror=()=>alert('Impossible de lire ce fichier.');reader.readAsText(file,'UTF-8');}
function exportPlayersCSV(){
  const rows=[['Nom Prénom','Niveau','Gardien','Défenseur','Attaquant','Joueur de côté'],
    ...[...state.players].sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'}))
      .map(p=>[p.name,level(p.level)?.name||'',p.goalkeeper?'Oui':'Non',p.defender?'Oui':'Non',p.attacker?'Oui':'Non',p.winger?'Oui':'Non'])];
  const csv='\uFEFF'+rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='groupes-foot-joueurs.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function renderLevelSelect(select,selected){select.innerHTML=state.levels.map(l=>`<option value="${l.id}" style="color:${l.color}">● ${l.emoji} ${esc(l.name)}</option>`).join('');if(selected!=null)select.value=String(selected)}
function renderAttendance(){const checked=new Set($$('#attendance input[type=checkbox]:checked').map(x=>Number(x.dataset.id)));const sorted=[...state.players].sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));els.attendance.innerHTML=sorted.map(p=>`<label class="check"><input type="checkbox" data-id="${p.id}" ${checked.size===0||checked.has(p.id)?'checked':''}><span class="level-dot" style="background:${level(p.level)?.color||LEVEL_COLORS[0]}"></span><b>${esc(p.name)}</b><span class="muted">${esc(level(p.level)?.name||'')}</span></label>`).join('');updateAttendanceCount()}
function updateAttendanceCount(){els.attendanceCount.textContent=`(${$$('#attendance input:checked').length}/${state.players.length})`}
function fillGroupCount(){const old=Number(els.groupCount.value)||4;els.groupCount.innerHTML='';for(let i=2;i<=Math.min(10,Math.max(2,state.players.length));i++)els.groupCount.insertAdjacentHTML('beforeend',`<option value="${i}">${i} groupes</option>`);els.groupCount.value=String(Math.min(old,Math.min(10,state.players.length)))}
function renderCreate(){fillGroupCount();renderAttendance()}
function autoWeightLevels(){
 const ordered=[...state.levels]; ordered.forEach((l,i)=>{l.weight=ordered.length-i;});
 const used=new Set(); ordered.forEach((l,i)=>{if(!LEVEL_COLORS.includes(l.color)||used.has(l.color)){const free=LEVEL_COLORS.find(c=>!used.has(c)); if(free) l.color=free;} used.add(l.color);});
}
function renderSettings(){
 autoWeightLevels();
 els.levelsSettings.innerHTML=state.levels.map((l,i)=>`<div class="setting-row"><span class="level-dot" style="background:${l.color||LEVEL_COLORS[0]}" title="${esc(l.name)}"></span><input data-level-name="${l.id}" value="${esc(l.name)}"><span class="weight-auto" title="Calculé automatiquement">${l.weight}</span><button type="button" data-level-up="${l.id}" ${i===0?'disabled':''}>↑</button><button type="button" data-level-down="${l.id}" ${i===state.levels.length-1?'disabled':''}>↓</button><button type="button" data-delete-level="${l.id}">Supprimer</button></div>`).join('');
 els.newLevelWeight?.remove();
 const opts=state.players.slice().sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'})).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');els.ruleA.innerHTML=opts;els.ruleB.innerHTML=opts;
 if(els.postesEnabled){els.postesEnabled.checked=!!state.postes.enabled;els.postesOptions.hidden=!state.postes.enabled;els.postesDefender.checked=!!state.postes.defender;els.postesAttacker.checked=!!state.postes.attacker;els.postesWinger.checked=!!state.postes.winger;}
 els.rulesList.innerHTML=state.rules.length?state.rules.map((r,i)=>{const a=state.players.find(p=>p.id===Number(r[0])),b=state.players.find(p=>p.id===Number(r[1]));return a&&b?`<div class="rule">🚫 <b>${esc(a.name)}</b> + <b>${esc(b.name)}</b><button type="button" data-delete-rule="${i}">Supprimer</button></div>`:''}).join(''):'<div class="empty">Aucune règle de séparation.</div>';
}
function selectedPlayers(){const ids=new Set($$('#attendance input:checked').map(x=>Number(x.dataset.id)));return state.players.filter(p=>ids.has(p.id))}
function violates(group,p){if(!applyRestrictions)return false;return group.some(x=>state.rules.some(r=>(Number(r[0])===x.id&&Number(r[1])===p.id)||(Number(r[1])===x.id&&Number(r[0])===p.id)))}
function scoreGroup(g){return g.reduce((s,p)=>s+(Number(level(p.level)?.weight)||0),0)}
function groupKeyPair(a,b){return a<b?`${a}-${b}`:`${b}-${a}`}
function restrictionPenalty(groups){if(!applyRestrictions)return 0;let bad=0;for(const g of groups){for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++)if(state.rules.some(r=>groupKeyPair(Number(r[0]),Number(r[1]))===groupKeyPair(g[i].id,g[j].id)))bad++;}return bad}
function levelMixPenalty(g){if(!g.length)return 0;const weights=g.map(p=>Number(level(p.level)?.weight)||0);const counts={};g.forEach(p=>{counts[p.level]=(counts[p.level]||0)+1});const distinct=Object.keys(counts).length;return (distinct-1)*10 + weights.reduce((s,w)=>s+Math.abs(w-(weights.reduce((a,b)=>a+b,0)/weights.length)),0)}
function goalkeeperPenalty(groups){
  const keeperGroups=groups.map(g=>g.filter(p=>p.goalkeeper));
  const total=keeperGroups.reduce((s,g)=>s+g.length,0);
  if(total===0)return 0;
  const counts=keeperGroups.map(g=>g.length);
  const strengths=keeperGroups.map(g=>g.reduce((s,p)=>s+(Number(level(p.level)?.weight)||0),0));
  const avgCount=total/groups.length;
  const avgStrength=strengths.reduce((a,b)=>a+b,0)/groups.length;
  let penalty=counts.reduce((s,c)=>s+Math.abs(c-avgCount),0)*18;
  penalty+=strengths.reduce((s,x)=>s+Math.abs(x-avgStrength),0)*14;
  if(total>=groups.length) penalty+=counts.filter(c=>c===0).length*10000;
  return penalty;
}
function levelCountPenalty(groups){
  const ids=state.levels.map(l=>l.id);
  let pen=0;
  for(const id of ids){
    const counts=groups.map(g=>g.filter(p=>p.level===id).length);
    const total=counts.reduce((a,b)=>a+b,0);
    if(!total)continue;
    const avg=total/groups.length;
    pen+=counts.reduce((s,c)=>s+Math.abs(c-avg),0)*55;
  }
  return pen;
}
function positionPenalty(groups){
  if(!state.postes?.enabled)return 0;
  const defs=state.postes.defender?groups.map(g=>g.filter(p=>p.defender).length):[];
  const atts=state.postes.attacker?groups.map(g=>g.filter(p=>p.attacker).length):[];
  const wings=state.postes.winger?groups.map(g=>g.filter(p=>p.winger).length):[];
  let pen=0;
  for(const counts of [defs,atts,wings]){
    if(!counts.length)continue;
    const total=counts.reduce((a,b)=>a+b,0);
    const avg=total/groups.length;
    pen+=counts.reduce((s,c)=>s+Math.abs(c-avg),0)*80;
    if(total>=groups.length)pen+=counts.filter(c=>c===0).length*10000;
  }
  return pen;
}
function balancedPenalty(groups){
  const scores=groups.map(scoreGroup);
  const avg=scores.reduce((a,b)=>a+b,0)/groups.length;
  return scores.reduce((s,x)=>s+(x-avg)**2,0)*18
    +levelCountPenalty(groups)*1
    +goalkeeperPenalty(groups)*1
    +positionPenalty(groups);
}
function buildStratifiedCandidate(players,n,seed=0){
  const gs=Array.from({length:n},()=>[]);
  const byLevel=new Map();
  for(const p of players){if(!byLevel.has(p.level))byLevel.set(p.level,[]);byLevel.get(p.level).push(p)}
  const levels=[...byLevel.keys()].sort((a,b)=>(Number(level(b)?.weight)||0)-(Number(level(a)?.weight)||0));
  let cursor=seed%n;
  for(const lid of levels){
    const bucket=[...byLevel.get(lid)].sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
    // Rotate the bucket between groups so equal-level players are spread as evenly as possible.
    for(let i=0;i<bucket.length;i++){
      let best=[]; let minCount=Infinity;
      for(let k=0;k<n;k++){
        const gi=(cursor+i+k)%n;
        const c=gs[gi].filter(p=>p.level===lid).length;
        if(c<minCount){minCount=c;best=[gi]}else if(c===minCount)best.push(gi);
      }
      const gi=best[(seed+i)%best.length];
      gs[gi].push(bucket[i]);
    }
    cursor=(cursor+bucket.length)%n;
  }
  return gs;
}
function levelOrder(){
  return [...state.levels].sort((a,b)=>Number(b.weight||0)-Number(a.weight||0) || a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));
}
function generateLevelGroups(players,n){
  const ordered=[...players].sort((a,b)=>{
    const wa=Number(level(a.level)?.weight)||0, wb=Number(level(b.level)?.weight)||0;
    return wb-wa || a.name.localeCompare(b.name,'fr',{sensitivity:'base'});
  });
  const targets=targetGroupSizes(ordered.length,n);
  const groups=[];let cursor=0;
  for(const size of targets){groups.push(ordered.slice(cursor,cursor+size));cursor+=size;}
  // Resolve separation rules with swaps that preserve exact group sizes and disturb level order minimally.
  for(let pass=0;pass<groups.length*4;pass++){
    let found=false;
    for(let gi=0;gi<groups.length;gi++){
      for(let i=0;i<groups[gi].length;i++)for(let j=i+1;j<groups[gi].length;j++){
        const a=groups[gi][i],b=groups[gi][j];
        if(!state.rules.some(r=>groupKeyPair(Number(r[0]),Number(r[1]))===groupKeyPair(a.id,b.id)))continue;
        let best=null;
        for(let gj=0;gj<groups.length;gj++)if(gj!==gi){
          for(let k=0;k<groups[gj].length;k++){
            const q=groups[gj][k];
            const ngi=groups[gi].map((x,ix)=>ix===i?q:ix===j?b:x);
            const ngj=groups[gj].map((x,ix)=>ix===k?a:x);
            if(restrictionPenalty([ngi,ngj])===0){
              const cost=Math.abs((Number(level(a.level)?.weight)||0)-(Number(level(q.level)?.weight)||0))*100+Math.abs(gi-gj);
              if(!best||cost<best.cost)best={gj,k,cost};
            }
          }
        }
        if(best){
          const q=groups[best.gj][best.k];groups[gi][i]=q;groups[best.gj][best.k]=a;found=true;break;
        }
      }
      if(found)break;
    }
    if(!found)break;
  }
  return restrictionPenalty(groups)===0?groups:null;
}
function levelGoalkeeperWarnings(groups){
  const total=groups.reduce((s,g)=>s+g.filter(p=>p.goalkeeper).length,0);
  if(!total)return '';
  const counts=groups.map(g=>g.filter(p=>p.goalkeeper).length);
  const labels=counts.map((c,i)=>`Groupe ${i+1}: ${c}`).join(' • ');
  if(Math.max(...counts)-Math.min(...counts)>1){
    return `<div class="warning">🧤 <b>Gardiens déséquilibrés</b> — ${labels}<br><span class="small">En groupes de niveau, cela ne modifie pas le classement des joueurs.</span></div>`;
  }
  return `<div class="info">🧤 Gardiens — ${labels}</div>`;
}
function targetGroupSizes(total,n){
  const base=Math.floor(total/n), extra=total%n;
  return Array.from({length:n},(_,i)=>base+(i<extra?1:0));
}
function repairCoverage(groups,n){
  if(!groups.length)return groups;
  const cats=[];
  if(state.postes?.enabled&&state.postes.defender)cats.push(p=>p.defender);
  if(state.postes?.enabled&&state.postes.attacker)cats.push(p=>p.attacker);
  if(state.postes?.enabled&&state.postes.winger)cats.push(p=>p.winger);
  cats.push(p=>p.goalkeeper);
  for(const qualifies of cats){
    const total=groups.reduce((s,g)=>s+g.filter(qualifies).length,0);
    if(total<groups.length)continue;
    for(let pass=0;pass<groups.length*2;pass++){
      const deficit=groups.findIndex(g=>g.filter(qualifies).length===0);
      if(deficit<0)break;
      let best=null;
      for(let src=0;src<groups.length;src++){
        if(src===deficit||groups[src].filter(qualifies).length<2)continue;
        for(let si=0;si<groups[src].length;si++){
          const mover=groups[src][si]; if(!qualifies(mover))continue;
          for(let di=0;di<groups[deficit].length;di++){
            const swap=groups[deficit][di]; if(qualifies(swap))continue;
            const ngs=groups.map(g=>[...g]);
            ngs[src][si]=swap; ngs[deficit][di]=mover;
            if(restrictionPenalty(ngs)>0)continue;
            const cost=balancedPenalty(ngs);
            if(!best||cost<best.cost)best={ngs,cost};
          }
        }
      }
      if(!best)break;
      groups.splice(0,groups.length,...best.ngs);
    }
  }
  return groups;
}
function generateBalancedGroups(players,n,opts=null){
  // In homogeneous mode, numerical balance is a hard constraint.
  // First determine the only acceptable group sizes (difference max 1), then
  // optimize levels, goalkeeper distribution and restrictions inside those sizes.
  const targets=opts?.reserved?opts.reserved:targetGroupSizes(players.length,n);
  let best=null,bestPenalty=Infinity;
  const attempts=Math.min(4000,Math.max(800,n*260));
  const baseOrder=[...players].sort((a,b)=>{
    const wa=Number(level(a.level)?.weight)||0, wb=Number(level(b.level)?.weight)||0;
    return wb-wa || a.name.localeCompare(b.name,'fr',{sensitivity:'base'});
  });

  for(let a=0;a<attempts;a++){
    const gs=Array.from({length:n},()=>[]);
    const remaining=[...targets];
    // Keep stronger players and keepers distributed, while randomising ties so
    // repeated generations can explore different valid solutions.
    const order=[...baseOrder].sort((x,y)=>{
      const wx=Number(level(x.level)?.weight)||0, wy=Number(level(y.level)?.weight)||0;
      const gx=x.goalkeeper?1:0, gy=y.goalkeeper?1:0;
      return (wy-wx)*20+(gy-gx)*3+(Math.random()-.5)*8;
    });

    for(const p of order){
      const candidates=[];
      for(let gi=0;gi<n;gi++){
        if(remaining[gi]<=0)continue;
        const g=gs[gi];
        if(violates(g,p))continue;
        const score=scoreGroup(g);
        const keeperCount=g.filter(x=>x.goalkeeper).length;
        const sameLevel=g.filter(x=>x.level===p.level).length;
        const postCount=(state.postes?.defender&&p.defender?g.filter(x=>x.defender).length:0)
          +(state.postes?.attacker&&p.attacker?g.filter(x=>x.attacker).length:0)
          +(state.postes?.winger&&p.winger?g.filter(x=>x.winger).length:0);
        candidates.push({gi,
          cost: score*18 + keeperCount*(p.goalkeeper?120:8) + sameLevel*10 + postCount*25 + (targets[gi]-remaining[gi])*0.2
        });
      }
      if(!candidates.length){
        // Allow a temporary restriction conflict; the final penalty will reject
        // it unless no conflict-free solution exists.
        for(let gi=0;gi<n;gi++)if(remaining[gi]>0)candidates.push({gi,cost:scoreGroup(gs[gi])*18});
      }
      candidates.sort((x,y)=>x.cost-y.cost);
      const pick=candidates[Math.floor(Math.random()*Math.min(3,candidates.length))];
      gs[pick.gi].push(p); remaining[pick.gi]--;
    }

    if(gs.some((g,i)=>g.length!==targets[i]))continue;
    if(restrictionPenalty(gs)>0)continue;
    repairCoverage(gs,n);
    if(gs.some((g,i)=>g.length!==targets[i])||restrictionPenalty(gs)>0)continue;
    const pen=balancedPenalty(gs);
    if(pen<bestPenalty){best=gs.map(g=>[...g]);bestPenalty=pen}
  }
  return best;
}
function generateGroups(players,n,type){
  if(type==='manual'){manualPool=[...players]; return Array.from({length:n},()=>[])}
  if(type==='level')return generateLevelGroups(players,n);
  return generateBalancedGroups(players,n);
}
function levelIndex(id){const i=state.levels.findIndex(l=>l.id===Number(id));return i<0?0:i}
function sortPlayersForDisplay(g){return [...g].sort((a,b)=>{const wa=Number(level(a.level)?.weight)||0,wb=Number(level(b.level)?.weight)||0;return wb-wa||a.name.localeCompare(b.name,'fr',{sensitivity:'base'})})}
function groupMarkup(groups){return groups.map((g,i)=>{const gc=GROUP_COLORS[i%GROUP_COLORS.length];return `<div class="group" style="--group-color:${gc}"><h3><span class="group-dot"></span>Groupe ${i+1} <span class="muted">(${g.length})</span></h3><ul>${sortPlayersForDisplay(g).map(p=>{const l=level(p.level);return `<li class="${p.locked?'locked-player':''}"><span class="player-name"><span class="player-text"><span class="level-dot" style="background:${l?.color||LEVEL_COLORS[0]}" title="${esc(l?.name||'Niveau')}"></span>${esc(p.name)}</span><span class="player-icons">${p.goalkeeper?' <span class="keeper" title="Peut jouer gardien">🧤</span>':''}${state.postes?.enabled?`${p.defender?' <span title="Défenseur">🛡️</span>':''}${p.attacker?' <span title="Attaquant">⚽</span>':''}${p.winger?' <span title="Côté">↔️</span>':''}`:''}${p.locked?' <span class="lock-mark" title="Joueur verrouillé">🔒</span>':''}</span></span><span class="player-actions"><button type="button" class="mini-move" data-move-player="${p.id}" title="Déplacer">↔</button><button type="button" class="mini-move" data-lock-player="${p.id}" title="${p.locked?'Déverrouiller':'Verrouiller'}">${p.locked?'🔒':'🔓'}</button><button type="button" class="mini-move danger-mini" data-remove-player="${p.id}" title="Retirer du groupe">✕</button></span></li>`}).join('')}</ul></div>`}).join('')}
function playerSymbols(p){return `${p.goalkeeper?' 🧤':''}${state.postes?.enabled?`${p.defender?' 🛡️':''}${p.attacker?' ⚽':''}${p.winger?' ↔️':''}`:''}${p.locked?' 🔒':''}`}
function exportText(groups){return groups.map((g,i)=>`Groupe ${i+1}\n${sortPlayersForDisplay(g).map(p=>`${p.name}${playerSymbols(p)}`).join('\n')}`).join('\n\n')}
function exportGroupsPNG(){if(!currentGroups)return;const groups=currentGroups;const cardW=360, pad=28, titleH=70, lineH=34, gap=20, cols=Math.min(2,groups.length), rows=Math.ceil(groups.length/cols);const heights=groups.map(g=>titleH+Math.max(1,g.length)*lineH+pad);const rowHeights=[];for(let r=0;r<rows;r++)rowHeights.push(Math.max(...groups.slice(r*cols,(r+1)*cols).map(g=>titleH+Math.max(1,g.length)*lineH+pad)));const canvas=document.createElement('canvas');canvas.width=cols*cardW+(cols+1)*gap;canvas.height=70+rowHeights.reduce((a,b)=>a+b,0)+(rows+1)*gap;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#111827';ctx.font='bold 28px Arial';ctx.fillText(els.distName.value.trim()||'Répartition',gap,44);let y=70+gap;groups.forEach((g,i)=>{const col=i%cols,row=Math.floor(i/cols);let yy=70+gap+rowHeights.slice(0,row).reduce((a,b)=>a+b,0)+row*gap;let x=gap+col*(cardW+gap);ctx.fillStyle='#f8fafc';ctx.strokeStyle=['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][i%10];ctx.lineWidth=4;ctx.roundRect(x,yy,cardW,rowHeights[row],14,14);ctx.fill();ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 21px Arial';ctx.fillText(`Groupe ${i+1} (${g.length})`,x+18,yy+34);ctx.fillStyle='#111827';ctx.font='18px Arial';sortPlayersForDisplay(g).forEach((p,j)=>{const l=level(p.level),c=['#16a34a','#2563eb','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][levelIndex(p.level)%10];ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+24,yy+58+j*lineH,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111827';ctx.fillText(`${p.name}${p.goalkeeper?' 🧤':''}`,x+42,yy+64+j*lineH)})});canvas.toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(els.distName.value.trim()||'repartition').replace(/[^a-z0-9_-]+/gi,'_')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)})}
function printGroups(){if(!currentGroups)return;const title=els.distName.value.trim()||'Répartition';const w=window.open('','_blank');if(!w){alert('Autorise les fenêtres pop-up pour imprimer.');return}w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.g{border:3px solid #2563eb;border-radius:12px;padding:12px}.g h2{margin:0 0 10px;font-size:18px}.p{padding:4px 0}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px} @media print{body{padding:10px}.grid{gap:10px}}</style></head><body><h1>${esc(title)}</h1><div class="grid">${groups.map((g,i)=>`<div class="g" style="border-color:${['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][i%10]}"><h2>Groupe ${i+1} (${g.length})</h2>${sortPlayersForDisplay(g).map(p=>`<div class="p"><span class="dot" style="background:${['#16a34a','#2563eb','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][levelIndex(p.level)%10]}"></span>${esc(p.name)}${p.goalkeeper?' 🧤':''}</div>`).join('')}</div>`).join('')}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}
function shareGroups(){if(!currentGroups)return;const title=els.distName.value.trim()||'Répartition';const text=`${title}

${exportText(currentGroups)}`;if(navigator.share){navigator.share({title,text}).catch(()=>{})}else{navigator.clipboard?.writeText(text);alert('La répartition a été copiée dans le presse-papiers.')}}
function playerLine(p,clickAttr=''){const l=level(p.level);return `<button type="button" class="manual-player ${manualSelectedIds.has(p.id)?'selected':''}" ${clickAttr}><span class="level-dot" style="background:${l?.color||LEVEL_COLORS[0]}" title="${esc(l?.name||'Niveau')}"></span><span>${esc(p.name)}</span>${p.goalkeeper?' <span class="keeper" title="Peut jouer gardien">🧤</span>':''}${state.postes?.enabled?`${p.defender?' 🛡️':''}${p.attacker?' ⚽':''}${p.winger?' ↔️':''}`:''}</button>`}
function manualWarnings(){const bad=[];for(const g of currentGroups||[])for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++)if(state.rules.some(r=>groupKeyPair(Number(r[0]),Number(r[1]))===groupKeyPair(g[i].id,g[j].id)))bad.push(`${g[i].name} + ${g[j].name}`);return bad}
function renderManual(){const allAssigned=new Set(currentGroups.flat().map(p=>p.id));let remaining=manualPool.filter(p=>!allAssigned.has(p.id));const bad=applyRestrictions?manualWarnings():[];remaining=[...remaining].sort((a,b)=>manualSort==='level'?((Number(level(b.level)?.weight)||0)-(Number(level(a.level)?.weight)||0)||a.name.localeCompare(b.name,'fr',{sensitivity:'base'})):a.name.localeCompare(b.name,'fr',{sensitivity:'base'}));const target=Number(els.manualTargetGroup?.value||0);els.result.innerHTML=`<div class="card manual-editor"><div class="subhead"><div><h2>Répartition manuelle</h2><div class="small muted">Clique sur plusieurs joueurs pour les sélectionner, puis choisis le groupe cible.</div></div><span class="count">${allAssigned.size}/${allAssigned.size+remaining.length} placés • ${manualSelectedIds.size} sélectionné(s)</span></div>${bad.length?`<div class="warning">🚫 Règle de séparation non respectée : ${bad.map(esc).join(' • ')}</div>`:''}<div class="manual-controls"><label>Groupe cible<select id="manualTargetGroup">${currentGroups.map((g,i)=>`<option value="${i}" ${i===target?'selected':''}>Groupe ${i+1} (${g.length})</option>`).join('')}</select></label><label>Trier par<select id="manualSort"><option value="name" ${manualSort==='name'?'selected':''}>🔤 Nom A → Z</option><option value="level" ${manualSort==='level'?'selected':''}>🎨 Niveau</option></select></label><button type="button" id="btnAddToTarget" class="primary">＋ Ajouter au groupe</button></div><div class="manual-layout"><div class="manual-pool"><h3>Joueurs à placer <span class="count">(${remaining.length})</span></h3><div class="manual-list">${remaining.map(p=>playerLine(p,`data-manual-player="${p.id}"`)).join('')||'<div class="small muted">Tous les joueurs sont placés.</div>'}</div></div><div class="manual-groups">${currentGroups.map((g,i)=>`<div class="manual-group group-color-${(i%10)+1}"><h3><span class="group-dot"></span>Groupe ${i+1} <span class="muted">(${g.length})</span></h3><div class="manual-list">${g.map(p=>playerLine(p,`data-manual-remove="${p.id}"`)).join('')||'<div class="small muted">Aucun joueur.</div>'}</div></div>`).join('')}</div></div><div class="actions"><button type="button" id="btnResetManual">↺ Recommencer</button>${remaining.length?'<button type="button" id="btnAutoComplete">➡️ Compléter automatiquement</button>':''}<button type="button" id="btnSaveCurrent" class="primary" ${remaining.length?'disabled':''}>💾 Enregistrer</button>${remaining.length?'': '<button type="button" id="btnExportPNG">🖼️ Image</button><button type="button" id="btnPrintGroups">📄 Imprimer / PDF</button><button type="button" id="btnShareGroups">📤 Partager</button><button type="button" id="btnCleanResult">📺 Affichage match</button><button type="button" id="btnCopyGroups">📋 Copier</button>'}</div></div>`;bindManualEvents()}
let manualSelectedIds=new Set();
function bindManualEvents(){
  $('#manualSort')?.addEventListener('change',e=>{manualSort=e.target.value;renderManual()});
  $('#manualTargetGroup')?.addEventListener('change',()=>{});
  $('#btnAddToTarget')?.addEventListener('click',()=>{
    if(!manualSelectedIds.size){alert('Sélectionne un ou plusieurs joueurs.');return;}
    const gi=Number($('#manualTargetGroup')?.value||0), ids=new Set(manualSelectedIds), selected=manualPool.filter(p=>ids.has(p.id));
    currentGroups.forEach(g=>{for(let i=g.length-1;i>=0;i--)if(ids.has(g[i].id))g.splice(i,1)});
    currentGroups[gi].push(...selected); manualSelectedIds.clear(); renderManual();
  });
  $$('#result [data-manual-player]').forEach(b=>b.addEventListener('click',()=>{

    const id=Number(b.dataset.manualPlayer);
    if(manualSelectedIds.has(id)) manualSelectedIds.delete(id); else manualSelectedIds.add(id);
    renderManual();
  }));
  $$('#result [data-manual-remove]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.manualRemove);currentGroups.forEach(g=>{const ix=g.findIndex(x=>x.id===id);if(ix>=0)g.splice(ix,1)});manualSelectedIds.delete(id);renderManual()}));
  const reset=$('#btnResetManual');if(reset)reset.addEventListener('click',()=>{currentGroups=Array.from({length:currentGroups.length},()=>[]);manualPool.forEach(p=>p.locked=false);manualSelectedIds.clear();renderManual()});const ac=$('#btnAutoComplete');if(ac)ac.addEventListener('click',autoCompleteCurrent);
  const saveBtn=$('#btnSaveCurrent');if(saveBtn)saveBtn.addEventListener('click',saveCurrent);const png=$('#btnExportPNG');if(png)png.addEventListener('click',exportGroupsPNG);const pr=$('#btnPrintGroups');if(pr)pr.addEventListener('click',printGroups);const sh=$('#btnShareGroups');if(sh)sh.addEventListener('click',shareGroups)
}
function movePlayerPrompt(id){
 const p=currentGroups.flat().find(x=>x.id===Number(id)); if(!p)return;
 const current=currentGroups.findIndex(g=>g.some(x=>x.id===p.id));
 const answer=prompt(`Déplacer ${p.name} vers quel groupe ? (1-${currentGroups.length})`,String(current+1));
 if(answer===null)return; const gi=Number(answer)-1;
 if(!Number.isInteger(gi)||gi<0||gi>=currentGroups.length||gi===current){return}
 currentGroups.forEach(g=>{const i=g.findIndex(x=>x.id===p.id);if(i>=0)g.splice(i,1)});
 currentGroups[gi].push(p); renderResult();
}
function renderEditResult(){return `<div class="small muted">✏️ Déplace les joueurs si besoin. 🔒 Verrouille ceux qui doivent rester dans leur groupe, puis utilise « Compléter automatiquement ».</div><div class="actions"><button type="button" id="btnRegenerate">🔄 Régénérer</button><button type="button" id="btnComplete">➡️ Compléter automatiquement</button></div>`}
function openAutoCompleteChoice(){
  const d=$('#autoCompleteDialog');
  if(d){d.showModal();return;}
  const choice=prompt('Compléter automatiquement :\n1 = Groupes de niveau\n2 = Groupes homogènes','2');
  if(choice==='1')completeManual('level'); else if(choice==='2')completeManual('balanced');
}
function completeManual(mode){
 const n=currentGroups.length;
 const pool=manualPool.length?manualPool:currentPool;
 const assignedIds=new Set(currentGroups.flat().map(x=>x.id));
 const remaining=pool.filter(p=>!assignedIds.has(p.id));
 if(!remaining.length){renderManual();return;}
 const targets=targetGroupSizes(pool.length,n);
 if(currentGroups.some((g,i)=>g.length>targets[i])){alert('La répartition actuelle dépasse déjà la taille cible d’un groupe.');return;}
 const capacities=targets.map((t,i)=>t-currentGroups[i].length);
 if(mode==='level'){
   const ordered=[...remaining].sort((a,b)=>{const wa=Number(level(a.level)?.weight)||0,wb=Number(level(b.level)?.weight)||0;return wb-wa||a.name.localeCompare(b.name,'fr',{sensitivity:'base'});});
   let k=0;
   for(let gi=0;gi<n;gi++){
     while(currentGroups[gi].length<targets[gi]&&k<ordered.length){
       const candidates=[];
       for(let j=k;j<ordered.length;j++)if(!violates(currentGroups[gi],ordered[j]))candidates.push(j);
       if(!candidates.length){alert('Impossible de compléter sans violer une contrainte « jamais ensemble ».');return;}
       const idx=candidates[0]; currentGroups[gi].push(ordered[idx]); ordered.splice(idx,1);
     }
   }
 }else{
   const temp=generateBalancedGroups(remaining,n,{reserved:capacities});
   if(!temp){alert('Impossible de compléter automatiquement sans violer une contrainte « jamais ensemble ».');return;}
   for(let i=0;i<n;i++)currentGroups[i].push(...temp[i]);
 }
 manualSelectedIds.clear();
 renderManual();
}
function autoCompleteCurrent(){
 if(els.distType.value==='manual'){openAutoCompleteChoice();return;}
 const n=currentGroups.length, pool=currentPool.length?currentPool:manualPool, assignedIds=new Set(currentGroups.flat().map(x=>x.id)), all=[...currentGroups.flat(),...pool.filter(p=>!assignedIds.has(p.id))];
 const targets=targetGroupSizes(all.length,n);
 const lockedGroups=currentGroups.map(g=>g.filter(p=>p.locked));
 if(lockedGroups.some((g,i)=>g.length>targets[i])){alert('Un groupe contient déjà trop de joueurs verrouillés.');return}
 const remaining=all.filter(p=>!currentGroups.some(g=>g.some(x=>x.id===p.id&&x.locked)));
 const result=lockedGroups.map(g=>[...g]);
 for(const p of remaining){
   const candidates=[];
   for(let gi=0;gi<n;gi++){
     if(result[gi].length>=targets[gi]||violates(result[gi],p))continue;
     const g=result[gi];
     const score=scoreGroup(g), same=g.filter(x=>x.level===p.level).length;
     const k=g.filter(x=>x.goalkeeper).length;
     const pos=(state.postes?.defender&&p.defender?g.filter(x=>x.defender).length:0)+(state.postes?.attacker&&p.attacker?g.filter(x=>x.attacker).length:0)+(state.postes?.winger&&p.winger?g.filter(x=>x.winger).length:0);
     candidates.push({gi,cost:score*18+same*10+k*(p.goalkeeper?100:5)+pos*25+Math.random()*3});
   }
   if(!candidates.length){alert('Impossible de compléter automatiquement sans violer une contrainte « jamais ensemble ».');return}
   candidates.sort((a,b)=>a.cost-b.cost); result[candidates[0].gi].push(p);
 }
 result.forEach(g=>g.forEach(p=>{if(!p.locked)p.locked=false}));
 currentGroups=result; renderResult();
}
function toggleLock(id){const p=currentGroups?.flat().find(x=>x.id===Number(id));if(!p)return;p.locked=!p.locked;renderResult();}
function removePlayerFromCurrent(id){const pid=Number(id);let removed=null;currentGroups.forEach(g=>{const i=g.findIndex(x=>x.id===pid);if(i>=0)removed=g.splice(i,1)[0]});if(!removed)return;removed.locked=false;renderResult();}
function renderCleanResult(){
  if(!currentGroups)return;
  const title=els.distName.value.trim()||'Répartition';
  els.result.innerHTML=`<div class="card clean-result"><div class="clean-head"><div><h2>📺 ${esc(title)}</h2><div class="small muted">Affichage match</div></div><button type="button" id="btnExitClean">✏️ Modifier</button></div><div class="group-grid">${groupMarkup(currentGroups)}</div><div class="actions"><button type="button" id="btnCopyClean">📋 Copier la répartition</button><button type="button" id="btnShareClean">📤 Partager</button></div></div>`;
  $('#btnExitClean').addEventListener('click',renderResult);
  $('#btnCopyClean').addEventListener('click',copyGroupsText);
  $('#btnShareClean').addEventListener('click',shareGroups);
}
async function copyGroupsText(){if(!currentGroups)return;const title=els.distName.value.trim()||'Répartition';const text=`${title}\n\n${exportText(currentGroups)}`;try{await navigator.clipboard.writeText(text);alert('La répartition a été copiée dans le presse-papiers.')}catch(e){alert(text)}}
function renderResult(){if(!currentGroups)return;if(els.distType.value==='manual'){renderManual();return}
const warning=els.distType.value==='level'?levelGoalkeeperWarnings(currentGroups):'';
els.result.innerHTML=`<div class="card"><div class="subhead"><h2>Résultat</h2><div class="generation-options"><label class="inline-check"><input id="applyRestrictionsResult" type="checkbox" ${applyRestrictions?'checked':''}> 🚫 Appliquer les restrictions joueurs</label></div></div>${warning}${renderEditResult()}<div class="group-grid">${groupMarkup(currentGroups)}</div><div class="actions"><button type="button" id="btnSaveCurrent" class="primary">💾 Enregistrer cette répartition</button><button type="button" id="btnExportPNG">🖼️ Image</button><button type="button" id="btnPrintGroups">📄 Imprimer / PDF</button><button type="button" id="btnShareGroups">📤 Partager</button><button type="button" id="btnCleanResult">📺 Affichage match</button><button type="button" id="btnCopyGroups">📋 Copier</button></div></div>`;
$('#applyRestrictionsResult')?.addEventListener('change',e=>{applyRestrictions=e.target.checked;renderResult()});$('#btnSaveCurrent').addEventListener('click',saveCurrent);$('#btnExportPNG').addEventListener('click',exportGroupsPNG);$('#btnPrintGroups').addEventListener('click',printGroups);$('#btnShareGroups').addEventListener('click',shareGroups);
$('#btnRegenerate').addEventListener('click',generate);$('#btnComplete').addEventListener('click',autoCompleteCurrent);$('#btnCleanResult').addEventListener('click',renderCleanResult);$('#btnCopyGroups').addEventListener('click',copyGroupsText);$$('#result [data-move-player]').forEach(b=>b.addEventListener('click',()=>movePlayerPrompt(b.dataset.movePlayer)));$$('#result [data-lock-player]').forEach(b=>b.addEventListener('click',()=>toggleLock(b.dataset.lockPlayer)));$$('#result [data-remove-player]').forEach(b=>b.addEventListener('click',()=>removePlayerFromCurrent(b.dataset.removePlayer)));
}
function generate(){
 const players=selectedPlayers(),n=Number(els.groupCount.value),type=els.distType.value; manualSelectedIds.clear();
 if(!players.length){els.result.innerHTML='<div class="empty error">Sélectionne au moins un joueur.</div>';return}
 if(n>players.length){els.result.innerHTML='<div class="empty error">Il faut au moins un joueur par groupe.</div>';return}
 currentPool=[...players];
 const canRegenerate=Array.isArray(currentGroups)&&currentGroups.length===n&&currentGroups.flat().some(p=>players.some(x=>x.id===p.id&&p.locked));
 if(canRegenerate){regenerateKeepingLocks(players,n,type);return;}
 players.forEach(p=>{p.locked=false});
 currentGroups=generateGroups(players,n,type);
 if(!currentGroups){els.result.innerHTML='<div class="empty error">⚠️ Impossible de respecter toutes les règles « jamais ensemble » avec ce nombre de groupes.</div>';return}
 renderResult();
}
function regenerateKeepingLocks(players,n,type){
 if(type==='manual'){renderManual();return;}
 const targets=targetGroupSizes(players.length,n), lockedByGroup=currentGroups.map(g=>g.filter(p=>p.locked)), lockedIds=new Set(lockedByGroup.flat().map(p=>p.id));
 if(lockedByGroup.some((g,i)=>g.length>targets[i])){alert('Un groupe contient trop de joueurs verrouillés pour conserver l’équilibre numérique.');return;}
 const unlocked=players.filter(p=>!lockedIds.has(p.id));
 const result=lockedByGroup.map(g=>[...g]);
 const remainingTargets=targets.map((t,i)=>t-result[i].length);
 if(type==='level'){
   const ordered=[...unlocked].sort((a,b)=>{const wa=Number(level(a.level)?.weight)||0,wb=Number(level(b.level)?.weight)||0;return wb-wa||a.name.localeCompare(b.name,'fr',{sensitivity:'base'});});
   let k=0; for(let gi=0;gi<n;gi++){while(result[gi].length<targets[gi]&&k<ordered.length)result[gi].push(ordered[k++]);}
 } else {
   const temp=generateBalancedGroups(unlocked,n, {reserved:remainingTargets, lockedByGroup:result});
   if(temp){for(let i=0;i<n;i++)result[i].push(...temp[i]); repairCoverage(result,n);}
   else { // fallback: greedy fill respecting exact targets
     const rem=[...unlocked].sort((a,b)=>(Number(level(b.level)?.weight)||0)-(Number(level(a.level)?.weight)||0));
     for(const p of rem){let candidates=[];for(let gi=0;gi<n;gi++)if(result[gi].length<targets[gi]&&!violates(result[gi],p))candidates.push(gi);if(!candidates.length){alert('Impossible de régénérer sans violer une contrainte « jamais ensemble ».');return;}candidates.sort((a,b)=>scoreGroup(result[a])-scoreGroup(result[b]));result[candidates[0]].push(p);}
   }
 }
 currentGroups=result; renderResult();
}
function saveCurrent(){const name=els.distName.value.trim()||`Répartition du ${new Date().toLocaleDateString('fr-FR')}`;state.history.unshift({id:Date.now(),name,type:els.distType.value,created:new Date().toISOString(),groups:currentGroups.map(g=>g.map(p=>({...p})))});save();renderHistory();alert('Répartition enregistrée.');showPage('history')}
function renderHistory(){els.historyList.innerHTML=state.history.length?state.history.map(h=>`<div class="history"><b>${esc(h.name)}</b><div class="small muted">${new Date(h.created).toLocaleString('fr-FR')} • ${h.groups.length} groupes • ${h.type==='level'?'Niveau':h.type==='balanced'?'Homogènes':'Manuelle'}</div><div class="history-actions"><button type="button" data-view-history="${h.id}">Voir</button><button type="button" data-edit-history="${h.id}">✏️ Reprendre</button><button type="button" data-delete-history="${h.id}">Supprimer</button></div></div>`).join(''):'<div class="empty">Aucune répartition enregistrée.</div>'}
function viewHistory(id){const h=state.history.find(x=>x.id===Number(id));if(!h)return;historyEditingId=h.id;const byId=new Map(state.players.map(p=>[p.id,p]));currentGroups=h.groups.map(g=>g.map(x=>({...byId.get(x.id)||x,locked:!!x.locked})));currentPool=currentGroups.flat().map(p=>byId.get(p.id)||p);els.distType.value=h.type;els.groupCount.value=String(h.groups.length);els.distName.value=h.name;showPage('create');renderCreate();setTimeout(()=>{currentGroups=h.groups.map(g=>g.map(x=>({...byId.get(x.id)||x,locked:!!x.locked})));currentPool=currentGroups.flat();const ids=new Set(currentPool.map(p=>p.id));$$('#attendance input[type=checkbox]').forEach(c=>c.checked=ids.has(Number(c.dataset.id)));renderResult();},0)}
function addPlayer(){editingId=null;els.dialogTitle.textContent='Ajouter un joueur';els.playerName.value='';els.playerGoalkeeper.checked=false;els.playerDefender.checked=false;els.playerAttacker.checked=false;els.playerWinger.checked=false;renderLevelSelect(els.playerLevel,state.levels[0]?.id);els.playerPostesBox.hidden=!state.postes.enabled;els.dialog.showModal();setTimeout(()=>els.playerName.focus(),50)}
function editPlayer(id){const p=state.players.find(x=>x.id===Number(id));if(!p)return;editingId=p.id;els.dialogTitle.textContent='Modifier le joueur';els.playerName.value=p.name;els.playerGoalkeeper.checked=!!p.goalkeeper;els.playerDefender.checked=!!p.defender;els.playerAttacker.checked=!!p.attacker;els.playerWinger.checked=!!p.winger;renderLevelSelect(els.playerLevel,p.level);els.playerPostesBox.hidden=!state.postes.enabled;els.dialog.showModal()}
function bind(){
 els.nav.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.page==='home'){showPage('home')}else if(state){showPage(b.dataset.page)}}));
 if(els.btnHome)els.btnHome.addEventListener('click',()=>showPage('home'));
 if(els.btnAddFolder)els.btnAddFolder.addEventListener('click',addFolder);
 if(els.folderList)els.folderList.addEventListener('click',e=>{const d=e.target.closest('[data-delete-folder]');if(d){e.stopPropagation();deleteFolder(d.dataset.deleteFolder);return}const c=e.target.closest('[data-open-folder]');if(c)openFolder(c.dataset.openFolder)});
 els.applyRestrictions?.addEventListener('change',e=>{applyRestrictions=e.target.checked;});
 els.btnAddPlayer.addEventListener('click',addPlayer);els.postesEnabled?.addEventListener('change',()=>{state.postes.enabled=els.postesEnabled.checked;save();renderSettings();});els.postesDefender?.addEventListener('change',()=>{state.postes.defender=els.postesDefender.checked;save();});els.postesAttacker?.addEventListener('change',()=>{state.postes.attacker=els.postesAttacker.checked;save();});els.postesWinger?.addEventListener('change',()=>{state.postes.winger=els.postesWinger.checked;save();});els.btnImportPlayers?.addEventListener('click',()=>els.playerImportFile?.click());els.playerImportFile?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importPlayersFile(f);e.target.value=''});els.btnExportPlayers?.addEventListener('click',exportPlayersCSV);els.btnCancelDialog.addEventListener('click',()=>els.dialog.close());
 els.form.addEventListener('submit',e=>{e.preventDefault();const name=els.playerName.value.trim();if(!name)return;if(editingId!=null){const p=state.players.find(x=>x.id===editingId);p.name=name;p.level=Number(els.playerLevel.value);p.goalkeeper=els.playerGoalkeeper.checked;p.defender=els.playerDefender.checked;p.attacker=els.playerAttacker.checked;p.winger=els.playerWinger.checked}else state.players.push({id:Date.now(),name,level:Number(els.playerLevel.value),goalkeeper:els.playerGoalkeeper.checked,defender:els.playerDefender.checked,attacker:els.playerAttacker.checked,winger:els.playerWinger.checked});save();renderPlayers();renderCreate();renderSettings();els.dialog.close()});
 els.playerList.addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)editPlayer(b.dataset.edit)}); els.playerSearch?.addEventListener('input',renderPlayers);
 els.attendance.addEventListener('change',updateAttendanceCount);els.btnAll.addEventListener('click',()=>{$$('#attendance input').forEach(x=>x.checked=true);updateAttendanceCount()});els.btnNone.addEventListener('click',()=>{$$('#attendance input').forEach(x=>x.checked=false);updateAttendanceCount()});els.btnGenerate.addEventListener('click',generate);
 els.btnAddLevel.addEventListener('click',()=>{const name=els.newLevelName.value.trim();if(!name){alert('Indique un nom de niveau.');return}const id=Date.now(); const used=new Set(state.levels.map(l=>l.color)); const color=LEVEL_COLORS.find(c=>!used.has(c)); if(!color){alert('La palette des niveaux est limitée à 10 couleurs. Supprime ou réutilise un niveau avant d’en ajouter un autre.');return;} state.levels.push({id,name,emoji:els.newLevelEmoji.value.trim()||'⚪',color,weight:1});autoWeightLevels();save();els.newLevelName.value='';els.newLevelEmoji.value='';renderSettings();renderPlayers();renderCreate()});
 els.levelsSettings.addEventListener('change',e=>{const id=Number(e.target.dataset.levelName);const l=state.levels.find(x=>x.id===id);if(!l)return;l.name=e.target.value.trim()||l.name;autoWeightLevels();save();renderPlayers();renderCreate();renderSettings()});
 els.levelsSettings.addEventListener('click',e=>{const up=e.target.closest('[data-level-up]'),down=e.target.closest('[data-level-down]');if(up||down){const id=Number((up||down).dataset[up?'levelUp':'levelDown']);const i=state.levels.findIndex(x=>x.id===id),j=i+(up?-1:1);if(i>=0&&j>=0&&j<state.levels.length){[state.levels[i],state.levels[j]]=[state.levels[j],state.levels[i]];autoWeightLevels();save();renderSettings();renderPlayers();renderCreate();}return}const b=e.target.closest('[data-delete-level]');if(!b)return;const id=Number(b.dataset.deleteLevel);if(state.levels.length<=1){alert('Il faut conserver au moins un niveau.');return}if(state.players.some(p=>p.level===id)){alert('Ce niveau est encore utilisé par un joueur. Change d’abord leur niveau.');return}state.levels=state.levels.filter(l=>l.id!==id);save();renderSettings();renderCreate();renderPlayers()});
 els.btnAddRule.addEventListener('click',()=>{const a=Number(els.ruleA.value),b=Number(els.ruleB.value);if(!a||!b||a===b){alert('Choisis deux joueurs différents.');return}if(state.rules.some(r=>(Number(r[0])===a&&Number(r[1])===b)||(Number(r[0])===b&&Number(r[1])===a))){alert('Cette règle existe déjà.');return}state.rules.push([a,b]);save();renderSettings()});
 els.rulesList.addEventListener('click',e=>{const b=e.target.closest('[data-delete-rule]');if(!b)return;state.rules.splice(Number(b.dataset.deleteRule),1);save();renderSettings()});
 const acModeLevel=$('#btnAutoCompleteLevel'),acModeBalanced=$('#btnAutoCompleteBalanced'),acModeCancel=$('#btnAutoCompleteCancel'); if(acModeLevel)acModeLevel.addEventListener('click',()=>{$('#autoCompleteDialog').close();completeManual('level')}); if(acModeBalanced)acModeBalanced.addEventListener('click',()=>{$('#autoCompleteDialog').close();completeManual('balanced')}); if(acModeCancel)acModeCancel.addEventListener('click',()=>$('#autoCompleteDialog').close());
 els.historyList.addEventListener('click',e=>{const v=e.target.closest('[data-view-history]'),m=e.target.closest('[data-edit-history]'),d=e.target.closest('[data-delete-history]');if(v)viewHistory(v.dataset.viewHistory);if(m)viewHistory(m.dataset.editHistory);if(d&&confirm('Supprimer cette répartition ?')){state.history=state.history.filter(h=>h.id!==Number(d.dataset.deleteHistory));save();renderHistory()}});
}
function init(){bind();if(currentFolderId&&state){renderPlayers();renderCreate();renderSettings();renderHistory();showPage('players')}else{showPage('home')}}
init();
})();
