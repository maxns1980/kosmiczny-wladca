import React, { useState } from 'react';

interface AuthProps {
    onLogin: (token: string, username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (action: 'login' | 'create') => {
        if (!username.trim()) {
            setError('Nazwa użytkownika nie może być pusta.');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), action }),
            });

            const data = await response.json();

            if (response.ok) {
                onLogin(data.token, data.username);
            } else {
                setError(data.error || 'Wystąpił nieznany błąd.');
            }
        } catch (err) {
            setError('Błąd połączenia z serwerem.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 bg-cover bg-center bg-fixed flex items-center justify-center p-4" style={{backgroundImage: "url('https://picsum.photos/seed/galaxy/1920/1080')"}}>
            <div className="w-full max-w-md bg-gray-800 bg-opacity-80 backdrop-blur-md border border-cyan-700 rounded-xl shadow-2xl p-8 space-y-8">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-cyan-300">
                        Witaj w Kosmicznym Władcy
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Zaloguj się lub stwórz nowe konto.
                    </p>
                </div>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="username" className="sr-only">Nazwa użytkownika</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            className="w-full px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-md focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="Wpisz nazwę gracza"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => handleSubmit('login')}
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Logowanie...' : 'Zaloguj się'}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit('create')}
                            disabled={isSubmitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:opacity-50"
                        >
                             {isSubmitting ? 'Tworzenie...' : 'Stwórz Konto'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;