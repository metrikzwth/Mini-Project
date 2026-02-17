
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestConnection = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [details, setDetails] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            // 1. Check URL and Key configuration
            const urlConfigured = !!import.meta.env.VITE_SUPABASE_URL;
            const keyConfigured = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!urlConfigured || !keyConfigured) {
                throw new Error('Supabase URL or Key is missing in .env');
            }

            // 2. Try a simple request (Health Check)
            // fetching app_settings is a safe read operational that requires no auth if policies are correct
            // logic: assuming setup run. If not, this might fail, giving us a clue.
            const { data, error } = await supabase.from('app_settings').select('count', { count: 'exact', head: true });

            if (error) {
                throw error;
            }

            setStatus('success');
            setDetails({
                url: import.meta.env.VITE_SUPABASE_URL,
                tableCheck: 'Success'
            });

        } catch (err: any) {
            console.error('Connection failed:', err);
            setStatus('error');
            setErrorMsg(err.message || 'Unknown error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Supabase Connection Test</CardTitle>
                </CardHeader>
                <CardContent>
                    {status === 'loading' && <p>Testing connection...</p>}

                    {status === 'success' && (
                        <div className="text-green-600 space-y-2">
                            <p className="font-bold text-lg">✅ Connected Successfully!</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs text-black">
                                {JSON.stringify(details, null, 2)}
                            </pre>
                            <p className="text-sm text-gray-600">Your app can talk to Supabase.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-red-600 space-y-2">
                            <p className="font-bold text-lg">❌ Connection Failed</p>
                            <p className="text-sm bg-red-50 p-2 border border-red-200 rounded">{errorMsg}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                Possible causes:
                                <ul className="list-disc list-inside ml-2">
                                    <li>Invalid API URL or Anon Key.</li>
                                    <li>Database is paused (check dashboard).</li>
                                    <li>Table `app_settings` does not exist (run reset_schema.sql).</li>
                                </ul>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TestConnection;
