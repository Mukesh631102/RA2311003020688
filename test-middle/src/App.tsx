import React, { useState, useEffect } from 'react';
import { Log, setAuthToken, type LogLevel, type LogPackage } from './loggingService';
import './index.css';

const App: React.FC = () => {
  const [token, setToken] = useState('');
  const [level, setLevel] = useState<LogLevel>('info');
  const [pkg, setPkg] = useState<LogPackage>('component');
  const [message, setMessage] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  // Update token in loggingService when it changes
  useEffect(() => {
    setAuthToken(token || null);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('loading');
    
    try {
      await Log(level, pkg, message);
      setStatus('success');
      setStatusMsg('Log dispatched to Evaluation Service!');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch {
      setStatus('error');
      setStatusMsg('Failed to send log.');
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Telemetry Console</h1>
        <p>Evaluation Service Integrator</p>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="token">Authorization Token (Bearer)</label>
            <input
              type="text"
              id="token"
              className="form-input"
              placeholder="Paste JWT token here..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="level">Severity Level</label>
              <select 
                id="level" 
                className="form-select"
                value={level}
                onChange={(e) => setLevel(e.target.value as LogLevel)}
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
                <option value="fatal">Fatal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="package">Target Package</label>
              <select 
                id="package" 
                className="form-select"
                value={pkg}
                onChange={(e) => setPkg(e.target.value as LogPackage)}
              >
                <optgroup label="Frontend Specific">
                  <option value="apf">APF</option>
                  <option value="component">Component</option>
                  <option value="hook">Hook</option>
                  <option value="page">Page</option>
                  <option value="state">State</option>
                  <option value="style">Style</option>
                </optgroup>
                <optgroup label="General">
                  <option value="auth">Auth</option>
                  <option value="config">Config</option>
                  <option value="middleware">Middleware</option>
                  <option value="utils">Utils</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="message">Log Message</label>
            <input
              type="text"
              id="message"
              className="form-input"
              placeholder="Describe the event or error..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={status === 'loading' || !message.trim()}
          >
            {status === 'loading' ? (
              <>
                <span className="spinner"></span>
                Transmitting...
              </>
            ) : (
              'Dispatch Telemetry'
            )}
          </button>
        </form>

        {status === 'success' && (
          <div className="notification success">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {statusMsg}
          </div>
        )}

        {status === 'error' && (
          <div className="notification error">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
