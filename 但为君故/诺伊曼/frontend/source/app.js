(function (g) {
  'use strict';
  const D=g.NightArchiveData;
  const icons={arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',back:'<path d="M20 12H5m6-6-6 6 6 6"/>',pin:'<path d="M19 10c0 6-7 11-7 11S5 16 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',check:'<path d="m5 12 4 4L19 6"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',file:'<path d="M14 2H5v20h14V7Zm0 0v5h5M8 12h8m-8 4h6"/>',minus:'<path d="M5 12h14"/>'};
  const ico=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[n]||icons.file}</svg>`;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const copy=v=>JSON.parse(JSON.stringify(v));
  const bool=v=>v===true||v===1||v==='true';
  const signed=n=>(n>0?'+':'')+n;
  const stageList=['陌生人','认识','熟悉','信任','亲密','破裂'];
  const enums={时段:['早间','上午','午间','下午','傍晚','晚间','深夜','凌晨'],区:['江北','江南','新区','月石','未定'],面纱:['完好','有裂痕','局部暴露'],觉醒阶段:['未觉醒','初醒','掌控','过载']};
  function normalize(input){
    const s=obj(input?.stat_data)?input.stat_data:input;
    if(!obj(s)||!obj(s.世界)||!obj(s.主控)||!obj(s.角色)||!obj(s.事件))throw Error('需要包含世界、主控、角色和事件的 stat_data 对象。');
    if(s.结构版本!==1)throw Error('暂不支持这个结构版本，请使用结构版本 1。');
    function str(v,path){if(typeof v!=='string')throw Error(path+' 应当是文字。');if(v.length>12000)throw Error(path+' 文字过长。');return v;}
    function num(v,min,max,path){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error(path+' 数值超出有效范围。');return v;}
    function en(v,values,path){if(!values.includes(v))throw Error(path+' 的状态无法识别。');return v;}
    const w={},u={};
    for(const k of ['日期','场所'])w[k]=str(s.世界[k],'世界/'+k);
    for(const k of ['时段','区','面纱'])w[k]=en(s.世界[k],enums[k],'世界/'+k);
    for(const k of ['姓名','来历','异能倾向','异能'])u[k]=str(s.主控[k],'主控/'+k);
    u.觉醒阶段=en(s.主控.觉醒阶段,enums.觉醒阶段,'觉醒阶段');
    for(const k of ['代价','暴露度'])u[k]=num(s.主控[k],0,100,k);
    const people=D.people.map(p=>{
      const r=s.角色[p.name];
      if(!obj(r))return {...p,missing:true,met:false,identity:false,awake:false,stage:'状态缺失',favor:null,note:''};
      for(const k of ['已遇','现实身份已知','已知为觉醒者'])if(![true,false,0,1,'true','false'].includes(r[k]))throw Error(p.name+'/'+k+' 应当是明确的是或否。');
      return {...p,met:bool(r.已遇),identity:bool(r.现实身份已知),awake:bool(r.已知为觉醒者),stage:en(r.关系阶段,stageList,'关系阶段'),favor:num(r.好感,-100,100,'好感'),note:str(r.其他信息,'其他信息')};
    });
    if(!Array.isArray(s.事件.进行中))throw Error('事件/进行中 应当是数组。');
    const events=s.事件.进行中.map(e=>{if(!obj(e))throw Error('线索格式不正确。');return {title:str(e.标题,'线索标题'),status:en(e.状态,['未接','进行中','完成','失败'],'线索状态')};}).filter(e=>['未接','进行中'].includes(e.status));
    return {w,u,people,events,raw:copy(s)};
  }
  function mount(root,options={}){
    if(!root||root.nodeType!==1)throw Error('需要提供有效的挂载元素。');
    if(root.__nightArchive)root.__nightArchive.destroy();
    root.classList.add('na');
    const compact=options.surface==='status';
    if(compact)root.classList.add('na-compact');
    let compactOpen=false;
    let contextId=String(options.contextId||'offline-demo');
    let source=options.mode==='demo'?'演示存档':'当前存档',floor=options.floor==null?'':String(options.floor);
    let vm=null,problem='',page='people',selected=0,place=0,openingStep=0,toastTimer=null,disposed=false,opener=null;
    let draft={name:'',from:'',reason:'',wish:''};
    const base=options.assetBase||'assets/';
    const imageSrc=id=>esc(g.NightArchiveAssets?.[id]||base+id+'.png');
    const storeKey=()=> 'night-archive:draft:v1:'+contextId;
    function readDraft(){draft={name:'',from:'',reason:'',wish:''};try{const x=JSON.parse(sessionStorage.getItem(storeKey()));if(obj(x))for(const k of Object.keys(draft))if(typeof x[k]==='string')draft[k]=x[k].slice(0,1200);}catch{}}
    function saveDraft(){try{sessionStorage.setItem(storeKey(),JSON.stringify(draft));}catch{}}
    readDraft();
    function accept(input){try{vm=normalize(input);problem='';return true;}catch(e){problem=e.message;return false;}}
    if(options.snapshot)accept(options.snapshot);else if(options.mode==='demo')accept(D.demo);else problem='尚未收到状态数据。';
    function statusColor(s){return s==='破裂'?'danger':['信任','亲密'].includes(s)?'safe':'';}
    function meter(name,n){const kind=n>80?'danger':n>20?'warn':'safe',word=n>80?'危险':n>50?'严重':n>20?'明显':'轻微';return `<div class="meter ${kind}"><div class="meter-top"><span>${name} <span class="muted">· ${word}</span></span><span class="number"><strong>${n}</strong><span class="muted"> / 100</span></span></div><div class="meter-track" role="meter" aria-label="${name}，${word}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${n}"><i style="width:${n}%"></i></div></div>`;}
    function hud(){if(!vm)return '';const {w,u}=vm;return `<section class="hud" aria-label="此刻状态"><div class="location-block"><div class="location">${ico('pin')}<span>${esc(w.区)}${w.场所?' / '+esc(w.场所):' · 场所未定'}</span></div><div class="date">${esc(w.日期)} · ${esc(w.时段)} · ${esc(u.觉醒阶段)}</div></div>${meter('代价',u.代价)}${meter('暴露',u.暴露度)}<div class="veil ${w.面纱==='完好'?'safe':w.面纱==='有裂痕'?'warn':'danger'}">${ico(w.面纱==='完好'?'eye':'file')}<span>面纱 · ${esc(w.面纱)}</span></div></section>`;}
    function header(){return `<header class="topbar"><button class="brand" data-page="opening" aria-label="但为君故，初到南江"><strong>但为君故</strong><span>沉吟至今</span></button><nav class="nav" aria-label="主要导航">${[['now','此刻'],['people','人物'],['city','南江'],['opening','初到南江']].map(([p,n])=>`<button data-page="${p}" ${page===p?'aria-current="page"':''}>${n}</button>`).join('')}</nav><button class="text-button source-button" data-action="source"><span class="source-dot"></span>${esc(source)}</button></header>`;}
    function portrait(p){return p.identity?`<img class="portrait-photo" src="${imageSrc(p.id)}" alt="${esc(p.name)}的原创概念立绘"><div class="portrait-empty" hidden><strong>${esc(p.name)}</strong><span>画面暂不可用</span></div>`:`<div class="unseen">${ico('lock')}尚未识得真容</div>`;}
    function avatar(p){return `<span class="avatar">${p.identity?`<img src="${imageSrc(p.id)}" alt="">`:esc(p.short)}</span>`;}
    function personPage(){const p=vm.people[selected];const fav=p.favor;const width=fav===null?0:Math.abs(fav)/2;const left=fav!==null&&fav<0?50-width:50;return `<div class="page-heading"><span class="page-label">与你相逢的人</span><p>知道一个名字，未必就认识一个人。</p></div><section class="archive" aria-label="人物档案"><div class="people" aria-label="选择人物">${vm.people.map((m,i)=>`<button class="person-select" data-person="${i}" aria-pressed="${i===selected}">${avatar(m)}<span class="who"><strong>${esc(m.net)}</strong><span>${m.identity?esc(m.name):'现实身份未揭晓'}</span></span></button>`).join('')}<div class="people-foot">五个名字。<br>五种尚未说完的人生。</div></div><div class="portrait">${portrait(p)}<div class="portrait-caption"><h1>${esc(p.identity?p.name:p.net)}</h1><p>${p.identity?esc(p.net):'你认识的是这个网名。'}</p></div></div><div class="dossier"><h2>我们之间</h2><div class="relationship"><strong class="${statusColor(p.stage)}">${esc(p.stage)}</strong><span class="favor number ${fav<0?'danger':'safe'}">${fav===null?'—':signed(fav)}</span></div><div class="bipolar" role="img" aria-label="好感 ${fav===null?'未知':signed(fav)}，范围负100至100"><i class="${fav<0?'negative':''}" style="left:${left}%;width:${width}%"></i></div><div class="scale number"><span>−100</span><span>0</span><span>+100</span></div><div class="rule"></div><h3>已知身份</h3><dl class="identity-list"><div><dt>线下相遇</dt><dd>${p.missing?'状态缺失':p.met?'已相遇':'未相遇'}</dd></div><div><dt>现实身份</dt><dd><span class="identity-icon ${p.identity?'accent':'muted'}">${ico(p.identity?'check':'lock')}${p.identity?'已揭晓':'未揭晓'}</span></dd></div><div><dt>觉醒者身份</dt><dd><span class="identity-icon ${p.awake?'accent':'muted'}">${ico(p.awake?'check':'lock')}${p.awake?'已知':'未知'}</span></dd></div></dl><div class="notes"><h3>留在记忆里的事</h3><p>${esc(p.note||(p.met?'暂时没有留下新的记事。':'你们的故事，尚未开始。'))}</p><p class="small">${source==='演示存档'?'此处关系与记事为界面演示。':'仅展示当前存档里的记事。'}</p></div><div class="dossier-end"><button class="text-button" data-action="prev" aria-label="上一位人物">${ico('back')}</button><span class="small muted">${selected+1} / 5</span><button class="text-button" data-action="next" aria-label="下一位人物">${ico('arrow')}</button></div></div></section>${hud()}`;}
    function nowPage(){return `<section class="overview"><h1>此刻的南江</h1><p>${esc(vm.u.姓名||'还未留下名字的你')}，世界记得你走过的路。</p>${hud()}<div class="overview-grid"><div><h2>相逢</h2>${vm.people.map((p,i)=>`<button class="row person-row" data-open-person="${i}"><div><strong>${esc(p.net)}</strong><div class="row-meta">${p.identity?esc(p.name):'现实身份未揭晓'} · ${p.met?'已相遇':'未相遇'}</div></div><div class="relation-end ${statusColor(p.stage)}">${esc(p.stage)} <span class="number">${p.favor===null?'—':signed(p.favor)}</span></div></button>`).join('')}</div><div><div class="clues-title"><h2>未完的线索</h2><span class="muted small">${vm.events.length} 条</span></div>${vm.events.length?vm.events.slice(0,5).map(e=>`<div class="row clue-row">${ico('file')}<div><strong>${esc(e.title||'未命名线索')}</strong></div><span class="tag">${esc(e.status)}</span></div>`).join(''):'<p class="empty">还没有进行中的线索。<br>先走进这座城市，看看会遇见什么。</p>'}${vm.events.length>5?'<p class="public-note">这里只展示前五条进行中线索。</p>':''}<div class="rule"></div><h3>你身上的变化</h3><p class="public-note">${esc(vm.u.异能||'你尚未理解可能发生的异常。')}</p><p class="public-note">${source==='演示存档'?'演示中的数值不会随点击发生变化。':'状态由故事进展更新。'}</p></div></div></section>`;}
    function cityPage(){const p=D.places[place];return `<section class="city-page"><div class="city-tabs" aria-label="选择城区">${D.places.map((x,i)=>`<button data-place="${i}" aria-pressed="${i===place}">${x.name}</button>`).join('')}</div><div class="city-visual"><img src="${imageSrc('city')}" style="object-position:${p.pos} center" alt="南江城市氛围概念画"><span class="scene-disclosure">南江氛围图 · 非该城区实景地图</span><h1>${p.name}</h1></div><div class="city-info"><div><h2>${p.title}</h2><p>${p.desc}</p></div><div><h3>可以认识的地方</h3><div class="places-list">${p.landmarks.map(x=>`<span>${x}</span>`).join('')}</div><p class="small">${p.note}</p></div></div><div class="rule"></div><p class="public-note">公开城市索引。地点的隐秘一面，留待故事中发现。</p></section>`;}
    function openingPage(){if(openingStep===1)return wizard();if(openingStep===2)return preview();return `<section class="opening"><img class="opening-bg" src="${imageSrc('city')}" alt="江北旧巷，路灯初亮，江对岸的城市笼罩在暮色里"><div class="opening-content"><h1>但为君故</h1><p class="subtitle">沉吟至今</p><p class="opening-copy">窗外，第一盏路灯亮了。<br>群里有人提起一辆失踪了十一分钟的车，<br>很快，又被猫图盖了过去。</p><p class="opening-copy">你来到南江，总有一个理由。</p><button class="primary" data-action="begin">写下我的来意 ${ico('arrow')}</button><p class="opening-note">从一个名字开始。其余的，慢慢说。</p></div></section>`;}
    function wizard(){return `<section class="wizard"><div class="intro"><h2>先说说，你是谁。</h2><p>不必面面俱到。留下你愿意说的部分，让故事从推开门的那一刻继续。</p><div class="rule"></div><p class="small">异常的倾向是一份期待。真正发生的变化，会在故事里慢慢成形。</p><button class="text-button" data-action="opening-back">${ico('back')} 返回南江</button></div><form data-form="opening"><label>别人如何称呼你<input type="text" name="name" maxlength="80" autocomplete="off" placeholder="一个名字，或一个称呼" value="${esc(draft.name)}"></label><label>原本在哪里，做些什么<textarea name="from" maxlength="1200" placeholder="读书、工作，或者只是暂时停留……">${esc(draft.from)}</textarea></label><label>为什么来到南江<textarea name="reason" maxlength="1200" placeholder="找人、谋生、逃开某件事，或没有特别的理由。">${esc(draft.reason)}</textarea></label><label>如果异常发生，你希望那是什么样子<textarea name="wish" maxlength="1200" placeholder="一句话就好，也可以留给故事回答。">${esc(draft.wish)}</textarea></label><div class="form-actions"><button class="primary" type="submit">看看我的开场 ${ico('arrow')}</button></div><p class="small muted">草稿保留在本次浏览会话。此处不会改变人物或世界状态。</p></form></section>`;}
    function draftText(){return [draft.name.trim()?'你可以叫我'+draft.name.trim()+'。':'我暂时还不想说出名字。',draft.from.trim()?'来到南江以前，'+draft.from.trim():'',draft.reason.trim()?'我来南江，是因为'+draft.reason.trim():'',draft.wish.trim()?'如果有一天异常发生在我身上，我希望：'+draft.wish.trim():'','故事从我推开这扇门开始。'].filter(Boolean).join('\n\n');}
    function preview(){return `<section class="preview-wrap"><h2>故事开始之前</h2><p class="public-note">这是你的开场发言。你可以继续修改，再交给故事。</p><div class="draft-preview" id="na-draft-text">${esc(draftText())}</div><div class="form-actions"><button class="secondary" data-action="edit-draft">${ico('back')} 返回修改</button><button class="primary" data-action="copy-draft">复制开场发言 ${ico('arrow')}</button></div><p class="public-note">复制后粘贴到酒馆输入框，按正常方式发送。问卷不会提前赋予你能力。</p></section>`;}
    function dialog(){return `<dialog aria-labelledby="na-dialog-title"><div class="dialog-head"><h2 id="na-dialog-title">选择记录</h2><button class="text-button" data-action="close-dialog" aria-label="关闭">${ico('close')}</button></div><p>演示记录用于查看界面；初入南江保留所有尚未揭晓的身份。导入只影响当前预览。</p><div class="scenario-options"><button class="secondary" data-scenario="demo"><span>重逢之后</span><small>演示存档</small></button><button class="secondary" data-scenario="initial"><span>初入南江</span><small>原始初始状态</small></button></div><label>导入状态 JSON<input class="file-input" type="file" accept=".json,application/json" data-import></label><p class="small">接受结构版本 1 的 stat_data 或包含它的对象。文件只在本地读取，最大 1 MB。</p><p class="dialog-error" role="alert"></p></dialog>`;}
    function render(){if(disposed)return;const oldFocus=root.ownerDocument.activeElement;const focusKey=oldFocus&&root.contains(oldFocus)?['data-person','data-place','data-action','data-page'].map(a=>oldFocus.hasAttribute(a)?[a,oldFocus.getAttribute(a)]:null).find(Boolean):null;
      const content=problem?`<section class="fatal"><h2>状态暂不可用</h2><p>${esc(problem)}</p><button class="secondary" data-action="source">选择一份有效记录</button></section>`:page==='people'?personPage():page==='now'?nowPage():page==='city'?cityPage():openingPage();
      const compactDetails=compactOpen&&vm&&!problem?`<div class="compact-details"><h3>相逢</h3>${vm.people.map(p=>`<div class="row"><div><strong>${esc(p.net)}</strong><span class="small muted">${p.identity?esc(p.name):'现实身份未揭晓'} · ${p.awake?'觉醒者已知':'觉醒者未知'}</span></div><span class="small ${statusColor(p.stage)}">${esc(p.stage)} ${p.favor===null?'—':signed(p.favor)}</span></div>`).join('')}<h3 class="compact-clues">未完的线索</h3>${vm.events.length?vm.events.slice(0,5).map(e=>`<div class="row"><span>${esc(e.title)}</span><span class="small muted">${esc(e.status)}</span></div>`).join(''):'<p class="empty">暂无线索。</p>'}</div>`:'';
      root.innerHTML=(compact?`<main>${problem?content:hud()}<div class="compact-actions"><span class="small muted">${esc(source)}${floor?' · 楼层 '+esc(floor):''}</span><button class="text-button" data-action="compact-toggle" aria-expanded="${compactOpen}">${compactOpen?'收起记录':'展开人物与线索'}</button></div>${compactDetails}</main>`:header()+`<main class="page">${content}</main><footer class="bottomline"><span>南江的夜很长。总有人，还没有睡。</span><button class="text-button" data-action="source">${esc(source)}${floor?' · 楼层 '+esc(floor):''} · ${source==='演示存档'?'虚构进度':'只读展示'}</button></footer>`)+dialog()+`<div class="toast" role="status" hidden></div>`;
      root.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const empty=img.parentElement.querySelector('.portrait-empty');if(empty)empty.hidden=false;},{once:true}));
      if(focusKey){const f=Array.from(root.querySelectorAll('['+focusKey[0]+']')).find(x=>x.getAttribute(focusKey[0])===focusKey[1]);if(f)f.focus({preventScroll:true});}
    }
    function toast(msg){clearTimeout(toastTimer);const t=root.querySelector('.toast');t.textContent=msg;t.hidden=false;toastTimer=setTimeout(()=>{if(!disposed)t.hidden=true;},4000);}
    function closeDialog(){root.querySelector('dialog').close();if(opener?.isConnected)opener.focus();}
    function switchContext(next){saveDraft();contextId=String(next);readDraft();selected=0;openingStep=0;compactOpen=false;}
    function scenario(name){switchContext('offline-'+name);source=name==='demo'?'演示存档':'初入南江';floor='';accept(name==='demo'?D.demo:D.initial);render();toast(name==='demo'?'已载入演示进度。':'已回到初入南江，所有身份尚未揭晓。');}
    async function clipboard(){const text=draftText();try{await navigator.clipboard.writeText(text);toast('开场发言已复制，可粘贴到酒馆发送。');}catch{const el=root.querySelector('#na-draft-text');const sel=g.getSelection();const range=root.ownerDocument.createRange();range.selectNodeContents(el);sel.removeAllRanges();sel.addRange(range);toast('已选中开场文字，请长按或按 Ctrl+C 复制。');}}
    function handleClick(e){const b=e.target.closest('button');if(!b||!root.contains(b))return;
      if(b.dataset.page){page=b.dataset.page;render();return;}
      if(b.dataset.person!==undefined){selected=Number(b.dataset.person);render();return;}
      if(b.dataset.openPerson!==undefined){selected=Number(b.dataset.openPerson);page='people';render();root.querySelector('main').scrollIntoView({block:'start'});return;}
      if(b.dataset.place!==undefined){place=Number(b.dataset.place);render();return;}
      if(b.dataset.scenario){scenario(b.dataset.scenario);return;}
      switch(b.dataset.action){case 'compact-toggle':compactOpen=!compactOpen;render();break;case 'prev':selected=(selected+4)%5;render();break;case 'next':selected=(selected+1)%5;render();break;case 'source':opener=b;root.querySelector('dialog').showModal();break;case 'close-dialog':closeDialog();break;case 'begin':case 'edit-draft':openingStep=1;render();break;case 'opening-back':openingStep=0;render();break;case 'copy-draft':clipboard();break;}
    }
    function handleInput(e){if(e.target.closest('[data-form="opening"]')&&Object.hasOwn(draft,e.target.name)){draft[e.target.name]=e.target.value;saveDraft();}}
    function handleSubmit(e){if(!e.target.matches('[data-form="opening"]'))return;e.preventDefault();saveDraft();openingStep=2;render();}
    async function handleChange(e){if(!e.target.matches('[data-import]'))return;const file=e.target.files[0];if(!file)return;const error=root.querySelector('.dialog-error');try{if(file.size>1048576)throw Error('文件超过 1 MB，请选择精简后的状态 JSON。');const parsed=JSON.parse(await file.text());if(disposed)return;const next=normalize(parsed);switchContext('import-'+file.name+'-'+file.lastModified);vm=next;problem='';source='导入记录';floor='';render();toast('已载入记录，所有数据均在本地读取。');}catch(err){error.textContent=err instanceof SyntaxError?'无法读取 JSON，请检查文件内容。':err.message;e.target.value='';}}
    function handleKey(e){if(e.key==='Escape'&&root.querySelector('dialog').open){e.preventDefault();closeDialog();}if(e.target.matches('.person-select')&&['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();selected=(selected+(['ArrowDown','ArrowRight'].includes(e.key)?1:4))%5;render();root.querySelector('[data-person="'+selected+'"]').focus();}}
    root.addEventListener('click',handleClick);root.addEventListener('input',handleInput);root.addEventListener('submit',handleSubmit);root.addEventListener('change',handleChange);root.addEventListener('keydown',handleKey);
    const api={
      update(snapshot,meta={}){if(disposed)return false;if(meta.contextId!==undefined&&String(meta.contextId)!==contextId){switchContext(meta.contextId);vm=null;}if(meta.floor!==undefined)floor=String(meta.floor);source=meta.sourceLabel||'当前存档';const ok=accept(snapshot);render();return ok;},
      unavailable(message='尚未收到状态数据。'){problem=String(message);render();},
      getDraft(){return {contextId,...copy(draft),message:draftText()};},
      destroy(){if(disposed)return;saveDraft();disposed=true;clearTimeout(toastTimer);root.removeEventListener('click',handleClick);root.removeEventListener('input',handleInput);root.removeEventListener('submit',handleSubmit);root.removeEventListener('change',handleChange);root.removeEventListener('keydown',handleKey);root.innerHTML='';root.classList.remove('na','na-compact');delete root.__nightArchive;}
    };
    root.__nightArchive=api;render();return api;
  }
  g.NightArchive={mount,normalize};
})(window);
