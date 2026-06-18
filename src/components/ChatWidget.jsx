import { useState, useRef, useEffect } from 'react';
import { useChatStore, useAuthStore } from '../store';
import { MessageSquare, X, Send, Bot, User, Minimize2 } from 'lucide-react';

export default function ChatWidget() {
  const { 
    isChatOpen, toggleChat, closeChat, activeConversationId, 
    conversations, messages, sendMessage, startSupportChat,
    fetchConversations, setupRealtimeSubscription, cleanupRealtimeSubscription
  } = useChatStore();
  const { user } = useAuthStore();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize DB conversations and realtime sub
  useEffect(() => {
    if (user) {
      fetchConversations();
      setupRealtimeSubscription();
      return () => cleanupRealtimeSubscription();
    }
  }, [user, fetchConversations, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // If chat is not open, show just the floating button
  if (!isChatOpen) {
    return (
      <button 
        className="chat-floating-btn" 
        onClick={() => {
          if (!activeConversationId) startSupportChat();
          toggleChat();
        }}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const activeMessages = messages.filter(m => m.conversationId === activeConversationId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;
    sendMessage(activeConv.id, inputText, user?.id || 'guest');
    setInputText('');
  };

  const getChatTitle = () => {
    if (!activeConv) return 'Support Chat';
    if (activeConv.type === 'support') return 'YatraGo Assistant';
    return activeConv.title || 'Chat';
  };

  const isBot = activeConv?.type === 'support';

  return (
    <div className="chat-widget-container">
      {/* Header */}
      <div className="chat-widget-header">
        <div className="chat-header-info">
          {isBot ? <Bot size={20} className="text-accent-teal" /> : <User size={20} className="text-accent-blue" />}
          <span className="chat-title">{getChatTitle()}</span>
        </div>
        <div className="chat-header-actions">
          <button className="btn-icon" onClick={closeChat}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {activeMessages.length === 0 ? (
          <div className="chat-empty">No messages yet. Say hi!</div>
        ) : (
          activeMessages.map(msg => {
            const isMe = msg.senderId === (user?.id || 'guest');
            return (
              <div key={msg.id} className={`chat-message ${isMe ? 'message-sent' : 'message-received'}`}>
                <div className="message-bubble">
                  {msg.content}
                </div>
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Type your message..." 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
