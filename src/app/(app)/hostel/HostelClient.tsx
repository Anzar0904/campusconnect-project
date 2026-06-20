'use client'
import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

const MESS_MENU: Record<string, Record<string, string[]>> = {
  Monday:    { Breakfast:['Poha','Chai','Banana'],        Lunch:['Dal Makhani','Jeera Rice','Roti','Salad'], Dinner:['Paneer Butter Masala','Naan','Raita'] },
  Tuesday:   { Breakfast:['Idli-Sambar','Coconut Chutney'], Lunch:['Rajma','Steamed Rice','Roti','Pickle'],   Dinner:['Aloo Gobi','Roti','Dal','Kheer'] },
  Wednesday: { Breakfast:['Paratha','Curd','Pickle'],      Lunch:['Chole','Bhature','Salad'],                 Dinner:['Kadhi Pakora','Rice','Roti'] },
  Thursday:  { Breakfast:['Upma','Chai','Boiled Egg'],     Lunch:['Mix Veg','Roti','Dal','Rice'],             Dinner:['Special Biryani','Raita','Papad'] },
  Friday:    { Breakfast:['Bread Toast','Omelette','Juice'], Lunch:['Daal Fry','Rice','Roti','Achi'],          Dinner:['Chana Masala','Roti','Gulab Jamun'] },
  Saturday:  { Breakfast:['Puri Sabzi','Halwa'],            Lunch:['Rajma Rice','Salad'],                     Dinner:['Special Fried Rice','Manchurian','Ice Cream'] },
  Sunday:    { Breakfast:['Chole Bhature'],                 Lunch:['Special Thali','Kheer'],                  Dinner:['Paneer Masala','Laccha Paratha','Custard'] },
}

const HOSTELS = [
  { name:'Hall 1 (Boys)', warden:'Mr. Sharma', capacity:200, occupied:183, features:['24/7 WiFi','AC Rooms','Gym Access','Common Room'] },
  { name:'Hall 2 (Boys)', warden:'Mr. Kumar', capacity:180, occupied:172, features:['WiFi','Study Hall','Sports Room'] },
  { name:'Hall 3 (Boys)', warden:'Mr. Verma', capacity:160, occupied:148, features:['WiFi','Common TV Room'] },
  { name:'Hostel A (Girls)', warden:'Mrs. Singh', capacity:150, occupied:144, features:['24/7 Security','AC Rooms','WiFi','Salon'] },
  { name:'Hostel B (Girls)', warden:'Mrs. Patel', capacity:140, occupied:129, features:['WiFi','Common Room','Gym'] },
]

const COMPLAINTS = [
  { id:1, issue:'WiFi down in Room 204', status:'resolved', date:'2026-06-05' },
  { id:2, issue:'Water tap leaking – Room 118', status:'in_progress', date:'2026-06-06' },
  { id:3, issue:'AC not working – Room 312', status:'open', date:'2026-06-07' },
]

const DAYS = Object.keys(MESS_MENU)
const today = DAYS[new Date().getDay()===0?6:new Date().getDay()-1]

export default function HostelClient({ profile, seekingRoommates, userId }: any) {
  const [activeTab, setActiveTab] = useState<'overview'|'mess'|'roommates'|'complaints'>('overview')
  const [selectedDay, setSelectedDay] = useState(today)
  const [complaintText, setComplaintText] = useState('')

  const statusColor: Record<string,string> = { resolved:'#86efac', in_progress:'#fbbf24', open:'#ffb4ab' }

  function submitComplaint() {
    if (!complaintText.trim()) return
    toast.success('Complaint registered! The warden has been notified.')
    setComplaintText('')
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">Hostel Hub</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">Mess menu, hostel info, roommates and complaints</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',width:'fit-content'}}>
        {(['overview','mess','roommates','complaints'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-mono capitalize transition-all"
            style={activeTab===tab
              ?{background:'rgba(79,70,229,0.4)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
              :{color:'#c7c4d8'}}>
            {tab==='mess'?'🍽️ Mess Menu':tab==='roommates'?'🤝 Roommates':tab==='complaints'?'📝 Complaints':'🏠 Overview'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab==='overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {HOSTELS.map(h=>(
              <div key={h.name} className="glass-card rounded-xl p-5">
                <h3 className="font-display font-semibold text-on-surface text-sm mb-1">{h.name}</h3>
                <p className="text-xs text-on-surface-variant font-mono mb-3">Warden: {h.warden}</p>
                <div className="mb-3">
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-on-surface-variant">Occupancy</span>
                    <span className="text-on-surface">{h.occupied}/{h.capacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{background:'rgba(255,255,255,0.08)'}}>
                    <div className="h-full rounded-full" style={{width:`${(h.occupied/h.capacity)*100}%`,background:'linear-gradient(90deg,#4f46e5,#4cd7f6)'}} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {h.features.map(f=>(
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{background:'rgba(195,192,255,0.1)',color:'#c3c0ff'}}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mess Menu */}
      {activeTab==='mess' && (
        <div className="space-y-4">
          <div className="flex gap-1 flex-wrap">
            {DAYS.map(d=>(
              <button key={d} onClick={()=>setSelectedDay(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                style={selectedDay===d
                  ?{background:'rgba(76,215,246,0.2)',color:'#4cd7f6',border:'1px solid rgba(76,215,246,0.35)'}
                  :d===today
                    ?{background:'rgba(79,70,229,0.2)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
                    :{background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.06)'}}>
                {d}{d===today?' (Today)':''}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(MESS_MENU[selectedDay]||{}).map(([meal,items])=>(
              <div key={meal} className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{meal==='Breakfast'?'🌅':meal==='Lunch'?'☀️':'🌙'}</span>
                  <h3 className="font-display font-semibold text-on-surface text-sm">{meal}</h3>
                </div>
                <ul className="space-y-1.5">
                  {(items as string[]).map((item:string)=>(
                    <li key={item} className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'#4cd7f6'}} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roommate Finder */}
      {activeTab==='roommates' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-semibold text-on-surface">Looking for a roommate?</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Enable roommate mode to show up in listings</p>
            </div>
            <button className="btn-primary text-sm">Enable</button>
          </div>
          {seekingRoommates.length===0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3 block">people</span>
              <p className="text-on-surface-variant">No one is actively seeking roommates right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {seekingRoommates.map((room:any)=>(
                <div key={room.id} className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0">
                      <Image 
                        src={room.occupant?.avatar_url||`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(room.occupant?.full_name||'U')}&backgroundColor=4f46e5&textColor=ffffff`} 
                        alt={room.occupant?.full_name || ''} 
                        width={40} 
                        height={40} 
                        className="object-cover w-full h-full" 
                      />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-on-surface text-sm">{room.occupant?.full_name}</p>
                      <p className="text-xs text-on-surface-variant font-mono">{room.occupant?.branch} · Y{room.occupant?.year}</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-2">Room {room.room_number} · {room.hostel_name}</p>
                  <button className="btn-ghost text-xs w-full justify-center">Contact</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complaints */}
      {activeTab==='complaints' && (
        <div className="space-y-4">
          <div className="glass-elevated rounded-xl p-5 border border-white/[0.08]">
            <h2 className="font-display font-semibold text-on-surface mb-3">File a Complaint</h2>
            <textarea className="input-glass resize-none" rows={3} placeholder="Describe the issue (e.g., WiFi down in Room 204, water leak, AC not working)…" value={complaintText} onChange={e=>setComplaintText(e.target.value)} />
            <div className="flex justify-end mt-3">
              <button onClick={submitComplaint} className="btn-primary text-sm">
                <span className="material-symbols-outlined text-[16px]">send</span>
                Submit
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-on-surface mb-3">Recent Complaints</h2>
            <div className="space-y-3">
              {COMPLAINTS.map(c=>(
                <div key={c.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:statusColor[c.status]}} />
                  <div className="flex-1">
                    <p className="text-sm text-on-surface">{c.issue}</p>
                    <p className="text-xs text-on-surface-variant font-mono mt-0.5">{c.date}</p>
                  </div>
                  <span className="chip text-[10px] capitalize" style={{background:`${statusColor[c.status]}18`,color:statusColor[c.status],border:`1px solid ${statusColor[c.status]}30`}}>
                    {c.status.replace('_',' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
