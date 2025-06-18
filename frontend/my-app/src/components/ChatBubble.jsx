import React, { useState, useRef, useEffect } from 'react';

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm here to help with any questions about CF Studio. Ask me about our features, pricing, troubleshooting, or anything else!",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Auto-detect the API URL based on current host
      const currentHost = window.location.hostname;
      const apiUrl = currentHost === 'localhost' 
  ? 'http://localhost:8000/api/chat-public'
  : 'https://contentfactory-4.onrender.com/api/chat-public';  // Use your actual backend!
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: data.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please contact our support team at support@contentfactory.ai for assistance.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-6 md:bottom-32 md:right-8 z-50">
        {/* Pulsing glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping opacity-20"></div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          {/* Green status indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-green-400 rounded-full border-2 border-white animate-pulse">
            <div className="absolute inset-1 bg-green-300 rounded-full"></div>
          </div>
          
          <svg 
            className="w-7 h-7 md:w-8 md:h-8 text-white group-hover:scale-110 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
          
          {/* Tooltip - only show on desktop */}
          <div className="hidden md:block absolute bottom-full right-0 mb-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Need help? Chat with us!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 md:bottom-32 md:right-8 z-50">
      <div className="w-[calc(100vw-3rem)] max-w-96 h-[500px] max-h-[80vh] md:w-96 md:h-[500px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col overflow-hidden transform animate-in slide-in-from-bottom-5 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              {/* Green status dot */}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">CF Studio Support</h3>
              <p className="text-purple-100 text-xs flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                Online now
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-purple-200 transition-colors hover:rotate-90 transform duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-purple-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 max-w-xs px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-2 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none disabled:hover:shadow-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;