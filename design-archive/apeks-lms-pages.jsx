// apeks-lms-pages.jsx v2 — Visual formula editor + updated design

// ── FORMULA EDITOR ENGINE ────────────────────────────────────────────────────
function useFormulaEditor() {
  const [tokens, setTokens] = React.useState([{type:'text', v:''}]);
  const [focus, setFocus] = React.useState({idx:0, field:'v'});

  const update = (cb) => setTokens(prev => { const next = cb([...prev.map(t=>({...t}))]); return next; });

  const append = (ch) => update(ts => { ts[focus.idx][focus.field] = (ts[focus.idx][focus.field]||'') + ch; return ts; });

  const backspace = () => {
    const val = tokens[focus.idx]?.[focus.field] ?? '';
    if (val.length > 0) {
      update(ts => { ts[focus.idx][focus.field] = val.slice(0,-1); return ts; });
    } else if (tokens.length > 1) {
      const newToks = tokens.filter((_,i) => i !== focus.idx);
      setTokens(newToks);
      const prevIdx = Math.max(0, focus.idx - 1);
      const prevTok = newToks[prevIdx];
      setFocus({idx: prevIdx, field: prevTok?.type === 'text' ? 'v' : prevTok?.type === 'frac' ? 'd' : 'a'});
    }
  };

  const clear = () => { setTokens([{type:'text',v:''}]); setFocus({idx:0,field:'v'}); };

  const insertSpecial = (type, extra={}) => {
    const after = {type:'text', v:''};
    const newTok = {type, ...extra};
    const firstField = type === 'frac' ? 'n' : type === 'pow' ? 'e' : type === 'sub' ? 's' : 'a';
    setTokens(prev => {
      const ins = [...prev.slice(0, focus.idx+1), newTok, after, ...prev.slice(focus.idx+1)];
      return ins;
    });
    setFocus({idx: focus.idx+1, field: firstField});
  };

  const tabNext = () => {
    const tok = tokens[focus.idx];
    if (tok?.type === 'frac' && focus.field === 'n') { setFocus({...focus, field:'d'}); return; }
    if (focus.idx < tokens.length - 1) {
      const next = tokens[focus.idx + 1];
      setFocus({idx: focus.idx+1, field: next?.type==='text'?'v': next?.type==='frac'?'n': 'a'});
    }
  };

  const toPlainText = () => tokens.map(t => {
    if (t.type==='text') return t.v;
    if (t.type==='frac') return `(${t.n||'□'})/(${t.d||'□'})`;
    if (t.type==='sqrt') return `${t.n?t.n+'√':'√'}(${t.a||'□'})`;
    if (t.type==='pow') return `^(${t.e||'□'})`;
    if (t.type==='sub') return `_(${t.s||'□'})`;
    return '';
  }).join('');

  const isEmpty = tokens.every(t => Object.values(t).filter(v=>typeof v==='string'&&v!==t.type).every(v=>!v));

  return {tokens, focus, setFocus, append, backspace, clear, insertSpecial, tabNext, toPlainText, isEmpty};
}

// ── FORMULA TOKEN RENDERER ───────────────────────────────────────────────────
function FormulaDisplay({tokens, focus, setFocus, t, disabled, fs=20}) {
  const Cursor = () => (
    <span style={{display:'inline-block',width:1.5,height:'1em',background:t.cyan,marginLeft:1,verticalAlign:'middle',animation:'blink 1s step-end infinite'}}/>
  );

  const Field = ({val, idx, field, style: xs}) => {
    const active = !disabled && focus.idx===idx && focus.field===field;
    return (
      <span onClick={()=>!disabled&&setFocus({idx,field})} style={{cursor:'text', color: active ? t.cyan : t.text, ...xs}}>
        {val||<span style={{opacity:0.25,fontSize:'0.85em'}}>□</span>}
        {active && <Cursor/>}
      </span>
    );
  };

  return (
    <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',minHeight:56,padding:'10px 16px',gap:1,fontSize:fs,fontFamily:'Georgia,serif',lineHeight:1.5}}>
      {tokens.map((tok, idx) => {
        if (tok.type === 'text') return (
          <Field key={idx} val={tok.v} idx={idx} field="v"/>
        );
        if (tok.type === 'frac') return (
          <span key={idx} style={{display:'inline-flex',flexDirection:'column',alignItems:'center',verticalAlign:'middle',margin:'0 3px',fontSize:'0.85em'}}>
            <Field val={tok.n} idx={idx} field="n" style={{borderBottom:`1.5px solid ${t.sec}`,paddingBottom:2,paddingLeft:6,paddingRight:6,minWidth:18,textAlign:'center'}}/>
            <Field val={tok.d} idx={idx} field="d" style={{paddingTop:2,paddingLeft:6,paddingRight:6,minWidth:18,textAlign:'center'}}/>
          </span>
        );
        if (tok.type === 'sqrt') return (
          <span key={idx} style={{display:'inline-flex',alignItems:'flex-start',verticalAlign:'middle',margin:'0 2px'}}>
            <span style={{fontSize:'1.2em',lineHeight:1,marginRight:1,color:t.cyan}}>
              {tok.n ? <><sup style={{fontSize:'0.6em',verticalAlign:'super'}}>{tok.n}</sup>√</> : '√'}
            </span>
            <Field val={tok.a} idx={idx} field="a" style={{borderTop:`1.5px solid ${t.sec}`,paddingTop:2,paddingLeft:4,paddingRight:4,minWidth:12}}/>
          </span>
        );
        if (tok.type === 'pow') return (
          <sup key={idx} style={{fontSize:'0.65em',lineHeight:1,verticalAlign:'super'}}>
            <Field val={tok.e} idx={idx} field="e" style={{minWidth:8}}/>
          </sup>
        );
        if (tok.type === 'sub') return (
          <sub key={idx} style={{fontSize:'0.65em',lineHeight:1,verticalAlign:'sub'}}>
            <Field val={tok.s} idx={idx} field="s" style={{minWidth:8}}/>
          </sub>
        );
        return null;
      })}
      {tokens.every(t=>(t.v===''||!t.v)&&!t.n&&!t.d&&!t.a&&!t.e&&!t.s) && !focus && (
        <span style={{color:t.muted,fontSize:16,fontFamily:'Inter,sans-serif'}}>Введи формулу…</span>
      )}
    </div>
  );
}

// ── FORMULA KEYBOARD ─────────────────────────────────────────────────────────
const KB_TABS = {
  numbers: {
    label: '123',
    keys: [
      {l:'7'},{l:'8'},{l:'9'},{l:'÷',v:'÷'},
      {l:'4'},{l:'5'},{l:'6'},{l:'×',v:'×'},
      {l:'1'},{l:'2'},{l:'3'},{l:'−',v:'−'},
      {l:'0'},{l:'.'},  {l:'='},  {l:'+'},
      {l:'('},{l:')'},{l:','},{l:'←',action:'back'},
    ],
    cols: 4,
  },
  struct: {
    label: 'a/b',
    keys: [
      {l:'a/b', action:'frac', desc:'Дробь'},
      {l:'xⁿ', action:'pow', desc:'Степень'},
      {l:'√x', action:'sqrt', desc:'Квадратный корень'},
      {l:'∛x', action:'cbrt', desc:'Кубический корень'},
      {l:'ⁿ√x', action:'nrt', desc:'Корень n-й степени'},
      {l:'x₁', action:'sub', desc:'Нижний индекс'},
      {l:'|x|',v:'|'},
      {l:'⌊x⌋',v:'⌊'},
      {l:'n!', v:'!'},
      {l:'…',v:'…'},
    ],
    cols: 5,
  },
  funcs: {
    label: 'sin',
    keys: [
      {l:'sin',v:'sin '},{l:'cos',v:'cos '},{l:'tan',v:'tan '},{l:'cot',v:'cot '},
      {l:'arcsin',v:'arcsin '},{l:'arccos',v:'arccos '},{l:'arctan',v:'arctan '},
      {l:'ln',v:'ln '},{l:'log',v:'log '},{l:'lg',v:'lg '},
      {l:'eˣ',v:'e^'},{l:'π',v:'π'},{l:'e',v:'e'},
      {l:'floor',v:'⌊'},{l:'ceil',v:'⌈'},
    ],
    cols: 4,
  },
  greek: {
    label: 'αβγ',
    keys: [
      {l:'α'},{l:'β'},{l:'γ'},{l:'δ'},{l:'ε'},{l:'ζ'},{l:'η'},{l:'θ'},
      {l:'λ'},{l:'μ'},{l:'ν'},{l:'ξ'},{l:'π'},{l:'ρ'},{l:'σ'},{l:'τ'},
      {l:'υ'},{l:'φ'},{l:'χ'},{l:'ψ'},{l:'ω'},
      {l:'Δ'},{l:'Σ'},{l:'Ω'},{l:'Λ'},{l:'Γ'},{l:'Θ'},{l:'Φ'},{l:'Ψ'},
    ],
    cols: 7,
  },
  special: {
    label: '∑∫',
    keys: [
      {l:'∑',v:'∑'},{l:'∫',v:'∫'},{l:'∂',v:'∂'},{l:'∇',v:'∇'},
      {l:'∞',v:'∞'},{l:'±',v:'±'},{l:'≈',v:'≈'},{l:'≠',v:'≠'},
      {l:'≤',v:'≤'},{l:'≥',v:'≥'},{l:'⋅',v:'⋅'},{l:'∝',v:'∝'},
      {l:'→',v:'→'},{l:'⟹',v:'⟹'},{l:'∈',v:'∈'},{l:'∉',v:'∉'},
      {l:'⊂',v:'⊂'},{l:'∩',v:'∩'},{l:'∪',v:'∪'},{l:'‖',v:'‖'},
      {l:'⊥',v:'⊥'},{l:'°',v:'°'},{l:'′',v:'′'},{l:'″',v:'″'},
    ],
    cols: 6,
  },
};

function FormulaKeyboard({ editor, t, onHide }) {
  const { append, backspace, clear, insertSpecial, tabNext } = editor;
  const [tab, setTab] = React.useState('numbers');
  const cfg = KB_TABS[tab];

  const handleKey = (key) => {
    if (key.action === 'back') { backspace(); return; }
    if (key.action === 'frac') { insertSpecial('frac', {n:'',d:''}); return; }
    if (key.action === 'pow')  { insertSpecial('pow', {e:''}); return; }
    if (key.action === 'sqrt') { insertSpecial('sqrt', {a:'',n:''}); return; }
    if (key.action === 'cbrt') { insertSpecial('sqrt', {a:'',n:'3'}); return; }
    if (key.action === 'nrt')  { insertSpecial('sqrt', {a:'',n:'n'}); return; }
    if (key.action === 'sub')  { insertSpecial('sub', {s:''}); return; }
    append(key.v !== undefined ? key.v : key.l);
  };

  return (
    <div style={{background:t.s2,borderRadius:12,padding:14,userSelect:'none'}}>
      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${t.border}`,flexWrap:'wrap'}}>
        {Object.entries(KB_TABS).map(([id,cfg]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:'5px 12px',borderRadius:7,border:'none',cursor:'pointer',fontSize:13,fontWeight:500,fontFamily:'Georgia,serif',transition:'all 150ms ease',
              background: tab===id ? t.cyan : 'transparent',
              color: tab===id ? '#0A0E1A' : t.sec,
              boxShadow: tab===id ? `0 0 12px ${t.cyan}55` : 'none'}}>
            {cfg.label}
          </button>
        ))}
        <div style={{flex:1}}/>
        <button onClick={()=>{ tabNext(); }} style={{padding:'5px 12px',borderRadius:7,border:`1px solid ${t.border}`,cursor:'pointer',fontSize:12,color:t.muted,background:'transparent',fontFamily:'Inter,sans-serif'}}>Tab →</button>
        <button onClick={onHide} style={{padding:'5px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:12,color:t.muted,background:'transparent'}}>Скрыть</button>
      </div>

      {/* Structural keys: bigger, with labels */}
      {tab === 'struct' ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
          {cfg.keys.map((key,i) => (
            <StructKey key={i} k={key} onClick={()=>handleKey(key)} t={t}/>
          ))}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cfg.cols},1fr)`,gap:6}}>
          {cfg.keys.map((key,i) => (
            <KbKey key={i} k={key} onClick={()=>handleKey(key)} t={t} isBack={key.action==='back'}/>
          ))}
        </div>
      )}

      {/* Bottom */}
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={clear} style={{flex:1,height:36,borderRadius:8,border:`1px solid ${t.border}`,background:'transparent',color:t.sec,cursor:'pointer',fontSize:13,fontFamily:'Inter,sans-serif',fontWeight:500}}>Очистить</button>
        <button onClick={backspace} style={{flex:1,height:36,borderRadius:8,border:`1px solid ${t.border}`,background:'transparent',color:t.sec,cursor:'pointer',fontSize:13,fontFamily:'Inter,sans-serif',fontWeight:500}}>⌫ Удалить</button>
      </div>
    </div>
  );
}

function KbKey({ k, onClick, t, isBack }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{height:46,borderRadius:9,border:`1px solid ${isBack ? t.border : t.border}`,cursor:'pointer',fontSize:17,fontFamily:'Georgia,serif',fontWeight:400,transition:'all 100ms ease',
        background: h ? (isBack ? t.errorBg : t.hover) : t.s1,
        color: isBack ? t.error : t.text,
        boxShadow: h ? 'none' : `inset 0 -2px 0 rgba(0,0,0,0.3)`}}>
      {k.l}
    </button>
  );
}

function StructKey({ k, onClick, t }) {
  const [h, setH] = React.useState(false);
  const preview = {
    'a/b': <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',fontSize:10,gap:0}}>
      <span style={{borderBottom:`1px solid currentColor`,paddingBottom:1,paddingLeft:4,paddingRight:4}}>a</span>
      <span style={{paddingLeft:4,paddingRight:4}}>b</span>
    </span>,
    'xⁿ': <span>x<sup style={{fontSize:'0.65em'}}>n</sup></span>,
    '√x': <span>√<span style={{borderTop:`1px solid currentColor`,paddingTop:1,paddingLeft:2}}>x</span></span>,
    '∛x': <span><sup style={{fontSize:'0.6em',verticalAlign:'super'}}>3</sup>√<span style={{borderTop:`1px solid currentColor`,paddingTop:1,paddingLeft:2}}>x</span></span>,
    'ⁿ√x': <span><sup style={{fontSize:'0.6em',verticalAlign:'super'}}>n</sup>√<span style={{borderTop:`1px solid currentColor`,paddingTop:1,paddingLeft:2}}>x</span></span>,
    'x₁': <span>x<sub style={{fontSize:'0.65em'}}>1</sub></span>,
  }[k.l] || <span style={{fontSize:15}}>{k.l}</span>;

  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{height:60,borderRadius:10,border:`1px solid ${h ? t.cyan : t.border}`,cursor:'pointer',fontSize:16,fontFamily:'Georgia,serif',transition:'all 150ms ease',
        background: h ? t.cyanBg : t.s1,
        color: h ? t.cyan : t.text,
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,
        boxShadow: h ? `0 0 12px ${t.cyan}33` : 'inset 0 -2px 0 rgba(0,0,0,0.3)'}}>
      {preview}
      {k.desc && <span style={{fontSize:9,color:h?t.cyan:t.muted,fontFamily:'Inter,sans-serif',lineHeight:1,textAlign:'center'}}>{k.desc}</span>}
    </button>
  );
}

// ── FORMULA TASK ─────────────────────────────────────────────────────────────
function FormulaTask({ task, state, setState, t }) {
  const editor = useFormulaEditor();
  const [showKb, setShowKb] = React.useState(true);
  const disabled = state === 'correct';

  const handleSubmit = () => {
    const plain = editor.toPlainText();
    plain.includes('4') ? setState('correct') : setState('error');
  };

  return (
    <div>
      {/* Formula display box */}
      <div onClick={() => !disabled && setShowKb(true)}
        style={{borderRadius:12, border:`2px solid ${state==='correct'?t.success:state==='error'?t.error:showKb?t.cyan:t.border}`, background:t.bg, marginBottom:10, minHeight:64, cursor: disabled?'default':'text', transition:'border-color 200ms ease', position:'relative', overflow:'hidden'}}>
        {!disabled && (
          <div style={{position:'absolute',top:8,right:10,fontSize:11,color:t.muted,fontFamily:'Inter,sans-serif'}}>Tab — следующее поле · Клик — выбрать</div>
        )}
        <FormulaDisplay tokens={editor.tokens} focus={disabled ? null : editor.focus} setFocus={editor.setFocus} t={t}/>
      </div>

      {/* Feedback */}
      {state==='correct' && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.successBg,marginBottom:16}}>
          <Icon name="checkCircle" size={16} color={t.success}/>
          <span style={{fontSize:13,color:t.success,fontFamily:'Inter,sans-serif'}}>Правильно. +{task.points} баллов</span>
        </div>
      )}
      {state==='error' && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.errorBg,marginBottom:12}}>
          <Icon name="x" size={16} color={t.error}/>
          <span style={{fontSize:13,color:t.error,fontFamily:'Inter,sans-serif'}}>Проверь ответ. Попробуй ещё раз.</span>
        </div>
      )}

      {/* Keyboard */}
      {!disabled && showKb && (
        <div style={{marginBottom:14}}>
          <FormulaKeyboard editor={editor} t={t} onHide={()=>setShowKb(false)}/>
        </div>
      )}

      {!disabled && (
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Btn onClick={handleSubmit} disabled={editor.isEmpty}>Проверить</Btn>
          <Btn variant="secondary">Черновик</Btn>
          {!showKb && <Btn variant="ghost" onClick={()=>setShowKb(true)}>⌨ Клавиатура</Btn>}
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function DashboardPage({ navigate }) {
  const { t } = useT();
  const olympiads = [
    { type:'Региональный этап', name:'ВсОШ по астрономии', date:'15 февраля', days:21, color:'#4ECDD4' },
    { type:'Муниципальный этап', name:'Олимпиада МФТИ', date:'3 марта', days:37, color:'#8B6DD4' },
    { type:'Заключительный этап', name:'ВсОШ по астрономии', date:'20 апреля', days:85, color:'#D9A441' },
  ];
  return (
    <div style={{padding:'48px 56px', maxWidth:1100}}>
      <div style={{marginBottom:52}}>
        <h1 style={{fontFamily:'Newsreader,serif',fontSize:38,fontWeight:600,color:t.text,letterSpacing:'-0.01em',marginBottom:8}}>Привет, Алексей</h1>
        <p style={{fontSize:16,color:t.sec}}>Сегодня, 25 апреля · запланировано занятий: 3</p>
      </div>

      <section style={{marginBottom:56}}>
        <h2 style={{fontSize:18,fontWeight:600,color:t.text,marginBottom:22}}>Мои курсы</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20}}>
          <CourseCard navigate={navigate}/>
        </div>
      </section>

      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h2 style={{fontSize:18,fontWeight:600,color:t.text}}>Ближайшие олимпиады</h2>
          <button onClick={()=>navigate('calendar')} style={{background:'none',border:'none',color:t.cyan,fontSize:14,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Весь календарь →</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
          {olympiads.map((o,i) => <OlympiadCard key={i} {...o}/>)}
        </div>
      </section>
    </div>
  );
}

function CourseCard({ navigate }) {
  const { t } = useT();
  const [hov, setHov] = React.useState(false);
  const pct = 35;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>navigate('course')}
      style={{background:t.s1,borderRadius:14,padding:24,border:`1px solid ${hov?t.cyan:t.border}`,cursor:'pointer',transition:'all 200ms ease',transform:hov?'translateY(-2px)':'none',boxShadow:hov?`0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px ${t.cyan}44`:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <Badge variant="active">Активный</Badge>
        <ProgressRing pct={pct} size={52} stroke={3} t={t}/>
      </div>
      <h3 style={{fontFamily:'Newsreader,serif',fontSize:22,fontWeight:600,color:t.text,marginBottom:8,lineHeight:1.3}}>Всерос с Апексом</h3>
      <p style={{fontSize:13,color:t.sec,marginBottom:16,lineHeight:1.55}}>Годовая подготовка к олимпиадам по астрономии. Теория, задачи, звёздное небо.</p>
      <div style={{background:t.border,borderRadius:9999,height:4,marginBottom:12}}>
        <div style={{width:`${pct}%`,height:4,background:t.cyan,borderRadius:9999,boxShadow:`0 0 8px ${t.cyan}88`}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,color:t.muted}}>7 из 20 занятий</span>
        <Btn size="sm" variant="cyan" onClick={()=>navigate('course')}>Открыть</Btn>
      </div>
    </div>
  );
}

function OlympiadCard({ type, name, date, days, color }) {
  const { t } = useT();
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:t.s1,borderRadius:12,padding:'16px 20px',border:`1px solid ${t.border}`,borderLeft:`4px solid ${color}`,cursor:'pointer',transition:'all 200ms ease',transform:hov?'translateY(-2px)':'none',boxShadow:hov?`0 0 16px ${color}33`:undefined}}>
      <div style={{fontSize:11,color:color,fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{type}</div>
      <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:8,lineHeight:1.4}}>{name}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:13,color:t.sec}}>{date}</span>
        <span style={{fontSize:12,color:t.muted}}>через {days} дн.</span>
      </div>
    </div>
  );
}

// ── COURSE PAGE ──────────────────────────────────────────────────────────────
const COURSE_DATA = {
  blocks: [
    { id:1, title:'Небесная механика', lessons:8, done:5, themes:[
        { id:1, title:'Законы Кеплера', lessons:[
            {id:1,title:'Первый закон Кеплера. Эллиптические орбиты',done:true,date:'10 янв',dur:'52 мин'},
            {id:2,title:'Второй и третий законы Кеплера',done:false,current:true,date:'17 янв',dur:'58 мин',isNew:true},
          ]},
        { id:2, title:'Закон всемирного тяготения', lessons:[
            {id:3,title:'Ньютоновская гравитация и её приложения',done:false,date:'24 янв',dur:'55 мин'},
            {id:4,title:'Задачи на гравитацию',done:false,date:'31 янв',dur:'48 мин'},
          ]},
      ]},
    { id:2, title:'Наблюдательная астрономия', lessons:6, done:2, themes:[
        { id:4, title:'Небесная сфера и координаты', lessons:[
            {id:6,title:'Системы небесных координат',done:true,date:'5 янв',dur:'60 мин'},
            {id:7,title:'Прецессия и нутация',done:false,date:'12 янв',dur:'54 мин'},
          ]},
      ]},
    { id:3, title:'Физика звёзд', lessons:5, done:0, themes:[
        { id:5, title:'HR-диаграмма и эволюция звёзд', lessons:[
            {id:8,title:'Диаграмма Герцшпрунга–Рассела',done:false,date:'21 февр',dur:'65 мин'},
          ]},
      ]},
  ]
};

function CoursePage({ navigate }) {
  const { t } = useT();
  const [openBlocks, setOpenBlocks] = React.useState({1:true,2:false,3:false});
  const [openThemes, setOpenThemes] = React.useState({1:true,2:false,3:false,4:false,5:false});

  return (
    <div style={{padding:'40px 56px', maxWidth:960}}>
      <div style={{fontSize:12,color:t.muted,marginBottom:24,display:'flex',alignItems:'center',gap:6,fontFamily:'Inter,sans-serif'}}>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('dashboard')}>Главная</span>
        <span>›</span><span style={{color:t.text}}>Всерос с Апексом</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:40,gap:24}}>
        <div style={{flex:1}}>
          <Badge variant="active" style={{marginBottom:12}}>Активный курс</Badge>
          <h1 style={{fontFamily:'Newsreader,serif',fontSize:34,fontWeight:600,color:t.text,letterSpacing:'-0.01em',lineHeight:1.2,marginBottom:10,marginTop:8}}>Всерос с Апексом</h1>
          <p style={{fontSize:15,color:t.sec,lineHeight:1.55}}>Годовая программа подготовки к олимпиадам по астрономии. 12 пар в неделю — теория, задачи, звёздное небо.</p>
        </div>
        <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:12,background:t.s1,borderRadius:14,padding:'20px 28px',border:`1px solid ${t.border}`}}>
          <ProgressRing pct={35} size={80} stroke={5} t={t} color={t.cyan}/>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:13,color:t.sec,marginBottom:4}}>Пройдено</div>
            <div style={{fontSize:13,fontWeight:600,color:t.text}}>7 из 20 занятий</div>
          </div>
          <Btn size="sm" variant="cyan" onClick={()=>navigate('lesson')}>Продолжить</Btn>
        </div>
      </div>

      <h2 style={{fontSize:18,fontWeight:600,color:t.text,marginBottom:20}}>Программа курса</h2>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {COURSE_DATA.blocks.map(block => (
          <BlockAccordion key={block.id} block={block}
            open={openBlocks[block.id]} toggle={()=>setOpenBlocks(p=>({...p,[block.id]:!p[block.id]}))}
            openThemes={openThemes} setOpenThemes={setOpenThemes} navigate={navigate}/>
        ))}
      </div>
    </div>
  );
}

function BlockAccordion({ block, open, toggle, openThemes, setOpenThemes, navigate }) {
  const { t } = useT();
  const pct = Math.round((block.done / block.lessons) * 100);
  return (
    <div style={{background:t.s1,borderRadius:12,border:`1px solid ${t.border}`,overflow:'hidden'}}>
      <div onClick={toggle} style={{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
        <div style={{transform: open ? 'rotate(90deg)' : 'none', transition:'transform 200ms ease'}}>
          <Icon name="chevronRight" size={16} color={t.muted}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:4}}>{block.title}</div>
          <div style={{fontSize:12,color:t.muted}}>{block.lessons} занятий · {block.done} пройдено</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:120,background:t.border,borderRadius:9999,height:3}}>
            <div style={{width:`${pct}%`,height:3,background:t.cyan,borderRadius:9999,boxShadow:`0 0 6px ${t.cyan}88`}}/>
          </div>
          <span style={{fontSize:12,color:t.muted,minWidth:28}}>{pct}%</span>
        </div>
      </div>
      {open && (
        <div style={{borderTop:`1px solid ${t.border}`}}>
          {block.themes.map(theme => (
            <ThemeAccordion key={theme.id} theme={theme}
              open={openThemes[theme.id]}
              toggle={()=>setOpenThemes(p=>({...p,[theme.id]:!p[theme.id]}))}
              navigate={navigate}/>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeAccordion({ theme, open, toggle, navigate }) {
  const { t } = useT();
  const allDone = theme.lessons.every(l=>l.done);
  const anyDone = theme.lessons.some(l=>l.done);
  return (
    <div style={{borderBottom:`1px solid ${t.border}`}}>
      <div onClick={toggle} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px 12px 40px',cursor:'pointer',userSelect:'none'}}>
        {allDone ? <Icon name="checkCircle" size={16} color={t.success}/> : anyDone ? <Icon name="half" size={16} color={t.cyan}/> : <Icon name="circle" size={16} color={t.muted}/>}
        <span style={{flex:1,fontSize:14,color:t.text,fontWeight:500}}>{theme.title}</span>
        <span style={{fontSize:12,color:t.muted,marginRight:8}}>{theme.lessons.length} зан.</span>
        <div style={{transform: open?'rotate(90deg)':'none',transition:'transform 200ms ease'}}>
          <Icon name="chevronRight" size={14} color={t.muted}/>
        </div>
      </div>
      {open && (
        <div style={{paddingBottom:8}}>
          {theme.lessons.map(lesson => <LessonRow key={lesson.id} lesson={lesson} navigate={navigate}/>)}
        </div>
      )}
    </div>
  );
}

function LessonRow({ lesson, navigate }) {
  const { t } = useT();
  const [hov, setHov] = React.useState(false);
  return (
    <div onClick={()=>navigate('lesson')} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:12,padding:'10px 20px 10px 56px',cursor:'pointer',background:lesson.current ? t.cyanBg : hov ? t.hover : 'transparent',transition:'background 150ms ease'}}>
      <div style={{flexShrink:0}}>
        {lesson.done ? <Icon name="check" size={14} color={t.success}/> : lesson.current ? <Icon name="play" size={14} color={t.cyan}/> : <Icon name="circle" size={14} color={t.muted}/>}
      </div>
      <span style={{flex:1,fontSize:14,color:lesson.current ? t.cyan : lesson.done ? t.muted : t.text,fontWeight:lesson.current?600:400}}>{lesson.title}</span>
      {lesson.isNew && <Badge variant="new" size="sm">Новое</Badge>}
      <span style={{fontSize:12,color:t.muted,flexShrink:0}}>{lesson.dur}</span>
      <span style={{fontSize:12,color:t.muted,flexShrink:0}}>{lesson.date}</span>
    </div>
  );
}

// ── LESSON PAGE ──────────────────────────────────────────────────────────────
function LessonPage({ navigate }) {
  const { t } = useT();
  const [viewed, setViewed] = React.useState(false);
  const related = [
    {id:1,title:'Первый закон Кеплера. Эллиптические орбиты',done:true},
    {id:2,title:'Второй и третий законы Кеплера',done:false,current:true},
    {id:3,title:'Задачи на законы Кеплера',done:false},
  ];
  return (
    <div style={{padding:'32px 56px 64px', maxWidth:1100}}>
      <div style={{fontSize:12,color:t.muted,marginBottom:20,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',fontFamily:'Inter,sans-serif'}}>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('dashboard')}>Главная</span>
        <span>›</span>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('course')}>Всерос с Апексом</span>
        <span>›</span><span style={{color:t.muted}}>Законы Кеплера</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:24,marginBottom:24}}>
        <div style={{flex:1}}>
          <h1 style={{fontFamily:'Newsreader,serif',fontSize:32,fontWeight:600,color:t.text,letterSpacing:'-0.01em',lineHeight:1.2,marginBottom:10}}>Второй и третий законы Кеплера</h1>
          <div style={{display:'flex',gap:16,fontSize:13,color:t.sec,flexWrap:'wrap',fontFamily:'Inter,sans-serif'}}>
            <span>Занятие 2 из 5</span><span>·</span><span>17 января 2026</span><span>·</span><span>58 мин</span>
          </div>
        </div>
        <button onClick={()=>setViewed(!viewed)}
          style={{flexShrink:0,display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:8,border:`1px solid ${viewed ? t.success : t.border}`,background: viewed ? t.successBg : 'transparent',color: viewed ? t.success : t.sec,cursor:'pointer',fontSize:13,fontWeight:500,transition:'all 200ms ease',fontFamily:'Inter,sans-serif'}}>
          <Icon name="check" size={14} color={viewed ? t.success : t.muted}/>
          {viewed ? 'Просмотрено' : 'Отметить просмотренным'}
        </button>
      </div>

      {/* Video */}
      <div style={{width:'100%',aspectRatio:'16/9',background:'#000',borderRadius:14,marginBottom:16,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#030609 0%,#0D1525 100%)'}}>
          <StarField count={120}/>
        </div>
        <div style={{position:'absolute',display:'flex',alignItems:'center',justifyContent:'center',inset:0}}>
          <ConstellationSVG width={220} height={220} color={t.gold} starOpacity={0.5} lineOpacity={0.2} glow={true}/>
        </div>
        <div style={{position:'absolute',width:64,height:64,borderRadius:'50%',background:t.cyanBg,border:`2px solid ${t.cyan}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:`0 0 24px ${t.cyan}66`}}>
          <Icon name="play" size={24} color={t.cyan}/>
        </div>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:48,background:'linear-gradient(to top,rgba(0,0,0,0.85),transparent)',display:'flex',alignItems:'center',padding:'0 16px',gap:12}}>
          <Icon name="play" size={16} color='#fff'/>
          <div style={{flex:1,height:3,background:'rgba(255,255,255,0.15)',borderRadius:9999}}>
            <div style={{width:'22%',height:'100%',background:t.cyan,borderRadius:9999,boxShadow:`0 0 8px ${t.cyan}`}}/>
          </div>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.7)',fontFamily:'Inter,sans-serif'}}>12:43 / 58:00</span>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:36,padding:'12px 0',borderBottom:`1px solid ${t.border}`,fontFamily:'Inter,sans-serif'}}>
        <button style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:t.sec,cursor:'pointer',fontSize:13}}>
          <Icon name="arrowLeft" size={16} color={t.muted}/><span>Первый закон Кеплера</span>
        </button>
        <span style={{fontSize:13,color:t.muted}}>2 из 5</span>
        <button style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:t.sec,cursor:'pointer',fontSize:13}}>
          <span>Задачи на законы Кеплера</span><Icon name="arrowRight" size={16} color={t.muted}/>
        </button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:48,alignItems:'start'}}>
        <div>
          <h3 style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:14}}>О занятии</h3>
          <div style={{fontSize:15,color:t.sec,lineHeight:1.65,marginBottom:24}}>
            <p style={{marginBottom:12}}>Разбираем второй и третий законы Кеплера. Второй закон — закон площадей — объясняет, почему планеты движутся быстрее в перигелии.</p>
            <p style={{marginBottom:12}}>Третий закон в обобщённой форме для двух тел:</p>
            <div style={{background:t.s2,borderRadius:10,padding:'16px 20px',marginBottom:12,fontFamily:'Georgia,serif',fontSize:18,color:t.text,textAlign:'center',letterSpacing:'0.03em',border:`1px solid ${t.border}`}}>
              T² / a³ = 4π² / G(M + m)
            </div>
            <p>На занятии — задачи ВсОШ с применением третьего закона к спутникам, экзопланетам и двойным звёздам.</p>
          </div>
          <h3 style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:14}}>Материалы</h3>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
            <MaterialCard icon="fileText" name="Конспект. Законы Кеплера" meta="PDF · 1.2 МБ"/>
            <MaterialCard icon="fileText" name="Рабочая тетрадь" meta="PDF · 0.8 МБ"/>
          </div>
          <div onClick={()=>navigate('homework')} style={{background:t.s1,border:`1px solid ${t.gold}`,borderRadius:12,padding:'20px 24px',cursor:'pointer',display:'flex',alignItems:'center',gap:20,transition:'all 200ms ease'}}>
            <div style={{width:44,height:44,borderRadius:10,background:t.goldBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon name="fileText" size={22} color={t.gold}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:4}}>Домашнее задание</div>
              <div style={{fontSize:13,color:t.sec,marginBottom:8}}>5 задач · 25 баллов</div>
              <div style={{background:t.border,borderRadius:9999,height:3}}>
                <div style={{width:'40%',height:3,background:t.gold,borderRadius:9999}}/>
              </div>
            </div>
            <Btn size="sm" onClick={()=>navigate('homework')}>Открыть</Btn>
          </div>
        </div>
        <div>
          <h3 style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:14}}>В этой теме</h3>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {related.map(l => (
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:l.current?t.cyanBg:'transparent',border:l.current?`1px solid ${t.cyan}`:'1px solid transparent',cursor:'pointer'}}>
                {l.done ? <Icon name="check" size={14} color={t.success}/> : l.current ? <Icon name="play" size={14} color={t.cyan}/> : <Icon name="circle" size={14} color={t.muted}/>}
                <span style={{fontSize:13,color:l.current?t.cyan:l.done?t.muted:t.sec,fontWeight:l.current?600:400,flex:1,lineHeight:1.4}}>{l.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialCard({ icon, name, meta }) {
  const { t } = useT();
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:8,border:`1px solid ${hov?t.cyan:t.border}`,background:hov?t.cyanBg:t.s1,transition:'all 150ms ease',cursor:'pointer'}}>
      <Icon name={icon} size={20} color={t.cyan}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:500,color:t.text}}>{name}</div>
        <div style={{fontSize:12,color:t.muted}}>{meta}</div>
      </div>
      <Icon name="download" size={16} color={t.muted}/>
    </div>
  );
}

// ── HOMEWORK PAGE ─────────────────────────────────────────────────────────────
const TASKS = [
  {id:1,type:'formula',title:'Задача 1',text:'Период обращения Земли T₁ = 1 год, большая полуось a₁ = 1 а.е. Найдите большую полуось орбиты планеты с периодом T₂ = 8 лет.',hint:'Третий закон Кеплера: a³ = T² (в а.е. и годах).',points:5},
  {id:2,type:'choice',title:'Задача 2',text:'Второй закон Кеплера — следствие:',options:['Закона сохранения энергии','Закона сохранения момента импульса','Закона всемирного тяготения','Закона сохранения импульса'],correct:1,points:3},
  {id:3,type:'text',title:'Задача 3',text:'Объясните физический смысл второго закона Кеплера. Почему планета движется быстрее в перигелии?',points:7},
];

function HomeworkPage({ navigate }) {
  const { t } = useT();
  const [activeTask, setActiveTask] = React.useState(0);
  const [taskStates, setTaskStates] = React.useState({0:'open',1:'correct',2:'pending'});
  const setTask = (i, s) => setTaskStates(p=>({...p,[i]:s}));

  return (
    <div style={{padding:'32px 56px 80px', maxWidth:900}}>
      <div style={{fontSize:12,color:t.muted,marginBottom:20,fontFamily:'Inter,sans-serif'}}>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('lesson')}>← Назад к занятию</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <h1 style={{fontFamily:'Newsreader,serif',fontSize:28,fontWeight:600,color:t.text,letterSpacing:'-0.01em'}}>Домашнее задание</h1>
        <ProgressRing pct={Math.round((Object.values(taskStates).filter(s=>s==='correct'||s==='pending').length/TASKS.length)*100)} size={52} stroke={3} t={t} color={t.cyan}/>
      </div>
      <p style={{fontSize:14,color:t.sec,marginBottom:28,fontFamily:'Inter,sans-serif'}}>Второй и третий законы Кеплера · 3 задачи · 15 баллов</p>

      <div style={{display:'flex',gap:8,marginBottom:32,flexWrap:'wrap'}}>
        {TASKS.map((task,i) => {
          const st = taskStates[i];
          const isActive = activeTask === i;
          return (
            <button key={i} onClick={()=>setActiveTask(i)}
              style={{width:44,height:44,borderRadius:'50%',border:`2px solid ${isActive?t.cyan:st==='correct'?t.success:st==='pending'?t.info:t.border}`,cursor:'pointer',fontWeight:600,fontSize:14,transition:'all 150ms ease',fontFamily:'Inter,sans-serif',
                background: isActive ? t.cyanBg : st==='correct' ? t.successBg : st==='pending' ? t.infoBg : t.s2,
                color: isActive ? t.cyan : st==='correct' ? t.success : st==='pending' ? t.info : t.sec,
                boxShadow: isActive ? `0 0 12px ${t.cyan}55` : 'none'}}>
              {st==='correct' ? '✓' : i+1}
            </button>
          );
        })}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {TASKS.map((task,i) => (
          <TaskCard key={task.id} task={task} taskIndex={i} active={activeTask===i}
            state={taskStates[i]} setState={s=>setTask(i,s)}
            onOpen={()=>setActiveTask(i)} t={t}/>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:40,paddingTop:24,borderTop:`1px solid ${t.border}`}}>
        <Btn variant="ghost" onClick={()=>navigate('lesson')}>← Назад к занятию</Btn>
        <Btn variant="cyan" onClick={()=>navigate('course')}>К следующему занятию →</Btn>
      </div>
    </div>
  );
}

function TaskCard({ task, taskIndex, active, state, setState, onOpen, t }) {
  const stateColor = {open:t.border, correct:t.success, pending:t.info, error:t.error}[state] || t.border;
  return (
    <div style={{background:t.s1,borderRadius:12,border:`1px solid ${active ? stateColor : t.border}`,overflow:'hidden',transition:'all 200ms ease',boxShadow: active ? `0 0 0 1px ${stateColor}44` : 'none'}}>
      <div onClick={onOpen} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
        <span style={{fontFamily:'Newsreader,serif',fontSize:30,fontWeight:600,color:t.cyan,minWidth:36,lineHeight:1}}>{taskIndex+1}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,color:t.muted,marginBottom:2,fontFamily:'Inter,sans-serif'}}>{task.title} · {task.points} баллов</div>
          <div style={{fontSize:14,color:t.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:500}}>{task.text.slice(0,80)}…</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {state==='correct' && <Badge variant="success">Засчитано</Badge>}
          {state==='pending' && <Badge variant="info">На проверке</Badge>}
          {state==='error' && <Badge variant="error">Неверно</Badge>}
          <Icon name={active ? 'chevronDown' : 'chevronRight'} size={16} color={t.muted}/>
        </div>
      </div>
      {active && (
        <div style={{padding:'0 20px 20px',borderTop:`1px solid ${t.border}`}}>
          <div style={{fontSize:15,color:t.text,lineHeight:1.65,marginBottom:20,marginTop:16,fontFamily:'Inter,sans-serif'}}>{task.text}</div>
          {task.type === 'formula' && <FormulaTask task={task} state={state} setState={setState} t={t}/>}
          {task.type === 'choice'  && <ChoiceTask  task={task} state={state} setState={setState} t={t}/>}
          {task.type === 'text'    && <TextTask    task={task} state={state} setState={setState} t={t}/>}
        </div>
      )}
    </div>
  );
}

function ChoiceTask({ task, state, setState, t }) {
  const [selected, setSelected] = React.useState(null);
  const submitted = state === 'correct' || state === 'error';
  return (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
        {task.options.map((opt,i) => {
          const isSel = selected===i, isCorr = i===task.correct;
          let border = t.border, bg = 'transparent', color = t.text;
          if (isSel && !submitted) { border=t.cyan; bg=t.cyanBg; color=t.cyan; }
          if (submitted && isCorr) { border=t.success; bg=t.successBg; color=t.success; }
          if (submitted && isSel && !isCorr) { border=t.error; bg=t.errorBg; color=t.error; }
          return (
            <div key={i} onClick={()=>!submitted&&setSelected(i)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,border:`1.5px solid ${border}`,background:bg,cursor:submitted?'default':'pointer',transition:'all 150ms ease',fontFamily:'Inter,sans-serif'}}>
              <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${isSel?t.cyan:t.border}`,background:isSel?t.cyan:'transparent',flexShrink:0,transition:'all 150ms ease'}}/>
              <span style={{fontSize:14,color}}>{opt}</span>
            </div>
          );
        })}
      </div>
      {!submitted && <Btn variant="cyan" onClick={()=>setState(selected===task.correct?'correct':'error')} disabled={selected===null}>Проверить</Btn>}
      {state==='correct' && <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.successBg,fontFamily:'Inter,sans-serif'}}><Icon name="checkCircle" size={16} color={t.success}/><span style={{fontSize:13,color:t.success}}>Верно. +{task.points} баллов</span></div>}
    </div>
  );
}

function TextTask({ task, state, setState, t }) {
  const [val, setVal] = React.useState('');
  const submitted = state === 'pending';
  return (
    <div>
      <textarea value={val} onChange={e=>setVal(e.target.value)} disabled={submitted}
        placeholder="Введи развёрнутый ответ…"
        style={{width:'100%',minHeight:120,padding:'12px 14px',borderRadius:10,border:`1.5px solid ${state==='pending'?t.info:t.border}`,background:t.bg,color:t.text,fontSize:14,fontFamily:'Inter,sans-serif',lineHeight:1.6,resize:'vertical',outline:'none',marginBottom:10,transition:'border-color 200ms ease'}}/>
      <div style={{fontSize:12,color:t.muted,marginBottom:12,fontFamily:'Inter,sans-serif'}}>Проверяется преподавателем вручную.</div>
      {!submitted ? <Btn variant="cyan" onClick={()=>setState('pending')} disabled={!val.trim()}>Сдать на проверку</Btn>
        : <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.infoBg,fontFamily:'Inter,sans-serif'}}><Icon name="circle" size={16} color={t.info}/><span style={{fontSize:13,color:t.info}}>Принято, ждёт проверки преподавателя.</span></div>}
    </div>
  );
}

// ── CALENDAR PAGE ─────────────────────────────────────────────────────────────
function CalendarPage({ navigate }) {
  const { t } = useT();
  const events = [
    {type:'Региональный этап',name:'ВсОШ по астрономии',date:'15 февраля',color:'#4ECDD4'},
    {type:'Муниципальный этап',name:'Олимпиада МФТИ',date:'3 марта',color:'#8B6DD4'},
    {type:'Заключительный этап',name:'ВсОШ по астрономии',date:'20 апреля',color:'#D9A441'},
    {type:'Открытый турнир',name:'Турнир Струве',date:'5 мая',color:'#FF7B6D'},
    {type:'Дедлайн регистрации',name:'IOAA 2026',date:'1 июня',color:'#FFB547'},
  ];
  return (
    <div style={{padding:'40px 56px',maxWidth:900}}>
      <h1 style={{fontFamily:'Newsreader,serif',fontSize:34,fontWeight:600,color:t.text,marginBottom:8}}>Календарь олимпиад</h1>
      <p style={{fontSize:15,color:t.sec,marginBottom:32,fontFamily:'Inter,sans-serif'}}>Сезон 2025–2026</p>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {events.map((ev,i) => (
          <div key={i} style={{background:t.s1,borderRadius:12,padding:'18px 24px',border:`1px solid ${t.border}`,borderLeft:`4px solid ${ev.color}`,display:'flex',alignItems:'center',gap:20}}>
            <div style={{minWidth:60,textAlign:'center'}}>
              <div style={{fontSize:24,fontFamily:'Newsreader,serif',fontWeight:600,color:t.text,lineHeight:1}}>{ev.date.split(' ')[0]}</div>
              <div style={{fontSize:12,color:t.muted,fontFamily:'Inter,sans-serif'}}>{ev.date.split(' ')[1]}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:ev.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4,fontFamily:'Inter,sans-serif'}}>{ev.type}</div>
              <div style={{fontSize:15,fontWeight:600,color:t.text}}>{ev.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  useFormulaEditor, FormulaDisplay, FormulaKeyboard, KbKey, StructKey,
  FormulaTask, ChoiceTask, TextTask, MaterialCard,
  DashboardPage, CoursePage, LessonPage, HomeworkPage, CalendarPage,
  CourseCard, OlympiadCard, BlockAccordion, ThemeAccordion, LessonRow, TaskCard,
});
