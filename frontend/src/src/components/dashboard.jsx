import React from 'react';
import { 
  ShieldCheck, 
  FileText, 
  HardDrive, 
  UploadCloud, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight,
  Sparkles,
  Cpu
} from 'lucide-react';

export default function Dashboard({ 
  stats, 
  onOpenUpload, 
  onNavigateVault, 
  onNavigateActivity,
  onUploadSampleDemo
}) {
  const score = stats?.securityScore || 94;
  const status = stats?.securityStatus || 'Excellent';
  const totalFiles = stats?.totalFiles || 0;
  const totalBytes = stats?.totalBytes || 0;
  const recentActivities = stats?.recentActivities || [];

  // Format bytes nicely
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0.0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 0.1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  // SVG Circular Gauge calculation
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="dashboard-view">
      {/* Top Banner Quick Overview */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(90deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.08) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
            Security Operations Dashboard
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Real-time status of your protected documents and cryptographic storage engine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-outline btn-sm"
            onClick={onUploadSampleDemo}
            title="Upload a pre-configured sample cybersecurity document"
          >
            <Sparkles size={15} className="text-cyan" />
            Upload Demo File
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenUpload}
          >
            <UploadCloud size={16} />
            Protect New File
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Security Score Gauge & Specs */}
        <div className="cyber-card security-score-card glow-emerald">
          <div className="badge badge-emerald" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} />
            SECURITY POSTURE
          </div>

          {/* SVG Score Meter */}
          <div className="score-dial-wrapper">
            <svg className="score-dial-svg" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle
                className="score-dial-bg"
                cx="80"
                cy="80"
                r={radius}
              />
              <circle
                className="score-dial-fill"
                cx="80"
                cy="80"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="score-dial-text">
              <span className="score-percentage mono">{score}%</span>
              <span className="score-label">{status}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.25rem' }}>
            AES-256-GCM authenticated encryption active. Zero plain-text files stored on disk.
          </p>

          <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Encryption Algorithm</span>
              <span className="mono text-emerald">AES-256-GCM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Key Derivation</span>
              <span className="mono text-cyan">PBKDF2 (100k)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Integrity Verification</span>
              <span className="mono text-emerald">SHA-256 + GCM Tag</span>
            </div>
          </div>
        </div>

        {/* Right Column: Key Metrics & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats Row */}
          <div className="stats-grid-row">
            {/* Protected Files Card */}
            <div className="cyber-card" style={{ cursor: 'pointer' }} onClick={onNavigateVault}>
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-emerald-light)' }}>
                  <FileText size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value mono">{totalFiles}</div>
                  <div className="stat-title">Protected Files</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>View all files in vault</span>
                <ArrowUpRight size={13} />
              </div>
            </div>

            {/* Storage Usage Card */}
            <div className="cyber-card">
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan-light)' }}>
                  <HardDrive size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value mono">{formatBytes(totalBytes)}</div>
                  <div className="stat-title">Encrypted Storage</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Math.max(5, (totalBytes / (50 * 1024 * 1024)) * 100))}%`, height: '100%', background: 'var(--accent-cyan)' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  <span>Used: {formatBytes(totalBytes)}</span>
                  <span>Limit: 50 MB</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Engine Card */}
            <div className="cyber-card">
              <div className="stat-item">
                <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-purple)' }}>
                  <Cpu size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Node.js Crypto
                  </div>
                  <div className="stat-title">Hardware Accelerated</div>
                </div>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Authenticated GCM Tag mode
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="cyber-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} className="text-emerald" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Security Activity</h3>
              </div>
              <button 
                className="btn btn-outline btn-sm"
                onClick={onNavigateActivity}
                style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              >
                View Full Audit Log
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No security activities recorded yet. Upload a file to see audit entries!
              </div>
            ) : (
              <div className="activity-feed">
                {recentActivities.slice(0, 4).map((act) => (
                  <div key={act.id} className="activity-item">
                    <div className="activity-left">
                      <div className={`activity-icon-badge ${act.status === 'WARNING' ? 'badge-warning' : 'badge-emerald'}`}>
                        {act.status === 'WARNING' ? (
                          <AlertTriangle size={15} />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {act.action}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {act.details || act.category}
                        </div>
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
