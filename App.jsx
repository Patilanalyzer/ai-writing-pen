import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Copy, Share2, Download, RotateCcw, 
  Sparkles, Globe, Settings, Moon, Sun, History, Trash2, 
  Check, Volume2, Edit3, MessageSquare, ArrowRight, RefreshCw, Feather
} from 'lucide-react';

const LANGUAGES = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ja', name: 'Japanese' }
];

const WRITING_ACTIONS = [
  { id: 'translate_improve', label: 'Translate & Improve', icon: '✨' },
  { id: 'improve_grammar', label: 'Improve Grammar', icon: '📝' },
  { id: 'rewrite_pro', label: 'Rewrite Professionally', icon: '💼' },
  { id: 'make_friendly', label: 'Make It Friendly', icon: '😊' },
  { id: 'make_polite', label: 'Make It Polite', icon: '🙏' },
  { id: 'make_shorter', label: 'Make It Shorter', icon: '✂️' },
  { id: 'expand', label: 'Expand Message', icon: '🔍' },
  { id: 'whatsapp_msg', label: 'Create WhatsApp Msg', icon: '💬' },
  { id: 'birthday_wish', label: 'Birthday Wish', icon: '🎉' },
  { id: 'business_msg', label: 'Business Message', icon: '📊' },
  { id: 'social_caption', label: 'Social Caption', icon: '📱' }
];

const TONES = ['Professional', 'Friendly', 'Formal', 'Casual', 'Emotional', 'Motivational', 'Persuasive', 'Simple'];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('mr');
  const [selectedAction, setSelectedAction] = useState('translate_improve');
  const [selectedTone, setSelectedTone] = useState('Friendly');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('app_history') || '[]'));
  const [darkMode, setDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('app_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInputText(transcript);
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.onerror = () => setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = sourceLang === 'auto' ? 'en-US' : sourceLang;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const generateContent = async () => {
    if (!inputText.trim()) {
      alert('Please enter or speak some text first!');
      return;
    }

    setIsLoading(true);
    setNotice('');

    const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

    if (!apiKey) {
      setTimeout(() => {
        let simulatedText = inputText;
        if (targetLang === 'mr') {
          simulatedText = `[मराठी अनुवाद]: ${inputText}`;
        } else if (targetLang === 'hi') {
          simulatedText = `[हिंदी अनुवाद]: ${inputText}`;
        } else {
          simulatedText = `[${targetLangName} Translation]: ${inputText}`;
        }
        
        setOutputText(simulatedText);
        saveToHistory(inputText, simulatedText);
        setIsLoading(false);
        setNotice('Demo Mode Active: Add Gemini API Key in Settings for accurate AI translations.');
      }, 1000);
      return;
    }

    try {
      const prompt = `Act as an expert multilingual AI writer and translator. 
Input Text: "${inputText}"
Action required: ${selectedAction}
Target Language: ${targetLangName}
Tone: ${selectedTone}

Instructions:
1. Translate or rewrite the message into ${targetLangName}.
2. Ensure the tone is ${selectedTone}.
3. Maintain names, numbers, dates, and core context accurately.
4. Provide only the final output text without meta comments.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        const result = data.candidates[0].content.parts[0].text.trim();
        setOutputText(result);
        saveToHistory(inputText, result);
      } else {
        throw new Error('API Error or Invalid Key');
      }
    } catch (err) {
      alert('Failed to generate with AI: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToHistory = (input, output) => {
    const item = {
      id: Date.now(),
      input,
      output,
      targetLang,
      action: selectedAction,
      date: new Date().toLocaleDateString()
    };
    setHistory(prev => [item, ...prev]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Writing Pen Output',
          text: outputText
        });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      handleCopy();
      alert('Copied to clipboard! Web Share is not supported on this browser.');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-200`}>
      
      {/* Header */}
      <header className="px-4 py-3 bg-indigo-700 text-white flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Feather className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">AI Writing Pen</h1>
            <p className="text-[10px] text-indigo-200">Your Words. Any Language.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-full transition">
            {darkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setActiveTab('settings')} className="p-2 hover:bg-white/10 rounded-full transition">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {activeTab === 'home' && (
          <div className="space-y-4">
            
            {/* Action Selectors */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">AI Action</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {WRITING_ACTIONS.map(act => (
                  <button
                    key={act.id}
                    onClick={() => setSelectedAction(act.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                      selectedAction === act.id 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : darkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{act.icon}</span>
                    <span>{act.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm relative`}>
              <div className="flex justify-between items-center mb-2">
                <select 
                  value={sourceLang} 
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="text-xs font-semibold bg-transparent border-none outline-none text-indigo-600 dark:text-indigo-400"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="dark:bg-slate-800 text-slate-800 dark:text-white">
                      From: {l.name}
                    </option>
                  ))}
                </select>

                <button 
                  onClick={toggleRecording}
                  className={`p-2 rounded-full transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600 dark:bg-slate-700 dark:text-indigo-300'}`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Speak or type your message here..."
                rows={4}
                className="w-full bg-transparent outline-none text-sm resize-none placeholder-slate-400"
              />

              {inputText && (
                <div className="flex justify-end">
                  <button onClick={() => setInputText('')} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                </div>
              )}
            </div>

            {/* Target Language & Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Translate To</label>
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {LANGUAGES.filter(l => l.code !== 'auto').map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Writing Tone</label>
                <select 
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                >
                  {TONES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              onClick={generateContent}
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Message</span>
                </>
              )}
            </button>

            {/* Notice Bar */}
            {notice && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                {notice}
              </p>
            )}

            {/* Output Box */}
            {outputText && (
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Generated Output</span>
                  <div className="flex gap-1">
                    <button onClick={handleCopy} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={handleShare} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm leading-relaxed whitespace-pre-wrap">{outputText}</p>
              </div>
            )}

          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">Recent Messages</h2>
              {history.length > 0 && (
                <button onClick={() => setHistory([])} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-xs">No saved messages yet.</p>
            ) : (
              history.map(item => (
                <div key={item.id} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} space-y-2`}>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{item.date}</span>
                    <span className="uppercase text-indigo-500 font-bold">{item.targetLang}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 line-clamp-1">In: {item.input}</p>
                  <p className="text-xs font-semibold line-clamp-2">{item.output}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-500">Settings</h2>

            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} space-y-3`}>
              <label className="text-xs font-semibold block">Gemini API Key (Optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste API Key here..."
                className={`w-full p-2.5 rounded-xl text-xs border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'} outline-none`}
              />
              <p className="text-[10px] text-slate-400">Add key for real-time accurate AI translation and writing style outputs.</p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} px-6 py-2 flex justify-around items-center z-50`}>
        <button 
          onClick={() => setActiveTab('home')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
        >
          <Feather className="w-5 h-5" />
          <span className="text-[10px] font-medium">Writer</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'history' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </nav>

    </div>
  );
}