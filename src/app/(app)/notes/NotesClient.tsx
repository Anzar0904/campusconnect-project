'use client'
import { CheckCircle, Download, FileText, Heart, Search, Upload, UploadCloud } from 'lucide-react'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { EmptyState } from '@/components/ui/EmptyState'

const SUBJECTS = ['Mathematics','Physics','Chemistry','Computer Science','Economics','Management','English','Statistics','Electronics','Other']

export default function NotesClient({ notes, userId }: any) {
  const allNotes = notes
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [sortBy, setSortBy] = useState<'recent'|'downloads'|'likes'>('recent')
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title:'', subject:'', course_code:'', description:'', year:'' })
  const supabase: any = createClient()

  // Auto-scroll and highlight note from query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id && allNotes.length > 0) {
        setSubjectFilter('')
        setYearFilter('')
        setSearch('')
        setTimeout(() => {
          const el = document.getElementById(`note-${id}`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2', 'ring-cyan-500', 'ring-offset-2', 'ring-offset-[#090d16]')
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-cyan-500', 'ring-offset-2', 'ring-offset-[#090d16]')
            }, 6000)
          }
        }, 500)
      }
    }
  }, [allNotes])

  const filtered = allNotes
    .filter((n:any) => {
      const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.subject?.toLowerCase().includes(search.toLowerCase()) || n.course_code?.toLowerCase().includes(search.toLowerCase())
      const matchSubject = !subjectFilter || n.subject === subjectFilter
      const matchYear = !yearFilter || String(n.year) === yearFilter
      return matchSearch && matchSubject && matchYear
    })
    .sort((a:any, b:any) => {
      if (sortBy === 'downloads') return (b.downloads||0) - (a.downloads||0)
      if (sortBy === 'likes') return (b.likes||0) - (a.likes||0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setFileError('')
    if (!file) return
    const ALLOWED = ['application/pdf','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    if (!ALLOWED.includes(file.type)) { setFileError('Only PDF, DOC, DOCX, PPT, PPTX allowed'); return }
    if (file.size > 20 * 1024 * 1024) { setFileError('File must be under 20 MB'); return }
    setSelectedFile(file)
  }

  async function handleUpload() {
    if (!uploadForm.title || !uploadForm.subject) { toast.error('Title and subject are required'); return }
    if (!selectedFile) { toast.error('Please select a file to upload'); return }
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Please sign in again'); return }
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('bucket', 'notes')
      const { data: fnData, error: fnError } = await supabase.functions.invoke('upload-file', {
        body: formData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (fnError || fnData?.error) { toast.error(fnData?.error ?? fnError?.message ?? 'Upload failed'); return }
      const { error: dbError } = await supabase.from('notes').insert({
        title: uploadForm.title,
        subject: uploadForm.subject,
        course_code: uploadForm.course_code || null,
        description: uploadForm.description || null,
        year: uploadForm.year ? parseInt(uploadForm.year) : null,
        file_url: fnData.url,
        uploader_id: userId,
      })
      if (dbError) { toast.error('Metadata save failed: ' + dbError.message); return }
      toast.success('Notes uploaded successfully!')
      setShowUpload(false)
      setUploadForm({ title:'', subject:'', course_code:'', description:'', year:'' })
      setSelectedFile(null)
      window.location.reload()
    } catch (err: any) {
      toast.error('Unexpected error: ' + (err.message ?? err))
    } finally {
      setUploading(false)
    }
  }

  const subjectColors: Record<string,string> = {
    'Mathematics':'#6366f1','Physics':'#22d3ee','Chemistry':'#f87171','Computer Science':'#8b5cf6',
    'Economics':'#fbbf24','Management':'#4ade80','Electronics':'#f97316','Other':'#a1a1aa'
  }

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="section-label">Academic Resources</p>
          <h1 className="display-heading text-4xl">Notes Library</h1>
          <p className="body-pro text-sm">Access and share lecture notes, study guides, and campus resources.</p>
        </div>
        <button onClick={() => setShowUpload(!showUpload)} className="btn-premium px-8">
          <Upload size={20} />
          Share Notes
        </button>
      </header>

      {/* Upload form */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
            <div className="card-premium p-6 space-y-6 bg-brand-500/[0.02]">
              <h2 className="sub-heading text-lg">Upload New Resource</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="section-label block mb-2 px-1">RESOURCE TITLE *</label>
                  <input className="input-pro" placeholder="e.g. Operating Systems Unit 1 — Professor Gupta" value={uploadForm.title} onChange={e=>setUploadForm(p=>({...p,title:e.target.value}))} />
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">SUBJECT *</label>
                  <select className="input-pro appearance-none cursor-pointer" value={uploadForm.subject} onChange={e=>setUploadForm(p=>({...p,subject:e.target.value}))}>
                    <option value="" className="bg-zinc-900">Select Subject</option>
                    {SUBJECTS.map(s=><option key={s} className="bg-zinc-900">{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">COURSE CODE</label>
                  <input className="input-pro" placeholder="e.g. CS301" value={uploadForm.course_code} onChange={e=>setUploadForm(p=>({...p,course_code:e.target.value}))} />
                </div>
                <div>
                   <label className="section-label block mb-2 px-1">FILE (PDF/DOCX max 20MB) *</label>
                   <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" onChange={handleFileSelect} />
                   <div onClick={() => fileInputRef.current?.click()} className="input-pro cursor-pointer flex items-center gap-3">
                      {selectedFile ? (
                        <><CheckCircle className="text-brand-400" size={18} /><span className="text-xs text-brand-400 font-mono truncate">{selectedFile.name}</span></>
                      ) : (
                        <><UploadCloud className="text-zinc-500" size={18} /><span className="text-sm text-zinc-500">Choose File</span></>
                      )}
                   </div>
                </div>
                <div>
                  <label className="section-label block mb-2 px-1">ACADEMIC YEAR</label>
                  <select className="input-pro appearance-none cursor-pointer" value={uploadForm.year} onChange={e=>setUploadForm(p=>({...p,year:e.target.value}))}>
                    <option value="" className="bg-zinc-900">Any Year</option>
                    {[1,2,3,4,5].map(y=><option key={y} value={y} className="bg-zinc-900">Year {y}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={()=>setShowUpload(false)} className="btn-ghost-pro px-6">Cancel</button>
                <button onClick={handleUpload} disabled={uploading} className="btn-premium px-8 min-w-[120px]">
                  {uploading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Upload'}
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
          <input className="input-pro pl-11" placeholder="Search title, subject or code…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex gap-3">
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="input-pro w-auto min-w-[140px] appearance-none cursor-pointer">
            <option value="" className="bg-zinc-900">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
          </select>
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            {['recent', 'downloads', 'likes'].map(s=>(
              <button key={s} onClick={()=>setSortBy(s as any)}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-mono capitalize transition-all",
                  sortBy === s ? "bg-white/[0.08] text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState 
          icon="menu_book"
          title="No notes found"
          description="We couldn't find any resources matching your search. Be the first to upload one!"
          action={{ label: "Upload Now", onClick: () => setShowUpload(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((note:any) => {
              const color = subjectColors[note.subject] || '#a1a1aa'
              return (
                <motion.div 
                  layout
                  key={note.id} 
                  id={`note-${note.id}`}
                  className="card-premium p-6 flex flex-col gap-4 group hover:border-brand-500/30 transition-all duration-300 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                         <span className="chip-pro text-[9px] font-mono py-0" style={{borderColor: `${color}30`, color}}>
                           {note.subject}
                         </span>
                         {note.course_code && (
                           <span className="chip-pro text-[9px] font-mono py-0">{note.course_code}</span>
                         )}
                      </div>
                      <h3 className="sub-heading text-base leading-tight group-hover:text-brand-400 transition-colors tracking-tight line-clamp-2">{note.title}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-white/5 shadow-lg group-hover:scale-110 transition-transform duration-500"
                      style={{background:`${color}15`, color}}>
                      <FileText size={24} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono uppercase tracking-tighter">
                    <span>By {note.uploader?.full_name?.split(' ')[0] || 'Peer'}</span>
                    <span className="opacity-20">/</span>
                    <span>{formatDistanceToNow(new Date(note.created_at),{addSuffix:true})}</span>
                  </div>

                  <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                       <span className="flex items-center gap-1.5"><Download className="opacity-40" size={16} />{note.downloads||0}</span>
                       <span className="flex items-center gap-1.5"><Heart className="opacity-40" size={16} />{note.likes||0}</span>
                    </div>
                    <a href={note.file_url} target="_blank" rel="noopener noreferrer" className="btn-premium py-1.5 px-5 text-xs">
                      <Download size={16} />
                      Download
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
