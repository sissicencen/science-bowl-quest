(() => {
  'use strict';
  const Q = window.SBQ_QUESTIONS || [];
  const CATEGORIES = [
    {name:'Life Science',icon:'🧬',style:'cat-life',desc:'Cells, plants & animals'},
    {name:'Earth & Space',icon:'🪐',style:'cat-earth',desc:'Planets, weather & rocks'},
    {name:'Physical Science',icon:'🔬',style:'cat-physical',desc:'Motion, matter & light'},
    {name:'Energy',icon:'⚡',style:'cat-energy',desc:'Circuits, heat & forces'},
    {name:'Math & Logic',icon:'🧩',style:'cat-math',desc:'Patterns & reasoning'}
  ];
  const $app = document.querySelector('#app');
  let view = 'home';
  let session = null;
  let timerId = null;
  let previousQuestion = null;
  let previousCategory = null;
  const emptyProgress = () => ({attempted:0,correct:0,sessions:0,topics:{},history:[]});
  let progress;
  try { progress = {...emptyProgress(),...JSON.parse(localStorage.getItem('sbq-progress-v1') || '{}')}; }
  catch (_) { progress = emptyProgress(); }
  const h = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function save() { try {localStorage.setItem('sbq-progress-v1',JSON.stringify(progress));} catch (_) {} }
  function shuffle(items) { const arr = [...items]; for (let i=arr.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
  function clearTimer() { if(timerId) clearInterval(timerId);timerId=null; }
  function formatTime(seconds) {return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
  function updateNav() {document.querySelectorAll('.nav-button').forEach(button => button.classList.toggle('active',button.dataset.view===view));}
  function navigate(to) {clearTimer();session=null;view=to;updateNav();render();window.scrollTo(0,0);}
  function render() {
    if (view==='home') renderHome();
    else if(view==='quiz') renderQuiz();
    else if(view==='results') renderResults();
    else if(view==='progress') renderProgress();
    else renderAbout();
  }
  function renderHome() {
    $app.innerHTML = `
      <section class="home-hero">
        <div><div class="eyebrow">LEARN · THINK · DISCOVER</div>
          <h1>Big questions.<br>Bright minds.</h1>
          <p>Explore science, practice smart, and get ready to shine at your next science competition.</p>
          <button class="primary-btn" data-action="challenge">⚡ Start Quick Challenge &nbsp;→</button>
          <div class="mini-stats"><span><b>${Q.length}</b> original questions</span><span>✓ Learn at your own pace</span></div>
        </div>
        <div class="hero-deco" aria-hidden="true"><span class="hero-star star-a">✦</span><div class="hero-orbit"><span class="hero-planet">🪐</span></div><span class="hero-star star-b">✦</span></div>
      </section>
      <div class="section-heading"><div><h2>Choose your science adventure</h2><p>Pick a topic and explore 5 practice questions.</p></div><span class="tag">5 topics</span></div>
      <section class="categories" aria-label="Science topics">${CATEGORIES.map(cat => `<button class="cat-card ${cat.style}" data-category="${h(cat.name)}"><div class="cat-icon">${cat.icon}</div><h3>${h(cat.name)}</h3><p>${h(cat.desc)}</p></button>`).join('')}</section>
      <div class="section-heading"><div><h2>More ways to learn</h2><p>Build a habit of discovery.</p></div></div>
      <section class="feature-row"><div class="feature"><div><h3>⚡ Quick Challenge</h3><p>10 mixed questions, 5 minutes.<br>How many can you solve?</p><button class="ghost-btn" data-action="challenge" style="margin-top:16px">Play Challenge →</button></div><div class="emoji" aria-hidden="true">⏱️</div></div><div class="feature"><div><h3>📈 My Progress</h3><p>See how much you've learned and<br>which topics need more practice.</p><button class="ghost-btn" data-action="progress" style="margin-top:16px">View Progress →</button></div><div class="emoji" aria-hidden="true">🏆</div></div></section>`;
  }
  function startQuiz(category,challenge=false) {
    clearTimer();
    const bank=category==='All topics'?Q:Q.filter(q=>q.category===category);
    const questionCount=challenge?Math.min(10,bank.length):Math.min(5,bank.length);
    session={category,challenge,questions:shuffle(bank).slice(0,questionCount),index:0,answers:[],selected:null,remaining:challenge?300:null,ended:false};
    view='quiz';updateNav();renderQuiz();window.scrollTo(0,0);
    if(challenge) {
      timerId=setInterval(()=>{
        if(!session || session.ended) return;
        session.remaining=Math.max(0,session.remaining-1);
        const node=document.getElementById('timer');
        if(node) {node.textContent='⏱ '+formatTime(session.remaining);node.classList.toggle('urgent',session.remaining<30);}
        if(session.remaining===0) {clearTimer();finish();}
      },1000);
    }
  }
  function renderQuiz() {
    const question=session?.questions[session.index];
    if(!question){navigate('home');return;}
    const selected=session.selected;
    const isAnswered=selected!==null;
    const correctCount=session.answers.filter(a=>a.correct).length;
    $app.innerHTML=`<div class="quiz-layout">
      <section class="quiz-main"><button class="back-btn" data-action="quit">← Back to home</button>
        <div class="quiz-header"><span class="quiz-index">QUESTION ${session.index+1} OF ${session.questions.length}</span>${session.challenge?`<span class="timer ${session.remaining<30?'urgent':''}" id="timer">⏱ ${formatTime(session.remaining)}</span>`:`<span class="pill">Practice Mode</span>`}</div>
        <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${session.questions.length}" aria-valuenow="${session.index+1}" aria-label="Question progress"><div class="progress-fill" style="width:${((session.index+1)/session.questions.length)*100}%"></div></div>
        <div class="question-topic">${h(question.category)} · ${h(question.level)}</div>
        <h1 class="question-text">${h(question.q)}</h1>
        <div class="answers" role="group" aria-label="Answer options">${question.choices.map((choice,index)=>{
          const state=isAnswered?(index===question.answer?' correct':index===selected?' incorrect':''):'';
          return `<button class="answer${state}" data-answer="${index}" ${isAnswered?'disabled':''}><span class="answer-letter">${'ABCD'[index]}</span><span>${h(choice)}</span></button>`;
        }).join('')}</div>
        ${isAnswered?`<section class="feedback ${selected===question.answer?'':'wrong'}" aria-live="polite"><h3>${selected===question.answer?'✓ You got it!':'💡 Keep learning!'}</h3><p>${h(question.explanation)}</p></section>`:''}
        <div class="quiz-actions">${isAnswered?`<button class="secondary-btn" data-action="next">${session.index+1===session.questions.length?'See results':'Next question →'}</button>`:`<span class="small-note">Tip: press 1–4 to choose an answer</span>`}</div>
      </section>
      <aside class="quiz-sidebar"><div class="aside-heading">Your quest</div><div><div class="aside-number">${session.index+1}<span class="muted"> / ${session.questions.length}</span></div><div class="aside-subtext">Current question</div></div><div class="aside-row"><span>Correct answers</span><b>${correctCount}</b></div><div class="aside-row"><span>Topic</span><b>${h(session.category)}</b></div><div class="aside-row"><span>Mode</span><b>${session.challenge?'Timed':'Practice'}</b></div><div class="aside-note">🌱 Learning grows one question at a time. Read every explanation, even when you get it right!</div></aside>
    </div>`;
  }
  function answer(index) {
    if(!session || session.selected!==null || !Number.isInteger(index) || index<0 || index>3) return;
    const q=session.questions[session.index];
    session.selected=index;
    session.answers.push({question:q,choice:index,correct:index===q.answer});
    renderQuiz();
  }
  function next() {
    if(!session || session.selected===null)return;
    if(session.index+1===session.questions.length){finish();return;}
    session.index++;session.selected=null;renderQuiz();
  }
  function finish() {
    if(!session || session.ended)return;
    session.ended=true;clearTimer();
    for(const a of session.answers){
      progress.attempted++;if(a.correct)progress.correct++;
      if(!progress.topics[a.question.category])progress.topics[a.question.category]={attempted:0,correct:0};
      progress.topics[a.question.category].attempted++;
      if(a.correct)progress.topics[a.question.category].correct++;
    }
    progress.sessions++;
    progress.history.unshift({date:new Date().toISOString(),mode:session.challenge?'Quick Challenge':session.category,score:session.answers.filter(a=>a.correct).length,total:session.answers.length});
    progress.history=progress.history.slice(0,20);save();view='results';updateNav();renderResults();window.scrollTo(0,0);
  }
  function renderResults() {
    if(!session)return navigate('home');
    const correct=session.answers.filter(a=>a.correct).length;
    const done=session.answers.length;
    const pct=done?Math.round(correct/done*100):0;
    const misses=session.answers.filter(a=>!a.correct);
    $app.innerHTML=`<section class="panel-page center surface" style="padding:37px 25px"><div class="eyebrow" style="color:#475fba">QUEST COMPLETE</div><div class="result-hero">${pct>=80?'🏆':pct>=50?'🌟':'🌱'}</div><h1>${pct>=80?'Excellent exploring!':pct>=50?'Nice work, scientist!':'Every question teaches you!'}</h1><div class="result-score">${correct} <span>/ ${session.questions.length} correct</span></div><p class="result-sub">${pct}% accuracy · ${session.challenge?'Quick Challenge':'Topic Practice'}${session.challenge?' · '+formatTime(300-session.remaining)+' used':''}</p>
      <div class="result-actions"><button class="secondary-btn" data-action="again">Try again</button><button class="ghost-btn" data-action="home">Choose topic</button></div>
      ${misses.length?`<div class="review-list"><h2 style="font-size:18px">Review and learn</h2>${misses.map(a=>`<div class="review"><h4>${h(a.question.q)}</h4><p><b>Answer:</b> ${h(a.question.choices[a.question.answer])}<br>${h(a.question.explanation)}</p></div>`).join('')}</div>`:`<p>Perfect! Explore another science topic next. ✨</p>`}
    </section>`;
  }
  function renderProgress() {
    const accuracy=progress.attempted?Math.round(100*progress.correct/progress.attempted):0;
    $app.innerHTML=`<section class="panel-page"><h1>My learning journey 📈</h1><p class="intro">Every correct answer is a discovery. Your progress is saved only on this device.</p>
      <div class="stats-grid"><div class="stat-card"><span>Questions answered</span><b>${progress.attempted}</b><span>Keep exploring!</span></div><div class="stat-card"><span>Correct answers</span><b>${progress.correct}</b><span>${accuracy}% lifetime accuracy</span></div><div class="stat-card"><span>Quests completed</span><b>${progress.sessions}</b><span>Practice builds confidence</span></div></div>
      <div class="topic-progress"><h2>Accuracy by topic</h2>${CATEGORIES.map(cat=>{const stat=progress.topics[cat.name]||{attempted:0,correct:0};const pct=stat.attempted?Math.round(100*stat.correct/stat.attempted):0;return `<div class="topic-bar"><span>${cat.icon} ${h(cat.name)}</span><div class="track"><div class="track-fill" style="width:${pct}%"></div></div><b>${stat.attempted?`${pct}% · ${stat.attempted} Q`:'Not started'}</b></div>`;}).join('')}</div>
      <div class="topic-progress"><h2>Recent quests</h2>${progress.history.length?progress.history.slice(0,8).map(entry=>`<div class="aside-row"><span>${h(entry.mode)} · ${new Date(entry.date).toLocaleDateString()}</span><b>${entry.score}/${entry.total}</b></div>`).join(''):`<div class="empty-state">No quests yet. Choose a topic to begin your science adventure!</div>`}</div>
      <p class="small-note">No accounts, analytics, advertisements, or cloud synchronization. Clearing browser storage may erase your progress.</p><button class="danger-btn" data-action="reset">Reset local progress</button>
    </section>`;
  }
  function renderAbout() {
    $app.innerHTML=`<section class="panel-page"><h1>About Science Bowl Quest ✨</h1><p class="intro">A free learning app for curious kids, families, and classrooms.</p><div class="surface about-card"><h2>How to play</h2><p>Choose one of five science topics for a five-question practice set, or start a five-minute challenge with ten random questions. Every question has an explanation because understanding matters more than guessing.</p><h2>Privacy first</h2><p>No account, microphone, camera, location, payments, analytics, or advertisements are required. Practice history stays locally on this device and can be cleared at any time.</p><h2>Questions and affiliation</h2><p>All ${Q.length} questions in this prototype are original educational questions. This independent app is not affiliated with, sponsored by, or endorsed by the U.S. Department of Energy or National Science Bowl®.</p><p>For official competition rules and practice resources, visit <a href="https://science.osti.gov/wdts/nsb" target="_blank" rel="noopener noreferrer">the National Science Bowl website</a>.</p><h2>Privacy policy</h2><p>Read our <a href="./privacy.html">Privacy Policy</a> to learn how local quiz progress is stored. The publisher should provide a support contact in the Microsoft Store listing before release.</p></div></section>`;
  }
  document.addEventListener('click', event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.id==='home-link'){navigate('home');return;}
    const destination=target.dataset.view;
    if(destination){navigate(destination);return;}
    const category=target.dataset.category;
    if(category){startQuiz(category);return;}
    const ans=target.dataset.answer;
    if(ans!==undefined){answer(Number(ans));return;}
    switch(target.dataset.action){
      case 'challenge': startQuiz('All topics',true);break;
      case 'home':case 'quit': navigate('home');break;
      case 'progress':navigate('progress');break;
      case 'next':next();break;
      case 'again':startQuiz(session?.category||'All topics',session?.challenge||false);break;
      case 'reset':if(window.confirm('Erase all locally saved learning progress on this device?')){progress=emptyProgress();save();renderProgress();}break;
    }
  });
  document.addEventListener('keydown', event=>{
    if(view!=='quiz'||!session||session.selected!==null||event.altKey||event.ctrlKey||event.metaKey)return;
    if(/^[1-4]$/.test(event.key)) answer(Number(event.key)-1);
  });
  if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
  render();
})();
