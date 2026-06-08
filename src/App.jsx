import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
const stages = ["Новый Лид","Первый контакт","В работе","Назначена встреча","Проведена встреча","Думает","Задаток","Сделка","Отказ","Отложили"];
const sources = ["Повторный клиент","Рекомендации","ОЛХ","Лид руководство","Инстаграм личный","Тик-Ток личный","Фейсбук личный","Тик-Ток рабочий","Инстаграм рабочий","Фейсбук рабочий","Телеграмм-канал рабочий","Рекомендации клиентов"];
const types = ["1-комнатные","2-комнатные","3-комнатные","Таунхаус","Дом","Участок","Коммерция"];
const districts = ["Киевский","Приморский","Пересыпский","Хаджибейский","Аркадия"];
const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const week = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const eventTypes = ["Звонок","Встреча","Показ","Задача"];

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
  if (!name) {
    return <div className={cn("media", small && "small")}><div>{kind === "Видео" ? "▶" : kind === "Файл" ? "📄" : kind === "Ссылка" ? "🔗" : "📷"}</div><b>{kind}</b><span>предпросмотр</span></div>;
  }

  if (kind === "Фото" && name.startsWith("http")) {
    return <div className={cn("media", small && "small")} onClick={()=>onOpen&&onOpen({kind,name})} style={{cursor:"pointer"}}><img src={name} alt="Фото" style={{width:"100%",borderRadius:16}} /></div>;
  }

  if (kind === "Видео" && name.startsWith("http")) {
    return <div className={cn("media", small && "small")} onClick={()=>onOpen&&onOpen({kind,name})} style={{cursor:"pointer"}}><video src={name} controls style={{width:"100%",borderRadius:16}} /></div>;
  }

  if (kind === "Файл" && name.startsWith("http")) {
    return <a className="link" href={name} target="_blank" rel="noreferrer">📄 Открыть файл</a>;
  }

  if (String(kind).toLowerCase().includes("ссылка")) {
  const url = normalizeUrl(name);
  return <a className="link" href={url} target="_blank" rel="noopener noreferrer" onClick={(e)=>e.stopPropagation()}>
    🔗 Открыть ссылку
  </a>;
}

  return <div className={cn("media", small && "small")}><div>{kind === "Видео" ? "▶" : kind === "Файл" ? "📄" : kind === "Ссылка" ? "🔗" : "📷"}</div><b>{name || kind}</b><span>предпросмотр</span></div>;
}
function Modal({children, onClose, wide=false}) {
  return <div className="modal" onMouseDown={onClose}><div className={cn("sheet", wide && "wide")} onMouseDown={(e)=>e.stopPropagation()}>{children}</div></div>;
}

function Field({label, children}) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Sidebar({page,setPage,role}) {
  const items = [["feed","Лента","⌂"],["clients","Канбан и клиенты","👥"],["calendar","Календарь","📅"],["properties","Вторичка","🏢"],["analytics","Аналитика","📊"],["help","Помощь менеджерам","🔔"],["access","Доступы","🔐"],["more","Ещё","☰"]];
  return <aside className="sidebar"><div className="logo"><div>♛</div><section><b>CRM Real Estate</b><span>Premium SaaS</span></section></div><div className="roleBox">{role}</div>{items.map(([id,label,icon])=><button key={id} onClick={()=>setPage(id)} className={cn("sideBtn", page===id && "active")}><span>{icon}</span>{label}</button>)}</aside>;
}

function Top({page,setPage}) {
  const titles = {feed:"Лента новостей",clients:"Клиенты",calendar:"Календарь",properties:"Вторичка",analytics:"Аналитика",help:"Помощь менеджерам",access:"Доступы",more:"Еще"};
  return <div className="top"><div className="topLine"><div><p>♛ CRM Real Estate</p><h1>{titles[page]}</h1></div><button onClick={()=>setPage("more")}>EK</button></div><div className="search">🔎 <input placeholder="Поиск по CRM..." /></div></div>;
}

function Bottom({page,setPage}) {
  const items = [["feed","Лента","⌂"],["clients","Клиенты","👥"],["calendar","Календарь","📅"],["properties","Объекты","🏢"],["more","Ещё","☰"]];
  return <nav className="bottom">{items.map(([id,label,icon])=><button key={id} className={page===id ? "active" : ""} onClick={()=>setPage(id)}><span>{icon}</span>{label}</button>)}</nav>;
}

function Feed({posts,setPosts}) {
  const [open,setOpen] = useState(false);
  const [draft,setDraft] = useState({text:"",kind:"Фото",file:""});
  const [fileObj,setFileObj] = useState(null);
  const [viewer,setViewer] = useState(null);

  async function uploadToNewsMedia(newsId) {
    if (draft.kind === "Ссылка") {
      if (!draft.file) return null;

      const { data } = await supabase
        .from("news_media")
        .insert({
          news_id: newsId,
          media_type: "Ссылка",
          media_url: null,
          file_name: null,
          link_url: draft.file
        })
        .select()
        .single();

      return data;
    }

    if (!fileObj) return null;

const originalName = fileObj.name || "upload";
const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
const path = `${newsId}/${safeName}`;

    const upload = await supabase
      .storage
      .from("news-media")
      .upload(path, fileObj, { upsert: true });
    
console.log("UPLOAD RESULT", upload);
    
    if (upload.error) {
      alert("Ошибка загрузки файла: " + upload.error.message);
      return null;
    }

    const publicUrl = supabase
      .storage
      .from("news-media")
      .getPublicUrl(path).data.publicUrl;

    const { data } = await supabase
      .from("news_media")
      .insert({
        news_id: newsId,
        media_type: draft.kind,
        media_url: publicUrl,
        file_name: fileObj.name,
        link_url: null
      })
      .select()
      .single();

    return data;
  }

  const publish = async () => {
    if(!draft.text && !draft.file && !fileObj) return;

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

    if (error) {
      alert("Ошибка сохранения публикации: " + error.message);
      return;
    }

    const media = await uploadToNewsMedia(news.id);
    const mediaUrl = media?.link_url || media?.media_url || "";
    const kind = media?.media_type || draft.kind;

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

  return <main className="screen"><div className="feedList">
    <div className="card dark hero"><div><h2>Лента новостей</h2><p>Внутренняя соцсеть агентства: фото, видео, файлы, ссылки, лайки и комментарии.</p></div><Button onClick={()=>setOpen(true)}>+ Новая публикация</Button></div>

    {open && <div className="card composer">
      <div className="row"><h2>Новая публикация</h2><button className="icon" onClick={()=>setOpen(false)}>×</button></div>

      <textarea className="input" placeholder="Текст публикации..." value={draft.text} onChange={e=>setDraft({...draft,text:e.target.value})}/>

      <div className="grid4">{["Фото","Видео","Файл","Ссылка"].map(k=><Button key={k} variant={draft.kind===k?"primary":"soft"} onClick={()=>{setDraft({...draft,kind:k,file:""});setFileObj(null);}}>{k}</Button>)}</div>

      {draft.kind === "Ссылка" ? (
        <input className="input" placeholder="Вставьте ссылку" value={draft.file} onChange={e=>setDraft({...draft,file:e.target.value})}/>
      ) : (
        <input className="input" type="file" onChange={e=>setFileObj(e.target.files?.[0] || null)}/>
      )}

      <Media kind={draft.kind} name={draft.kind === "Ссылка" ? draft.file : fileObj?.name || ""}/>

      <Button className="full" onClick={publish}>Опубликовать</Button>
    </div>}

    {posts.map(post=><article className="card post" key={post.id}>
      <div className="postHead"><div>A</div><section><b>{post.author}</b><span>{post.date}</span></section></div>
      <p>{post.text}</p>
{String(post.kind).toLowerCase().includes("ссылка") ? (
  <a
    className="link"
    href={normalizeUrl(post.file)}
    target="_blank"
    rel="noopener noreferrer"
  >
    🔗 Открыть ссылку
  </a>
) : (
  <Media kind={post.kind} name={post.file} onOpen={setViewer}/>
)}
      <div className="actions"><span>♡ {post.likes}</span><span>💬 {post.comments.length}</span><span>↗</span></div>
      {post.comments.length > 0 && <div className="comments">{post.comments.map((c,i)=><p key={i}><b>Комментарий:</b> {c}</p>)}</div>}
    </article>)}
 {viewer && <Modal onClose={()=>setViewer(null)} wide>
  <div className="row">
    <h2>{viewer.kind}</h2>
    <button className="icon" onClick={()=>setViewer(null)}>×</button>
  </div>
  {viewer.kind === "Фото" && <img src={viewer.name} alt="Фото" style={{width:"100%",borderRadius:20}} />}
  {viewer.kind === "Видео" && <video src={viewer.name} controls autoPlay style={{width:"100%",borderRadius:20}} />}
</Modal>}
  </div></main>;
}

function Clients({leads,setLeads,onOpen}) {
  const [stage,setStage] = useState("Все");
  const [phone,setPhone] = useState(null);
  const shown = stage==="Все" ? stages : [stage];
  const create = () => {
    const lead = {id:"L-"+Date.now().toString().slice(-4), name:"Новый клиент", phone:"+380", source:sources[0], status:stages[0], notes:"", nextContact:"", manager:"Елена", history:["Клиент создан вручную"]};
    setLeads(prev => [lead,...prev]);
    onOpen(lead);
  };
  const move = (lead) => {
    const next = stages[Math.min(stages.indexOf(lead.status)+1, stages.length-1)];
    setLeads(prev => prev.map(l => l.id===lead.id ? {...l,status:next,history:[...l.history,`Перемещен в стадию: ${next}`]} : l));
  };
  return <main className="screen"><Button onClick={create}>+ Создать клиента</Button><div className="chips"><button className={cn("chip",stage==="Все"&&"active")} onClick={()=>setStage("Все")}>Все</button>{stages.map(s=><button key={s} className={cn("chip",stage===s&&"active")} onClick={()=>setStage(s)}>{s}</button>)}</div><div className="kanban">{shown.map(s=><section className="kanbanCol" key={s}><div className="kanbanHead"><b>{s}</b>{badge(leads.filter(l=>l.status===s).length,"gold")}</div>{leads.filter(l=>l.status===s).map(l=><div className="lead" key={l.id}><div className="leadTop"><section><b>{l.name}</b><span>{l.id} · {l.source}</span></section>{badge(l.status,"dark")}</div><div className="phone"><b>☎ {l.phone}</b><p>{l.notes || "Без заметки"}</p></div><div className="grid4"><Button variant="soft" onClick={()=>setPhone(l.phone)}>☎</Button><Button variant="purple" onClick={()=>setPhone(l.phone)}>V</Button><Button variant="green" onClick={()=>setPhone(l.phone)}>W</Button><Button onClick={()=>onOpen(l)}>✎</Button></div><Button className="full" onClick={()=>move(l)}>Следующий этап →</Button></div>)}</section>)}</div>{phone && <Contact phone={phone} onClose={()=>setPhone(null)}/>}</main>;
}

function Contact({phone,onClose}) {
  const digits = phone.replace(/[^0-9]/g,"");
  return <Modal onClose={onClose}><div className="row"><h2>Связь с клиентом</h2><button className="icon" onClick={onClose}>×</button></div><a className="btn primary full" href={`tel:${phone}`}>Позвонить</a><a className="btn soft full" href={`sms:${phone}`}>SMS</a><a className="btn purple full" href={`viber://chat?number=%2B${digits}`}>Viber</a><a className="btn green full" href={`https://wa.me/${digits}`} target="_blank">WhatsApp</a><div className="card amber">На телефоне откроется установленное приложение.</div></Modal>;
}

function LeadModal({lead,setLeads,setEvents,setHelp,onClose}) {
  const [local,setLocal] = useState(lead);
  const [event,setEvent] = useState({type:"Звонок", date:"2026-05-24", time:"12:00", title:""});
  const [question,setQuestion] = useState("");
  const save = () => { setLeads(prev=>prev.map(l=>l.id===local.id?local:l)); onClose(); };
  const addEvent = () => {
    setEvents(prev=>[{id:"EV-"+Date.now(),leadId:local.id,client:local.name,type:event.type,title:event.title || `${event.type} — ${local.name}`,date:event.date,time:event.time,reminder:60},...prev]);
    setLocal({...local,nextContact:`${event.date} ${event.time}`,history:[...local.history,`Добавлено событие: ${event.type}`]});
  };
  const ask = () => {
    if(!question) return;
    setHelp(prev=>[{id:"H-"+Date.now(),leadId:local.id,client:local.name,manager:local.manager,text:question,reply:"",status:"open"},...prev]);
    setQuestion("");
  };
  return <Modal onClose={onClose} wide><div className="row"><section><label>Имя клиента</label><input className="titleInput" value={local.name} onChange={e=>setLocal({...local,name:e.target.value})}/><p className="muted">{local.id}</p></section><button className="icon" onClick={onClose}>×</button></div><div className="formGrid"><Field label="Телефон"><input value={local.phone} onChange={e=>setLocal({...local,phone:e.target.value})}/></Field><Field label="Источник"><select value={local.source} onChange={e=>setLocal({...local,source:e.target.value})}>{sources.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Статус"><select value={local.status} onChange={e=>setLocal({...local,status:e.target.value})}>{stages.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Следующий контакт"><input value={local.nextContact} onChange={e=>setLocal({...local,nextContact:e.target.value})}/></Field></div><Field label="Заметки менеджера"><textarea value={local.notes} onChange={e=>setLocal({...local,notes:e.target.value})}/></Field><div className="card inner"><h3>Календарь клиента</h3><div className="grid4">{eventTypes.map(t=><Button key={t} variant={event.type===t?"primary":"soft"} onClick={()=>setEvent({...event,type:t})}>{t}</Button>)}</div><div className="grid3"><input className="input" type="date" value={event.date} onChange={e=>setEvent({...event,date:e.target.value})}/><input className="input" type="time" value={event.time} onChange={e=>setEvent({...event,time:e.target.value})}/><input className="input" placeholder="Название" value={event.title} onChange={e=>setEvent({...event,title:e.target.value})}/></div><Button className="full" onClick={addEvent}>Сохранить событие</Button></div><div className="card amber"><h3>Помощь директора</h3><textarea className="input" placeholder="Вопрос директору..." value={question} onChange={e=>setQuestion(e.target.value)}/><Button className="full" onClick={ask}>Помощь менеджеру</Button></div><div className="card"><h3>История</h3>{local.history.map((h,i)=><p className="muted" key={i}>• {h}</p>)}</div><Button className="full sticky" onClick={save}>Сохранить клиента</Button></Modal>;
}

function Calendar({events,setEvents,leads,setLeads}) {
  const [view,setView] = useState("month");
  const [year,setYear] = useState(2026);
  const [month,setMonth] = useState(4);
  const [open,setOpen] = useState(null);
  const days = monthGrid(year,month);
  const saveEvent = () => {
    const lead = leads.find(l=>l.id===open.leadId) || leads[0];
    const ev = {...open,id:open.id || "EV-"+Date.now(),client:lead.name,title:open.title || `${open.type} — ${lead.name}`};
    setEvents(prev => open.id ? prev.map(e=>e.id===open.id?ev:e) : [ev,...prev]);
    setOpen(null);
  };
  const create = (date) => setOpen({leadId:leads[0]?.id,type:"Звонок",title:"",date,time:"12:00",reminder:60});
  return <main className="screen calendarLayout"><div className="stack"><div className="grid2"><select className="input" value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:20},(_,i)=>2026+i).map(y=><option key={y}>{y}</option>)}</select><select className="input" value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i}>{m}</option>)}</select></div><div className="grid4">{[["year","Год"],["month","Месяц"],["week","Неделя"],["day","День"]].map(([id,label])=><Button key={id} variant={view===id?"primary":"soft"} onClick={()=>setView(id)}>{label}</Button>)}</div>{view==="year" && <div className="card"><h3>{year} год</h3><div className="yearGrid">{months.map((m,i)=><button className="monthBox" key={m} onClick={()=>{setMonth(i);setView("month")}}><b>{m}</b><span>{events.filter(e=>e.date.startsWith(`${year}-${String(i+1).padStart(2,"0")}`)).length} событий</span></button>)}</div></div>}{view==="month" && <div className="card"><div className="row"><h3>{months[month]} {year}</h3>{badge(events.length+" событий","gold")}</div><div className="week">{week.map(w=><b key={w}>{w}</b>)}</div><div className="calgrid">{days.map(d=>{const evs=events.filter(e=>e.date===d.iso);return <button key={d.iso} className={cn("day",!d.current&&"mutedDay")} onClick={()=>create(d.iso)}><b>{d.day}</b>{evs.slice(0,2).map(e=><span className="mini" key={e.id}>{e.time} {e.title}</span>)}</button>})}</div></div>}{view==="week" && <div className="card"><h3>Неделя</h3>{days.slice(0,7).map(d=><button className="weekRow" key={d.iso} onClick={()=>create(d.iso)}><b>{d.iso}</b><span>{events.filter(e=>e.date===d.iso).length} событий</span></button>)}</div>}{view==="day" && <div className="card"><h3>День</h3>{["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map(t=><button className="weekRow" key={t} onClick={()=>create(`2026-${String(month+1).padStart(2,"0")}-24`)}><b>{t}</b><span>добавить событие</span></button>)}</div>}</div><div className="stack">{events.map(e=><div className="card event" key={e.id} onClick={()=>setOpen(e)}><div className="row"><section><b>{e.title}</b><p className="muted">{e.type} · {e.date} · {e.time}</p></section>{badge(e.reminder+" мин","gold")}</div><p className="muted">{e.client}</p></div>)}</div>{open && <Modal onClose={()=>setOpen(null)}><div className="row"><h2>Событие</h2><button className="icon" onClick={()=>setOpen(null)}>×</button></div><input className="input" placeholder="Название" value={open.title} onChange={e=>setOpen({...open,title:e.target.value})}/><div className="grid4">{eventTypes.map(t=><Button key={t} variant={open.type===t?"primary":"soft"} onClick={()=>setOpen({...open,type:t})}>{t}</Button>)}</div><select className="input" value={open.leadId} onChange={e=>setOpen({...open,leadId:e.target.value})}>{leads.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select><div className="grid2"><input className="input" type="date" value={open.date} onChange={e=>setOpen({...open,date:e.target.value})}/><input className="input" type="time" value={open.time} onChange={e=>setOpen({...open,time:e.target.value})}/></div><Button className="full" onClick={saveEvent}>Сохранить событие</Button></Modal>}</main>;
}

function Properties({properties,setProperties,onOpen}) {
  const [type,setType] = useState("Все");
  const [district,setDistrict] = useState("Все");
  const filtered = properties.filter(p=>(type==="Все"||p.type===type)&&(district==="Все"||p.district===district));
  const create = () => {
    const p = {id:"P-"+Date.now(),title:"Новый объект",type:types[0],district:districts[0],status:"Актуален",price:70000,area:45,floor:"1/1",owner:"",ownerPhone:"+380",description:"Описание объекта",media:[],hot:false,history:["Объект создан"]};
    setProperties(prev=>[p,...prev]);
    onOpen(p);
  };
  return <main className="screen"><Button onClick={create}>+ Добавить объект</Button><div className="chips"><button className={cn("chip",type==="Все"&&"active")} onClick={()=>setType("Все")}>Все</button>{types.map(t=><button key={t} className={cn("chip",type===t&&"active")} onClick={()=>setType(t)}>{t}</button>)}</div><div className="chips"><button className={cn("chip",district==="Все"&&"active")} onClick={()=>setDistrict("Все")}>Все районы</button>{districts.map(d=><button key={d} className={cn("chip",district===d&&"active")} onClick={()=>setDistrict(d)}>{d}</button>)}</div><div className="propsGrid">{filtered.map(p=><div className="card property" key={p.id}><div className="propCover">{badge(p.hot?"Горячий":p.status,p.hot?"red":"dark")}<section><h3>{p.title}</h3><span>{p.district} · {p.area} м² · {p.floor}</span></section></div><div className="row"><h2>{money(p.price)}</h2>{badge(p.type)}</div><p className="muted">{p.description}</p>{p.media[0] && <Media kind={p.media[0].split(":")[0]} name={p.media[0]} small/>}<div className="grid2"><Button onClick={()=>onOpen(p)}>Смотреть</Button><Button variant="soft" onClick={()=>onOpen(p)}>Редактировать</Button></div></div>)}</div></main>;
}

function PropertyModal({property,setProperties,onClose}) {
  const [local,setLocal] = useState(property);
  const [mediaKind,setMediaKind] = useState("Фото");
  const [mediaFile,setMediaFile] = useState(null);
  const [viewer,setViewer] = useState(null);

  async function ensurePropertySaved() {
    const numericId = Number(local.id);

    if (numericId) return numericId;

    const payload = {
      title: local.title || "Новый объект",
      property_type: local.type || types[0],
      district: local.district || districts[0],
      status: local.status || "Актуален",
      price: Number(local.price) || 0,
      area: Number(local.area) || 0,
      floor: parseInt(local.floor) || null,
      owner_name: local.owner || "",
      owner_phone: local.ownerPhone || "",
      description: local.description || ""
    };

    const { data, error } = await supabase
      .from("properties")
      .insert(payload)
      .select()
      .single();

    if (error) {
      alert("Ошибка сохранения объекта: " + error.message);
      return null;
    }

    const newId = String(data.id);

    setLocal(prev => ({ ...prev, id: newId }));

    setProperties(prev => prev.map(p =>
      p.id === local.id ? { ...p, id: newId } : p
    ));

    return data.id;
  }

  async function addMedia() {
    if (!mediaFile) {
      alert("Сначала выбери фото или видео");
      return;
    }

    const propertyId = await ensurePropertySaved();
    if (!propertyId) return;

    const originalName = mediaFile.name || "upload";
    const rawExt = originalName.includes(".") ? originalName.split(".").pop() : "file";
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "file";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${propertyId}/${safeName}`;

    const { error: uploadError } = await supabase
      .storage
      .from("property-media")
      .upload(path, mediaFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: mediaFile.type || undefined
      });

    if (uploadError) {
      alert("Ошибка загрузки файла: " + uploadError.message);
      return;
    }

    const publicUrl = supabase
      .storage
      .from("property-media")
      .getPublicUrl(path).data.publicUrl;

    const { data: mediaRow, error: insertError } = await supabase
      .from("property_media")
      .insert({
        property_id: propertyId,
        media_type: mediaKind,
        media_url: publicUrl,
        file_name: originalName
      })
      .select()
      .single();

    if (insertError) {
      alert("Файл загрузился, но не записался в таблицу: " + insertError.message);
      return;
    }

    const item = {
      kind: mediaRow.media_type,
      url: mediaRow.media_url,
      name: mediaRow.file_name
    };

    setLocal(prev => ({
      ...prev,
      media: [...(prev.media || []), item],
      history: [...(prev.history || []), `Добавлено ${mediaKind}`]
    }));

    setProperties(prev => prev.map(p =>
      String(p.id) === String(local.id) || String(p.id) === String(propertyId)
        ? { ...p, id: String(propertyId), media: [...(p.media || []), item] }
        : p
    ));

    setMediaFile(null);
    alert("Медиа добавлено");
  }

  const save = () => {
    setProperties(prev => prev.map(p => p.id === local.id ? local : p));
    onClose();
  };

  return <Modal onClose={onClose} wide>
    <div className="propHero">
      <button className="icon heroClose" onClick={onClose}>×</button>
      <h2>{local.title}</h2>
      <p>{local.type} · {local.district} · {money(local.price)}</p>
    </div>

    <div className="grid2">
      <Field label="Название объекта">
        <input className="input" value={local.title || ""} onChange={e=>setLocal({...local,title:e.target.value})}/>
      </Field>

      <Field label="Тип">
        <select className="input" value={local.type || types[0]} onChange={e=>setLocal({...local,type:e.target.value})}>
          {types.map(t=><option key={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Район">
        <select className="input" value={local.district || districts[0]} onChange={e=>setLocal({...local,district:e.target.value})}>
          {districts.map(d=><option key={d}>{d}</option>)}
        </select>
      </Field>

      <Field label="Цена">
        <input className="input" value={local.price || ""} onChange={e=>setLocal({...local,price:e.target.value})}/>
      </Field>

      <Field label="Площадь">
        <input className="input" value={local.area || ""} onChange={e=>setLocal({...local,area:e.target.value})}/>
      </Field>

      <Field label="Этаж">
        <input className="input" value={local.floor || ""} onChange={e=>setLocal({...local,floor:e.target.value})}/>
      </Field>

      <Field label="Собственник">
        <input className="input" value={local.owner || ""} onChange={e=>setLocal({...local,owner:e.target.value})}/>
      </Field>

      <Field label="Телефон собственника">
        <input className="input" value={local.ownerPhone || ""} onChange={e=>setLocal({...local,ownerPhone:e.target.value})}/>
      </Field>
    </div>

    <Field label="Описание">
      <textarea className="input" value={local.description || ""} onChange={e=>setLocal({...local,description:e.target.value})}/>
    </Field>

    <div className="card">
      <h3>Фото / видео объекта</h3>

      <div className="grid4">
        <Button variant={mediaKind==="Фото" ? "primary" : "soft"} onClick={()=>setMediaKind("Фото")}>Фото</Button>
        <Button variant={mediaKind==="Видео" ? "primary" : "soft"} onClick={()=>setMediaKind("Видео")}>Видео</Button>
      </div>

      <input className="input" type="file" onChange={e=>setMediaFile(e.target.files?.[0] || null)}/>

      <Button className="full" onClick={addMedia}>Добавить фото/видео</Button>

      <div className="grid2">
        {(local.media || []).map((m,i)=>{
          const kind = m.kind || "Фото";
          const url = m.url || m.media_url || m;
          return <Media key={i} kind={kind} name={url} small onOpen={setViewer}/>;
        })}
      </div>
    </div>

    <Button className="full" onClick={save}>Сохранить объект</Button>

    {viewer && <Modal onClose={()=>setViewer(null)} wide>
      <div className="row">
        <h2>{viewer.kind}</h2>
        <button className="icon" onClick={()=>setViewer(null)}>×</button>
      </div>
      {viewer.kind === "Фото" && <img src={viewer.name} alt="Фото" style={{width:"100%",borderRadius:20}} />}
      {viewer.kind === "Видео" && <video src={viewer.name} controls autoPlay style={{width:"100%",borderRadius:20}} />}
    </Modal>}
  </Modal>;
}
function Analytics({leads,properties,events,role}) {
  const scoped = role==="Менеджер по продажам" ? leads.filter(l=>l.manager==="Елена") : leads;
  const deals = scoped.filter(l=>l.status==="Сделка").length;
  return <main className="screen"><div className="card dark"><h2>Аналитика CRM</h2><p>{role==="Менеджер по продажам"?"Доступна только личная аналитика.":"Доступна общая аналитика и фильтры."}</p></div><div className="stats">{[["Лиды",scoped.length],["Сделки",deals],["В работе",scoped.filter(l=>!["Сделка","Отказ"].includes(l.status)).length],["События",events.length],["Объекты",properties.length],["Конверсия",scoped.length?Math.round(deals/scoped.length*100)+"%":"0%"]].map(([a,b])=><div className="stat" key={a}><span>{a}</span><b>{b}</b></div>)}</div><div className="card"><h3>Стадии клиентов</h3>{stages.map(s=><div className="stageRow" key={s}><span>{s}</span><b>{scoped.filter(l=>l.status===s).length}</b></div>)}</div></main>;
}

function Help({help,setHelp,leads,onOpen}) {
  const [reply,setReply] = useState({});
  const answer = id => { if(!reply[id]) return; setHelp(prev=>prev.map(h=>h.id===id?{...h,reply:reply[id],status:"answered"}:h)); setReply({...reply,[id]:""}); };
  const sound = () => { try{ const ctx=new AudioContext(); const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.frequency.value=980; gain.gain.value=.05; osc.connect(gain); gain.connect(ctx.destination); osc.start(); setTimeout(()=>{osc.stop();ctx.close()},400);}catch{} };
  return <main className="screen"><div className="card dark"><div className="row"><section><h2>Помощь менеджерам</h2><p>Вопросы из карточек клиентов</p></section><Button onClick={sound}>Звук</Button></div></div>{help.map(h=>{const lead=leads.find(l=>l.id===h.leadId);return <div className="card" key={h.id}><div className="row"><section><h3>{h.client}</h3><p className="muted">{h.manager}</p></section>{badge(h.status==="open"?"Ожидает":"Отвечено",h.status==="open"?"red":"green")}</div><div className="question"><b>Вопрос менеджера</b><p>{h.text}</p></div>{h.reply&&<div className="reply"><b>Директор:</b> {h.reply}</div>}<textarea className="input" placeholder="Ответить менеджеру..." value={reply[h.id]||""} onChange={e=>setReply({...reply,[h.id]:e.target.value})}/><div className="grid2"><Button onClick={()=>answer(h.id)}>Ответить</Button><Button variant="soft" onClick={()=>lead&&onOpen(lead)}>Открыть клиента</Button></div></div>})}</main>;
}

function Access({managers,setManagers}) {
  const [manager,setManager] = useState({name:"",email:"",role:"Менеджер по продажам"});
  const add = () => { if(!manager.name) return; setManagers(prev=>[{id:"AG-"+Date.now(),...manager,access:true},...prev]); setManager({name:"",email:"",role:"Менеджер по продажам"}); };
  return <main className="screen"><div className="card dark"><h2>CRM Real Estate</h2><p>Агентства, сотрудники, роли и доступы.</p></div><div className="card"><h3>Добавить менеджера</h3><input className="input" placeholder="ФИО" value={manager.name} onChange={e=>setManager({...manager,name:e.target.value})}/><input className="input" placeholder="Email" value={manager.email} onChange={e=>setManager({...manager,email:e.target.value})}/><select className="input" value={manager.role} onChange={e=>setManager({...manager,role:e.target.value})}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select><Button className="full" onClick={add}>Создать доступ</Button></div>{managers.map(m=><div className="card" key={m.id}><div className="row"><section><h3>{m.name}</h3><p className="muted">{m.email}<br/>{m.role}</p></section>{badge(m.access?"Доступ активен":"Доступ закрыт",m.access?"green":"red")}</div><div className="grid2"><Button variant="soft" onClick={()=>setManagers(prev=>prev.map(x=>x.id===m.id?{...x,access:!x.access}:x))}>{m.access?"Забрать доступ":"Вернуть доступ"}</Button><Button variant="danger" onClick={()=>setManagers(prev=>prev.filter(x=>x.id!==m.id))}>Удалить</Button></div></div>)}</main>;
}

function More({role,setPage}) {
  return <main className="screen"><div className="card"><h3>Язык интерфейса</h3><div className="grid3"><Button>Русский</Button><Button variant="soft">Українська</Button><Button variant="soft">English</Button></div></div><div className="card row"><section><h3>Аналитика</h3><p className="muted">{role==="Менеджер по продажам"?"Только моя аналитика":"Доступ по роли"}</p></section><Button onClick={()=>setPage("analytics")}>Открыть</Button></div>{role==="Администратор директор"&&<div className="card row"><section><h3>Помощь менеджерам</h3><p className="muted">Вопросы из карточек клиентов</p></section><Button onClick={()=>setPage("help")}>Открыть</Button></div>}{role==="Администратор тех отдел"&&<div className="card row"><section><h3>Доступы и агентства</h3><p className="muted">Менеджеры, роли, доступы</p></section><Button onClick={()=>setPage("access")}>Открыть</Button></div>}{role==="Менеджер по продажам"&&<div className="card amber">Менеджеру доступны только язык и личная аналитика.</div>}</main>;
}

export default function App(){
  const [page,setPage] = useStorage("page","feed");
  const [role,setRole] = useStorage("role","Администратор директор");

  const [leads,setLeadsRaw] = useState(initialLeads);
  const [posts,setPostsRaw] = useState(initialPosts);
  const [properties,setPropertiesRaw] = useState(initialProperties);

  const [events,setEvents] = useStorage("events",initialEvents);
  const [help,setHelp] = useStorage("help",initialHelp);
  const [managers,setManagers] = useStorage("managers",initialManagers);

  const [lead,setLead] = useState(null);
  const [property,setProperty] = useState(null);

  function leadFromDb(row){
    return {
      id: String(row.id),
      name: row.name || "Без имени",
      phone: row.phone || "",
      source: row.source || sources[0],
      status: row.stage || "Новый Лид",
      notes: row.notes || "",
      nextContact: row.next_contact_at || "",
      manager: "Елена",
      history: ["Загружено из Supabase"]
    };
  }

  function propertyFromDb(row){
    return {
      id: String(row.id),
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
      media: [],
      hot: false,
      history: ["Загружено из Supabase"]
    };
  }

  function postFromDb(row, mediaRows = []){
  const media = mediaRows.find(m => String(m.news_id) === String(row.id));

  return {
    id: String(row.id),
    author: "Администратор",
    date: row.created_at ? new Date(row.created_at).toLocaleString() : new Date().toLocaleString(),
    text: row.content || row.title || "",
    kind: media?.media_type || "Фото",
    file: media?.link_url || media?.media_url || "",
    likes: row.likes_count || 0,
    comments: []
  };
}

  async function loadFromSupabase(){
    const leadsRes = await supabase.from("leads").select("*").order("created_at", { ascending:false });
    const propsRes = await supabase.from("properties").select("*").order("created_at", { ascending:false });
    const postsRes = await supabase.from("news").select("*").order("created_at", { ascending:false });
    const mediaRes = await supabase.from("news_media").select("*").order("created_at", { ascending:false });

    if (!leadsRes.error && leadsRes.data && leadsRes.data.length > 0) {
      setLeadsRaw(leadsRes.data.map(leadFromDb));
    }

    if (!postsRes.error && postsRes.data && postsRes.data.length > 0) {
  const mediaRows = !mediaRes.error && mediaRes.data ? mediaRes.data : [];
  setPostsRaw(postsRes.data.map(row => postFromDb(row, mediaRows)));
}

    if (!postsRes.error && postsRes.data && postsRes.data.length > 0) {
      setPostsRaw(postsRes.data.map(postFromDb));
    }
  }

  useEffect(() => {
    loadFromSupabase();
  }, []);

  async function syncLeadToSupabase(item){
    const payload = {
      name: item.name,
      phone: item.phone,
      source: item.source,
      stage: item.status,
      notes: item.notes,
      next_contact_at: item.nextContact || null
    };

    if (!String(item.id).startsWith("L-")) {
      await supabase.from("leads").update(payload).eq("id", item.id);
    } else {
      const { data, error } = await supabase.from("leads").insert(payload).select().single();
      if (!error && data) {
        setLeadsRaw(prev => prev.map(x => x.id === item.id ? leadFromDb(data) : x));
      }
    }
  }

  async function syncPropertyToSupabase(item){
    const payload = {
      title: item.title,
      property_type: item.type,
      district: item.district,
      status: item.status,
      price: Number(item.price) || 0,
      area: Number(item.area) || 0,
      floor: parseInt(item.floor) || null,
      owner_name: item.owner,
      owner_phone: item.ownerPhone,
      description: item.description
    };

    if (!String(item.id).startsWith("P-")) {
      await supabase.from("properties").update(payload).eq("id", item.id);
    } else {
      const { data, error } = await supabase.from("properties").insert(payload).select().single();
      if (!error && data) {
        setPropertiesRaw(prev => prev.map(x => x.id === item.id ? propertyFromDb(data) : x));
      }
    }
  }

  async function syncPostToSupabase(item){
    if (!String(item.id).startsWith("N-")) return;

    const payload = {
      title: item.text ? item.text.slice(0,80) : "Публикация",
      content: item.text || "",
      likes_count: item.likes || 0,
      comments_count: item.comments ? item.comments.length : 0
    };

    const { data, error } = await supabase.from("news").insert(payload).select().single();
    if (!error && data) {
      setPostsRaw(prev => prev.map(x => x.id === item.id ? postFromDb(data) : x));
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

      const changed = value.filter(v => {
        const old = prev.find(p => p.id === v.id);
        return !old || JSON.stringify(old) !== JSON.stringify(v);
      });

      changed.forEach(syncPropertyToSupabase);
      return value;
    });
  }

  function setPosts(next){
    setPostsRaw(prev => {
      const value = typeof next === "function" ? next(prev) : next;

      const changed = value.filter(v => !prev.find(p => p.id === v.id));
      changed.forEach(syncPostToSupabase);

      return value;
    });
  }

  return <div className="layout"><Sidebar page={page} setPage={setPage} role={role}/><div className="mainWrap"><main className="main"><Top page={page} setPage={setPage}/><div className="roleSelect"><select value={role} onChange={e=>setRole(e.target.value)}><option>Менеджер по продажам</option><option>Администратор директор</option><option>Администратор тех отдел</option></select></div>{page==="feed"&&<Feed posts={posts} setPosts={setPosts}/>} {page==="clients"&&<Clients leads={leads} setLeads={setLeads} onOpen={setLead}/>} {page==="calendar"&&<Calendar events={events} setEvents={setEvents} leads={leads} setLeads={setLeads}/>} {page==="properties"&&<Properties properties={properties} setProperties={setProperties} onOpen={setProperty}/>} {page==="analytics"&&<Analytics leads={leads} properties={properties} events={events} role={role}/>} {page==="help"&&<Help help={help} setHelp={setHelp} leads={leads} onOpen={setLead}/>} {page==="access"&&<Access managers={managers} setManagers={setManagers}/>} {page==="more"&&<More role={role} setPage={setPage}/>}<Bottom page={page} setPage={setPage}/>{lead&&<LeadModal lead={lead} setLeads={setLeads} setEvents={setEvents} setHelp={setHelp} onClose={()=>setLead(null)}/>} {property&&<PropertyModal property={property} setProperties={setProperties} onClose={()=>setProperty(null)}/>}</main></div></div>
}
