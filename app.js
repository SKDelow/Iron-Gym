/*
 * IRON GYM / FORGED — vanilla JavaScript
 * Interactive demo. Actual purchases, bookings, visitor capture and occupancy
 * require verified server integrations and correct facility information.
 * No frameworks, trackers, external SDKs or private API keys.
 */
(() => {
  'use strict';
  const cfg = window.IRON_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = amount => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:2,minimumFractionDigits:amount % 1 ? 2 : 0}).format(amount);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const icon = id => `<svg aria-hidden="true"><use href="#${id}"></use></svg>`;
  const announce = text => {const el = $('#status-announcer'); if(el) el.textContent = text;};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollToId = id => document.getElementById(id)?.scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const safeDate = date => new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const pad=n=>String(n).padStart(2,'0');

  /* 1. BRAND CONFIG, LOCATION + SEARCH METADATA */
  const locationLabel = `${cfg.city || 'CITY'}, ${cfg.state || 'STATE'}`;
  $$('.js-city').forEach(el => el.textContent = locationLabel);
  $('#footer-address').textContent = `${cfg.streetAddress || 'ADDRESS TO BE CONFIRMED'}\n${locationLabel}${cfg.postalCode ? ' '+cfg.postalCode : ''}`;
  $('#footer-address').style.whiteSpace = 'pre-line';
  $('#footer-hours').textContent = cfg.openingHoursDisplay || 'HOURS TO BE CONFIRMED';
  $('#copyright-year').textContent = new Date().getFullYear();
  if (cfg.streetAddress && cfg.city && cfg.state && cfg.city !== 'CITY') {
    const map = $('#map-container');
    const place = [cfg.streetAddress,cfg.city,cfg.state,cfg.postalCode].filter(Boolean).join(', ');
    const frame = document.createElement('iframe');
    frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
    frame.title = `Map to ${cfg.name} at ${place}`;
    frame.loading = 'lazy'; frame.referrerPolicy = 'no-referrer-when-downgrade';
    map.replaceChildren(frame); map.classList.add('has-map');
  }
  Object.entries(cfg.socialLinks || {}).forEach(([network,url]) => {
    if (!/^https:\/\//i.test(url || '')) return;
    const placeholder = $$('.footer-placeholder').find(el => el.textContent.startsWith(network.toUpperCase()));
    if(placeholder) {
      const a = document.createElement('a'); a.href = url; a.target = '_blank';a.rel='noopener noreferrer';
      a.textContent = network.toUpperCase() + ' ↗'; placeholder.replaceWith(a);
    }
  });
  // Only publish meaningful LocalBusiness structured data when the address is real.
  if (cfg.streetAddress && cfg.city !== 'CITY' && cfg.state !== 'STATE') {
    const schema = {'@context':'https://schema.org','@type':'ExerciseGym',name:cfg.name || 'IRON GYM',description:'Strength training, coached sessions and fitness programs.',address:{'@type':'PostalAddress',streetAddress:cfg.streetAddress,addressLocality:cfg.city,addressRegion:cfg.state,postalCode:cfg.postalCode || undefined,addressCountry:'US'}};
    if(/^https:\/\//.test(cfg.websiteUrl || '')) schema.url = cfg.websiteUrl;
    if(cfg.phone) schema.telephone = cfg.phone;
    const script = document.createElement('script');script.type='application/ld+json';script.textContent=JSON.stringify(schema);document.head.append(script);
    if(document.body.dataset.page==='index') {
      document.title = `${cfg.name} — Strength Training in ${cfg.city}, ${cfg.state}`;
      $('meta[name="description"]').content = `Explore strength training, coaching and memberships at ${cfg.name} in ${cfg.city}, ${cfg.state}. Find your program and plan a first visit.`;
    }
  }

  /* 2. MOBILE NAVIGATION */
  const menuButton = $('#menu-toggle'), menu = $('#mobile-nav');
  const closeMenu = () => {menu.hidden = true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');document.body.classList.remove('menu-open');};
  menuButton.addEventListener('click', () => {
    if(!menu.hidden) return closeMenu();
    menu.hidden = false; menuButton.setAttribute('aria-expanded','true'); menuButton.setAttribute('aria-label','Close navigation');
    document.body.classList.add('menu-open'); menu.querySelector('a')?.focus();
  });
  $$('a',menu).forEach(link => link.addEventListener('click',closeMenu));
  document.addEventListener('keydown', event => {if (event.key==='Escape' && !menu.hidden) {closeMenu();menuButton.focus();}});
  window.addEventListener('resize', () => {if(window.innerWidth>1020 && !menu.hidden) closeMenu();});

  /* 3. SCROLL REVEALS + ORIGINAL METRIC COUNTERS */
  const sections = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting) {entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target);}
    }),{threshold:.08,rootMargin:'0px 0px -20px 0px'});
    sections.forEach(el => revealObserver.observe(el));
  } else sections.forEach(el => el.classList.add('is-visible'));
  const formatCounter = (num,el) => el.dataset.format==='comma' ? Math.round(num).toLocaleString('en-US') : String(Math.round(num));
  function animateCounter(el) {
    if(el.dataset.counted) return; el.dataset.counted='yes';
    const target = Number(el.dataset.target) || 0;
    if(reduceMotion){el.textContent=formatCounter(target,el);return;}
    const start = performance.now();
    function tick(now){const t=Math.min((now-start)/1300,1),v=1-Math.pow(1-t,3);el.textContent=formatCounter(target*v,el);if(t<1)requestAnimationFrame(tick);}
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting){animateCounter(entry.target);counterObserver.unobserve(entry.target);}
    }),{threshold:.35});
    $$('.stat-number').forEach(el => counterObserver.observe(el));
  } else $$('.stat-number').forEach(animateCounter);


  const savedPathKey = 'iron-gym-forged-training-path-v1';
  function readSavedPath(){
    try {
      const saved=JSON.parse(localStorage.getItem(savedPathKey)||'null');
      return saved && ['open','performance','coaching'].includes(saved.plan) && ['Strength','Conditioning','Foundations','Small Group'].includes(saved.classType) ? saved : null;
    } catch {return null;}
  }
  function refreshSavedPath(){
    const saved=readSavedPath();
    const bar=$('#saved-path');
    if(!bar)return;
    bar.hidden=!saved;
    if(!saved)return;
    $('#saved-path-name').textContent=(cfg.pricing?.[saved.plan]?.name || saved.plan).toUpperCase();
    $('#saved-path-summary').textContent=`YOUR FOCUS / ${saved.classType.toUpperCase()} TRAINING`;
  }
  $('#forget-path')?.addEventListener('click',()=>{
    try{localStorage.removeItem(savedPathKey);}catch{}
    refreshSavedPath();announce('Saved training path cleared.');
  });
  refreshSavedPath();

  if ($('#quiz-question-area')) {
  /* 4. PROGRAM FINDER — FIVE ACTUAL QUESTIONS */
  const questions = [
    {title:'WHAT ARE YOU HERE TO BUILD?',subtitle:'Pick the answer that sounds most like you.',options:[
      {text:'Get noticeably stronger',code:'strength'},{text:'Improve conditioning and energy',code:'conditioning'},
      {text:'Build a routine I can keep',code:'consistency'},{text:'Learn the basics with confidence',code:'learn'}]},
    {title:'WHERE ARE YOU STARTING?',subtitle:'No wrong answers. We just want to meet you where you are.',options:[
      {text:'Brand new to training',code:'new'},{text:'Getting back into it',code:'return'},
      {text:'I train on and off',code:'some'},{text:'I already train consistently',code:'experienced'}]},
    {title:'HOW MANY DAYS FIT YOUR REAL LIFE?',subtitle:'Choose the schedule you can reasonably sustain.',options:[
      {text:'1–2 days per week',code:'few'},{text:'3–4 days per week',code:'moderate'},
      {text:'5 or more days',code:'many'},{text:'Not sure yet',code:'unsure'}]},
    {title:'HOW DO YOU LIKE TO TRAIN?',subtitle:'The right environment makes showing up easier.',options:[
      {text:'On my own, at my pace',code:'solo'},{text:'In a coached group',code:'group'},
      {text:'One-on-one with a coach',code:'private'},{text:'A little of everything',code:'mixed'}]},
    {title:'WHAT TENDS TO GET IN YOUR WAY?',subtitle:'We can design around the obstacle, not just the goal.',options:[
      {text:'I need a clear plan',code:'plan'},{text:'Finding enough time',code:'time'},
      {text:'Staying accountable',code:'accountability'},{text:'Not knowing the right technique',code:'technique'}]}
  ];
  const quiz = {index:0,answers:Array(questions.length).fill(null),complete:false};
  const questionArea = $('#quiz-question-area'), quizBack = $('#quiz-back'),quizNext=$('#quiz-next');
  const quizProgressText = $('#quiz-progress-text'),quizProgressFill=$('#quiz-progress-fill');
  let lastRecommendation = null;
  function recommend() {
    const [goal,experience,frequency,style,barrier] = quiz.answers;
    const score = {open:0,performance:0,coaching:0};
    if(style==='solo')score.open+=5;
    if(style==='group')score.performance+=6;
    if(style==='private')score.coaching+=7;
    if(style==='mixed'){score.performance+=2;score.coaching+=1;}
    if(experience==='new'){score.coaching+=3;score.performance+=1;}
    if(experience==='return'){score.performance+=2;score.coaching+=1;}
    if(experience==='experienced')score.open+=2;
    if(goal==='learn'){score.coaching+=3;}
    if(goal==='consistency'){score.performance+=2;}
    if(goal==='conditioning'){score.performance+=3;}
    if(goal==='strength'){score.open+=1;score.coaching+=1;}
    if(barrier==='technique'||barrier==='plan')score.coaching+=3;
    if(barrier==='accountability')score.performance+=2;
    if(barrier==='time')score.open+=2;
    if(frequency==='few')score.open+=1;
    if(frequency==='many')score.performance+=1;
    const plan = Object.entries(score).sort((a,b)=>b[1]-a[1])[0][0];
    const classType = goal==='conditioning'?'Conditioning':goal==='learn'?'Foundations':goal==='consistency'?'Small Group':'Strength';
    const reason = {
      open:'You want the space and flexibility to take ownership of your training. Start with a simple routine you can repeat.',
      performance:'A combination of solo access and structured classes can help you keep momentum without overcomplicating your week.',
      coaching:'You would benefit from more individual direction, thoughtful progressions and a coach who can help build confidence.'
    }[plan];
    return {plan,classType,reason};
  }
  function renderQuiz() {
    quizProgressFill.style.width = `${quiz.complete ? 100 : (quiz.index+1)/questions.length*100}%`;
    quizProgressText.textContent = quiz.complete?'YOUR TRAINING MATCH':`QUESTION ${String(quiz.index+1).padStart(2,'0')} / 05`;
    quizBack.hidden = quiz.index===0 && !quiz.complete;
    if(quiz.complete){
      const match=recommend();lastRecommendation=match;
      questionArea.innerHTML=`<div class="quiz-result"><div class="quiz-result-kicker">YOUR RECOMMENDED STARTING POINT</div><h3>${escapeHTML(cfg.pricing?.[match.plan]?.name || match.plan.toUpperCase())}<span class="copper-dot">.</span></h3><p>${escapeHTML(match.reason)}</p><div class="quiz-result-grid"><div><span>RECOMMENDED FORMAT</span><strong>${escapeHTML(match.classType)} TRAINING</strong></div><div><span>FIRST MOVE</span><strong>EXPLORE ${escapeHTML(match.plan.toUpperCase())}</strong></div></div><p class="quiz-result-notice">A starting recommendation, not a fitness assessment. Adjust the plan based on your needs and available programs.</p><div class="save-path-cta"><button type="button" id="save-path">SAVE MY STARTING POINT ↗</button><small id="save-path-note">Optional. Saves only this recommendation on this device—never your quiz answers.</small></div></div>`;
      quizNext.innerHTML=`SEE MEMBERSHIP OPTIONS ${icon('i-arrow')}`;
      quizNext.disabled=false;quizBack.textContent='↻ START AGAIN';
      $('#save-path').addEventListener('click',()=>{
        try {
          localStorage.setItem(savedPathKey, JSON.stringify({plan:match.plan,classType:match.classType}));
          refreshSavedPath();
          $('#save-path').textContent='SAVED ON THIS DEVICE ✓';
          $('#save-path').disabled=true;
          announce('Your training path has been saved on this device.');
        } catch {
          $('#save-path-note').textContent='Your browser blocked local storage. You can still compare memberships on the next page.';
        }
      });

      announce('Program Finder result: '+(cfg.pricing?.[match.plan]?.name || match.plan));return;
    }
    const q=questions[quiz.index],chosen=quiz.answers[quiz.index];
    questionArea.innerHTML=`<div class="quiz-question-content"><h3>${escapeHTML(q.title)}</h3><p>${escapeHTML(q.subtitle)}</p><div class="quiz-options">${q.options.map((o,i)=>`<button type="button" class="quiz-option" data-answer="${escapeHTML(o.code)}" aria-pressed="${chosen===o.code}"><span class="quiz-option-num">0${i+1}</span><span>${escapeHTML(o.text)}</span>${chosen===o.code?icon('i-check'):''}</button>`).join('')}</div></div>`;
    $$('.quiz-option',questionArea).forEach(btn=>btn.addEventListener('click',()=>{
      quiz.answers[quiz.index]=btn.dataset.answer;
      $$('.quiz-option',questionArea).forEach(b=>{b.setAttribute('aria-pressed',String(b===btn));b.querySelector('svg')?.remove();if(b===btn)b.insertAdjacentHTML('beforeend',icon('i-check'));});
      quizNext.disabled=false;
    }));
    quizNext.disabled=!chosen;quizNext.innerHTML=quiz.index===4?`SHOW MY MATCH ${icon('i-arrow')}`:`NEXT STEP ${icon('i-arrow')}`;
    quizBack.textContent='← BACK';
  }
  quizNext.addEventListener('click',()=>{
    if(quiz.complete){window.location.assign('memberships.html?plan='+encodeURIComponent((lastRecommendation||recommend()).plan));return;}
    if(!quiz.answers[quiz.index])return;
    if(quiz.index===4)quiz.complete=true;else quiz.index++;
    renderQuiz();
  });
  quizBack.addEventListener('click',()=>{
    if(quiz.complete){quiz.index=0;quiz.complete=false;quiz.answers.fill(null);lastRecommendation=null;}
    else quiz.index=Math.max(0,quiz.index-1);
    renderQuiz();
  });
  renderQuiz();

  }

  if ($('#day-tabs')) {
  /* 5. WEEKLY CLASS SCHEDULE / CALENDAR EVENT EXPORT */
  const schedule = [
    ['Monday','06:00','Strength Lab','Strength','Mara','High','60 min','Progressive full-body lifting with technical coaching.'],
    ['Monday','12:15','Midday Engine','Conditioning','Jalen','Moderate','45 min','Efficient conditioning with smart work-to-rest pacing.'],
    ['Monday','18:00','Lift Foundations','Foundations','Eli','Low','60 min','Set up, technique and confidence with free weights.'],
    ['Tuesday','06:30','Conditioning Circuit','Conditioning','Jalen','High','45 min','Coach-led intervals with scalable intensity.'],
    ['Tuesday','17:30','Small Group Strength','Small Group','Mara','Moderate','60 min','Foundational compound lifts in a supportive group.'],
    ['Tuesday','19:00','Recovery + Mobility','Mobility','Eli','Low','45 min','Move better and recover for your next session.'],
    ['Wednesday','06:00','Strength Lab','Strength','Mara','High','60 min','Lower-body training with thoughtful progression.'],
    ['Wednesday','12:15','Midday Engine','Conditioning','Jalen','Moderate','45 min','Conditioning for the middle of your workday.'],
    ['Wednesday','18:15','Lift Foundations','Foundations','Eli','Low','60 min','Build comfort with squats, hinges and presses.'],
    ['Thursday','06:30','Small Group Strength','Small Group','Mara','Moderate','60 min','A focused strength session built around your level.'],
    ['Thursday','17:30','Conditioning Circuit','Conditioning','Jalen','High','45 min','Intervals, sled work and aerobic endurance.'],
    ['Thursday','19:00','Recovery + Mobility','Mobility','Eli','Low','45 min','Joint range, breath work and controlled movement.'],
    ['Friday','06:00','Strength Lab','Strength','Mara','High','60 min','Finish the week with deliberate, hard work.'],
    ['Friday','12:15','Midday Engine','Conditioning','Jalen','Moderate','45 min','A full-body conditioning reset.'],
    ['Friday','17:30','Small Group Strength','Small Group','Mara','Moderate','60 min','Lift together, train to your ability.'],
    ['Saturday','08:00','Community Strength','Small Group','Mara','Moderate','60 min','A coached group session for every experience level.'],
    ['Saturday','09:30','Lift Foundations','Foundations','Eli','Low','60 min','Learning the lifts without the pressure.'],
    ['Saturday','11:00','Conditioning Circuit','Conditioning','Jalen','High','45 min','A quick, high-energy Saturday session.'],
    ['Sunday','09:00','Recovery + Mobility','Mobility','Eli','Low','45 min','Unwind and prepare for a new week.'],
    ['Sunday','10:30','Open Strength Workshop','Strength','Mara','Moderate','60 min','Practical technique and lifting fundamentals.']
  ].map(([day,time,title,type,coach,intensity,duration,description],id)=>({id,day,time,title,type,coach,intensity,duration,description}));
  const classIcons={'Strength':'i-strength','Conditioning':'i-conditioning','Foundations':'i-coach','Mobility':'i-mobility','Small Group':'i-smallgroup'};
  let currentDay='All',currentType='all',currentCoach='all',currentIntensity='all';
  const dayTabs=$('#day-tabs');
  ['All','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].forEach((day,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='day-tab';btn.textContent=i===0?'ALL WEEK':day.slice(0,3).toUpperCase();btn.setAttribute('aria-pressed',String(i===0));
    btn.addEventListener('click',()=>{currentDay=day;$$('.day-tab').forEach(b=>{b.classList.toggle('is-active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});renderClasses();});
    if(i===0)btn.classList.add('is-active');dayTabs.append(btn);
  });
  const unique = key=>[...new Set(schedule.map(item=>item[key]))].sort();
  [['#filter-type','type'],['#filter-coach','coach']].forEach(([selector,key])=>{
    unique(key).forEach(value=>{$(selector).add(new Option(value,value));});
  });
  $('#filter-type').addEventListener('change',e=>{currentType=e.target.value;renderClasses();});
  $('#filter-coach').addEventListener('change',e=>{currentCoach=e.target.value;renderClasses();});
  $('#filter-intensity').addEventListener('change',e=>{currentIntensity=e.target.value;renderClasses();});
  function resetFilters(){currentDay='All';currentType='all';currentCoach='all';currentIntensity='all';
    $('#filter-type').value='all';$('#filter-coach').value='all';$('#filter-intensity').value='all';
    $$('.day-tab').forEach((b,i)=>{b.classList.toggle('is-active',i===0);b.setAttribute('aria-pressed',String(i===0));});renderClasses();}
  $('#reset-filters').addEventListener('click',resetFilters);
  function renderClasses(){
    const filtered=schedule.filter(item=>(currentDay==='All'||item.day===currentDay)&&(currentType==='all'||item.type===currentType)&&(currentCoach==='all'||item.coach===currentCoach)&&(currentIntensity==='all'||item.intensity===currentIntensity));
    const count=$('#schedule-count');count.textContent=`${filtered.length} ${filtered.length===1?'SESSION':'SESSIONS'} FOUND`;
    const result=$('#class-results');
    if(!filtered.length){result.innerHTML='<div class="no-classes"><strong>NO MATCHES THIS TIME.</strong><p>Try a different day or training format.</p><button type="button" id="clear-empty">RESET FILTERS</button></div>';$('#clear-empty').addEventListener('click',resetFilters);return;}
    result.innerHTML=filtered.map(item=>{
      const [h,m]=item.time.split(':').map(Number);const hour=h%12||12,ampm=h>=12?'PM':'AM';
      return `<article class="class-row"><div class="class-time">${hour}:${String(m).padStart(2,'0')}<small>${ampm} • ${item.day.slice(0,3).toUpperCase()}</small></div><div class="class-name"><div class="class-name-icon">${icon(classIcons[item.type])}</div><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.type)} • ${escapeHTML(item.duration)}</small></div></div><div class="class-coach">COACH ${escapeHTML(item.coach.toUpperCase())}<small>DEMO CLASS</small></div><span class="class-level" data-level="${escapeHTML(item.intensity)}">${escapeHTML(item.intensity.toUpperCase())}</span><button class="class-more" type="button" aria-label="Details for ${escapeHTML(item.title)} on ${item.day}" data-class-id="${item.id}">${icon('i-diagonal')}</button></article>`;
    }).join('');
    $$('[data-class-id]',result).forEach(btn=>btn.addEventListener('click',()=>openClass(schedule[Number(btn.dataset.classId)])));
  }
  renderClasses();

  /* 6. ACCESSIBLE NATIVE SESSION DETAILS DIALOG / .ICS EXPORT */
  const dialog=$('#booking-dialog');
  function showDialog(){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');}
  function dateForNextClass(day,time){
    const now=new Date(),date=safeDate(now);const target=weekdays.indexOf(day);
    let delta=(target-now.getDay()+7)%7;
    const [h,m]=time.split(':').map(Number);date.setDate(date.getDate()+delta);date.setHours(h,m,0,0);
    if(date<=now)date.setDate(date.getDate()+7);
    return date;
  }
  function icsDate(date){return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;}
  function downloadCalendarEvent(item){
    const start=dateForNextClass(item.day,item.time),end=new Date(start.getTime()+parseInt(item.duration,10)*60000);
    const escapeICS=s=>String(s).replaceAll('\\','\\\\').replaceAll(',','\\,').replaceAll(';','\\;').replace(/\n/g,'\\n');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//IRON GYM DEMO//EN','BEGIN:VEVENT',`UID:iron-demo-${item.id}-${start.toISOString()}@irongym.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${icsDate(start)}`,`DTEND:${icsDate(end)}`,`SUMMARY:${escapeICS(item.title+' (sample class)')}`,`DESCRIPTION:${escapeICS(item.description+' Demo schedule only. Confirm with gym before visiting.')}`,'END:VEVENT','END:VCALENDAR'];
    const blob=new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`iron-gym-${item.day.toLowerCase()}-${item.id}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    announce('Sample calendar event downloaded. This is not a reservation.');
  }
  function openClass(item){
    $('#dialog-title').textContent=item.title.toUpperCase()+'.';
    $('#dialog-copy').textContent=item.description;
    const [h,m]=item.time.split(':').map(Number),time=`${h%12||12}:${pad(m)} ${h>=12?'PM':'AM'}`;
    const details=$('#dialog-details');details.innerHTML=`<div class="dialog-detail"><strong>${escapeHTML(item.day.toUpperCase())} / ${time}</strong><br>COACH ${escapeHTML(item.coach.toUpperCase())} · ${escapeHTML(item.duration)} · ${escapeHTML(item.intensity)} INTENSITY</div><button class="button button-dark" type="button" id="calendar-download" style="margin-top:16px;width:100%">ADD SAMPLE TO CALENDAR ↓</button>`;
    $('#calendar-download').addEventListener('click',()=>downloadCalendarEvent(item));
    $('#dialog-pass-link').textContent='PLAN A FIRST VISIT ↗';
    showDialog();
  }
  $('#dialog-pass-link').addEventListener('click',()=>{dialog.close?.();});

  }

  if ($('#plan-cards')) {
  /* 7. MEMBERSHIPS / PRICING TOGGLE / TRUE COST PER VISIT */
  const plans = {
    open:{key:'open',name:cfg.pricing?.open?.name||'OPEN GYM',price:Number(cfg.pricing?.open?.monthly)||49,subtitle:cfg.pricing?.open?.description||'Independent training, your way.',features:['Training floor access','Full strength equipment','Open gym hours','Digital training resources'],cta:'CHOOSE OPEN GYM'},
    performance:{key:'performance',name:cfg.pricing?.performance?.name||'PERFORMANCE',price:Number(cfg.pricing?.performance?.monthly)||89,subtitle:cfg.pricing?.performance?.description||'Train solo. Go further together.',features:['Everything in Open Gym','Unlimited group classes','Class booking access','Progress check-in guidance'],cta:'CHOOSE PERFORMANCE',popular:true},
    coaching:{key:'coaching',name:cfg.pricing?.coaching?.name||'COACHING+',price:Number(cfg.pricing?.coaching?.monthly)||149,subtitle:cfg.pricing?.coaching?.description||'More guidance. Better direction.',features:['Everything in Performance','Monthly 1:1 coaching session','Personalized training direction','Priority program adjustments'],cta:'EXPLORE COACHING+'}
  };
  let billing='monthly';const annualMonths=Number(cfg.annualMonthsCharged)||10;
  function renderPlans(){
    $('#billing-monthly').classList.toggle('is-active',billing==='monthly');$('#billing-monthly').setAttribute('aria-pressed',String(billing==='monthly'));
    $('#billing-annual').classList.toggle('is-active',billing==='annual');$('#billing-annual').setAttribute('aria-pressed',String(billing==='annual'));
    $('#plan-cards').innerHTML=Object.values(plans).map(plan=>{
      const annual=plan.price*annualMonths,savings=plan.price*12-annual,equivalent=annual/12;
      return `<article class="plan-card ${plan.popular?'is-popular':''} ${readSavedPath()?.plan===plan.key?'is-saved':''}"><div class="plan-top"><div class="plan-name"><h3>${escapeHTML(plan.name)}</h3>${readSavedPath()?.plan===plan.key?'<span class="saved-match-tag">YOUR SAVED MATCH</span>':plan.popular?'<span>MOST CHOSEN / DEMO</span>':''}</div><p class="plan-subtitle">${escapeHTML(plan.subtitle)}</p><div class="plan-price"><b>${billing==='monthly'?money(plan.price).replace('.00',''):money(equivalent)}</b><span>/MO</span></div><p class="plan-billing">${billing==='annual'?`BILLED ${money(annual)} / YEAR · SAVE ${money(savings)} VS MONTHLY`:'MONTH-TO-MONTH DEMO RATE · NO CONTRACT TERMS PROVIDED'}</p></div><div class="plan-features"><strong>WHAT'S INCLUDED</strong><ul>${plan.features.map(f=>`<li>${icon('i-check')}<span>${escapeHTML(f)}</span></li>`).join('')}</ul></div><div class="plan-bottom"><button type="button" class="button button-copper" data-choose-plan="${plan.key}">${plan.cta} ${icon('i-arrow')}</button><small>Sample pricing and benefits, not an offer.</small></div></article>`;
    }).join('');
    $$('[data-choose-plan]').forEach(btn=>btn.addEventListener('click',()=>selectPlan(btn.dataset.choosePlan)));
    renderValue();
  }
  function selectPlan(key){
    const goal=key==='coaching'?'Coaching and guidance':key==='performance'?'Conditioning and classes':'Strength training';
    announce(plans[key].name+' selected. Continue on the visit page.');
    window.location.assign('visit.html?plan='+encodeURIComponent(key)+'&goal='+encodeURIComponent(goal)+'#free-pass');
  }
  $('#billing-monthly').addEventListener('click',()=>{billing='monthly';renderPlans();});
  $('#billing-annual').addEventListener('click',()=>{billing='annual';renderPlans();});
  Object.values(plans).forEach(plan=>$('#value-plan').add(new Option(plan.name,plan.key)));
  const queryPlan=new URLSearchParams(location.search).get('plan');
  $('#value-plan').value=plans[queryPlan] ? queryPlan : (readSavedPath()?.plan || 'performance');
  function renderValue(){
    const visits=Number($('#visits-slider').value),key=$('#value-plan').value||'performance',plan=plans[key];
    const yearly=billing==='annual'?plan.price*annualMonths:plan.price*12;
    const perVisit=yearly/(52*visits);
    $('#visits-label').textContent=`${visits} ${visits===1?'DAY':'DAYS'} / WEEK`;
    $('#cost-per-visit').textContent=money(perVisit);
    $('#calc-footnote').textContent=`Assumes ${52*visits} visits/year at ${billing} demo rates. No initiation fees included.`;
    const pct=(visits-1)/6*100;
    $('#visits-slider').style.background=`linear-gradient(90deg,var(--copper) 0 ${pct}%,#b9c2b5 ${pct}% 100%)`;
  }
  $('#visits-slider').addEventListener('input',renderValue);
  $('#value-plan').addEventListener('change',renderValue);
  renderPlans();

  }

  if ($('#capacity-ring')) {
  /* 8. GYM CAPACITY / PLUGGABLE API ADAPTER + HOURLY FORECAST */
  const hourlyProfile=[9,7,6,6,12,24,38,45,52,44,36,40,53,46,42,49,62,76,88,77,58,43,28,17];
  function localGymHour(){try{return Number(new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:cfg.timezone||'America/Boise'}).format(new Date()))%24;}catch{return new Date().getHours();}}
  function capacityForHour(hour){return hourlyProfile[(hour+24)%24];}
  function levelLabel(percent){return percent<40?'ROOM TO MOVE':percent<70?'STEADY FLOW':'BUSIER HOURS';}
  function fillCapacity(percent,real=false,people=null){
    const value=Math.max(0,Math.min(100,Math.round(percent)));
    const color=value<40?'#779786':value<70?'#c76a42':'#d04b3b';
    $('#capacity-ring').style.background=`conic-gradient(${color} 0 ${value}%,#394140 ${value}% 100%)`;
    $('#capacity-percent').textContent=value+'%';$('#capacity-ring').setAttribute('aria-label',`${real?'Reported':'Simulated'} occupancy ${value} percent`);
    $('#capacity-level').textContent=levelLabel(value);
    const max=Number(cfg.capacities?.total)||100;
    $('#capacity-people').textContent=`${people ?? Math.round(max*value/100)} / ${max} modeled spots in use`;
    $('#capacity-timestamp').textContent=`UPDATED ${new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}`;
    $('.simulation-pulse').innerHTML=`<i></i> ${real?'API-CONNECTED DATA':'DEMO DATA'}`;
    $('.capacity-card-top>span:first-child').textContent=real?'FLOOR ACTIVITY / CONNECTED':'FLOOR ACTIVITY / SIMULATION';
    $('.capacity-note').textContent=real?'Occupancy provided by your configured endpoint. Confirm data accuracy with the sensor operator.':'Not real-time. Values are illustrative until a verified occupancy API is connected.';
  }
  function renderForecast(){
    const hour=localGymHour();
    $('#forecast-bars').innerHTML=Array.from({length:7},(_,i)=>{
      const h=(hour+i)%24,capacity=capacityForHour(h),level=capacity<40?'low':capacity<70?'mid':'high';
      const label=i===0?'NOW':(h%12||12)+(h>=12?'PM':'AM');
      return `<div class="forecast-bar" data-level="${level}" title="${label}: simulated ${capacity}%"><span class="bar" style="height:${Math.max(6,capacity)}%"></span><small>${label}</small></div>`;
    }).join('');
  }
  async function updateCapacity(){
    const endpoint=cfg.integrations?.occupancyEndpoint;
    if(endpoint){
      try{
        const response=await fetch(endpoint,{headers:{Accept:'application/json'},credentials:'same-origin'});
        if(!response.ok)throw Error('Occupancy service response '+response.status);
        const payload=await response.json();
        if(typeof payload.percent!=='number'||!Number.isFinite(payload.percent))throw Error('Invalid occupancy data');
        fillCapacity(payload.percent,true,Number.isFinite(payload.people)?payload.people:null);renderForecast();return;
      }catch(error){console.warn('Occupancy API unavailable, falling back to labeled simulation',error);}
    }
    const baseline=capacityForHour(localGymHour());
    const jitter=Math.round((Math.random()-.5)*9);
    fillCapacity(Math.min(96,Math.max(4,baseline+jitter)));renderForecast();
  }
  $('#capacity-refresh').addEventListener('click',updateCapacity);
  updateCapacity();setInterval(updateCapacity,60000);

  }

  if ($('#coach-grid')) {
  /* 9. COACHES / EXPANDABLE PROFILES / SESSION PREVIEW */
  const dialog=$('#booking-dialog');
  const showDialog=()=>{if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');};
  const coaches=[
    {id:'mara',name:'MARA REYES',role:'STRENGTH & TECHNIQUE',tag:'COACH 01',img:'assets/coach-1.svg',intro:'Clear progressions, excellent form and the confidence to add weight when you are ready.',specialties:['Barbell lifting','Beginner strength','Movement quality']},
    {id:'jalen',name:'JALEN PRICE',role:'CONDITIONING & PERFORMANCE',tag:'COACH 02',img:'assets/coach-2.svg',intro:'Conditioning built around smart effort. Train hard, recover well, and keep showing up.',specialties:['Conditioning','Work capacity','Athletic performance']},
    {id:'eli',name:'ELI MORGAN',role:'FOUNDATIONS & MOBILITY',tag:'COACH 03',img:'assets/coach-3.svg',intro:'Simple explanations, useful feedback, and a patient approach to learning the movements.',specialties:['Training fundamentals','Mobility','Recovery habits']}
  ];
  $('#coach-grid').innerHTML=coaches.map(c=>`<article class="coach-card"><div class="coach-portrait"><img src="${c.img}" alt="Stylized placeholder portrait for ${escapeHTML(c.name)}; not an actual gym coach" width="650" height="780" loading="lazy"><div class="coach-tag">ILLUSTRATIVE PROFILE / ${c.tag}</div></div><div class="coach-main"><h3>${c.name}<span class="copper-dot">.</span></h3><p>${c.role}</p><div class="coach-actions"><button type="button" data-coach-expand="${c.id}" aria-expanded="false" aria-controls="coach-details-${c.id}">MEET ${c.name.split(' ')[0]}</button><button type="button" data-coach-book="${c.id}">BOOK A SESSION ↗</button></div></div><div class="coach-details" id="coach-details-${c.id}" hidden><p>${c.intro}</p><span>SPECIALTIES</span><ul>${c.specialties.map(v=>`<li>${v}</li>`).join('')}</ul></div></article>`).join('');
  $$('[data-coach-expand]').forEach(btn=>btn.addEventListener('click',()=>{
    const details=$('#coach-details-'+btn.dataset.coachExpand),open=details.hidden;details.hidden=!open;btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'CLOSE DETAILS':'MEET '+coaches.find(c=>c.id===btn.dataset.coachExpand).name.split(' ')[0];
  }));
  $$('[data-coach-book]').forEach(btn=>btn.addEventListener('click',()=>{
    const coach=coaches.find(c=>c.id===btn.dataset.coachBook);$('#dialog-title').textContent='TRAIN WITH '+coach.name.split(' ')[0]+'.';
    $('#dialog-copy').textContent='This is a demonstration coach profile. The booking button shows the intended flow until real staff scheduling is connected.';
    $('#dialog-details').innerHTML=`<div class="dialog-detail"><strong>${coach.role}</strong><br>${coach.specialties.join(' • ')}</div>`;
    $('#dialog-pass-link').textContent='START WITH A DAY PASS ↗';
    $('#dialog-pass-link').href='visit.html?goal='+encodeURIComponent('Coaching and guidance')+'#free-pass';showDialog();
  }));


  $('#dialog-pass-link')?.addEventListener('click',()=>dialog.close?.());
  }

  if ($('#compare-range')) {
  /* 10. COMPARISON SLIDER (NATIVE RANGE, NO PLUGIN) */
  const compare=$('#compare-range'),stage=$('#compare-stage');
  function showComparison(){
    const v=Number(compare.value);
    stage.style.setProperty('--reveal',v+'%');
    // Keep the comparison artwork at the full underlying stage width.
    // This avoids mismatched image scale when the reveal percentage changes.
    $('.compare-after img').style.width=stage.getBoundingClientRect().width+'px';
  }
  const positionFromPointer=event=>{
    const bounds=stage.getBoundingClientRect();
    compare.value=String(Math.round(Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100))));
    showComparison();
  };
  let comparisonDragging=false;
  stage.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    comparisonDragging=true;stage.setPointerCapture(event.pointerId);positionFromPointer(event);
  });
  stage.addEventListener('pointermove',event=>{if(comparisonDragging)positionFromPointer(event);});
  stage.addEventListener('pointerup',()=>{comparisonDragging=false;});
  stage.addEventListener('pointercancel',()=>{comparisonDragging=false;});
  compare.addEventListener('input',showComparison);
  window.addEventListener('resize',showComparison);
  showComparison();

  }

  if ($('#amenity-grid')) {
  /* 11. AMENITIES WITH ORIGINAL SVG ICONS */
  const amenities=[
    ['i-plates','FREE WEIGHTS','Serious lifting equipment and room to use it.'],
    ['i-bars','RACKS & PLATFORMS','Train the big lifts with a stable setup.'],
    ['i-coach','EXPERT COACHING','A real person to help you move forward.'],
    ['i-pulse','CONDITIONING ZONE','Purposeful work beyond the barbell.'],
    ['i-locker','LOCKER SPACE','Keep your day simple while you train.'],
    ['i-shower','SHOWERS','Move on with your day after the work.'],
    ['i-recovery','RECOVERY SPACE','Leave room for the next good session.'],
    ['i-parking','EASY ACCESS','Less friction between life and the gym.']
  ];
  $('#amenity-grid').innerHTML=amenities.map(([svg,title,copy])=>`<article class="amenity">${icon(svg).replace('<svg ','<svg class="amenity-icon" ')}<div><h3>${title}</h3><p>${copy}</p></div></article>`).join('');

  }

  if ($('#visit-steps')) {
  /* 12. FIRST-VISIT GUIDED TOUR / PERSONALIZED SEQUENCE */
  const guides={
    new:[['ARRIVE AND GET ORIENTED','Meet the front-desk team, see the floor, and ask where everything lives.'],['TAKE A QUICK WALKTHROUGH','Learn the layout and find the equipment you will actually need.'],['START WITH THE BASICS','Practice a few comfortable movements. No need to max out on day one.'],['LEAVE WITH A SIMPLE NEXT STEP','Know what to do on your second visit, not just your first.']],
    experienced:[['CHECK OUT THE TRAINING FLOOR','Get a feel for rack availability, stations and equipment layout.'],['SEE THE EQUIPMENT UP CLOSE','Evaluate what matters for your training style.'],['TRY YOUR NORMAL SESSION','See whether the space works during a realistic workout.'],['PICK THE ACCESS YOU NEED','Compare open gym, group training and coaching options.']],
    class:[['CHECK IN BEFORE THE SESSION','Plan to arrive early enough for a calm introduction.'],['MEET YOUR COACH','Share your experience level or anything you want help adapting.'],['FOLLOW THE SESSION','You can scale loads, pace and movements to your level.'],["ASK WHAT'S NEXT",'Leave knowing which class format fits your schedule.']]
  };
  function renderVisit(type){
    $$('.visit-option').forEach(button=>{const selected=button.dataset.visit===type;button.classList.toggle('is-active',selected);button.setAttribute('aria-pressed',String(selected));});
    $('#visit-steps').innerHTML=guides[type].map(([heading,copy])=>`<li><div><strong>${heading}</strong><p>${copy}</p></div></li>`).join('');
  }
  $$('.visit-option').forEach(button=>button.addEventListener('click',()=>renderVisit(button.dataset.visit)));
  renderVisit('new');

  }

  if ($('#faq-list')) {
  /* 13. FAQ — NATIVE KEYBOARD-ACCESSIBLE DETAILS */
  const faqs=[
    ['Do I need experience to join?','No experience is required for the intended Iron Gym concept. The program finder and first-visit guide are designed to make getting started less intimidating. Verify actual coaching availability before publishing.'],
    ['Can I train without taking classes?','Yes, in this proposed membership structure, Open Gym provides independent training access. Confirm final operating policies and staffed hours with the gym.'],
    ['Are the prices displayed here final?','No. All memberships, discounts and inclusions shown are example data for this website prototype. The gym owner must provide real fees, commitments and cancellation terms.'],
    ['Is the gym capacity display live?','Not yet. The meter intentionally uses simulated demand by time of day. It is labeled as a demonstration and can be connected to a secure occupancy data source later.'],
    ['Does the free day pass form actually send a request?','Not in this preview. The form validates information and demonstrates a successful interface state, but no information is transmitted or stored. A secure pass-claim endpoint is required before launch.'],
    ['Can I reserve a class or coaching session here?','You can explore sessions, download an example calendar event and preview coach profiles. Actual booking requires the gym’s calendar or scheduling provider.'],
    ['How do I find the gym and see its opening hours?','The real street address, city, hours and map will be shown once the facility information is provided. This prototype deliberately avoids inventing a location.']
  ];
  $('#faq-list').innerHTML=faqs.map(([q,a])=>`<details><summary>${escapeHTML(q)}</summary><p>${escapeHTML(a)}</p></details>`).join('');

  }

  if ($('#pass-form')) {
  // The fixed phone CTA is hidden when the actual pass form is in view,
  // avoiding two competing buttons and preventing form controls being covered.
  if ('IntersectionObserver' in window) {
    const passVisibility = new IntersectionObserver(entries => {
      document.body.classList.toggle('pass-active',entries[0].isIntersecting);
    },{threshold:.03});
    passVisibility.observe($('#free-pass'));
  }

  /* 14. FREE DAY PASS — FIELD VALIDATION / HONEST FRONTEND SUCCESS STATE */
  const passForm=$('#pass-form'),success=$('#pass-success'),dateField=$('#pass-day');
  const requestedGoal=new URLSearchParams(location.search).get('goal');
  if(requestedGoal && [...$('#pass-goal').options].some(x=>x.value===requestedGoal))$('#pass-goal').value=requestedGoal;
  const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
  dateField.min=todayISO();
  const passLive=Boolean(cfg.liveFormsEnabled && /^https:\/\//.test(cfg.privacyPolicyUrl || '') && cfg.integrations?.freePassEndpoint);
  if(passLive){
    $('.form-demo-notice').textContent='REQUEST A VISIT — SUBJECT TO GYM CONFIRMATION';
    const policy=$('.consent-row>span');
    policy.innerHTML='I agree to the <a href="'+escapeHTML(cfg.privacyPolicyUrl)+'" target="_blank" rel="noopener noreferrer" style="color:#945038;text-decoration:underline">privacy policy</a> and consent to my details being sent to the gym to arrange a first visit. <span class="required-marker">*</span>';
    $('.form-submit').innerHTML=`REQUEST MY PASS ${icon('i-arrow')}`;
    $('.form-footnote').textContent='Your information will be sent securely to the connected gym provider for follow-up.';
  }
  function setFieldError(id,message){
    const el=$('#pass-'+id),error=$('#error-'+id);if(error)error.textContent=message;
    if(el) {if(message)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');}
  }
  ['name','email','day'].forEach(id=>$('#pass-'+id).addEventListener('input',()=>setFieldError(id,'')));
  $('#pass-consent').addEventListener('change',()=>$('#error-consent').textContent='');
  passForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const name=$('#pass-name').value.trim(),email=$('#pass-email').value.trim(),day=dateField.value,consent=$('#pass-consent').checked;
    let invalid=false;
    const flag=(key,msg)=>{setFieldError(key,msg);if(msg)invalid=true;};
    flag('name',name.length<2?'Please enter your name (at least 2 characters).':'');
    flag('email',!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)?'Enter a valid email address.':'');
    const parsedDay=day?new Date(day+'T12:00:00'):null;
    flag('day',!parsedDay || Number.isNaN(parsedDay.getTime()) || day<todayISO()?'Choose today or a future date.':'');
    $('#error-consent').textContent=consent?'':'Please confirm you understand this is a preview.';
    if(!consent)invalid=true;
    if(invalid){const firstInvalid=passForm.querySelector('[aria-invalid="true"]') || (!consent ? $('#pass-consent') : null);firstInvalid?.focus();announce('Please correct the marked fields.');return;}
    const endpoint=cfg.integrations?.freePassEndpoint;
    if(passLive){
      // This optional integration intentionally requires explicit live endpoint configuration.
      // Treat server response as the source of truth, not mere client-side validity.
      const submit=$('.form-submit');submit.disabled=true;submit.textContent='SENDING REQUEST…';
      try {
        const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,goal:$('#pass-goal').value,preferredDay:day})});
        if(!response.ok)throw Error('Server rejected pass request');
        passForm.hidden=true;success.hidden=false;
        $('#pass-success-detail').textContent=`Thank you, ${name.split(' ')[0]}. Your request for ${parsedDay.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} has been submitted to the connected provider.`;
        $('.success-caution').textContent='Your request was submitted to the connected provider; confirm the actual pass and visit details in their response.';
        success.scrollIntoView({block:'nearest',behavior:reduceMotion?'instant':'smooth'});announce('Pass request submitted to connected provider.');
      } catch(error) {
        console.error('Pass request failed',error);alert('We could not submit this request. Please try again or contact the gym directly.');
      } finally {submit.disabled=false;submit.innerHTML=`REQUEST MY PASS ${icon('i-arrow')}`;}
      return;
    }
    passForm.hidden=true;success.hidden=false;
    $('#pass-success-detail').textContent=`Your sample pass is set up for ${name.split(' ')[0]} on ${parsedDay.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}.`;
    $('.success-caution').textContent='Preview only. No reservation was made, no email was sent, and your information was not stored.';
    success.scrollIntoView({block:'nearest',behavior:reduceMotion?'instant':'smooth'});
    announce('Pass form preview completed. Nothing was submitted or saved.');
  });
  $('#pass-again').addEventListener('click',()=>{passForm.reset();$$('.field-error').forEach(e=>e.textContent='');$$('[aria-invalid]',passForm).forEach(e=>e.removeAttribute('aria-invalid'));passForm.hidden=false;success.hidden=true;dateField.min=todayISO();$('#pass-name').focus();});
  }

})();