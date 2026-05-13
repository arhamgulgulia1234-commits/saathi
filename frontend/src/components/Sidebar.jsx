import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart2, Book, User as UserIcon, Edit2, Trash2, Plus, LogIn, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAnonymous } = useAuth();
  const { 
    conversations, 
    conversationId, 
    handleNewChat, 
    handleConversationClick, 
    handleDeleteConversation,
    handleUpdateConversationTitle
  } = useChatContext();

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const onConvClick = (id) => {
    if (editingId === id) return;
    handleConversationClick(id);
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <>
      <button 
        className={`sidebar-toggle-btn ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <aside className={`global-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
        <div 
          className="sidebar-brand" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
        >
          <div className="nav-logo" aria-hidden="true">✨</div>
          <span className="nav-title">Saathi</span>
        </div>
        <button className="new-chat-btn" onClick={() => { handleNewChat(); navigate('/'); }}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="sidebar-scroll">
        {isAnonymous ? (
          <div style={{ padding: '16px 8px', color: 'var(--text-4)', fontSize: '13px', lineHeight: 1.6 }}>
            <p>Sign in to save your conversations and let Saathi remember you 💜</p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                marginTop: 12,
                width: '100%',
                background: 'rgba(212, 132, 90, 0.1)',
                border: '1px solid rgba(212, 132, 90, 0.25)',
                color: 'var(--terra-500)',
                borderRadius: 'var(--r-md)',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'var(--font)',
              }}
            >
              <LogIn size={15} /> Sign in
            </button>
          </div>
        ) : (
          ['today', 'yesterday', 'last7Days', 'last30Days', 'older'].map(groupKey => {
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
                          <button className="conv-action-btn" title="Edit title" onClick={(e) => startEditing(e, c.conversationId, c.title)}>
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="conv-action-btn delete" 
                            title="Delete chat"
                            onClick={(e) => handleDeleteConversation(e, c.conversationId)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <nav className="sidebar-nav">
          <button className={`sidebar-nav-btn ${location.pathname === '/mood' ? 'active' : ''}`} onClick={() => navigate('/mood')}>
            <BarChart2 size={20} />
            <span>Mood</span>
          </button>
          <button className={`sidebar-nav-btn ${location.pathname === '/journal' ? 'active' : ''}`} onClick={() => navigate('/journal')}>
            <Book size={20} />
            <span>Journal</span>
          </button>
          <button className={`sidebar-nav-btn ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
            <UserIcon size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </aside>
    </>
  );
}
