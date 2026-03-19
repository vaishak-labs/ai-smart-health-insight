import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import MedicineChecker from './pages/MedicineChecker';
import LabReportAnalyzer from './pages/LabReportAnalyzer';
import Chatbot from './pages/Chatbot';
import History from './pages/History';
import { Activity, MessageSquare, FileText, Pill, Clock, LogIn, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/auth/AuthModal';
import { Button } from './components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './components/ui/dropdown-menu';

const Navigation = () => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState('signin');
  
  const navItems = [
    { path: '/', icon: Activity, label: 'Home' },
    { path: '/medicine', icon: Pill, label: 'Medicine Checker' },
    { path: '/lab-report', icon: FileText, label: 'Lab Reports' },
    { path: '/chat', icon: MessageSquare, label: 'Chat Assistant' },
    { path: '/history', icon: Clock, label: 'History' }
  ];
  
  const handleAuthClick = (view) => {
    setAuthView(view);
    setShowAuthModal(true);
  };
  
  return (
    <>
      <nav className="bg-white/60 backdrop-blur-2xl border-b border-white/40 shadow-sm shadow-cyan-100/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-2 rounded-2xl shadow-lg shadow-cyan-500/30 icon-pulse">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900" style={{fontFamily: 'Poppins, sans-serif'}}>Smart Health Insight</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30' 
                          : 'text-gray-600 hover:bg-white/50 hover:text-cyan-600 hover:backdrop-blur-sm'
                      }`}
                    >
                      <Icon className="w-4 h-4 icon-hover-pulse" />
                      <span className="text-sm font-medium hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Auth Section */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-2"
                      data-testid="user-menu"
                    >
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
                      <User className="w-4 h-4 mr-2" />
                      {user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      data-testid="logout-btn"
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => handleAuthClick('signin')}
                    className="text-cyan-600 hover:text-cyan-700 hover:bg-white/50 rounded-2xl"
                    data-testid="signin-btn"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => handleAuthClick('signup')}
                    className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/30 rounded-2xl"
                    data-testid="signup-btn"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultView={authView}
      />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App min-h-screen relative overflow-x-hidden" style={{background: 'linear-gradient(135deg, #f0fdff 0%, #e0f7fa 50%, #f8fcff 100%)'}}>
        {/* Morphing Blobs Background */}
        <div className="morph-blob morph-blob-1"></div>
        <div className="morph-blob morph-blob-2"></div>
        
        <BrowserRouter>
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/medicine" element={<MedicineChecker />} />
            <Route path="/lab-report" element={<LabReportAnalyzer />} />
            <Route path="/chat" element={<Chatbot />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;