import React, { useState, useEffect } from "react";
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  ListTodo, 
  ShieldAlert, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Search, 
  Users, 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  History, 
  Calendar 
} from "lucide-react";
import { RawMessage, TeamMember, Ticket, SegregatedResult } from "./types";

export default function App() {
  // App Dashboard State
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [history, setHistory] = useState<Ticket[]>([]);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [selectedUserMessages, setSelectedUserMessages] = useState<RawMessage[]>([]);
  
  // Active processed state for currently selected user
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [processingUser, setProcessingUser] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  // Modal / Historical View State
  const [viewingHistoryTicket, setViewingHistoryTicket] = useState<Ticket | null>(null);

  // Fetch Dashboard State
  const fetchDashboardStatus = async () => {
    try {
      const res = await fetch("/api/dashboard/status");
      const data = await res.json();
      if (data && data.team) {
        setTeam(data.team);
        setTotalPending(data.totalPendingCount);
      }
    } catch (err) {
      console.error("Error fetching dashboard status", err);
    }
  };

  // Fetch History Logs
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/dashboard/history");
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching tickets history", err);
    }
  };

  // Synchronize on mount
  useEffect(() => {
    fetchDashboardStatus();
    fetchHistory();
  }, []);

  // Fetch individual user messages when selected
  useEffect(() => {
    if (selectedUser) {
      fetch(`/api/dashboard/messages/${selectedUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.messages) {
            setSelectedUserMessages(data.messages);
            // Clear current active preview to not show stale data
            setActiveTicket(null);
            setProcessingError(null);
          }
        })
        .catch((err) => console.error("Error loading user messages", err));
    }
  }, [selectedUser]);

  // Trigger Gemini Segregation
  const triggerSegregator = async () => {
    if (!selectedUser) return;
    setProcessingUser(true);
    setProcessingError(null);
    setActiveTicket(null);

    try {
      const res = await fetch("/api/dashboard/segregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail.error || "Gemini could not segregate user messages");
      }

      const generatedTicket = await res.json();
      setActiveTicket(generatedTicket);
      
      // Update our team list counts and historical ticket views
      fetchDashboardStatus();
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      setProcessingError(err.message || "Something went wrong during Gemini processing");
    } finally {
      setProcessingUser(false);
    }
  };

  // Reset entire state pool to defaults
  const resetStatePool = async () => {
    if (!window.confirm("Are you sure you want to reset the message pool back to initial state? This will clear processed stats.")) {
      return;
    }
    try {
      await fetch("/api/dashboard/reset", { method: "POST" });
      setSelectedUser(null);
      setActiveTicket(null);
      fetchDashboardStatus();
      fetchHistory();
    } catch (err) {
      console.error("Error resetting data", err);
    }
  };

  // Delete specific ticket from history log
  const deleteTicket = async (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ticket ${ticketId} from the history log?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/dashboard/history/${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        if (viewingHistoryTicket?.id === ticketId) {
          setViewingHistoryTicket(null);
        }
        fetchHistory();
      }
    } catch (err) {
      console.error("Error removing ticket", err);
    }
  };

  // Helper copy function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filter historical tickets
  const filteredHistory = history.filter((ticket) => {
    const term = searchTerm.toLowerCase();
    return (
      ticket.sender.toLowerCase().includes(term) ||
      ticket.id.toLowerCase().includes(term) ||
      ticket.segregated.summary.toLowerCase().includes(term)
    );
  });

  // Render Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-teal-500 to-emerald-500 rounded-xl text-slate-950 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Standup_Summarizer</h1>
                <span className="text-[10px] bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono px-2 py-0.5 rounded-full uppercase">
                  Gemini v3.5
                </span>
              </div>
              <p className="text-xs text-slate-400">Vikram&apos;s team reporting central dashboard</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={resetStatePool}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer font-medium"
              title="Reset pending pool back to original circled numbers"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
              Reset Message Pool
            </button>

            <button
              onClick={fetchDashboardStatus}
              className="p-1.5 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-300 rounded-xl hover:text-white transition"
              title="Refresh Pool counts"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs text-slate-300 font-semibold font-mono">
                  Vikram (Manager)
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 justify-end font-mono">
                  ● Public Access Mode
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TEAM MEMBERS POOL (Cols: 3) */}
        <div className="lg:col-span-3 lg:col-start-1 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                Team Standup Pools
              </h2>
              <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {totalPending} Raw Msg.
              </span>
            </div>

            <p className="text-xs text-slate-400 italic">
              Each user card lists pending slack strings. Red/Blue indicates un-analyzed messages waiting for segregation.
            </p>

            <div className="space-y-2 mt-2">
              {team.map((member) => {
                const isSelected = selectedUser?.id === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedUser(member);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer group ${
                      isSelected
                        ? "bg-gradient-to-r from-slate-800 to-slate-850 border-teal-500 shadow-lg shadow-teal-500/5 text-white"
                        : "bg-slate-950/40 hover:bg-slate-900/60 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl h-10 w-10 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 group-hover:scale-110 transition">
                        {member.avatar}
                      </span>
                      <div>
                        <div className="text-sm font-bold group-hover:text-white transition">{member.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {member.id}</div>
                      </div>
                    </div>

                    {/* Circle notification representing raw count as in diagram */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs font-mono font-bold ${
                      member.pendingCount > 0 
                        ? isSelected 
                          ? "bg-teal-500 text-slate-950 border-teal-400 scale-110"
                          : "bg-teal-500/15 text-teal-400 border-teal-500/30 font-bold"
                        : "bg-slate-900 text-slate-600 border-slate-800 font-normal"
                    }`}>
                      {member.pendingCount}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              Reporting Coverage
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-center">
                <div className="text-lg font-bold text-teal-400 font-mono">{team.filter(m => m.pendingCount === 0).length} / 7</div>
                <div className="text-[10px] text-slate-500">Processed Users</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-xl text-center">
                <div className="text-lg font-bold text-indigo-400 font-mono">{history.length}</div>
                <div className="text-[10px] text-slate-500">Hist. Summaries</div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMNS: DETAIL & MINI-BLOCKS SEGREGATOR (Cols: 5) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {!selectedUser ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="inline-flex p-4 bg-teal-500/5 rounded-3xl border border-teal-500/10 text-teal-400/80 animate-bounce">
                <Sparkles className="w-10 h-10" />
              </div>
              <div className="max-w-sm space-y-2">
                <h2 className="text-lg font-sans font-bold text-white tracking-tight">Select Team Member to Auditing</h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Vikram, select any team member card on the left panel to review their raw slack strings updates pool, run the <b>Gemini Segregator</b>, and look at the mini dashboards.
                </p>
              </div>

              {/* General Project Context Banner */}
              <div className="w-full bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-left text-xs text-slate-400 space-y-2">
                <h4 className="font-bold text-slate-300">How the Segregator Works</h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Choose a member (e.g., Kunal who has 10 pending slack updates).</li>
                  <li>Click <b>Segregate Standup with Gemini</b> at the core.</li>
                  <li>Gemini parses unstructured logs for four action cases: <b>Blockers</b>, <b>Plan (To Be Done)</b>, <b>Completed</b>, and <b>In Progress</b>.</li>
                  <li>Summary is compiled for leadership reporting, and the counts automatically clear down into Vikram&apos;s history registry!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              
              {/* Selected User Header & Raw message preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl bg-slate-950 p-2 border border-slate-800 rounded-xl">{selectedUser.avatar}</span>
                    <div>
                      <h2 className="font-bold text-white tracking-tight text-base">{selectedUser.name}&apos;s Live Stream</h2>
                      <p className="text-xs text-slate-400">Viewing {selectedUserMessages.length} unsegregated slack posts</p>
                    </div>
                  </div>

                  <span className="text-xs bg-slate-950 border border-slate-800 font-mono px-3 py-1 rounded-xl text-slate-300">
                    {selectedUserMessages.length > 0 ? "⚠️ Pendings" : "✅ Clear"}
                  </span>
                </div>

                {/* Conditional show raw updates */}
                {selectedUserMessages.length > 0 ? (
                  <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto">
                    {selectedUserMessages.map((msg, i) => (
                      <div key={msg.id || i} className="text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0 font-sans">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500 font-mono text-[9px]">{msg.timestamp}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                            msg.keyword.toUpperCase() === "BLOCKER" ? "bg-rose-500/10 text-rose-400 border border-rose-500/10" :
                            msg.keyword.toUpperCase() === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                            msg.keyword.toUpperCase() === "IN PROGRESS" ? "bg-sky-500/10 text-sky-400 border border-sky-500/10" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                          }`}>
                            {msg.keyword}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-sans">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No active messages left in this user&apos;s data pool. Run reset to recreate sample.
                  </div>
                )}

                {/* Central Action CTA */}
                {selectedUserMessages.length > 0 && (
                  <button
                    onClick={triggerSegregator}
                    disabled={processingUser}
                    className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-xl shadow-lg hover:shadow-teal-500/10 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border-t border-white/10"
                  >
                    {processingUser ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing &amp; Segregating via Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
                        <span>Run Google Gemini Segregator</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* ERROR STATE VIEW’ */}
              {processingError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Gemini Processing Failure</span>
                  </div>
                  <p className="text-[11px] text-rose-300/80 leading-relaxed">{processingError}</p>
                </div>
              )}

              {/* LOADER PLACEHOLDER VIEW’ */}
              {processingUser && (
                <div className="p-12 bg-slate-900 border border-slate-800 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-white">Segregating unstructured updates...</p>
                    <p className="text-[10px] text-slate-400">Invoking gemini-3.5-flash with custom Schema Type constraints</p>
                  </div>
                </div>
              )}

              {/* FOUR MINI SUB-DASHBOARD BLOCKS OR LIVE RESULTS (Active results) */}
              {(activeTicket || viewingHistoryTicket) && (
                <div className="space-y-4">
                  {/* Executive summary banner card */}
                  <div className="bg-gradient-to-b from-indigo-950/30 to-slate-900 border border-indigo-500/25 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                        Executive Summaries for Leadership
                      </div>
                      <button
                        onClick={() => copyToClipboard((activeTicket || viewingHistoryTicket)!.segregated.summary)}
                        className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition"
                      >
                        <Copy className="w-3 h-3 text-teal-400" />
                        {copiedText ? "Copied!" : "Copy Summary"}
                      </button>
                    </div>
                    <p className="text-xs text-indigo-100 italic leading-relaxed font-sans">
                      &ldquo;{(activeTicket || viewingHistoryTicket)?.segregated.summary}&rdquo;
                    </p>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {(activeTicket || viewingHistoryTicket)?.sender}&apos;s Segregated Mini Notebook Panels
                  </h3>

                  {/* 4 Mini cards block! */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* CASE 1: BLOCKER */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-rose-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-400" />
                        <span>Blockers</span>
                        <span className="ml-auto bg-red-400/10 text-red-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.blockers.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.blockers.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.blockers.map((blk, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-red-500 select-none">•</span>
                              <span className="leading-tight">{blk}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2">Zero reported blockers</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 2: IN PROGRESS */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-sky-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0 text-sky-400 animate-spin" style={{ animationDuration: "8s" }} />
                        <span>In Progress</span>
                        <span className="ml-auto bg-sky-400/10 text-sky-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.inProgress.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.inProgress.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.inProgress.map((prog, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-sky-400 select-none">•</span>
                              <span className="leading-tight">{prog}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2 font-sans">No tasks currently tagged</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 3: COMPLETED */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        <span>Completed</span>
                        <span className="ml-auto bg-emerald-400/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.completed.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.completed.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.completed.map((comp, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-emerald-500 select-none">•</span>
                              <span className="leading-tight">{comp}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2 font-sans">Zero completions found</div>
                        )}
                      </div>
                    </div>

                    {/* CASE 4: TO BE DONE */}
                    <div className="bg-slate-900 p-3.5 rounded-xl border border-amber-500/15 flex flex-col space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold uppercase tracking-wider border-b border-slate-950 pb-1.5">
                        <ListTodo className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>To Be Done</span>
                        <span className="ml-auto bg-amber-400/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                          {(activeTicket || viewingHistoryTicket)!.segregated.toBeDone.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-28">
                        {(activeTicket || viewingHistoryTicket)!.segregated.toBeDone.length > 0 ? (
                          (activeTicket || viewingHistoryTicket)!.segregated.toBeDone.map((tbd, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1 font-sans">
                              <span className="text-amber-500 select-none">•</span>
                              <span className="leading-tight">{tbd}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[10px] text-slate-500 italic mt-2 font-sans">No futures identified</div>
                        )}
                      </div>
                    </div>

                  </div>

                  {viewingHistoryTicket && (
                    <button
                      onClick={() => setViewingHistoryTicket(null)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      Clear Hist. Log Overlay View
                    </button>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HISTORY OF LAST 50 TICKETS (Cols: 4) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col space-y-4 flex-1">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-400 font-bold" />
                History of Last 50 Tickets
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized logs showing Vikram&apos;s processed daily summaries. Search or click item for details.
              </p>
            </div>

            {/* Simple Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-[1px] focus:outline-teal-500"
                placeholder="Search history by name or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* List entries */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[450px] pr-1">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((tkt, index) => {
                  const isBeingViewed = viewingHistoryTicket?.id === tkt.id;
                  const dateStr = new Date(tkt.processedAt).toLocaleTimeString([], { 
                    hour: "2-digit", 
                    minute: "2-digit" 
                  }) + " " + new Date(tkt.processedAt).toLocaleDateString([], { month: "short", day: "numeric" });

                  return (
                    <div
                      key={tkt.id}
                      onClick={() => {
                        setViewingHistoryTicket(tkt);
                        // Also auto select their sidebar user if matched
                        const matchedUser = team.find((u) => u.name.toLowerCase() === tkt.sender.toLowerCase());
                        if (matchedUser) setSelectedUser(matchedUser);
                        setActiveTicket(null); // Close active active state in favor of history
                      }}
                      className={`p-3.5 rounded-xl border transition-all duration-150 text-left cursor-pointer flex flex-col space-y-1.5 group ${
                        isBeingViewed
                          ? "bg-teal-500/10 border-teal-500/60 text-white"
                          : "bg-slate-950/40 hover:bg-slate-900/40 border-slate-800 text-slate-350"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold block text-white group-hover:text-teal-300 transition">
                            {tkt.sender}
                          </span>
                          <span className="text-[9px] bg-slate-900 border border-slate-800 font-mono text-slate-400 px-1.5 py-0.2 rounded-md">
                            {tkt.id}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tkt.segregated.summary}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md">
                          <span className="text-red-400 font-bold">•</span> Blockers: {tkt.segregated.blockers.length}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md">
                          <span className="text-emerald-400 font-bold">•</span> Completed: {tkt.segregated.completed.length}
                        </div>

                        {/* Delete single historical card button */}
                        <button
                          onClick={(e) => deleteTicket(tkt.id, e)}
                          className="ml-auto p-1 text-slate-500 hover:text-rose-400 transition hover:bg-rose-500/5 rounded-md"
                          title="Delete summary ticket"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800/80 rounded-2xl flex flex-col items-center justify-center space-y-1">
                  <FileText className="w-6 h-6 text-slate-600 mb-1" />
                  <p className="text-xs text-slate-500 font-bold">No tickets found</p>
                  <p className="text-[10px] text-slate-600">Enter a different keyword or process raw updates.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Footer Branding Area */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div>
            <span>Daily Standup Summarizer Panel</span>
            <span className="mx-2">•</span>
            <span>Created for Vikram &amp; His Team of 8 Engineers</span>
          </div>
          <div>
            <span>Admin Control Panel • Active Cloud Node</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
