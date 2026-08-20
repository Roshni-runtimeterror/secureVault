import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Link, 
  Copy, 
  Check, 
  Clock, 
  Flame, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Trash2, 
  ShieldCheck, 
  Globe, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function ShareModal({ 
  file, 
  isOpen, 
  onClose, 
  token,
  addToast 
}) {
  if (!isOpen || !file) return null;

  const [expiresInHours, setExpiresInHours] = useState('24');
  const [downloadLimit, setDownloadLimit] = useState('0'); // '0' = unlimited, '1' = burn after 1, '5', '10'
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPassword, setShowLinkPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedShare, setGeneratedShare] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Existing shares for this file
  const [existingShares, setExistingShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      setGeneratedShare(null);
      setError('');
      setLinkPassword('');
      fetchFileShares();
    }
  }, [file, isOpen]);

  const fetchFileShares = async () => {
    if (!file || !token) return;
    setLoadingShares(true);
    try {
      const res = await fetch(`/api/files/${file.id}/shares`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExistingShares(data.shares || []);
      }
    } catch (err) {
      console.error('Failed to load file shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  const getFullShareUrl = (shareToken) => {
    const origin = window.location.origin;
    return `${origin}/?share=${shareToken}`;
  };

  const handleGenerateShare = async (e) => {
    e.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const payload = {
        expiresInHours: expiresInHours === 'never' ? null : parseInt(expiresInHours, 10),
        downloadLimit: downloadLimit === '0' ? null : parseInt(downloadLimit, 10),
        linkPassword: linkPassword.trim() || null
      };

      const res = await fetch(`/api/files/${file.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate share link.');
      }

      setGeneratedShare(data.share);
      if (addToast) {
        addToast('Share Link Created', `Link generated for «${file.name}». Ready to share!`, 'success');
      }
      fetchFileShares();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = (shareToken) => {
    const url = getFullShareUrl(shareToken);
    navigator.clipboard.writeText(url);
    setCopied(true);
    if (addToast) {
      addToast('Link Copied', 'Secure share link copied to clipboard.', 'info');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevokeShare = async (shareId) => {
    try {
      const res = await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke link.');
      }

      if (addToast) {
        addToast('Link Revoked', 'Share link has been deactivated.', 'info');
      }

      if (generatedShare && generatedShare.id === shareId) {
        setGeneratedShare(null);
      }
      fetchFileShares();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Share2 size={22} className="text-cyan" />
            <span>Generate Secure Share Link</span>
          </div>
          <button className="btn btn-outline btn-sm btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Selected File Banner */}
        <div className="share-file-banner">
          <div className="share-file-info">
            <div className="share-file-name" title={file.name}>
              {file.name}
            </div>
            <div className="share-file-meta">
              <span className="mono">{(file.size / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                <ShieldCheck size={11} /> AES-256-GCM
              </span>
              {file.hasCustomPassword && (
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  <Lock size={11} /> Passphrase Required
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Newly Generated Share Link Box */}
        {generatedShare && !generatedShare.isRevoked && (
          <div className="generated-link-card">
            <div className="generated-link-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={16} className="text-cyan" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Your Public Share Link is Live</span>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>Active</span>
            </div>

            <div className="share-url-box">
              <input
                type="text"
                readOnly
                value={getFullShareUrl(generatedShare.token)}
                className="share-url-input mono"
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className="btn btn-cyan btn-sm"
                onClick={() => handleCopyLink(generatedShare.token)}
                style={{ flexShrink: 0 }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="share-summary-pills">
              <div className="share-pill">
                <Clock size={12} />
                <span>
                  {generatedShare.expiresAt 
                    ? `Expires: ${new Date(generatedShare.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(generatedShare.expiresAt).toLocaleDateString()})` 
                    : 'No Expiration'}
                </span>
              </div>

              <div className="share-pill">
                <Flame size={12} style={{ color: generatedShare.downloadLimit === 1 ? 'var(--accent-warning)' : 'inherit' }} />
                <span>
                  {generatedShare.downloadLimit === 1 
                    ? '🔥 Burn After 1 Download' 
                    : generatedShare.downloadLimit 
                      ? `Max ${generatedShare.downloadLimit} downloads` 
                      : 'Unlimited Downloads'}
                </span>
              </div>

              {generatedShare.hasLinkPassword && (
                <div className="share-pill">
                  <Lock size={12} />
                  <span>Password Protected</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <a 
                href={getFullShareUrl(generatedShare.token)} 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={13} /> Open Recipient Page
              </a>
            </div>
          </div>
        )}

        {/* Link Generation Form */}
        <form onSubmit={handleGenerateShare}>
          <div className="share-form-grid">
            {/* Expiration Setting */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} className="text-cyan" />
                Link Expiration
              </label>
              <select
                className="form-input"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
              >
                <option value="1">1 Hour</option>
                <option value="6">6 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="72">3 Days</option>
                <option value="168">7 Days (1 Week)</option>
                <option value="never">Never (Until manually revoked)</option>
              </select>
            </div>

            {/* Download Limit Setting */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={14} style={{ color: 'var(--accent-warning)' }} />
                Download Limit (Self-Destruct)
              </label>
              <select
                className="form-input"
                value={downloadLimit}
                onChange={(e) => setDownloadLimit(e.target.value)}
              >
                <option value="0">Unlimited Downloads</option>
                <option value="1">🔥 1 Download Only (Burn After Reading)</option>
                <option value="5">5 Downloads Maximum</option>
                <option value="10">10 Downloads Maximum</option>
              </select>
            </div>
          </div>

          {/* Optional Link Password */}
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} className="text-emerald" />
              Link Protection Password (Optional)
            </label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type={showLinkPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Set optional password for link recipient..."
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowLinkPassword(!showLinkPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                {showLinkPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              If set, recipient must enter this password before the file can be decrypted and downloaded.
            </p>
          </div>

          {error && (
            <div style={{ 
              color: 'var(--accent-danger)', 
              fontSize: '0.825rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              marginTop: '0.75rem',
              background: 'rgba(244,63,94,0.08)',
              padding: '0.6rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(244,63,94,0.2)'
            }}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isGenerating}
            >
              <Link size={16} />
              {isGenerating ? 'Generating Link...' : 'Generate Share Link'}
            </button>
          </div>
        </form>

        {/* Existing Active Shares List */}
        {existingShares.length > 0 && (
          <div className="active-shares-section">
            <div className="active-shares-title">
              <span>Active Links for This File ({existingShares.filter(s => !s.isRevoked && !s.isExpired && !s.isLimitReached).length})</span>
              <button 
                className="btn btn-outline btn-sm btn-icon" 
                style={{ height: '24px', width: '24px', padding: 0 }}
                onClick={fetchFileShares}
                title="Refresh shares"
              >
                <RefreshCw size={12} className={loadingShares ? 'spin' : ''} />
              </button>
            </div>

            <div className="active-shares-list">
              {existingShares.map((s) => {
                const isInactive = s.isRevoked || s.isExpired || s.isLimitReached;
                return (
                  <div key={s.id} className={`active-share-item ${isInactive ? 'share-inactive' : ''}`}>
                    <div className="active-share-left">
                      <div className="active-share-token mono">
                        {getFullShareUrl(s.token).substring(0, 38)}...
                      </div>
                      <div className="active-share-meta">
                        <span>{s.downloadsCount} / {s.downloadLimit ? `${s.downloadLimit} dl` : '∞'}</span>
                        <span>•</span>
                        <span>
                          {s.isRevoked ? (
                            <span className="text-danger">Revoked</span>
                          ) : s.isExpired ? (
                            <span className="text-danger">Expired</span>
                          ) : s.isLimitReached ? (
                            <span className="text-warning">Limit Reached</span>
                          ) : s.expiresAt ? (
                            `Expires in ${Math.max(0, Math.round((new Date(s.expiresAt) - new Date()) / (3600 * 1000)))}h`
                          ) : (
                            'No Expiry'
                          )}
                        </span>
                        {s.hasLinkPassword && <span>• 🔒 Protected</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!isInactive && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-icon"
                          onClick={() => handleCopyLink(s.token)}
                          title="Copy Link"
                        >
                          <Copy size={13} />
                        </button>
                      )}
                      {!s.isRevoked && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleRevokeShare(s.id)}
                          title="Revoke and deactivate link immediately"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
