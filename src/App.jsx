import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Shield, Terminal, Database, Smartphone, Globe, MonitorDown, Lock, User, LogOut, Loader2, ArrowRight, AlertTriangle, ShieldCheck, Search, KeyRound, UserPlus, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pwned');
  const [deepScan, setDeepScan] = useState(false);
  
  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); 
  const [authStep, setAuthStep] = useState('input'); 
  
  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  // Tool States
  const [inputData, setInputData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const resetState = () => {
    setInputData('');
    setResults(null);
  };

  // --- PDF REPORT DOWNLOAD FUNCTION ---
  const handleDownloadReport = () => {
    if (!results) return;

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Report Title
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235); // Blue color
      doc.text("AI-SECGUARD SECURITY REPORT", 20, yPos);
      yPos += 15;

      // Meta Info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0); // Black color
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, yPos);
      yPos += 8;
      doc.text(`Target Scanned: ${results.target || inputData || 'N/A'}`, 20, yPos);
      yPos += 8;
      doc.text(`Scan Type: ${deepScan ? 'Deep Scan Analysis' : 'Quick Scan'}`, 20, yPos);
      yPos += 8;
      
      doc.setFont("helvetica", "bold");
      doc.text(`Overall Status: ${(results.status || 'Unknown').toUpperCase()}`, 20, yPos);
      doc.setFont("helvetica", "normal");
      yPos += 15;

      // Divider Line
      doc.line(20, yPos - 5, 190, yPos - 5);

      // Results Logic
      if (results.vulnerabilities) {
        doc.text(`Total Vulnerabilities Found: ${results.vulnerabilities.length}`, 20, yPos);
        yPos += 12;
        results.vulnerabilities.forEach((v, i) => {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          
          doc.setFont("helvetica", "bold");
          doc.setTextColor(220, 38, 38); 
          doc.text(`[${i+1}] VULNERABILITY: ${v.type || 'Unknown'}`, 20, yPos);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          yPos += 8;
          
          doc.text(`Severity: ${v.severity || 'N/A'}`, 30, yPos);
          yPos += 8;
          doc.text(`Endpoint: ${v.endpoint || 'N/A'}`, 30, yPos);
          yPos += 8;
          
          const descText = v.desc ? String(v.desc) : 'No description provided.';
          const splitDesc = doc.splitTextToSize(`Description: ${descText}`, 150);
          doc.text(splitDesc, 30, yPos);
          yPos += (7 * splitDesc.length) + 5;
        });
      } else {
        doc.setFont("helvetica", "bold");
        doc.text(`Result Message: ${results.message || 'N/A'}`, 20, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 10;
        
        if (results.risk) { doc.text(`Risk Level: ${results.risk}`, 20, yPos); yPos += 10; }
        if (results.breaches !== undefined) { doc.text(`Breaches Found: ${results.breaches}`, 20, yPos); yPos += 10; }
        
        const detailsArray = results.reasons || results.details;
        if (detailsArray && detailsArray.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Detailed Findings:", 20, yPos);
          doc.setFont("helvetica", "normal");
          yPos += 10;
          detailsArray.forEach(r => {
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            const splitReason = doc.splitTextToSize(`- ${r}`, 150);
            doc.text(splitReason, 25, yPos);
            yPos += (7 * splitReason.length);
          });
        }
      }

      // Footer
      if (yPos > 270) { doc.addPage(); yPos = 20; }
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Generated automatically by AI-SecGuard Professional Suite.", 20, yPos);

      // PDF Download
      doc.save(`AI-SecGuard_Report_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF bananay mein koi masla aa gaya hai!");
    }
  };

  // --- Auth Functions (UPDATED FOR VERCEL) ---
  const handleSendOTP = async () => {
    if (!authIdentifier) return alert("Email or Phone is required!");
    if (authMode === 'signup' && (!firstName || !lastName)) return alert("Please enter your First and Last name!");
    
    setAuthLoading(true); setAuthMessage('');
    
    const endpoint = authMode === 'signup' ? 'signup' : 'login';
    const payload = authMode === 'signup' 
      ? { first_name: firstName, last_name: lastName, identifier: authIdentifier } 
      : { identifier: authIdentifier };

    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAuthMessage(data.message);
      setAuthStep('otp');
    } catch (e) {
      setAuthMessage("Server connection error.");
    }
    setAuthLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp) return;
    setAuthLoading(true); setAuthMessage('');
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: authIdentifier, otp })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsAuthenticated(true);
        setUser({ ...data.user, name: authMode === 'signup' ? `${firstName} ${lastName}` : 'Pro Hacker' });
        setActiveTab('web'); 
      } else {
        setAuthMessage(data.message);
      }
    } catch (e) {
      setAuthMessage("Server connection error.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setUser(null); setActiveTab('pwned'); setAuthStep('input');
    setAuthIdentifier(''); setFirstName(''); setLastName(''); setOtp('');
  };

  // --- Tool Functions (UPDATED FOR VERCEL) ---
  const handleApiCall = async (endpoint, payload) => {
    if (!inputData) return alert("Please enter data first!");
    setIsScanning(true); setResults(null);
    try {
      if (isAuthenticated) payload.token = "premium_user_token_8899";
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await response.json();
      setResults(data);
    } catch (error) { setResults({ error: "Backend server connection failed!" }); }
    setIsScanning(false);
  };

  const renderSidebar = () => (
    <div className="w-64 bg-gray-950 border-r border-gray-800 min-h-screen p-4 flex flex-col hidden md:flex">
      <div className="flex items-center gap-2 font-bold text-2xl tracking-tight mb-8 px-2">
        <Shield className="w-8 h-8 text-blue-500" />
        <span className="text-white">AI-Sec</span><span className="text-blue-500">Guard</span>
      </div>

      <div className="mb-8 px-2">
        {isAuthenticated ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500"><User className="w-4 h-4" /></div>
              <div className="text-xs truncate">
                <p className="text-gray-400 font-bold truncate">{user.name}</p>
                <p className="text-emerald-500 truncate">{user.identifier}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setActiveTab('login')} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 text-sm font-bold transition-all">
            <UserPlus className="w-4 h-4" /> Sign Up / Login
          </button>
        )}
      </div>
      
      <div className="flex-1 space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase px-2 mb-2">Public Security (Free)</p>
        <button onClick={() => {setActiveTab('pwned'); resetState();}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pwned' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
          <Database className="w-5 h-5" /> Data Breach Checker
        </button>
        <button onClick={() => {setActiveTab('text'); resetState();}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'text' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
          <Smartphone className="w-5 h-5" /> Phishing Scanner
        </button>

        <p className="text-xs font-bold text-gray-500 uppercase px-2 mb-2 mt-8">Bounty & Enterprise</p>
        <button onClick={() => {setActiveTab('web'); resetState();}} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'web' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
          <div className="flex items-center gap-3"><Globe className="w-5 h-5" /> Web Scanner</div>
          {!isAuthenticated && <Lock className="w-4 h-4 text-gray-600" />}
        </button>
        <button onClick={() => {setActiveTab('ai'); resetState();}} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-900 hover:text-white'}`}>
          <div className="flex items-center gap-3"><Terminal className="w-5 h-5" /> AI Vulnerability</div>
          {!isAuthenticated && <Lock className="w-4 h-4 text-gray-600" />}
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-800">
        <button className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 rounded-lg hover:bg-emerald-600/20 transition-all group">
          <div className="flex items-center gap-2 text-sm font-bold"><MonitorDown className="w-4 h-4" /> Get Desktop App</div>
          <span className="text-[10px] text-gray-400 group-hover:text-emerald-400">Available Soon</span>
        </button>
      </div>
    </div>
  );

  const renderAuthScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
            <KeyRound className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        {authStep === 'input' && (
          <div className="flex bg-gray-950 rounded-lg p-1 mb-6 border border-gray-800">
            <button onClick={() => {setAuthMode('login'); setAuthMessage('');}} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'login' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              Login
            </button>
            <button onClick={() => {setAuthMode('signup'); setAuthMessage('');}} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>
              Create Account
            </button>
          </div>
        )}

        <h2 className="text-2xl font-bold text-white text-center mb-2">{authMode === 'signup' ? 'Join AI-SecGuard' : 'Welcome Back'}</h2>
        <p className="text-gray-400 text-center text-sm mb-8">Access Premium Bug Bounty & Security Tools.</p>

        {authStep === 'input' ? (
          <>
            {authMode === 'signup' && (
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">First Name</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Email or Mobile Number</label>
            <input 
              type="text" value={authIdentifier} onChange={(e) => setAuthIdentifier(e.target.value)}
              placeholder="e.g. +92300... or user@email.com" 
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-6" 
            />
            <button onClick={handleSendOTP} disabled={authLoading || !authIdentifier} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP Code'}
            </button>
          </>
        ) : (
          <>
            <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase text-center">Enter Verification Code (OTP)</label>
            <input 
              type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
              placeholder="1234" 
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-center tracking-[0.5em] text-2xl font-bold mb-6" 
              maxLength={4}
            />
            <button onClick={handleVerifyOTP} disabled={authLoading || otp.length < 4} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-all">
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enter'}
            </button>
            <button onClick={() => setAuthStep('input')} className="w-full mt-4 text-gray-500 hover:text-white text-sm font-semibold">Change Email/Phone</button>
          </>
        )}
        {authMessage && <p className={`mt-4 text-center text-sm p-3 rounded-lg border ${authMessage.includes('error') || authMessage.includes('Invalid') ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-blue-900/20 text-blue-400 border-blue-900/50'}`}>{authMessage}</p>}
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'login') return renderAuthScreen();

    const toolConfig = {
      pwned: { title: "Data Breach Checker", desc: "Check if your email is compromised in public database leaks.", icon: Database, placeholder: "Enter your email address...", endpoint: "pwned", payload: { email: inputData }, premium: false },
      text: { title: "SMS & Email Scanner", desc: "Detect phishing links and social engineering in texts.", icon: Smartphone, placeholder: "Paste suspicious SMS or Email here...", endpoint: "scan-text", payload: { text: inputData, deep_scan: deepScan }, isTextArea: true, premium: false },
      web: { title: "Web Vulnerability Scanner", desc: "Scan websites for SQLi, XSS, and security headers.", icon: Globe, placeholder: "https://target-website.com", endpoint: "scan-web", payload: { target_url: inputData, deep_scan: deepScan }, premium: true },
      ai: { title: "AI Prompt Injector", desc: "Test LLM chatbots for jailbreaks and data leaks.", icon: Terminal, placeholder: "https://ai-bot-url.com", endpoint: "scan-ai", payload: { target_url: inputData, deep_scan: deepScan }, premium: true },
    };

    const current = toolConfig[activeTab];
    const Icon = current.icon;

    if (current.premium && !isAuthenticated) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-in fade-in">
          <Lock className="w-24 h-24 text-gray-700 mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Premium Feature Locked</h2>
          <p className="text-gray-400 max-w-md mb-8">You need an active account to perform advanced bug bounty scans like SQLi and Prompt Injections.</p>
          <button onClick={() => setActiveTab('login')} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 mx-auto">
            <UserPlus className="w-5 h-5" /> Create Free Account
          </button>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3"><Icon className="text-blue-500 w-8 h-8" /> {current.title}</h2>
            <p className="text-gray-400 mt-2">{current.desc}</p>
          </div>
          
          {activeTab !== 'pwned' && (
            <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg">
              <span className={`text-sm font-bold ${deepScan ? 'text-blue-400' : 'text-gray-500'}`}>Deep Scan</span>
              <button onClick={() => setDeepScan(!deepScan)} className={`w-12 h-6 rounded-full transition-colors relative ${deepScan ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${deepScan ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-2xl">
          {current.isTextArea ? (
            <textarea value={inputData} onChange={(e) => setInputData(e.target.value)} placeholder={current.placeholder} className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 mb-4 resize-none" />
          ) : (
            <input type="text" value={inputData} onChange={(e) => setInputData(e.target.value)} placeholder={current.placeholder} className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-4 text-white focus:outline-none focus:border-blue-500 mb-4" />
          )}

          <button onClick={() => handleApiCall(current.endpoint, current.payload)} disabled={isScanning} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            {isScanning ? <><Loader2 className="w-5 h-5 animate-spin" /> {deepScan ? 'Performing Deep Analysis...' : 'Scanning...'}</> : <><Search className="w-5 h-5" /> Launch Scan</>}
          </button>
        </div>

        {/* Scan Results and Report Button */}
        {results && !results.error && (
          <div className="mt-8 bg-black border border-gray-800 rounded-xl p-6 font-mono relative group">
            
            {/* Download PDF Button */}
            <button 
              onClick={handleDownloadReport} 
              className="absolute top-4 right-4 bg-gray-800 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all opacity-80 group-hover:opacity-100 z-10"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>

            {results.vulnerabilities ? (
               <div className="pt-8">
                 <h3 className="text-emerald-400 text-lg mb-4">{'>'} Scan Complete for: {results.target}</h3>
                 <p className="text-red-500 font-bold mb-4">{'>'} Vulnerabilities Found: {results.vulnerabilities.length}</p>
                 {results.vulnerabilities.map((vuln, i) => (
                   <div key={i} className="mb-3 p-4 border border-red-900/50 bg-red-950/20 rounded-lg">
                     <span className="text-red-400 font-bold">[{vuln.severity}] {vuln.type}</span><br/>
                     <span className="text-gray-400 text-sm">Endpoint: {vuln.endpoint || 'N/A'}</span><br/>
                     <span className="text-gray-300">{vuln.desc}</span>
                   </div>
                 ))}
               </div>
            ) : (
               <div className={`p-4 mt-8 rounded-lg border ${results.status === 'danger' ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-500/50 bg-emerald-950/20'}`}>
                 <div className="flex items-center gap-3 mb-4">
                   {results.status === 'danger' ? <AlertTriangle className="w-8 h-8 text-red-500" /> : <ShieldCheck className="w-8 h-8 text-emerald-500" />}
                   <div>
                     <h4 className={`text-xl font-bold ${results.status === 'danger' ? 'text-red-500' : 'text-emerald-500'}`}>{results.message}</h4>
                     {results.risk && <p className="text-gray-400 text-sm">Risk Level: {results.risk}</p>}
                     {results.breaches !== undefined && <p className="text-gray-400 text-sm">Breaches Found: {results.breaches}</p>}
                   </div>
                 </div>
                 <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                   {(results.reasons || results.details || []).map((detail, i) => <li key={i}>{detail}</li>)}
                 </ul>
               </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-gray-200 font-sans">
      {renderSidebar()}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}