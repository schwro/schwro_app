import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message || 'Błędny e-mail lub hasło.');
      setLoading(false);
    } // przekierowanie/refresh robi App.jsx poprzez listener sesji
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 shadow-md rounded max-w-md w-full border"
        onSubmit={handleLogin}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Logowanie
        </h1>
        <div className="mb-5">
          <label className="block mb-1 font-medium text-gray-700">E-mail</label>
          <input
            type="email"
            className="w-full p-3 border rounded bg-gray-50"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium text-gray-700">Hasło</label>
          <input
            type="password"
            className="w-full p-3 border rounded bg-gray-50"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-sm">{error}</div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </form>
    </div>
  );
}
