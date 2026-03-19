import React, { useState } from 'react';
import axios from 'axios';
import { 
  Pill, Plus, X, AlertCircle, CheckCircle, Loader2, 
  AlertTriangle, ShieldCheck, Info, Sparkles 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MedicineChecker = () => {
  const [medicines, setMedicines] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const addMedicine = () => {
    setMedicines([...medicines, '']);
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, value) => {
    const updated = [...medicines];
    updated[index] = value;
    setMedicines(updated);
  };

  const checkInteractions = async () => {
    const validMedicines = medicines.filter((m) => m.trim() !== '');

    if (validMedicines.length === 0) {
      setError('Please enter at least one medicine');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await axios.post(`${API}/medicine/check`, {
        medicines: validMedicines,
      });

      const data = response.data;

      // --- FIX: ALWAYS compute missing values ---
      data.total_interactions = data.interactions?.length || 0;

      if (!data.overall_safety) {
        const interactions = data.interactions || [];

        if (interactions.length === 0) {
          data.overall_safety = 'low_risk';
        } else {
          const high = interactions.some((i) => i.severity === 'high');
          const moderate = interactions.some((i) => i.severity === 'moderate');

          if (high) data.overall_safety = 'high_risk';
          else if (moderate) data.overall_safety = 'moderate_risk';
          else data.overall_safety = 'low_risk';
        }
      }

      setResults(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to check medicine interactions');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyConfig = (safety) => {
    switch (safety) {
      case 'high_risk':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          label: 'High Risk Detected',
          description: 'Significant interactions found - consult your doctor immediately',
        };

      case 'moderate_risk':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          icon: <AlertCircle className="w-8 h-8 text-amber-500" />,
          label: 'Moderate Risk',
          description: 'Some interactions detected - discuss with your healthcare provider',
        };

      case 'low_risk':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
          label: 'No Significant Interactions',
          description: 'Your medicines appear safe to take together',
        };

      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: <Info className="w-8 h-8 text-blue-500" />,
          label: 'Info Not Available',
          description: 'Unable to determine risk level',
        };
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-300">🔴 High Risk</Badge>;
      case 'moderate':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">🟡 Moderate Risk</Badge>;
      default:
        return <Badge className="bg-green-100 text-green-700 border-green-300">🟢 Low Risk</Badge>;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-cyan-50 to-purple-100"></div>
        <div className="absolute inset-0 opacity-50">
          <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-purple-300 to-cyan-400 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-cyan-300 to-purple-400 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-br from-purple-200 to-cyan-300 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 mx-auto px-4 py-16">

        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 w-20 h-20 rounded-3xl shadow-cyan-500/40 mb-6">
            <Pill className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Medicine Interaction Checker
          </h1>
          <p className="text-gray-600 text-xl">Check if your medications are safe together</p>
        </div>

        {/* INPUT CARD */}
        <Card className="p-10 mb-8 bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 flex items-center">
            <div className="bg-cyan-100 p-3 rounded-2xl mr-3">
              <Pill className="w-6 h-6 text-cyan-600" />
            </div>
            Enter Your Medicines
          </h2>

          <div className="space-y-4">
            {medicines.map((medicine, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 bg-white/80 p-4 rounded-2xl border border-white/40"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl text-white font-bold shadow-lg">
                  {index + 1}
                </div>

                <Input
                  value={medicine}
                  onChange={(e) => updateMedicine(index, e.target.value)}
                  placeholder="e.g., Aspirin, Metformin, Lisinopril"
                  className="flex-1 border-cyan-200 focus:border-cyan-500 rounded-2xl"
                />

                {medicines.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMedicine(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-2xl"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addMedicine}
              className="w-full border-dashed border-2 border-cyan-400 text-cyan-700 hover:bg-cyan-50 py-7 rounded-2xl font-semibold"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Medicine
            </Button>

            <Button
              onClick={checkInteractions}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-8 text-lg rounded-2xl shadow-xl font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Analyzing Interactions...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Check Interactions with AI
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* ERROR */}
        {error && (
          <Alert variant="destructive" className="max-w-6xl mx-auto mb-8 rounded-2xl bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* RESULTS */}
        {results && (
          <div className="space-y-12 max-w-7xl mx-auto fade-in">

            {/* OVERALL SAFETY */}
            {(() => {
              const config = getSafetyConfig(results.overall_safety);
              return (
                <Card className={`p-14 ${config.bg} border-2 ${config.border} backdrop-blur-xl rounded-3xl shadow-2xl`}>
                  <div className="flex items-start space-x-6">
                    <div className="w-24 h-24 flex items-center justify-center">{config.icon}</div>

                    <div>
                      <h2 className={`text-4xl font-bold ${config.text} mb-4`}>{config.label}</h2>
                      <p className={`${config.text} text-2xl mb-6`}>{config.description}</p>

                      <div className="flex items-center space-x-8 text-lg">
                        <div className="flex items-center bg-white/40 px-6 py-3 rounded-2xl">
                          <Pill className="w-6 h-6 mr-2" />
                          <span className="font-semibold">{results.medicines?.length || 0} Medicines</span>
                        </div>

                        <div className="flex items-center bg-white/40 px-6 py-3 rounded-2xl">
                          <AlertCircle className="w-6 h-6 mr-2" />
                          <span className="font-semibold">{results.total_interactions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })()}

            {/* INTERACTIONS */}
            {results.interactions?.length > 0 && (
              <Card className="p-14 bg-white/70 backdrop-blur-xl border-2 border-white/40 rounded-3xl shadow-2xl">
                <h2 className="text-4xl font-bold mb-10 flex items-center">
                  <div className="bg-orange-100 p-4 rounded-2xl mr-4">
                    <AlertTriangle className="w-10 h-10 text-orange-600" />
                  </div>
                  Detected Interactions
                </h2>

                <div className="space-y-6">
                  {results.interactions.map((interaction, idx) => (
                    <div
                      key={idx}
                      className="p-10 bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl border-l-8 border-red-500 shadow-xl"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div className="text-2xl font-bold">
                          {interaction.drug1} + {interaction.drug2}
                        </div>

                        <div className="scale-125">
                          {getSeverityBadge(interaction.severity)}
                        </div>
                      </div>

                      <p className="text-xl text-gray-800">{interaction.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AI ANALYSIS */}
            {results.ai_analysis && (
              <Card className="p-14 bg-gradient-to-br from-purple-50 to-indigo-50 backdrop-blur-xl border-2 border-purple-200 rounded-3xl shadow-2xl">
                <div className="flex items-center mb-10">
                  <div className="bg-purple-100 p-4 rounded-2xl mr-4">
                    <Sparkles className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900">AI-Powered Analysis & Recommendations</h2>
                </div>

                <div className="bg-white/80 p-12 rounded-3xl shadow-xl border border-purple-100">
                  <p className="text-xl whitespace-pre-line text-gray-800">
                    {results.ai_analysis}
                  </p>
                </div>
              </Card>
            )}

            {/* INFO */}
            <Card className="p-12 bg-blue-50 backdrop-blur-md border-2 border-blue-200 rounded-3xl shadow-xl">
              <div className="flex items-start space-x-6">
                <div className="bg-blue-100 p-4 rounded-2xl">
                  <Info className="w-10 h-10 text-blue-600" />
                </div>

                <div className="text-blue-900">
                  <p className="font-bold text-3xl mb-4">Important Information:</p>

                  <ul className="list-disc ml-4 space-y-3 text-lg">
                    <li>This tool provides general info & is not a substitute for medical advice</li>
                    <li>Always consult your doctor before changing medications</li>
                    <li>Inform healthcare providers about all medicines and supplements</li>
                    <li>Sources: FDA OpenFDA, RxNorm, Clinical DB, AI Analysis</li>
                  </ul>
                </div>
              </div>
            </Card>

          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineChecker;
