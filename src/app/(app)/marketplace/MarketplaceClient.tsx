'use client'
import { Bookmark, Heart, Image as ImageIcon, ImagePlus, MessageSquare, PlusCircle, Search, Store, Tag, X, Pencil, Trash2, ChevronLeft, Calendar, User, MapPin } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

// Slide animation for list items
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as any,
      stiffness: 260,
      damping: 25
    }
  }
}

export default function MarketplaceClient({ items, userId }: any) {
  const router = useRouter()
  const [allItems, setAllItems] = useState<any[]>(items)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showSell, setShowSell] = useState(false)
  const [sellForm, setSellForm] = useState({ title:'', description:'', price:'', category:'Books', condition:'good' })
  const [posting, setPosting] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editForm, setEditForm] = useState({ title:'', description:'', price:'', category:'Books', condition:'good' })
  const [saving, setSaving] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const supabase = createClient()

  // Load favorites
  useEffect(() => {
    const favs = localStorage.getItem('cc_marketplace_favs')
    if (favs) {
      try {
        setFavorites(JSON.parse(favs))
      } catch (e) {}
    }
  }, [])

  // Manage previews
  useEffect(() => {
    if (selectedPhotos.length === 0) {
      setPhotoPreviews([])
      return
    }
    const objectUrls = selectedPhotos.map(file => URL.createObjectURL(file))
    setPhotoPreviews(objectUrls)
    return () => objectUrls.forEach(url => URL.revokeObjectURL(url))
  }, [selectedPhotos])

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
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    const matchPrice = !maxPrice || item.price <= parseFloat(maxPrice)
    return matchCat && matchSearch && matchPrice
  })

  const toggleFavorite = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    let next = [...favorites]
    if (next.includes(itemId)) {
      next = next.filter(id => id !== itemId)
      toast.success('Removed from saved items')
    } else {
      next.push(itemId)
      toast.success('Saved to your marketplace wishlist!')
    }
    setFavorites(next)
    localStorage.setItem('cc_marketplace_favs', JSON.stringify(next))
  }

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

  const removeSelectedPhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8 pb-24 text-zinc-50 reveal-marketplace">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.04] pb-6">
        <div className="glass-page-header flex-1 space-y-2">
          <p className="section-label text-brand-400">Campus Economy</p>
          <h1 className="display-heading text-4xl">
            Marketplace
          </h1>
          <p className="body-pro text-sm">Buy, sell, and trade items with other students securely.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={()=>setShowSell(!showSell)} 
          className="btn-premium px-6 py-3 font-display tracking-tight text-sm font-semibold rounded-xl flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <PlusCircle size={18} />
          Create Listing
        </motion.button>
      </header>

      {/* Sell form */}
      <AnimatePresence>
        {showSell && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="card-premium p-6 md:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="sub-heading text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                  <Tag className="text-indigo-400" size={20} />
                  List a New Item
                </h2>
                <button 
                  onClick={()=>setShowSell(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-2">Item Title *</label>
                  <input 
                    className="input-pro w-full bg-zinc-950/40 border-white/[0.08] focus:border-indigo-500/50" 
                    placeholder="e.g. iPad Pro 11-inch M1 (2021) with Apple Pencil" 
                    value={sellForm.title} 
                    onChange={e=>setSellForm(p=>({...p,title:e.target.value}))} 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-2">Category</label>
                  <div className="relative">
                    <select 
                      className="input-pro w-full bg-zinc-950/60 border-white/[0.08] focus:border-indigo-500/50 appearance-none cursor-pointer" 
                      value={sellForm.category} 
                      onChange={e=>setSellForm(p=>({...p,category:e.target.value}))}
                    >
                      {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c} value={c} className="bg-zinc-950 text-zinc-200">{c}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-2">Condition</label>
                  <div className="relative">
                    <select 
                      className="input-pro w-full bg-zinc-950/60 border-white/[0.08] focus:border-indigo-500/50 appearance-none cursor-pointer" 
                      value={sellForm.condition} 
                      onChange={e=>setSellForm(p=>({...p,condition:e.target.value}))}
                    >
                      {CONDITIONS.map(c=><option key={c} value={c} className="bg-zinc-950 text-zinc-200">{CONDITION_LABELS[c]}</option>)}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▼</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-2">Price (₹) *</label>
                  <input 
                    className="input-pro w-full bg-zinc-950/40 border-white/[0.08] focus:border-indigo-500/50" 
                    type="number" 
                    placeholder="0" 
                    value={sellForm.price} 
                    onChange={e=>setSellForm(p=>({...p,price:e.target.value}))} 
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-2">Photos (Up to 5)</label>
                  <input 
                    ref={photoInputRef} 
                    type="file" 
                    multiple 
                    accept="image/jpeg,image/png,image/webp" 
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files ?? [])
                      const valid = files.filter(f => f.size <= 5*1024*1024)
                      if (valid.length < files.length) toast.error('Some photos skipped — max 5 MB each')
                      setSelectedPhotos(prev => [...prev, ...valid].slice(0,5))
                    }} 
                  />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {photoPreviews.map((url, i) => (
                      <div key={url} className="aspect-square relative rounded-xl overflow-hidden border border-white/10 bg-zinc-950 group">
                        <Image src={url} alt={`Preview ${i}`} fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeSelectedPhoto(i)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-zinc-400 hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedPhotos.length < 5 && (
                      <div 
                        onClick={() => photoInputRef.current?.click()} 
                        className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                      >
                        <ImagePlus className="text-zinc-500 group-hover:text-indigo-400 transition-colors" size={24} />
                        <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300">Add Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase block mb-2">Description</label>
                  <textarea 
                    className="input-pro w-full resize-none h-28 bg-zinc-950/40 border-white/[0.08] focus:border-indigo-500/50 py-3" 
                    placeholder="Describe your item, include details like purchase date, defects, specifications, and why you are selling it…" 
                    value={sellForm.description} 
                    onChange={e=>setSellForm(p=>({...p,description:e.target.value}))} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
                <button onClick={()=>setShowSell(false)} className="btn-ghost-pro px-6 py-2.5">Cancel</button>
                <button 
                  onClick={postItem} 
                  disabled={posting || !sellForm.title || !sellForm.price} 
                  className="btn-premium px-8 py-2.5 min-w-[120px] font-semibold"
                >
                  {posting ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Publish Listing'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter toolbar */}
      <div className="bg-zinc-900/20 border border-white/[0.06] rounded-2xl p-4 md:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            className="input-pro pl-11 bg-zinc-950/40 border-white/[0.08] placeholder:text-zinc-600 focus:border-indigo-500/40 text-xs py-3" 
            placeholder="Search listings by title, seller, or keywords..." 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto justify-end">
          <div className="relative w-full sm:w-44">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">₹</span>
            <input 
              className="input-pro pl-8 bg-zinc-950/40 border-white/[0.08] placeholder:text-zinc-600 focus:border-indigo-500/40 text-xs py-3 w-full" 
              type="number" 
              placeholder="Max Price" 
              value={maxPrice} 
              onChange={e=>setMaxPrice(e.target.value)} 
            />
          </div>

          <div className="flex gap-1 p-1 rounded-xl bg-zinc-950/60 border border-white/[0.04] overflow-x-auto max-w-full no-scrollbar">
            {CATEGORIES.map(cat=>(
              <button 
                key={cat} 
                onClick={()=>setCategory(cat)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-tight whitespace-nowrap transition-all",
                  category === cat 
                    ? "bg-white/[0.08] text-white shadow-sm font-semibold" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon="storefront"
          title="No products listed"
          description={allItems.length === 0 ? "Be the first to list an item for sale in your campus marketplace!" : "No products matched your search or price criteria."}
          action={{
            label: allItems.length === 0 ? "Create Listing" : "Reset Filters",
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
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((item:any)=>(
            <motion.div 
              variants={itemVariants}
              key={item.id} 
              className="card-premium overflow-hidden cursor-pointer group flex flex-col justify-between h-[390px]" 
              onClick={()=>setSelectedItem(item)}
            >
              <div className="space-y-0 flex-1">
                {/* Product image */}
                <div className="h-48 relative flex items-center justify-center bg-zinc-950 overflow-hidden group-hover:bg-zinc-900/60 transition-colors">
                  {item.images?.[0] ? (
                    <Image 
                      src={item.images[0]} 
                      alt={item.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2.5 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Store size={44} className="text-zinc-400" />
                      <span className="text-[9px] font-mono tracking-widest uppercase">No Image Available</span>
                    </div>
                  )}
                  
                  {/* Category chip */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase bg-black/60 backdrop-blur-md border border-white/10 text-indigo-300">
                      {item.category}
                    </span>
                  </div>

                  {/* Pricing float */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                      onClick={(e) => toggleFavorite(e, item.id)}
                      className={clsx(
                        "p-2 rounded-full backdrop-blur-md border transition-all active:scale-90",
                        favorites.includes(item.id) 
                          ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" 
                          : "bg-black/60 border-white/10 text-zinc-400 hover:text-white"
                      )}
                      aria-label="Save item"
                    >
                      <Heart size={14} fill={favorites.includes(item.id) ? "currentColor" : "none"} />
                    </button>
                  </div>

                  <div className="absolute bottom-4 right-4 z-10">
                    <span className="px-3 py-1 rounded-lg text-sm font-bold font-mono tracking-tight bg-zinc-900/90 backdrop-blur-md border border-white/[0.08] text-white">
                      ₹{item.price?.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Details */}
                <div className="p-5 space-y-3.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold tracking-tight uppercase border border-white/[0.08] text-zinc-400 bg-white/[0.02]">
                        {CONDITION_LABELS[item.condition]}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight truncate leading-snug group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">
                      {item.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Seller & Distance Info */}
              <div className="px-5 pb-5 pt-4 border-t border-white/[0.04] flex items-center justify-between bg-zinc-950/20 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <GlobalAvatar
                    profile={item.seller}
                    size="custom"
                    className="w-7 h-7 rounded-full text-[12px] ring-1 ring-white/5 border border-white/[0.08]"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-zinc-300 truncate max-w-[120px]">{item.seller?.full_name}</p>
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">{item.seller?.hostel || 'Hostel'}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  {formatDistanceToNow(new Date(item.created_at),{addSuffix:true})}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Item detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="glass-modal max-w-lg w-full relative z-10 overflow-hidden"
            >
              {/* Top breadcrumb header */}
              <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-zinc-900/40">
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                  <span className="cursor-pointer hover:text-white transition-colors" onClick={() => { setSelectedItem(null); router.push('/dashboard') }}>Home</span>
                  <span>/</span>
                  <span className="cursor-pointer hover:text-white transition-colors" onClick={() => setSelectedItem(null)}>Marketplace</span>
                  <span>/</span>
                  <span className="text-zinc-300 font-semibold truncate max-w-[150px]">{selectedItem.title}</span>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Product preview image */}
              <div className="h-72 relative bg-zinc-950 flex items-center justify-center border-b border-white/[0.04]">
                {selectedItem.images?.[0] ? (
                  <Image src={selectedItem.images[0]} alt={selectedItem.title} fill className="object-contain" />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20">
                    <Store size={72} />
                  </div>
                )}
                
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={(e) => toggleFavorite(e, selectedItem.id)}
                    className={clsx(
                      "p-3 rounded-full backdrop-blur-md border transition-all active:scale-95",
                      favorites.includes(selectedItem.id) 
                        ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" 
                        : "bg-black/60 border-white/10 text-zinc-400 hover:text-white"
                    )}
                  >
                    <Heart size={16} fill={favorites.includes(selectedItem.id) ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                      {selectedItem.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight uppercase bg-white/[0.03] border border-white/[0.08] text-zinc-300">
                      {CONDITION_LABELS[selectedItem.condition]}
                    </span>
                  </div>
                  <h2 className="display-heading text-2xl font-bold tracking-tight text-white">{selectedItem.title}</h2>
                  <p className="text-3xl font-display font-extrabold text-zinc-50 font-mono tracking-tight">₹{selectedItem.price?.toLocaleString()}</p>
                </div>

                {selectedItem.description && (
                  <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl space-y-2">
                    <h4 className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">Product Description</h4>
                    <p className="body-pro text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">{selectedItem.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 py-2">
                  <GlobalAvatar
                    profile={selectedItem.seller}
                    size="lg"
                    className="border border-white/[0.08]"
                  />
                  <div className="min-w-0">
                    <p className="section-label mb-1 text-zinc-500">Seller Profile</p>
                    <p className="sub-heading text-base leading-none font-bold text-white">{selectedItem.seller?.full_name}</p>
                    <p className="text-xs text-zinc-400 mt-1.5">{selectedItem.seller?.branch} · {selectedItem.seller?.hostel || 'Day Scholar'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {selectedItem.seller_id === userId ? (
                    <>
                      <button 
                        onClick={() => { 
                          setEditingItem(selectedItem); 
                          setEditForm({ title: selectedItem.title, description: selectedItem.description || '', price: String(selectedItem.price), category: selectedItem.category, condition: selectedItem.condition }); 
                          setSelectedItem(null) 
                        }} 
                        className="btn-ghost-pro py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                      >
                        <Pencil size={15} /> Edit Listing
                      </button>
                      <button 
                        onClick={() => deleteItem(selectedItem.id)} 
                        className="py-3 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold"
                      >
                        <Trash2 size={15} /> Delete Listing
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => toggleFavorite(e, selectedItem.id)}
                        className="btn-ghost-pro py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                      >
                        <Heart size={15} fill={favorites.includes(selectedItem.id) ? "currentColor" : "none"} />
                        {favorites.includes(selectedItem.id) ? 'Saved' : 'Save to wishlist'}
                      </button>
                      <Link 
                        href={`/messages?user=${selectedItem.seller_id}`} 
                        className="btn-premium py-3 justify-center text-xs font-semibold rounded-xl"
                      >
                        <MessageSquare size={15} />
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
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setEditingItem(null)} />
            <motion.div 
              initial={{opacity:0,scale:0.96,y:10}} 
              animate={{opacity:1,scale:1,y:0}} 
              exit={{opacity:0,scale:0.96,y:10}} 
              className="glass-modal max-w-md w-full relative z-10 p-6 md:p-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="sub-heading text-lg font-bold text-white">Edit Listing</h2>
                <button onClick={() => setEditingItem(null)} className="p-1 text-zinc-400 hover:text-white" aria-label="Close edit listing"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Item Title</label>
                  <input value={editForm.title} onChange={e => setEditForm(f => ({...f, title: e.target.value}))} placeholder="Title" className="input-pro w-full bg-zinc-900/60" />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Description</label>
                  <textarea value={editForm.description} onChange={e => setEditForm(f => ({...f, description: e.target.value}))} placeholder="Description" className="input-pro w-full h-24 resize-none py-2 bg-zinc-900/60" />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Price (₹)</label>
                  <input value={editForm.price} onChange={e => setEditForm(f => ({...f, price: e.target.value}))} placeholder="Price (₹)" type="number" className="input-pro w-full bg-zinc-900/60" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Category</label>
                    <select value={editForm.category} onChange={e => setEditForm(f => ({...f, category: e.target.value}))} className="input-pro w-full bg-zinc-900/60">
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} className="bg-zinc-950">{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase block mb-1">Condition</label>
                    <select value={editForm.condition} onChange={e => setEditForm(f => ({...f, condition: e.target.value}))} className="input-pro w-full bg-zinc-900/60">
                      {CONDITIONS.map(c => <option key={c} value={c} className="bg-zinc-950">{CONDITION_LABELS[c]}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={saveEdit} disabled={saving} className="btn-premium w-full py-3 justify-center text-xs font-semibold rounded-xl mt-2">
                {saving ? 'Saving changes...' : 'Save Changes'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
