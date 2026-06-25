'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Download, FileText, Search, SearchX, Upload, X, Loader2, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'

interface Paper {
  id: string
  uploader_id: string | null
  subject: string
  course_code: string | null
  exam_year: number | null
  semester: string | null
  exam_type: string | null
  file_url: string
  pages: number | null
  downloads: number
  created_at: string
}

export default function PapersClient({ userId, collegeId }: { userId: string; collegeId?: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search and Filter States
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [semFilter, setSemFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')

  // Upload Modal State
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    subject: '',
    courseCode: '',
    examYear: new Date().getFullYear().toString(),
    semester: 'End Sem',
    examType: 'end_sem',
    pages: '1',
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch papers from Supabase
  useEffect(() => {
    async function fetchPapers() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('exam_papers')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPapers(data || [])
      } catch (err: any) {
        toast.error('Failed to load past papers: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPapers()
  }, [supabase])

  // Auto-scroll and highlight paper from query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('id')
      if (id && papers.length > 0) {
        setYearFilter('')
        setSemFilter('')
        setDeptFilter('')
        setSearch('')
        setTimeout(() => {
          const el = document.getElementById(`paper-${id}`)
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
  }, [papers])

  // Filter Logic
  const filtered = papers.filter(p => {
    const matchSearch = 
      !search || 
      p.subject.toLowerCase().includes(search.toLowerCase()) || 
      (p.course_code && p.course_code.toLowerCase().includes(search.toLowerCase()))
      
    const matchYear = !yearFilter || p.exam_year?.toString() === yearFilter
    const matchSem = !semFilter || p.semester === semFilter
    
    // Department mapping based on course code prefix
    const matchesDept = 
      !deptFilter || 
      (p.course_code && p.course_code.toUpperCase().startsWith(deptFilter.toUpperCase()))

    return matchSearch && matchYear && matchSem && matchesDept
  })

  // Handle Download Action
  async function handleDownload(paper: Paper) {
    // Open in new tab immediately
    window.open(paper.file_url, '_blank')

    // Optimistically update download counter locally
    setPapers(prev => prev.map(p => 
      p.id === paper.id ? { ...p, downloads: p.downloads + 1 } : p
    ))

    // Attempt to increment downloads counter in DB (ignore RLS restrictions if it fails)
    try {
      await supabase
        .from('exam_papers')
        .update({ downloads: paper.downloads + 1 })
        .eq('id', paper.id)
    } catch {
      // Ignored: silent fallback if RLS prevents editing other uploader's columns
    }
  }

  // Handle Paper Upload Submission
  async function handleUploadPaper(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadForm.subject.trim()) return toast.error('Subject is required')
    if (!selectedFile) return toast.error('Please select a PDF file to upload')
    if (selectedFile.type !== 'application/pdf') return toast.error('Only PDF files are supported')
    if (selectedFile.size > 10 * 1024 * 1024) return toast.error('File size must be under 10MB')

    setUploading(true)
    const toastId = toast.loading('Uploading paper...')

    try {
      // 1. Upload to Supabase Storage bucket 'papers'
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('papers')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // 2. Fetch public URL
      const { data: { publicUrl } } = supabase.storage
        .from('papers')
        .getPublicUrl(fileName)

      // 3. Insert metadata record in exam_papers
      const { data: newRecord, error: insertError } = await supabase
        .from('exam_papers')
        .insert({
          uploader_id: userId,
          subject: uploadForm.subject.trim(),
          course_code: uploadForm.courseCode.trim().toUpperCase() || null,
          exam_year: parseInt(uploadForm.examYear) || new Date().getFullYear(),
          semester: uploadForm.semester,
          exam_type: uploadForm.examType,
          file_url: publicUrl,
          pages: parseInt(uploadForm.pages) || 1,
          downloads: 0,
          college_id: collegeId || null
        })
        .select('*')
        .single()

      if (insertError) throw insertError

      // 4. Update local state immediately
      setPapers(prev => [newRecord, ...prev])
      toast.success('Question paper uploaded successfully!', { id: toastId })
      
      // Reset Modal & State
      setShowUpload(false)
      setSelectedFile(null)
      setUploadForm({
        subject: '',
        courseCode: '',
        examYear: new Date().getFullYear().toString(),
        semester: 'End Sem',
        examType: 'end_sem',
        pages: '1',
      })
    } catch (err: any) {
      toast.error('Failed to upload paper: ' + err.message, { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <BookOpen className="text-cyan-400" />
            Past Question Papers
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">Previous year exam papers uploaded by student community</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)} 
          className="btn-primary text-xs px-4 py-2 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300"
        >
          <Upload size={14} />
          Upload Paper
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            className="w-full bg-zinc-950/40 border border-white/[0.06] rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" 
            placeholder="Search by subject name or course code (e.g. CSE301)..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <div className="flex gap-2 shrink-0">
          {/* Department Filter */}
          <select 
            className="bg-zinc-950/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50"
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="ME">Mechanical (ME)</option>
            <option value="PHY">Physics (PHY)</option>
            <option value="MTH">Mathematics (MTH)</option>
            <option value="ECO">Economics (ECO)</option>
            <option value="CHE">Chemistry (CHE)</option>
          </select>

          {/* Year Filter */}
          <select 
            className="bg-zinc-950/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50 w-24"
            value={yearFilter} 
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">All Years</option>
            {Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Semester Filter */}
          <select 
            className="bg-zinc-950/40 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50 w-32"
            value={semFilter} 
            onChange={e => setSemFilter(e.target.value)}
          >
            <option value="">All Semesters</option>
            <option value="End Sem">End Sem</option>
            <option value="Mid Sem">Mid Sem</option>
            <option value="Sessional">Sessional</option>
            <option value="Practical">Practical</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-950/45 border border-white/[0.05] rounded-2xl p-5 flex gap-4 items-start shadow-lg">
              <Skeleton className="w-12 h-14 rounded-xl shrink-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-12 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="description"
          title="No question papers found"
          description={papers.length === 0 ? "Be the first to upload past exam papers for your department or subject." : "No question papers match your filters."}
          action={{
            label: papers.length === 0 ? "Upload Paper" : "Clear Filters",
            onClick: () => {
              if (papers.length === 0) {
                setShowUpload(true)
              } else {
                setYearFilter('')
                setSemFilter('')
                setDeptFilter('')
                setSearch('')
              }
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(paper => (
            <div 
              key={paper.id} 
              id={`paper-${paper.id}`}
              className="group bg-zinc-950/45 hover:bg-zinc-950/80 border border-white/[0.05] hover:border-cyan-500/20 rounded-2xl p-5 flex gap-4 items-start shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <div className="w-12 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 bg-cyan-500/5 border border-cyan-500/15 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 transition-all">
                <FileText className="text-cyan-400 group-hover:scale-105 transition-transform" size={22} />
                <span className="text-[9px] font-mono text-zinc-500 mt-1 font-bold">{paper.pages || 1}p</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-zinc-100 text-sm leading-snug group-hover:text-white transition-colors truncate">
                  {paper.subject}
                </h3>
                
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {paper.course_code && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {paper.course_code}
                    </span>
                  )}
                  {paper.exam_year && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {paper.exam_year}
                    </span>
                  )}
                  {paper.semester && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {paper.semester}
                    </span>
                  )}
                  {paper.exam_type && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-zinc-500/10 text-zinc-400 border border-white/10 uppercase">
                      {paper.exam_type.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-mono text-zinc-500">
                    📂 {paper.downloads} downloads
                  </span>
                  
                  <button 
                    onClick={() => handleDownload(paper)}
                    className="flex items-center gap-1.5 bg-zinc-900 border border-white/[0.08] hover:border-cyan-500/40 text-xs px-3 py-1.5 rounded-xl font-medium text-zinc-300 hover:text-white transition-all duration-300"
                  >
                    <Download size={12} />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Paper Modal Overlay */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="relative w-full max-w-md bg-[#0a0f1d] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-display font-bold text-zinc-100 text-base">Upload Past Exam Paper</h3>
              <button 
                onClick={() => { setShowUpload(false); setSelectedFile(null) }} 
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadPaper} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Subject Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Advanced Data Structures" 
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                  value={uploadForm.subject}
                  onChange={e => setUploadForm(p => ({ ...p, subject: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Course Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CSE-302" 
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                    value={uploadForm.courseCode}
                    onChange={e => setUploadForm(p => ({ ...p, courseCode: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Exam Year</label>
                  <input 
                    type="number" 
                    placeholder="2025" 
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                    value={uploadForm.examYear}
                    onChange={e => setUploadForm(p => ({ ...p, examYear: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Semester</label>
                  <select 
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                    value={uploadForm.semester}
                    onChange={e => setUploadForm(p => ({ ...p, semester: e.target.value }))}
                  >
                    <option>End Sem</option>
                    <option>Mid Sem</option>
                    <option>Sessional</option>
                    <option>Practical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Exam Type</label>
                  <select 
                    className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500/50"
                    value={uploadForm.examType}
                    onChange={e => setUploadForm(p => ({ ...p, examType: e.target.value }))}
                  >
                    <option value="end_sem">Regular (Main)</option>
                    <option value="mid_sem">Midterm</option>
                    <option value="reappear">Re-appear / Backlog</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Estimated Page Count</label>
                <input 
                  type="number" 
                  placeholder="8" 
                  min="1"
                  className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 font-mono"
                  value={uploadForm.pages}
                  onChange={e => setUploadForm(p => ({ ...p, pages: e.target.value }))}
                />
              </div>

              {/* PDF File Picker */}
              <div className="border border-dashed border-white/10 rounded-xl p-4 text-center hover:bg-white/[0.01] transition-all relative">
                <input 
                  type="file" 
                  required
                  accept="application/pdf"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="text-zinc-500 mx-auto mb-2" size={24} />
                <p className="text-xs text-zinc-300 font-bold">
                  {selectedFile ? selectedFile.name : 'Choose PDF Question Paper'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">PDF files up to 10MB only</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.06]">
                <button 
                  type="button" 
                  onClick={() => { setShowUpload(false); setSelectedFile(null) }} 
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs text-zinc-300 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                
                <button 
                  type="submit" 
                  disabled={uploading} 
                  className="btn-primary text-xs px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-55 transition-all"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
