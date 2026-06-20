'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import toast from 'react-hot-toast'

const CATEGORIES = ['All','Electronics','Books','ID Card','Keys','Clothing','Bag','Wallet','Water Bottle','Other']

export default function LostFoundClient({ items, userId }: any) {
  const allItems = items
  const [typeFilter, setTypeFilter] = useState<'all'|'lost'|'found'>('all')
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type:'lost', title:'', category:'Electronics', description:'', location:'', date_occurred:'' })
  const [posting, setPosting] = useState(false)
  const supabase = createClient()

  const filtered = allItems.filter((item:any) => {
    const matchType = typeFilter === 'all' || item.type === typeFilter
    const matchCat = category === 'All' || item.category === category
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchCat && matchSearch
  })

  async function postItem() {
    if (!form.title || !form.category) { toast.error('Fill required fields'); return }
    setPosting(true)
    const { error } = await supabase.from('lost_found').insert({ ...form, reporter_id: userId })
    setPosting(false)
    if (error) { toast.error('Failed to post'); return }
    toast.success('Post added!')
    setShowForm(false)
    setForm({ type:'lost', title:'', category:'Electronics', description:'', location:'', date_occurred:'' })
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Lost & Found</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Help return lost items to their owners</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="btn-primary text-sm">
          <span className="material-symbols-outlined text-[16px]">add</span>
          Report Item
        </button>
      </div>

      {showForm && (
        <div className="glass-elevated rounded-xl p-5 space-y-4 border border-primary/20">
          <div className="flex gap-2">
            {(['lost','found'] as const).map(t=>(
              <button key={t} onClick={()=>setForm(p=>({...p,type:t}))}
                className="px-4 py-2 rounded-lg text-sm font-mono capitalize transition-all"
                style={form.type===t
                  ? t==='lost'
                    ? {background:'rgba(255,180,171,0.15)',color:'#ffb4ab',border:'1px solid rgba(255,180,171,0.3)'}
                    : {background:'rgba(134,239,172,0.15)',color:'#86efac',border:'1px solid rgba(134,239,172,0.3)'}
                  : {background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.06)'}}>
                {t==='lost'?'🔴':'🟢'} I {t} something
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="section-label block mb-1">ITEM NAME *</label>
              <input className="input-glass" placeholder="What was lost/found?" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} />
            </div>
            <div>
              <label className="section-label block mb-1">CATEGORY</label>
              <select className="input-glass" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="section-label block mb-1">LOCATION</label>
              <input className="input-glass" placeholder="Where?" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} />
            </div>
            <div>
              <label className="section-label block mb-1">DATE</label>
              <input type="date" className="input-glass" value={form.date_occurred} onChange={e=>setForm(p=>({...p,date_occurred:e.target.value}))} />
            </div>
            <div>
              <label className="section-label block mb-1">DESCRIPTION</label>
              <input className="input-glass" placeholder="Identifying features…" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>setShowForm(false)} className="btn-ghost text-sm">Cancel</button>
            <button onClick={postItem} disabled={posting} className="btn-primary text-sm">{posting?'Posting…':'Submit'}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input className="input-glass pl-9" placeholder="Search lost & found…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(['all','lost','found'] as const).map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)}
              className="px-4 py-2 rounded-lg text-sm font-mono capitalize transition-all"
              style={typeFilter===t
                ? t==='lost'
                  ?{background:'rgba(255,180,171,0.15)',color:'#ffb4ab',border:'1px solid rgba(255,180,171,0.3)'}
                  : t==='found'
                    ?{background:'rgba(134,239,172,0.15)',color:'#86efac',border:'1px solid rgba(134,239,172,0.3)'}
                    :{background:'rgba(79,70,229,0.3)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
                :{background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.06)'}}>
              {t==='all'?'All':t==='lost'?'🔴 Lost':'🟢 Found'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(cat=>(
            <button key={cat} onClick={()=>setCategory(cat)}
              className="px-3 py-2 rounded-lg text-xs font-mono transition-all"
              style={category===cat
                ?{background:'rgba(79,70,229,0.3)',color:'#c3c0ff',border:'1px solid rgba(195,192,255,0.2)'}
                :{background:'rgba(255,255,255,0.04)',color:'#c7c4d8',border:'1px solid rgba(255,255,255,0.06)'}}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item:any)=>(
          <div key={item.id} className="glass-card rounded-xl p-5 flex gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={item.type==='lost'
                ?{background:'rgba(255,180,171,0.15)',border:'1px solid rgba(255,180,171,0.3)'}
                :{background:'rgba(134,239,172,0.15)',border:'1px solid rgba(134,239,172,0.3)'}}>
              <span className="material-symbols-outlined text-[24px]" style={{color:item.type==='lost'?'#ffb4ab':'#86efac',fontVariationSettings:"'FILL' 1"}}>
                {item.type==='lost'?'location_searching':'location_on'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="chip text-[10px]" style={item.type==='lost'?{background:'rgba(255,180,171,0.15)',color:'#ffb4ab',border:'1px solid rgba(255,180,171,0.3)'}:{background:'rgba(134,239,172,0.15)',color:'#86efac',border:'1px solid rgba(134,239,172,0.3)'}}>
                  {item.type==='lost'?'LOST':'FOUND'}
                </span>
                <span className="chip chip-primary text-[10px]">{item.category}</span>
                {item.status==='resolved' && <span className="chip chip-success text-[10px]">Resolved</span>}
              </div>
              <h3 className="font-display font-semibold text-on-surface text-sm">{item.title}</h3>
              {item.description && <p className="text-xs text-on-surface-variant mt-1">{item.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant font-mono">
                {item.location && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{item.location}</span>}
                {item.date_occurred && <span>{format(new Date(item.date_occurred),'d MMM yyyy')}</span>}
                <span>by {item.reporter?.full_name||'Anonymous'}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(item.created_at),{addSuffix:true})}</span>
              </div>
            </div>
            <button className="btn-ghost text-xs px-3 py-1.5 self-center">Contact</button>
          </div>
        ))}
        {filtered.length===0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3 block">search</span>
            <p className="text-on-surface-variant">Nothing here. Report a lost or found item above!</p>
          </div>
        )}
      </div>
    </div>
  )
}
