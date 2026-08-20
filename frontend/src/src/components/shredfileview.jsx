import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Flame, 
  FileText, 
  Image, 
  FileCode, 
  FileArchive, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function SharedFileView({ shareToken, onGoHome }) {
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Decryption & download state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  useEffect(() => {
    if (shareToken) {
      fetchShareInfo();
    }
  }, [shareToken]);

  const fetchShareInfo = async () => {
    setLoading(true);
    setError('');
    setIsExpired(false);

    try {
      const res = await fetch(`/api/public/share/${shareToken}`);
      const data = await res.json();

      if (res.status === 410) {
        setIsExpired(true);
        setError(data.error || 'This share link has expired or reached its download limit.');
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or revoked share link.');
      }

      setFileInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image size={36} className="text-cyan" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp'].includes(ext)) {
      return <FileCode size={36} className="text-emerald" />;
    }
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive size={36} style={{ color: 'var(--accent-warning)' }} />;
    }
    return <FileText size={36} className="text-emerald" />;
  };

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCopyChecksum = () => {
    if (!fileInfo?.originalChecksum) return;
    navigator.clipboard.writeText(fileInfo.originalChecksum);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  const handleDownload = async (e) => {
    e.preventDefault();
    setDecryptError('');

    const requiresPass = fileInfo.requiresLinkPassword || fileInfo.requiresFilePassword;
    if (requiresPass && !password.trim()) {
      setDecryptError('Please enter the required protection password.');
      return;
    }

    setDecrypting(true);

    try {
      const res = await fetch(`/api/public/share/${shareToken}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Decryption failed.');
      }

      // Read filename
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = fileInfo.fileName || 'decrypted_file';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      // Refresh share info in case limit was reached
      fetchShareInfo();
    } catch (err) {
      setDecryptError(err.message);
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className="shared-portal-wrapper">
      {/* Top Bar */}
      <div className="shared-portal-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={onGoHome}>
            <ShieldCheck size={26} className="text-emerald" />
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
              Secure<span className="text-cyan">Vault</span>
            </span>
          </div>
          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            Zero-Trust File Gateway
          </span>
        </div>

        <button className="btn btn-outline btn-sm" onClick={onGoHome}>
          <ArrowLeft size={14} /> Back to SecureVault
        </button>
      </div>

      {/* Main Container */}
      <div className="shared-portal-container">
        {loading ? (
          <div className="cyber-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div className="spin" style={{ width: '36px', height: '36px', border: '3px solid rgba(16,185,129,0.2)', borderTopColor: 'var(--accent-emerald)', borderRadius: '50%', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Validating Cryptographic Share Token</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Verifying link integrity, expiration status, and access permissions...</p>
          </div>
        ) : error ? (
          <div className="cyber-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(244,63,94,0.12)', 
              color: 'var(--accent-danger)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem',
              border: '1px solid rgba(244,63,94,0.3)'
            }}>
              {isExpired ? <Flame size={32} /> : <AlertTriangle size={32} />}
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {isExpired ? 'Share Link Expired / Burned' : 'Access Restricted'}
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {error}
            </p>

            <button className="btn btn-primary" onClick={onGoHome}>
              Return to SecureVault
            </button>
          </div>
        ) : fileInfo && (
          <div className="shared-file-card cyber-card">
            {/* Header / Security Badge */}
            <div className="shared-card-header">
              <div className="shared-file-icon-box">
                {getFileIcon(fileInfo.fileName)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span className="badge badge-emerald">
                    <ShieldCheck size={12} /> {fileInfo.algorithm || 'AES-256-GCM'}
                  </span>

                  {fileInfo.downloadLimit === 1 ? (
                    <span className="badge badge-warning">
                      <Flame size={12} /> Burn After 1 Download
                    </span>
                  ) : fileInfo.downloadLimit ? (
                    <span className="badge badge-cyan">
                      Downloads: {fileInfo.downloadsCount} / {fileInfo.downloadLimit}
                    </span>
                  ) : null}

                  {fileInfo.expiresAt && (
                    <span className="badge badge-neutral">
                      <Clock size={12} /> Expires: {new Date(fileInfo.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(fileInfo.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>

                <h1 className="shared-file-title" title={fileInfo.fileName}>
                  {fileInfo.fileName}
                </h1>

                <div className="shared-file-meta-line">
                  <span>Size: <strong className="mono">{formatSize(fileInfo.size)}</strong></span>
                  <span>•</span>
                  <span>Encrypted Payload: <strong className="mono">{formatSize(fileInfo.encryptedSize)}</strong></span>
                </div>
              </div>
            </div>

            {/* Cryptographic Integrity Hash Box */}
            <div className="shared-hash-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pre-Encryption SHA-256 Integrity Hash
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 6px', fontSize: '0.68rem', height: 'auto' }}
                  onClick={handleCopyChecksum}
                  title="Copy SHA-256 hash"
                >
                  {copiedChecksum ? <Check size={11} className="text-emerald" /> : <Copy size={11} />}
                  {copiedChecksum ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="mono shared-hash-text" title={fileInfo.originalChecksum}>
                {fileInfo.originalChecksum}
              </div>
            </div>

            {/* Download Success Notice */}
            {downloadSuccess && (
              <div className="shared-success-box">
                <CheckCircle2 size={20} className="text-emerald" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Decryption & Download Successful!
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    The AES-256 ciphertext was decrypted in-memory and authenticated against its SHA-256 checksum.
                  </div>
                </div>
              </div>
            )}

            {/* Decrypt & Download Form */}
            <form onSubmit={handleDownload} style={{ marginTop: '1.5rem' }}>
              {(fileInfo.requiresLinkPassword || fileInfo.requiresFilePassword) && (
                <div style={{ marginBottom: '1.25rem' }}>
                  {fileInfo.passwordHint && (
                    <div style={{ 
                      padding: '0.65rem 0.85rem', 
                      background: 'rgba(6,182,212,0.08)', 
                      border: '1px solid rgba(6,182,212,0.2)', 
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.8rem',
                      color: 'var(--accent-cyan-light)',
                      marginBottom: '1rem'
                    }}>
                      <strong>Password Hint:</strong> {fileInfo.passwordHint}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} className="text-cyan" />
                      {fileInfo.requiresLinkPassword && fileInfo.requiresFilePassword
                        ? 'Protection Passphrase'
                        : fileInfo.requiresLinkPassword
                          ? 'Link Protection Password'
                          : 'File Protection Passphrase'}
                    </label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter password to derive decryption key..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer'
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {decryptError && (
                <div style={{ 
                  color: 'var(--accent-danger)', 
                  fontSize: '0.825rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  marginBottom: '1rem',
                  background: 'rgba(244,63,94,0.08)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(244,63,94,0.2)'
                }}>
                  <AlertTriangle size={15} />
                  {decryptError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
                disabled={decrypting}
              >
                {decrypting ? (
                  <>
                    <div className="spin" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                    Verifying GCM Tag & Decrypting...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Verify Integrity & Download File
                  </>
                )}
              </button>
            </form>

            {/* Zero Knowledge Footnote */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.775rem' }}>
              <Shield size={14} className="text-emerald" />
              <span>Protected with AES-256-GCM Galois Authenticated Cryptography</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
