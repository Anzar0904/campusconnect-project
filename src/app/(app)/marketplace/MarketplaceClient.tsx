'use client'
import { Bookmark, Image as ImageIcon, ImagePlus, MessageSquare, PlusCircle, Search, Store, Tag, X, Pencil, Trash2 } from 'lucide-react'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlobalAvatar } from '@/components/ui/GlobalAvatar'

const CATEGORIES = ['All','Books','Electronics','Clothing','Furniture','Cycles','Stationery','Sports','Other']
const CONDITIONS = ['new','like_new','good','fair']
const CONDITION_LABELS: Record<string,string> = { new:'Brand New', like_new:'Like New', good:'Good', fair:'Fair' }

const conditionColor: Record<string,string> = { new:'#86efac', like_new:'#4cd7f6', good:'#c3c0ff', fair:'#fbbf24' }

export default function MarketplaceClient({ items, userId }: any) {
  const [allItems, setAllItems] = useState<any[]>(items)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showSell, setShowSell] = useState(false)
  const [sellForm, setSellForm] = useState({ title:'', description:'', price:'', category:'Books', condition:'good' })
  const [posting, setPosting] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editForm, setEditForm] = useState({ title:'', description:'', price:'', category:'Books', condition:'good' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id && allItems.length > 0) {
        const found = allItems.find((x: any) => x.id === id)
        if (found) {
          setSelectedItem(found)
        }
      }
    }
  }, [allItems])

  const filtered = allItems.filter((item:any) => {
    const matchCat = category === 'All' || item.category === category
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase())
    const matchPrice = !maxPrice || item.price <= parseFloat(maxPrice)
    return matchCat && matchSearch && matchPrice
  })

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this listing?')) return
    const { error } = await (supabase as any).from('marketplace_items').delete().eq('id', itemId).eq('seller_id', userId)
    if (error) { toast.error('Delete failed: ' + error.message); return }
    setAllItems(prev => prev.filter(i => i.id !== itemId))
    setSelectedItem(null)
    toast.success('Listing deleted')
  }

  async function saveEdit() {
    if (!editingItem) return
    setSaving(true)
    const { error } = await (supabase as any).from('marketplace_items').update({
      title: editForm.title, description: editForm.description,
      price: parseFloat(editForm.price), category: editForm.category, condition: editForm.condition,
    }).eq('id', editingItem.id).eq('seller_id', userId)
    if (error) { toast.error('Update failed: ' + error.message); setSaving(false); return }
    const updated = { ...editingItem, ...editForm, price: parseFloat(editForm.price) }
    setAllItems(prev => prev.map(i => i.id === editingItem.id ? updated : i))
    setEditingItem(null)
    setSelectedItem(null)
    toast.success('Listing updated')
    setSaving(false)
  }

  async function postItem() {
    if (!sellForm.title || !sellForm.price) { toast.error('Fill title and price'); return }
    setPosting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Please sign in again'); return }

      const imageUrls: string[] = []
      for (const photo of selectedPhotos) {
        const fd = new FormData()
        fd.append('file', photo)
        fd.append('bucket', 'marketplace')
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('upload-file', {
          body: fd,
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (fnErr || fnData?.error) { toast.error(fnData?.error ?? 'Photo upload failed'); setPosting(false); return }
        imageUrls.push(fnData.url)
      }

      const { error } = await (supabase as any).from('marketplace_items').insert({
        title: sellForm.title, description: sellForm.description,
        price: parseFloat(sellForm.price), category: sellForm.category,
        condition: sellForm.condition, seller_id: userId,
        status: 'available',
        images: imageUrls.length > 0 ? imageUrls : null,
      })
      if (error) { toast.error('Failed to post: ' + error.message); return }
      toast.success('Item listed!')
      setShowSell(false)
      setSellForm({ title:'', description:'', price:'', category:'Books', condition:'good' })
      setSelectedPhotos([])
      window.location.reload()
    } catch (err: any) {
      toast.error('Unexpected error: ' + (err.message ?? err))
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="section-label">Campus Economy</p>
          <h1 className="display-heading text-4xl">Marketplace</h1>
          <p className="body-pro text-sm">Buy and sell within your campus community securely.</p>
        </div>
        <button onClick={()=>setShowSell(!showSell)} className="btn-premium px-8">
          <PlusCircle size={20} />
          Create Listing
        </button>
      </header>

      {/* Sell form */}
      <AnimatePresence>
        {showSell && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card-premium p-6 space-y-6">
              <h2 className="sub-heading text-lg flex items-center gap-2">
                <Tag className="text-brand-400" size={18} />
                List an Item
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="section-label block mb-2 px-1">ITEM TITLE *</label>
                  <input className="input-pro" placeholder="What are you selling?" value={sellForm.title} onChange={e=>setSellForm(p=>({...p,title:e.target.value}))} />
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">CATEGORY</label>
                  <select className="input-pro appearance-none cursor-pointer" value={sellForm.category} onChange={e=>setSellForm(p=>({...p,category:e.target.value}))}>
                    {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c} className="bg-zinc-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">CONDITION</label>
                  <select className="input-pro appearance-none cursor-pointer" value={sellForm.condition} onChange={e=>setSellForm(p=>({...p,condition:e.target.value}))}>
                    {CONDITIONS.map(c=><option key={c} value={c} className="bg-zinc-900">{CONDITION_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">PRICE (₹) *</label>
                  <input className="input-pro" type="number" placeholder="0" value={sellForm.price} onChange={e=>setSellForm(p=>({...p,price:e.target.value}))} />
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">PHOTOS</label>
                  <input ref={photoInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files ?? [])
                      const valid = files.filter(f => f.size <= 5*1024*1024)
                      if (valid.length < files.length) toast.error('Some photos skipped — max 5 MB each')
                      setSelectedPhotos(prev => [...prev, ...valid].slice(0,5))
                    }} />
                  <div onClick={() => photoInputRef.current?.click()} className="input-pro cursor-pointer flex items-center gap-2 group hover:border-brand-500/50 transition-all">
                    {selectedPhotos.length > 0 ? (
                      <><ImageIcon className="text-brand-400" size={18} /><span className="text-xs text-brand-400 font-medium">{selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} selected</span></>
                    ) : (
                      <><ImagePlus className="text-zinc-500 group-hover:text-brand-400 transition-colors" size={18} /><span className="text-sm text-zinc-500">Add photos (max 5)</span></>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="section-label block mb-2 px-1">DESCRIPTION</label>
                  <textarea className="input-pro resize-none h-24" placeholder="Describe the item, its condition, and reason for selling…" value={sellForm.description} onChange={e=>setSellForm(p=>({...p,description:e.target.value}))} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={()=>setShowSell(false)} className="btn-ghost-pro px-6">Cancel</button>
                <button onClick={postItem} disabled={posting || !sellForm.title || !sellForm.price} className="btn-premium px-8 min-w-[120px]">
                  {posting ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'List Item'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input className="input-pro pl-11" placeholder="Search items…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <input className="input-pro w-36" type="number" placeholder="Max price ₹" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} />
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto no-scrollbar">
            {['All', 'Books', 'Electronics', 'Clothing'].map(cat=>(
              <button key={cat} onClick={()=>setCategory(cat)}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-mono tracking-tighter whitespace-nowrap transition-all",
                  category === cat ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon="storefront"
          title="No marketplace listings"
          description={allItems.length === 0 ? "Be the first to list an item for sale on campus!" : "No items match your filters."}
          action={{
            label: allItems.length === 0 ? "Create Listing" : "Clear Filters",
            onClick: () => {
              if (allItems.length === 0) {
                setShowSell(true)
              } else {
                setCategory('All')
                setSearch('')
                setMaxPrice('')
              }
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((item:any)=>(
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id} 
                className="card-premium overflow-hidden cursor-pointer group" 
                onClick={()=>setSelectedItem(item)}
              >
                {/* Image section */}
                <div className="h-48 relative flex items-center justify-center bg-zinc-900 border-b border-white/[0.04] overflow-hidden">
                  {item.images?.[0] ? (
                    <Image 
                      src={item.images[0]} 
                      alt={item.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Store size={48} />
                      <p className="text-[10px] font-mono tracking-widest uppercase">No Image</p>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="chip-pro bg-black/60 backdrop-blur-md border-white/10 text-zinc-50 px-3 py-1.5 text-sm font-bold shadow-2xl">
                      ₹{item.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="chip-pro text-[9px] font-mono py-0.5 bg-brand-500/10 border-brand-500/20 text-brand-400">
                        {item.category}
                      </span>
                      <span className="chip-pro text-[9px] font-mono py-0.5 uppercase">
                        {CONDITION_LABELS[item.condition]}
                      </span>
                    </div>
                    <h3 className="sub-heading text-base leading-snug truncate group-hover:text-brand-400 transition-colors">{item.title}</h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <GlobalAvatar
                        profile={item.seller}
                        size="custom"
                        className="w-7 h-7 rounded-full text-[12px] ring-1 ring-white/5 border border-white/[0.08]"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-zinc-300 truncate max-w-[100px]">{item.seller?.full_name}</p>
                        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">{item.seller?.hostel || 'Campus'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-tighter">
                      {formatDistanceToNow(new Date(item.created_at),{addSuffix:true})}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Item detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card-premium max-w-lg w-full relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="h-64 relative bg-zinc-950">
                {selectedItem.images?.[0] ? (
                  <Image src={selectedItem.images[0]} alt={selectedItem.title} fill className="object-contain" />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20">
                    <Store size={80} />
                  </div>
                )}
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="chip-pro text-[10px] font-mono bg-brand-500/10 border-brand-500/20 text-brand-400">{selectedItem.category}</span>
                    <span className="chip-pro text-[10px] font-mono">{CONDITION_LABELS[selectedItem.condition]}</span>
                  </div>
                  <h2 className="display-heading text-2xl tracking-tight">{selectedItem.title}</h2>
                  <p className="text-3xl font-display font-bold text-zinc-50">₹{selectedItem.price?.toLocaleString()}</p>
                </div>

                {selectedItem.description && (
                  <p className="body-pro text-sm leading-relaxed text-zinc-400 bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
                    {selectedItem.description}
                  </p>
                )}

                <div className="flex items-center gap-4 py-2">
                    <GlobalAvatar
                      profile={selectedItem.seller}
                      size="lg"
                      className="border border-white/[0.08]"
                    />
                   <div className="min-w-0">
                      <p className="section-label mb-0.5">SELLER</p>
                      <p className="sub-heading text-base leading-none">{selectedItem.seller?.full_name}</p>
                      <p className="text-xs text-zinc-500 mt-1">{selectedItem.seller?.branch} · {selectedItem.seller?.hostel || 'Day Scholar'}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {selectedItem.seller_id === userId ? (
                    <>
                      <button onClick={() => { setEditingItem(selectedItem); setEditForm({ title: selectedItem.title, description: selectedItem.description || '', price: String(selectedItem.price), category: selectedItem.category, condition: selectedItem.condition }); setSelectedItem(null) }} className="btn-ghost-pro py-3">
                        <Pencil size={16} /> Edit
                      </button>
                      <button onClick={() => deleteItem(selectedItem.id)} className="py-3 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-bold">
                        <Trash2 size={16} /> Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-ghost-pro py-3">
                        <Bookmark size={18} />
                        Save Item
                      </button>
                      <Link href={`/messages?user=${selectedItem.seller_id}`} className="btn-premium py-3 justify-center">
                        <MessageSquare size={18} />
                        Message Seller
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setEditingItem(null)} />
            <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:20}} className="card-premium max-w-md w-full relative z-10 p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="sub-heading text-lg">Edit Listing</h2>
                <button onClick={() => setEditingItem(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"><X size={15} /></button>
              </div>
              <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))} placeholder="Title" className="input-pro w-full" />
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="input-pro w-full h-24 resize-none" />
              <input value={editForm.price} onChange={e => setEditForm(f => ({...f, price: e.target.value}))} placeholder="Price (₹)" type="number" className="input-pro w-full" />
              <select value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value}))} className="input-pro w-full">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={editForm.condition} onChange={e => setEditForm(f => ({...f, condition: e.target.value}))} className="input-pro w-full">
                {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
              </select>
              <button onClick={saveEdit} disabled={saving} className="btn-premium w-full py-3 justify-center">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
