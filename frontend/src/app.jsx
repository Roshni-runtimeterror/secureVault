import React, { useState, useEffect } from 'react';
import Navbar from './components/navbar.jsx';
import Dashboard from './components/dashboard.jsx';
import FileVault from './components/FileVault.jsx';
import UploadModal from './components/UploadModal.jsx';
import LandingPage from './components/landingpage.jsx';
import SharedFileView from './components/sharedFileView.jsx';
import { ShieldCheck, Lock, CheckCircle2, AlertTriangle, Info, Shield, RefreshCw, User, Eye, EyeOff } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('securevault_token'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('securevault_user') || 'null'));
  const [publicShareToken, setPublicShareToken] = useState(() => new URLSearchParams(window.location.search).get('share'));
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Auth modal state
  const [authMode, setAuthMode] = useState('login');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '', name: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'success') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts(p => [...p, { id, title, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  };

  useEffect(() => { if (token) loadVaultData(); }, [token]);

  const loadVaultData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [sRes, fRes, aRes] = await Promise.all([fetch('/api/dashboard/stats', { headers }), fetch('/api/files', { headers }), fetch('/api/activity', { headers })]);
      if (sRes.status === 401 || fRes.status === 401) return handleLogout();
      if (sRes.ok) setStats(await sRes.json());
      if (fRes.ok) setFiles((await fRes.json()).files || []);
      if (aRes.ok) setActivities((await aRes.json()).activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAuthSubmit = async (e, customUser, customPass) => {
    if (e) e.preventDefault();
    const isLogin = authMode === 'login';
    const body = customUser ? { identifier: customUser, password: customPass } : isLogin ? { identifier: authForm.username, password: authForm.password } : authForm;
    setAuthSubmitting(true);
    setAuthError('');
    try {
      const res = await fetch(`/api/${isLogin ? 'login' : 'register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('securevault_token', data.token);
      localStorage.setItem('securevault_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setShowAuthModal(false);
      setAuthForm({ username: '', email: '', password: '', name: '' });
      addToast('Authenticated', `Welcome @${data.user.username}! Session secured.`, 'success');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('securevault_token');
    localStorage.removeItem('securevault_user');
    setToken(null);
    setUser(null);
    setFiles([]);
    setStats(null);
    setActivities([]);
    setCurrentTab('dashboard');
    addToast('Signed Out', 'Vault session terminated and memory cleared.', 'info');
  };

  const handleUploadFile = async (file, customPassword, passwordHint) => {
    const fd = new FormData();
    fd.append('file', file);
    if (customPassword) fd.append('customPassword', customPassword);
    if (passwordHint) fd.append('passwordHint', passwordHint);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    addToast('File Encrypted', `«${file.name}» secured with AES-256-GCM.`, 'success');
    await loadVaultData();
  };

  const handleDownloadFile = async (fileId, password = null) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/files/${fileId}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) });
      if (!res.ok) throw new Error((await res.json()).error || 'Decryption failed');
      const filename = decodeURIComponent(res.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] || 'decrypted_file');
      const url = window.URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      addToast('Integrity Verified', `«${filename}» downloaded.`, 'success');
      loadVaultData();
      return true;
    } catch (err) {
      addToast('Decryption Error', err.message, 'error');
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
      addToast('File Deleted', 'Permanently wiped from vault.', 'info');
      await loadVaultData();
    } catch (err) {
      addToast('Deletion Failed', err.message, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUploadSampleDemo = () => {
    const blob = new Blob([`SECUREVAULT AUDIT REPORT\nDate: ${new Date().toISOString()}\nEncryption: AES-256-GCM\nSHA-256 Checksum Verified`], { type: 'text/plain' });
    handleUploadFile(new File([blob], `Audit_Report_${Date.now().toString().slice(-4)}.txt`, { type: 'text/plain' }), null, null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="disclaimer-banner">
        <Shield size={14} />
        <span><strong>SecureVault Cybersecurity Demonstration</strong> — AES-256-GCM authenticated encryption & PBKDF2.</span>
      </div>

      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            {t.type === 'error' ? <AlertTriangle size={18} className="text-danger" /> : t.type === 'info' ? <Info size={18} className="text-cyan" /> : <CheckCircle2 size={18} className="text-emerald" />}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      {publicShareToken ? (
        <SharedFileView shareToken={publicShareToken} onGoHome={() => { window.history.replaceState({}, '', window.location.pathname); setPublicShareToken(null); }} />
      ) : !token ? (
        <LandingPage onOpenAuth={(mode = 'login') => { setAuthMode(mode); setAuthError(''); setShowAuthModal(true); }} onQuickDemoLogin={() => handleAuthSubmit(null, 'demo_user', 'demo1234')} />
      ) : (
        <>
          <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} user={user} onLogout={handleLogout} onOpenUpload={() => setIsUploadOpen(true)} />
          <main className="app-container" style={{ padding: '1.5rem', maxWidth: '1240px' }}>
            {currentTab === 'dashboard' && <Dashboard stats={stats} onOpenUpload={() => setIsUploadOpen(true)} onNavigateVault={() => setCurrentTab('vault')} onNavigateActivity={() => setCurrentTab('activity')} onUploadSampleDemo={handleUploadSampleDemo} />}
            {currentTab === 'vault' && <FileVault files={files} onDownload={handleDownloadFile} onDelete={handleDeleteFile} onOpenUpload={() => setIsUploadOpen(true)} onUploadSampleDemo={handleUploadSampleDemo} isActionLoading={isActionLoading} token={token} addToast={addToast} />}
            {currentTab === 'activity' && (
              <div className="activity-view">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Security Audit & Activity Stream</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Chronological record of cryptographic events and authentications.</p>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={loadVaultData} disabled={loadingData}>
                    <RefreshCw size={14} className={loadingData ? 'spin' : ''} /> Refresh Logs
                  </button>
                </div>
                <div className="cyber-card">
                  {activities.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>No audit activities logged yet.</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {activities.map(act => (
                        <div key={act.id} className="activity-item">
                          <div className="activity-left">
                            <div className={`activity-icon-badge ${act.status === 'WARNING' ? 'badge-warning' : 'badge-emerald'}`}>
                              {act.status === 'WARNING' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{act.action}</span>
                                <span className={`badge ${act.category === 'security' ? 'badge-danger' : act.category === 'auth' ? 'badge-cyan' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>{act.category}</span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{act.details}</div>
                            </div>
                          </div>
                          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                            <div>{new Date(act.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                            <div>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
          <footer className="app-footer">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={16} className="text-emerald" /><span>SecureVault v1.0.0</span></div>
            <div><span>Engine: Node.js AES-256-GCM + PBKDF2 (100k rounds)</span></div>
          </footer>
        </>
      )}

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUploadFile={handleUploadFile} />

      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><Lock size={22} className="text-emerald" /><span>{authMode === 'login' ? 'Access SecureVault' : 'Create Protected Vault'}</span></div>
              <button className="btn btn-outline btn-sm btn-icon" onClick={() => setShowAuthModal(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', background: 'rgba(10,16,28,0.7)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
              <button type="button" className={`btn btn-sm ${authMode === 'login' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Sign In</button>
              <button type="button" className={`btn btn-sm ${authMode === 'register' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Register</button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <>
                  <div className="form-group"><label className="form-label">Full Name</label><div className="input-with-icon"><User size={16} className="input-icon" /><input type="text" className="form-input" placeholder="Alex Rivera" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} /></div></div>
                  <div className="form-group"><label className="form-label">Email Address</label><div className="input-with-icon"><User size={16} className="input-icon" /><input type="email" className="form-input" placeholder="name@example.com" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} required /></div></div>
                </>
              )}
              <div className="form-group"><label className="form-label">{authMode === 'login' ? 'Username or Email' : 'Username'}</label><div className="input-with-icon"><User size={16} className="input-icon" /><input type="text" className="form-input" placeholder="username" value={authForm.username} onChange={e => setAuthForm({ ...authForm, username: e.target.value })} required /></div></div>
              <div className="form-group"><label className="form-label">Master Password</label><div className="input-with-icon"><Lock size={16} className="input-icon" /><input type={showPassword ? 'text' : 'password'} className="form-input" placeholder="••••••••••••" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} required /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
              {authError && <div style={{ color: 'var(--accent-danger)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem', background: 'rgba(244,63,94,0.08)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244,63,94,0.2)' }}><AlertTriangle size={15} />{authError}</div>}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={authSubmitting}>{authSubmitting ? 'Authenticating...' : authMode === 'login' ? 'Authenticate & Unlock Vault' : 'Create Encrypted Vault'}</button>
                {authMode === 'login' && <button type="button" className="btn btn-outline btn-sm" onClick={() => handleAuthSubmit(null, 'demo_user', 'demo1234')} style={{ width: '100%' }}>⚡ Use Demo Account (demo_user / demo1234)</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
