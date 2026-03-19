import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, FileText, MessageSquare, Shield, Languages, Clock, ChevronRight, Hospital } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const Home = () => {
  const features = [
    {
      icon: Hospital,
      title: 'Medicine Interaction Checker',
      description: 'Check potential interactions between your medications using FDA database',
      link: '/medicine',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50'
    },
    {
      icon: FileText,
      title: 'Lab Report Analyzer',
      description: 'Upload and analyze your lab reports with AI-powered insights',
      link: '/lab-report',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      icon: MessageSquare,
      title: 'Medical Chat Assistant',
      description: 'Ask medical questions and get instant answers in multiple languages',
      link: '/chat',
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    }
  ];
  
  const benefits = [
    { icon: Shield, text: 'FDA Verified Data' },
    { icon: Languages, text: 'Multi-language Support' },
    { icon: Clock, text: 'Instant Results' }
  ];
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-cyan-100"></div>
        <div className="absolute inset-0 opacity-60">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 fade-in">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight" style={{fontFamily: 'Poppins, sans-serif'}}>
            Your Personal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600"> Medical Assistant</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Check medicine interactions, analyze lab reports, and get instant medical guidance with AI-powered insights in your preferred language.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              const animations = ['icon-float', 'icon-bounce', 'icon-glow'];
              return (
                <div key={idx} className="flex items-center space-x-3 bg-white/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/40 shadow-lg shadow-cyan-100/20">
                  <div className={`bg-cyan-100 p-2 rounded-full ${animations[idx]}`}>
                    <Icon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <span className="text-base font-medium text-gray-800">{benefit.text}</span>
                </div>
              );
            })}
          </div>
          
          <Link to="/chat" data-testid="get-started-btn">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-10 py-7 text-lg rounded-full shadow-xl shadow-cyan-500/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              Get Started
              <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} data-testid={`feature-card-${idx}`} className="p-8 bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg shadow-cyan-100/30 rounded-3xl hover:shadow-xl hover:shadow-cyan-200/40 hover:-translate-y-2 transition-all duration-300 slide-in" style={{animationDelay: `${idx * 0.1}s`}}>
                <div className={`${feature.bg} w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-md icon-hover-bounce`}>
                  <Icon className={`w-10 h-10 ${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <Link to={feature.link}>
                  <Button variant="ghost" className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50/50 p-0 font-semibold rounded-xl transition-all duration-200">
                    Try it now <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
        
        {/* Disclaimer */}
        <div className="mt-20 p-8 bg-amber-50/60 backdrop-blur-md border border-amber-200/40 rounded-3xl shadow-lg">
          <p className="text-sm text-amber-900 text-center leading-relaxed">
            <strong className="text-base">Medical Disclaimer:</strong> This tool provides informational content only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider for medical guidance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;