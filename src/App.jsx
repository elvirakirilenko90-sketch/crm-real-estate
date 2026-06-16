import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
const stages = ["Новый Лид","Первый контакт","В работе","Назначена встреча","Проведена встреча","Думает","Задаток","Сделка","Отказ","Отложили"];
const sources = ["Повторный клиент","Рекомендации","ОЛХ","Лид руководство","Инстаграм личный","Тик-Ток личный","Фейсбук личный","Тик-Ток рабочий","Инстаграм рабочий","Фейсбук рабочий","Телеграмм-канал рабочий","Рекомендации клиентов"];
const types = ["1-комнатные","2-комнатные","3-комнатные","Таунхаус","Дом","Участок","Коммерция"];
const districts = ["Киевский","Приморский","Пересыпский","Хаджибейский","Аркадия"];
const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const week = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const eventTypes = ["Звонок","Встреча","Показ","Задача"];


const themeOptions = [
  {id:"classic", name:"Черный + золото", vars:{"--accent":"#d6a500","--accent2":"#f3c21b","--dark":"#070707","--soft":"#f5f2ea"}},
  {id:"whiteGold", name:"Белый + золото", vars:{"--accent":"#d8a800","--accent2":"#f2d15b","--dark":"#111827","--soft":"#fff8df"}},
  {id:"graphite", name:"Графит + янтарь", vars:{"--accent":"#f59e0b","--accent2":"#fbbf24","--dark":"#111827","--soft":"#f3f4f6"}},
  {id:"navy", name:"Синий + золото", vars:{"--accent":"#d4af37","--accent2":"#facc15","--dark":"#0f172a","--soft":"#eef2ff"}},
  {id:"green", name:"Изумруд + беж", vars:{"--accent":"#10b981","--accent2":"#34d399","--dark":"#052e2b","--soft":"#ecfdf5"}}
];

function themeStyle(themeId){
  const found = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  return {
    ...found.vars,
    background: `linear-gradient(135deg, ${found.vars["--soft"] || "#f5f2ea"}, #ffffff)`
  };
}


const initialLeads = [
  {id:"L-1024", name:"Анна Коваленко", phone:"+380671234567", source:"Тик-Ток рабочий", status:"Новый Лид", notes:"Хочет видовую квартиру, рассрочку и реальные фото дома.", nextContact:"2026-05-24 19:30", manager:"Елена", history:["Клиент создан","Уточнен бюджет","Назначен звонок"]},
  {id:"L-1025", name:"Игорь Мельник", phone:"+48500111222", source:"Инстаграм личный", status:"Первый контакт", notes:"Сравнивает Одессу и Киев. Нужны цифры по аренде.", nextContact:"2026-05-25 11:00", manager:"Андрей", history:["Лид пришел из Instagram","Добавлена заметка"]},
  {id:"L-1026", name:"Марина Соколова", phone:"+971501112233", source:"Рекомендации клиентов", status:"Назначена встреча", notes:"VIP клиент. Только сильные объекты.", nextContact:"2026-05-27 12:00", manager:"Елена", history:["Клиент создан","Назначена встреча"]},
  {id:"L-1027", name:"Дмитрий Орлов", phone:"+380931234567", source:"Фейсбук рабочий", status:"В работе", notes:"Ищет офис в Аркадии до 90 000$.", nextContact:"2026-05-28 16:30", manager:"Андрей", history:["Клиент создан","Отправлена подборка"]}
];

const initialPosts = [
  {id:"N-1", author:"Администратор", date:"24.05.2026 10:30", text:"Обновили подборку по объектам у моря", kind:"Фото", file:"sea-view.jpg", likes:24, comments:["Принято","Добавила клиентам"]},
  {id:"N-2", author:"CRM", date:"24.05.2026 09:00", text:"Чек-лист по вторичке обновлен", kind:"Файл", file:"checklist.pdf", likes:12, comments:["Скачали"]}
];

const initialProperties = [
  {id:"P-301", title:"Видовая квартира у моря", type:"2-комнатные", district:"Аркадия", status:"Актуален", price:118000, area:72, floor:"12/24", owner:"Собственник Анна", ownerPhone:"+380671010101", description:"Новый ремонт, вид на море, паркинг, охрана.", media:["Фото: Вид на море"], hot:true, history:["Объект добавлен","Обновлена цена"]},
  {id:"P-302", title:"Таунхаус для семьи", type:"Таунхаус", district:"Киевский", status:"В работе", price:185000, area:145, floor:"2 этажа", owner:"Собственник Сергей", ownerPhone:"+380672020202", description:"Закрытая территория, 2 этажа, место под авто.", media:[], hot:false, history:["Объект добавлен"]}
];

const initialEvents = [
  {id:"EV-1", leadId:"L-1024", client:"Анна Коваленко", type:"Звонок", title:"Первичный звонок", date:"2026-05-24", time:"19:30", reminder:60},
  {id:"EV-2", leadId:"L-1026", client:"Марина Соколова", type:"Встреча", title:"VIP встреча", date:"2026-05-27", time:"12:00", reminder:120}
];

const initialHelp = [
  {id:"H-1", leadId:"L-1024", client:"Анна Коваленко", manager:"Елена", text:"Нужна помощь директора по цене и аргументации.", reply:"", status:"open"},
  {id:"H-2", leadId:"L-1026", client:"Марина Соколова", manager:"Елена", text:"Клиент VIP, нужен комментарий директора перед встречей.", reply:"Подключусь перед показом.", status:"answered"}
];

const initialManagers = [
  {id:"AG-1", name:"Елена", email:"manager1@agency.com", role:"Менеджер по продажам", access:true},
  {id:"AG-2", name:"Андрей", email:"manager2@agency.com", role:"Менеджер по продажам", access:true},
  {id:"DIR-1", name:"Директор", email:"director@agency.com", role:"Администратор директор", access:true}
];

function useStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });
  const update = (next) => {
    setValue((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    });
  };
  return [value, update];
}

function money(value){ return "$" + Number(value || 0).toLocaleString(); }
function cn(...items){ return items.filter(Boolean).join(" "); }
function badge(text, tone=""){ return <span className={cn("badge", tone)}>{text}</span>; }

function playBeep(){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 980;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(()=>{osc.stop();ctx.close();}, 350);
  }catch{}
}

function playReminderSound(type="classic"){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.value = 0.07;
    gain.connect(ctx.destination);
    const tones = type === "soft" ? [660, 880] : type === "double" ? [880, 880, 1040] : [980];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(gain);
      const start = ctx.currentTime + i * 0.22;
      osc.start(start);
      osc.stop(start + 0.18);
    });
    setTimeout(()=>ctx.close(), 1000);
  }catch{}
}

async function uploadToFirstAvailableBucket(bucketNames, path, file, options={}){
  let lastError = null;
  for (const bucket of bucketNames){
    const upload = await supabase.storage.from(bucket).upload(path, file, options);
    if (!upload.error) {
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return { bucket, publicUrl };
    }
    lastError = upload.error;
  }
  return { error: lastError };
}

function managerDisplayName(u){
  return u?.full_name || u?.name || u?.email || "Без имени";
}

function commentAuthorName(c){
  return c?.author_name || c?.author || c?.manager_name || c?.user_name || "Пользователь";
}

function eventOwnerEmail(event){
  return String(event?.manager_email || event?.owner_email || event?.created_by_email || "").trim().toLowerCase();
}

function parseClientLineSmart(line){
  const raw = String(line || "").trim();
  if (!raw) return null;
  const parts = raw.includes(";") ? raw.split(";") : raw.includes("	") ? raw.split("	") : raw.includes(",") ? raw.split(",") : [raw];
  if (parts.length >= 2) {
    const first = String(parts[0] || "").trim();
    const second = String(parts[1] || "").trim();
    const firstHasPhone = /\+?\d[\d\s()\-]{6,}/.test(first);
    const secondHasPhone = /\+?\d[\d\s()\-]{6,}/.test(second);
    let name = firstHasPhone && !secondHasPhone ? second : first;
    let phone = secondHasPhone ? second : firstHasPhone ? first : second;
    return { name: name || "Без имени", phone: phone || "+380", source: String(parts[2] || sources[0]).trim(), notes: parts.slice(3).join(" ").trim() };
  }
  const phoneMatch = raw.match(/(\+?\d[\d\s()\-]{7,}\d)/);
  const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g," ").trim() : "+380";
  const namePart = phoneMatch ? raw.slice(0, phoneMatch.index).trim() : raw.split(/\s+/).slice(0,3).join(" ");
  const notesPart = phoneMatch ? (raw.slice(phoneMatch.index + phoneMatch[0].length).trim()) : raw.split(/\s+/).slice(3).join(" ");
  return { name: namePart || "Без имени", phone, source: sources[0], notes: notesPart || raw };
}

function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({length:42}, (_,i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      day:d.getDate(),
      current:d.getMonth() === month,
      iso:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
    };
  });
}

function Button({children, variant="primary", className="", ...props}) {
  return <button className={cn("btn", variant, className)} {...props}>{children}</button>;
}

function normalizeUrl(url="") {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return "https://" + url;
}

function Media({kind="Фото", name="", small=false, onOpen=null}) {
  const lowerKind = String(kind || "").toLowerCase();
  const hasFile = Boolean(name);
  const isUrl = typeof name === "string" && /^https?:\/\//i.test(name);

  if (!hasFile) {
    if (lowerKind.includes("текст")) return null;
    return <div className={cn("media", small && "small")}><div>{lowerKind.includes("видео") ? "▶" : lowerKind.includes("файл") ? "📄" : lowerKind.includes("ссылка") ? "🔗" : "📷"}</div><b>{kind}</b><span>предпросмотр</span></div>;
  }

  if (lowerKind.includes("ссылка") || (isUrl && !lowerKind.includes("фото") && !lowerKind.includes("видео") && !lowerKind.includes("файл"))) {
    const url = normalizeUrl(name);
    return <a className="link" href={url} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>
      🔗 Открыть ссылку
    </a>;
  }

  if (lowerKind.includes("фото") && isUrl) {
    return <div className={cn("media", small && "small")} onClick={()=>onOpen&&onOpen({kind:"Фото",name})} style={{cursor:"pointer"}}><img src={name} alt="Фото" style={{width:"100%",borderRadius:16}} /></div>;
  }

  if (lowerKind.includes("видео") && isUrl) {
    return <div className={cn("media", small && "small")} onClick={()=>onOpen&&onOpen({kind:"Видео",name})} style={{cursor:"pointer"}}>
      <video src={name} muted playsInline preload="metadata" style={{width:"100%",borderRadius:16,display:"block"}} />
      <div className="muted" style={{marginTop:8}}>▶ Нажми, чтобы открыть видео</div>
    </div>;
  }

  if (lowerKind.includes("файл") && isUrl) {
    return <a className="link" href={name} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>📄 Открыть файл</a>;
  }

  return <div className={cn("media", small && "small")}><div>{lowerKind.includes("видео") ? "▶" : lowerKind.includes("файл") ? "📄" : lowerKind.includes("ссылка") ? "🔗" : "📷"}</div><b>{name || kind}</b><span>предпросмотр</span></div>;
}


function Modal({children, onClose, wide=false}) {
  return <div className="modal" onMouseDown={onClose}><div className={cn("sheet", wide && "wide")} onMouseDown={(e)=>e.stopPropagation()}>{children}</div></div>;
}

function Field({label, children}) {
  return <label className="field"><span>{label}</span>{children}</label>;
}


function LoginScreen({onLogin}) {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [loading,setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password) {
      alert("Введи email и пароль");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({email: email.trim(), password});
    setLoading(false);
    if (error) {
      alert("Ошибка входа: " + error.message);
      return;
    }
    onLogin && onLogin();
  };

  return <main className="screen" style={{minHeight:"100vh",display:"grid",placeItems:"center"}}>
    <div className="card" style={{maxWidth:460,width:"100%"}}>
      <div className="card dark"><h2>Вход в CRM Real Estate</h2><p>Войди по email и паролю, который выдал администратор тех отдела.</p></div>
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')signIn();}} />
      <Button className="full" onClick={signIn}>{loading ? "Входим..." : "Войти"}</Button>
      <p className="muted">Если доступ закрыт или email не найден в таблице users — CRM не откроется.</p>
    </div>
  </main>;
}

function Sidebar({page,setPage,role}) {
  const items = [["feed","Лента","⌂"],["clients","Канбан и клиенты","👥"],["calendar","Календарь","📅"],["properties","Вторичка","🏢"],["analytics","Аналитика","📊"],["help","Помощь менеджерам","🔔"],...(role === "Администратор тех отдел" ? [["access","Доступы","🔐"]] : []),["more","Ещё","☰"]];
  return <aside className="sidebar"><div className="logo"><div>♛</div><section><b>CRM Real Estate</b><span>Premium SaaS</span></section></div><div className="roleBox">{role}</div>{items.map(([id,label,icon])=><button key={id} onClick={()=>setPage(id)} className={cn("sideBtn", page===id && "active")}><span>{icon}</span>{label}</button>)}</aside>;
}

function Top({page,setPage,agencyName}) {
  const titles = {feed:"Лента новостей",clients:"Клиенты",calendar:"Календарь",properties:"Вторичка",analytics:"Аналитика",help:"Помощь менеджерам",access:"Доступы",more:"Еще"};
  return <div className="top"><div className="topLine"><div><p>♛ CRM Real Estate</p><h1>{titles[page]}</h1></div><button className="agencyTop" onClick={()=>setPage("more")}>{agencyName || "Моё агентство"}</button></div><div className="search">🔎 <input placeholder="Поиск по CRM..." /></div></div>;
}

function Bottom({page,setPage}) {
  const items = [["feed","Лента","⌂"],["clients","Клиенты","👥"],["calendar","Календарь","📅"],["properties","Объекты","🏢"],["more","Ещё","☰"]];
  return <nav className="bottom">{items.map(([id,label,icon])=><button key={id} className={page===id ? "active" : ""} onClick={()=>setPage(id)}><span>{icon}</span>{label}</button>)}</nav>;
}

function Feed({posts,setPosts,role,currentProfile}) {
  const isTech = role === "Администратор тех отдел";
  const authorName = currentProfile?.full_name || currentProfile?.name || currentProfile?.email || role || "CRM";
  const [open,setOpen] = useState(false);
  const [draft,setDraft] = useState({text:"",kind:"Фото",file:""});
  const [fileObj,setFileObj] = useState(null);
  const [viewer,setViewer] = useState(null);
  const [editPost,setEditPost] = useState(null);
  const [commentText,setCommentText] = useState({});

  async function uploadToNewsMedia(newsId) {
    if (draft.kind === "Ссылка") {
      if (!draft.file.trim()) return null;
      const { data, error } = await supabase
        .from("news_media")
        .insert({news_id: Number(newsId), media_type: "Ссылка", media_url: null, file_name: null, link_url: normalizeUrl(draft.file.trim())})
        .select()
        .single();
      if (error) { alert("Ошибка сохранения ссылки: " + error.message); return null; }
      return data;
    }

    if (!fileObj) return null;
    const originalName = fileObj.name || "upload";
    const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${newsId}/${safeName}`;
    const detectedKind = fileObj.type?.startsWith("video") ? "Видео" : fileObj.type?.startsWith("image") ? "Фото" : draft.kind;

    const upload = await uploadToFirstAvailableBucket(["news-media","news_media","news-media-bucket"], path, fileObj, {
      upsert: true,
      contentType: fileObj.type || undefined
    });
    if (upload.error) { alert("Ошибка загрузки файла: " + upload.error.message); return null; }

    const publicUrl = upload.publicUrl;
    const { data, error } = await supabase
      .from("news_media")
      .insert({news_id: Number(newsId), media_type: detectedKind, media_url: publicUrl, file_name: originalName, link_url: null})
      .select()
      .single();

    if (error) { alert("Файл загрузился, но не записался в таблицу: " + error.message); return null; }
    return data;
  }

  const publish = async () => {
    if (!draft.text.trim() && !draft.file.trim() && !fileObj) return;

    const { data: news, error } = await supabase
      .from("news")
      .insert({
        title: draft.text ? draft.text.slice(0,80) : "Публикация",
        content: draft.text || "",
        likes_count: 0,
        comments_count: 0
      })
      .select()
      .single();

    if (error) { alert("Ошибка сохранения публикации: " + error.message); return; }

    const media = await uploadToNewsMedia(news.id);
    const mediaUrl = media?.link_url || media?.media_url || "";
    const kind = media?.media_type || (mediaUrl ? (fileObj?.type?.startsWith("video") ? "Видео" : draft.kind) : "Текст");

    setPosts(prev => [{
      id: String(news.id),
      author: "Администратор",
      date: news.created_at ? new Date(news.created_at).toLocaleString() : new Date().toLocaleString(),
      text: news.content || "",
      kind,
      file: mediaUrl,
      likes: 0,
      comments: []
    }, ...prev]);

    setDraft({text:"",kind:"Фото",file:""});
    setFileObj(null);
    setOpen(false);
  };

  const saveEdit = async () => {
    if (!editPost) return;
    const { error } = await supabase
      .from("news")
      .update({title: editPost.text ? editPost.text.slice(0,80) : "Публикация", content: editPost.text || ""})
      .eq("id", Number(editPost.id));
    if (error) { alert("Ошибка редактирования публикации: " + error.message); return; }
    setPosts(prev => prev.map(p => String(p.id) === String(editPost.id) ? {...p, text: editPost.text || ""} : p));
    setEditPost(null);
  };

  const deletePost = async (post) => {
    if (!isTech) return;
    if (!window.confirm("Удалить публикацию?")) return;
    await supabase.from("news_media").delete().eq("news_id", Number(post.id));
    await supabase.from("comments").delete().eq("news_id", Number(post.id));
    await supabase.from("comments").delete().eq("post_id", Number(post.id));
    await supabase.from("comments").delete().eq("entity_id", String(post.id));
    const { error } = await supabase.from("news").delete().eq("id", Number(post.id));
    if (error) { alert("Ошибка удаления публикации: " + error.message); return; }
    setPosts(prev => prev.filter(p => String(p.id) !== String(post.id)));
  };

  const toggleLike = async (post) => {
    const likes = Number(post.likes || 0) + 1;
    setPosts(prev => prev.map(p => String(p.id) === String(post.id) ? {...p, likes} : p));
    await supabase.from("news").update({likes_count: likes}).eq("id", Number(post.id));
  };

  async function insertComment(postId, text) {
    const variants = [
      {news_id: Number(postId), content: text, author_name: authorName},
      {news_id: Number(postId), text, author: authorName},
      {post_id: Number(postId), text, author: authorName},
      {entity_type: "news", entity_id: String(postId), content: text, author_name: authorName},
      {entity_type: "news", entity_id: String(postId), text, author: authorName}
    ];

    for (const payload of variants) {
      const { data, error } = await supabase.from("comments").insert(payload).select().single();
      if (!error) return data;
    }
    return null;
  }

  const addComment = async (post) => {
    const text = (commentText[post.id] || "").trim();
    if (!text) return;
    const saved = await insertComment(post.id, text);
    if (!saved) {
      alert("Комментарий не записался. В таблице comments нужны колонки news_id + content или news_id + text.");
      return;
    }
    setPosts(prev => prev.map(p => String(p.id) === String(post.id) ? {...p, comments:[...(p.comments || []), {text, author_name: authorName}]} : p));
    setCommentText(prev => ({...prev, [post.id]: ""}));
    await supabase.from("news").update({comments_count: (post.comments || []).length + 1}).eq("id", Number(post.id));
  };

  const renderPostMedia = (post) => {
    const file = post.file || "";
    if (!file) return null;

    const lowerKind = String(post.kind || "").toLowerCase();
    const looksLikeLink = /^https?:\/\//i.test(file) && !lowerKind.includes("фото") && !lowerKind.includes("видео") && !lowerKind.includes("файл");
    if (lowerKind.includes("ссылка") || looksLikeLink) {
      return <a
        className="link"
        href={normalizeUrl(file)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e)=>e.stopPropagation()}
        style={{display:"inline-flex",marginTop:10}}
      >
        🔗 Открыть ссылку
      </a>;
    }

    return <Media kind={post.kind} name={file} onOpen={setViewer}/>;
  };

  return <main className="screen"><div className="feedList">
    <div className="card dark hero">
      <div><h2>Лента новостей</h2><p>Внутренняя соцсеть агентства: фото, видео, файлы, ссылки, лайки и комментарии.</p></div>
      {isTech && <Button onClick={()=>setOpen(true)}>+ Новая публикация</Button>}
    </div>

    {open && isTech && <div className="card composer">
      <div className="row"><h2>Новая публикация</h2><button className="icon" onClick={()=>setOpen(false)}>×</button></div>
      <textarea className="input" placeholder="Текст публикации..." value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})}/>
      <div className="grid4">{["Фото","Видео","Файл","Ссылка"].map(k=><Button key={k} variant={draft.kind===k ? "primary" : "soft"} onClick={()=>{setDraft({...draft,kind:k,file:""});setFileObj(null);}}>{k}</Button>)}</div>
      {draft.kind === "Ссылка" ? (
        <input className="input" placeholder="Вставьте ссылку" value={draft.file} onChange={e=>setDraft({...draft,file:e.target.value})}/>
      ) : (
        <input className="input" type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={e=>setFileObj(e.target.files?.[0] || null)}/>
      )}
      {(draft.kind === "Ссылка" ? draft.file : fileObj?.name) && <Media kind={draft.kind} name={draft.kind === "Ссылка" ? draft.file : fileObj?.name || ""}/>}
      <Button className="full" onClick={publish}>Опубликовать</Button>
    </div>}

    {posts.map(post=><article className="card post" key={post.id}>
      <div className="postHead"><div>A</div><section><b>{post.author}</b><span>{post.date}</span></section></div>
      {post.text && <p>{post.text}</p>}
      {renderPostMedia(post)}

      <div className="actions">
        <button className="chip" onClick={()=>toggleLike(post)}>♡ {post.likes}</button>
        <span>💬 {(post.comments || []).length}</span>
        {isTech && <button className="chip" onClick={()=>setEditPost(post)}>✎ Редактировать</button>}
        {isTech && <button className="chip" onClick={()=>deletePost(post)}>🗑 Удалить</button>}
      </div>

      <div className="comments">
        {(post.comments || []).map((c,i)=><p key={i}><b>{typeof c === "string" ? "Комментарий" : commentAuthorName(c)}:</b> {typeof c === "string" ? c : (c.text || c.content || "")}</p>)}
        <div className="row">
          <input className="input" placeholder="Написать комментарий..." value={commentText[post.id] || ""} onChange={e=>setCommentText({...commentText,[post.id]:e.target.value})}/>
          <Button variant="soft" onClick={()=>addComment(post)}>Отправить</Button>
        </div>
      </div>
    </article>)}

    {editPost && isTech && <Modal onClose={()=>setEditPost(null)} wide>
      <div className="row"><h2>Редактировать публикацию</h2><button className="icon" onClick={()=>setEditPost(null)}>×</button></div>
      <textarea className="input" value={editPost.text || ""} onChange={e=>setEditPost({...editPost,text:e.target.value})}/>
      <Button className="full" onClick={saveEdit}>Сохранить изменения</Button>
    </Modal>}

    {viewer && <Modal onClose={()=>setViewer(null)} wide>
      <div className="row"><h2>{viewer.kind}</h2><button className="icon" onClick={()=>setViewer(null)}>×</button></div>
      {String(viewer.kind).toLowerCase().includes("фото") && <img src={viewer.name} alt="Фото" style={{width:"100%",borderRadius:20}} />}
      {String(viewer.kind).toLowerCase().includes("видео") && <video src={viewer.name} controls autoPlay style={{width:"100%",borderRadius:20}} />}
    </Modal>}
  </div></main>;
}



function Clients({leads,setLeads,onOpen,currentProfile,role,users}) {
  const [stage,setStage] = useState("Все");
  const [phone,setPhone] = useState(null);
  const [managerFilter,setManagerFilter] = useState("Все");
  const isManager = role === "Менеджер по продажам";
  const canFilterManagers = role === "Администратор тех отдел" || role === "Администратор директор";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const managerOptions = managerUsers.map(u => ({name: managerDisplayName(u), email: u.email || ""}));

  const create = () => {
    const managerName = currentProfile?.full_name || currentProfile?.name || "Ответственный менеджер";
    const managerEmail = currentProfile?.email || "";
    const lead = {
      id:"L-"+Date.now().toString().slice(-6),
      agency_id: currentProfile?.agency_id ? String(currentProfile.agency_id) : "",
      name:"",
      phone:"+380",
      source:sources[0],
      status:stages[0],
      notes:"",
      nextContact:"",
      manager: managerName,
      manager_email: managerEmail,
      history:[`Новый клиент. Ответственный: ${managerName}`]
    };
    onOpen(lead);
  };

  const filteredLeads = leads.filter(l => {
    const stageOk = stage === "Все" || l.status === stage;
    const managerOk = !canFilterManagers || managerFilter === "Все" || String(l.manager_email || "") === String(managerFilter) || String(l.manager || "") === String(managerFilter);
    return stageOk && managerOk;
  });

  const groups = stage === "Все" ? stages : [stage];

  const move = (lead, targetStage=null) => {
    const next = targetStage || stages[Math.min(stages.indexOf(lead.status)+1, stages.length-1)];
    setLeads(prev => prev.map(l => l.id===lead.id ? {...l,status:next,history:[...(l.history || []),`Перемещен в стадию: ${next}`]} : l));
  };

  return <main className="screen">
    <div className="row">
      <Button onClick={create}>+ Создать клиента</Button>
      <select className="input" style={{maxWidth:280}} value={stage} onChange={e=>setStage(e.target.value)}>
        <option>Все</option>
        {stages.map(s=><option key={s}>{s}</option>)}
      </select>
      {canFilterManagers && <select className="input" style={{maxWidth:320}} value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}>
        <option value="Все">Все менеджеры</option>
        {managerOptions.map(m=><option key={m.email || m.name} value={m.email || m.name}>{m.name}{m.email ? ` — ${m.email}` : ""}</option>)}
      </select>}
    </div>

    <div className="kanban" style={{overflowX:"auto", alignItems:"flex-start", paddingBottom:12}}>
      {groups.map(s=>{
        const list = filteredLeads.filter(l => l.status === s);
        return <section className="kanbanCol" key={s} style={{minWidth:300, maxWidth:360, flex:"0 0 330px"}}
          onDragOver={e=>e.preventDefault()}
          onDrop={e=>{
            const id = e.dataTransfer.getData("leadId");
            const lead = leads.find(l=>String(l.id)===String(id));
            if (lead) move(lead, s);
          }}>
          <div className="kanbanHead"><b>{s}</b>{badge(list.length,"gold")}</div>
          {list.map(l=><div className="lead" key={l.id} draggable onDragStart={e=>e.dataTransfer.setData("leadId", l.id)}>
            <div className="leadTop"><section><b>{l.name || "Без имени"}</b><span>{l.id} · {l.source}</span></section>{badge(l.status,"dark")}</div>
            <div className="phone"><b>☎ {l.phone}</b><p>{l.notes || "Без заметки"}</p><p className="muted">Ответственный: {l.manager || "не назначен"}</p></div>
            <div className="grid4">
              <Button variant="soft" onClick={()=>setPhone(l.phone)}>☎</Button>
              <Button variant="purple" onClick={()=>setPhone(l.phone)}>V</Button>
              <Button variant="green" onClick={()=>setPhone(l.phone)}>W</Button>
              <Button onClick={()=>onOpen(l)}>✎</Button>
            </div>
            <Button className="full" onClick={()=>move(l)}>Следующий этап →</Button>
          </div>)}
        </section>
      })}
    </div>

    {phone && <Contact phone={phone} onClose={()=>setPhone(null)}/>} 
  </main>;
}


function Contact({phone,onClose}) {
  const digits = String(phone || "").replace(/[^0-9]/g,"");
  const plusPhone = "+" + digits;
  const viberEncoded = encodeURIComponent(plusPhone);
  return <Modal onClose={onClose}>
    <div className="row"><h2>Связь с клиентом</h2><button className="icon" onClick={onClose}>×</button></div>
    <a className="btn primary full" href={`tel:${plusPhone}`}>Позвонить</a>
    <a className="btn soft full" href={`sms:${plusPhone}`}>SMS</a>
    <a className="btn purple full" href={`viber://chat?number=${viberEncoded}`}>Viber чат</a>
    <a className="btn purple full" href={`viber://add?number=${digits}`}>Viber открыть контакт</a>
    <a className="btn green full" href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
    <div className="card amber">Если Viber на компьютере не открылся, проверь Viber Desktop. На телефоне ссылка откроет приложение.</div>
  </Modal>;
}



function LeadModal({lead,setLeads,setEvents,setHelp,onClose,role,users,currentProfile}) {
  const [local,setLocal] = useState(lead);
  const [event,setEvent] = useState({type:"Звонок", date:"2026-05-24", time:"12:00", title:"", reminder:60, sound:"classic"});
  const [question,setQuestion] = useState("");
  const [workComment,setWorkComment] = useState("");
  const isTech = role === "Администратор тех отдел";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const managerOptions = managerUsers.length
    ? managerUsers.map(u => ({name: u.full_name || u.name || u.email, email: u.email || ""}))
    : [{name: local.manager || currentProfile?.full_name || "Ответственный менеджер", email: local.manager_email || currentProfile?.email || ""}];
  const changeManager = (email) => {
    const selected = managerOptions.find(m => m.email === email) || managerOptions[0];
    setLocal(prev => ({
      ...prev,
      manager: selected?.name || "",
      manager_email: selected?.email || "",
      history:[...(prev.history || []), `Ответственный менеджер изменён: ${selected?.name || ""}`]
    }));
  };

  const save = () => {
    const savedLocal = {...local, history:[...(local.history || []), `Сохранены изменения: ${new Date().toLocaleString()}`]};
    setLeads(prev=>{
      const exists = prev.some(l=>String(l.id)===String(local.id));
      return exists ? prev.map(l=>String(l.id)===String(local.id)?savedLocal:l) : [savedLocal, ...prev];
    });
    onClose();
  };

  const addWorkComment = () => {
    const text = workComment.trim();
    if (!text) return;

    const record = `Комментарий ${currentProfile?.full_name || currentProfile?.name || currentProfile?.email || "менеджера"} ${new Date().toLocaleString()}: ${text}`;
    setLocal(prev => ({...prev, history:[...(prev.history || []), record]}));
    setLeads(prev => prev.map(l => l.id === local.id ? {...l, history:[...(l.history || []), record]} : l));
    setWorkComment("");
  };

  const addEvent = () => {
    setEvents(prev=>[{id:"EV-"+Date.now(),leadId:local.id,client:local.name,type:event.type,title:event.title || `${event.type} — ${local.name}`,date:event.date,time:event.time,reminder:Number(event.reminder)||60,sound:event.sound||"classic",notified:false,manager_email:currentProfile?.email || local.manager_email || "",manager_name:currentProfile?.full_name || currentProfile?.name || local.manager || ""},...prev]);
    setLocal({...local,nextContact:`${event.date} ${event.time}`,history:[...(local.history || []),`Добавлено событие: ${event.type}`]});
  };

  const ask = () => {
    if(!question) return;
    const request = {id:"H-"+Date.now(),leadId:local.id,client:local.name,manager:local.manager,text:question,reply:"",status:"open"};
    setHelp(prev=>[request,...prev]);
    setLocal(prev => ({...prev, history:[...(prev.history || []), `Вопрос директору: ${question}`]}));
    setLeads(prev => prev.map(l => l.id === local.id ? {...l, history:[...(l.history || []), `Вопрос директору: ${question}`]} : l));
    playBeep();
    setQuestion("");
  };

  return <Modal onClose={onClose} wide>
    <div className="row"><section><label>Имя клиента</label><input className="titleInput" value={local.name} onChange={e=>setLocal({...local,name:e.target.value})}/><p className="muted">{local.id}</p></section><button className="icon" onClick={onClose}>×</button></div>

    <div className="formGrid">
      <Field label="Телефон"><input value={local.phone} onChange={e=>setLocal({...local,phone:e.target.value})}/></Field>
      <Field label="Источник"><select value={local.source} onChange={e=>setLocal({...local,source:e.target.value})}>{sources.map(s=><option key={s}>{s}</option>)}</select></Field>
      <Field label="Статус"><select value={local.status} onChange={e=>setLocal({...local,status:e.target.value})}>{stages.map(s=><option key={s}>{s}</option>)}</select></Field>
      <Field label="Следующий контакт"><input value={local.nextContact} onChange={e=>setLocal({...local,nextContact:e.target.value})}/></Field>
      <Field label="Ответственный менеджер">
        {isTech ? <select value={local.manager_email || ""} onChange={e=>changeManager(e.target.value)}>
          <option value="">Выбери менеджера</option>
          {managerOptions.map(m=><option key={m.email || m.name} value={m.email}>{m.name} {m.email ? `— ${m.email}` : ""}</option>)}
        </select> : <input value={local.manager || ""} disabled />}
      </Field>
    </div>

    <Field label="Заметки менеджера"><textarea value={local.notes} onChange={e=>setLocal({...local,notes:e.target.value})}/></Field>

    <div className="card">
      <h3>История работы с клиентом</h3>
      <textarea className="input" placeholder="Написать комментарий себе по клиенту..." value={workComment} onChange={e=>setWorkComment(e.target.value)}/>
      <Button className="full" onClick={addWorkComment}>Добавить комментарий в историю</Button>
      {(local.history || []).map((h,i)=><p className="muted" key={i}>• {h}</p>)}
    </div>

    <div className="card inner">
      <h3>Календарь клиента</h3>
      <div className="grid4">{eventTypes.map(t=><Button key={t} variant={event.type===t?"primary":"soft"} onClick={()=>setEvent({...event,type:t})}>{t}</Button>)}</div>
      <div className="grid3"><Field label="Дата следующего касания"><input className="input" type="date" value={event.date} onChange={e=>setEvent({...event,date:e.target.value})}/></Field><Field label="Время"><input className="input" type="time" value={event.time} onChange={e=>setEvent({...event,time:e.target.value})}/></Field><Field label="Название"><input className="input" placeholder="Название" value={event.title} onChange={e=>setEvent({...event,title:e.target.value})}/></Field></div>
      <div className="grid2"><Field label="Напомнить за"><select className="input" value={event.reminder} onChange={e=>setEvent({...event,reminder:e.target.value})}><option value="5">5 минут</option><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="120">2 часа</option><option value="1440">1 день</option></select></Field><Field label="Звук"><select className="input" value={event.sound} onChange={e=>setEvent({...event,sound:e.target.value})}><option value="classic">Классический</option><option value="soft">Мягкий</option><option value="double">Двойной</option></select></Field></div>
      <Button className="full" onClick={addEvent}>Сохранить событие</Button>
    </div>

    <div className="card amber">
      <h3>Помощь директора</h3>
      <textarea className="input" placeholder="Вопрос директору..." value={question} onChange={e=>setQuestion(e.target.value)}/>
      <Button className="full" onClick={ask}>Помощь менеджеру</Button>
    </div>

    <Button className="full sticky" onClick={save}>Сохранить клиента</Button>
  </Modal>;
}

function Calendar({events,setEvents,leads,setLeads,onOpenLead,currentProfile,role}) {
  const [view,setView] = useState("month");
  const now = new Date();
  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth());
  const [open,setOpen] = useState(null);
  const days = monthGrid(year,month);
  const monthKey = `${year}-${String(month+1).padStart(2,"0")}`;
  const myEmail = String(currentProfile?.email || "").toLowerCase();
  const myName = currentProfile?.full_name || currentProfile?.name || currentProfile?.email || "";
  const isTech = role === "Администратор тех отдел";
  const isDirector = role === "Администратор директор";
  const canModifyEvent = (ev) => {
    if (!ev) return false;
    if (isTech || isDirector) return true;
    const owner = eventOwnerEmail(ev);
    return !owner || owner === myEmail;
  };

  const saveEvent = () => {
    if (!open) return;
    if (open.id && !canModifyEvent(open)) {
      alert("Редактировать можно только свои события");
      return;
    }
    const lead = leads.find(l=>String(l.id)===String(open.leadId)) || leads[0];
    const ev = {
      ...open,
      id: open.id || "EV-"+Date.now(),
      client: lead?.name || "",
      title: open.title || `${open.type} — ${lead?.name || "клиент"}`,
      manager_email: open.manager_email || currentProfile?.email || "",
      manager_name: open.manager_name || myName,
      notified: false
    };
    setEvents(prev => open.id ? prev.map(e=>String(e.id)===String(open.id)?ev:e) : [ev,...prev]);
    setOpen(null);
  };

  const deleteEvent = () => {
    if (!open?.id) return;
    if (!canModifyEvent(open)) {
      alert("Удалять можно только свои события");
      return;
    }
    if (!window.confirm("Удалить событие?")) return;
    setEvents(prev => prev.filter(e => String(e.id) !== String(open.id)));
    setOpen(null);
  };

  const create = (date, time="12:00") => setOpen({
    leadId: leads[0]?.id || "",
    type:"Звонок",
    title:"",
    date,
    time,
    reminder:60,
    sound:"classic",
    notified:false,
    manager_email: currentProfile?.email || "",
    manager_name: myName
  });

  const selectedEventLead = open ? leads.find(l=>String(l.id)===String(open.leadId)) : null;
  const weekDays = days.slice(0,7);
  const dayIso = `${year}-${String(month+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      events.forEach(ev => {
        if (!ev.date || !ev.time || ev.notified) return;
        const start = new Date(`${ev.date}T${ev.time}:00`).getTime();
        const remindMs = (Number(ev.reminder) || 60) * 60 * 1000;
        if (current >= start - remindMs && current <= start + 60 * 1000) {
          playReminderSound(ev.sound || "classic");
          alert(`Напоминание: ${ev.title || ev.type}\nДата следующего касания: ${ev.date} ${ev.time}`);
          setEvents(prev => prev.map(x => x.id === ev.id ? {...x, notified:true} : x));
        }
      });
    }, 30000);
    return () => clearInterval(timer);
  }, [events]);

  return <main className="screen" style={{maxWidth:"100%"}}>
    <div className="card dark">
      <div className="row">
        <section>
          <h2>Календарь</h2>
          <p>Звонки, встречи, показы и задачи. Менеджер может редактировать и удалять свои события.</p>
        </section>
        <Button variant="soft" onClick={()=>playReminderSound("classic")}>Проверить звук</Button>
      </div>
    </div>

    <div className="card">
      <div className="row">
        <div className="grid2" style={{maxWidth:520}}>
          <select className="input" value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:10},(_,i)=>new Date().getFullYear()-1+i).map(y=><option key={y}>{y}</option>)}</select>
          <select className="input" value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>{m}</option>)}</select>
        </div>
        <div className="grid4" style={{maxWidth:560}}>{[["year","Год"],["month","Месяц"],["week","Неделя"],["day","День"]].map(([id,label])=><Button key={id} variant={view===id?"primary":"soft"} onClick={()=>setView(id)}>{label}</Button>)}</div>
      </div>
    </div>

    {view==="year" && <div className="card"><h3>{year} год</h3><div className="yearGrid">{months.map((m,i)=><button className="monthBox" key={m} onClick={()=>{setMonth(i);setView("month")}}><b>{m}</b><span>{events.filter(e=>String(e.date || "").startsWith(`${year}-${String(i+1).padStart(2,"0")}`)).length} событий</span></button>)}</div></div>}

    {view==="month" && <div className="card">
      <div className="row"><h3>{months[month]} {year}</h3>{badge(events.filter(e=>String(e.date || "").startsWith(monthKey)).length+" событий","gold")}</div>
      <div className="week">{week.map(w=><b key={w}>{w}</b>)}</div>
      <div className="calgrid">{days.map(d=>{const evs=events.filter(e=>e.date===d.iso);return <button key={d.iso} className={cn("day",!d.current&&"mutedDay")} onClick={()=>create(d.iso)}><b>{d.day}</b>{evs.slice(0,3).map(e=><span className="mini" key={e.id}>{e.time} {e.title}</span>)}</button>})}</div>
    </div>}

    {view==="week" && <div className="card"><h3>Неделя</h3><div className="grid2">{weekDays.map(d=><button className="weekRow" key={d.iso} onClick={()=>create(d.iso)}><b>{d.iso}</b><span>{events.filter(e=>e.date===d.iso).length} событий</span></button>)}</div></div>}

    {view==="day" && <div className="card"><h3>День · {dayIso}</h3>{["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"].map(t=>{const evs = events.filter(e=>e.date===dayIso && e.time===t);return <button className="weekRow" key={t} onClick={()=>create(dayIso,t)}><b>{t}</b><span>{evs.length ? evs.map(e=>e.title).join(", ") : "добавить событие"}</span></button>})}</div>}

    <div className="grid2">
      {events.filter(e=>!monthKey || String(e.date || "").startsWith(monthKey)).map(e=><div className="card event" key={e.id} onClick={()=>setOpen(e)}>
        <div className="row"><section><b>{e.title}</b><p className="muted"><b>Дата следующего касания:</b> {e.date} · {e.time}<br/>{e.type}<br/>Ответственный: {e.manager_name || "—"}</p></section>{badge(e.reminder+" мин","gold")}</div>
        <p className="muted">{e.client}</p>
      </div>)}
    </div>

    {open && <Modal onClose={()=>setOpen(null)} wide>
      <div className="row"><h2>Событие</h2><button className="icon" onClick={()=>setOpen(null)}>×</button></div>
      {!canModifyEvent(open) && <div className="card amber">Это событие создал другой менеджер. Можно смотреть, но нельзя редактировать или удалять.</div>}
      <input className="input" placeholder="Название" disabled={!canModifyEvent(open)} value={open.title} onChange={e=>setOpen({...open,title:e.target.value})}/>
      <div className="grid4">{eventTypes.map(t=><Button key={t} disabled={!canModifyEvent(open)} variant={open.type===t?"primary":"soft"} onClick={()=>setOpen({...open,type:t})}>{t}</Button>)}</div>
      <Field label="Клиент"><select className="input" disabled={!canModifyEvent(open)} value={open.leadId} onChange={e=>setOpen({...open,leadId:e.target.value})}>{leads.map(l=><option key={l.id} value={l.id}>{l.name} · {l.phone} · {l.status}</option>)}</select></Field>
      {selectedEventLead && <div className="card"><h3>{selectedEventLead.name}</h3><p><b>Телефон:</b> {selectedEventLead.phone}</p><p><b>Статус:</b> {selectedEventLead.status}</p><p><b>Источник:</b> {selectedEventLead.source}</p><p><b>Заметки:</b> {selectedEventLead.notes || "Нет заметок"}</p><Button className="full" variant="primary" onClick={()=>onOpenLead && onOpenLead(selectedEventLead)}>ОТКРЫТЬ ПОЛНУЮ КАРТОЧКУ КЛИЕНТА</Button>{(selectedEventLead.history || []).slice(-5).map((h,i)=><p className="muted" key={i}>• {h}</p>)}</div>}
      <div className="grid2"><Field label="Дата следующего касания"><input className="input" disabled={!canModifyEvent(open)} type="date" value={open.date} onChange={e=>setOpen({...open,date:e.target.value})}/></Field><Field label="Время"><input className="input" disabled={!canModifyEvent(open)} type="time" value={open.time} onChange={e=>setOpen({...open,time:e.target.value})}/></Field></div>
      <div className="grid2"><Field label="Напомнить за"><select className="input" disabled={!canModifyEvent(open)} value={open.reminder || 60} onChange={e=>setOpen({...open,reminder:Number(e.target.value)})}><option value="5">5 минут</option><option value="15">15 минут</option><option value="30">30 минут</option><option value="60">1 час</option><option value="120">2 часа</option><option value="1440">1 день</option></select></Field><Field label="Звук напоминания"><select className="input" disabled={!canModifyEvent(open)} value={open.sound || "classic"} onChange={e=>setOpen({...open,sound:e.target.value})}><option value="classic">Классический</option><option value="soft">Мягкий</option><option value="double">Двойной</option></select></Field></div>
      <div className="grid2">{canModifyEvent(open) && <Button className="full" onClick={saveEvent}>Сохранить событие</Button>}{open.id && canModifyEvent(open) && <Button className="full" variant="danger" onClick={deleteEvent}>Удалить событие</Button>}</div>
    </Modal>}
  </main>;
}

function Properties({properties,setProperties,onOpen,users,currentProfile}) {
  const [type,setType] = useState("Все");
  const [district,setDistrict] = useState("Все");

  const filtered = properties.filter(p =>
    (type === "Все" || p.type === type) &&
    (district === "Все" || p.district === district)
  );

  const create = () => {
    const p = {
      id: "P-" + Date.now(),
      title: "",
      property_manager_name: currentProfile?.full_name || currentProfile?.name || "",
      property_manager_email: currentProfile?.email || "",
      property_manager_phone: currentProfile?.phone || "",
      type: types[0],
      district: districts[0],
      status: "Актуален",
      price: "",
      area: "",
      floor: "",
      owner: "",
      ownerPhone: "+380",
      description: "",
      media: [],
      history: []
    };

    onOpen(p);
  };

  return <main className="screen">
    <Button onClick={create}>+ Добавить объект</Button>

    <div className="chips">
      {["Все", ...types].map(t =>
        <button key={t} className={cn("chip", type===t && "active")} onClick={()=>setType(t)}>{t}</button>
      )}
    </div>

    <div className="chips">
      {["Все", ...districts].map(d =>
        <button key={d} className={cn("chip", district===d && "active")} onClick={()=>setDistrict(d)}>{d}</button>
      )}
    </div>

    <div className="grid2">
      {filtered.map(p => {
        const firstMedia = (p.media || [])[0];

        return <div className="card" key={p.id} onClick={()=>onOpen(p)}>
          {firstMedia ? <Media kind={firstMedia.kind} name={firstMedia.url} small /> : <Media kind="Фото" name="" small />}
          <h3>{p.title || "Без названия"}</h3>
          <p>{p.type} · {p.district}</p>
          <p><b>{money(p.price)}</b> · {p.area || 0} м²</p>
          <span className="badge">{(p.media || []).length} медиа</span><p className="muted">Ответственный: {p.property_manager_name || p.manager || "не назначен"}</p>
        </div>;
      })}
    </div>
  </main>;
}

function PropertyModal({property,setProperties,onClose,users,currentProfile,role}) {
  const [local,setLocal] = useState(property);
  const [mediaKind,setMediaKind] = useState("Фото");
  const [mediaFile,setMediaFile] = useState(null);
  const [mediaFiles,setMediaFiles] = useState([]);
  const [viewer,setViewer] = useState(null);
  const [presentationUrl,setPresentationUrl] = useState("");
  const isTech = role === "Администратор тех отдел";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const propertyManager = managerUsers.find(u => String(u.email || "") === String(local.property_manager_email || "")) || null;
  const currentEmail = String(currentProfile?.email || "").toLowerCase();
  const creatorEmail = String(local.created_by_email || local.property_manager_email || "").toLowerCase();
  const isCreator = !creatorEmail || creatorEmail === currentEmail;
  const canEditObject = isCreator;
  const canManageProperty = isTech;
  const canDeleteObject = isTech;
  const fieldDisabled = !canEditObject;

  const payloadFromLocal = () => ({
    title: local.title || "Новый объект",
    property_type: local.type || types[0],
    district: local.district || districts[0],
    status: local.status || "Актуален",
    price: Number(local.price) || 0,
    area: Number(local.area) || 0,
    floor: parseInt(local.floor) || null,
    owner_name: local.owner || "",
    owner_phone: local.ownerPhone || "",
    description: local.description || "",
    property_manager_name: local.property_manager_name || local.manager || "",
    property_manager_email: local.property_manager_email || "",
    property_manager_phone: local.property_manager_phone || "",
    olx_status: local.olx_status || null,
    ownership_right: !!local.ownership_right,
    assignment_allowed: !!local.assignment_allowed,
    state_programs: !!local.state_programs,
    created_by_email: local.created_by_email || currentProfile?.email || null,
    created_by_name: local.created_by_name || currentProfile?.full_name || currentProfile?.name || null
  });

  async function saveObject(closeAfter = false) {
    const payload = payloadFromLocal();
    const isNew = String(local.id || "").startsWith("P-") || !Number(local.id);
    let savedId = Number(local.id);

    if (isNew) {
      const { data, error } = await supabase
        .from("properties")
        .insert(payload)
        .select()
        .single();

      if (error) {
        alert("Ошибка создания объекта: " + error.message);
        return null;
      }

      savedId = data.id;
    } else {
      const { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", savedId);

      if (error) {
        alert("Ошибка сохранения объекта: " + error.message);
        return null;
      }
    }

    const saved = {
      ...local,
      id: String(savedId),
      media: local.media || [],
      property_manager_name: local.property_manager_name || local.manager || "",
      property_manager_email: local.property_manager_email || "",
      property_manager_phone: local.property_manager_phone || "",
      olx_status: local.olx_status || null,
      ownership_right: !!local.ownership_right,
      assignment_allowed: !!local.assignment_allowed,
      state_programs: !!local.state_programs,
      created_by_email: local.created_by_email || currentProfile?.email || "",
      created_by_name: local.created_by_name || currentProfile?.full_name || currentProfile?.name || ""
    };

    setLocal(saved);

    setProperties(prev => {
      const exists = prev.some(p => String(p.id) === String(local.id) || String(p.id) === String(savedId));
      if (!exists) return [saved, ...prev];

      return prev.map(p =>
        String(p.id) === String(local.id) || String(p.id) === String(savedId)
          ? saved
          : p
      );
    });

    if (closeAfter) onClose();
    return savedId;
  }

  const save = async () => {
    if (!canEditObject && !canManageProperty) { alert("Редактировать объект может только менеджер, который его создал. Ответственного менеджера меняет тех отдел."); return; }
    const id = await saveObject(false);
    if (id) alert("Объект сохранён");
  };

  async function addMedia() {
    const filesToUpload = mediaFiles.length ? mediaFiles : (mediaFile ? [mediaFile] : []);
    if (!filesToUpload.length) {
      alert("Сначала выбери фото или видео");
      return;
    }

    const propertyId = await saveObject(false);
    if (!propertyId) return;

    const uploadedItems = [];
    for (const currentFile of filesToUpload) {
    const detectedKind = currentFile.type?.startsWith("video") ? "Видео" : mediaKind;

    const originalName = currentFile.name || "upload";
    const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${propertyId}/${safeName}`;

    const { error: uploadError } = await supabase
      .storage
      .from("property-media")
      .upload(path, currentFile, {
        upsert: true,
        contentType: currentFile.type || undefined
      });

    if (uploadError) {
      alert("Ошибка загрузки файла: " + uploadError.message);
      return;
    }

    const publicUrl = supabase
      .storage
      .from("property-media")
      .getPublicUrl(path).data.publicUrl;

    const { data, error } = await supabase
      .from("property_media")
      .insert({
        property_id: propertyId,
        media_type: detectedKind,
        media_url: publicUrl,
        file_name: originalName
      })
      .select()
      .single();

    if (error) {
      alert("Файл загрузился, но не записался в таблицу: " + error.message);
      return;
    }

    const item = {
      kind: data.media_type || detectedKind,
      url: data.media_url || publicUrl,
      name: data.file_name || originalName
    };

    uploadedItems.push(item);
    }

    const updated = {
      ...local,
      id: String(propertyId),
      media: [...(local.media || []), ...uploadedItems]
    };

    setLocal(updated);

    setProperties(prev => {
      const exists = prev.some(p => String(p.id) === String(propertyId));
      if (!exists) return [updated, ...prev];

      return prev.map(p =>
        String(p.id) === String(propertyId)
          ? { ...p, ...updated }
          : p
      );
    });

    setMediaFile(null);
    setMediaFiles([]);
    alert(`Фото/видео сохранено: ${uploadedItems.length}`);
  }

  const mediaList = local.media || [];
  const currentMedia = viewer !== null ? mediaList[viewer] : null;

  const nextMedia = () => {
    setViewer(i => (i + 1) % mediaList.length);
  };

  const prevMedia = () => {
    setViewer(i => (i - 1 + mediaList.length) % mediaList.length);
  };

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight){
    const words = String(text || "").replace(/\n/g," \n ").split(" ");
    let line = "";
    let yy = y;
    for (const word of words){
      if (word === "\n"){
        ctx.fillText(line, x, yy);
        line = "";
        yy += lineHeight;
        continue;
      }
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && line){
        ctx.fillText(line, x, yy);
        line = word;
        yy += lineHeight;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
    return yy + lineHeight;
  }

  function dataUrlToBytes(dataUrl){
    const base64 = dataUrl.split(",")[1];
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function buildPdfFromJpegs(pages){
    const enc = new TextEncoder();
    const chunks = [];
    const offsets = [0];
    let length = 0;
    const add = part => {
      const bytes = typeof part === "string" ? enc.encode(part) : part;
      chunks.push(bytes);
      length += bytes.length;
    };
    const obj = (id, body) => {
      offsets[id] = length;
      add(`${id} 0 obj\n`);
      add(body);
      add(`\nendobj\n`);
    };

    add("%PDF-1.4\n%CRM Presentation\n");
    const pageCount = pages.length;
    const pageIds = pages.map((_,i)=>3 + i*3);
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(2, `<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] /Count ${pageCount} >>`);

    pages.forEach((page, i) => {
      const pageId = 3 + i*3;
      const contentId = pageId + 1;
      const imageId = pageId + 2;
      const w = 595;
      const h = 842;
      const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Im${i} Do\nQ`;
      obj(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      obj(contentId, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      offsets[imageId] = length;
      add(`${imageId} 0 obj\n`);
      add(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);
      add(page.bytes);
      add("\nendstream\nendobj\n");
    });

    const xrefAt = length;
    const maxObj = 2 + pageCount*3;
    add(`xref\n0 ${maxObj + 1}\n`);
    add("0000000000 65535 f \n");
    for(let i=1;i<=maxObj;i++) add(`${String(offsets[i] || 0).padStart(10,"0")} 00000 n \n`);
    add(`trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`);
    return new Blob(chunks, {type:"application/pdf"});
  }

  async function generateClientPresentation(){
    if (presentationUrl) URL.revokeObjectURL(presentationUrl);
    const canvas = document.createElement("canvas");
    canvas.width = 1240;
    canvas.height = 1754;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle = "#070707";
    ctx.fillRect(0,0,canvas.width,190);
    ctx.fillStyle = "#e1aa12";
    ctx.font = "bold 30px Arial";
    ctx.fillText("CRM Real Estate", 90, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 54px Arial";
    drawWrapped(ctx, local.title || "Презентация объекта", 90, 145, 1060, 58);

    let y = 270;
    ctx.fillStyle = "#111827";
    ctx.font = "bold 38px Arial";
    ctx.fillText("Информация об объекте", 90, y);
    y += 60;

    const rows = [
      ["Тип", local.type || "—"],
      ["Район", local.district || "—"],
      ["Статус", local.status || "—"],
      ["Цена", money(local.price)],
      ["Площадь", `${local.area || 0} м²`],
      ["Этаж", local.floor || "—"]
    ];

    ctx.font = "28px Arial";
    rows.forEach(([label,value]) => {
      ctx.fillStyle = "#6b7280";
      ctx.fillText(label + ":", 90, y);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 28px Arial";
      ctx.fillText(String(value), 350, y);
      ctx.font = "28px Arial";
      y += 48;
    });

    y += 35;
    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px Arial";
    ctx.fillText("Описание", 90, y);
    y += 45;
    ctx.font = "26px Arial";
    ctx.fillStyle = "#374151";
    y = drawWrapped(ctx, local.description || "Описание объекта не добавлено.", 90, y, 1060, 38);

    y += 30;
    ctx.fillStyle = "#b45309";
    ctx.font = "bold 24px Arial";
    drawWrapped(ctx, "Документ сформирован без персональных данных: собственник, телефон собственника и ответственный менеджер не указаны.", 90, y, 1060, 34);

    const pages = [{bytes:dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92)), width:canvas.width, height:canvas.height}];

    const imageMedia = (local.media || []).filter(m => String(m.kind || "").includes("Фото") && m.url).slice(0, 4);
    for (const m of imageMedia){
      const img = new Image();
      img.crossOrigin = "anonymous";
      const loaded = await new Promise(resolve => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = m.url;
      });
      const c = document.createElement("canvas");
      c.width = 1240;
      c.height = 1754;
      const x = c.getContext("2d");
      x.fillStyle = "#ffffff";
      x.fillRect(0,0,c.width,c.height);
      x.fillStyle = "#070707";
      x.fillRect(0,0,c.width,130);
      x.fillStyle = "#ffffff";
      x.font = "bold 42px Arial";
      x.fillText(local.title || "Фото объекта", 90, 82);
      if (loaded){
        const maxW = 1060, maxH = 1300;
        const scale = Math.min(maxW/img.width, maxH/img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        x.drawImage(img, (c.width-dw)/2, 250, dw, dh);
      } else {
        x.fillStyle = "#374151";
        x.font = "28px Arial";
        drawWrapped(x, "Фото не удалось встроить в PDF, но оно доступно в карточке объекта.", 90, 300, 1060, 40);
      }
      pages.push({bytes:dataUrlToBytes(c.toDataURL("image/jpeg", 0.92)), width:c.width, height:c.height});
    }

    const blob = buildPdfFromJpegs(pages);
    const fileName = `${Date.now()}-${(local.title || "object").replace(/[^a-zA-Zа-яА-Я0-9_-]+/g,"_")}.pdf`;
    const path = `presentations/${local.id || "new"}/${fileName}`;
    const uploaded = await uploadToFirstAvailableBucket(["property-presentations","property-media","property_media"], path, blob, {upsert:true, contentType:"application/pdf"});
    const url = uploaded?.publicUrl || URL.createObjectURL(blob);
    setPresentationUrl(url);
    alert(uploaded?.publicUrl ? "PDF-презентация создана. Публичная ссылка появилась под кнопкой." : "PDF создан локально. Для ссылки клиенту создай bucket property-presentations или используй property-media.");
  }

  return <Modal onClose={onClose} wide>
    <div className="propHero">
      <button className="icon heroClose" onClick={onClose}>×</button>
      <h2>{local.title || "Новый объект"}</h2>
      <p>{local.type} · {local.district} · {money(local.price)}</p>
    </div>

    <div className="grid2">
      <Field label="Название объекта"><input className="input" value={local.title || ""} onChange={e=>setLocal({...local,title:e.target.value})} disabled={fieldDisabled}/></Field>
      <Field label="Тип"><select className="input" value={local.type || types[0]} onChange={e=>setLocal({...local,type:e.target.value})} disabled={fieldDisabled}>{types.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Район"><select className="input" value={local.district || districts[0]} onChange={e=>setLocal({...local,district:e.target.value})} disabled={fieldDisabled}>{districts.map(d=><option key={d}>{d}</option>)}</select></Field>
      <Field label="Цена"><input className="input" value={local.price || ""} onChange={e=>setLocal({...local,price:e.target.value})} disabled={fieldDisabled}/></Field>
      <Field label="Площадь"><input className="input" value={local.area || ""} onChange={e=>setLocal({...local,area:e.target.value})} disabled={fieldDisabled}/></Field>
      <Field label="Этаж"><input className="input" value={local.floor || ""} onChange={e=>setLocal({...local,floor:e.target.value})} disabled={fieldDisabled}/></Field>
      <Field label="Собственник"><input className="input" value={local.owner || ""} onChange={e=>setLocal({...local,owner:e.target.value})} disabled={fieldDisabled}/></Field>
      <Field label="Телефон собственника"><input className="input" value={local.ownerPhone || ""} onChange={e=>setLocal({...local,ownerPhone:e.target.value})} disabled={fieldDisabled}/></Field>
      <Field label="Ответственный менеджер по объекту"><select className="input" value={local.property_manager_email || ""} disabled={!canManageProperty} onChange={e=>{const u=(users||[]).find(x=>String(x.email)===String(e.target.value)); setLocal({...local,property_manager_email:e.target.value,property_manager_name:managerDisplayName(u),property_manager_phone:u?.phone || ""})}}><option value="">Выбери менеджера</option>{managerUsers.map(u=><option key={u.email || u.id} value={u.email}>{managerDisplayName(u)} {u.phone ? `— ${u.phone}` : ""}</option>)}</select></Field>
    </div>
    <div className="card">
      <h3>Юридические отметки объекта</h3>
      <div className="grid3">
        <label className="chip"><input type="checkbox" disabled={fieldDisabled} checked={!!local.ownership_right} onChange={e=>setLocal({...local,ownership_right:e.target.checked})}/> Право собственности</label>
        <label className="chip"><input type="checkbox" disabled={fieldDisabled} checked={!!local.assignment_allowed} onChange={e=>setLocal({...local,assignment_allowed:e.target.checked})}/> Переуступка</label>
        <label className="chip"><input type="checkbox" disabled={fieldDisabled} checked={!!local.state_programs} onChange={e=>setLocal({...local,state_programs:e.target.checked})}/> Гос программы</label>
      </div>
    </div>
    {(local.property_manager_phone || propertyManager?.phone) && <div className="card amber"><b>Связь с ответственным менеджером:</b><div className="grid3"><a className="btn primary" href={`tel:${local.property_manager_phone || propertyManager?.phone}`}>Позвонить</a><a className="btn purple" href={`viber://chat?number=${encodeURIComponent(local.property_manager_phone || propertyManager?.phone)}`}>Viber</a><a className="btn green" href={`https://wa.me/${String(local.property_manager_phone || propertyManager?.phone).replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></div></div>}

    <Field label="Описание"><textarea className="input" value={local.description || ""} onChange={e=>setLocal({...local,description:e.target.value})} disabled={fieldDisabled}/></Field>

    <div className="grid2"><Button className="full" onClick={save}>Сохранить объект</Button><Button className="full" variant="soft" onClick={()=>{setLocal({...local,olx_status:"pending"}); alert("Заявка на публикацию в OLX отправлена тех отделу");}}>Опубликовать в OLX</Button></div>{local.olx_status === "pending" && isTech && <Button className="full" onClick={()=>{setLocal({...local,olx_status:"approved"}); alert("Тех отдел подтвердил публикацию. Для реальной публикации нужен OLX API токен.");}}>Подтвердить публикацию OLX</Button>} {canDeleteObject && !String(local.id || "").startsWith("P-") && <Button className="full" variant="danger" onClick={async()=>{if(!window.confirm("Удалить объект?")) return; await supabase.from("property_media").delete().eq("property_id", Number(local.id)); const {error}=await supabase.from("properties").delete().eq("id", Number(local.id)); if(error){alert("Ошибка удаления объекта: "+error.message); return;} setProperties(prev=>prev.filter(p=>String(p.id)!==String(local.id))); onClose();}}>Удалить объект</Button>}

    <div className="card amber">
      <h3>Презентация для клиента</h3>
      <p className="muted">PDF создаётся без персональных данных: без собственника, телефона собственника и ответственного менеджера.</p>
      <Button className="full" onClick={generateClientPresentation}>Отправить презентацию клиенту</Button>
      {presentationUrl && <div className="grid2" style={{marginTop:12}}>
        <a className="btn green full" href={presentationUrl} target="_blank" rel="noopener noreferrer" download={`${(local.title || "object").replace(/[^a-zA-Zа-яА-Я0-9_-]+/g,"_")}_presentation.pdf`}>Открыть / скачать PDF-презентацию</a>
        <Button variant="soft" onClick={async()=>{try{await navigator.clipboard.writeText(presentationUrl); alert("Ссылка скопирована");}catch{alert("Ссылка создана, но браузер не дал скопировать автоматически");}}}>Скопировать ссылку</Button>
      </div>}
    </div>

    <div className="card">
      <h3>Фото / видео объекта</h3>

      <div className="grid4">
        <Button variant={mediaKind==="Фото" ? "primary" : "soft"} onClick={()=>setMediaKind("Фото")}>Фото</Button>
        <Button variant={mediaKind==="Видео" ? "primary" : "soft"} onClick={()=>setMediaKind("Видео")}>Видео</Button>
      </div>

      <input className="input" type="file" multiple accept="image/*,video/*" onChange={e=>{const files=Array.from(e.target.files || []); setMediaFiles(files); setMediaFile(files[0] || null);}}/>
      <Button className="full" onClick={addMedia}>Добавить фото/видео</Button>

      <div className="grid2">
        {mediaList.map((m,i)=>
          <div key={i} onClick={()=>setViewer(i)} style={{cursor:"pointer"}}>
            <Media kind={m.kind} name={m.url} small />
          </div>
        )}
      </div>
    </div>

    {currentMedia && <Modal onClose={()=>setViewer(null)} wide>
      <div className="row">
        <button className="icon" onClick={prevMedia}>‹</button>
        <h2>{currentMedia.kind} {viewer + 1}/{mediaList.length}</h2>
        <button className="icon" onClick={nextMedia}>›</button>
        <button className="icon" onClick={()=>setViewer(null)}>×</button>
      </div>

      {currentMedia.kind === "Видео"
        ? <video src={currentMedia.url} controls autoPlay style={{width:"100%",borderRadius:20}} />
        : <img src={currentMedia.url} alt="Фото" style={{width:"100%",borderRadius:20}} />
      }
    </Modal>}
  </Modal>;
}

function Analytics({leads,properties,events,role,users}) {
  const canFilter = role === "Администратор тех отдел" || role === "Администратор директор";
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const [managerFilter,setManagerFilter] = useState("Все");
  const scoped = canFilter && managerFilter !== "Все"
    ? leads.filter(l => String(l.manager_email || "") === String(managerFilter) || String(l.manager || "") === String(managerFilter))
    : leads;
  const scopedIds = new Set(scoped.map(l=>String(l.id)));
  const scopedEvents = events.filter(e => scopedIds.has(String(e.leadId)));
  const deals = scoped.filter(l=>l.status==="Сделка").length;
  const countType = (t) => scopedEvents.filter(e=>e.type===t).length;
  return <main className="screen">
    <div className="card dark"><h2>Аналитика CRM</h2><p>{role==="Менеджер по продажам"?"Личная аналитика по твоим клиентам и твоей воронке.":"Аналитика по менеджерам, стадиям и событиям."}</p></div>
    {canFilter && <div className="card"><h3>Фильтр по менеджеру</h3><select className="input" value={managerFilter} onChange={e=>setManagerFilter(e.target.value)}><option value="Все">Все менеджеры</option>{managerUsers.map(u=><option key={u.email || u.id} value={u.email || managerDisplayName(u)}>{managerDisplayName(u)} {u.email ? `— ${u.email}` : ""}</option>)}</select></div>}
    <div className="stats">{[["Лиды",scoped.length],["Сделки",deals],["В работе",scoped.filter(l=>!["Сделка","Отказ"].includes(l.status)).length],["События",scopedEvents.length],["Звонки",countType("Звонок")],["Встречи",countType("Встреча")],["Показы",countType("Показ")],["Задачи",countType("Задача")],["Конверсия",scoped.length?Math.round(deals/scoped.length*100)+"%":"0%"]].map(([a,b])=><div className="stat" key={a}><span>{a}</span><b>{b}</b></div>)}</div>
    <div className="card"><h3>Воронка клиентов</h3>{stages.map(s=><div className="stageRow" key={s}><span>{s}</span><b>{scoped.filter(l=>l.status===s).length}</b></div>)}</div>
  </main>;
}

function Help({help,setHelp,leads,setLeads,onOpen}) {
  const [reply,setReply] = useState({});

  const answer = id => {
    if(!reply[id]) return;
    const item = help.find(h => h.id === id);
    const text = reply[id];

    setHelp(prev=>prev.map(h=>h.id===id?{...h,reply:text,status:"answered"}:h));

    if (item) {
      const historyText = `Ответ директора ${new Date().toLocaleString()}: ${text}`;
      setLeads(prev => prev.map(l =>
        String(l.id) === String(item.leadId)
          ? {...l, history:[...(l.history || []), historyText]}
          : l
      ));
    }

    playBeep();
    setReply({...reply,[id]:""});
  };

  return <main className="screen">
    <div className="card dark"><div className="row"><section><h2>Помощь менеджерам</h2><p>Вопросы из карточек клиентов</p></section><Button onClick={playBeep}>Звук</Button></div></div>
    {help.map(h=>{const lead=leads.find(l=>l.id===h.leadId);return <div className="card" key={h.id}>
      <div className="row"><section><h3>{h.client}</h3><p className="muted">{h.manager}</p></section>{badge(h.status==="open"?"Ожидает":"Отвечено",h.status==="open"?"red":"green")}</div>
      <div className="question"><b>Вопрос менеджера</b><p>{h.text}</p></div>
      {h.reply&&<div className="reply"><b>Директор:</b> {h.reply}</div>}
      <textarea className="input" placeholder="Ответить менеджеру..." value={reply[h.id]||""} onChange={e=>setReply({...reply,[h.id]:e.target.value})}/>
      <div className="grid2"><Button onClick={()=>answer(h.id)}>Ответить</Button><Button variant="soft" onClick={()=>lead&&onOpen(lead)}>Открыть клиента</Button></div>
    </div>})}
  </main>;
}

function Access({agencies,setAgencies,users,setUsers}) {
  const [agency,setAgency] = useState({name:""});
  const [editingAgency,setEditingAgency] = useState(null);
  const [user,setUser] = useState({agency_id:"",full_name:"",phone:"",email:"",role:"Менеджер по продажам"});
  const [editingUser,setEditingUser] = useState(null);

  const createAgency = async () => {
    if (!agency.name.trim()) return;
    const payload = {name: agency.name.trim(), status:"active"};
    const { data, error } = await supabase.from("agencies").insert(payload).select().single();
    if (error) { alert("Ошибка создания агентства: " + error.message); return; }
    setAgencies(prev => [data, ...prev]);
    setAgency({name:""});
  };

  const saveAgency = async () => {
    if (!editingAgency?.name?.trim()) return;
    const { data, error } = await supabase.from("agencies").update({name: editingAgency.name.trim(), status: editingAgency.status || "active"}).eq("id", editingAgency.id).select().single();
    if (error) { alert("Ошибка редактирования агентства: " + error.message); return; }
    setAgencies(prev => prev.map(a => String(a.id) === String(data.id) ? data : a));
    setEditingAgency(null);
  };

  const deleteAgency = async (id) => {
    if (!window.confirm("Удалить агентство и всех пользователей внутри него?")) return;
    await supabase.from("users").delete().eq("agency_id", id);
    const { error } = await supabase.from("agencies").delete().eq("id", id);
    if (error) { alert("Ошибка удаления агентства: " + error.message); return; }
    setAgencies(prev => prev.filter(a => String(a.id) !== String(id)));
    setUsers(prev => prev.filter(u => String(u.agency_id) !== String(id)));
  };

  const createUser = async () => {
    if (!user.full_name.trim() || !user.email.trim()) return;
    const agencyId = user.agency_id || agencies[0]?.id || null;
    if (!agencyId) { alert("Сначала создай агентство"); return; }

    const payload = {
      agency_id: Number(agencyId),
      full_name: user.full_name.trim(),
      phone: user.phone || "",
      email: user.email.trim(),
      role: user.role,
      avatar_url: null
    };

    const { data, error } = await supabase.from("users").insert(payload).select().single();
    if (error) { alert("Ошибка создания пользователя: " + error.message); return; }
    setUsers(prev => [data, ...prev]);
    setUser({agency_id: agencyId || "", full_name:"", phone:"", email:"", role:"Менеджер по продажам"});
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const payload = {
      agency_id: Number(editingUser.agency_id),
      full_name: editingUser.full_name || "",
      phone: editingUser.phone || "",
      email: editingUser.email || "",
      role: editingUser.role || "Менеджер по продажам"
    };
    const { data, error } = await supabase.from("users").update(payload).eq("id", editingUser.id).select().single();
    if (error) { alert("Ошибка редактирования пользователя: " + error.message); return; }
    setUsers(prev => prev.map(u => String(u.id) === String(data.id) ? data : u));
    setEditingUser(null);
  };

  const deleteUser = async (u) => {
    if (!window.confirm("Удалить доступ пользователя?")) return;
    const { error } = await supabase.from("users").delete().eq("id", u.id);
    if (error) { alert("Ошибка удаления пользователя: " + error.message); return; }
    setUsers(prev => prev.filter(x => String(x.id) !== String(u.id)));
  };

  const userName = (u) => u.full_name || u.name || "Без имени";

  return <main className="screen">
    <div className="card dark"><h2>Доступ агентствам недвижимости</h2><p>Создавай агентства, открывай доступ пользователям и назначай роли внутри каждого агентства.</p></div>

    <div className="grid2">
      <div className="card">
        <h3>Создать агентство недвижимости</h3>
        <input className="input" placeholder="Название агентства" value={agency.name} onChange={e=>setAgency({...agency,name:e.target.value})}/>
        <Button className="full" onClick={createAgency}>Создать агентство</Button>
      </div>

      <div className="card">
        <h3>Открыть доступ пользователю</h3>
        <select className="input" value={user.agency_id} onChange={e=>setUser({...user,agency_id:e.target.value})}>
          <option value="">Выбери агентство</option>
          {agencies.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input" placeholder="ФИО пользователя" value={user.full_name} onChange={e=>setUser({...user,full_name:e.target.value})}/>
        <input className="input" placeholder="Телефон" value={user.phone} onChange={e=>setUser({...user,phone:e.target.value})}/>
        <input className="input" placeholder="Email пользователя" value={user.email} onChange={e=>setUser({...user,email:e.target.value})}/>
        <select className="input" value={user.role} onChange={e=>setUser({...user,role:e.target.value})}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select>
        <Button className="full" onClick={createUser}>Создать доступ</Button>
      </div>
    </div>

    {agencies.map(a=>{
      const list = users.filter(u => String(u.agency_id) === String(a.id));
      return <div className="card" key={a.id}>
        <div className="row">
          <section><h3>{a.name}</h3><p className="muted">ID агентства: {a.id} · {a.status || "active"}</p></section>
          <div className="grid2" style={{maxWidth:360}}>
            <Button variant="soft" onClick={()=>setEditingAgency(a)}>Редактировать</Button>
            <Button variant="danger" onClick={()=>deleteAgency(a.id)}>Удалить агентство</Button>
          </div>
        </div>
        {list.length === 0 && <p className="muted">Пока нет пользователей.</p>}
        {list.map(u=><div className="lead" key={u.id}>
          <div className="row"><section><b>{userName(u)}</b><p className="muted">{u.phone || "Без телефона"}<br/>{u.email}<br/>{u.role}</p></section>{badge("Доступ создан","green")}</div>
          <div className="grid2"><Button variant="soft" onClick={()=>setEditingUser(u)}>Редактировать доступ</Button><Button variant="danger" onClick={()=>deleteUser(u)}>Удалить пользователя</Button></div>
        </div>)}
      </div>;
    })}

    {editingAgency && <Modal onClose={()=>setEditingAgency(null)}>
      <div className="row"><h2>Редактировать агентство</h2><button className="icon" onClick={()=>setEditingAgency(null)}>×</button></div>
      <input className="input" value={editingAgency.name || ""} onChange={e=>setEditingAgency({...editingAgency,name:e.target.value})}/>
      <select className="input" value={editingAgency.status || "active"} onChange={e=>setEditingAgency({...editingAgency,status:e.target.value})}><option value="active">active</option><option value="blocked">blocked</option></select>
      <Button className="full" onClick={saveAgency}>Сохранить агентство</Button>
    </Modal>}

    {editingUser && <Modal onClose={()=>setEditingUser(null)} wide>
      <div className="row"><h2>Редактировать пользователя</h2><button className="icon" onClick={()=>setEditingUser(null)}>×</button></div>
      <select className="input" value={editingUser.agency_id || ""} onChange={e=>setEditingUser({...editingUser,agency_id:e.target.value})}>{agencies.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <input className="input" placeholder="ФИО" value={editingUser.full_name || editingUser.name || ""} onChange={e=>setEditingUser({...editingUser,full_name:e.target.value})}/>
      <input className="input" placeholder="Телефон" value={editingUser.phone || ""} onChange={e=>setEditingUser({...editingUser,phone:e.target.value})}/>
      <input className="input" placeholder="Email" value={editingUser.email || ""} onChange={e=>setEditingUser({...editingUser,email:e.target.value})}/>
      <select className="input" value={editingUser.role || "Менеджер по продажам"} onChange={e=>setEditingUser({...editingUser,role:e.target.value})}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select>
      <Button className="full" onClick={saveUser}>Сохранить пользователя</Button>
    </Modal>}
  </main>;
}



function More({role,setRole,setPage,theme,setTheme,lang,setLang,leads,setLeads,users,currentProfile,onLogout}) {
  const isTech = role === "Администратор тех отдел";
  const [manualLead,setManualLead] = useState({name:"",phone:"+380",source:sources[0],status:stages[0],manager:"",manager_email:"",notes:""});
  const [importText,setImportText] = useState("");
  const [importPreview,setImportPreview] = useState([]);
  const managerUsers = (users || []).filter(u => String(u.role || "").includes("Менеджер"));
  const managerOptions = managerUsers.length
    ? managerUsers.map(u => ({name: u.full_name || u.name || u.email, email: u.email || ""}))
    : [{name:"Елена",email:""},{name:"Андрей",email:""}];
  const activeManager = managerOptions.find(m => m.email === manualLead.manager_email) || managerOptions.find(m => m.name === manualLead.manager) || managerOptions[0];
  const setManagerByEmail = (email) => {
    const m = managerOptions.find(x => x.email === email) || managerOptions[0];
    setManualLead(prev => ({...prev, manager:m?.name || "", manager_email:m?.email || ""}));
  };

  const createManualLead = () => {
    if (!manualLead.name.trim()) return;
    const manager = activeManager?.name || manualLead.manager || "Ответственный менеджер";
    const managerEmail = activeManager?.email || manualLead.manager_email || "";
    const record = {
      id:"L-"+Date.now().toString().slice(-6),
      agency_id: currentProfile?.agency_id ? String(currentProfile.agency_id) : "",
      name:manualLead.name.trim(),
      phone:manualLead.phone || "+380",
      source:manualLead.source,
      status:manualLead.status,
      notes:manualLead.notes || "",
      nextContact:"",
      manager,
      manager_email:managerEmail,
      history:[`Клиент создан тех отделом и назначен: ${manager}`]
    };
    setLeads(prev=>[record,...prev]);
    setManualLead({name:"",phone:"+380",source:sources[0],status:stages[0],manager:activeManager?.name || "",manager_email:activeManager?.email || "",notes:""});
  };

  const parseRows = (raw) => {
    const lines = String(raw || "").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    return lines.map(line => {
      const parts = line.includes(";") ? line.split(";") : line.includes("\t") ? line.split("\t") : line.split(",");
      return {
        name:(parts[0] || "").trim(),
        phone:(parts[1] || "+380").trim(),
        source:(parts[2] || sources[0]).trim(),
        notes:(parts.slice(3).join(" ") || "").trim()
      };
    }).filter(x=>x.name || x.phone);
  };

  const rowsToLeads = (rows) => {
    const manager = activeManager?.name || manualLead.manager || "Ответственный менеджер";
    const managerEmail = activeManager?.email || manualLead.manager_email || "";
    return rows.map((r,i)=>({
      id:"L-"+Date.now().toString().slice(-6)+"-"+i,
      agency_id: currentProfile?.agency_id ? String(currentProfile.agency_id) : "",
      name:r.name || "Без имени",
      phone:r.phone || "+380",
      source:r.source || sources[0],
      status:stages[0],
      notes:r.notes || "",
      nextContact:"",
      manager,
      manager_email:managerEmail,
      history:[`Импортирован тех отделом и назначен: ${manager}`]
    }));
  };

  const importClients = () => {
    const rows = importPreview.length ? importPreview : parseRows(importText);
    if (!rows.length) return alert("Нет клиентов для загрузки. Проверь файл или вставленный список.");
    const created = rowsToLeads(rows);
    setLeads(prev=>[...created,...prev]);
    setImportText("");
    setImportPreview([]);
  };

  const readFile = async (file) => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (["xlsx","xls"].includes(ext)) {
      try {
        const XLSX = await import(/* @vite-ignore */ "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, {header:1, defval:""});
        const rows = data
          .filter(row => row.some(cell => String(cell).trim()))
          .map(row => ({
            ...parseClientLineSmart(row.join(";"))
          }))
          .filter(x=>x.name || x.phone);
        setImportPreview(rows);
        setImportText(rows.map(r=>[r.name,r.phone,r.source,r.notes].join(";")).join("\n"));
      } catch (e) {
        alert("Не удалось прочитать Excel. Сохрани файл как CSV или проверь интернет для загрузки XLSX-модуля. " + e.message);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setImportText(text);
      setImportPreview(parseRows(text));
    };
    reader.readAsText(file);
  };

  return <main className="screen">
    <div className="card">
      <h3>Язык интерфейса</h3>
      <div className="grid3"><Button variant={lang==="ru"?"primary":"soft"} onClick={()=>setLang("ru")}>Русский</Button><Button variant={lang==="uk"?"primary":"soft"} onClick={()=>setLang("uk")}>Українська</Button><Button variant={lang==="en"?"primary":"soft"} onClick={()=>setLang("en")}>English</Button></div><p className="muted">Выбор сохраняется индивидуально. Полный перевод всех экранов включим следующим этапом, сейчас фиксируется язык пользователя.</p>
    </div>

    <div className="card">
      <h3>Цветовая гамма CRM</h3>
      <p className="muted">Каждый пользователь может выбрать оформление под себя.</p>
      <div className="grid3">
        {themeOptions.map(t=><Button key={t.id} variant={theme===t.id ? "primary" : "soft"} onClick={()=>setTheme(t.id)}>{t.name}</Button>)}
      </div>
    </div>

    {isTech && <div className="card">
      <h3>Роль для проверки CRM</h3>
      <p className="muted">Переключатель ролей доступен только администратору тех отдела.</p>
      <select className="input" value={role} onChange={e=>setRole(e.target.value)}>
        <option>Менеджер по продажам</option>
        <option>Администратор директор</option>
        <option>Администратор тех отдел</option>
      </select>
    </div>}

    <div className="card row">
      <section><h3>Аналитика</h3><p className="muted">{role==="Менеджер по продажам"?"Только моя аналитика":"Доступ по роли"}</p></section>
      <Button onClick={()=>setPage("analytics")}>Открыть</Button>
    </div>

    {role==="Администратор директор"&&<div className="card row"><section><h3>Помощь менеджерам</h3><p className="muted">Вопросы из карточек клиентов</p></section><Button onClick={()=>setPage("help")}>Открыть</Button></div>}

    {isTech&&<div className="card row"><section><h3>Доступ агентствам недвижимости</h3><p className="muted">Агентства, пользователи, роли и доступы</p></section><Button onClick={()=>setPage("access")}>Открыть</Button></div>}

    <div className="card row">
      <section><h3>Мой вход</h3><p className="muted">{currentProfile?.email || "Без email"}<br/>{currentProfile?.full_name || currentProfile?.name || "Пользователь"} · {role}</p></section>
      <Button variant="danger" onClick={onLogout}>Выйти</Button>
    </div>

    {isTech && <div className="card">
      <h3>Добавить клиента вручную и назначить менеджера</h3>
      <div className="grid2">
        <input className="input" placeholder="Имя клиента" value={manualLead.name} onChange={e=>setManualLead({...manualLead,name:e.target.value})}/>
        <input className="input" placeholder="Телефон" value={manualLead.phone} onChange={e=>setManualLead({...manualLead,phone:e.target.value})}/>
        <select className="input" value={manualLead.source} onChange={e=>setManualLead({...manualLead,source:e.target.value})}>{sources.map(s=><option key={s}>{s}</option>)}</select>
        <select className="input" value={manualLead.manager_email || activeManager?.email || ""} onChange={e=>setManagerByEmail(e.target.value)}>{managerOptions.map(m=><option key={m.email || m.name} value={m.email}>{m.name} {m.email ? `— ${m.email}` : ""}</option>)}</select>
      </div>
      <textarea className="input" placeholder="Заметки" value={manualLead.notes} onChange={e=>setManualLead({...manualLead,notes:e.target.value})}/>
      <Button className="full" onClick={createManualLead}>Создать и назначить клиента</Button>
    </div>}

    {isTech && <div className="card">
      <h3>Загрузка клиентов из файла</h3>
      <p className="muted">Поддерживаются Excel XLSX/XLS, CSV/TXT/TSV. Колонки: имя; телефон; источник; заметка.</p>
      <input className="input" type="file" accept=".xlsx,.xls,.csv,.txt,.tsv" onChange={e=>readFile(e.target.files?.[0])}/>
      <select className="input" value={manualLead.manager_email || activeManager?.email || ""} onChange={e=>setManagerByEmail(e.target.value)}>{managerOptions.map(m=><option key={m.email || m.name} value={m.email}>{m.name} {m.email ? `— ${m.email}` : ""}</option>)}</select>
      <textarea className="input" style={{minHeight:120}} placeholder="Или вставь список клиентов сюда: Имя;Телефон;Источник;Заметка" value={importText} onChange={e=>{setImportText(e.target.value);setImportPreview(parseRows(e.target.value));}}/>
      <p className="muted">Готово к загрузке: {(importPreview.length ? importPreview : parseRows(importText)).length} клиентов</p>
      <Button className="full" onClick={importClients}>Загрузить клиентов и назначить менеджера</Button>
    </div>}

    {role==="Менеджер по продажам"&&<div className="card amber">Менеджеру доступны рабочие разделы, язык, цветовая гамма и личная аналитика.</div>}
  </main>;
}



export default function App(){
  const [page,setPage] = useStorage("page","feed");
  const [role,setRole] = useStorage("role","Администратор директор");
  const [theme,setTheme] = useStorage("crm_theme","classic");
  const [lang,setLang] = useStorage("crm_lang","ru");

  const [session,setSession] = useState(null);
  const [currentProfile,setCurrentProfile] = useState(null);
  const [authLoading,setAuthLoading] = useState(true);

  const [leads,setLeadsRaw] = useState([]);
  const [posts,setPostsRaw] = useState([]);
  const [properties,setPropertiesRaw] = useState([]);

  const [events,setEvents] = useStorage("events",initialEvents);
  const [help,setHelp] = useStorage("help",initialHelp);
  const [agencies,setAgencies] = useState([]);
  const [users,setUsers] = useState([]);

  const [lead,setLead] = useState(null);
  const [property,setProperty] = useState(null);

  const profileName = currentProfile?.full_name || currentProfile?.name || "";
  const profileEmail = currentProfile?.email || session?.user?.email || "";
  const profileAgencyId = currentProfile?.agency_id ? String(currentProfile.agency_id) : "";
  const isTech = role === "Администратор тех отдел";

  async function loadUserProfile(email){
    if (!email) return null;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      alert("Ошибка проверки пользователя: " + error.message);
      return null;
    }

    if (!data) {
      alert("Этот email не найден в таблице users. Сначала создай доступ пользователю в разделе Доступы.");
      return null;
    }

    if (data.access === false || data.status === "blocked") {
      alert("Доступ закрыт администратором.");
      await supabase.auth.signOut();
      return null;
    }

    setCurrentProfile(data);
    setRole(data.role || "Менеджер по продажам");
    return data;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const sess = data?.session || null;
      setSession(sess);
      if (sess?.user?.email) await loadUserProfile(sess.user.email);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess?.user?.email) {
        await loadUserProfile(sess.user.email);
      } else {
        setCurrentProfile(null);
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  function extractManager(notes=""){
    const match = String(notes || "").match(/Ответственный менеджер:\s*([^\n]+)/i);
    return match ? match[1].trim() : "Елена";
  }

  function leadFromDb(row){
    return {
      id: String(row.id),
      agency_id: row.agency_id ? String(row.agency_id) : "",
      name: row.name || "Без имени",
      phone: row.phone || "",
      source: row.source || sources[0],
      status: row.stage || "Новый Лид",
      notes: row.notes || "",
      nextContact: row.next_contact_at || "",
      manager: row.manager_name || row.manager || extractManager(row.notes),
      manager_email: row.manager_email || "",
      history: ["Загружено из Supabase"]
    };
  }

  function propertyFromDb(row, mediaRows = []){
    return {
      id: String(row.id),
      agency_id: row.agency_id ? String(row.agency_id) : "",
      title: row.title || "Без названия",
      type: row.property_type || types[0],
      district: row.district || districts[0],
      status: row.status || "Актуален",
      price: row.price || 0,
      area: row.area || 0,
      floor: row.floor ? String(row.floor) : "",
      owner: row.owner_name || "",
      ownerPhone: row.owner_phone || "",
      description: row.description || "",
      property_manager_name: row.property_manager_name || row.manager_name || "",
      property_manager_email: row.property_manager_email || "",
      property_manager_phone: row.property_manager_phone || "",
      olx_status: row.olx_status || null,
      ownership_right: !!row.ownership_right,
      assignment_allowed: !!row.assignment_allowed,
      state_programs: !!row.state_programs,
      created_by_email: row.created_by_email || "",
      created_by_name: row.created_by_name || "",
      media: mediaRows
        .filter(m => String(m.property_id) === String(row.id))
        .map(m => ({kind: m.media_type, url: m.media_url, name: m.file_name})),
      hot: false,
      history: ["Загружено из Supabase"]
    };
  }

  function postFromDb(row, mediaRows = [], commentRows = []){
    const media = mediaRows.find(m => String(m.news_id) === String(row.id));
    const comments = (commentRows || [])
      .filter(c =>
        String(c.news_id || "") === String(row.id) ||
        String(c.post_id || "") === String(row.id) ||
        (c.entity_type === "news" && String(c.entity_id) === String(row.id))
      )
      .map(c => ({text: c.content || c.text || c.comment || "", author_name: commentAuthorName(c), created_at: c.created_at || ""}));

    const mediaUrl = media?.link_url || media?.media_url || "";
    const mediaType = media?.media_type || (mediaUrl ? "Фото" : "Текст");

    return {
      id: String(row.id),
      agency_id: row.agency_id ? String(row.agency_id) : "",
      author: "Администратор",
      date: row.created_at ? new Date(row.created_at).toLocaleString() : new Date().toLocaleString(),
      text: row.content || row.title || "",
      kind: mediaType,
      file: mediaUrl,
      likes: row.likes_count || 0,
      comments
    };
  }

  function belongsToMyAgency(item){
    if (isTech) return true;
    if (!profileAgencyId) return true;
    if (!item.agency_id) return true;
    return String(item.agency_id) === profileAgencyId;
  }

  function isMyLead(item){
    if (isTech) return true;
    if (!belongsToMyAgency(item)) return false;

    const manager = String(item.manager || "").trim().toLowerCase();
    const managerEmail = String(item.manager_email || "").trim().toLowerCase();
    const myName = String(profileName || "").trim().toLowerCase();
    const myEmail = String(profileEmail || "").trim().toLowerCase();

    if (role === "Администратор директор") return true;
    return (!!myEmail && managerEmail === myEmail) || (!!myName && manager === myName);
  }

  async function loadFromSupabase(profile = currentProfile){
    const agencyId = profile?.agency_id ? String(profile.agency_id) : profileAgencyId;
    const roleForLoad = profile?.role || role;

    const leadsRes = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    const postsRes = await supabase.from("news").select("*").order("created_at", { ascending: false });
    const newsMediaRes = await supabase.from("news_media").select("*").order("created_at", { ascending: false });
    const propsRes = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    const propertyMediaRes = await supabase.from("property_media").select("*");
    const commentsRes = await supabase.from("comments").select("*");
    const agenciesRes = await supabase.from("agencies").select("*").order("created_at", { ascending: false });
    const usersRes = await supabase.from("users").select("*").order("created_at", { ascending: false });

    if (leadsRes.error) {
      alert("Ошибка загрузки клиентов: " + leadsRes.error.message);
    } else {
      const mapped = (leadsRes.data || []).map(leadFromDb);
      setLeadsRaw(mapped);
    }

    if (postsRes.error) {
      alert("Ошибка загрузки ленты: " + postsRes.error.message);
    } else {
      const mediaRows = newsMediaRes.error ? [] : (newsMediaRes.data || []);
      const commentRows = commentsRes.error ? [] : (commentsRes.data || []);
      const mappedPosts = (postsRes.data || []).map(row => postFromDb(row, mediaRows, commentRows));
      setPostsRaw(roleForLoad === "Администратор тех отдел" ? mappedPosts : mappedPosts.filter(p => !agencyId || !p.agency_id || String(p.agency_id) === String(agencyId)));
    }

    if (propsRes.error) {
      alert("Ошибка загрузки вторички: " + propsRes.error.message);
    } else {
      const propertyMediaRows = propertyMediaRes.error ? [] : (propertyMediaRes.data || []);
      const mappedProps = (propsRes.data || []).map(row => propertyFromDb(row, propertyMediaRows));
      setPropertiesRaw(roleForLoad === "Администратор тех отдел" ? mappedProps : mappedProps.filter(p => !agencyId || !p.agency_id || String(p.agency_id) === String(agencyId)));
    }

    if (!agenciesRes.error) setAgencies(agenciesRes.data || []);
    if (!usersRes.error) setUsers(usersRes.data || []);
  }

  useEffect(() => {
    if (currentProfile) loadFromSupabase(currentProfile);
  }, [currentProfile?.id]);

  useEffect(() => {
    if (!currentProfile) return;
    const channel = supabase
      .channel("crm-realtime-sync")
      .on("postgres_changes", {event:"*", schema:"public", table:"leads"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"properties"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"property_media"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"news"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"news_media"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"comments"}, () => loadFromSupabase(currentProfile))
      .on("postgres_changes", {event:"*", schema:"public", table:"users"}, () => loadFromSupabase(currentProfile))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentProfile?.id]);

  async function signOut(){
    await supabase.auth.signOut();
    setCurrentProfile(null);
    setSession(null);
  }

  async function syncLeadToSupabase(item){
    const manager = item.manager || profileName || extractManager(item.notes);
    const notes = String(item.notes || "").includes("Ответственный менеджер:")
      ? item.notes
      : `Ответственный менеджер: ${manager}\n${item.notes || ""}`.trim();

    const payload = {
      agency_id: currentProfile?.agency_id || item.agency_id || null,
      name: item.name,
      phone: item.phone,
      source: item.source,
      stage: item.status,
      notes,
      manager_name: manager,
      manager_email: item.manager_email || profileEmail || null,
      next_contact_at: item.nextContact || null
    };

    if (!String(item.id).startsWith("L-")) {
      const { error } = await supabase.from("leads").update(payload).eq("id", item.id);
      if (error) alert("Ошибка сохранения клиента: " + error.message);
    } else {
      const { data, error } = await supabase.from("leads").insert(payload).select().single();
      if (error) { alert("Ошибка создания клиента: " + error.message); return; }
      if (data) setLeadsRaw(prev => prev.map(x => x.id === item.id ? leadFromDb(data) : x));
    }
  }

  function setLeads(next){
    setLeadsRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;

      const changed = value.filter(v => {
        const old = prev.find(p => p.id === v.id);
        return !old || JSON.stringify(old) !== JSON.stringify(v);
      });

      changed.forEach(syncLeadToSupabase);
      return value;
    });
  }

  function setProperties(next){
    setPropertiesRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;
      return value;
    });
  }

  function setPosts(next){
    setPostsRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;
      return value;
    });
  }

  if (authLoading) {
    return <main className="screen" style={{minHeight:"100vh",display:"grid",placeItems:"center"}}><div className="card">Загрузка доступа...</div></main>;
  }

  if (!session || !currentProfile) {
    return <LoginScreen onLogin={()=>{}} />;
  }

  const visibleLeads = leads.filter(isMyLead);
  const currentAgency = agencies.find(a => String(a.id) === String(currentProfile?.agency_id));
  const agencyName = currentAgency?.name || currentProfile?.agency_name || "CRM Real Estate";
  const visibleEvents = events.filter(e => {
    if (isTech) return true;
    return visibleLeads.some(l => String(l.id) === String(e.leadId));
  });

  return <div className="layout" style={themeStyle(theme)}>
    <Sidebar page={page} setPage={setPage} role={role}/>
    <div className="mainWrap">
      <main className="main">
        <Top page={page} setPage={setPage} agencyName={agencyName}/>
        {page==="feed"&&<Feed posts={posts} setPosts={setPosts} role={role} currentProfile={currentProfile}/>} 
        {page==="clients"&&<Clients leads={visibleLeads} setLeads={setLeads} onOpen={setLead} currentProfile={currentProfile} role={role} users={users}/>} 
        {page==="calendar"&&<Calendar events={visibleEvents} setEvents={setEvents} leads={visibleLeads} setLeads={setLeads} onOpenLead={setLead} currentProfile={currentProfile} role={role}/>} 
        {page==="properties"&&<Properties properties={properties} setProperties={setProperties} onOpen={setProperty} users={users} currentProfile={currentProfile}/>} 
        {page==="analytics"&&<Analytics leads={visibleLeads} properties={properties} events={visibleEvents} role={role} users={users}/>} 
        {page==="help"&&<Help help={help} setHelp={setHelp} setLeads={setLeads} leads={visibleLeads} onOpen={setLead}/>} 
        {page==="access"&&role==="Администратор тех отдел"&&<Access agencies={agencies} setAgencies={setAgencies} users={users} setUsers={setUsers}/>} 
        {page==="more"&&<More role={role} setRole={setRole} setPage={setPage} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} leads={leads} setLeads={setLeads} users={users} currentProfile={currentProfile} onLogout={signOut}/>} 
        <Bottom page={page} setPage={setPage}/>
        {lead&&<LeadModal lead={lead} setLeads={setLeads} setEvents={setEvents} setHelp={setHelp} onClose={()=>setLead(null)} role={role} users={users} currentProfile={currentProfile}/>} 
        {property&&<PropertyModal property={property} setProperties={setProperties} onClose={()=>setProperty(null)} users={users} currentProfile={currentProfile} role={role}/>} 
      </main>
    </div>
  </div>;
}
