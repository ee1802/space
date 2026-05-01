// apeks-landing.jsx — Landing page + Login

// ── LANDING ─────────────────────────────────────────────────────────────────
function LandingPage({ navigate }) {
  const { t } = useT();
  const [scrolled, setScrolled] = React.useState(false);
  const [faqOpen, setFaqOpen] = React.useState({});

  React.useEffect(() => {
    const el = document.querySelector('#landing-scroll');
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const faqs = [
    {q:'Когда начинаются занятия?', a:'Запись открыта в любой момент. Занятия идут непрерывно — новые занятия публикуются каждую неделю. Записи всех прошедших занятий доступны сразу.'},
    {q:'Что если я не успеваю смотреть все 12 пар в неделю?', a:'Записи хранятся бессрочно. Ты можешь учиться в своём темпе — смотреть то, что нужно именно тебе, и пропускать уже знакомые темы.'},
    {q:'Можно ли подключиться в середине учебного года?', a:'Да. Доступ к платформе и всем материалам открывается сразу после оплаты подписки.'},
    {q:'Как происходит проверка домашних заданий?', a:'Задачи с числовым или формульным ответом проверяются автоматически. Текстовые и развёрнутые решения проверяет преподаватель и оставляет комментарий.'},
    {q:'Что делать, если я в 8 классе?', a:'Младший поток рассчитан именно на учеников 8–9 класса. В нём разбирается базовая астрономия и физика, необходимые для регионального этапа.'},
  ];

  return (
    <div id="landing-scroll" style={{height:'100vh', overflowY:'auto', background:t.bg, fontFamily:'Inter,sans-serif'}}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .fade-up { animation: fadeUp 0.7s ease both; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <header style={{position:'sticky',top:0,zIndex:100,height:72,display:'flex',alignItems:'center',padding:'0 48px',transition:'all 200ms ease',background: scrolled ? t.bg : 'transparent',borderBottom: scrolled ? `1px solid ${t.border}` : 'none',backdropFilter: scrolled ? 'blur(12px)' : 'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
          <ConstellationSVG width={26} height={26} color={t.gold} starOpacity={0.9} lineOpacity={0.5}/>
          <span style={{fontFamily:'Newsreader,serif',fontSize:22,fontWeight:600,color:t.text,letterSpacing:'-0.02em'}}>apeks</span>
        </div>
        <nav style={{display:'flex',gap:28,fontSize:14,color:t.sec}}>
          {['О курсе','Программа','Преподаватель','Стоимость','FAQ'].map(l => (
            <a key={l} href="#" style={{color:t.sec,textDecoration:'none',transition:'color 150ms ease'}}
              onMouseEnter={e=>e.target.style.color=t.text} onMouseLeave={e=>e.target.style.color=t.sec}>{l}</a>
          ))}
        </nav>
        <div style={{flex:1,display:'flex',justifyContent:'flex-end',gap:12}}>
          <Btn variant="ghost" size="md" onClick={()=>navigate('login')}>Войти</Btn>
          <Btn size="md" onClick={()=>navigate('login')}>Купить курс</Btn>
        </div>
      </header>

      {/* Hero */}
      <section style={{maxWidth:1200,margin:'0 auto',padding:'80px 48px 96px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:64,alignItems:'center'}}>
        <div className="fade-up">
          <div style={{fontSize:11,fontWeight:600,color:t.gold,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:20}}>Авторская школа астрономии Евгения Бойцова</div>
          <h1 style={{fontFamily:'Newsreader,serif',fontSize:52,fontWeight:600,color:t.text,letterSpacing:'-0.02em',lineHeight:1.1,marginBottom:20}}>
            Годовая подготовка<br/>к олимпиадам<br/>по <em style={{color:t.gold,fontStyle:'italic'}}>астрономии</em>
          </h1>
          <p style={{fontSize:18,color:t.sec,lineHeight:1.65,marginBottom:32,maxWidth:480}}>Один курс, который закрывает всё: от базовой теории до Заключительного этапа. 12 пар в неделю, личный наставник, прозрачная программа.</p>
          <div style={{display:'flex',gap:12,marginBottom:24}}>
            <Btn size="lg" onClick={()=>navigate('login')}>Купить курс</Btn>
            <Btn size="lg" variant="secondary">Узнать подробнее</Btn>
          </div>
          <div style={{fontSize:13,color:t.muted,lineHeight:1.6}}>
            12 500 ₽/мес · 12 пар в неделю · подписка через Tribute · льготные условия
          </div>
        </div>

        {/* Hero illustration */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',position:'relative'}}>
          <div style={{width:380,height:380,position:'relative'}}>
            {/* Orbital rings */}
            {[1,0.72,0.48].map((scale,i) => (
              <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:`translate(-50%,-50%) scale(${scale})`,width:340,height:340,borderRadius:'50%',border:`1px solid ${t.gold}`,opacity:0.12+i*0.08}}/>
            ))}
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <ConstellationSVG width={280} height={280} color={t.gold} starOpacity={0.85} lineOpacity={0.35}/>
            </div>
            {/* Floating data points */}
            {[
              {top:'8%',left:'55%',label:'T² ∝ a³'},
              {top:'72%',right:'5%',label:'ε = 0.0167'},
              {top:'20%',left:'2%',label:'Орион'},
            ].map((pt,i) => (
              <div key={i} style={{position:'absolute',...(pt.left?{left:pt.left}:{right:pt.right}),top:pt.top,background:t.s1,border:`1px solid ${t.border}`,borderRadius:8,padding:'4px 10px',fontSize:12,fontFamily:'Georgia,serif',color:t.gold,letterSpacing:'0.03em',whiteSpace:'nowrap'}}>
                {pt.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section style={{background: t.s1, padding:'80px 48px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,color:t.text,letterSpacing:'-0.01em',marginBottom:16}}>Что такое Всерос с Апексом</h2>
            <p style={{fontSize:17,color:t.sec,maxWidth:560,margin:'0 auto',lineHeight:1.65}}>Не меню курсов, а один непрерывный путь с наставником до финала олимпиады.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:56}}>
            {[
              {icon:'▸', title:'Один путь, не меню', desc:'Выбираешь не курс, а наставника. Темп, уровень и приоритеты подбираются под тебя. Никаких потерянных часов на ненужные темы.'},
              {icon:'◈', title:'Серьёзная программа', desc:'Астрономия старшего и младшего потоков, физика для астрономов, математика для астрономов, навигация по звёздному небу.'},
              {icon:'◎', title:'До конца сезона', desc:'Подготовка идёт весь учебный год. Запись в любой момент с фиксированной ценой для постоянных учеников.'},
            ].map((card,i) => (
              <div key={i} style={{background:t.bg,borderRadius:12,padding:28,border:`1px solid ${t.border}`}}>
                <div style={{fontSize:22,color:t.gold,marginBottom:16,fontFamily:'serif'}}>{card.icon}</div>
                <h3 style={{fontSize:17,fontWeight:600,color:t.text,marginBottom:10}}>{card.title}</h3>
                <p style={{fontSize:14,color:t.sec,lineHeight:1.6}}>{card.desc}</p>
              </div>
            ))}
          </div>
          {/* Quote */}
          <div style={{background:t.s2,borderRadius:16,padding:'32px 40px',borderLeft:`4px solid ${t.gold}`}}>
            <p style={{fontFamily:'Newsreader,serif',fontSize:20,fontStyle:'italic',color:t.text,lineHeight:1.65,marginBottom:12}}>«Апекс — это не курс "выучи астрономию за 30 дней". Это место, где ты на год погружаешься в серьёзную работу над собой под руководством наставника, который сам прошёл этот путь.»</p>
            <span style={{fontSize:13,color:t.muted}}>— Евгений Бойцов, основатель школы</span>
          </div>
        </div>
      </section>

      {/* Programme cards */}
      <section style={{padding:'80px 48px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,color:t.text,marginBottom:12,letterSpacing:'-0.01em'}}>12 пар в неделю</h2>
          <p style={{fontSize:17,color:t.sec,marginBottom:48}}>по четырём направлениям</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:20}}>
            {[
              {title:'Астрономия — старший поток',badge:'10–11 класс', topics:['Небесная механика и орбиты','Физика звёзд и эволюция','Галактики и космология','Наблюдательная астрономия']},
              {title:'Астрономия — младший поток',badge:'8–9 класс', topics:['Небесная сфера и координаты','Солнечная система','Основы звёздной астрофизики','Практика работы со звёздной картой']},
              {title:'Физика для астрономов',badge:'Все классы', topics:['Механика и гравитация','Термодинамика и статфизика','Электромагнетизм','Атомная и ядерная физика']},
              {title:'Математика для астрономов',badge:'Все классы', topics:['Тригонометрия и геометрия','Комплексные числа','Дифференциальные уравнения','Ряды и приближения']},
            ].map((card,i) => (
              <div key={i} style={{background:t.s1,borderRadius:12,padding:28,border:`1px solid ${t.border}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                  <h3 style={{fontSize:16,fontWeight:600,color:t.text,lineHeight:1.3,maxWidth:260}}>{card.title}</h3>
                  <Badge variant="neutral">{card.badge}</Badge>
                </div>
                <ul style={{listStyle:'none',padding:0,display:'flex',flexDirection:'column',gap:8}}>
                  {card.topics.map((tp,j) => (
                    <li key={j} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:14,color:t.sec,lineHeight:1.5}}>
                      <span style={{color:t.gold,marginTop:2,flexShrink:0}}>·</span>{tp}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{background:t.s1,padding:'80px 48px'}}>
        <div style={{maxWidth:600,margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,color:t.text,marginBottom:48,letterSpacing:'-0.01em'}}>Стоимость</h2>
          <div style={{background:t.bg,borderRadius:20,padding:'40px 48px',border:`1px solid ${t.border}`}}>
            <div style={{fontSize:14,color:t.sec,marginBottom:4}}>Всерос с Апексом</div>
            <div style={{fontFamily:'Newsreader,serif',fontSize:60,fontWeight:600,color:t.text,letterSpacing:'-0.02em',lineHeight:1}}>12 500 ₽</div>
            <div style={{fontSize:14,color:t.muted,marginBottom:32}}>в месяц, подписка через Tribute</div>
            <ul style={{listStyle:'none',padding:0,textAlign:'left',display:'flex',flexDirection:'column',gap:14,marginBottom:32}}>
              {['12 пар в неделю по 4 направлениям','Записи всех занятий без срока','Личный наставник и обратная связь','Промежуточные проверки и корректировка трека','Доступ к тренажёру звёздного неба','Прямые эфиры Бойцов-ТВ'].map((item,i) => (
                <li key={i} style={{display:'flex',alignItems:'center',gap:12,fontSize:15,color:t.text}}>
                  <span style={{width:20,height:20,borderRadius:'50%',background:t.goldBg,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Icon name="check" size={12} color={t.gold}/>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Btn size="xl" full onClick={()=>navigate('login')}>Купить курс</Btn>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:'80px 48px'}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,color:t.text,marginBottom:48,letterSpacing:'-0.01em'}}>Частые вопросы</h2>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {faqs.map((faq,i) => (
              <FaqItem key={i} faq={faq} open={faqOpen[i]}
                toggle={()=>setFaqOpen(prev=>({...prev,[i]:!prev[i]}))} t={t}/>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'#0B1426',padding:'56px 48px 32px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:48,marginBottom:48}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                <ConstellationSVG width={22} height={22} color='#D9A441' starOpacity={0.9} lineOpacity={0.5}/>
                <span style={{fontFamily:'Newsreader,serif',fontSize:20,fontWeight:600,color:'#F5F2ED',letterSpacing:'-0.02em'}}>apeks</span>
              </div>
              <p style={{fontSize:13,color:'#6E6B62',lineHeight:1.6}}>Авторская онлайн-школа подготовки к олимпиадам по астрономии</p>
            </div>
            {[
              {title:'Навигация', links:['О курсе','Программа','Преподаватель','FAQ','Войти']},
              {title:'Контакты', links:['Telegram-канал','@eugene_boitsov','apeks@example.ru']},
              {title:'Документы', links:['Договор оферты','Конфиденциальность']},
            ].map((col,i) => (
              <div key={i}>
                <div style={{fontSize:11,fontWeight:600,color:'#6E6B62',marginBottom:14,letterSpacing:'0.08em',textTransform:'uppercase'}}>{col.title}</div>
                {col.links.map((l,j) => <div key={j} style={{fontSize:13,color:'#A9A599',marginBottom:8,cursor:'pointer'}}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid #243047',paddingTop:24,fontSize:12,color:'#6E6B62'}}>
            © 2026 Apeks. Авторская школа подготовки к астрономическим олимпиадам.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FaqItem({ faq, open, toggle, t }) {
  return (
    <div style={{border:`1px solid ${t.border}`,borderRadius:10,overflow:'hidden',marginBottom:4}}>
      <div onClick={toggle} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',cursor:'pointer',userSelect:'none',background:open?t.s1:'transparent',transition:'background 150ms ease'}}>
        <span style={{fontSize:15,fontWeight:500,color:t.text,lineHeight:1.4}}>{faq.q}</span>
        <div style={{transform:open?'rotate(180deg)':'none',transition:'transform 200ms ease',flexShrink:0,marginLeft:16}}>
          <Icon name="chevronDown" size={18} color={t.muted}/>
        </div>
      </div>
      {open && (
        <div style={{padding:'0 20px 18px',background:t.s1,fontSize:14,color:t.sec,lineHeight:1.65}}>{faq.a}</div>
      )}
    </div>
  );
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ navigate }) {
  const { t: darkT } = React.useContext(ThemeCtx);
  // Always use dark theme for login
  const t = DARK_T;
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('dashboard'); }, 800);
  };

  return (
    <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',background:t.bg,fontFamily:'Inter,sans-serif'}}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
      {/* Form */}
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'64px 72px'}}>
        <div onClick={()=>navigate('landing')} style={{display:'flex',alignItems:'center',gap:10,marginBottom:56,cursor:'pointer'}}>
          <ConstellationSVG width={24} height={24} color={t.gold} starOpacity={0.9} lineOpacity={0.5}/>
          <span style={{fontFamily:'Newsreader,serif',fontSize:20,fontWeight:600,color:t.text,letterSpacing:'-0.02em'}}>apeks</span>
        </div>

        <h1 style={{fontFamily:'Newsreader,serif',fontSize:32,fontWeight:600,color:t.text,marginBottom:8}}>Вход в кабинет</h1>
        <p style={{fontSize:15,color:t.sec,marginBottom:36}}>Введи email и пароль для входа</p>

        <div style={{marginBottom:20}}>
          <label style={{display:'block',fontSize:13,fontWeight:500,color:t.sec,marginBottom:6}}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{width:'100%',height:48,padding:'0 16px',borderRadius:10,border:`1.5px solid ${t.border}`,background:t.s1,color:t.text,fontSize:15,fontFamily:'Inter,sans-serif',outline:'none',transition:'border-color 200ms ease'}}
            onFocus={e=>e.target.style.borderColor=t.gold}
            onBlur={e=>e.target.style.borderColor=t.border}/>
        </div>

        <div style={{marginBottom:8}}>
          <label style={{display:'block',fontSize:13,fontWeight:500,color:t.sec,marginBottom:6}}>Пароль</label>
          <div style={{position:'relative'}}>
            <input type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              style={{width:'100%',height:48,padding:'0 48px 0 16px',borderRadius:10,border:`1.5px solid ${t.border}`,background:t.s1,color:t.text,fontSize:15,fontFamily:'Inter,sans-serif',outline:'none',transition:'border-color 200ms ease'}}
              onFocus={e=>e.target.style.borderColor=t.gold}
              onBlur={e=>e.target.style.borderColor=t.border}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()}/>
            <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:t.muted,padding:4}}>
              <Icon name={showPw?'circle':'circle'} size={18} color={t.muted}/>
              <span style={{fontSize:12}}>{showPw?'👁':'👁‍🗨'}</span>
            </button>
          </div>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:28}}>
          <button style={{background:'none',border:'none',color:t.gold,fontSize:13,cursor:'pointer'}}>Забыл пароль?</button>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{width:'100%',height:52,borderRadius:10,border:'none',background: loading ? t.goldD : t.gold,color:'#16140F',fontSize:16,fontWeight:600,cursor:'pointer',transition:'all 200ms ease',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          {loading ? (
            <span style={{display:'inline-block',width:18,height:18,border:`2px solid #16140F`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.6s linear infinite'}}/>
          ) : 'Войти'}
        </button>

        <p style={{textAlign:'center',marginTop:24,fontSize:13,color:t.muted}}>
          Нет аккаунта?{' '}
          <button style={{background:'none',border:'none',color:t.gold,fontSize:13,cursor:'pointer'}}>Зарегистрироваться</button>
        </p>
      </div>

      {/* Illustration */}
      <div style={{background:t.s1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:64,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.6}}>
          <ConstellationSVG width={500} height={500} color={t.gold} starOpacity={0.6} lineOpacity={0.2}/>
        </div>
        {[280,200,130].map((size,i) => (
          <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:`translate(-50%,-50%)`,width:size,height:size,borderRadius:'50%',border:`1px solid ${t.gold}`,opacity:0.08+i*0.06,pointerEvents:'none'}}/>
        ))}
        <div style={{position:'relative',textAlign:'center',maxWidth:320}}>
          <div style={{fontFamily:'Newsreader,serif',fontSize:28,fontWeight:600,color:t.text,lineHeight:1.25,marginBottom:16}}>
            Место, где астрономия становится работой
          </div>
          <div style={{fontSize:14,color:t.sec,lineHeight:1.6}}>
            Тёмная комната, звёздная карта, формулы и задачи. Добро пожаловать.
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

Object.assign(window, { LandingPage, LoginPage, FaqItem });
