// apeks-landing.jsx v2 — Deep space style, no Tribute, Бойцов avatar, astronomy atmosphere

function LandingPage({ navigate }) {
  const { t } = useT();
  const [scrolled, setScrolled] = React.useState(false);
  const [faqOpen, setFaqOpen] = React.useState({});

  React.useEffect(() => {
    const el = document.querySelector('#landing-scroll');
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', h);
    return () => el.removeEventListener('scroll', h);
  }, []);

  const faqs = [
    {q:'Когда начинаются занятия?', a:'Запись открыта в любой момент. Все прошедшие занятия доступны в записи сразу — начинаешь с нужной темы, не ждёшь начала модуля.'},
    {q:'Что если я не успеваю смотреть все 12 пар в неделю?', a:'Записи хранятся бессрочно. Учишься в своём темпе — смотришь то, что нужно, пропускаешь уже знакомое.'},
    {q:'Можно ли подключиться в середине года?', a:'Да. Доступ ко всем материалам открывается сразу после оплаты. Никаких ограничений по дате входа.'},
    {q:'Как проверяются домашние задания?', a:'Числовые и формульные задачи — автоматически. Развёрнутые решения проверяет преподаватель и оставляет комментарий.'},
    {q:'Подходит ли курс для 8 класса?', a:'Да — младший поток рассчитан на 8–9 класс. Там разбирается базовая астрономия и физика для регионального этапа.'},
    {q:'Есть ли живые занятия?', a:'Да. Кроме записей — регулярные прямые эфиры, разборы задач и Q&A сессии с Евгением.'},
  ];

  const programs = [
    {title:'Астрономия — старший поток', badge:'10–11 класс', color:'#4ECDD4', topics:['Небесная механика и орбиты','Физика звёзд и эволюция','Галактики и космология','Наблюдательная астрономия']},
    {title:'Астрономия — младший поток', badge:'8–9 класс', color:'#8B6DD4', topics:['Небесная сфера и координаты','Солнечная система','Основы звёздной астрофизики','Практика со звёздной картой']},
    {title:'Физика для астрономов', badge:'Все классы', color:'#D9A441', topics:['Механика и гравитация','Термодинамика и статфизика','Электромагнетизм','Атомная и ядерная физика']},
    {title:'Математика для астрономов', badge:'Все классы', color:'#FF9B6A', topics:['Тригонометрия и геометрия','Комплексные числа','Дифференциальные уравнения','Ряды и приближения']},
  ];

  return (
    <div id="landing-scroll" style={{height:'100vh', overflowY:'auto', background:'#070C18', fontFamily:'Inter,sans-serif', color:'#F0EDE8'}}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes twinkle { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes orbit { from{transform:rotate(0deg) translateX(140px) rotate(0deg)} to{transform:rotate(360deg) translateX(140px) rotate(-360deg)} }
        .fade-up { animation: fadeUp 0.8s ease both; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease both; }
        * { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{position:'sticky',top:0,zIndex:100,height:72,display:'flex',alignItems:'center',padding:'0 48px',transition:'all 250ms ease',background: scrolled ? 'rgba(7,12,24,0.92)' : 'transparent',borderBottom: scrolled ? '1px solid #1E2D4A' : 'none',backdropFilter: scrolled ? 'blur(16px)' : 'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,flex:1}}>
          <ConstellationSVG width={26} height={26} color='#D9A441' starOpacity={0.95} lineOpacity={0.55} glow={true}/>
          <span style={{fontFamily:'Newsreader,serif',fontSize:22,fontWeight:600,letterSpacing:'-0.02em'}}>apeks</span>
        </div>
        <nav style={{display:'flex',gap:28,fontSize:14,color:'#A8A5A0'}}>
          {['О курсе','Программа','Преподаватель','FAQ'].map(l => (
            <a key={l} href="#" style={{transition:'color 150ms'}}
              onMouseEnter={e=>e.target.style.color='#F0EDE8'} onMouseLeave={e=>e.target.style.color='#A8A5A0'}>{l}</a>
          ))}
        </nav>
        <div style={{flex:1,display:'flex',justifyContent:'flex-end',gap:12}}>
          <button onClick={()=>navigate('login')} style={{height:38,padding:'0 18px',borderRadius:8,border:'1px solid #1E2D4A',background:'transparent',color:'#A8A5A0',cursor:'pointer',fontSize:14,fontFamily:'Inter,sans-serif',transition:'all 150ms ease'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#4ECDD4';e.currentTarget.style.color='#F0EDE8';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E2D4A';e.currentTarget.style.color='#A8A5A0';}}>
            Войти
          </button>
          <button onClick={()=>navigate('login')} style={{height:38,padding:'0 20px',borderRadius:8,border:'none',background:'#D9A441',color:'#0A0E1A',cursor:'pointer',fontSize:14,fontWeight:600,fontFamily:'Inter,sans-serif',transition:'all 150ms ease',boxShadow:'0 0 16px #D9A44144'}}
            onMouseEnter={e=>e.currentTarget.style.background='#F4B860'}
            onMouseLeave={e=>e.currentTarget.style.background='#D9A441'}>
            Купить курс
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{minHeight:'calc(100vh - 72px)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center',padding:'60px 48px 80px',position:'relative',overflow:'hidden',maxWidth:1400,margin:'0 auto'}}>
        {/* Star field bg */}
        <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
          <StarField count={200}/>
          <MilkyWayBand/>
        </div>

        {/* Left */}
        <div style={{position:'relative'}}>
          <div className="fade-up" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'5px 12px 5px 8px',borderRadius:9999,border:'1px solid #1E2D4A',background:'rgba(78,205,212,0.07)',marginBottom:24}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'#4ECDD4',boxShadow:'0 0 8px #4ECDD4'}}/>
            <span style={{fontSize:12,color:'#4ECDD4',fontWeight:500,letterSpacing:'0.04em'}}>Авторская школа астрономии Евгения Бойцова</span>
          </div>
          <h1 className="fade-up-2" style={{fontFamily:'Newsreader,serif',fontSize:54,fontWeight:600,letterSpacing:'-0.025em',lineHeight:1.08,marginBottom:22,color:'#F0EDE8'}}>
            Олимпиадная<br/>астрономия<br/><em style={{color:'#D9A441',fontStyle:'italic'}}>серьёзно</em>
          </h1>
          <p className="fade-up-3" style={{fontSize:18,color:'#A8A5A0',lineHeight:1.65,marginBottom:32,maxWidth:460}}>
            12 пар в неделю. Один наставник. Один путь — от первых формул до Заключительного этапа.
          </p>
          <div className="fade-up-3" style={{display:'flex',gap:14,marginBottom:20}}>
            <button onClick={()=>navigate('login')} style={{height:52,padding:'0 28px',borderRadius:10,border:'none',background:'#D9A441',color:'#0A0E1A',cursor:'pointer',fontSize:16,fontWeight:600,fontFamily:'Inter,sans-serif',transition:'all 150ms ease',boxShadow:'0 0 24px #D9A44155'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#F4B860';e.currentTarget.style.boxShadow='0 0 36px #D9A44177';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#D9A441';e.currentTarget.style.boxShadow='0 0 24px #D9A44155';}}>
              Записаться
            </button>
            <button onClick={()=>navigate('dashboard')} style={{height:52,padding:'0 24px',borderRadius:10,border:'1px solid #1E2D4A',background:'transparent',color:'#A8A5A0',cursor:'pointer',fontSize:16,fontFamily:'Inter,sans-serif',transition:'all 150ms ease'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#4ECDD4';e.currentTarget.style.color='#F0EDE8';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#1E2D4A';e.currentTarget.style.color='#A8A5A0';}}>
              Посмотреть платформу
            </button>
          </div>
          <div style={{display:'flex',gap:28,fontSize:13,color:'#6A6860',marginTop:8}}>
            <span>12 пар / неделю</span>
            <span>·</span>
            <span>8–11 класс</span>
            <span>·</span>
            <span>Онлайн</span>
          </div>
        </div>

        {/* Right — orbital orrery */}
        <div style={{display:'flex',justifyContent:'center',alignItems:'center',position:'relative',height:480}}>
          {/* Orbital rings */}
          {[320,230,155].map((d,i) => (
            <div key={i} style={{position:'absolute',width:d,height:d,borderRadius:'50%',border:`1px solid rgba(78,205,212,${0.06+i*0.04})`,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
          ))}
          {/* Center star */}
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:40,height:40,borderRadius:'50%',background:'radial-gradient(circle,#F4E080,#D9A441)',boxShadow:'0 0 40px #D9A441AA, 0 0 80px #D9A44155'}}/>
          {/* Constellation */}
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.5}}>
            <ConstellationSVG width={380} height={380} color='#4ECDD4' starOpacity={0.7} lineOpacity={0.25} glow={true}/>
          </div>
          {/* Floating labels */}
          {[
            {label:'T² ∝ a³', top:'12%', left:'62%'},
            {label:'ε = 0.0167', top:'75%', right:'4%'},
            {label:'G = 6.674·10⁻¹¹', top:'25%', left:'0%'},
            {label:'NGC 1976', bottom:'15%', left:'55%'},
          ].map((pt,i) => {
            const {label,...pos} = pt;
            return (
              <div key={i} style={{position:'absolute',...pos,background:'rgba(13,21,37,0.85)',border:'1px solid #1E2D4A',borderRadius:6,padding:'4px 10px',fontSize:12,fontFamily:'Georgia,serif',color:'#4ECDD4',letterSpacing:'0.03em',backdropFilter:'blur(4px)',whiteSpace:'nowrap'}}>
                {label}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <div style={{borderTop:'1px solid #1E2D4A',borderBottom:'1px solid #1E2D4A',background:'rgba(13,21,37,0.6)',backdropFilter:'blur(8px)'}}>
        <div style={{maxWidth:1100,margin:'0 auto',padding:'28px 48px',display:'flex',justifyContent:'space-around',gap:32,flexWrap:'wrap'}}>
          {[
            {val:'12', sub:'пар в неделю'},
            {val:'4', sub:'направления'},
            {val:'∞', sub:'записи хранятся'},
            {val:'ВсОШ', sub:'до финального этапа'},
          ].map((s,i) => (
            <div key={i} style={{textAlign:'center'}}>
              <div style={{fontFamily:'Newsreader,serif',fontSize:36,fontWeight:600,color:'#D9A441',lineHeight:1,marginBottom:4}}>{s.val}</div>
              <div style={{fontSize:13,color:'#6A6860'}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ABOUT БОЙЦОВ ── */}
      <section style={{maxWidth:1100,margin:'0 auto',padding:'88px 48px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:80,alignItems:'center'}}>
        {/* Left — photo */}
        <div style={{position:'relative',display:'flex',justifyContent:'center'}}>
          {/* Glow rings behind */}
          <div style={{position:'absolute',width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(139,109,212,0.15),transparent 70%)',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
          <div style={{position:'absolute',width:240,height:240,borderRadius:'50%',border:'1px solid rgba(139,109,212,0.2)',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>
          {/* Avatar */}
          <div style={{width:220,height:220,borderRadius:'50%',overflow:'hidden',border:'2px solid #152035',boxShadow:'0 0 40px rgba(139,109,212,0.3)',position:'relative',zIndex:1,background:'#0D1525',flexShrink:0}}>
            <img src="boitsov-avatar.png" alt="Евгений Бойцов" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/>
          </div>
          {/* Floating badge */}
          <div style={{position:'absolute',bottom:'10%',right:'8%',background:'#0D1525',border:'1px solid #1E2D4A',borderRadius:10,padding:'8px 14px',zIndex:2}}>
            <div style={{fontSize:11,color:'#6A6860',marginBottom:2}}>Подготовил к</div>
            <div style={{fontSize:13,fontWeight:600,color:'#4ECDD4'}}>ВсОШ, IOAA, IODAA</div>
          </div>
        </div>

        {/* Right — text */}
        <div>
          <div style={{fontSize:11,fontWeight:600,color:'#8B6DD4',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:16}}>Преподаватель</div>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,color:'#F0EDE8',letterSpacing:'-0.015em',marginBottom:8,lineHeight:1.15}}>Евгений Бойцов</h2>
          <div style={{fontSize:14,color:'#6A6860',marginBottom:24}}>@astroboytsov · астроном, наставник, популяризатор</div>
          <p style={{fontSize:16,color:'#A8A5A0',lineHeight:1.7,marginBottom:20}}>
            Готовит олимпиадников с 2015 года. Прошёл путь от школьника до преподавателя сам — знает, где именно ломаются ученики, и как это починить.
          </p>
          <p style={{fontSize:16,color:'#A8A5A0',lineHeight:1.7,marginBottom:28}}>
            Ведёт занятия в планетарии, снимает разборы задач в своём формате — жёсткий, честный, без воды.
          </p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            {['Небесная механика','HR-диаграмма','Радиоастрономия','Двойные звёзды','Экзопланеты'].map((t,i) => (
              <span key={i} style={{padding:'4px 12px',borderRadius:9999,border:'1px solid #1E2D4A',fontSize:12,color:'#A8A5A0',background:'rgba(13,21,37,0.6)'}}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROGRAMME ── */}
      <section style={{background:'#0D1525',padding:'80px 48px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.3}}><StarField count={80}/></div>
        <div style={{maxWidth:1100,margin:'0 auto',position:'relative'}}>
          <div style={{marginBottom:48}}>
            <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,letterSpacing:'-0.015em',marginBottom:10}}>12 пар в неделю</h2>
            <p style={{fontSize:17,color:'#6A6860'}}>по четырём направлениям</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
            {programs.map((p,i) => (
              <div key={i} style={{background:'rgba(7,12,24,0.7)',borderRadius:14,padding:'28px 32px',border:'1px solid #1E2D4A',borderTop:`3px solid ${p.color}`,backdropFilter:'blur(4px)',transition:'all 200ms ease'}}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 32px ${p.color}22`;e.currentTarget.style.borderColor=p.color;}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor='#1E2D4A';}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                  <h3 style={{fontSize:16,fontWeight:600,color:'#F0EDE8',lineHeight:1.3,maxWidth:240}}>{p.title}</h3>
                  <span style={{padding:'3px 10px',borderRadius:9999,fontSize:11,fontWeight:500,background:`${p.color}18`,color:p.color,whiteSpace:'nowrap',marginLeft:12}}>{p.badge}</span>
                </div>
                <ul style={{listStyle:'none',padding:0,display:'flex',flexDirection:'column',gap:9}}>
                  {p.topics.map((tp,j) => (
                    <li key={j} style={{display:'flex',alignItems:'flex-start',gap:10,fontSize:14,color:'#6A6860',lineHeight:1.5}}>
                      <span style={{color:p.color,marginTop:3,flexShrink:0,fontSize:10}}>◆</span>{tp}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANETARIUM PHOTO BREAK ── */}
      <section style={{position:'relative',overflow:'hidden',height:360}}>
        <img src="uploads/IMG_5717.jpeg" alt="Занятия в планетарии" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 40%',filter:'brightness(0.45)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to right, rgba(7,12,24,0.8) 0%, transparent 40%, transparent 60%, rgba(7,12,24,0.8) 100%)' }}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,textAlign:'center',padding:'0 48px'}}>
          <p style={{fontFamily:'Newsreader,serif',fontSize:28,fontStyle:'italic',color:'#F0EDE8',maxWidth:640,lineHeight:1.45}}>
            «Апекс — не меню курсов. Это один путь с наставником от первых задач до финала.»
          </p>
          <span style={{fontSize:13,color:'rgba(240,237,232,0.5)'}}>— Евгений Бойцов</span>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{padding:'88px 48px'}}>
        <div style={{maxWidth:560,margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,letterSpacing:'-0.015em',marginBottom:48}}>Стоимость</h2>
          <div style={{background:'#0D1525',borderRadius:20,padding:'44px 52px',border:'1px solid #1E2D4A',position:'relative',overflow:'hidden'}}>
            {/* stars inside card */}
            <div style={{position:'absolute',inset:0,opacity:0.5}}><StarField count={50}/></div>
            <div style={{position:'relative'}}>
              <div style={{fontSize:13,color:'#6A6860',marginBottom:8}}>Всерос с Апексом</div>
              <div style={{fontFamily:'Newsreader,serif',fontSize:64,fontWeight:600,color:'#F0EDE8',letterSpacing:'-0.03em',lineHeight:1}}>12 500 ₽</div>
              <div style={{fontSize:14,color:'#6A6860',marginBottom:36}}>в месяц</div>
              <ul style={{listStyle:'none',padding:0,textAlign:'left',display:'flex',flexDirection:'column',gap:14,marginBottom:36}}>
                {[
                  '12 пар в неделю по 4 направлениям',
                  'Записи всех занятий без срока',
                  'Личный наставник и обратная связь',
                  'Корректировка трека по результатам',
                  'Тренажёр звёздного неба (Apex Skychart)',
                  'Прямые эфиры и Q&A с Бойцовым',
                ].map((item,i) => (
                  <li key={i} style={{display:'flex',alignItems:'center',gap:12,fontSize:15,color:'#A8A5A0'}}>
                    <span style={{width:20,height:20,borderRadius:'50%',background:'rgba(78,205,212,0.12)',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#4ECDD4',fontSize:12}}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={()=>navigate('login')} style={{width:'100%',height:54,borderRadius:12,border:'none',background:'#D9A441',color:'#0A0E1A',fontSize:17,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 150ms ease',boxShadow:'0 0 24px #D9A44144'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#F4B860';}}
                onMouseLeave={e=>{e.currentTarget.style.background='#D9A441';}}>
                Записаться
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{background:'#0D1525',padding:'80px 48px'}}>
        <div style={{maxWidth:720,margin:'0 auto'}}>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:40,fontWeight:600,letterSpacing:'-0.015em',marginBottom:48}}>Частые вопросы</h2>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {faqs.map((faq,i) => (
              <LandingFaq key={i} faq={faq} open={faqOpen[i]} toggle={()=>setFaqOpen(p=>({...p,[i]:!p[i]}))}/>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{padding:'80px 48px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.5}}><StarField count={120}/></div>
        <div style={{position:'relative',maxWidth:580,margin:'0 auto'}}>
          <div style={{width:80,height:80,borderRadius:'50%',background:'radial-gradient(circle,#F4E080,#D9A441)',boxShadow:'0 0 60px #D9A44188',margin:'0 auto 28px'}}/>
          <h2 style={{fontFamily:'Newsreader,serif',fontSize:44,fontWeight:600,letterSpacing:'-0.02em',marginBottom:16,lineHeight:1.15}}>
            Начни готовиться<br/>к следующей олимпиаде
          </h2>
          <p style={{fontSize:16,color:'#6A6860',marginBottom:32,lineHeight:1.6}}>Запись открыта. Доступ открывается сразу.</p>
          <button onClick={()=>navigate('login')} style={{height:54,padding:'0 36px',borderRadius:12,border:'none',background:'#D9A441',color:'#0A0E1A',fontSize:17,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 150ms ease',boxShadow:'0 0 32px #D9A44155'}}
            onMouseEnter={e=>{e.currentTarget.style.background='#F4B860';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#D9A441';}}>
            Записаться →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:'#040810',padding:'52px 48px 28px',borderTop:'1px solid #0D1525'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:48,marginBottom:48}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <ConstellationSVG width={22} height={22} color='#D9A441' starOpacity={0.9} lineOpacity={0.5}/>
                <span style={{fontFamily:'Newsreader,serif',fontSize:20,fontWeight:600,letterSpacing:'-0.02em'}}>apeks</span>
              </div>
              <p style={{fontSize:13,color:'#3A3830',lineHeight:1.6}}>Авторская онлайн-школа подготовки к олимпиадам по астрономии</p>
            </div>
            {[
              {title:'Навигация', links:['О курсе','Программа','Преподаватель','FAQ']},
              {title:'Контакты', links:['Telegram-канал','@astroboytsov']},
              {title:'Документы', links:['Договор оферты','Конфиденциальность']},
            ].map((col,i) => (
              <div key={i}>
                <div style={{fontSize:11,fontWeight:600,color:'#3A3830',marginBottom:14,letterSpacing:'0.08em',textTransform:'uppercase'}}>{col.title}</div>
                {col.links.map((l,j) => <div key={j} style={{fontSize:13,color:'#5A5850',marginBottom:8,cursor:'pointer',transition:'color 150ms'}}
                  onMouseEnter={e=>e.target.style.color='#A8A5A0'} onMouseLeave={e=>e.target.style.color='#5A5850'}>{l}</div>)}
              </div>
            ))}
          </div>
          <div style={{borderTop:'1px solid #0D1525',paddingTop:20,fontSize:12,color:'#3A3830',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
            <span>© 2026 Apeks. Авторская школа астрономии.</span>
            <span>apeks.space</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LandingFaq({ faq, open, toggle }) {
  return (
    <div style={{border:'1px solid #1E2D4A',borderRadius:10,overflow:'hidden',marginBottom:4,background: open ? '#0D1525' : 'transparent',transition:'background 150ms ease'}}>
      <div onClick={toggle} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',cursor:'pointer',userSelect:'none',gap:16}}>
        <span style={{fontSize:15,fontWeight:500,color:'#F0EDE8',lineHeight:1.4}}>{faq.q}</span>
        <span style={{fontSize:18,color:'#6A6860',transform: open?'rotate(45deg)':'none',transition:'transform 200ms ease',flexShrink:0,lineHeight:1}}>+</span>
      </div>
      {open && <div style={{padding:'0 20px 18px',fontSize:14,color:'#A8A5A0',lineHeight:1.65}}>{faq.a}</div>}
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginPage({ navigate }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const t = DARK_T;

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('dashboard'); }, 700);
  };

  const inputStyle = {width:'100%',height:48,padding:'0 16px',borderRadius:10,border:'1.5px solid #1E2D4A',background:'#0D1525',color:'#F0EDE8',fontSize:15,fontFamily:'Inter,sans-serif',outline:'none',transition:'border-color 200ms ease'};

  return (
    <div style={{minHeight:'100vh',display:'grid',gridTemplateColumns:'1fr 1fr',background:'#070C18',fontFamily:'Inter,sans-serif'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Form panel */}
      <div style={{display:'flex',flexDirection:'column',justifyContent:'center',padding:'64px 72px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,opacity:0.25}}><StarField count={80}/></div>
        <div style={{position:'relative'}}>
          <div onClick={()=>navigate('landing')} style={{display:'flex',alignItems:'center',gap:10,marginBottom:52,cursor:'pointer'}}>
            <ConstellationSVG width={24} height={24} color='#D9A441' starOpacity={0.95} lineOpacity={0.5} glow={true}/>
            <span style={{fontFamily:'Newsreader,serif',fontSize:20,fontWeight:600,color:'#F0EDE8',letterSpacing:'-0.02em'}}>apeks</span>
          </div>

          <h1 style={{fontFamily:'Newsreader,serif',fontSize:32,fontWeight:600,color:'#F0EDE8',marginBottom:8}}>Войти</h1>
          <p style={{fontSize:15,color:'#6A6860',marginBottom:36}}>Рады видеть снова</p>

          <div style={{marginBottom:18}}>
            <label style={{display:'block',fontSize:13,fontWeight:500,color:'#6A6860',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"
              style={inputStyle}
              onFocus={e=>e.target.style.borderColor='#4ECDD4'} onBlur={e=>e.target.style.borderColor='#1E2D4A'}/>
          </div>

          <div style={{marginBottom:8}}>
            <label style={{display:'block',fontSize:13,fontWeight:500,color:'#6A6860',marginBottom:6}}>Пароль</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              style={inputStyle} onKeyDown={e=>e.key==='Enter'&&handleLogin()}
              onFocus={e=>e.target.style.borderColor='#4ECDD4'} onBlur={e=>e.target.style.borderColor='#1E2D4A'}/>
          </div>

          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:28}}>
            <button style={{background:'none',border:'none',color:'#4ECDD4',fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Забыл пароль?</button>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{width:'100%',height:52,borderRadius:10,border:'none',background:loading?'#B8862A':'#D9A441',color:'#0A0E1A',fontSize:16,fontWeight:600,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 200ms ease',display:'flex',alignItems:'center',justifyContent:'center',gap:10,boxShadow:'0 0 20px #D9A44133'}}>
            {loading ? <span style={{width:18,height:18,border:'2px solid #0A0E1A',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.6s linear infinite'}}/> : 'Войти'}
          </button>

          <p style={{textAlign:'center',marginTop:24,fontSize:13,color:'#3A3830'}}>
            Нет аккаунта?{' '}
            <button style={{background:'none',border:'none',color:'#4ECDD4',fontSize:13,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Зарегистрироваться</button>
          </p>
        </div>
      </div>

      {/* Visual panel */}
      <div style={{background:'#0D1525',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:64,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0}}><StarField count={140}/><MilkyWayBand/></div>
        {[280,200,130].map((size,i) => (
          <div key={i} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:size,height:size,borderRadius:'50%',border:`1px solid rgba(78,205,212,${0.06+i*0.05})`,pointerEvents:'none'}}/>
        ))}
        {/* Sun */}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:36,height:36,borderRadius:'50%',background:'radial-gradient(circle,#F4E080,#D9A441)',boxShadow:'0 0 40px #D9A44188'}}/>
        <div style={{position:'relative',textAlign:'center',maxWidth:300}}>
          <div style={{fontFamily:'Newsreader,serif',fontSize:26,fontWeight:600,color:'#F0EDE8',lineHeight:1.3,marginBottom:12}}>
            Место, где астрономия становится работой
          </div>
          <div style={{fontSize:14,color:'#6A6860',lineHeight:1.6}}>Тёмная комната, звёздная карта, формулы и задачи.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingPage, LoginPage, LandingFaq });
