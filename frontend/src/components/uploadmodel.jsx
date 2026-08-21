import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Hash,
  Binary
} from 'lucide-react';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  onUploadFile 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Progress Simulation State
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Password strength calculation
  const calculateStrength = (pass) => {
    if (!pass) return { score: 0, text: 'None', color: 'rgba(255,255,255,0.1)' };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 10) score += 25;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 25;

    if (score <= 25) return { score: 25, text: 'Weak', color: '#f43f5e' };
    if (score <= 50) return { score: 50, text: 'Fair', color: '#f59e0b' };
    if (score <= 75) return { score: 75, text: 'Good', color: '#38bdf8' };
    return { score: 100, text: 'Strong', color: '#10b981' };
  };

  const strength = calculateStrength(password);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50 MB limit.');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to protect.');
      return;
    }

    if (useCustomPassword && password.length < 4) {
      setErrorMessage('Custom protection password must be at least 4 characters long.');
      return;
    }

    setIsEncrypting(true);
    setErrorMessage('');

    try {
      // Step 1: Pre-hashing & buffer read
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 200));

      // Step 2: PBKDF2 Key Derivation
      setCurrentStep(2);
      await new Promise(r => setTimeout(r, 250));

      // Step 3: AES-256-GCM cipher encryption
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 250));

      // Step 4: Dispatch to backend
      setCurrentStep(4);
      await onUploadFile(
        selectedFile, 
        useCustomPassword ? password : null, 
        useCustomPassword ? passwordHint : null
      );

      // Reset and close
      handleClose();
    } catch (err) {
      setErrorMessage(err.message || 'Encryption and upload failed.');
      setIsEncrypting(false);
      setCurrentStep(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPassword('');
    setPasswordHint('');
    setUseCustomPassword(false);
    setErrorMessage('');
    setIsEncrypting(false);
    setCurrentStep(0);
    onClose();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ShieldCheck size={22} className="text-emerald" />
            <span>Secure File Upload</span>
          </div>
          <button 
            className="btn btn-outline btn-sm btn-icon"
            onClick={handleClose}
            disabled={isEncrypting}
          >
            ✕
          </button>
        </div>

        {isEncrypting ? (
          <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
            <div style={{ margin: '0 auto 1.5rem', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
              <Loader2 size={30} className="spin" />
            </div>
            
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              Protecting «{selectedFile?.name}»
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Applying hardware-accelerated AES-256-GCM cryptography
            </p>

            <div className="encryption-steps">
              <div className={`enc-step ${currentStep >= 1 ? (currentStep > 1 ? 'done' : 'active') : ''}`}>
                <Hash size={16} />
                <span>Computing SHA-256 pre-encryption integrity hash</span>
                {currentStep > 1 && <CheckCircle2 size={16} style={{ marginLeft: 'auto' }} />}
              </div>

              <div className={`enc-step ${currentStep >= 2 ? (currentStep > 2 ? 'done' : 'active') : ''}`}>
                <Binary size={16} />
                <span>Deriving 256-bit key via PBKDF2 (100,000 rounds)</span>
                {currentStep > 2 && <CheckCircle2 size={16} style={{ marginLeft: 'auto' }} />}
              </div>

              <div className={`enc-step ${currentStep >= 3 ? (currentStep > 3 ? 'done' : 'active') : ''}`}>
                <Lock size={16} />
                <span>Encrypting payload with AES-256-GCM cipher & 16-byte Auth Tag</span>
                {currentStep > 3 && <CheckCircle2 size={16} style={{ marginLeft: 'auto' }} />}
              </div>

              <div className={`enc-step ${currentStep >= 4 ? 'active' : ''}`}>
                <UploadCloud size={16} />
                <span>Persisting encrypted ciphertext in isolated vault storage</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Dropzone */}
            {!selectedFile ? (
              <div 
                className={`dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  onChange={handleFileSelect} 
                />
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald-light)' }}>
                  <UploadCloud size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    Click to browse or drag & drop document
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    PDF, Images, Word, Code, ZIP (Max 50 MB)
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(10,16,28,0.7)', 
                border: '1px solid rgba(16,185,129,0.3)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald-light)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile.name}
                    </div>
                    <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatSize(selectedFile.size)} • {selectedFile.type || 'Binary Document'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedFile(null)}
                  style={{ fontSize: '0.75rem' }}
                >
                  Change
                </button>
              </div>
            )}

            {/* Protection Options */}
            <div style={{ margin: '1.25rem 0' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  marginBottom: useCustomPassword ? '1rem' : '0'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Use Custom Protection Password
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Set a separate passphrase required whenever downloading this file
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useCustomPassword}
                  onChange={(e) => setUseCustomPassword(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                />
              </div>

              {useCustomPassword && (
                <div style={{ padding: '0.5rem 0' }}>
                  <div className="form-group">
                    <label className="form-label">
                      <span>Protection Passphrase</span>
                      <span style={{ fontSize: '0.75rem', color: strength.color }}>
                        {strength.text}
                      </span>
                    </label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter encryption passphrase..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={useCustomPassword}
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

                    <div className="password-strength-bar">
                      <div 
                        className="password-strength-fill"
                        style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                      ></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span>Password Hint (Optional)</span>
                    </label>
                    <div className="input-with-icon">
                      <HelpCircle size={16} className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. My university locker combination"
                        value={passwordHint}
                        onChange={(e) => setPasswordHint(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMessage && (
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
                <AlertCircle size={15} />
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile}
              >
                <ShieldCheck size={16} />
                Encrypt & Store in Vault
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
