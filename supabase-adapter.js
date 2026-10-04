let createClient;
const el=id=>document.getElementById(id);
const config=window.VITA_CONFIG||{};
let client=null,account=null,recovery=false;
const pending=s=>el('authMessage').textContent=s;
function ready(){if(!config.supabaseUrl.startsWith('https://'))return false;const key=config.supabasePublishableKey;if(key.startsWith('sb_publishable_'))return true;try{const part=key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(part)).role==='anon'}catch{return false}}
function reportError(error){const m=error?.message||'No se pudo completar la operación.';return /Invalid login/i.test(m)?'Correo o contraseña incorrectos.':/Email not confirmed/i.test(m)?'Confirma tu correo antes de iniciar sesión.':/Failed to fetch|NetworkError/i.test(m)?'No se pudo conectar. Revisa tu conexión.':m;}
function authView(user){account=user;el('authPanel').hidden=!!user&&!recovery;el('cloudBar').hidden=!user||recovery;if(!user){el('plannerApp').hidden=true;el('plannerApp').inert=true;window.dispatchEvent(new Event('vita-signout'));}else if(!recovery){pending('');window.dispatchEvent(new Event('vita-auth'));}}
if(ready()){
 try{({createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'))}catch{el('authActions').hidden=true;pending('No se pudo cargar el inicio de sesión. Revisa la conexión y vuelve a abrir la página.');throw new Error('No se pudo cargar Supabase');}
 client=createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.sessionStorage}});
 window.VitaCloud={async request(options={}){
   const {data:{user},error}=await client.auth.getUser();if(error||!user)return {response:{ok:false,status:401},content:{error:'Tu sesión terminó. Vuelve a iniciar sesión.'}};
   if(options.method==='PUT'){
    const input=JSON.parse(options.body);if(input.ownerId!==user.id)return {response:{ok:false,status:403},content:{error:'La cuenta cambió. Vuelve a iniciar sesión.'}};
    const {data,error}=await client.rpc('save_planner',{expected_revision:input.revision,planner_data:input.data});
    if(error)return {response:{ok:false,status:error.code==='22023'?400:503},content:{error:reportError(error)}};
    return {response:{ok:data.status==='ok',status:data.status==='conflict'?409:200},content:data};
   }
   const {data,error:readError}=await client.from('planner_state').select('payload,revision,updated_at').eq('owner_id',user.id).maybeSingle();
   if(readError)return {response:{ok:false,status:503},content:{error:reportError(readError)}};
   return {response:{ok:true,status:200},content:{data:data?.payload??null,revision:data?.revision??0,updatedAt:data?.updated_at??null,user:{id:user.id,displayName:user.email}}};
 }};
 client.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){account=session?.user||null;recovery=true;el('authPanel').hidden=false;el('newPasswordPanel').hidden=false;el('loginForm').hidden=true;el('plannerApp').hidden=true;el('cloudBar').hidden=true;pending('Escribe una contraseña nueva.');return}
  // Avoid calling the auth client from inside its own lock.
  if(event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='SIGNED_OUT')setTimeout(()=>{if(event==='SIGNED_IN'&&account?.id===session?.user?.id&&!recovery)return;authView(session?.user||null)},0);
 });
}else{el('authActions').hidden=true;pending('La conexión en la nube aún no está configurada. Se necesitan la URL del proyecto Supabase y su clave pública en config.js.');}
el('loginForm').addEventListener('submit',async event=>{event.preventDefault();if(!client)return;el('loginButton').disabled=true;pending('Iniciando sesión…');try{const {data,error}=await client.auth.signInWithPassword({email:el('authEmail').value.trim(),password:el('authPassword').value});if(error)throw error;el('authPassword').value='';if(account?.id!==data.user.id)authView(data.user);}catch(e){pending(reportError(e))}finally{el('loginButton').disabled=false}});
el('signupButton').addEventListener('click',async()=>{if(!client||!el('loginForm').reportValidity())return;pending('Creando cuenta…');try{const {data,error}=await client.auth.signUp({email:el('authEmail').value.trim(),password:el('authPassword').value,options:{emailRedirectTo:new URL('./',location.href).href}});if(error)throw error;el('authPassword').value='';if(data.session)authView(data.user);else pending('Revisa tu correo y confirma la cuenta; luego vuelve al planeador.');}catch(e){pending(reportError(e))}});
el('forgotButton').addEventListener('click',async()=>{if(!client)return;const email=el('authEmail').value.trim();if(!email)return pending('Escribe tu correo para recuperar la contraseña.');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:new URL('./',location.href).href});pending(error?reportError(error):'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.');});
el('signOutButton').addEventListener('click',async()=>{if(!client)return;const allowed=window.vitaCanSignOut?.();if(allowed===false)return;const {error}=await client.auth.signOut({scope:'local'});if(error)return pending(reportError(error));authView(null);});
el('newPasswordForm').addEventListener('submit',async event=>{event.preventDefault();if(!client)return;const {error}=await client.auth.updateUser({password:el('newPassword').value});if(error)return pending(reportError(error));el('newPassword').value='';recovery=false;el('newPasswordPanel').hidden=true;el('loginForm').hidden=false;authView(account);});
