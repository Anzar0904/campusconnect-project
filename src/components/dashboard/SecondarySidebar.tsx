import React from 'react'
import { Briefcase, Users } from 'lucide-react'

export const SecondarySidebar: React.FC = () => {
  return (
    <div className="space-y-5">
      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Briefcase size={14} className="text-amber-400" />
            <span>Internship Matches</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</button>
        </div>

        <div className="space-y-2.5">
          {[
            { role: 'Product Intern', company: 'Linear Corporation', match: '92% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { role: 'Frontend Developer', company: 'Paytm Payments', match: '88% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { role: 'UI/UX Design Intern', company: 'Swiggy Design', match: '85% Match', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          ].map((job, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <div>
                <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{job.role}</p>
                <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{job.company}</p>
              </div>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border tracking-wide ${job.color}`}>
                {job.match}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel-base rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
            <Users size={14} className="text-purple-400" />
            <span>Top Communities</span>
          </div>
          <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors">View all</button>
        </div>

        <div className="space-y-3">
          {[
            { name: 'Tech Society', members: '12.3K active nodes', initial: 'TS', grad: 'from-blue-600 to-indigo-600' },
            { name: 'Design Squad', members: '8.7K active nodes', initial: 'DS', grad: 'from-pink-600 to-purple-600' },
            { name: 'AI/ML Club', members: '6.2K active nodes', initial: 'AI', grad: 'from-cyan-600 to-blue-600' },
          ].map((comm, idx) => (
            <div key={idx} className="flex items-center justify-between group p-1 rounded-xl hover:bg-white/[0.01]">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${comm.grad} text-white text-[10px] font-black flex items-center justify-center shadow-md`}>
                  {comm.initial}
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer tracking-tight">{comm.name}</p>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{comm.members}</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] rounded-lg transition-all tracking-wide active:scale-95">
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
