import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Upload, Loader2, AlertCircle, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LabReportAnalyzer = () => {
  const [reportText, setReportText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };
  
  const extractFromFile = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setExtracting(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/lab-report/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setReportText(response.data.extracted_text);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to extract text from file');
    } finally {
      setExtracting(false);
    }
  };
  
  const analyzeReport = async () => {
    if (!reportText.trim()) {
      setError('Please enter or upload lab report data');
      return;
    }
    
    setLoading(true);
    setError('');
    setAnalysis('');
    
    try {
      const response = await axios.post(`${API}/lab-report/analyze`, {
        text: reportText
      });
      
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze lab report');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background - Blue/Teal Scientific Theme */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-cyan-100"></div>
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-teal-300 to-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-300 to-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-16 fade-in">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 w-20 h-20 rounded-3xl shadow-xl shadow-cyan-500/40 mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins, sans-serif'}}>
            Lab Report Analyzer
          </h1>
          <p className="text-gray-600 text-xl">Upload your lab reports or paste the text to get AI-powered insights</p>
        </div>
        
        <div className="space-y-8">
          {/* Input Section */}
          <div className="max-w-6xl mx-auto">
            <Card className="p-8 bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-cyan-100/30 rounded-3xl mb-6">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-cyan-50/50 p-1 rounded-2xl">
                  <TabsTrigger value="text" data-testid="text-input-tab" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Text Input</TabsTrigger>
                  <TabsTrigger value="upload" data-testid="file-upload-tab" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">File Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text">
                  <Textarea
                    data-testid="report-text-input"
                    placeholder="Paste your lab report here...\n\nExample:\nHemoglobin: 14.5 g/dL\nWBC Count: 7500 cells/mcL\nPlatelet Count: 250,000 cells/mcL"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    className="min-h-[300px] resize-none rounded-2xl bg-white/60 backdrop-blur-sm border-cyan-200 focus:border-cyan-400"
                  />
                </TabsContent>
                
                <TabsContent value="upload">
                  <div className="space-y-5">
                    <div className="border-2 border-dashed border-cyan-300/60 rounded-2xl p-10 text-center hover:border-cyan-500 hover:bg-cyan-50/50 file-upload-area bg-white/60 backdrop-blur-md transition-all duration-300">
                      <div className="bg-cyan-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileUp className="w-10 h-10 text-cyan-600" />
                      </div>
                      <input
                        data-testid="file-input"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Button type="button" variant="outline" className="mb-3 rounded-2xl border-cyan-300" onClick={() => document.getElementById('file-upload').click()}>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                        <p className="text-sm text-gray-500 font-medium">PDF, PNG, JPG (Max 10MB)</p>
                      </label>
                    </div>
                    
                    {file && (
                      <div className="flex items-center justify-between p-4 bg-cyan-50/60 backdrop-blur-md rounded-2xl border border-cyan-200/40 shadow-md">
                        <div className="flex items-center space-x-3">
                          <div className="bg-cyan-100 p-2 rounded-xl">
                            <FileText className="w-5 h-5 text-cyan-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{file.name}</span>
                        </div>
                        <Button
                          data-testid="extract-text-btn"
                          onClick={extractFromFile}
                          disabled={extracting}
                          size="sm"
                          className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-2xl shadow-lg shadow-cyan-500/30"
                        >
                          {extracting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            'Extract Text'
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {reportText && (
                      <Textarea
                        data-testid="extracted-text"
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        className="min-h-[200px] rounded-2xl bg-white/60 backdrop-blur-sm border-cyan-200"
                        placeholder="Extracted text will appear here..."
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
            
            <Button
              data-testid="analyze-report-btn"
              onClick={analyzeReport}
              disabled={loading || !reportText.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white py-7 text-lg rounded-2xl shadow-xl shadow-cyan-500/40 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-6 h-6 mr-2" />
                  Analyze Report
                </>
              )}
            </Button>
          </div>
          
          {/* Results Section */}
          <div className="max-w-7xl mx-auto">
            {error && (
              <Alert variant="destructive" className="mb-8 rounded-2xl bg-red-50/60 backdrop-blur-md border-red-200/40 shadow-lg">
                <AlertCircle className="w-5 h-5" />
                <AlertDescription className="text-lg">{error}</AlertDescription>
              </Alert>
            )}
            
            {analysis && (
              <Card data-testid="analysis-results" className="p-14 bg-white/70 backdrop-blur-xl border-2 border-white/40 shadow-2xl shadow-cyan-100/30 rounded-3xl fade-in">
                <h3 className="text-4xl font-bold text-gray-900 mb-10 flex items-center" style={{fontFamily: 'Poppins, sans-serif'}}>
                  <div className="bg-cyan-100 p-4 rounded-2xl mr-4">
                    <FileText className="w-10 h-10 text-cyan-600" />
                  </div>
                  Analysis Results
                </h3>
                <div className="prose prose-xl max-w-none">
                  <div className="text-gray-800 whitespace-pre-wrap leading-loose bg-white/60 backdrop-blur-sm p-12 rounded-3xl shadow-md text-xl">
                    {analysis}
                  </div>
                </div>
                
                <div className="mt-10 p-10 bg-amber-50/70 backdrop-blur-md border-2 border-amber-200/40 rounded-3xl shadow-lg">
                  <p className="text-amber-900 leading-relaxed text-lg">
                    <strong className="text-2xl block mb-3" style={{fontFamily: 'Poppins, sans-serif'}}>Disclaimer:</strong> 
                    This analysis is for informational purposes only. Please consult your healthcare provider for proper medical interpretation.
                  </p>
                </div>
              </Card>
            )}
            
            {!analysis && !error && (
              <Card className="p-20 bg-white/70 backdrop-blur-xl border-2 border-white/40 shadow-2xl shadow-cyan-100/30 rounded-3xl text-center">
                <div className="bg-cyan-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8">
                  <FileText className="w-16 h-16 text-cyan-400" />
                </div>
                <p className="text-gray-500 text-2xl font-medium">Your analysis results will appear here</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabReportAnalyzer;