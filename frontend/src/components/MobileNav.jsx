import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Clock, BarChart2, Book, User as UserIcon, X, Trash2, Edit2 } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHistory, setShowHistory] = useState(false);
  const { isAnonymous } = useAuth();
  const { 
    conversations, 
    conversationId, 
    handleConversationClick, 
    handleDeleteConversation,
    handleUpdateConversationTitle
  } = useChatContext();

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const startEditing = (e, id, currentTitle) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(currentTitle || 'New conversation');
  };

  const saveEdit = (id) => {
    if (editingTitle.trim()) {
      handleUpdateConversationTitle(id, editingTitle);
    }
    setEditingId(null);
  };

  const handleNavClick = (path) => {
    setShowHistory(false);
    navigate(path);
  };

  const onConvClick = (id) => {
    if (editingId === id) return;
    handleConversationClick(id);
    setShowHistory(false);
    if (location.pathname !== '/') navigate('/');
  };

  const groupConversations = () => {
    const groups = { today: [], yesterday: [], last7Days: [], last30Days: [], older: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const last7 = today - 7 * 86400000;
    const last30 = today - 30 * 86400000;

    conversations.forEach(c => {
      const d = new Date(c.startedAt).getTime();
      if (d >= today) groups.today.push(c);
      else if (d >= yesterday) groups.yesterday.push(c);
      else if (d >= last7) groups.last7Days.push(c);
      else if (d >= last30) groups.last30Days.push(c);
      else groups.older.push(c);
    });
    return groups;
  };

  const groups = groupConversations();

  return (
    <>
      <nav className="mobile-bottom-nav">
        <button className={`nav-btn ${location.pathname === '/' && !showHistory ? 'active' : ''}`} onClick={() => handleNavClick('/')}>
          <MessageSquare size={22} className="nav-icon" />
          <span className="nav-label">Chat</span>
        </button>
        {!isAnonymous && (
          <button className={`nav-btn ${showHistory ? 'active' : ''}`} onClick={() => setShowHistory(true)}>
            <Clock size={22} className="nav-icon" />
            <span className="nav-label">History</span>
          </button>
        )}
        <button className={`nav-btn ${location.pathname === '/mood' ? 'active' : ''}`} onClick={() => handleNavClick('/mood')}>
          <BarChart2 size={22} className="nav-icon" />
          <span className="nav-label">Mood</span>
        </button>
        <button className={`nav-btn ${location.pathname === '/journal' ? 'active' : ''}`} onClick={() => handleNavClick('/journal')}>
          <Book size={22} className="nav-icon" />
          <span className="nav-label">Journal</span>
        </button>
        <button className={`nav-btn ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => handleNavClick('/profile')}>
          <UserIcon size={22} className="nav-icon" />
          <span className="nav-label">Profile</span>
        </button>
      </nav>

      {/* Full-screen History Drawer for Mobile */}
      {!isAnonymous && (
        <div className={`mobile-history-drawer ${showHistory ? 'open' : ''}`}>
          <div className="drawer-header">
            <h2>Past Conversations</h2>
            <button className="close-btn" onClick={() => setShowHistory(false)}>
              <X size={24} />
            </button>
          </div>
          <div className="drawer-scroll">
            {['today', 'yesterday', 'last7Days', 'last30Days', 'older'].map(groupKey => {
              const group = groups[groupKey];
              if (!group || group.length === 0) return null;
              const labels = {
                today: 'Today', yesterday: 'Yesterday', 
                last7Days: 'Last 7 days', last30Days: 'Last 30 days', older: 'Older'
              };
              return (
                <div key={groupKey} className="conversation-group">
                  <div className="conversation-group-title">{labels[groupKey]}</div>
                  {group.map(c => (
                    <div 
                      key={c.conversationId}
                      className={`conversation-item ${conversationId === c.conversationId && location.pathname === '/' ? 'active' : ''}`}
                      onClick={() => onConvClick(c.conversationId)}
                    >
                      {editingId === c.conversationId ? (
                        <input 
                          ref={inputRef}
                          type="text" 
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => saveEdit(c.conversationId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(c.conversationId);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{ 
                            width: '100%', 
                            background: 'rgba(0,0,0,0.2)', 
                            border: '1px solid var(--text-4)', 
                            color: 'var(--text-1)', 
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '13px'
                          }}
                        />
                      ) : (
                        <>
                          <div className="conversation-title">{c.title || 'New conversation'}</div>
                          <div className="conversation-actions">
                            <button 
                              className="conv-action-btn" 
                              title="Edit title" 
                              onClick={(e) => startEditing(e, c.conversationId, c.title)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="conv-action-btn delete" 
                              title="Delete chat"
                              onClick={(e) => handleDeleteConversation(e, c.conversationId)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
