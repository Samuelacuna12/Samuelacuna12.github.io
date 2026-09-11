/* INVICTO OPS v12 · autenticación real Supabase
   Reemplaza el login local de prueba. Los datos operativos locales se migrarán en el siguiente bloque. */

const INVICTO_SUPABASE_URL_V12='https://ntafomzqtjdfslanggak.supabase.co';
const INVICTO_SUPABASE_KEY_V12='sb_publishable_IBdKw7gD078zjvB38UWcVQ_dyV4lI9s';
const invictoSupabaseV12=window.supabase.createClient(INVICTO_SUPABASE_URL_V12,INVICTO_SUPABASE_KEY_V12,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

let invictoAuthReadyV12=false;
const renderShellBaseV12=window.renderShell;

function roleLabelV12(role){
  return ({admin:'Administrador',gerencia:'Gerente',vendedor:'Vendedor',logistica:'Logística'})[role]||role||'Usuario';
}

window.isAdmin=function(){return !!session&&(session.role==='Administrador'||session.role==='Gerente');};
window.isManager=function(){return !!session&&session.role==='Gerente';};
window.isAdvisor=function(){return !!session&&session.role==='Vendedor';};

async function loadProfileV12(user){
  const {data,error}=await invictoSupabaseV12.from('profiles')
    .select('id,full_name,username,role,active,can_receive_sales,must_change_password,last_seen_at')
    .eq('id',user.id).single();
  if(error)throw error;
  if(!data?.active)throw new Error('Tu usuario está desactivado. Comunícate con administración.');
  return data;
}

function applyProfileSessionV12(profile){
  session={
    id:profile.id,
    username:profile.username,
    name:profile.full_name,
    role:roleLabelV12(profile.role),
    roleCode:profile.role,
    canReceiveSales:!!profile.can_receive_sales,
    mustChangePassword:!!profile.must_change_password,
    auth:'supabase'
  };
  try{localStorage.setItem(SESSION_KEY,JSON.stringify(session));}catch(e){}
}

window.renderLogin=function(){
  document.body.className='';
  el('app').innerHTML=`
  <section class="login-shell">
    <div class="login-card">
      <div class="login-art">
        <div class="brand"><span class="planet"></span><div>INVICTO OPS</div></div>
        <h1>Una sola operación. Todo bajo control.</h1>
        <p>Ventas, recuperación, inventario, logística, garantías, novedades, cortes y métricas en una sola interfaz operativa.</p>
      </div>
      <div class="login-form">
        <div class="eyebrow">CENTRO DE OPERACIONES</div>
        <h2>Iniciar sesión</h2>
        <p>Acceso interno seguro de Universo Invicto.</p>
        <form onsubmit="login(event)">
          <div class="field"><label>Usuario</label><input id="loginUser" autocomplete="username" placeholder="usuario" required></div>
          <div class="field"><label>Contraseña</label><input id="loginPass" type="password" autocomplete="current-password" placeholder="••••••••" required></div>
          <button id="loginBtn" class="btn navy block" type="submit">Entrar a INVICTO OPS</button>
        </form>
        <div id="loginError" class="login-note hidden"></div>
        <div class="login-note"><b>Acceso real conectado.</b> Cada colaborador ingresa con su usuario personal. Las contraseñas ya no están guardadas en el código público.</div>
      </div>
    </div>
  </section>`;
};

window.login=async function(ev){
  ev.preventDefault();
  const user=el('loginUser').value.trim().toLowerCase().replace(/\s+/g,'');
  const pass=el('loginPass').value;
  const btn=el('loginBtn');
  const err=el('loginError');
  if(btn){btn.disabled=true;btn.textContent='Ingresando…';}
  if(err)err.classList.add('hidden');
  try{
    const email=`${user}@invicto.local`;
    const {data,error}=await invictoSupabaseV12.auth.signInWithPassword({email,password:pass});
    if(error)throw error;
    const profile=await loadProfileV12(data.user);
    applyProfileSessionV12(profile);
    await invictoSupabaseV12.rpc('touch_my_session');
    currentView='home';
    if(session.mustChangePassword)renderPasswordChangeV12();else render();
  }catch(e){
    await invictoSupabaseV12.auth.signOut().catch(()=>{});
    session=null;
    if(err){err.textContent=e?.message==='Invalid login credentials'?'Usuario o contraseña incorrectos.':(e?.message||'No fue posible iniciar sesión.');err.classList.remove('hidden');}
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Entrar a INVICTO OPS';}
  }
};

window.logout=async function(){
  try{await invictoSupabaseV12.auth.signOut();}catch(e){}
  session=null;
  try{localStorage.removeItem(SESSION_KEY);}catch(e){}
  renderLogin();
};

function renderPasswordChangeV12(){
  document.body.className='';
  el('app').innerHTML=`
  <section class="login-shell">
    <div class="login-card">
      <div class="login-art">
        <div class="brand"><span class="planet"></span><div>INVICTO OPS</div></div>
        <h1>Primero protege tu cuenta.</h1>
        <p>${esc(session.name)}, esta es la primera entrada con tu usuario. Debes reemplazar la contraseña temporal antes de continuar.</p>
      </div>
      <div class="login-form">
        <div class="eyebrow">SEGURIDAD</div>
        <h2>Cambiar contraseña</h2>
        <p>Usa mínimo 10 caracteres. Recomendamos combinar mayúsculas, minúsculas, números y símbolos.</p>
        <form onsubmit="changePasswordV12(event)">
          <div class="field"><label>Nueva contraseña</label><input id="newPassV12" type="password" minlength="10" autocomplete="new-password" required></div>
          <div class="field"><label>Repetir contraseña</label><input id="newPass2V12" type="password" minlength="10" autocomplete="new-password" required></div>
          <button id="changePassBtnV12" class="btn navy block" type="submit">Guardar y entrar</button>
        </form>
        <div id="changePassErrorV12" class="login-note hidden"></div>
      </div>
    </div>
  </section>`;
}

window.changePasswordV12=async function(ev){
  ev.preventDefault();
  const p1=el('newPassV12').value,p2=el('newPass2V12').value;
  const err=el('changePassErrorV12'),btn=el('changePassBtnV12');
  if(p1!==p2){err.textContent='Las contraseñas no coinciden.';err.classList.remove('hidden');return;}
  if(p1.length<10){err.textContent='La contraseña debe tener mínimo 10 caracteres.';err.classList.remove('hidden');return;}
  btn.disabled=true;btn.textContent='Guardando…';
  try{
    const {error}=await invictoSupabaseV12.auth.updateUser({password:p1});
    if(error)throw error;
    const {error:rpcError}=await invictoSupabaseV12.rpc('mark_my_password_changed');
    if(rpcError)throw rpcError;
    session.mustChangePassword=false;
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(session));}catch(e){}
    render();
  }catch(e){err.textContent=e?.message||'No se pudo cambiar la contraseña.';err.classList.remove('hidden');}
  finally{btn.disabled=false;btn.textContent='Guardar y entrar';}
};

window.renderShell=function(){
  renderShellBaseV12();
  const chip=document.querySelector('.mode-chip');
  if(chip){chip.textContent='AUTH REAL · SUPABASE';chip.classList.remove('red','amber');chip.classList.add('green');}
  const userSmall=document.querySelector('.user-block small');
  if(userSmall)userSmall.textContent=session?.role||'';
};

async function initRealAuthV12(){
  invictoAuthReadyV12=false;
  session=null;
  try{localStorage.removeItem(SESSION_KEY);}catch(e){}
  try{
    const {data,error}=await invictoSupabaseV12.auth.getSession();
    if(error)throw error;
    if(data?.session?.user){
      const profile=await loadProfileV12(data.session.user);
      applyProfileSessionV12(profile);
      await invictoSupabaseV12.rpc('touch_my_session');
    }
  }catch(e){
    await invictoSupabaseV12.auth.signOut().catch(()=>{});
    session=null;
  }
  invictoAuthReadyV12=true;
  if(session?.mustChangePassword)renderPasswordChangeV12();else render();
}

invictoSupabaseV12.auth.onAuthStateChange(async(event,authSession)=>{
  if(!invictoAuthReadyV12)return;
  if(event==='SIGNED_OUT'){
    session=null;
    renderLogin();
  }
});

initRealAuthV12();
