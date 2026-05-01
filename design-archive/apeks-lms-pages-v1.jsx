// apeks-lms-pages.jsx — Dashboard, Course, Lesson, Homework pages

// ── DASHBOARD ──────────────────────────────────────────────────────────────
function DashboardPage({ navigate }) {
  const { t } = useT();
  const olympiads = [
    { type:'Региональный этап', name:'ВсОШ по астрономии', date:'15 февраля', days:21, color:'#9D6E5C' },
    { type:'Муниципальный этап', name:'Олимпиада МФТИ', date:'3 марта', days:37, color:'#5A8DAF' },
    { type:'Заключительный этап', name:'ВсОШ по астрономии', date:'20 апреля', days:85, color:'#8E5DAA' },
  ];
  return (
    <div style={{padding:'48px 56px', maxWidth:1100}}>
      <div style={{marginBottom:52}}>
        <h1 style={{fontFamily:'Newsreader,serif',fontSize:38,fontWeight:600,color:t.text,letterSpacing:'-0.01em',marginBottom:8}}>Привет, Алексей</h1>
        <p style={{fontSize:16,color:t.sec}}>Сегодня, 25 апреля · запланировано занятий: 3</p>
      </div>

      <section style={{marginBottom:56}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h2 style={{fontSize:18,fontWeight:600,color:t.text}}>Мои курсы</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:20}}>
          <CourseCard navigate={navigate}/>
        </div>
      </section>

      <section>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <h2 style={{fontSize:18,fontWeight:600,color:t.text}}>Ближайшие олимпиады</h2>
          <button onClick={()=>navigate('calendar')} style={{background:'none',border:'none',color:t.gold,fontSize:14,cursor:'pointer'}}>Весь календарь →</button>
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
      style={{background:t.s1,borderRadius:12,padding:24,border:`1px solid ${t.border}`,cursor:'pointer',transition:'all 200ms ease',transform:hov?'translateY(-2px)':'none',boxShadow:hov?`0 12px 32px rgba(0,0,0,0.45)`:'none'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <Badge variant="gold">Активный</Badge>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <ProgressRing pct={pct} size={52} stroke={3} t={t}/>
        </div>
      </div>
      <h3 style={{fontFamily:'Newsreader,serif',fontSize:22,fontWeight:600,color:t.text,marginBottom:8,lineHeight:1.3}}>Всерос с Апексом</h3>
      <p style={{fontSize:13,color:t.sec,marginBottom:16,lineHeight:1.55}}>Годовая подготовка к олимпиадам по астрономии. Теория, задачи, звёздное небо.</p>
      <div style={{background:t.border,borderRadius:9999,height:4,marginBottom:12}}>
        <div style={{width:`${pct}%`,height:4,background:t.gold,borderRadius:9999,transition:'width 0.6s ease'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:12,color:t.muted}}>7 из 20 занятий</span>
        <Btn size="sm" onClick={()=>navigate('course')}>Открыть</Btn>
      </div>
    </div>
  );
}

function OlympiadCard({ type, name, date, days, color }) {
  const { t } = useT();
  const [hov, setHov] = React.useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:t.s1,borderRadius:12,padding:'16px 20px',border:`1px solid ${t.border}`,borderLeft:`4px solid ${color}`,cursor:'pointer',transition:'all 200ms ease',transform:hov?'translateY(-2px)':'none'}}>
      <div style={{fontSize:11,color:color,fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>{type}</div>
      <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:8,lineHeight:1.4}}>{name}</div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:13,color:t.sec}}>{date}</span>
        <span style={{fontSize:12,color:t.muted}}>через {days} дн.</span>
      </div>
    </div>
  );
}

// ── COURSE PAGE ─────────────────────────────────────────────────────────────
const COURSE_DATA = {
  blocks: [
    {
      id:1, title:'Небесная механика', lessons:8, done:5,
      themes:[
        { id:1, title:'Законы Кеплера', open:true, lessons:[
          {id:1, title:'Первый закон Кеплера. Эллиптические орбиты', done:true, date:'10 янв', dur:'52 мин'},
          {id:2, title:'Второй и третий законы Кеплера', done:false, current:true, date:'17 янв', dur:'58 мин', isNew:true},
        ]},
        { id:2, title:'Закон всемирного тяготения', open:false, lessons:[
          {id:3, title:'Ньютоновская гравитация и её приложения', done:false, date:'24 янв', dur:'55 мин'},
          {id:4, title:'Задачи на гравитацию', done:false, date:'31 янв', dur:'48 мин'},
        ]},
        { id:3, title:'Орбиты и скорости', open:false, lessons:[
          {id:5, title:'Первая и вторая космические скорости', done:false, date:'7 февр', dur:'50 мин'},
        ]},
      ]
    },
    {
      id:2, title:'Наблюдательная астрономия', lessons:6, done:2,
      themes:[
        { id:4, title:'Небесная сфера и координаты', open:false, lessons:[
          {id:6, title:'Системы небесных координат', done:true, date:'5 янв', dur:'60 мин'},
          {id:7, title:'Прецессия и нутация', done:false, date:'12 янв', dur:'54 мин'},
        ]},
      ]
    },
    {
      id:3, title:'Физика звёзд', lessons:5, done:0,
      themes:[
        { id:5, title:'HR-диаграмма и эволюция звёзд', open:false, lessons:[
          {id:8, title:'Диаграмма Герцшпрунга–Рассела', done:false, date:'21 февр', dur:'65 мин'},
        ]},
      ]
    },
  ]
};

function CoursePage({ navigate }) {
  const { t } = useT();
  const [openBlocks, setOpenBlocks] = React.useState({1:true, 2:false, 3:false});
  const [openThemes, setOpenThemes] = React.useState({1:true, 2:false, 3:false, 4:false, 5:false});
  const pct = 35;

  return (
    <div style={{padding:'40px 56px', maxWidth:960}}>
      {/* Breadcrumbs */}
      <div style={{fontSize:12,color:t.muted,marginBottom:24,display:'flex',alignItems:'center',gap:6}}>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('dashboard')}>Главная</span>
        <span>›</span>
        <span style={{color:t.text}}>Всерос с Апексом</span>
      </div>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:40,gap:24}}>
        <div style={{flex:1}}>
          <Badge variant="gold" style={{marginBottom:12}}>Активный курс</Badge>
          <h1 style={{fontFamily:'Newsreader,serif',fontSize:34,fontWeight:600,color:t.text,letterSpacing:'-0.01em',lineHeight:1.2,marginBottom:10,marginTop:8}}>Всерос с Апексом</h1>
          <p style={{fontSize:15,color:t.sec,lineHeight:1.55}}>Годовая программа подготовки к олимпиадам по астрономии. 12 пар в неделю — теория, задачи, звёздное небо.</p>
        </div>
        <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',gap:12,background:t.s1,borderRadius:12,padding:'20px 28px',border:`1px solid ${t.border}`}}>
          <ProgressRing pct={pct} size={80} stroke={5} t={t}/>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:13,color:t.sec,marginBottom:4}}>Пройдено</div>
            <div style={{fontSize:13,fontWeight:600,color:t.text}}>7 из 20 занятий</div>
          </div>
          <Btn size="sm" onClick={()=>navigate('lesson')}>Продолжить</Btn>
        </div>
      </div>

      {/* Programme */}
      <h2 style={{fontSize:18,fontWeight:600,color:t.text,marginBottom:20}}>Программа курса</h2>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {COURSE_DATA.blocks.map(block => (
          <BlockAccordion key={block.id} block={block}
            open={openBlocks[block.id]}
            toggle={()=>setOpenBlocks(prev=>({...prev,[block.id]:!prev[block.id]}))}
            openThemes={openThemes} setOpenThemes={setOpenThemes}
            navigate={navigate}/>
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
        <div style={{transform: open ? 'rotate(90deg)' : 'none', transition:'transform 200ms ease', color:t.muted}}>
          <Icon name="chevronRight" size={16} color={t.muted}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:4}}>{block.title}</div>
          <div style={{fontSize:12,color:t.muted}}>{block.lessons} занятий · {block.done} пройдено</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <div style={{width:120,background:t.border,borderRadius:9999,height:3}}>
            <div style={{width:`${pct}%`,height:3,background:t.gold,borderRadius:9999}}/>
          </div>
          <span style={{fontSize:12,color:t.muted,minWidth:28}}>{pct}%</span>
        </div>
      </div>
      {open && (
        <div style={{borderTop:`1px solid ${t.border}`}}>
          {block.themes.map(theme => (
            <ThemeAccordion key={theme.id} theme={theme}
              open={openThemes[theme.id]}
              toggle={()=>setOpenThemes(prev=>({...prev,[theme.id]:!prev[theme.id]}))}
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
        <div style={{color: allDone ? t.success : anyDone ? t.gold : t.muted}}>
          {allDone ? <Icon name="checkCircle" size={16} color={t.success}/> : anyDone ? <Icon name="half" size={16} color={t.gold}/> : <Icon name="circle" size={16} color={t.muted}/>}
        </div>
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
      style={{display:'flex',alignItems:'center',gap:12,padding:'10px 20px 10px 56px',cursor:'pointer',background:lesson.current ? t.goldBg : hov ? t.hover : 'transparent',transition:'background 150ms ease'}}>
      <div style={{flexShrink:0}}>
        {lesson.done ? <Icon name="check" size={14} color={t.success}/> : lesson.current ? <Icon name="play" size={14} color={t.gold}/> : <Icon name="circle" size={14} color={t.muted}/>}
      </div>
      <span style={{flex:1,fontSize:14,color:lesson.current ? t.gold : lesson.done ? t.sec : t.text,fontWeight:lesson.current?600:400}}>{lesson.title}</span>
      {lesson.isNew && <Badge variant="new" size="sm">Новое</Badge>}
      <span style={{fontSize:12,color:t.muted,flexShrink:0}}>{lesson.dur}</span>
      <span style={{fontSize:12,color:t.muted,flexShrink:0}}>{lesson.date}</span>
    </div>
  );
}

// ── LESSON PAGE ─────────────────────────────────────────────────────────────
function LessonPage({ navigate }) {
  const { t } = useT();
  const [viewed, setViewed] = React.useState(false);

  const relatedLessons = [
    {id:1, title:'Первый закон Кеплера. Эллиптические орбиты', done:true},
    {id:2, title:'Второй и третий законы Кеплера', done:false, current:true},
    {id:3, title:'Задачи на законы Кеплера', done:false},
  ];

  return (
    <div style={{padding:'32px 56px 64px', maxWidth:1100}}>
      {/* Breadcrumbs */}
      <div style={{fontSize:12,color:t.muted,marginBottom:20,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('dashboard')}>Главная</span>
        <span>›</span>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('course')}>Всерос с Апексом</span>
        <span>›</span>
        <span style={{cursor:'pointer',color:t.sec}}>Небесная механика</span>
        <span>›</span>
        <span style={{color:t.muted}}>Законы Кеплера</span>
      </div>

      {/* Title row */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:24,marginBottom:24}}>
        <div style={{flex:1}}>
          <h1 style={{fontFamily:'Newsreader,serif',fontSize:32,fontWeight:600,color:t.text,letterSpacing:'-0.01em',lineHeight:1.2,marginBottom:10}}>Второй и третий законы Кеплера</h1>
          <div style={{display:'flex',gap:16,fontSize:13,color:t.sec,flexWrap:'wrap'}}>
            <span>Занятие 2 из 5 в теме</span>
            <span>·</span>
            <span>17 января 2026</span>
            <span>·</span>
            <span>58 мин</span>
          </div>
        </div>
        <button onClick={()=>setViewed(!viewed)}
          style={{flexShrink:0,display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:8,border:`1px solid ${viewed ? t.success : t.border}`,background: viewed ? t.successBg : 'transparent',color: viewed ? t.success : t.sec,cursor:'pointer',fontSize:13,fontWeight:500,transition:'all 200ms ease'}}>
          <Icon name="check" size={14} color={viewed ? t.success : t.muted}/>
          {viewed ? 'Просмотрено' : 'Отметить просмотренным'}
        </button>
      </div>

      {/* Video player */}
      <div style={{width:'100%',aspectRatio:'16/9',background:'#000',borderRadius:12,marginBottom:16,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#070c18 0%,#13202b 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16}}>
          <ConstellationSVG width={200} height={200} color={t.gold} starOpacity={0.4} lineOpacity={0.15}/>
          <div style={{position:'absolute',width:64,height:64,borderRadius:'50%',background:t.goldBg,border:`2px solid ${t.gold}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all 200ms ease'}}>
            <Icon name="play" size={24} color={t.gold}/>
          </div>
        </div>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:40,background:'linear-gradient(to top,rgba(0,0,0,0.8),transparent)',display:'flex',alignItems:'center',padding:'0 16px',gap:12}}>
          <Icon name="play" size={16} color='#fff'/>
          <div style={{flex:1,height:3,background:'rgba(255,255,255,0.2)',borderRadius:9999}}>
            <div style={{width:'22%',height:'100%',background:t.gold,borderRadius:9999}}/>
          </div>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>12:43 / 58:00</span>
          <Icon name="externalLink" size={16} color='rgba(255,255,255,0.6)'/>
        </div>
      </div>

      {/* Lesson nav */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:36,padding:'12px 0',borderBottom:`1px solid ${t.border}`}}>
        <button style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:t.sec,cursor:'pointer',fontSize:13,padding:0}}>
          <Icon name="arrowLeft" size={16} color={t.muted}/>
          <span>Первый закон Кеплера</span>
        </button>
        <span style={{fontSize:13,color:t.muted}}>Занятие 2 из 5</span>
        <button onClick={()=>navigate('lesson')} style={{display:'flex',alignItems:'center',gap:8,background:'none',border:'none',color:t.sec,cursor:'pointer',fontSize:13,padding:0}}>
          <span>Задачи на законы Кеплера</span>
          <Icon name="arrowRight" size={16} color={t.muted}/>
        </button>
      </div>

      {/* Two-column content */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:48,alignItems:'start'}}>
        {/* Left */}
        <div>
          <h3 style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:14}}>О занятии</h3>
          <div style={{fontSize:15,color:t.sec,lineHeight:1.65,marginBottom:28}}>
            <p style={{marginBottom:12}}>Разбираем второй и третий законы Кеплера в деталях. Второй закон — закон площадей — объясняет, почему планеты движутся быстрее в перигелии и медленнее в афелии.</p>
            <p style={{marginBottom:12}}>Третий закон связывает период обращения планеты с большой полуосью орбиты. В обобщённой форме для двух тел:</p>
            <div style={{background:t.s2,borderRadius:8,padding:'14px 20px',marginBottom:12,fontFamily:'Georgia,serif',fontSize:16,color:t.text,textAlign:'center',letterSpacing:'0.03em'}}>
              T² / a³ = 4π² / G(M + m)
            </div>
            <p>На занятии рассмотрим задачи ВсОШ, в которых применяется третий закон к спутникам, экзопланетам и двойным звёздам.</p>
          </div>

          {/* Materials */}
          <h3 style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:14}}>Материалы</h3>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:28}}>
            <MaterialCard icon="fileText" name="Конспект. Законы Кеплера" meta="PDF · 1.2 МБ"/>
            <MaterialCard icon="fileText" name="Рабочая тетрадь" meta="PDF · 0.8 МБ"/>
          </div>

          {/* Homework card */}
          <div onClick={()=>navigate('homework')}
            style={{background:t.s1,border:`1px solid ${t.gold}`,borderRadius:12,padding:'20px 24px',cursor:'pointer',transition:'all 200ms ease',display:'flex',alignItems:'center',gap:20}}>
            <div style={{width:44,height:44,borderRadius:10,background:t.goldBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Icon name="fileText" size={22} color={t.gold}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:4}}>Домашнее задание к этому занятию</div>
              <div style={{fontSize:13,color:t.sec,marginBottom:8}}>5 задач · 25 баллов</div>
              <div style={{background:t.border,borderRadius:9999,height:3,marginBottom:4}}>
                <div style={{width:'40%',height:3,background:t.gold,borderRadius:9999}}/>
              </div>
              <div style={{fontSize:12,color:t.muted}}>2 из 5 выполнено</div>
            </div>
            <Btn size="sm" onClick={()=>navigate('homework')}>Открыть</Btn>
          </div>
        </div>

        {/* Right — related lessons */}
        <div>
          <h3 style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:14}}>Занятия в теме</h3>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {relatedLessons.map(l => (
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:l.current ? t.goldBg : 'transparent',border: l.current ? `1px solid ${t.gold}` : `1px solid transparent`,cursor:'pointer',transition:'all 150ms ease'}}>
                {l.done ? <Icon name="check" size={14} color={t.success}/> : l.current ? <Icon name="play" size={14} color={t.gold}/> : <Icon name="circle" size={14} color={t.muted}/>}
                <span style={{fontSize:13,color:l.current ? t.gold : l.done ? t.muted : t.sec,fontWeight:l.current?600:400,lineHeight:1.4,flex:1}}>{l.title}</span>
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
      style={{display:'flex',alignItems:'center',gap:14,padding:'12px 16px',borderRadius:8,border:`1px solid ${hov ? t.gold : t.border}`,background:hov ? t.hover : t.s1,transition:'all 150ms ease',cursor:'pointer'}}>
      <Icon name={icon} size={20} color={t.gold}/>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:500,color:t.text}}>{name}</div>
        <div style={{fontSize:12,color:t.muted}}>{meta}</div>
      </div>
      <Icon name="download" size={16} color={t.muted}/>
    </div>
  );
}

// ── HOMEWORK PAGE ───────────────────────────────────────────────────────────
const TASKS = [
  {
    id:1, type:'formula', title:'Задача 1',
    text:'Период обращения Земли вокруг Солнца T₁ = 1 год, большая полуось орбиты a₁ = 1 а.е. Найдите большую полуось орбиты планеты, если её период обращения T₂ = 8 лет.',
    hint:'Используй третий закон Кеплера в виде a³ = T² (в единицах а.е. и лет).',
    answer:'4 а.е.',
    points:5,
  },
  {
    id:2, type:'choice', title:'Задача 2',
    text:'В соответствии со вторым законом Кеплера радиус-вектор планеты за равные промежутки времени описывает равные площади. Это утверждение является следствием:',
    options:['Закона сохранения энергии','Закона сохранения момента импульса','Закона всемирного тяготения','Закона сохранения импульса'],
    correct:1,
    points:3,
  },
  {
    id:3, type:'text', title:'Задача 3',
    text:'Объясните физический смысл второго закона Кеплера. Почему планета движется быстрее в перигелии, чем в афелии? Ответ обоснуйте.',
    points:7,
  },
];

function HomeworkPage({ navigate }) {
  const { t } = useT();
  const [activeTask, setActiveTask] = React.useState(0);
  const [taskStates, setTaskStates] = React.useState({0:'open', 1:'correct', 2:'pending'});

  const setTask = (i, state) => setTaskStates(prev => ({...prev, [i]: state}));

  return (
    <div style={{padding:'32px 56px 80px', maxWidth:900}}>
      {/* Breadcrumbs */}
      <div style={{fontSize:12,color:t.muted,marginBottom:20,display:'flex',alignItems:'center',gap:6}}>
        <span style={{cursor:'pointer',color:t.sec}} onClick={()=>navigate('lesson')}>← Назад к занятию</span>
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <h1 style={{fontFamily:'Newsreader,serif',fontSize:28,fontWeight:600,color:t.text,letterSpacing:'-0.01em',lineHeight:1.2}}>Домашнее задание</h1>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <ProgressRing pct={Math.round((Object.values(taskStates).filter(s=>s==='correct'||s==='pending').length/TASKS.length)*100)} size={52} stroke={3} t={t}/>
        </div>
      </div>
      <p style={{fontSize:14,color:t.sec,marginBottom:28}}>Второй и третий законы Кеплера · 5 задач · 15 баллов</p>

      {/* Task pills */}
      <div style={{display:'flex',gap:8,marginBottom:32,flexWrap:'wrap'}}>
        {TASKS.map((task,i) => {
          const st = taskStates[i];
          const isActive = activeTask === i;
          return (
            <button key={i} onClick={()=>setActiveTask(i)}
              style={{width:40,height:40,borderRadius:'50%',border:'none',cursor:'pointer',fontWeight:600,fontSize:14,transition:'all 150ms ease',
                background: isActive ? t.gold : st==='correct' ? t.successBg : st==='pending' ? t.infoBg : t.s2,
                color: isActive ? '#16140F' : st==='correct' ? t.success : st==='pending' ? t.info : t.sec,
                outline: isActive ? `2px solid ${t.gold}` : 'none', outlineOffset:2}}>
              {st==='correct' ? '✓' : i+1}
            </button>
          );
        })}
      </div>

      {/* Task cards */}
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {TASKS.map((task,i) => (
          <TaskCard key={task.id} task={task} taskIndex={i} active={activeTask===i}
            state={taskStates[i]} setState={s=>setTask(i,s)}
            onOpen={()=>setActiveTask(i)} t={t}/>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:40,paddingTop:24,borderTop:`1px solid ${t.border}`}}>
        <Btn variant="ghost" onClick={()=>navigate('lesson')}>← Назад к занятию</Btn>
        <Btn onClick={()=>navigate('course')}>К следующему занятию →</Btn>
      </div>
    </div>
  );
}

function TaskCard({ task, taskIndex, active, state, setState, onOpen, t }) {
  const stateColor = {open:t.border, correct:t.success, pending:t.info, error:t.error};

  return (
    <div style={{background:t.s1,borderRadius:12,border:`1px solid ${active ? stateColor[state]||t.gold : t.border}`,overflow:'hidden',transition:'all 200ms ease'}}>
      {/* Header */}
      <div onClick={onOpen} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',cursor:'pointer',userSelect:'none'}}>
        <span style={{fontFamily:'Newsreader,serif',fontSize:28,fontWeight:600,color:t.gold,minWidth:32,lineHeight:1}}>{taskIndex+1}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,color:t.muted,marginBottom:2}}>{task.title} · {task.points} баллов</div>
          <div style={{fontSize:14,color:t.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:500}}>{task.text.slice(0,80)}…</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {state==='correct' && <Badge variant="success">Засчитано</Badge>}
          {state==='pending' && <Badge variant="info">На проверке</Badge>}
          {state==='error' && <Badge variant="error">Неверно</Badge>}
          <Icon name={active ? 'chevronDown' : 'chevronRight'} size={16} color={t.muted}/>
        </div>
      </div>

      {/* Body */}
      {active && (
        <div style={{padding:'0 20px 20px',borderTop:`1px solid ${t.border}`}}>
          <div style={{fontSize:15,color:t.text,lineHeight:1.65,marginBottom:20,marginTop:16}}>{task.text}</div>
          {task.type === 'formula' && <FormulaTask task={task} state={state} setState={setState} t={t}/>}
          {task.type === 'choice' && <ChoiceTask task={task} state={state} setState={setState} t={t}/>}
          {task.type === 'text' && <TextTask task={task} state={state} setState={setState} t={t}/>}
        </div>
      )}
    </div>
  );
}

function FormulaTask({ task, state, setState, t }) {
  const [formula, setFormula] = React.useState('');
  const [kbTab, setKbTab] = React.useState('numbers');
  const [showKb, setShowKb] = React.useState(true);

  const kbTabs = {
    numbers: ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+','(',')',',','←'],
    algebra: ['x²','x³','xⁿ','√x','∛x','x/y','|x|','log','ln','e^x','∑','∏','!','…'],
    trig: ['sin','cos','tan','cot','arcsin','arccos','arctan','π','sin²','cos²'],
    greek: ['α','β','γ','δ','ε','θ','λ','μ','ρ','σ','τ','φ','ω','Δ','Ω','Σ','Λ','Π'],
    special: ['∞','±','⋅','≠','≤','≥','∫','∂','∇','→','⟹'],
  };

  const tabLabels = {numbers:'Числа', algebra:'Алгебра', trig:'Тригон.', greek:'Греч.', special:'Спец.'};

  const handleKey = (key) => {
    if (key === '←') { setFormula(f => f.slice(0,-1)); return; }
    if (key === 'x²') { setFormula(f => f + '^2'); return; }
    if (key === 'xⁿ') { setFormula(f => f + '^n'); return; }
    if (key === 'x/y') { setFormula(f => f + '/'); return; }
    if (key === '√x') { setFormula(f => f + '√'); return; }
    setFormula(f => f + key);
  };

  const disabled = state === 'correct';

  return (
    <div>
      {/* Formula input field */}
      <div style={{background:t.bg,borderRadius:10,border:`2px solid ${state==='correct'?t.success:state==='error'?t.error:showKb?t.gold:t.border}`,padding:'12px 16px',marginBottom:8,minHeight:56,display:'flex',alignItems:'center',transition:'border-color 200ms ease'}}>
        {formula ? (
          <span style={{fontFamily:'Georgia,serif',fontSize:18,color:t.text,letterSpacing:'0.04em'}}>{formula}</span>
        ) : (
          <span style={{color:t.muted,fontSize:15}}>Введи формулу…</span>
        )}
        {!disabled && <span style={{display:'inline-block',width:2,height:20,background:t.gold,marginLeft:2,animation:'blink 1s step-end infinite'}}/>}
      </div>

      {/* Feedback */}
      {state==='correct' && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.successBg,marginBottom:16}}>
          <Icon name="checkCircle" size={16} color={t.success}/>
          <span style={{fontSize:13,color:t.success}}>Правильно. +{task.points} баллов</span>
        </div>
      )}
      {state==='error' && (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.errorBg,marginBottom:16}}>
          <Icon name="x" size={16} color={t.error}/>
          <span style={{fontSize:13,color:t.error}}>Неправильный ответ. Попробуй ещё раз.</span>
        </div>
      )}

      {/* Keyboard */}
      {!disabled && showKb && (
        <div style={{background:t.s2,borderRadius:10,padding:14,marginBottom:12}}>
          {/* Tabs */}
          <div style={{display:'flex',gap:4,marginBottom:12,borderBottom:`1px solid ${t.border}`,paddingBottom:10}}>
            {Object.keys(kbTabs).map(tab => (
              <button key={tab} onClick={()=>setKbTab(tab)}
                style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,transition:'all 150ms ease',
                  background:kbTab===tab ? t.gold : 'transparent',color:kbTab===tab ? '#16140F' : t.sec}}>
                {tabLabels[tab]}
              </button>
            ))}
            <button onClick={()=>setShowKb(false)} style={{marginLeft:'auto',background:'none',border:'none',color:t.muted,cursor:'pointer',fontSize:12}}>Скрыть</button>
          </div>
          {/* Keys */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>
            {kbTabs[kbTab].map((key,i) => (
              <KbKey key={i} label={key} onClick={()=>handleKey(key)} t={t}/>
            ))}
          </div>
          {/* Bottom controls */}
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button onClick={()=>setFormula('')}
              style={{flex:1,height:36,borderRadius:8,border:`1px solid ${t.border}`,background:'transparent',color:t.sec,cursor:'pointer',fontSize:13,fontWeight:500}}>Очистить</button>
            <button onClick={()=>setFormula(f=>f.slice(0,-1))}
              style={{flex:1,height:36,borderRadius:8,border:`1px solid ${t.border}`,background:'transparent',color:t.sec,cursor:'pointer',fontSize:13,fontWeight:500}}>← Удалить</button>
          </div>
        </div>
      )}

      {!disabled && (
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={()=>{ formula.includes('4') ? setState('correct') : setState('error'); }}>Сдать на проверку</Btn>
          <Btn variant="secondary">Сохранить черновик</Btn>
          {!showKb && <Btn variant="ghost" onClick={()=>setShowKb(true)}>Клавиатура</Btn>}
        </div>
      )}
    </div>
  );
}

function KbKey({ label, onClick, t }) {
  const [h, setH] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{height:44,borderRadius:8,border:`1px solid ${t.border}`,cursor:'pointer',fontSize:15,fontFamily:'Georgia,serif',fontWeight:400,transition:'all 100ms ease',
        background: h ? t.hover : t.s1, color: t.text}}>
      {label}
    </button>
  );
}

function ChoiceTask({ task, state, setState, t }) {
  const [selected, setSelected] = React.useState(null);
  const submitted = state === 'correct' || state === 'error';
  return (
    <div>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
        {task.options.map((opt,i) => {
          const isSelected = selected === i;
          const isCorrect = i === task.correct;
          let bg = 'transparent', border = t.border, color = t.text;
          if (isSelected && !submitted) { bg = t.goldBg; border = t.gold; }
          if (submitted && isCorrect) { bg = t.successBg; border = t.success; color = t.success; }
          if (submitted && isSelected && !isCorrect) { bg = t.errorBg; border = t.error; color = t.error; }
          return (
            <div key={i} onClick={()=>!submitted && setSelected(i)}
              style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderRadius:10,border:`1.5px solid ${border}`,background:bg,cursor:submitted?'default':'pointer',transition:'all 150ms ease'}}>
              <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${isSelected ? t.gold : t.border}`,background:isSelected?t.gold:'transparent',flexShrink:0,transition:'all 150ms ease'}}/>
              <span style={{fontSize:14,color}}>{opt}</span>
              {submitted && isCorrect && <Icon name="check" size={14} color={t.success} style={{marginLeft:'auto'}}/>}
            </div>
          );
        })}
      </div>
      {!submitted && (
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={()=>{ selected===task.correct ? setState('correct') : setState('error'); }} disabled={selected===null}>Сдать на проверку</Btn>
          <Btn variant="secondary">Сохранить черновик</Btn>
        </div>
      )}
      {state==='correct' && <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.successBg}}><Icon name="checkCircle" size={16} color={t.success}/><span style={{fontSize:13,color:t.success}}>Правильно. +{task.points} баллов</span></div>}
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
        style={{width:'100%',minHeight:120,padding:'12px 14px',borderRadius:10,border:`1.5px solid ${state==='pending'?t.info:t.border}`,background:t.bg,color:t.text,fontSize:14,fontFamily:'Inter,sans-serif',lineHeight:1.6,resize:'vertical',outline:'none',marginBottom:12,transition:'border-color 200ms ease'}}/>
      <div style={{fontSize:12,color:t.muted,marginBottom:12}}>Эта задача проверяется преподавателем вручную.</div>
      {!submitted ? (
        <div style={{display:'flex',gap:10}}>
          <Btn onClick={()=>setState('pending')} disabled={!val.trim()}>Сдать на проверку</Btn>
          <Btn variant="secondary">Сохранить черновик</Btn>
        </div>
      ) : (
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:8,background:t.infoBg}}>
          <Icon name="circle" size={16} color={t.info}/>
          <span style={{fontSize:13,color:t.info}}>Ответ принят, ждёт проверки преподавателя.</span>
        </div>
      )}
    </div>
  );
}

// Calendar page (simple)
function CalendarPage({ navigate }) {
  const { t } = useT();
  const events = [
    {type:'Региональный этап', name:'ВсОШ по астрономии', date:'15 февраля', color:'#9D6E5C', desc:'Задания по астрономии для 9–11 классов.'},
    {type:'Муниципальный этап', name:'Олимпиада МФТИ', date:'3 марта', color:'#5A8DAF', desc:''},
    {type:'Заключительный этап', name:'ВсОШ по астрономии', date:'20 апреля', color:'#8E5DAA', desc:'Финальный этап всероссийской олимпиады.'},
    {type:'Турнир Струве', name:'Открытый турнир Струве', date:'5 мая', color:'#C4392F', desc:'Командный формат.'},
    {type:'Дедлайн регистрации', name:'IOAA — регистрация', date:'1 июня', color:'#B8770A', desc:''},
  ];
  return (
    <div style={{padding:'40px 56px', maxWidth:900}}>
      <h1 style={{fontFamily:'Newsreader,serif',fontSize:34,fontWeight:600,color:t.text,marginBottom:8}}>Календарь олимпиад</h1>
      <p style={{fontSize:15,color:t.sec,marginBottom:32}}>События текущего сезона</p>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {events.map((ev,i) => (
          <div key={i} style={{background:t.s1,borderRadius:12,padding:'18px 24px',border:`1px solid ${t.border}`,borderLeft:`4px solid ${ev.color}`,display:'flex',alignItems:'center',gap:20}}>
            <div style={{minWidth:72,textAlign:'center'}}>
              <div style={{fontSize:22,fontFamily:'Newsreader,serif',fontWeight:600,color:t.text,lineHeight:1}}>{ev.date.split(' ')[0]}</div>
              <div style={{fontSize:12,color:t.muted}}>{ev.date.split(' ')[1]}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:ev.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{ev.type}</div>
              <div style={{fontSize:15,fontWeight:600,color:t.text}}>{ev.name}</div>
              {ev.desc && <div style={{fontSize:13,color:t.sec,marginTop:4}}>{ev.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  DashboardPage, CoursePage, LessonPage, HomeworkPage, CalendarPage,
  CourseCard, OlympiadCard, MaterialCard,
});
