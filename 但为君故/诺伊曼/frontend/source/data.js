(function (g) {
  'use strict';
  const people = [
    {id:'hana',name:'藤原花奈',net:'佐久间眠',short:'眠'},
    {id:'qing',name:'顾清寒',net:'珍惜才配拥有',short:'珍'},
    {id:'qiu',name:'鱼沉秋',net:'cojack',short:'co'},
    {id:'chu',name:'楚羽笙',net:'楚楚的笙_unofficial',short:'笙'},
    {id:'nuo',name:'诺薇拉',net:'冯诺依曼',short:'冯'}
  ];
  const initial = {'结构版本':1,'世界':{'日期':'纪年第1日','时段':'早间','区':'未定','场所':'','面纱':'完好'},'主控':{'姓名':'','来历':'','异能倾向':'','异能':'','觉醒阶段':'未觉醒','代价':0,'暴露度':0},'角色':{},'事件':{'进行中':[]}};
  people.forEach(p=>initial.角色[p.name]={'已遇':false,'现实身份已知':false,'已知为觉醒者':false,'关系阶段':'陌生人','好感':0,'其他信息':''});
  const demo=JSON.parse(JSON.stringify(initial));
  Object.assign(demo.世界,{'日期':'纪年第3日','时段':'傍晚','区':'江北','场所':'市图书馆新馆','面纱':'有裂痕'});
  Object.assign(demo.主控,{'姓名':'旅人','来历':'初到南江，在江北暂住。','异能倾向':'希望记住那些容易被遗忘的细节。','异能':'尚在理解这次觉醒留下的变化。','觉醒阶段':'初醒','代价':34,'暴露度':14});
  const states=[['信任',24,true,true,'她答应下次见面时，带来那本还没有读完的书。'],['熟悉',10,false,false,'在街角碰过面。她似乎不愿多谈自己的事。'],['认识',3,true,false,'她摘下耳机，听完了你的话。'],['熟悉',-12,true,false,'群里那场拌嘴还没有结束。'],['认识',8,true,true,'她把那页资料折了一个角，说可以再看看。']];
  people.forEach((p,i)=>{const [stage,favor,identity,awake,note]=states[i]; Object.assign(demo.角色[p.name],{'已遇':true,'现实身份已知':identity,'已知为觉醒者':awake,'关系阶段':stage,'好感':favor,'其他信息':note});});
  demo.事件.进行中=[{'标题':'那辆失踪了十一分钟的车','状态':'未接'}, {'标题':'图书馆里被折起的一页','状态':'进行中'}];
  const places=[
    {name:'江北',title:'城市醒来的地方',desc:'大学、医院与旧街巷共同构成南江的日常。这里有要赶的早课，也有还没吃完的早点。',landmarks:['南江大学','市图书馆新馆','市民广场'],note:'南江大学的本部与文科院系位于江北。',pos:'20%'},
    {name:'江南',title:'江对岸，灯还亮着',desc:'摩天楼沿江排列，金融与艺术塑造这座城市面向世界的轮廓。几条街之外，是仍有人晾衣做饭的老码头。',landmarks:['江湾 CBD','南江歌剧院','老码头'],note:'滨江人文带与滨江科创走廊属于江南。',pos:'80%'},
    {name:'新区',title:'下一班车，即将进站',desc:'白天的人流涌向远处，夜晚回到地铁口与夜市。新建街区和未完成的旧港，在同一座城里并置。',landmarks:['夜市街群','南江大学分校区','旧港区'],note:'大学分校区以工科与新建院系为主。',pos:'45%'},
    {name:'月石',title:'这里用班次计算时间',desc:'岸桥、货轮与厂区构成临海工业区的轮廓。凌晨的班车照常发出，食堂的灯跟着另一批人亮起。',landmarks:['月石港','产业大道','生活服务街'],note:'港口与工业区的节奏来自轮班，而非日夜。',pos:'95%'}
  ];
  g.NightArchiveData={people,initial,demo,places};
})(window);
