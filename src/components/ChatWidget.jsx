import { useState, useRef, useEffect } from 'react';
import { useChatStore, useAuthStore } from '../store';
import { MessageSquare, X, Send, Bot, Ticket, ChevronDown } from 'lucide-react';


export default function ChatWidget() {
  const { user } = useAuthStore();
  const {
    isChatOpen, toggleChat, closeChat,
    aiMessages, isTyping, sessionId,
    detectedLanguage, manualLanguage,
    sendUserMessage, initAiChat,
    raiseTicketFromChat
  } = useChatStore();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages or typing
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isTyping, isChatOpen]);

  // Initialize chat session when opened
  useEffect(() => {
    if (isChatOpen && user && !sessionId) {
      initAiChat();
    }
  }, [isChatOpen, user, sessionId, initAiChat]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  // Don't show for admin
  if (user?.role === 'admin') return null;

  // Floating button when closed
  if (!isChatOpen) {
    return (
      <button
        className="chat-floating-btn"
        onClick={toggleChat}
        aria-label="Open Yaara AI Chat"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  const handleSend = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isTyping) return;
    sendUserMessage(text);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (chip) => {
    // Strip emoji prefix for cleaner message
    const cleanText = chip.replace(/^[^\w\s]*\s*/, '').trim();
    if (cleanText.toLowerCase().includes('raise') && cleanText.toLowerCase().includes('ticket')) {
      raiseTicketFromChat();
    } else {
      sendUserMessage(chip);
    }
  };

  const activeLang = manualLanguage || detectedLanguage || 'en';

  return (
    <div className="chat-widget-container">
      {/* ===== HEADER ===== */}
      <div className="chat-widget-header">
        <div className="chat-header-info">
          <Bot size={22} className="text-accent-teal" />
          <div>
            <span className="chat-title">Yaara</span>
            <span className="chat-online-dot" />
          </div>
        </div>

        <div className="chat-header-actions">

          {/* Raise Ticket */}
          <button
            className="chat-ticket-btn"
            onClick={raiseTicketFromChat}
            title="Raise Support Ticket"
          >
            <Ticket size={16} />
          </button>

          {/* Close */}
          <button className="btn-icon" onClick={closeChat}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div className="chat-messages">
        {aiMessages.length === 0 && !isTyping ? (
          <div className="chat-welcome">
            <Bot size={40} className="text-accent-teal" style={{ marginBottom: 12 }} />
            <h3>Welcome to Yaara! ✨</h3>
            <p style={{ marginBottom: 16 }}>
              {activeLang === 'hi' ? 'नमस्ते! मैं आपका स्थानीय यात्रा मित्र हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?' :
               activeLang === 'mr' ? 'नमस्कार! मी तुमचा स्थानिक प्रवास मित्र आहे. आज मी तुमची कशी मदत करू शकतो?' :
               activeLang === 'hinglish' ? 'Namaste! Main aapka local travel buddy hoon. Aaj kaise help karoon?' :
               'Hi there! I am your warm local travel buddy for India. How can I help you today?'}
            </p>
            <div className="chat-quick-replies" style={{ justifyContent: 'center' }}>
              {['🚗 Find cabs', '🎒 Book package', '💰 Check wallet', '🎫 Raise Ticket'].map((chip, ci) => (
                <button
                  key={ci}
                  className="chat-quick-chip"
                  onClick={() => handleQuickReply(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          aiMessages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id || idx}>
                <div className={`chat-message ${isUser ? 'message-sent' : 'message-received'}`}>
                  <div className="message-bubble">
                    {msg.content}
                  </div>
                  <div className="message-meta">
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Quick Reply Chips — after AI messages only */}
                {!isUser && msg.quickReplies?.length > 0 && idx === aiMessages.length - 1 && (
                  <div className="chat-quick-replies">
                    {msg.quickReplies.map((chip, ci) => (
                      <button
                        key={ci}
                        className="chat-quick-chip"
                        onClick={() => handleQuickReply(chip)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="chat-message message-received">
            <div className="message-bubble">
              <div className="chat-typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ===== INPUT ===== */}
      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          ref={inputRef}
          className="chat-input"
          type="text"
          placeholder={
            activeLang === 'hi' ? 'अपना सवाल लिखें...' :
            activeLang === 'mr' ? 'तुमचा प्रश्न लिहा...' :
            activeLang === 'hinglish' ? 'Apna sawal likhein...' :
            'Type your question...'
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isTyping}
          autoComplete="off"
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!inputText.trim() || isTyping}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
