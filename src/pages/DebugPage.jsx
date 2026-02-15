import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugPage() {
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState(null);
  const [envVars, setEnvVars] = useState({});
  const [pingResult, setPingResult] = useState(null);
  const [keyValidation, setKeyValidation] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Validate Key Format
      let validationMsg = null;
      if (!key) {
        validationMsg = 'Key is missing';
      } else if (key.startsWith('sbp_')) {
        validationMsg = 'Warning: This looks like a Supabase Publishable Key (sbp_), but supabase-js usually expects an Anon Key (starts with ey...).';
      } else if (key.startsWith('sb_')) {
        validationMsg = 'Warning: This looks like a Service/Secret Key (sb_), not an Anon Key. It might work but is dangerous for client-side use.';
      } else if (!key.startsWith('ey')) {
        validationMsg = 'CRITICAL ERROR: Key does not start with "ey". A valid Supabase Anon Key is a JWT token starting with "ey". You likely copied the wrong key.';
      } else if (key.split('.').length !== 3) {
        validationMsg = 'CRITICAL ERROR: Key is not a valid JWT (must have 3 parts separated by dots).';
      } else {
        validationMsg = 'Key format looks correct (JWT).';
      }
      setKeyValidation(validationMsg);

      setEnvVars({
        url: url ? `${url.substring(0, 20)}...` : 'UNDEFINED',
        key: key ? `${key.substring(0, 10)}...` : 'UNDEFINED',
      });

      if (!url || !key) {
        throw new Error('Missing Environment Variables');
      }

      const start = Date.now();
      // Try a simple health check fetch first to rule out client library issues
      try {
        const healthRes = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });
        if (!healthRes.ok) {
           console.warn('Direct fetch failed:', healthRes.status, healthRes.statusText);
        }
      } catch (fetchErr) {
        console.error('Direct fetch error:', fetchErr);
      }

      // Supabase client check
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      const duration = Date.now() - start;

      if (error) throw error;

      setStatus('Connected ✅');
      setPingResult(`Success (${duration}ms)`);
    } catch (e) {
      console.error('Debug Error:', e);
      setStatus('Error ❌');
      setError(e.message || JSON.stringify(e));
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto pt-24">
      <h1 className="text-2xl font-bold mb-6">System Debug</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm break-all">
            <div className="flex flex-col gap-1">
              <span className="font-semibold">VITE_SUPABASE_URL:</span>
              <span className={envVars.url === 'UNDEFINED' ? 'text-red-500' : 'text-green-600'}>
                {envVars.url}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="font-semibold">VITE_SUPABASE_ANON_KEY:</span>
              <span className={envVars.key === 'UNDEFINED' ? 'text-red-500' : 'text-green-600'}>
                {envVars.key}
              </span>
            </div>
          </div>
        </div>

        {keyValidation && (
          <div className={`p-4 rounded-xl border ${keyValidation.includes('CRITICAL') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
            <h3 className="font-bold mb-1">Key Validation:</h3>
            <p className="text-sm">{keyValidation}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-bold mb-4">Connection Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <span className={`font-bold ${status.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                {status}
              </span>
            </div>
            {pingResult && (
              <div className="flex justify-between">
                <span>Latency:</span>
                <span>{pingResult}</span>
              </div>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-mono break-all">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl text-sm text-blue-800">
          <h3 className="font-bold mb-2">How to find the correct Anon Key:</h3>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to <strong>Project Settings</strong> (gear icon) → <strong>API</strong></li>
            <li>Look for <strong>anon</strong> / <strong>public</strong> key</li>
            <li>It should start with <code>ey...</code> and be a long string</li>
            <li>Copy that key and update your Vercel Environment Variables</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
