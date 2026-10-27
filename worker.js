const COOKIE = "povratak_session";
const j = (d,s=200,h={}) => new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...h}});
const enc = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
async function sig(v, secret) {
  const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return enc(await crypto.subtle.sign("HMAC",k,new TextEncoder().encode(v)));
}
async function session(secret) {
  const p=enc(new TextEncoder().encode(JSON.stringify({exp:Date.now()+8*60*60*1000})));
  return p+"."+await sig(p,secret);
}
async function loggedIn(req, secret) {
  const c=(req.headers.get("Cookie")||"").split(";").map(v=>v.trim()).find(v=>v.startsWith(COOKIE+"="));
  if(!c) return false;
  const t=decodeURIComponent(c.slice(COOKIE.length+1)), [p,s]=t.split(".");
  if(!p||!s||await sig(p,secret)!==s) return false;
  try { const b=atob(p.replace(/-/g,"+").replace(/_/g,"/")); return JSON.parse(decodeURIComponent(escape(b))).exp>Date.now(); } catch { return false; }
}
const clean=(v,n=10000)=>String(v??"").trim().slice(0,n);
export default { async fetch(req,env) {
  const u=new URL(req.url), p=u.pathname;
  if(p==="/api/login"&&req.method==="POST"){
    if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return j({error:"Administrator još nije konfigurisan."},503);
    const b=await req.json().catch(()=>({}));
    if(String(b.password||"")!==env.ADMIN_PASSWORD){await new Promise(r=>setTimeout(r,400));return j({error:"Pogrešna lozinka."},401);}
    const t=await session(env.SESSION_SECRET);
    return j({ok:true},200,{"Set-Cookie":`${COOKIE}=${encodeURIComponent(t)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`});
  }
  if(p==="/api/logout"&&req.method==="POST")return j({ok:true},200,{"Set-Cookie":`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});
  if(p==="/api/content"&&req.method==="GET"){
    const k=u.searchParams.get("kind");
    if(k&&!["news","project"].includes(k))return j({error:"Neispravna kategorija."},400);
    const q=k?await env.DB.prepare("SELECT * FROM content WHERE published=1 AND kind=? ORDER BY created_at DESC").bind(k).all():await env.DB.prepare("SELECT * FROM content WHERE published=1 ORDER BY created_at DESC").all();
    return j({items:q.results||[]},200,{"Cache-Control":"public, max-age=60"});
  }
  if(p.startsWith("/api/")){
    if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET)return j({error:"Administrator još nije konfigurisan."},503);
    if(!await loggedIn(req,env.SESSION_SECRET))return j({error:"Potrebna je prijava."},401);
    if(p==="/api/content"&&req.method==="POST"){
      const b=await req.json().catch(()=>null);
      if(!b||!["news","project"].includes(b.kind)||!clean(b.title,160))return j({error:"Unesite vrstu sadržaja i naslov."},400);
      const id=crypto.randomUUID();
      await env.DB.prepare("INSERT INTO content(id,kind,title,category,summary,body,image_url,published) VALUES(?,?,?,?,?,?,?,?)")
        .bind(id,b.kind,clean(b.title,160),clean(b.category,80),clean(b.summary,500),clean(b.body,10000),clean(b.image_url,1000),b.published===false?0:1).run();
      return j({ok:true,id});
    }
    const m=p.match(/^\\/api\\/content\\/([a-zA-Z0-9-]+)$/);
    if(m&&req.method==="PUT"){
      const b=await req.json().catch(()=>null);
      if(!b||!["news","project"].includes(b.kind)||!clean(b.title,160))return j({error:"Neispravni podaci."},400);
      await env.DB.prepare("UPDATE content SET kind=?,title=?,category=?,summary=?,body=?,image_url=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
       .bind(b.kind,clean(b.title,160),clean(b.category,80),clean(b.summary,500),clean(b.body,10000),clean(b.image_url,1000),b.published===false?0:1,m[1]).run();
      return j({ok:true});
    }
    if(m&&req.method==="DELETE"){await env.DB.prepare("DELETE FROM content WHERE id=?").bind(m[1]).run();return j({ok:true});}
    return j({error:"Nepoznata API ruta."},404);
  }
  return env.ASSETS.fetch(req);
}};
