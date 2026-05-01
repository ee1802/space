// apeks-components.jsx v2 — Deep space palette, star field, upgraded components

const DARK_T = {
  bg: '#070C18', s1: '#0D1525', s2: '#152035', s3: '#1E2D4A',
  border: '#1E2D4A', hover: '#253558',
  text: '#F0EDE8', sec: '#A8A5A0', muted: '#6A6860',
  gold: '#D9A441', goldH: '#F4B860', goldD: '#B8862A', goldBg: 'rgba(217,164,65,0.12)',
  cyan: '#4ECDD4', cyanH: '#6EE8EE', cyanD: '#2BA8AE', cyanBg: 'rgba(78,205,212,0.10)',
  purple: '#8B6DD4', purpleBg: 'rgba(139,109,212,0.12)',
  success: '#5BD68A', successBg: 'rgba(91,214,138,0.12)',
  error: '#FF7B6D', errorBg: 'rgba(255,123,109,0.12)',
  warning: '#FFB547', warningBg: 'rgba(255,181,71,0.1)',
  info: '#7AB6F5', infoBg: 'rgba(122,182,245,0.12)',
};

const LIGHT_T = {
  bg: '#FAF8F4', s1: '#F5F2ED', s2: '#EAE5DC', s3: '#D5CFC2',
  border: '#D5CFC2', hover: '#EAE5DC',
  text: '#26241F', sec: '#5C5A52', muted: '#8E8B82',
  gold: '#C48A25', goldH: '#D9A441', goldD: '#A06E10', goldBg: '#FDF1DC',
  cyan: '#1A8F96', cyanH: '#22B0B8', cyanD: '#107078', cyanBg: '#E0F8F9',
  purple: '#6B4FB4', purpleBg: '#EEE9F8',
  success: '#2D8F4E', successBg: '#E8F5EC',
  error: '#C4392F', errorBg: '#FCEAE8',
  warning: '#B8770A', warningBg: '#FFF5E1',
  info: '#2563B0', infoBg: '#E6F0FB',
};

const ThemeCtx = React.createContext({ dark: true, t: DARK_T });
const RouteCtx = React.createContext({ page: 'landing', navigate: () => {} });
const useT = () => React.useContext(ThemeCtx);
const useRoute = () => React.useContext(RouteCtx);

// ── STAR FIELD ────────────────────────────────────────────────────────────────
function StarField({ count=160, width=1440, height=900, style: xStyle }) {
  const stars = React.useMemo(() => {
    const rng = (seed) => { let s=seed; return () => { s=(s*16807+0)%2147483647; return (s-1)/2147483646; }; };
    const r = rng(42);
    return Array.from({length:count}, (_,i) => ({
      x: r()*100, y: r()*100,
      size: r() < 0.85 ? r()*1.2+0.3 : r()*2.5+1.2,
      opacity: r()*0.6+0.2,
      glow: r() < 0.08,
      color: r()<0.1 ? '#4ECDD4' : r()<0.08 ? '#D9A441' : r()<0.06 ? '#8B6DD4' : '#fff',
    }));
  }, [count]);

  return (
    <svg viewBox={`0 0 100 100`} preserveAspectRatio="xMidYMid slice"
      style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',...xStyle}}>
      {stars.map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.size * 0.5}
          fill={s.color} opacity={s.opacity}
          filter={s.glow ? `drop-shadow(0 0 ${s.size*1.5}px ${s.color})` : undefined}/>
      ))}
    </svg>
  );
}

// ── MILKY WAY BAND ──────────────────────────────────────────────────────────
function MilkyWayBand() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.18}}>
      <defs>
        <radialGradient id="mw1" cx="60%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#A0D0FF" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#6080C0" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="mw2" cx="35%" cy="55%" r="40%">
          <stop offset="0%" stopColor="#C0A0FF" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="864" cy="405" rx="500" ry="120" fill="url(#mw1)" transform="rotate(-20 864 405)"/>
      <ellipse cx="504" cy="495" rx="360" ry="80" fill="url(#mw2)" transform="rotate(-20 504 495)"/>
    </svg>
  );
}

// ── CONSTELLATION SVG ─────────────────────────────────────────────────────
function ConstellationSVG({ width=200, height=200, color='#D9A441', starOpacity=0.75, lineOpacity=0.25, glow=false }) {
  const stars = [
    {x:36,y:22,r:3.5},{x:72,y:18,r:2.5},{x:40,y:50,r:1.8},{x:52,y:52,r:2.2},
    {x:64,y:49,r:1.8},{x:38,y:82,r:2},{x:74,y:80,r:3.2},{x:53,y:30,r:1.2},{x:60,y:26,r:1.4},
  ];
  const lines = [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[0,7],[7,8],[8,1]];
  const bgStars = [
    {x:12,y:8,r:0.7},{x:85,y:6,r:0.5},{x:92,y:38,r:0.9},{x:7,y:58,r:0.6},
    {x:18,y:92,r:0.8},{x:80,y:92,r:0.7},{x:48,y:7,r:0.5},{x:96,y:68,r:0.6},
    {x:4,y:33,r:0.4},{x:70,y:63,r:0.5},{x:28,y:72,r:0.6},{x:93,y:15,r:0.4},
    {x:22,y:45,r:0.5},{x:78,y:30,r:0.4},{x:55,y:88,r:0.6},
  ];
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" fill="none" style={{overflow:'visible'}}>
      {glow && <defs><filter id="gstar"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>}
      {bgStars.map((s,i) => <circle key={`bg${i}`} cx={s.x} cy={s.y} r={s.r} fill={color} opacity={lineOpacity}/>)}
      {lines.map(([a,b],i) => (
        <line key={i} x1={stars[a].x} y1={stars[a].y} x2={stars[b].x} y2={stars[b].y}
          stroke={color} strokeWidth="0.6" opacity={lineOpacity}/>
      ))}
      {stars.map((s,i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r*0.44} fill={color} opacity={starOpacity}
          filter={glow ? 'url(#gstar)' : undefined}/>
      ))}
    </svg>
  );
}

// ── PROGRESS RING ──────────────────────────────────────────────────────────
function ProgressRing({ pct=0, size=64, stroke=4, t, color }) {
  const c = color || t.gold;
  const r = (size - stroke*2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct/100)*circ;
  const fs = size > 60 ? 15 : size > 40 ? 12 : 10;
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'absolute',top:0,left:0}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={t.border} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:'stroke-dashoffset 0.6s ease', filter:`drop-shadow(0 0 4px ${c}66)`}}/>
      </svg>
      <div style={{position:'absolute',top:0,left:0,width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',fontSize:fs,fontWeight:600,color:c}}>
        {pct}%
      </div>
    </div>
  );
}

// ── ICON ──────────────────────────────────────────────────────────────────
function Icon({ name, size=18, color, strokeWidth=1.5 }) {
  const { t } = useT();
  const c = color || t.muted;
  const icons = {
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    book: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    play: 'M5 3l14 9-14 9V3z',
    chevronRight: 'M9 18l6-6-6-6',
    chevronDown: 'M6 9l6 6 6-6',
    chevronLeft: 'M15 18l-6-6 6-6',
    check: 'M20 6L9 17l-5-5',
    checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
    x: 'M18 6L6 18M6 6l12 12',
    circle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
    menu: 'M3 12h18M3 6h18M3 18h18',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
    delete: 'M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
    half: 'M12 2a10 10 0 0 1 0 20V2z',
    telescope: 'M3 18l4-8 4 4M11 14l3-6 3 3M14 11l4-8M19 3l2 1M12 22v-4M9 22h6',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  };
  const d = icons[name] || icons.circle;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

// ── BUTTON ──────────────────────────────────────────────────────────────────
function Btn({ children, variant='primary', size='md', onClick, full, style: xStyle, disabled }) {
  const { t, dark } = useT();
  const [h, setH] = React.useState(false);
  const sz = {sm:{H:32,px:12,fs:13},md:{H:40,px:16,fs:14},lg:{H:48,px:20,fs:16},xl:{H:56,px:24,fs:18}}[size];
  const base = {
    height:sz.H, padding:`0 ${sz.px}px`, fontSize:sz.fs,
    fontWeight:500, fontFamily:'Inter,sans-serif',
    borderRadius:8, cursor: disabled ? 'default' : 'pointer', border:'none',
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
    transition:'all 150ms ease', width:full?'100%':undefined,
    opacity: disabled ? 0.45 : 1,
    ...xStyle,
  };
  const vs = {
    primary: {background: h&&!disabled ? t.goldH : t.gold, color:'#0A0E1A', boxShadow: h&&!disabled ? `0 0 20px ${t.gold}55` : 'none'},
    cyan: {background: h&&!disabled ? t.cyanH : t.cyan, color:'#0A0E1A', boxShadow: h&&!disabled ? `0 0 20px ${t.cyan}55` : 'none'},
    secondary: {background: h&&!disabled ? t.hover : 'transparent', color:t.text, border:`1px solid ${t.border}`},
    ghost: {background: h&&!disabled ? t.hover : 'transparent', color:t.sec, border:'none'},
    danger: {background:'#C4392F', color:'#FAF8F4', border:'none'},
    link: {background:'none', color:t.gold, border:'none', padding:0, height:'auto', textDecoration: h ? 'underline' : 'none'},
  };
  return (
    <button style={{...base,...vs[variant]||vs.primary}} onClick={disabled?undefined:onClick}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      {children}
    </button>
  );
}

// ── BADGE ──────────────────────────────────────────────────────────────────
function Badge({ children, variant='neutral', size='md' }) {
  const { t, dark } = useT();
  const vs = {
    neutral:{bg: dark ? t.s2 : t.s3, color:t.sec},
    gold:{bg:t.goldBg, color:t.gold},
    cyan:{bg:t.cyanBg, color:t.cyan},
    purple:{bg:t.purpleBg, color:t.purple},
    success:{bg:t.successBg, color:t.success},
    error:{bg:t.errorBg, color:t.error},
    warning:{bg:t.warningBg, color:t.warning},
    info:{bg:t.infoBg, color:t.info},
    new:{bg:t.cyanBg, color:t.cyan},
    active:{bg:t.goldBg, color:t.gold},
  };
  const v = vs[variant] || vs.neutral;
  const sz = size==='sm'?{h:20,px:6,fs:11}:{h:24,px:8,fs:12};
  return (
    <span style={{display:'inline-flex',alignItems:'center',height:sz.h,padding:`0 ${sz.px}px`,borderRadius:9999,fontSize:sz.fs,fontWeight:500,background:v.bg,color:v.color,whiteSpace:'nowrap'}}>
      {children}
    </span>
  );
}

// ── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, navigate, page }) {
  const { t } = useT();
  const w = collapsed ? 64 : 240;
  const navItems = [
    {id:'dashboard', label:'Главная', icon:'home'},
    {id:'calendar', label:'Олимпиады', icon:'calendar'},
    {id:'trainer', label:'Тренажёр', icon:'telescope'},
  ];
  const isCourseActive = ['course','lesson','homework'].includes(page);

  return (
    <div style={{width:w, minHeight:'100vh', background:t.s1, flexShrink:0, borderRight:`1px solid ${t.border}`, display:'flex', flexDirection:'column', transition:'width 200ms ease', overflow:'hidden', position:'sticky', top:0, zIndex:10}}>
      {/* Stars in sidebar */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',opacity:0.4}}>
        <StarField count={60}/>
      </div>

      <div style={{position:'relative',padding: collapsed ? '18px 0 14px' : '18px 16px 14px', borderBottom:`1px solid ${t.border}`, display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start', gap:10}}>
        <div style={{width:28,height:28,flexShrink:0}}>
          <ConstellationSVG width={28} height={28} color={t.gold} starOpacity={0.95} lineOpacity={0.55} glow={true}/>
        </div>
        {!collapsed && <span style={{fontFamily:'Newsreader,serif', fontSize:22, fontWeight:600, color:t.text, letterSpacing:'-0.02em', lineHeight:1}}>apeks</span>}
      </div>

      <nav style={{padding:'10px 8px', flex:1, position:'relative'}}>
        {navItems.map(item => (
          <SidebarItem key={item.id} id={item.id} label={item.label} iconName={item.icon}
            active={page===item.id} collapsed={collapsed} onClick={()=>navigate(item.id)}/>
        ))}
        {!collapsed && (
          <div style={{marginTop:24}}>
            <div style={{fontSize:11,fontWeight:600,color:t.muted,padding:'0 8px 8px',letterSpacing:'0.08em',textTransform:'uppercase'}}>Курсы</div>
            <SidebarItem id="course" label="Всерос с Апексом" iconName="star"
              active={isCourseActive} collapsed={false} onClick={()=>navigate('course')}/>
          </div>
        )}
      </nav>

      <div style={{padding: collapsed ? '10px 0' : '10px 8px', borderTop:`1px solid ${t.border}`,position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding: collapsed ? '6px 0' : '6px 8px',justifyContent: collapsed ? 'center' : 'flex-start',borderRadius:8,cursor:'pointer'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:t.goldBg,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:t.gold,border:`1px solid ${t.gold}44`}}>АС</div>
          {!collapsed && <div><div style={{fontSize:13,fontWeight:500,color:t.text}}>Алексей С.</div><div style={{fontSize:11,color:t.muted}}>Ученик</div></div>}
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ id, label, iconName, active, collapsed, onClick }) {
  const { t } = useT();
  const [hov, setHov] = React.useState(false);
  const accent = active ? t.cyan : null;
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:10,padding: collapsed ? '9px 0' : '9px 10px',justifyContent: collapsed ? 'center' : 'flex-start',borderRadius:8,cursor:'pointer',marginBottom:2,background:(active||hov)?t.s2:'transparent',borderLeft: collapsed ? 'none' : active ? `3px solid ${t.cyan}` : '3px solid transparent',transition:'all 150ms ease'}}>
      <Icon name={iconName} size={18} color={active ? t.cyan : t.muted}/>
      {!collapsed && <span style={{fontSize:14,fontWeight:active?600:400,color:active?t.text:t.sec,whiteSpace:'nowrap'}}>{label}</span>}
    </div>
  );
}

// ── LMS LAYOUT ──────────────────────────────────────────────────────────────
function LMSLayout({ children, collapsed, page, navigate }) {
  const { t } = useT();
  return (
    <div style={{display:'flex',minHeight:'100vh',background:t.bg}}>
      <Sidebar collapsed={collapsed} navigate={navigate} page={page}/>
      <div style={{flex:1,minWidth:0,overflow:'auto'}}>{children}</div>
    </div>
  );
}

Object.assign(window, {
  DARK_T, LIGHT_T, ThemeCtx, RouteCtx, useT, useRoute,
  StarField, MilkyWayBand, ConstellationSVG, ProgressRing, Icon, Btn, Badge,
  Sidebar, SidebarItem, LMSLayout,
});
