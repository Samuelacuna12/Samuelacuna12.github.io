/* INVICTO OPS v51.5 · moderniza Inicio sin alterar la fuente canónica */
(function(){
  const VERSION='51.5';
  function installStyles(){
    if(document.getElementById('modernHomeV515Styles')) return;
    const s=document.createElement('style');
    s.id='modernHomeV515Styles';
    s.textContent=`
      #view-home{padding-bottom:38px}
      #view-home .home512-hero{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:flex-end;gap:28px;min-height:190px;margin:0 0 18px;padding:30px 34px;border-radius:30px;background:linear-gradient(118deg,#0b0d16 0%,#111726 54%,#0e1a22 100%);box-shadow:0 22px 54px rgba(9,16,29,.16);color:#fff;isolation:isolate}
      #view-home .home512-hero:before{content:"";position:absolute;right:-70px;bottom:-130px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(25,226,190,.62) 0%,rgba(12,181,182,.28) 34%,rgba(25,226,190,0) 72%);filter:blur(3px);z-index:-1}
      #view-home .home512-hero:after{content:"";position:absolute;left:42%;top:-170px;width:420px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(41,98,255,.2),rgba(41,98,255,0) 70%);z-index:-1}
      #view-home .home512-hero .eyebrow{color:rgba(255,255,255,.55);font-size:11px;letter-spacing:.19em;font-weight:900;text-transform:uppercase}
      #view-home .home512-hero h1{margin:10px 0 8px;font-size:clamp(36px,4.2vw,58px);line-height:.98;letter-spacing:-.045em;color:#fff;font-weight:850}
      #view-home .home512-hero p{margin:0;max-width:790px;color:#b8c1cf;font-size:16px;line-height:1.45}
      #view-home .home512-hero p b{color:#fff}
      #view-home .home512-rate{position:relative;min-width:235px;padding:18px 20px;border:1px solid rgba(255,255,255,.15);border-radius:22px;background:linear-gradient(145deg,rgba(255,255,255,.10),rgba(26,207,180,.13));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 18px 40px rgba(0,0,0,.12);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
      #view-home .home512-rate small{color:#aeb8c8;font-size:10px;letter-spacing:.12em;font-weight:900}
      #view-home .home512-rate b{display:block;margin:5px 0 4px;color:#fff;font-size:42px;line-height:1;font-weight:900;letter-spacing:-.04em}
      #view-home .home512-rate span{color:#e5edf4;font-size:12px}

      #view-home .goal513,#view-home .goal-modern-v515{border:1px solid #e6eaf0!important;border-radius:22px!important;background:rgba(255,255,255,.92)!important;box-shadow:0 14px 34px rgba(16,24,40,.06)!important;overflow:hidden}
      #view-home .goal513-track{height:14px!important;background:#e8effb!important;box-shadow:inset 0 1px 2px rgba(14,42,84,.08)!important}
      #view-home .goal513-fill,#view-home .goal-fill-v515{background:linear-gradient(90deg,#0e55e8 0%,#1f75ff 52%,#5ca9ff 100%)!important;box-shadow:0 0 20px rgba(31,117,255,.34)!important}
      #view-home .goal-modern-v515 .panel-head{padding:20px 22px 15px!important}
      #view-home .goal-modern-v515 .panel-body{padding:0 22px 20px!important}
      #view-home .goal-modern-v515 .goal-progress-v515{height:14px!important;background:#e8effb!important;border-radius:999px!important;overflow:hidden!important;box-shadow:inset 0 1px 2px rgba(14,42,84,.08)!important}
      #view-home .goal-modern-v515 .mini-grid{gap:10px!important}
      #view-home .goal-modern-v515 .mini{border:1px solid #e8ebf0!important;background:#fbfcfe!important;border-radius:16px!important;padding:14px 15px!important}

      #view-home .home512-section{margin-top:18px}
      #view-home .home512-title{margin-bottom:12px}
      #view-home .home512-title h2{font-size:26px;letter-spacing:-.035em}
      #view-home .home512-daily{gap:12px}
      #view-home .home512-daily .card{border:1px solid #e4e8ee!important;border-radius:18px!important;background:linear-gradient(180deg,#fff,#fbfcfe)!important;box-shadow:0 10px 24px rgba(16,24,40,.045)!important;transition:transform .16s ease,box-shadow .16s ease}
      #view-home .home512-daily .card:hover{transform:translateY(-2px);box-shadow:0 16px 30px rgba(16,24,40,.075)!important}

      #view-home .channels514{margin-top:18px}
      #view-home .channels514-head h2{font-size:26px;letter-spacing:-.035em}
      #view-home .channels514-grid{gap:12px}
      #view-home .channels514-card{position:relative;overflow:hidden;border:1px solid #e4e8ee;border-radius:18px;background:linear-gradient(180deg,#fff,#fbfcfe);box-shadow:0 10px 24px rgba(16,24,40,.045);padding:15px 16px}
      #view-home .channels514-card:before{content:"";position:absolute;left:0;top:0;right:0;height:3px;background:linear-gradient(90deg,#19d9bd,#1977ff);opacity:.85}
      #view-home .channels514-card b{font-size:31px;letter-spacing:-.04em}
      #view-home .channels514-total{background:linear-gradient(135deg,#0b1428,#111f3c)!important;border-color:#132448!important;box-shadow:0 14px 32px rgba(12,25,52,.17)!important}
      #view-home .channels514-total:before{background:linear-gradient(90deg,#2fe3c3,#4d88ff)}

      #view-home .home512-work{gap:12px}
      #view-home .home512-work button{position:relative;overflow:hidden;border:1px solid #e3e8ef;border-radius:18px;background:linear-gradient(180deg,#fff,#fafbfd);box-shadow:0 9px 24px rgba(16,24,40,.045);padding:16px;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
      #view-home .home512-work button:hover{transform:translateY(-2px);border-color:#c9d4e4;box-shadow:0 15px 30px rgba(16,24,40,.075)}
      #view-home .home512-work button:before{content:"";position:absolute;left:0;top:0;right:0;height:3px;background:#d9e3f5}
      #view-home .home512-work button:nth-child(1):before{background:#2b7fff}#view-home .home512-work button:nth-child(2):before{background:#18c8a8}#view-home .home512-work button:nth-child(3):before{background:#f1b440}#view-home .home512-work button:nth-child(4):before{background:#cf6fe0}
      #view-home .home512-work .total{background:linear-gradient(135deg,#081329,#0c1e3f)!important;border-color:#102754!important;box-shadow:0 14px 34px rgba(8,19,41,.18)!important}
      #view-home .home512-work .total:before{background:linear-gradient(90deg,#1cd4b5,#377cff)}

      #view-home .panel{border-radius:20px;border-color:#e4e8ee;box-shadow:0 10px 28px rgba(16,24,40,.045)}
      #view-home .home512-team table{border-collapse:separate;border-spacing:0}
      #view-home .home512-team thead th{background:#f7f9fc;color:#677386;font-size:10px;letter-spacing:.07em}
      #view-home .home512-team tbody tr:hover td{background:#fbfdff}
      #view-home .home512-task{padding:13px 0}
      #view-home .home512-task .btn{border-radius:12px}

      @media(max-width:900px){
        #view-home .home512-hero{min-height:0;padding:25px 22px;align-items:flex-start;flex-direction:column;border-radius:24px}
        #view-home .home512-rate{width:100%;min-width:0}
        #view-home .home512-hero h1{font-size:38px}
      }
    `;
    document.head.appendChild(s);
  }

  function decorateGoal(){
    const host=document.getElementById('view-home'); if(!host) return;
    const candidates=[...host.querySelectorAll('.panel')];
    const goal=candidates.find(p=>/Meta mensual/i.test(p.querySelector('h3')?.textContent||''));
    if(goal){
      goal.classList.add('goal-modern-v515');
      const body=goal.querySelector('.panel-body');
      if(body){
        const progress=[...body.children].find(x=>x instanceof HTMLElement && x.querySelector(':scope > div') && /height\s*:\s*12px/i.test(x.getAttribute('style')||''));
        if(progress){
          progress.classList.add('goal-progress-v515');
          const fill=progress.firstElementChild; if(fill) fill.classList.add('goal-fill-v515');
        }
      }
    }
  }

  function applyVersion(){
    const foot=document.querySelector('.sidebar-foot');
    if(foot) foot.innerHTML=foot.innerHTML.replace(/Versión\s+[^<]+/,'Versión '+VERSION);
  }

  function decorate(){installStyles();decorateGoal();applyVersion()}

  const baseHome=window.renderHomeV51||window.renderHome;
  if(typeof baseHome==='function'){
    window.renderHomeV51=function(){const r=baseHome.apply(this,arguments);requestAnimationFrame(decorate);setTimeout(decorate,80);return r};
    window.renderHome=window.renderHomeV51;
  }
  const baseShell=window.renderShell;
  if(typeof baseShell==='function') window.renderShell=function(){const r=baseShell.apply(this,arguments);setTimeout(applyVersion,0);return r};

  installStyles();
  setTimeout(()=>{try{if(typeof currentView!=='undefined'&&currentView==='home')window.renderHomeV51?.();else decorate()}catch(e){console.error('modern home v51.5',e)}},180);
  console.info('INVICTO OPS v51.5 · diseño moderno de Inicio restaurado');
})();
