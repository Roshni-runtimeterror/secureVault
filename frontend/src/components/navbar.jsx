import React from 'react';
import { 
  ShieldCheck, 
  HardDrive, 
  Activity, 
  Upload, 
  LogOut, 
  Lock, 
  User, 
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  user, 
  onLogout, 
  onOpenUpload 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="navbar">
      {/* Brand */}
      <div className="navbar-brand" onClick={() => setCurrentTab('dashboard')}>
        <div className="brand-icon">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="brand-name">SecureVault</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
            YOUR FILES. YOUR SECURITY.
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs */}
      <nav className="nav-links">
        <button 
          className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <ShieldCheck size={17} />
          Dashboard
        </button>

        <button 
          className={`nav-tab-btn ${currentTab === 'vault' ? 'active' : ''}`}
          onClick={() => setCurrentTab('vault')}
        >
          <HardDrive size={17} />
          File Vault
        </button>

        <button 
          className={`nav-tab-btn ${currentTab === 'activity' ? 'active' : ''}`}
          onClick={() => setCurrentTab('activity')}
        >
          <Activity size={17} />
          Activity Log
        </button>
      </nav>

      {/* Right Actions */}
      <div className="nav-actions">
        <div className="badge badge-emerald" style={{ display: 'none', md: 'inline-flex' }}>
          <span className="pulse-dot"></span>
          AES-256 ENCRYPTED
        </div>

        <button 
          className="btn btn-primary btn-sm"
          onClick={onOpenUpload}
        >
          <Upload size={16} />
          <span style={{ display: 'inline' }}>Upload File</span>
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem'
              }}
              title={`Logged in as ${user.email}`}
            >
              <User size={14} className="text-cyan" />
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || user.username}
              </span>
            </div>

            <button 
              className="btn btn-outline btn-sm btn-icon"
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
