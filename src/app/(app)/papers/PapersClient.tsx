'use client'
import { useState } from 'react'

const PAPERS = [
  { id:'p1', subject:'Mathematics - Calculus & LA', code:'MTH201', year:'2025', semester:'End Sem', examType:'Main', downloads:892, pages:8 },
  { id:'p2', subject:'Data Structures & Algorithms', code:'CSE301', year:'2025', semester:'End Sem', examType:'Main', downloads:1243, pages:6 },
  { id:'p3', subject:'Engineering Physics', code:'PHY101', year:'2025', semester:'Mid Sem', examType:'Main', downloads:567, pages:4 },
  { id:'p4', subject:'Financial Management', code:'ECO401', year:'2024', semester:'End Sem', examType:'Main', downloads:445, pages:10 },
  { id:'p5', subject:'Digital Electronics', code:'ECE301', year:'2025', semester:'End Sem', examType:'Main', downloads:334, pages:7 },
  { id:'p6', subject:'Computer Networks', code:'CSE401', year:'2024', semester:'End Sem', examType:'Main', downloads:678, pages:8 },
  { id:'p7', subject:'Organic Chemistry', code:'CHE201', year:'2025', semester:'Mid Sem', examType:'Main', downloads:289, pages:5 },
  { id:'p8', subject:'Engineering Drawing', code:'ME101', year:'2024', semester:'End Sem', examType:'Main', downloads:156, pages:3 },
]

export default function PapersClient({ userId }: any) {
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [semFilter, setSemFilter] = useState('')

  const filtered = PAPERS.filter(p => {
    const matchSearch = !search || p.subject.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
    const matchYear = !yearFilter || p.year === yearFilter
    const matchSem = !semFilter || p.semester === semFilter
    return matchSearch && matchYear && matchSem
  }).sort((a,b) => b.downloads - a.downloads)

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Past Question Papers</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Previous year exam papers for exam preparation</p>
        </div>
        <button className="btn-primary text-sm">
          <span className="material-symbols-outlined text-[16px]">upload</span>
          Upload Paper
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input className="input-glass pl-9" placeholder="Search by subject or course code…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="input-glass w-36" value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {['2025','2024','2023','2022'].map(y=><option key={y}>{y}</option>)}
        </select>
        <select className="input-glass w-40" value={semFilter} onChange={e=>setSemFilter(e.target.value)}>
          <option value="">All Semesters</option>
          <option>End Sem</option>
          <option>Mid Sem</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map(paper=>(
          <div key={paper.id} className="glass-card rounded-xl p-5 flex gap-4 items-start">
            <div className="w-12 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0" style={{background:'rgba(195,192,255,0.12)',border:'1px solid rgba(195,192,255,0.2)'}}>
              <span className="material-symbols-outlined text-[22px] text-primary" style={{fontVariationSettings:"'FILL' 1"}}>description</span>
              <span className="text-[9px] font-mono text-on-surface-variant mt-0.5">{paper.pages}p</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-on-surface text-sm leading-snug">{paper.subject}</h3>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                <span className="chip chip-primary text-[10px]">{paper.code}</span>
                <span className="chip chip-secondary text-[10px]">{paper.year}</span>
                <span className="chip chip-tertiary text-[10px]">{paper.semester}</span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="flex items-center gap-1 text-xs font-mono text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  {paper.downloads.toLocaleString()} downloads
                </span>
                <button className="btn-primary text-xs px-3 py-1.5">
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-3 block">search_off</span>
          <p className="text-on-surface-variant">No papers found. Try different filters.</p>
        </div>
      )}
    </div>
  )
}
