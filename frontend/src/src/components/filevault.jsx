import React, { useState } from 'react';
import { 
  FileText, 
  Image, 
  FileCode, 
  FileArchive, 
  File, 
  Download, 
  Trash2, 
  Search, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Check, 
  Copy, 
  UploadCloud, 
  Filter, 
  AlertCircle, 
  KeyRound, 
  Eye, 
  EyeOff,
  Share2
} from 'lucide-react';
import ShareModal from './ShareModal.jsx';

export default function FileVault({ 
  files, 
  onDownload, 
  onDelete, 
  onOpenUpload, 
  onUploadSampleDemo,
  isActionLoading,
  token,
  addToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Share Modal State
  const [shareModalFile, setShareModalFile] = useState(null);

  // Decryption Prompt Modal State
  const [downloadModalFile, setDownloadModalFile] = useState(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [showDecryptPass, setShowDecryptPass] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  // Delete Confirmation Modal State
  const [deleteModalFile, setDeleteModalFile] = useState(null);

  // Helper to choose file icon
  const getFileIcon = (filename, mimeType) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Image size={22} className="text-cyan" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp'].includes(ext)) {
      return <FileCode size={22} className="text-emerald" />;
    }
    if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
      return <FileArchive size={22} style={{ color: 'var(--accent-warning)' }} />;
    }
    return <FileText size={22} className="text-emerald" />;
  };

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'custom-pass') return file.hasCustomPassword;
    if (filterType === 'images') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
    }
    if (filterType === 'docs') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx'].includes(ext);
    }
    return true;
  });

  const handleCopyChecksum = (id, hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInitiateDownload = (file) => {
    if (file.hasCustomPassword) {
      setDownloadModalFile(file);
      setDecryptPassword('');
      setDecryptError('');
    } else {
      // Direct session decryption
      onDownload(file.id, null);
    }
  };

  const handleConfirmDownloadWithPassword = async (e) => {
    e.preventDefault();
    if (!downloadModalFile) return;

    if (!decryptPassword.trim()) {
      setDecryptError('Please enter the protection password.');
      return;
    }

    try {
      setDecryptError('');
      const success = await onDownload(downloadModalFile.id, decryptPassword);
      if (success) {
        setDownloadModalFile(null);
        setDecryptPassword('');
      }
    } catch (err) {
      setDecryptError(err.message || 'Decryption failed. Incorrect password.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalFile) return;
    await onDelete(deleteModalFile.id);
    setDeleteModalFile(null);
  };

  return (
    <div className="vault-view">
      {/* Header & Filter Controls */}
      <div className="vault-header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>
            Encrypted File Vault
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {files.length} protected documents secured with AES-256-GCM cipher and PBKDF2 keys.
          </p>
        </div>

        <div className="vault-controls">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search files by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Upload Action */}
          <button className="btn btn-primary" onClick={onOpenUpload}>
            <UploadCloud size={17} />
            Protect File
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filterType === 'all' ? 'btn-cyan' : 'btn-outline'}`}
          onClick={() => setFilterType('all')}
        >
          All Files ({files.length})
        </button>
        <button
          className={`btn btn-sm ${filterType === 'docs' ? 'btn-cyan' : 'btn-outline'}`}
          onClick={() => setFilterType('docs')}
        >
          Documents
        </button>
        <button
          className={`btn btn-sm ${filterType === 'images' ? 'btn-cyan' : 'btn-outline'}`}
          onClick={() => setFilterType('images')}
        >
          Images
        </button>
        <button
          className={`btn btn-sm ${filterType === 'custom-pass' ? 'btn-cyan' : 'btn-outline'}`}
          onClick={() => setFilterType('custom-pass')}
        >
          <Lock size={13} /> Custom Passwords
        </button>
      </div>

      {/* Files Grid or Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="empty-vault">
          <div className="empty-icon-shield">
            <ShieldCheck size={36} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {searchTerm ? 'No matching protected files found' : 'Your Vault is Currently Empty'}
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '460px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {searchTerm 
              ? `No documents match "${searchTerm}". Try a different keyword or reset filters.`
              : 'Upload and encrypt sensitive files, documents, credentials, or keys. Files are safeguarded with AES-256-GCM cryptography.'}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={onOpenUpload}>
              <UploadCloud size={17} />
              Upload & Protect File
            </button>
            <button className="btn btn-outline" onClick={onUploadSampleDemo}>
              Upload Demo Sample
            </button>
          </div>
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map((file) => (
            <div key={file.id} className="file-card">
              <div>
                {/* Top Row: Icon, Filename, Protection Badge */}
                <div className="file-card-top">
                  <div className="file-type-icon">
                    {getFileIcon(file.name, file.mimeType)}
                  </div>
                  <div className="file-info">
                    <div className="file-name" title={file.name}>
                      {file.name}
                    </div>
                    <div className="file-meta-row">
                      <span className="mono">{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ display: 'flex', gap: '6px', margin: '0.85rem 0 0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge badge-emerald">
                    <ShieldCheck size={12} />
                    AES-256-GCM
                  </span>
                  {file.hasCustomPassword ? (
                    <span className="badge badge-cyan" title="Secured with custom user password">
                      <Lock size={12} />
                      Passphrase Locked
                    </span>
                  ) : (
                    <span className="badge badge-neutral" title="Secured with user master vault key">
                      <Unlock size={12} />
                      Vault Key Protected
                    </span>
                  )}
                </div>

                {/* Cryptographic Details Card */}
                <div className="file-card-details">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-dim)' }}>SHA-256 Checksum:</span>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.68rem', height: 'auto' }}
                      onClick={() => handleCopyChecksum(file.id, file.originalChecksum)}
                      title="Copy full SHA-256 hash"
                    >
                      {copiedId === file.id ? <Check size={11} className="text-emerald" /> : <Copy size={11} />}
                      {copiedId === file.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="checksum-preview mono" title={file.originalChecksum}>
                    {file.originalChecksum}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="file-card-actions">
                <button
                  className="btn btn-cyan btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleInitiateDownload(file)}
                  disabled={isActionLoading}
                >
                  <Download size={14} />
                  Download
                </button>

                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={() => setShareModalFile(file)}
                  disabled={isActionLoading}
                  title="Generate secure share link"
                  style={{ borderColor: 'rgba(6,182,212,0.4)', color: 'var(--accent-cyan-light)' }}
                >
                  <Share2 size={15} />
                </button>

                <button
                  className="btn btn-danger btn-sm btn-icon"
                  onClick={() => setDeleteModalFile(file)}
                  disabled={isActionLoading}
                  title="Delete encrypted file"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Decryption Password Prompt Modal --- */}
      {downloadModalFile && (
        <div className="modal-overlay" onClick={() => setDownloadModalFile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <KeyRound size={22} className="text-cyan" />
                <span>Decrypt Protected File</span>
              </div>
              <button 
                className="btn btn-outline btn-sm btn-icon"
                onClick={() => setDownloadModalFile(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDownloadWithPassword}>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  The file <strong className="text-emerald">«{downloadModalFile.name}»</strong> is encrypted with a custom protection password. Enter the password to derive the AES-256 key and verify the GCM authentication tag.
                </p>

                {downloadModalFile.passwordHint && (
                  <div style={{ 
                    padding: '0.65rem 0.85rem', 
                    background: 'rgba(6,182,212,0.08)', 
                    border: '1px solid rgba(6,182,212,0.2)', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem',
                    color: 'var(--accent-cyan-light)',
                    marginBottom: '1rem'
                  }}>
                    <strong>Password Hint:</strong> {downloadModalFile.passwordHint}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Protection Password</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      type={showDecryptPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter protection password..."
                      value={decryptPassword}
                      onChange={(e) => setDecryptPassword(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowDecryptPass(!showDecryptPass)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer'
                      }}
                    >
                      {showDecryptPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {decryptError && (
                  <div style={{ 
                    color: 'var(--accent-danger)', 
                    fontSize: '0.825rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    marginTop: '0.5rem' 
                  }}>
                    <AlertCircle size={15} />
                    {decryptError}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDownloadModalFile(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-cyan"
                  disabled={isActionLoading}
                >
                  <Download size={16} />
                  Decrypt & Download
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deleteModalFile && (
        <div className="modal-overlay" onClick={() => setDeleteModalFile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Trash2 size={22} className="text-danger" />
                <span>Confirm File Deletion</span>
              </div>
              <button 
                className="btn btn-outline btn-sm btn-icon"
                onClick={() => setDeleteModalFile(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Are you sure you want to securely remove <strong className="text-emerald">«{deleteModalFile.name}»</strong>?
              </p>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                This will permanently purge the encrypted ciphertext payload from vault disk storage. This operation cannot be reversed.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setDeleteModalFile(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isActionLoading}
              >
                <Trash2 size={16} />
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Share File Link Modal --- */}
      <ShareModal
        file={shareModalFile}
        isOpen={Boolean(shareModalFile)}
        onClose={() => setShareModalFile(null)}
        token={token}
        addToast={addToast}
      />
    </div>
  );
}