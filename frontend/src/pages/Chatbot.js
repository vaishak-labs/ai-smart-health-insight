import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Languages, Loader2, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

console.log("ENV BACKEND:", process.env.REACT_APP_BACKEND_URL);


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');
  const [sessionId, setSessionId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' }
  ];
  
  // Initialize session and load history
  useEffect(() => {
    initializeSession();
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const initializeSession = () => {
    // Check if we have a session ID in localStorage
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadChatHistory(storedSessionId);
    } else {
      // Create new session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
  };
  
  const loadChatHistory = async (sid) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API}/chat/history/${sid}`);
      if (response.data && response.data.messages && response.data.messages.length > 0) {
        setMessages(response.data.messages);
        toast.success(`Loaded conversation with ${response.data.messages.length} messages`);
      } else {
        // No messages found, but session exists
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoadingHistory(false);
    }
  };
  
  const startNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
    setMessages([]);
    toast.success('New chat started');
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          language: language,
          session_id: sessionId
        })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.content) {
                assistantMessage += data.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessage;
                  return newMessages;
                });
              }
              if (data.done && data.session_id) {
                setSessionId(data.session_id);
                localStorage.setItem('chatSessionId', data.session_id);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  if (loadingHistory) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
        <span className="ml-3 text-gray-600">Loading chat history...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 fade-in">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 w-16 h-16 rounded-3xl shadow-xl shadow-cyan-500/40 mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3" style={{fontFamily: 'Poppins, sans-serif'}}>
            Medical Chat Assistant
          </h1>
          <p className="text-gray-600 text-xl">Ask medical questions and get instant answers</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={startNewChat}
            variant="outline"
            className="flex items-center space-x-2 rounded-2xl border-cyan-300 hover:bg-cyan-50/50"
            data-testid="new-chat-btn"
          >
            <Plus className="w-5 h-5" />
            <span className="font-semibold">New Chat</span>
          </Button>
          
          <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-md">
            <Languages className="w-5 h-5 text-cyan-600" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger data-testid="language-selector" className="w-48 border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Card className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-cyan-100/30 rounded-3xl h-[650px] flex flex-col">
        {/* Messages */}
        <div data-testid="chat-messages" className="flex-1 overflow-y-auto p-8 space-y-5">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-cyan-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Bot className="w-12 h-12 text-cyan-600" />
              </div>
              <p className="text-gray-600 text-lg font-medium mb-2">Start a conversation by asking a medical question</p>
              <p className="text-sm text-gray-500 bg-cyan-50/50 px-6 py-3 rounded-2xl inline-block mt-4">Try: "What are the symptoms of diabetes?"</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              data-testid={`message-${idx}`}
              className={`flex items-start space-x-4 ${msg.role === 'user' ? 'justify-end' : ''} slide-in`}
              style={{animationDelay: `${idx * 0.05}s`}}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-6 h-6 text-cyan-600" />
                </div>
              )}
              
              <div className={`max-w-[70%] rounded-3xl px-6 py-4 shadow-md ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white' 
                  : 'bg-white/80 backdrop-blur-md border border-white/40'
              }`}>
                <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              
              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </div>
          ))}
          
          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6 text-cyan-600" />
              </div>
              <div className="bg-white/80 backdrop-blur-md border border-white/40 rounded-3xl px-6 py-4 shadow-md">
                <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="border-t border-white/40 p-6 bg-white/40 backdrop-blur-md rounded-b-3xl">
          <div className="flex items-center space-x-4">
            <Input
              data-testid="chat-input"
              placeholder="Type your medical question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1 rounded-2xl bg-white/60 backdrop-blur-sm border-cyan-200 focus:border-cyan-400 py-6 text-base"
            />
            <Button
              data-testid="send-message-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-cyan-500/30"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </Card>
      
      <div className="mt-8 p-6 bg-amber-50/60 backdrop-blur-md border border-amber-200/40 rounded-3xl shadow-lg">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong className="text-base">Disclaimer:</strong> This chatbot provides general medical information only. Always consult qualified healthcare professionals for diagnosis and treatment.
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
