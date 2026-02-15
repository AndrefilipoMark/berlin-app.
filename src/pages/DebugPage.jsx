import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function DebugPage() {
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState(null);
  const [envVars, setEnvVars] = useState({});
  const [pingResult, setPingResult] = useState(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      setEnvVars({
        url: url ? `${url.substring(0, 15)}...` : 'UNDEFINED',
        key: key ? `${key.substring(0, 10)}...` : 'UNDEFINED',
      });

      if (!url || !key) {
        throw new Error('Missing Environment Variables');
      }

      const start = Date.now();
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
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span>VITE_SUPABASE_URL:</span>
              <span className={envVars.url === 'UNDEFINED' ? 'text-red-500' : 'text-green-600'}>
                {envVars.url}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VITE_SUPABASE_ANON_KEY:</span>
              <span className={envVars.key === 'UNDEFINED' ? 'text-red-500' : 'text-green-600'}>
                {envVars.key}
              </span>
            </div>
          </div>
        </div>

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
          <h3 className="font-bold mb-2">Instructions</h3>
          <p>
            If you see "UNDEFINED" or "Error", please check your Vercel Project Settings:
          </p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Go to Vercel Dashboard → Project → Settings → Environment Variables</li>
            <li>Ensure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are added</li>
            <li>Redeploy your application after adding them</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
