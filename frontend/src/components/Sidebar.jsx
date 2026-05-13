import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, BarChart2, Book, User as UserIcon, Edit2, Trash2, Plus } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    conversations, 
    conversationId, 
    handleNewChat, 
    handleConversationClick, 
    handleDeleteConversation 
  } = useChatContext();

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

  const handleNavClick = (path) => {
    navigate(path);
  };

  const onConvClick = (id) => {
    handleConversationClick(id);
    if (location.pathname !== '/') navigate('/');
  };

  return (
    <aside className="global-sidebar">
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
                  <div className="conversation-title">{c.title || 'New conversation'}</div>
                  <div className="conversation-actions">
                    <button className="conv-action-btn" title="Edit title" onClick={(e) => { e.stopPropagation(); /* TODO */ }}>
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
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <nav className="sidebar-nav">
          <button className={`sidebar-nav-btn ${location.pathname === '/mood' ? 'active' : ''}`} onClick={() => handleNavClick('/mood')}>
            <BarChart2 size={20} />
            <span>Mood</span>
          </button>
          <button className={`sidebar-nav-btn ${location.pathname === '/journal' ? 'active' : ''}`} onClick={() => handleNavClick('/journal')}>
            <Book size={20} />
            <span>Journal</span>
          </button>
          <button className={`sidebar-nav-btn ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => handleNavClick('/profile')}>
            <UserIcon size={20} />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
