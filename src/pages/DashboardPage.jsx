import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, ArrowRight, Coins, FileText, NotebookText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGeneration } from '../context/GenerationContext';
import { apiFetch } from '../lib/api';

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function DashboardPage() {
  const { user } = useAuth();
  const { generationVersion } = useGeneration();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, [generationVersion]);

  async function fetchDashboard() {
    try {
      const response = await apiFetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-iris border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-marker-red font-normal">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-6 py-2 bg-electric-iris text-white rounded-full font-normal shadow-hard-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-normal text-3xl sm:text-[42px] text-ink tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-base text-ink/70 mt-1 font-normal">Here's what's happening across your art room notes</p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-electric-iris text-white font-normal rounded-full shadow-hard hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <Upload size={18} strokeWidth={2.5} />
          <span>Upload PDF</span>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Credits', value: dashboard?.stats?.credits ?? 0, icon: Coins, color: 'bg-electric-iris' },
          { label: 'Notes', value: dashboard?.stats?.totalNotes ?? 0, icon: FileText, color: 'bg-jelly-green' },
          { label: 'Uploads', value: dashboard?.stats?.totalUploads ?? 0, icon: Upload, color: 'bg-powder-sky' },
          { label: 'Notebooks', value: dashboard?.stats?.totalNotebooks ?? 0, icon: NotebookText, color: 'bg-hi-yellow' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-paper border border-frost rounded-[24px] p-6 shadow-hard-sm hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center text-white shadow-hard-sm`}>
                <stat.icon size={20} strokeWidth={2} />
              </span>
              <span className="font-display font-normal text-4xl tracking-tight text-ink">{stat.value}</span>
            </div>
            <p className="text-ink/70 font-normal text-base">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Notes */}
        <div className="bg-paper border border-frost rounded-[24px] p-6 shadow-hard-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-normal text-2xl text-ink tracking-tight">Recent Notes</h2>
            <Link to="/library" className="text-sm font-normal text-electric-iris hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          {dashboard?.recentNotes?.length > 0 ? (
            <ul className="space-y-3">
              {dashboard.recentNotes.map((note) => (
                <li key={note.id}>
                  <Link
                    to={`/notes/${note.id}`}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-chalk border border-frost hover:border-electric-iris transition-all"
                  >
                    <div className="w-10 h-10 bg-paper rounded-full flex items-center justify-center shadow-hard-sm shrink-0 text-jelly-green">
                      <FileText size={16} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-normal text-ink truncate text-base">{note.title}</p>
                      <p className="text-xs font-mono text-ink/60 mt-0.5">{formatRelativeTime(note.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-ink/60 mb-4 font-normal">No notes created yet</p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-electric-iris text-white font-normal rounded-full shadow-hard-sm hover:translate-y-0.5 transition-all text-sm"
              >
                <span>Upload your first PDF</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="bg-paper border border-frost rounded-[24px] p-6 shadow-hard-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-normal text-2xl text-ink tracking-tight">Recent Uploads</h2>
          </div>
          {dashboard?.recentUploads?.length > 0 ? (
            <ul className="space-y-3">
              {dashboard.recentUploads.map((upload) => (
                <li
                  key={upload.id}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-chalk border border-frost"
                >
                  <div className="w-10 h-10 bg-paper rounded-full flex items-center justify-center shadow-hard-sm shrink-0 text-powder-sky">
                    <FileText size={16} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-normal text-ink truncate text-base">{upload.fileName}</p>
                    <p className="text-xs font-mono text-ink/60 mt-0.5">
                      {upload.pageCount} pages • {formatRelativeTime(upload.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-ink/60 font-normal">No PDFs uploaded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Credit History */}
      <div className="bg-paper border border-frost rounded-[24px] p-6 shadow-hard-sm">
        <h2 className="font-display font-normal text-2xl text-ink tracking-tight mb-6">Credit History</h2>
        {dashboard?.recentTransactions?.length > 0 ? (
          <ul className="space-y-3">
            {dashboard.recentTransactions.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-chalk border border-frost"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-normal text-sm shadow-hard-sm ${
                      tx.type === 'credit'
                        ? 'bg-jelly-green text-white'
                        : 'bg-marker-red text-white'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                  </span>
                  <div>
                    <p className="font-normal text-ink text-base">{tx.description}</p>
                    <p className="text-xs font-mono text-ink/60 mt-0.5">{formatRelativeTime(tx.createdAt)}</p>
                  </div>
                </div>
                <span
                  className={`font-mono text-base font-normal ${
                    tx.type === 'credit' ? 'text-jelly-green' : 'text-marker-red'
                  }`}
                >
                  {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-ink/60 py-8 font-normal">No transactions recorded yet</p>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
