import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart2, Book, User as UserIcon,
  Edit2, Trash2, Plus, LogIn,
  PanelLeftClose, PanelLeftOpen,
  MessageSquare
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function groupConversations(conversations) {
  const groups = { today: [], yesterday: [], last7Days: [], older: [] };
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const last7Start = todayStart - 7 * 86400000;

  conversations.forEach(c => {
    const d = new Date(c.startedAt).getTime();
    if (d >= todayStart) groups.today.push(c);
    else if (d >= yesterdayStart) groups.yesterday.push(c);
    else if (d >= last7Start) groups.last7Days.push(c);
    else groups.older.push(c);
  });
  return groups;
}

const GROUP_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 days',
  older: 'Older',
};

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
    handleUpdateConversationTitle,
  } = useChatContext();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  const startEditing = (e, id, title) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingTitle(title || 'New conversation');
  };

  const saveEdit = (id) => {
    if (editingTitle.trim()) handleUpdateConversationTitle(id, editingTitle.trim());
    setEditingId(null);
  };

  const onConvClick = (id) => {
    if (editingId === id) return;
    handleConversationClick(id);
    if (location.pathname !== '/') navigate('/');
  };

  const groups = groupConversations(conversations);

  return (
    <aside className={`global-sidebar${isCollapsed ? ' collapsed' : ''}`}>

      {/* ── Header: Logo + Collapse toggle ── */}
      <div className="sb-header">
        {!isCollapsed && (
          <div className="sb-brand" onClick={() => navigate('/')} role="button" tabIndex={0}>
            <div className="nav-logo" aria-hidden="true">✨</div>
            <span className="nav-title">Saathi</span>
          </div>
        )}
        <button
          className="sb-toggle"
          onClick={() => setIsCollapsed(p => !p)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <div className="sb-toggle-inner">
              <div className="nav-logo logo-icon" aria-hidden="true">✨</div>
              <PanelLeftOpen size={22} className="open-icon" />
            </div>
          ) : (
            <PanelLeftClose size={20} />
          )}
        </button>
      </div>

      {/* ── New Chat button ── */}
      <div className="sb-section">
        <button
          className="sb-new-chat"
          onClick={() => { handleNewChat(); navigate('/'); }}
          title="New Chat"
        >
          <Plus size={17} />
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* ── Conversation History (scrollable) ── */}
      <div className="sb-history">
        {isAnonymous ? (
          !isCollapsed && (
            <div className="sb-signin-prompt">
              <p>Sign in to save conversations 💜</p>
              <button onClick={() => navigate('/login')} className="sb-signin-btn">
                <LogIn size={14} /> Sign in
              </button>
            </div>
          )
        ) : (
          ['today', 'yesterday', 'last7Days', 'older'].map(key => {
            const group = groups[key];
            if (!group || group.length === 0) return null;
            return (
              <div key={key} className="sb-group">
                {!isCollapsed && (
                  <div className="sb-group-label">{GROUP_LABELS[key]}</div>
                )}
                {group.map(c => (
                  <div
                    key={c.conversationId}
                    className={`sb-conv-item${conversationId === c.conversationId && location.pathname === '/' ? ' active' : ''}`}
                    onClick={() => onConvClick(c.conversationId)}
                    title={isCollapsed ? (c.title || 'New conversation') : undefined}
                  >
                    {isCollapsed ? (
                      <MessageSquare size={16} className="sb-conv-icon" />
                    ) : editingId === c.conversationId ? (
                      <input
                        ref={inputRef}
                        className="sb-title-input"
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onBlur={() => saveEdit(c.conversationId)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(c.conversationId);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <div className="sb-conv-meta">
                          <span className="sb-conv-title">{c.title || 'New conversation'}</span>
                          <span className="sb-conv-time">{timeAgo(c.startedAt)}</span>
                        </div>
                        <div className="sb-conv-actions">
                          <button
                            className="sb-icon-btn"
                            title="Rename"
                            onClick={e => startEditing(e, c.conversationId, c.title)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="sb-icon-btn delete"
                            title="Delete"
                            onClick={e => handleDeleteConversation(e, c.conversationId)}
                          >
                            <Trash2 size={13} />
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

      {/* ── Footer Nav ── */}
      <div className="sb-footer">
        <button
          className={`sb-nav-btn${location.pathname === '/mood' ? ' active' : ''}`}
          onClick={() => navigate('/mood')}
          title="Mood"
        >
          <BarChart2 size={19} />
          {!isCollapsed && <span>Mood</span>}
        </button>
        <button
          className={`sb-nav-btn${location.pathname === '/journal' ? ' active' : ''}`}
          onClick={() => navigate('/journal')}
          title="Journal"
        >
          <Book size={19} />
          {!isCollapsed && <span>Journal</span>}
        </button>
        <button
          className={`sb-nav-btn${location.pathname === '/profile' ? ' active' : ''}`}
          onClick={() => navigate('/profile')}
          title="Profile"
        >
          <UserIcon size={19} />
          {!isCollapsed && <span>Profile</span>}
        </button>
      </div>

    </aside>
  );
}
