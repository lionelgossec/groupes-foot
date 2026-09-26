(() => {
'use strict';
const KEY='groupes-foot-v14';
const DEFAULT_LEVELS=[
{id:4,name:'Confirmés',emoji:'🟢',weight:4},
{id:3,name:'Intermédiaire +',emoji:'🔵',weight:3},
{id:2,name:'Intermédiaire −',emoji:'🟡',weight:2},
{id:1,name:'Débutants',emoji:'🔴',weight:1}
];
const DEFAULT_PLAYERS=[];
const DEFAULT_GOALKEEPERS=new Set([]);
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function freshState(){return {players:DEFAULT_PLAYERS.map((x,i)=>({id:i+1,name:x[0],level:x[1],goalkeeper:DEFAULT_GOALKEEPERS.has(x[0])})),levels:DEFAULT_LEVELS.map(x=>({...x})),rules:[],history:[]}}
let root;
let state;
let currentFolderId=null;
function normalizeFolderData(data){
  data=data&&typeof data==='object'?data:freshState();
  data.players=Array.isArray(data.players)?data.players:[];
  data.levels=Array.isArray(data.levels)&&data.levels.length?data.levels:DEFAULT_LEVELS.map(x=>({...x}));
  data.rules=Array.isArray(data.rules)?data.rules:[];
  data.history=Array.isArray(data.history)?data.history:[];
  data.players.forEach(p=>{if(!data.levels.some(l=>l.id===p.level))p.level=data.levels[0].id;if(typeof p.goalkeeper!=='boolean')p.goalkeeper=false});
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
let editingId=null, currentGroups=null, manualPool=[];
const els={
 pages:$$('.page'), nav:$$('.nav-btn'), btnHome:$('#btnHome'), btnAddFolder:$('#btnAddFolder'), folderList:$('#folderList'), playerCount:$('#playerCount'), playerList:$('#playerList'),
 btnAddPlayer:$('#btnAddPlayer'),btnImportPlayers:$('#btnImportPlayers'),btnExportPlayers:$('#btnExportPlayers'),playerImportFile:$('#playerImportFile'), dialog:$('#playerDialog'), form:$('#playerForm'), dialogTitle:$('#dialogTitle'), playerName:$('#playerName'), playerLevel:$('#playerLevel'), playerGoalkeeper:$('#playerGoalkeeper'), btnCancelDialog:$('#btnCancelDialog'),
 distName:$('#distName'),distType:$('#distType'),groupCount:$('#groupCount'),attendance:$('#attendance'),attendanceCount:$('#attendanceCount'),btnAll:$('#btnAll'),btnNone:$('#btnNone'),btnGenerate:$('#btnGenerate'),result:$('#result'),
 levelsSettings:$('#levelsSettings'),newLevelName:$('#newLevelName'),newLevelEmoji:$('#newLevelEmoji'),newLevelWeight:$('#newLevelWeight'),btnAddLevel:$('#btnAddLevel'),ruleA:$('#ruleA'),ruleB:$('#ruleB'),btnAddRule:$('#btnAddRule'),rulesList:$('#rulesList'),historyList:$('#historyList')
};
function level(id){return state.levels.find(l=>l.id===Number(id))||state.levels[0]}
function levelLabel(id){const l=level(id);return `${l?.emoji||'⚪'} ${esc(l?.name||'Niveau')}`}
function showPage(page){els.pages.forEach(x=>x.classList.toggle('active',x.id===`page-${page}`));els.nav.forEach(x=>x.classList.toggle('active',x.dataset.page===page));if(page==='home')renderHome();if(page==='create'&&state)renderCreate();if(page==='settings'&&state)renderSettings();if(page==='history'&&state)renderHistory();if(page!=='home'&&!state){page='home';els.pages.forEach(x=>x.classList.toggle('active',x.id==='page-home'));renderHome()}}
function renderHome(){
  if(!els.folderList)return;
  els.folderList.innerHTML=root.folders.map(f=>{const d=normalizeFolderData(f.data);return `<div class="folder-card" data-open-folder="${f.id}"><h2>⚽ ${esc(f.name)}</h2><div class="muted">${d.players.length} joueur${d.players.length>1?'s':''} • ${d.history.length} répartition${d.history.length>1?'s':''}</div><div class="folder-open">Ouvrir →</div></div>`}).join('')||'<div class="folder-empty">Aucun groupe. Clique sur ＋ Nouveau groupe pour commencer.</div>';
}
function openFolder(id){
  const f=root.folders.find(x=>x.id===Number(id)); if(!f)return;
  currentFolderId=f.id; state=normalizeFolderData(f.data); root.currentFolderId=currentFolderId; saveRoot();
  currentGroups=null; manualPool=[]; manualSelectedIds.clear();
  showPage('players'); renderPlayers(); renderCreate(); renderSettings(); renderHistory();
}
function addFolder(){
  const name=prompt('Nom du groupe (ex. U9, U7...)','U9'); if(name===null)return; const clean=name.trim(); if(!clean){alert('Indique un nom.');return}
  const id=Date.now()+Math.floor(Math.random()*1000); root.folders.push({id,name:clean,data:freshState()}); saveRoot(); renderHome(); openFolder(id);
}
function renderPlayers(){els.playerCount.textContent=`(${state.players.length})`;els.playerList.innerHTML=state.players.map(p=>`<div class="player"><div class="left"><span class="badge">${level(p.level)?.emoji||'⚪'}</span><b>${esc(p.name)}</b><span class="muted">${esc(level(p.level)?.name||'Niveau')}</span></div><button type="button" data-edit="${p.id}">Modifier</button></div>`).join('')||'<div class="empty">Aucun joueur.</div>'}
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
function parseImportText(text){
  text=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(!text)return [];
  const lines=text.split('\n').filter(x=>x.trim());
  const first=lines[0];
  const sep=first.includes(';')?';':first.includes('\t')?'\t':',';
  const firstCells=parseCSVLine(first,sep).map(x=>x.toLocaleLowerCase('fr-FR'));
  const hasHeader=firstCells.some(x=>['nom','prénom','prenom','joueur','joueurs','niveau','gardien','gardien?','peut jouer gardien'].includes(x));
  const headers=hasHeader?firstCells:null;
  const start=hasHeader?1:0;
  return lines.slice(start).map(line=>parseCSVLine(line,sep)).map(c=>{
    if(!headers)return {name:normalizeImportName(c[0]),levelName:normalizeImportName(c[1]||''),keeper:c[2]};
    const at=k=>{const i=headers.findIndex(h=>h===k);return i>=0?c[i]:''};
    const name=normalizeImportName(at('nom')||at('prénom')||at('prenom')||at('joueur')||c[0]);
    const levelName=normalizeImportName(at('niveau'));
    const keeper=at('gardien')||at('gardien?')||at('peut jouer gardien');
    return {name,levelName,keeper};
  }).filter(x=>x.name);
}
function keeperValue(v){return /^(oui|o|yes|y|1|true|x|✓|🧤)$/i.test(normalizeImportName(v));}
function importPlayersText(text){
  const rows=parseImportText(text); if(!rows.length){alert('Aucun joueur reconnu dans le fichier.');return;}
  let added=0,updated=0,unknownLevels=new Set();
  const byName=new Map(state.players.map(p=>[normalizeImportName(p.name).toLocaleLowerCase('fr-FR'),p]));
  rows.forEach(r=>{
    const key=r.name.toLocaleLowerCase('fr-FR');
    let p=byName.get(key);
    if(p){updated++;}else{p={id:Date.now()+Math.floor(Math.random()*1000000),name:r.name,level:state.levels[0]?.id||1,goalkeeper:false};state.players.push(p);byName.set(key,p);added++;}
    if(r.levelName){const l=findLevelByName(r.levelName);if(l)p.level=l.id;else unknownLevels.add(r.levelName);}
    if(String(r.keeper||'').trim()!=='')p.goalkeeper=keeperValue(r.keeper);
  });
  save();renderPlayers();renderCreate();renderSettings();
  let msg=`Import terminé : ${added} nouveau${added>1?'x':''} joueur${added>1?'s':''}, ${updated} joueur${updated>1?'s':''} déjà présent${updated>1?'s':''} mis à jour.`;
  if(unknownLevels.size)msg+=`\n\nNiveau${unknownLevels.size>1?'x':''} non reconnu${unknownLevels.size>1?'s':''} : ${[...unknownLevels].join(', ')}. Ces joueurs gardent leur niveau actuel.`;
  alert(msg);
}
function importPlayersFile(file){const reader=new FileReader();reader.onload=()=>importPlayersText(reader.result);reader.onerror=()=>alert('Impossible de lire ce fichier.');reader.readAsText(file,'UTF-8');}
function exportPlayersCSV(){
  const rows=[['Nom','Niveau','Gardien'],...state.players.map(p=>[p.name,level(p.level)?.name||'',p.goalkeeper?'Oui':'Non'])];
  const csv='\\uFEFF'+rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\\r\\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='joueurs.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function renderLevelSelect(select,selected){select.innerHTML=state.levels.map(l=>`<option value="${l.id}">${l.emoji} ${esc(l.name)}</option>`).join('');if(selected!=null)select.value=String(selected)}
function renderAttendance(){const checked=new Set($$('#attendance input[type=checkbox]:checked').map(x=>Number(x.dataset.id)));els.attendance.innerHTML=state.players.map(p=>`<label class="check"><input type="checkbox" data-id="${p.id}" ${checked.size===0||checked.has(p.id)?'checked':''}><span>${level(p.level)?.emoji||'⚪'}</span><b>${esc(p.name)}</b><span class="muted">${esc(level(p.level)?.name||'')}</span></label>`).join('');updateAttendanceCount()}
function updateAttendanceCount(){els.attendanceCount.textContent=`(${$$('#attendance input:checked').length}/${state.players.length})`}
function fillGroupCount(){const old=Number(els.groupCount.value)||4;els.groupCount.innerHTML='';for(let i=2;i<=Math.min(10,Math.max(2,state.players.length));i++)els.groupCount.insertAdjacentHTML('beforeend',`<option value="${i}">${i} groupes</option>`);els.groupCount.value=String(Math.min(old,Math.min(10,state.players.length)))}
function renderCreate(){fillGroupCount();renderAttendance()}
function renderSettings(){
 els.levelsSettings.innerHTML=state.levels.map(l=>`<div class="setting-row"><span class="badge">${l.emoji||'⚪'}</span><input data-level-name="${l.id}" value="${esc(l.name)}"><input class="weight" data-level-weight="${l.id}" type="number" min="0" max="99" value="${Number(l.weight)||0}"><button type="button" data-delete-level="${l.id}">Supprimer</button></div>`).join('');
 const opts=state.players.slice().sort((a,b)=>a.name.localeCompare(b.name,'fr',{sensitivity:'base'})).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');els.ruleA.innerHTML=opts;els.ruleB.innerHTML=opts;
 els.rulesList.innerHTML=state.rules.length?state.rules.map((r,i)=>{const a=state.players.find(p=>p.id===Number(r[0])),b=state.players.find(p=>p.id===Number(r[1]));return a&&b?`<div class="rule">🚫 <b>${esc(a.name)}</b> + <b>${esc(b.name)}</b><button type="button" data-delete-rule="${i}">Supprimer</button></div>`:''}).join(''):'<div class="empty">Aucune règle de séparation.</div>';
}
function selectedPlayers(){const ids=new Set($$('#attendance input:checked').map(x=>Number(x.dataset.id)));return state.players.filter(p=>ids.has(p.id))}
function violates(group,p){return group.some(x=>state.rules.some(r=>(Number(r[0])===x.id&&Number(r[1])===p.id)||(Number(r[1])===x.id&&Number(r[0])===p.id)))}
function scoreGroup(g){return g.reduce((s,p)=>s+(Number(level(p.level)?.weight)||0),0)}
function groupKeyPair(a,b){return a<b?`${a}-${b}`:`${b}-${a}`}
function restrictionPenalty(groups){let bad=0;for(const g of groups){for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++)if(state.rules.some(r=>groupKeyPair(Number(r[0]),Number(r[1]))===groupKeyPair(g[i].id,g[j].id)))bad++;}return bad}
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
  if(total>=groups.length) penalty+=counts.filter(c=>c===0).length*60;
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
function balancedPenalty(groups){
  const scores=groups.map(scoreGroup);
  const avg=scores.reduce((a,b)=>a+b,0)/groups.length;
  const sizes=groups.map(g=>g.length);
  const avgSize=sizes.reduce((a,b)=>a+b,0)/groups.length;
  return scores.reduce((s,x)=>s+(x-avg)**2,0)*18
    +sizes.reduce((s,x)=>s+Math.abs(x-avgSize),0)*25
    +levelCountPenalty(groups)
    +goalkeeperPenalty(groups);
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
  // Level groups are deliberately stratified: strongest levels first, then the
  // next level, etc. We do NOT spread levels across groups.
  const ordered=[...players].sort((a,b)=>{
    const wa=Number(level(a.level)?.weight)||0, wb=Number(level(b.level)?.weight)||0;
    return wb-wa || a.name.localeCompare(b.name,'fr',{sensitivity:'base'});
  });
  const size=Math.ceil(ordered.length/n);
  let groups=Array.from({length:n},()=>[]);
  ordered.forEach((p,i)=>groups[Math.min(n-1,Math.floor(i/size))].push(p));
  // If the final group is too small, rebalance sizes while preserving the
  // overall level order as much as possible.
  while(groups.length>1 && groups[groups.length-1].length===0)groups.pop();
  // Try to resolve separation rules with the smallest possible local swaps.
  // A swap is only considered between nearby groups so the level ordering is
  // disturbed as little as possible.
  for(let pass=0;pass<groups.length*3;pass++){
    const badPairs=[];
    for(let gi=0;gi<groups.length;gi++) for(let i=0;i<groups[gi].length;i++) for(let j=i+1;j<groups[gi].length;j++){
      if(violates(groups[gi].filter(x=>x!==groups[gi][i]),groups[gi][j])) badPairs.push([gi,groups[gi][i],groups[gi][j]]);
    }
    if(!badPairs.length) return groups;
    let changed=false;
    for(const [gi,a,b] of badPairs){
      const candidates=[];
      for(let gj=0;gj<groups.length;gj++) if(gj!==gi){
        for(const q of groups[gj]){
          // Prefer swaps of similar level, then adjacent groups.
          const levelDiff=Math.abs((Number(level(a.level)?.weight)||0)-(Number(level(q.level)?.weight)||0));
          const dist=Math.abs(gi-gj);
          if(!violates(groups[gi].filter(x=>x!==a&&x!==b),q) &&
             !violates(groups[gj].filter(x=>x!==q),a) &&
             !violates(groups[gj].filter(x=>x!==q),b)){
            candidates.push({gj,q,cost:levelDiff*100+dist});
          }
        }
      }
      candidates.sort((x,y)=>x.cost-y.cost);
      if(candidates.length){
        const c=candidates[0],gj=c.gj,q=c.q;
        groups[gi]=groups[gi].map(x=>x===a?q:x);
        groups[gj]=groups[gj].map(x=>x===q?a:x);
        changed=true; break;
      }
    }
    if(!changed) return null;
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
function generateBalancedGroups(players,n){
  let best=null,bestPenalty=Infinity;
  const attempts=Math.min(2400,Math.max(400,n*180));
  for(let a=0;a<attempts;a++){
    let gs=buildStratifiedCandidate(players,n,a);
    // Randomly perturb within equal/nearby levels, then keep only valid restrictions.
    if(a%2===1){
      const order=[...players].sort(()=>Math.random()-.5);
      for(const p of order.slice(0,Math.min(8,order.length))){
        const from=gs.findIndex(g=>g.includes(p));
        const targets=[...Array(n).keys()].filter(i=>i!==from).sort(()=>Math.random()-.5);
        for(const to of targets){
          const q=gs[to].find(x=>Math.abs((Number(level(x)?.weight)||0)-(Number(level(p.level)?.weight)||0))<=1);
          if(q && !violates(gs[to].filter(x=>x!==q),p) && !violates(gs[from].filter(x=>x!==p),q)){
            gs[from]=gs[from].filter(x=>x!==p);gs[to]=gs[to].filter(x=>x!==q);gs[from].push(q);gs[to].push(p);break;
          }
        }
      }
    }
    if(restrictionPenalty(gs)>0)continue;
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
function groupMarkup(groups){return groups.map((g,i)=>`<div class="group group-color-${(i%10)+1}"><h3><span class="group-dot"></span>Groupe ${i+1} <span class="muted">(${g.length})</span></h3><ul>${sortPlayersForDisplay(g).map(p=>{const l=level(p.level);const idx=levelIndex(p.level)%10;return `<li><span class="level-dot level-dot-${idx}" title="${esc(l?.name||'Niveau')}" aria-label="${esc(l?.name||'Niveau')}"></span>${esc(p.name)}${p.goalkeeper?' <span class="keeper" title="Peut jouer gardien">🧤</span>':''}</li>`}).join('')}</ul></div>`).join('')}
function exportText(groups){return groups.map((g,i)=>`Groupe ${i+1}\n${sortPlayersForDisplay(g).map(p=>`${p.name}${p.goalkeeper?' 🧤':''}`).join('\n')}`).join('\n\n')}
function exportGroupsPNG(){if(!currentGroups)return;const groups=currentGroups;const cardW=360, pad=28, titleH=70, lineH=34, gap=20, cols=Math.min(2,groups.length), rows=Math.ceil(groups.length/cols);const heights=groups.map(g=>titleH+Math.max(1,g.length)*lineH+pad);const rowHeights=[];for(let r=0;r<rows;r++)rowHeights.push(Math.max(...groups.slice(r*cols,(r+1)*cols).map(g=>titleH+Math.max(1,g.length)*lineH+pad)));const canvas=document.createElement('canvas');canvas.width=cols*cardW+(cols+1)*gap;canvas.height=70+rowHeights.reduce((a,b)=>a+b,0)+(rows+1)*gap;const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#111827';ctx.font='bold 28px Arial';ctx.fillText(els.distName.value.trim()||'Répartition',gap,44);let y=70+gap;groups.forEach((g,i)=>{const col=i%cols,row=Math.floor(i/cols);let yy=70+gap+rowHeights.slice(0,row).reduce((a,b)=>a+b,0)+row*gap;let x=gap+col*(cardW+gap);ctx.fillStyle='#f8fafc';ctx.strokeStyle=['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][i%10];ctx.lineWidth=4;ctx.roundRect(x,yy,cardW,rowHeights[row],14,14);ctx.fill();ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 21px Arial';ctx.fillText(`Groupe ${i+1} (${g.length})`,x+18,yy+34);ctx.fillStyle='#111827';ctx.font='18px Arial';sortPlayersForDisplay(g).forEach((p,j)=>{const l=level(p.level),c=['#16a34a','#2563eb','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][levelIndex(p.level)%10];ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+24,yy+58+j*lineH,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111827';ctx.fillText(`${p.name}${p.goalkeeper?' 🧤':''}`,x+42,yy+64+j*lineH)})});canvas.toBlob(blob=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(els.distName.value.trim()||'repartition').replace(/[^a-z0-9_-]+/gi,'_')+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)})}
function printGroups(){if(!currentGroups)return;const title=els.distName.value.trim()||'Répartition';const w=window.open('','_blank');if(!w){alert('Autorise les fenêtres pop-up pour imprimer.');return}w.document.write(`<!doctype html><html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.g{border:3px solid #2563eb;border-radius:12px;padding:12px}.g h2{margin:0 0 10px;font-size:18px}.p{padding:4px 0}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px} @media print{body{padding:10px}.grid{gap:10px}}</style></head><body><h1>${esc(title)}</h1><div class="grid">${groups.map((g,i)=>`<div class="g" style="border-color:${['#2563eb','#16a34a','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][i%10]}"><h2>Groupe ${i+1} (${g.length})</h2>${sortPlayersForDisplay(g).map(p=>`<div class="p"><span class="dot" style="background:${['#16a34a','#2563eb','#f59e0b','#dc2626','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#4f46e5'][levelIndex(p.level)%10]}"></span>${esc(p.name)}${p.goalkeeper?' 🧤':''}</div>`).join('')}</div>`).join('')}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()}
function shareGroups(){if(!currentGroups)return;const title=els.distName.value.trim()||'Répartition';const text=`${title}

${exportText(currentGroups)}`;if(navigator.share){navigator.share({title,text}).catch(()=>{})}else{navigator.clipboard?.writeText(text);alert('La répartition a été copiée dans le presse-papiers.')}}
function playerLine(p,clickAttr=''){const l=level(p.level),idx=levelIndex(p.level)%10;return `<button type="button" class="manual-player ${manualSelectedIds.has(p.id)?'selected':''}" ${clickAttr}><span class="level-dot level-dot-${idx}" title="${esc(l?.name||'Niveau')}"></span><span>${esc(p.name)}</span>${p.goalkeeper?' <span class="keeper" title="Peut jouer gardien">🧤</span>':''}</button>`}
function manualWarnings(){const bad=[];for(const g of currentGroups||[])for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++)if(state.rules.some(r=>groupKeyPair(Number(r[0]),Number(r[1]))===groupKeyPair(g[i].id,g[j].id)))bad.push(`${g[i].name} + ${g[j].name}`);return bad}
function renderManual(){const allAssigned=new Set(currentGroups.flat().map(p=>p.id));const remaining=manualPool.filter(p=>!allAssigned.has(p.id));const bad=manualWarnings();els.result.innerHTML=`<div class="card manual-editor"><div class="subhead"><div><h2>Répartition manuelle</h2><div class="small muted">Clique sur plusieurs joueurs pour les sélectionner, puis ajoute-les au groupe voulu.</div></div><span class="count">${allAssigned.size}/${allAssigned.size+remaining.length} placés • ${manualSelectedIds.size} sélectionné(s)</span></div>${bad.length?`<div class="warning">🚫 Règle de séparation non respectée : ${bad.map(esc).join(' • ')}</div>`:''}<div class="manual-layout"><div class="manual-pool"><h3>Joueurs à placer <span class="count">(${remaining.length})</span></h3><div class="manual-list">${remaining.map(p=>playerLine(p,`data-manual-player="${p.id}"`)).join('')||'<div class="small muted">Tous les joueurs sont placés.</div>'}</div></div><div class="manual-groups">${currentGroups.map((g,i)=>`<div class="manual-group group-color-${(i%10)+1}"><h3><span class="group-dot"></span>Groupe ${i+1} <span class="muted">(${g.length})</span></h3><div class="manual-list">${g.map(p=>playerLine(p,`data-manual-remove="${p.id}"`)).join('')||'<div class="small muted">Clique sur un joueur à gauche pour l’ajouter ici.</div>'}</div><button type="button" class="manual-add-btn" data-add-group="${i}">+ Ajouter un joueur sélectionné</button></div>`).join('')}</div></div><div class="actions"><button type="button" id="btnResetManual">↺ Recommencer</button><button type="button" id="btnSaveCurrent" class="primary" ${remaining.length?'disabled':''}>💾 Enregistrer</button>${remaining.length?'': '<button type="button" id="btnExportPNG">🖼️ Image</button><button type="button" id="btnPrintGroups">📄 Imprimer / PDF</button><button type="button" id="btnShareGroups">📤 Partager</button>'}</div></div>`;bindManualEvents()}
let manualSelectedIds=new Set();
function bindManualEvents(){
  $$('#result [data-manual-player]').forEach(b=>b.addEventListener('click',()=>{
    const id=Number(b.dataset.manualPlayer);
    if(manualSelectedIds.has(id)) manualSelectedIds.delete(id); else manualSelectedIds.add(id);
    renderManual();
  }));
  $$('#result [data-add-group]').forEach(b=>b.addEventListener('click',()=>{
    if(!manualSelectedIds.size){alert('Sélectionne un ou plusieurs joueurs dans « Joueurs à placer ».');return}
    const ids=new Set(manualSelectedIds);
    const gi=Number(b.dataset.addGroup);
    const selected=manualPool.filter(p=>ids.has(p.id));
    currentGroups.forEach(g=>{for(let i=g.length-1;i>=0;i--)if(ids.has(g[i].id))g.splice(i,1)});
    currentGroups[gi].push(...selected);
    manualSelectedIds.clear();
    renderManual();
  }));
  $$('#result [data-manual-remove]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.manualRemove);currentGroups.forEach(g=>{const ix=g.findIndex(x=>x.id===id);if(ix>=0)g.splice(ix,1)});manualSelectedIds.delete(id);renderManual()}));
  const reset=$('#btnResetManual');if(reset)reset.addEventListener('click',()=>{currentGroups=Array.from({length:currentGroups.length},()=>[]);manualSelectedIds.clear();renderManual()});
  const saveBtn=$('#btnSaveCurrent');if(saveBtn)saveBtn.addEventListener('click',saveCurrent);const png=$('#btnExportPNG');if(png)png.addEventListener('click',exportGroupsPNG);const pr=$('#btnPrintGroups');if(pr)pr.addEventListener('click',printGroups);const sh=$('#btnShareGroups');if(sh)sh.addEventListener('click',shareGroups)
}
function renderResult(){if(!currentGroups)return;if(els.distType.value==='manual'){renderManual();return}const warning=els.distType.value==='level'?levelGoalkeeperWarnings(currentGroups):'';els.result.innerHTML=`<div class="card"><div class="subhead"><h2>Résultat</h2></div>${warning}<div class="group-grid">${groupMarkup(currentGroups)}</div><div class="actions"><button type="button" id="btnSaveCurrent" class="primary">💾 Enregistrer cette répartition</button><button type="button" id="btnExportPNG">🖼️ Image</button><button type="button" id="btnPrintGroups">📄 Imprimer / PDF</button><button type="button" id="btnShareGroups">📤 Partager</button></div></div>`;$('#btnSaveCurrent').addEventListener('click',saveCurrent);$('#btnExportPNG').addEventListener('click',exportGroupsPNG);$('#btnPrintGroups').addEventListener('click',printGroups);$('#btnShareGroups').addEventListener('click',shareGroups)}
function generate(){const players=selectedPlayers(),n=Number(els.groupCount.value),type=els.distType.value;manualSelectedIds.clear();if(!players.length){els.result.innerHTML='<div class="empty error">Sélectionne au moins un joueur.</div>';return}if(n>players.length){els.result.innerHTML='<div class="empty error">Il faut au moins un joueur par groupe.</div>';return}currentGroups=generateGroups(players,n,type);if(!currentGroups){els.result.innerHTML='<div class="empty error">⚠️ Impossible de respecter toutes les règles « jamais ensemble » avec ce nombre de groupes.</div>';return}renderResult()}
function saveCurrent(){const name=els.distName.value.trim()||`Répartition du ${new Date().toLocaleDateString('fr-FR')}`;state.history.unshift({id:Date.now(),name,type:els.distType.value,created:new Date().toISOString(),groups:currentGroups.map(g=>g.map(p=>({...p})))});save();renderHistory();alert('Répartition enregistrée.');showPage('history')}
function renderHistory(){els.historyList.innerHTML=state.history.length?state.history.map(h=>`<div class="history"><b>${esc(h.name)}</b><div class="small muted">${new Date(h.created).toLocaleString('fr-FR')} • ${h.groups.length} groupes • ${h.type==='level'?'Niveau':h.type==='balanced'?'Homogènes':'Manuelle'}</div><div class="history-actions"><button type="button" data-view-history="${h.id}">Voir</button><button type="button" data-delete-history="${h.id}">Supprimer</button></div></div>`).join(''):'<div class="empty">Aucune répartition enregistrée.</div>'}
function viewHistory(id){const h=state.history.find(x=>x.id===Number(id));if(!h)return;currentGroups=h.groups;showPage('create');els.distName.value=h.name;els.result.innerHTML=`<div class="card"><h2>${esc(h.name)}</h2><div class="group-grid">${groupMarkup(h.groups)}</div></div>`}
function addPlayer(){editingId=null;els.dialogTitle.textContent='Ajouter un joueur';els.playerName.value='';els.playerGoalkeeper.checked=false;renderLevelSelect(els.playerLevel,state.levels[0]?.id);els.dialog.showModal();setTimeout(()=>els.playerName.focus(),50)}
function editPlayer(id){const p=state.players.find(x=>x.id===Number(id));if(!p)return;editingId=p.id;els.dialogTitle.textContent='Modifier le joueur';els.playerName.value=p.name;els.playerGoalkeeper.checked=!!p.goalkeeper;renderLevelSelect(els.playerLevel,p.level);els.dialog.showModal()}
function bind(){
 els.nav.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.page==='home'){showPage('home')}else if(state){showPage(b.dataset.page)}}));
 if(els.btnHome)els.btnHome.addEventListener('click',()=>showPage('home'));
 if(els.btnAddFolder)els.btnAddFolder.addEventListener('click',addFolder);
 if(els.folderList)els.folderList.addEventListener('click',e=>{const c=e.target.closest('[data-open-folder]');if(c)openFolder(c.dataset.openFolder)});
 els.btnAddPlayer.addEventListener('click',addPlayer);els.btnImportPlayers?.addEventListener('click',()=>els.playerImportFile?.click());els.playerImportFile?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importPlayersFile(f);e.target.value=''});els.btnExportPlayers?.addEventListener('click',exportPlayersCSV);els.btnCancelDialog.addEventListener('click',()=>els.dialog.close());
 els.form.addEventListener('submit',e=>{e.preventDefault();const name=els.playerName.value.trim();if(!name)return;if(editingId!=null){const p=state.players.find(x=>x.id===editingId);p.name=name;p.level=Number(els.playerLevel.value);p.goalkeeper=els.playerGoalkeeper.checked}else state.players.push({id:Date.now(),name,level:Number(els.playerLevel.value),goalkeeper:els.playerGoalkeeper.checked});save();renderPlayers();renderCreate();renderSettings();els.dialog.close()});
 els.playerList.addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)editPlayer(b.dataset.edit)});
 els.attendance.addEventListener('change',updateAttendanceCount);els.btnAll.addEventListener('click',()=>{$$('#attendance input').forEach(x=>x.checked=true);updateAttendanceCount()});els.btnNone.addEventListener('click',()=>{$$('#attendance input').forEach(x=>x.checked=false);updateAttendanceCount()});els.btnGenerate.addEventListener('click',generate);
 els.btnAddLevel.addEventListener('click',()=>{const name=els.newLevelName.value.trim();if(!name){alert('Indique un nom de niveau.');return}const id=Date.now();state.levels.push({id,name,emoji:els.newLevelEmoji.value.trim()||'⚪',weight:Number(els.newLevelWeight.value)||1});save();els.newLevelName.value='';els.newLevelEmoji.value='';els.newLevelWeight.value='1';renderSettings();renderPlayers();renderCreate()});
 els.levelsSettings.addEventListener('change',e=>{const id=Number(e.target.dataset.levelName||e.target.dataset.levelWeight);const l=state.levels.find(x=>x.id===id);if(!l)return;if(e.target.dataset.levelName!==undefined){l.name=e.target.value.trim()||l.name}else{l.weight=Math.max(0,Number(e.target.value)||0)}save();renderPlayers();renderCreate();renderSettings()});
 els.levelsSettings.addEventListener('click',e=>{const b=e.target.closest('[data-delete-level]');if(!b)return;const id=Number(b.dataset.deleteLevel);if(state.levels.length<=1){alert('Il faut conserver au moins un niveau.');return}if(state.players.some(p=>p.level===id)){alert('Ce niveau est encore utilisé par un joueur. Change d’abord leur niveau.');return}state.levels=state.levels.filter(l=>l.id!==id);save();renderSettings();renderCreate();renderPlayers()});
 els.btnAddRule.addEventListener('click',()=>{const a=Number(els.ruleA.value),b=Number(els.ruleB.value);if(!a||!b||a===b){alert('Choisis deux joueurs différents.');return}if(state.rules.some(r=>(Number(r[0])===a&&Number(r[1])===b)||(Number(r[0])===b&&Number(r[1])===a))){alert('Cette règle existe déjà.');return}state.rules.push([a,b]);save();renderSettings()});
 els.rulesList.addEventListener('click',e=>{const b=e.target.closest('[data-delete-rule]');if(!b)return;state.rules.splice(Number(b.dataset.deleteRule),1);save();renderSettings()});
 els.historyList.addEventListener('click',e=>{const v=e.target.closest('[data-view-history]'),d=e.target.closest('[data-delete-history]');if(v)viewHistory(v.dataset.viewHistory);if(d&&confirm('Supprimer cette répartition ?')){state.history=state.history.filter(h=>h.id!==Number(d.dataset.deleteHistory));save();renderHistory()}});
}
function init(){bind();if(currentFolderId&&state){renderPlayers();renderCreate();renderSettings();renderHistory();showPage('players')}else{showPage('home')}}
init();
})();
