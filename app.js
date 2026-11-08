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
  /* Show only verified contact and social information. Never fill the footer
     with fictional addresses, empty map frames, or links to nowhere. */
  const footerExtra = $('#footer-extra');
  const footerLocation = $('#footer-location');
  const footerSocial = $('#footer-social');
  const knownAddress = !!(cfg.streetAddress && cfg.city && cfg.state &&
    cfg.city !== 'CITY' && cfg.state !== 'STATE');
  const knownHours = !!(cfg.openingHoursDisplay &&
    cfg.openingHoursDisplay !== 'HOURS TO BE CONFIRMED');
  const locationLine = [cfg.streetAddress, cfg.city, cfg.state, cfg.postalCode]
    .filter(Boolean).join(', ');
  if (knownAddress || knownHours) {
    footerLocation.hidden = false;
    if (knownAddress) {
      $('#footer-address').textContent = locationLine;
      const map = $('#map-container');
      const frame = document.createElement('iframe');
      frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(locationLine)}&output=embed`;
      frame.title = `Map to ${cfg.name || 'Iron Gym'}`;
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      map.replaceChildren(frame);
      map.hidden = false;
    } else $('#footer-address').hidden = true;
    if (knownHours) $('#footer-hours').textContent = cfg.openingHoursDisplay;
    else $('#footer-hours').hidden = true;
  }
  Object.entries(cfg.socialLinks || {}).forEach(([network,url]) => {
    if (!/^https:\/\//i.test(url || '')) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `${network.toUpperCase()} ↗`;
    $('#footer-social-links').appendChild(link);
    footerSocial.hidden = false;
  });
  footerExtra.hidden = footerLocation.hidden && footerSocial.hidden;
  $('#copyright-year').textContent = new Date().getFullYear();
  // Only publish meaningful LocalBusiness structured data when the address is real.
  if (cfg.streetAddress && cfg.city !== 'CITY' && cfg.state !== 'STATE') {
    const schema = {'@context':'https://schema.org','@type':'ExerciseGym',name:cfg.name || 'IRON GYM',description:'Strength training, classes and coaching in a focused gym environment.',address:{'@type':'PostalAddress',streetAddress:cfg.streetAddress,addressLocality:cfg.city,addressRegion:cfg.state,postalCode:cfg.postalCode || undefined,addressCountry:'US'}};
    if(/^https:\/\//.test(cfg.websiteUrl || '')) schema.url = cfg.websiteUrl;
    if(cfg.phone) schema.telephone = cfg.phone;
    const script = document.createElement('script');script.type='application/ld+json';script.textContent=JSON.stringify(schema);document.head.append(script);
    if(document.body.dataset.page==='index') {
      document.title = `${cfg.name} — Strength Training in ${cfg.city}, ${cfg.state}`;
      $('meta[name="description"]').content = `Explore strength training, coaching and memberships at ${cfg.name} in ${cfg.city}, ${cfg.state}. Explore the photo tour and plan a first visit.`;
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


  /* Training quiz retired in favor of direct pages for the tour, pricing and first visit. */

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
      return `<article class="class-row"><div class="class-time">${hour}:${String(m).padStart(2,'0')}<small>${ampm} • ${item.day.slice(0,3).toUpperCase()}</small></div><div class="class-name"><div class="class-name-icon">${icon(classIcons[item.type])}</div><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.type)} • ${escapeHTML(item.duration)}</small></div></div><div class="class-coach">COACH ${escapeHTML(item.coach.toUpperCase())}<small>CLASS PREVIEW</small></div><span class="class-level" data-level="${escapeHTML(item.intensity)}">${escapeHTML(item.intensity.toUpperCase())}</span><button class="class-more" type="button" aria-label="Details for ${escapeHTML(item.title)} on ${item.day}" data-class-id="${item.id}">${icon('i-diagonal')}</button></article>`;
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
      return `<article class="plan-card ${plan.popular?'is-popular':''} "><div class="plan-top"><div class="plan-name"><h3>${escapeHTML(plan.name)}</h3>${plan.popular?'<span>MOST CHOSEN</span>':''}</div><p class="plan-subtitle">${escapeHTML(plan.subtitle)}</p><div class="plan-price"><b>${billing==='monthly'?money(plan.price).replace('.00',''):money(equivalent)}</b><span>/MO</span></div><p class="plan-billing">${billing==='annual'?`BILLED ${money(annual)} / YEAR · SAVE ${money(savings)} VS MONTHLY`:'MONTH-TO-MONTH · TERMS TO BE CONFIRMED'}</p></div><div class="plan-features"><strong>WHAT'S INCLUDED</strong><ul>${plan.features.map(f=>`<li>${icon('i-check')}<span>${escapeHTML(f)}</span></li>`).join('')}</ul></div><div class="plan-bottom"><button type="button" class="button button-copper" data-choose-plan="${plan.key}">${plan.cta} ${icon('i-arrow')}</button><small>Rates and inclusions must be confirmed before joining.</small></div></article>`;
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
  $('#value-plan').value=plans[queryPlan] ? queryPlan : 'performance';
  function renderValue(){
    const visits=Number($('#visits-slider').value),key=$('#value-plan').value||'performance',plan=plans[key];
    const yearly=billing==='annual'?plan.price*annualMonths:plan.price*12;
    const perVisit=yearly/(52*visits);
    $('#visits-label').textContent=`${visits} ${visits===1?'DAY':'DAYS'} / WEEK`;
    $('#cost-per-visit').textContent=money(perVisit);
    $('#calc-footnote').textContent=`Assumes ${52*visits} visits/year at ${billing} listed rates. Initiation fees are not included.`;
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
    $('.simulation-pulse').innerHTML=`<i></i> ${real?'API-CONNECTED DATA':'ESTIMATE'}`;
    $('.capacity-card-top>span:first-child').textContent=real?'FLOOR ACTIVITY / CONNECTED':'FLOOR ACTIVITY / SIMULATION';
    $('.capacity-note').textContent=real?'Occupancy provided by your configured endpoint. Confirm data accuracy with the sensor operator.':'Not real-time. Values are illustrative until a verified occupancy API is connected.';
  }
  function renderForecast(){
    const hour=localGymHour();
    $('#forecast-bars').innerHTML=Array.from({length:7},(_,i)=>{
      const h=(hour+i)%24,capacity=capacityForHour(h),level=capacity<40?'low':capacity<70?'mid':'high';
      const label=i===0?'NOW':(h%12||12)+(h>=12?'PM':'AM');
      return `<button type="button" class="forecast-bar" data-level="${level}" data-hour="${h}" aria-pressed="${i===0}" aria-label="${label}: ${capacity} percent, simulated forecast"><span class="bar" style="height:${Math.max(6,capacity)}%"></span><small>${label}</small></button>`;
    }).join('');
    selectForecastHour(hour);
  }
  function selectForecastHour(hour){
    const occupancy=capacityForHour(hour), level=levelLabel(occupancy);
    const label=hour===localGymHour()?'CURRENT HOUR':`${String(hour%12||12)} ${hour>=12?'PM':'AM'}`;
    $$('.forecast-bar').forEach(b=>{
      const selected=Number(b.dataset.hour)===hour;
      b.classList.toggle('is-selected',selected);
      b.setAttribute('aria-pressed',String(selected));
    });
    const insight=$('#forecast-insight');
    if(insight){insight.querySelector('span').textContent=label+' / SIMULATED';
      insight.querySelector('strong').textContent=occupancy+'% modeled occupancy · '+level;
      insight.querySelector('small').textContent='Illustrative demand profile, not a live crowd prediction.';}
  }
  $('#forecast-bars').addEventListener('click',event=>{
    const button=event.target.closest('.forecast-bar');
    if(button)selectForecastHour(Number(button.dataset.hour));
  });
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
    {id:'mara',name:'MARA REYES',role:'STRENGTH & TECHNIQUE',tag:'COACH 01',img:'assets/coach-mara.webp',intro:'Clear progressions, excellent form and the confidence to add weight when you are ready.',specialties:['Barbell lifting','Beginner strength','Movement quality']},
    {id:'jalen',name:'JALEN PRICE',role:'CONDITIONING & PERFORMANCE',tag:'COACH 02',img:'assets/coach-jalen.webp',intro:'Conditioning built around smart effort. Train hard, recover well, and keep showing up.',specialties:['Conditioning','Work capacity','Athletic performance']},
    {id:'eli',name:'ELI MORGAN',role:'FOUNDATIONS & MOBILITY',tag:'COACH 03',img:'assets/coach-eli.webp',intro:'Simple explanations, useful feedback, and a patient approach to learning the movements.',specialties:['Training fundamentals','Mobility','Recovery habits']}
  ];
  $('#coach-grid').innerHTML=coaches.map(c=>`<article class="coach-card"><div class="coach-portrait"><img src="${c.img}" alt="Coach portrait wearing an Iron Fitness polo shirt" width="650" height="780" loading="lazy"><div class="coach-tag">${c.tag}</div></div><div class="coach-main"><h3>${c.name}<span class="copper-dot">.</span></h3><p>${c.role}</p><div class="coach-actions"><button type="button" data-coach-expand="${c.id}" aria-expanded="false" aria-controls="coach-details-${c.id}">MEET ${c.name.split(' ')[0]}</button><button type="button" data-coach-book="${c.id}">BOOK A SESSION ↗</button></div></div><div class="coach-details" id="coach-details-${c.id}" hidden><p>${c.intro}</p><span>SPECIALTIES</span><ul>${c.specialties.map(v=>`<li>${v}</li>`).join('')}</ul></div></article>`).join('');
  $$('.coach-portrait img').forEach(image=>image.addEventListener('error',()=>{image.onerror=null;image.src='assets/coach-1.svg';}));
  $$('[data-coach-expand]').forEach(btn=>btn.addEventListener('click',()=>{
    const details=$('#coach-details-'+btn.dataset.coachExpand),open=details.hidden;details.hidden=!open;btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'CLOSE DETAILS':'MEET '+coaches.find(c=>c.id===btn.dataset.coachExpand).name.split(' ')[0];
  }));
  $$('[data-coach-book]').forEach(btn=>btn.addEventListener('click',()=>{
    const coach=coaches.find(c=>c.id===btn.dataset.coachBook);$('#dialog-title').textContent='TRAIN WITH '+coach.name.split(' ')[0]+'.';
    $('#dialog-copy').textContent='Online coach bookings are not available yet. Explore the options and use the visit page to get started.';
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
    ['Do I need experience to join?','No experience is required to get started. Start with a photo tour or the first-visit guide to find your footing.'],
    ['Can I train without taking classes?','Yes, in this proposed membership structure, Open Gym provides independent training access. Confirm final operating policies and staffed hours with the gym.'],
    ['Are the prices displayed here final?','No. All memberships, discounts and inclusions shown are example data for this website prototype. The gym owner must provide real fees, commitments and cancellation terms.'],
    ['Is the gym capacity display live?','Not yet. The meter intentionally uses simulated demand by time of day. The chart is an estimate, not a real-time count.'],
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

  /* 15. GYM PHOTO TOUR — ACCESSIBLE, SWIPEABLE GALLERY */
  if ($('#photo-tour')) {
    const zones = [
      {
        label: 'THE STRENGTH FLOOR',
        name: 'THE STRENGTH FLOOR',
        image: 'assets/iron-floor.webp',
        alt: 'Strength gym interior with barbells and lifting platforms',
        copy: 'A place for focused work: sturdy equipment, room to move and no distractions from the next set.',
        features: ['BARBELLS', 'PLATFORMS', 'TRAINING SPACE']
      },
      {
        label: 'RACK ROW',
        name: 'THE RACK ROW',
        image: 'assets/iron-racks.webp',
        alt: 'AI-generated industrial gym with an empty squat rack, barbells and weight plates',
        copy: 'Where the big lifts happen. From a comfortable first squat to your next strong personal record.',
        features: ['SQUAT RACKS', 'PLATES', 'STRENGTH WORK']
      },
      {
        label: 'FREE WEIGHTS',
        name: 'THE FREE-WEIGHT AREA',
        image: 'assets/iron-weights.webp',
        alt: 'AI-generated gym with rows of dumbbells and training benches',
        copy: 'Grab a pair, find your bench and get on with it. The essentials should always be close at hand.',
        features: ['DUMBBELLS', 'BENCHES', 'ACCESSORY WORK']
      },
      {
        label: 'CONDITIONING',
        name: 'THE CONDITIONING ZONE',
        image: 'assets/iron-conditioning.webp',
        alt: 'Fitness studio with cardio equipment and training machines',
        copy: 'Strength is the foundation, not the finish line. Make room to build a stronger engine, too.',
        features: ['CARDIO', 'ENDURANCE', 'MOVEMENT']
      },
      {
        label: 'THE DETAILS',
        name: 'THE DETAILS MATTER',
        image: 'assets/iron-dumbbells.webp',
        alt: 'AI-generated premium gym with free weights and strength equipment',
        copy: 'The feel of the grip. The weight in your hand. A space that lets the work speak for itself.',
        features: ['FOCUS', 'EQUIPMENT', 'THE WORK']
      }
    ];
    const photo=$('#tour-photo'), position=$('#tour-position'), stageNumber=$('#tour-stage-index');
    const steps=$$('.tour-step');
    const stage=$('#tour-swipe-area');
    const progress=$$('#tour-progress i');
    let current=0;
    let swipeOrigin=null;
    const preload=zones.map(z => { const img=new Image();img.src=z.image;return img; });
    const renderTour=(idx,shouldFocus=false)=>{
      current=(idx+zones.length)%zones.length;
      const z=zones[current],number=pad(current+1);
      photo.src=z.image;photo.alt=z.alt;
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && photo.animate) {
        photo.getAnimations().forEach(animation=>animation.cancel());
        photo.animate([{opacity:.35,transform:'scale(1.025)'},{opacity:1,transform:'scale(1)'}],{duration:260,easing:'ease-out'});
      }
      $('#tour-photo-label').textContent=z.label;
      $('#tour-photo-counter').textContent=`${number} / ${pad(zones.length)}`;
      stageNumber.textContent=number;position.textContent=number;
      $('#tour-name').innerHTML=escapeHTML(z.name)+'<span>.</span>';
      $('#tour-copy').textContent=z.copy;
      $('#tour-features').replaceChildren(...z.features.map(value=>{const el=document.createElement('span');el.textContent=value;return el;}));
      steps.forEach((button,i)=>{const active=i===current;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
      progress.forEach((marker,i)=>marker.classList.toggle('is-active',i===current));
      if(shouldFocus)steps[current].focus({preventScroll:true});
      announce(`${z.name}. Photo ${current+1} of ${zones.length}. ${z.copy}`);
    };
    $('#tour-prev').addEventListener('click',()=>renderTour(current-1));
    $('#tour-next').addEventListener('click',()=>renderTour(current+1));
    steps.forEach(button=>button.addEventListener('click',()=>renderTour(Number(button.dataset.tourZone))));
    // Horizontal swipes change photos. Vertical gestures remain native page scrolling.
    stage.addEventListener('pointerdown', event=>{
      if(event.pointerType!=='touch' && event.pointerType!=='pen')return;
      swipeOrigin={id:event.pointerId,x:event.clientX,y:event.clientY};
      try { stage.setPointerCapture(event.pointerId); } catch(_) {}
    },{passive:true});
    stage.addEventListener('pointerup', event=>{
      if(!swipeOrigin || swipeOrigin.id!==event.pointerId)return;
      const dx=event.clientX-swipeOrigin.x,dy=event.clientY-swipeOrigin.y;
      swipeOrigin=null;
      if(Math.abs(dx)>=45 && Math.abs(dx)>Math.abs(dy)*1.2) renderTour(current+(dx<0?1:-1));
    },{passive:true});
    stage.addEventListener('pointercancel',()=>{swipeOrigin=null;},{passive:true});
    $('#photo-tour').addEventListener('keydown',event=>{
      if(event.target.matches('.tour-step')) {
        if(event.key==='ArrowRight' || event.key==='ArrowDown') {event.preventDefault();renderTour(Number(event.target.dataset.tourZone)+1,true);}
        if(event.key==='ArrowLeft' || event.key==='ArrowUp') {event.preventDefault();renderTour(Number(event.target.dataset.tourZone)-1,true);}
      }
    });
    // If a remote image cannot load, use a locally shipped gym illustration instead of a broken image icon.
    photo.addEventListener('error',()=>{if(!photo.src.endsWith('/assets/training-room.svg'))photo.src='assets/training-room.svg';});
    renderTour(0);
  }


  /* 16. FORGED MOTION SYSTEM — small, intentional, progressive enhancement.
     Fast page transitions, hover-only magnetism and image reveals. No library,
     blocking loader, audio, scroll hijacking or reliance on animation to navigate. */
  if (!reduceMotion) {
    document.body.classList.add('cinema-enter');

    // A short exit treatment only for real same-origin HTML page navigation.
    // Anchors, menu toggles, downloads, external links and browser back stay native.
    let navigating = false;
    document.addEventListener('click', (event) => {
      if (navigating || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link || link.hasAttribute('download') || link.hasAttribute('data-no-transition') ||
          (link.target && link.target !== '_self')) return;
      const next = new URL(link.href, location.href);
      if (next.origin !== location.origin || !['http:', 'https:'].includes(next.protocol)) return;
      if (!(/\/$/.test(next.pathname) || /\.html$/i.test(next.pathname))) return;
      if (next.pathname === location.pathname && next.search === location.search) return;
      event.preventDefault();
      navigating = true;
      document.body.classList.add('cinema-leaving');
      window.setTimeout(() => { location.assign(next.href); }, 185);
    });
    // Browser back-forward cache must never restore a faded-out page.
    window.addEventListener('pageshow', () => {
      navigating = false;
      document.body.classList.remove('cinema-leaving');
    });

    // Use the actual pointer position for subtle optical attraction. Never on touch.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.button, .header-pass, .footer-visit > a').forEach(target => {
        target.classList.add('cinema-magnetic');
        target.addEventListener('pointermove', event => {
          const box = target.getBoundingClientRect();
          const dx = (event.clientX - (box.left + box.width / 2)) / box.width;
          const dy = (event.clientY - (box.top + box.height / 2)) / box.height;
          target.style.setProperty('--magnet-x', `${Math.round(dx * 11)}px`);
          target.style.setProperty('--magnet-y', `${Math.round(dy * 10)}px`);
        }, {passive:true});
        const release = () => {
          target.style.removeProperty('--magnet-x');
          target.style.removeProperty('--magnet-y');
        };
        target.addEventListener('pointerleave', release, {passive:true});
        target.addEventListener('blur', release);
      });

      // Copper highlight follows the cursor over featured photographic cards.
      $$('.home-portal-card').forEach(card => {
        card.classList.add('cinema-spotlight');
        card.addEventListener('pointermove', event => {
          const box=card.getBoundingClientRect();
          card.style.setProperty('--spot-x', `${((event.clientX-box.left)/box.width*100).toFixed(1)}%`);
          card.style.setProperty('--spot-y', `${((event.clientY-box.top)/box.height*100).toFixed(1)}%`);
        }, {passive:true});
      });
    }

    // Photographs lift into place exactly once as they enter the viewport.
    const frames = $$('.home-portal-card, .photo-card, .gallery-shot, .standard-visual, .coach-card');
    frames.forEach(frame => frame.classList.add('cinema-photo'));
    if ('IntersectionObserver' in window) {
      const photoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cinema-photo-visible');
            photoObserver.unobserve(entry.target);
          }
        });
      }, {threshold:.13,rootMargin:'0px 0px -22px 0px'});
      frames.forEach(frame => photoObserver.observe(frame));
    } else frames.forEach(frame => frame.classList.add('cinema-photo-visible'));
  }

})();