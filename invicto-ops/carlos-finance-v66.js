/* INVICTO OPS v66 · Finance skin para Cuentas Carlos */
(function(){
  const ready=()=>typeof session!=='undefined' && session && ['Administrador','Gerente'].includes(session.role);

  function styles(){
    if(document.getElementById('carlos66financecss')) return;
    const s=document.createElement('style');
    s.id='carlos66financecss';
    s.textContent=`
      #view-carlos.c66bank{
        --c66-ink:#171717;
        --c66-muted:#8d8d8d;
        --c66-line:#e8e7e3;
        --c66-bg:#f4f3ef;
        --c66-card:#ffffff;
        --c66-green:#c8e9c2;
        --c66-green-deep:#2d6a3d;
        --c66-red:#b42318;
        --c66-shadow:0 18px 48px rgba(31,31,31,.07);
        background:
          radial-gradient(circle at 88% 3%,rgba(245,224,207,.75),transparent 28%),
          linear-gradient(180deg,#f7f6f2 0%,#f1f1ee 100%);
        border-radius:30px;
        padding:28px;
        min-height:calc(100vh - 112px);
        color:var(--c66-ink);
      }
      #view-carlos.c66bank .c65hero{
        align-items:center;
        margin:0 0 22px;
        padding:0 4px;
      }
      #view-carlos.c66bank .c65hero .eyebrow{display:none}
      #view-carlos.c66bank .c65hero h1{
        margin:0;
        font-size:clamp(30px,4vw,46px);
        line-height:1;
        letter-spacing:-.045em;
        font-weight:780;
      }
      #view-carlos.c66bank .c65hero p{margin-top:8px;color:#767676;font-size:13px}
      #view-carlos.c66bank .c65hero .btn{
        width:44px;height:44px;border-radius:50%;padding:0;
        display:grid;place-items:center;border:1px solid rgba(0,0,0,.05);
        background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.05);
        font-size:0;
      }
      #view-carlos.c66bank .c65hero .btn:before{content:'↻';font-size:19px;color:#111}
      .c66-account{
        position:relative;
        overflow:hidden;
        border-radius:30px;
        padding:28px;
        min-height:220px;
        background:
          radial-gradient(circle at 82% 12%,rgba(247,224,207,.95),transparent 35%),
          linear-gradient(135deg,#ffffff 0%,#fbfaf7 55%,#f1f1ed 100%);
        box-shadow:var(--c66-shadow);
        border:1px solid rgba(20,20,20,.035);
        display:grid;
        grid-template-columns:minmax(0,1fr) auto;
        gap:18px;
        margin-bottom:18px;
      }
      .c66-account:after{
        content:'';
        position:absolute;
        width:260px;height:260px;border-radius:50%;
        right:-145px;bottom:-170px;
        background:rgba(194,229,187,.52);
      }
      .c66-account-top{display:flex;align-items:center;gap:10px;color:#4b4b4b;font-size:12px;font-weight:800}
      .c66-account-dot{width:10px;height:10px;border-radius:50%;background:#1a1a1a;box-shadow:0 0 0 5px rgba(0,0,0,.055)}
      .c66-account-label{margin-top:42px;color:#969696;font-size:12px}
      .c66-account-value{font-size:clamp(36px,6vw,62px);line-height:1;margin-top:7px;letter-spacing:-.055em;font-weight:760}
      .c66-account-status{margin-top:12px;max-width:650px;color:#626262;font-size:13px;line-height:1.45}
      .c66-account-brand{position:relative;z-index:1;text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end}
      .c66-account-brand b{font-size:16px;letter-spacing:.13em}
      .c66-account-brand small{font-size:10px;color:#969696;text-transform:uppercase;letter-spacing:.08em}
      .c66-chip{
        min-width:52px;height:38px;border-radius:13px;
        background:linear-gradient(135deg,#dad7cb,#f5f0df);
        border:1px solid rgba(0,0,0,.06);
        box-shadow:inset 0 0 0 5px rgba(255,255,255,.25);
      }

      #view-carlos.c66bank .c65status{display:none}
      #view-carlos.c66bank .c65k{
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;margin:0 0 16px;
      }
      #view-carlos.c66bank .c65k .c65card:nth-child(3){display:none}
      #view-carlos.c66bank .c65card{
        border:0;
        border-radius:22px;
        padding:18px 20px;
        background:#fff;
        box-shadow:0 10px 28px rgba(0,0,0,.04);
      }
      #view-carlos.c66bank .c65card small{color:#8d8d8d;font-size:9px;letter-spacing:.07em}
      #view-carlos.c66bank .c65card b{font-size:26px;letter-spacing:-.035em;margin-top:7px}
      #view-carlos.c66bank .c65card .muted{font-size:11px;margin-top:5px}

      #view-carlos.c66bank .c65actions{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:12px;
        margin:18px 0 26px;
      }
      #view-carlos.c66bank .c65actions .btn{
        border:0;
        border-radius:22px;
        min-height:68px;
        padding:12px 16px;
        background:#fff;
        color:#191919;
        box-shadow:0 10px 28px rgba(0,0,0,.04);
        font-weight:760;
        text-align:left;
        display:flex;align-items:center;gap:12px;
      }
      #view-carlos.c66bank .c65actions .btn:nth-child(3){background:var(--c66-green)}
      #view-carlos.c66bank .c65actions .btn:before{
        display:grid;place-items:center;flex:0 0 auto;
        width:38px;height:38px;border-radius:50%;
        background:#f5f5f3;
        font-size:19px;font-weight:500;
      }
      #view-carlos.c66bank .c65actions .btn:nth-child(1):before{content:'↗'}
      #view-carlos.c66bank .c65actions .btn:nth-child(2):before{content:'↙'}
      #view-carlos.c66bank .c65actions .btn:nth-child(3):before{content:'+';background:rgba(255,255,255,.45)}
      #view-carlos.c66bank .c65tabs{
        background:#e9e9e6;
        padding:5px;
        border-radius:16px;
        margin:0 0 12px;
        width:max-content;
        max-width:100%;
      }
      #view-carlos.c66bank .c65tabs button{
        border:0;
        border-radius:12px;
        background:transparent;
        padding:9px 15px;
        color:#7a7a7a;
        font-size:12px;
      }
      #view-carlos.c66bank .c65tabs button.on{
        background:#fff;color:#161616;
        box-shadow:0 3px 10px rgba(0,0,0,.055);
      }

      #view-carlos.c66bank .panel{
        border:0;
        border-radius:28px;
        background:#fff;
        box-shadow:var(--c66-shadow);
        overflow:hidden;
      }
      #view-carlos.c66bank .panel-head{
        min-height:auto;
        padding:22px 24px 14px;
        border:0;
      }
      #view-carlos.c66bank .panel-head h3{
        font-size:22px;
        letter-spacing:-.035em;
      }
      #view-carlos.c66bank .panel-body{padding:18px 24px 24px}
      #view-carlos.c66bank .table-wrap{padding:0 18px 18px}
      #view-carlos.c66bank table{border-collapse:separate;border-spacing:0 7px}
      #view-carlos.c66bank thead th{
        border:0;background:transparent;
        color:#aaa;font-size:9px;letter-spacing:.08em;
        padding:7px 11px;
      }
      #view-carlos.c66bank tbody td{
        background:#fafaf8;
        border:0;
        padding:13px 11px;
        vertical-align:middle;
      }
      #view-carlos.c66bank tbody tr td:first-child{border-radius:15px 0 0 15px}
      #view-carlos.c66bank tbody tr td:last-child{border-radius:0 15px 15px 0}
      #view-carlos.c66bank tbody tr:hover td{background:#f5f5f2}
      #view-carlos.c66bank .c65danger{
        border-radius:999px;padding:7px 10px;background:#fff0ef;
      }
      #view-carlos.c66bank .btn.navy{
        background:#171717;color:#fff;border:0;border-radius:14px;
      }
      #view-carlos.c66bank .btn.light{
        background:#f5f5f2;color:#1b1b1b;border:0;border-radius:14px;
      }

      #view-carlos.c66bank #c65composer .panel{
        margin:0 0 22px;
        box-shadow:0 22px 55px rgba(0,0,0,.08);
      }
      #view-carlos.c66bank .c65form{gap:12px}
      #view-carlos.c66bank .c65form label{
        font-size:9px;color:#979797;letter-spacing:.07em;margin-bottom:6px
      }
      #view-carlos.c66bank .c65form input,
      #view-carlos.c66bank .c65form select,
      #view-carlos.c66bank .c65form textarea{
        min-height:46px;
        border:1px solid #e4e4df;
        border-radius:14px;
        background:#f8f8f5;
        padding:11px 13px;
        outline:none;
        transition:.18s ease;
      }
      #view-carlos.c66bank .c65form textarea{min-height:82px}
      #view-carlos.c66bank .c65form input:focus,
      #view-carlos.c66bank .c65form select:focus,
      #view-carlos.c66bank .c65form textarea:focus{
        border-color:#b8dcb2;background:#fff;
        box-shadow:0 0 0 4px rgba(184,220,178,.18);
      }
      #view-carlos.c66bank .c65rates{gap:12px}
      #view-carlos.c66bank .c65rate{
        border:0;border-radius:20px;padding:17px;
        box-shadow:0 10px 28px rgba(0,0,0,.04);
      }

      .c66-section-title{
        display:flex;align-items:center;justify-content:space-between;
        margin:26px 3px 12px;
      }
      .c66-section-title h2{margin:0;font-size:24px;letter-spacing:-.035em}
      .c66-section-title span{font-size:11px;color:#9a9a9a}

      @media(max-width:900px){
        #view-carlos.c66bank{padding:18px;border-radius:22px}
        .c66-account{min-height:200px}
      }
      @media(max-width:680px){
        #view-carlos.c66bank{padding:14px;margin:0 -6px;border-radius:0;min-height:100vh}
        #view-carlos.c66bank .c65hero{align-items:center;flex-direction:row}
        #view-carlos.c66bank .c65hero h1{font-size:30px}
        #view-carlos.c66bank .c65hero p{font-size:11px}
        .c66-account{grid-template-columns:1fr;padding:22px;min-height:225px;border-radius:26px}
        .c66-account-brand{position:absolute;right:22px;top:22px;height:178px}
        .c66-account-value{font-size:42px}
        .c66-account-status{padding-right:70px}
        #view-carlos.c66bank .c65k{grid-template-columns:1fr 1fr}
        #view-carlos.c66bank .c65card{padding:15px}
        #view-carlos.c66bank .c65card b{font-size:20px}
        #view-carlos.c66bank .c65actions{grid-template-columns:1fr 1fr 1fr;gap:8px}
        #view-carlos.c66bank .c65actions .btn{
          min-height:92px;flex-direction:column;justify-content:center;text-align:center;
          font-size:10px;padding:10px 6px;border-radius:19px;
        }
        #view-carlos.c66bank .c65tabs{width:100%;display:grid;grid-template-columns:repeat(3,1fr)}
        #view-carlos.c66bank .c65tabs button{padding:9px 5px;font-size:10px}
        #view-carlos.c66bank .panel{border-radius:23px}
        #view-carlos.c66bank .panel-head{padding:18px 18px 10px}
        #view-carlos.c66bank .panel-body{padding:14px 18px 20px}
        #view-carlos.c66bank .table-wrap{padding:0 10px 12px}
        #view-carlos.c66bank table{min-width:720px}
      }
    `;
    document.head.appendChild(s);
  }

  function accountCard(host){
    const old=host.querySelector('.c66-account');
    if(old) old.remove();
    const cards=[...host.querySelectorAll('.c65k .c65card')];
    const balance=cards[2]?.querySelector('b')?.textContent?.trim()||'$0';
    const state=host.querySelector('.c65status')?.textContent?.trim()||'Invicto y Carlos están al día.';
    const hero=host.querySelector('.c65hero');
    if(!hero) return;
    const card=document.createElement('div');
    card.className='c66-account';
    card.innerHTML=`
      <div>
        <div class="c66-account-top"><span class="c66-account-dot"></span><span>Cuenta proveedor · Carlos Pérez</span></div>
        <div class="c66-account-label">Saldo actual</div>
        <div class="c66-account-value">${balance}</div>
        <div class="c66-account-status">${state}</div>
      </div>
      <div class="c66-account-brand">
        <div><b>INVICTO</b><small>PRODUCCIÓN</small></div>
        <div class="c66-chip"></div>
      </div>`;
    hero.insertAdjacentElement('afterend',card);
  }

  function sectionTitle(host){
    const tabs=host.querySelector('.c65tabs');
    if(!tabs || host.querySelector('.c66-section-title')) return;
    const t=document.createElement('div');
    t.className='c66-section-title';
    t.innerHTML='<h2>Actividad</h2><span>Cuenta corriente y producción</span>';
    tabs.insertAdjacentElement('beforebegin',t);
  }

  function skin(){
    if(!ready()) return;
    styles();
    const host=document.getElementById('view-carlos');
    if(!host) return;
    host.classList.add('c66bank');
    accountCard(host);
    sectionTitle(host);
  }

  const baseRender=window.renderCarlos65;
  if(typeof baseRender==='function'&&!baseRender.__finance66){
    const wrapped=function(){
      const r=baseRender.apply(this,arguments);
      setTimeout(skin,0);
      return r;
    };
    wrapped.__finance66=true;
    window.renderCarlos65=wrapped;
  }

  ['c65Payment','c65Delivery','c65Rate','c65Tab'].forEach(name=>{
    const base=window[name];
    if(typeof base!=='function'||base.__finance66) return;
    const wrapped=function(){
      const r=base.apply(this,arguments);
      setTimeout(skin,0);
      return r;
    };
    wrapped.__finance66=true;
    window[name]=wrapped;
  });

  setTimeout(skin,500);
  console.info('INVICTO OPS v66 · Cuentas Carlos finance UI');
})();