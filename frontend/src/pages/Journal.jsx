import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

export default function Journal() {
  const { user, token, isAnonymous } = useAuth();
  const [content, setContent] = useState('');
  const [prompt, setPrompt] = useState('What felt heavy today?');
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const saveTimeout = useRef(null);
  const API = import.meta.env.VITE_API_URL || '';

  // Simple encryption key derived from user ID for demo purposes
  // In a real app, this should be derived from the user's password using a KDF
  const getEncryptionKey = useCallback(() => {
    if (!user) return new Uint8Array(32);
    // Create a 32-byte key from userId padding
    const key = new Uint8Array(32);
    const userIdBytes = naclUtil.decodeUTF8(user._id || 'default_key_fallback_1234567890');
    for (let i = 0; i < 32; i++) {
      key[i] = userIdBytes[i % userIdBytes.length];
    }
    return key;
  }, [user]);

  const encrypt = useCallback((text) => {
    const key = getEncryptionKey();
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const messageUint8 = naclUtil.decodeUTF8(text);
    const box = nacl.secretbox(messageUint8, nonce, key);
    
    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);
    
    return naclUtil.encodeBase64(fullMessage);
  }, [getEncryptionKey]);

  const decrypt = useCallback((messageWithNonce) => {
    try {
      const key = getEncryptionKey();
      const messageUint8 = naclUtil.decodeBase64(messageWithNonce);
      const nonce = messageUint8.slice(0, nacl.secretbox.nonceLength);
      const message = messageUint8.slice(nacl.secretbox.nonceLength, messageWithNonce.length);
      
      const decrypted = nacl.secretbox.open(message, nonce, key);
      if (!decrypted) return 'Could not decrypt entry';
      return naclUtil.encodeUTF8(decrypted);
    } catch (err) {
      return 'Error decrypting entry';
    }
  }, [getEncryptionKey]);

  useEffect(() => {
    if (isAnonymous) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [token, isAnonymous]);

  const fetchData = async () => {
    try {
      const [promptRes, historyRes] = await Promise.all([
        fetch(`${API}/api/journal/prompt`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/journal/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (promptRes.ok) {
        const p = await promptRes.json();
        setPrompt(p.prompt);
      }
      
      if (historyRes.ok) {
        const h = await historyRes.json();
        // Load today's entry if it exists
        const today = new Date().toDateString();
        const todaysEntry = h.find(entry => new Date(entry.createdAt).toDateString() === today);
        if (todaysEntry) {
          setContent(decrypt(todaysEntry.encryptedContent));
        }
        setHistory(h);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    setSaving(true);
    saveTimeout.current = setTimeout(() => {
      saveJournal(e.target.value);
    }, 3000);
  };

  const saveJournal = async (textToSave) => {
    if (!textToSave.trim()) {
      setSaving(false);
      return;
    }
    
    try {
      const encrypted = encrypt(textToSave);
      await fetch(`${API}/api/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ encryptedContent: encrypted })
      });
      // Silent refresh of history to update timeline
      const historyRes = await fetch(`${API}/api/journal/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (isAnonymous) {
    return (
      <div className="journal-page anonymous-state">
        <div className="card">
          <h2>Private Journal 📓</h2>
          <p>Your journal is fully end-to-end encrypted. Not even we can read it.</p>
          <p>To start journaling securely, create a private account.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="journal-page loading">Opening your journal...</div>;

  return (
    <motion.div 
      className="journal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="journal-main">
        <div className="journal-header">
          <span className="journal-date">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <span className={`save-status ${saving ? 'saving' : ''}`}>
            {saving ? 'Saving...' : 'Saved'}
          </span>
        </div>
        
        <h3 className="journal-prompt">{prompt}</h3>
        
        <textarea
          className="journal-textarea"
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing..."
          spellCheck="false"
        />
      </div>

      {history.length > 0 && (
        <div className="journal-timeline">
          <h3>Past Entries</h3>
          <div className="timeline-list">
            {history.map((entry, idx) => {
              const isExpanded = false; // State can be added later to expand past entries
              return (
                <div key={idx} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="timeline-preview">
                    {decrypt(entry.encryptedContent).substring(0, 50)}...
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
