import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, MessageSquare, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const History = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get(`${API}/chat/sessions`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      setSessions(response.data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadConversation = (sessionId) => {
    localStorage.setItem('chatSessionId', sessionId);
    navigate('/chat');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 fade-in">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 w-20 h-20 rounded-3xl shadow-xl shadow-cyan-500/40 mb-6">
          <Clock className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Conversation History
        </h1>
        <p className="text-gray-600 text-xl">View your recent chat conversations</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-10 h-10 text-cyan-600 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-16 bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-cyan-100/30 rounded-3xl text-center">
          <div className="bg-cyan-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-12 h-12 text-cyan-400" />
          </div>
          <p className="text-gray-500 text-lg mb-6">No conversations yet</p>
          <Button
            onClick={() => navigate('/chat')}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-6 rounded-2xl shadow-xl shadow-cyan-500/40 font-semibold"
          >
            Start Chatting
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {sessions.map((session, idx) => (
            <Card
              key={session.session_id}
              className="p-8 bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg shadow-cyan-100/30 rounded-3xl hover:shadow-xl hover:shadow-cyan-200/40 hover:-translate-y-1 transition-all duration-300 slide-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-5 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center flex-shrink-0 shadow-md">
                    <MessageSquare className="w-7 h-7 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {session.preview || 'Medical Conversation'}
                    </h3>
                    <div className="flex items-center space-x-5 text-sm text-gray-500">
                      <div className="flex items-center space-x-2 bg-cyan-50/50 px-3 py-1.5 rounded-full">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{formatDate(session.updated_at || session.created_at)}</span>
                      </div>
                      {session.message_count > 0 && (
                        <span className="text-cyan-600 font-semibold bg-cyan-50 px-4 py-1.5 rounded-full">
                          {session.message_count} message{session.message_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50/50 font-semibold rounded-2xl px-6 py-6"
                  onClick={() => loadConversation(session.session_id)}
                >
                  Continue <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
