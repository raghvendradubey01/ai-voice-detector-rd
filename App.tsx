
import React, { useState, useCallback, useRef } from 'react';
import { Language, ScanRecord, AnalysisResult } from './types';
import { analyzeVoiceSample } from './services/geminiService';
import LanguageSelector from './components/LanguageSelector';
import Visualizer from './components/Visualizer';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
    }
  };

  const runAnalysis = async () => {
    if (!currentFile) return;

    setIsAnalyzing(true);
    const newRecordId = crypto.randomUUID();
    const newRecord: ScanRecord = {
      id: newRecordId,
      timestamp: Date.now(),
      fileName: currentFile.name,
      language: selectedLanguage,
      status: 'pending',
      result: null
    };

    setHistory(prev => [newRecord, ...prev]);

    try {
      const base64 = await convertToBase64(currentFile);
      const result = await analyzeVoiceSample(base64, selectedLanguage, currentFile.type);
      
      setHistory(prev => prev.map(rec => 
        rec.id === newRecordId 
          ? { ...rec, status: 'completed', result } 
          : rec
      ));
    } catch (error) {
      console.error("Analysis failed:", error);
      setHistory(prev => prev.map(rec => 
        rec.id === newRecordId 
          ? { ...rec, status: 'error' } 
          : rec
      ));
    } finally {
      setIsAnalyzing(false);
      setCurrentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">
            Voice Detecting AI
          </h1>
          <p className="text-slate-400 mt-1">DeepVoice Detection & Synthesis Classifier</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 px-4 rounded-full border border-slate-800">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">System Operational</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Detection Panel */}
        <section className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-32 h-32 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z"/>
              </svg>
            </div>

            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
              Audio Classification
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Target Language</label>
                <LanguageSelector selected={selectedLanguage} onSelect={setSelectedLanguage} />
              </div>

              <div 
                className={`border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
                  currentFile ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/20'
                }`}
              >
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  id="audio-upload"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
                
                {currentFile ? (
                  <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <p className="font-medium text-slate-200">{currentFile.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{(currentFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis</p>
                    <button 
                      onClick={() => setCurrentFile(null)}
                      className="text-xs text-red-400 mt-4 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <label htmlFor="audio-upload" className="cursor-pointer group text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-700 transition-colors">
                      <svg className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="font-medium text-slate-300">Upload voice sample</p>
                    <p className="text-sm text-slate-500 mt-1">MP3, WAV up to 10MB</p>
                  </label>
                )}
              </div>

              {currentFile && (
                <button 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-4 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-slate-900" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Extracting Features...
                    </span>
                  ) : 'Initialize Analysis Pipeline'}
                </button>
              )}
            </div>

            {isAnalyzing && (
              <div className="mt-8 pt-8 border-t border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-mono text-cyan-400">ANALYZING SIGNAL PATH...</span>
                  <span className="text-xs text-slate-500">Processing Engine: Gemini 3.0</span>
                </div>
                <Visualizer isAnalyzing={isAnalyzing} />
              </div>
            )}
          </div>
        </section>

        {/* History / Results */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl h-full flex flex-col backdrop-blur-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                History
              </h2>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                {history.length} SCANS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px] p-6 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 italic py-20">
                  <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No scan logs found
                </div>
              ) : (
                history.map((record) => (
                  <div key={record.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="max-w-[70%]">
                        <p className="text-sm font-medium text-slate-200 truncate">{record.fileName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(record.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        record.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                        record.status === 'error' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400 animate-pulse'
                      }`}>
                        {record.status}
                      </span>
                    </div>

                    {record.status === 'completed' && record.result && (
                      <div className="space-y-4 pt-3 border-t border-slate-700/50 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                          <span className={`text-lg font-bold ${
                            record.result.classification === 'Human' ? 'text-green-400' : 'text-rose-400'
                          }`}>
                            {record.result.classification}
                          </span>
                          <div className="text-right">
                            <span className="text-xs text-slate-500 block">CONFIDENCE</span>
                            <span className="text-sm font-mono text-slate-200">{record.result.confidence}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2">
                           <div className="bg-slate-900/50 p-2 rounded border border-slate-700/30 text-center">
                              <span className="text-[10px] text-slate-500 block uppercase">Language</span>
                              <span className="text-xs text-slate-300 truncate">{record.language}</span>
                           </div>
                           <div className="bg-slate-900/50 p-2 rounded border border-slate-700/30 text-center">
                              <span className="text-[10px] text-slate-500 block uppercase">Spectra</span>
                              <span className={`text-xs ${record.result.technicalDetails.spectralAnomalies ? 'text-rose-400' : 'text-green-400'}`}>
                                {record.result.technicalDetails.spectralAnomalies ? 'Artifacts' : 'Clean'}
                              </span>
                           </div>
                           <div className="bg-slate-900/50 p-2 rounded border border-slate-700/30 text-center">
                              <span className="text-[10px] text-slate-500 block uppercase">Prosody</span>
                              <span className="text-xs text-slate-300 truncate">{record.result.technicalDetails.prosodyNaturalness}</span>
                           </div>
                        </div>

                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                          <span className="text-[10px] text-slate-500 block uppercase mb-1">Reasoning Engine</span>
                          <ul className="text-xs text-slate-400 space-y-1">
                            {record.result.reasoning.map((r, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-cyan-500 mt-1">•</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {record.status === 'error' && (
                      <p className="text-xs text-red-400 mt-2 italic">Analysis engine failed to process signal. Please retry.</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 opacity-50 text-xs">
        <div>
          <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-widest">Supported Languages</h4>
          <p className="text-slate-500">Tamil, English, Hindi, Malayalam, Telugu. Multilingual detection optimized for regional dialects.</p>
        </div>
        <div>
          <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-widest">Technical Specifications</h4>
          <p className="text-slate-500">Baseline analysis includes spectral centroid tracking, pitch jitter measurement, and phase continuity verification.</p>
        </div>
        <div>
          <h4 className="font-bold text-slate-300 mb-2 uppercase tracking-widest">Privacy Compliance</h4>
          <p className="text-slate-500">Encrypted transmission. No audio data is persisted after classification cycles are completed.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
