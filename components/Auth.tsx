import React, { useState, useEffect } from 'react';

const ACCOUNTS_KEY = 'cosmic-lord-accounts';

interface AuthProps {
    onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [accounts, setAccounts] = useState<string[]>([]);
    const [newUsername, setNewUsername] = useState('');

    useEffect(() => {
        const storedAccounts = localStorage.getItem(ACCOUNTS_KEY);
        if (storedAccounts) {
            setAccounts(JSON.parse(storedAccounts));
        }
    }, []);

    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUsername = newUsername.trim();
        if (trimmedUsername && !accounts.includes(trimmedUsername)) {
            const updatedAccounts = [...accounts, trimmedUsername];
            setAccounts(updatedAccounts);
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
            onLogin(trimmedUsername);
        } else if (accounts.includes(trimmedUsername)) {
            alert('Nazwa użytkownika już istnieje.');
        } else {
            alert('Wpisz nazwę użytkownika.');
        }
        setNewUsername('');
    };
    
    const handleDeleteAccount = (usernameToDelete: string) => {
        if (window.confirm(`Czy na pewno chcesz usunąć konto "${usernameToDelete}"? Postęp zostanie utracony na zawsze.`)) {
            const updatedAccounts = accounts.filter(acc => acc !== usernameToDelete);
            setAccounts(updatedAccounts);
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
            localStorage.removeItem(`cosmic-lord-game-state-${usernameToDelete}`);
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
                        Wybierz konto lub stwórz nowe, aby rozpocząć grę.
                    </p>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white text-center">Istniejące Konta</h3>
                    {accounts.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {accounts.map(acc => (
                                <div key={acc} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg">
                                    <span className="text-white font-semibold">{acc}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => onLogin(acc)} className="px-4 py-1 text-sm font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-500 transition">
                                            Zaloguj
                                        </button>
                                        <button onClick={() => handleDeleteAccount(acc)} className="px-2 py-1 text-sm font-bold text-white bg-red-700 rounded-md hover:bg-red-600 transition" aria-label={`Usuń konto ${acc}`}>
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center">Brak zapisanych kont.</p>
                    )}
                </div>

                <form className="space-y-6" onSubmit={handleCreateAccount}>
                     <h3 className="text-xl font-bold text-white text-center border-t border-gray-700 pt-6">Stwórz Nowe Konto</h3>
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
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
                        >
                            Stwórz i Zagraj
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Auth;
