import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare, Clock, BarChart2, Book,
  User as UserIcon, X, Trash2, Edit2
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
    handleUpdateConversationTitle,
  } = useChatContext();

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

  const groups = groupConversations(conversations);

  return (
    <>
      {/* ── Bottom Nav Bar ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={`mnav-btn${location.pathname === '/' && !showHistory ? ' active' : ''}`}
          onClick={() => handleNavClick('/')}
        >
          <MessageSquare size={22} />
          <span>Chat</span>
        </button>

        {!isAnonymous && (
          <button
            className={`mnav-btn${showHistory ? ' active' : ''}`}
            onClick={() => setShowHistory(true)}
          >
            <Clock size={22} />
            <span>History</span>
          </button>
        )}

        <button
          className={`mnav-btn${location.pathname === '/mood' ? ' active' : ''}`}
          onClick={() => handleNavClick('/mood')}
        >
          <BarChart2 size={22} />
          <span>Mood</span>
        </button>

        <button
          className={`mnav-btn${location.pathname === '/journal' ? ' active' : ''}`}
          onClick={() => handleNavClick('/journal')}
        >
          <Book size={22} />
          <span>Journal</span>
        </button>

        <button
          className={`mnav-btn${location.pathname === '/profile' ? ' active' : ''}`}
          onClick={() => handleNavClick('/profile')}
        >
          <UserIcon size={22} />
          <span>Profile</span>
        </button>
      </nav>

      {/* ── Full-screen History Drawer ── */}
      {!isAnonymous && (
        <div className={`mobile-history-drawer${showHistory ? ' open' : ''}`} role="dialog" aria-modal="true">
          <div className="mhd-header">
            <h2 className="mhd-title">History</h2>
            <button className="mhd-close" onClick={() => setShowHistory(false)} aria-label="Close history">
              <X size={22} />
            </button>
          </div>

          <div className="mhd-scroll">
            {['today', 'yesterday', 'last7Days', 'older'].map(key => {
              const group = groups[key];
              if (!group || group.length === 0) return null;
              return (
                <div key={key} className="sb-group">
                  <div className="sb-group-label">{GROUP_LABELS[key]}</div>
                  {group.map(c => (
                    <div
                      key={c.conversationId}
                      className={`sb-conv-item${conversationId === c.conversationId && location.pathname === '/' ? ' active' : ''}`}
                      onClick={() => onConvClick(c.conversationId)}
                    >
                      {editingId === c.conversationId ? (
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
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="sb-icon-btn delete"
                              title="Delete"
                              onClick={e => handleDeleteConversation(e, c.conversationId)}
                            >
                              <Trash2 size={15} />
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
