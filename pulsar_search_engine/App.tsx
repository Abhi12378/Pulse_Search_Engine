import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MicrophoneIcon, SearchIcon, GeminiIcon } from './components/Icons';
import { initGeminiService } from './services/geminiService';

// Extends the window object to include browser-prefixed APIs for TypeScript.
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    google: any; // For Google Identity Services
  }
}

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

// The user session is managed locally after fetching profile info.
interface UserSession extends UserProfile {}

interface AppConfig {
    googleClientId?: string;
    apiKey?: string;
}

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<UserSession | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isGsiLoading, setIsGsiLoading] = useState(true);
  const [tokenClient, setTokenClient] = useState<any>(null); // For OAuth2 token flow

  const recognitionRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const handleSignOut = useCallback(() => {
    // Disable Google's automatic sign-in for this site
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    // Clear local state
    setUser(null);
    localStorage.removeItem('userSession');
    setIsDropdownOpen(false);
  }, []);

  // Effect to load configuration and user from storage
  useEffect(() => {
    const storedUser = localStorage.getItem('userSession');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Could not parse stored user session:", e);
        localStorage.removeItem('userSession');
      }
    }

    fetch('/metadata.json')
      .then(res => res.json())
      .then((data: AppConfig) => {
        setAppConfig(data);
        if (data.apiKey) {
          initGeminiService(data.apiKey);
        }
      })
      .catch(err => {
        console.error("Failed to load metadata.json", err);
        setError("Application configuration could not be loaded.");
        setIsGsiLoading(false);
      });
  }, []);


  // Effect for Google Sign-In initialization using OAuth2 token flow
  useEffect(() => {
    if (!appConfig) {
      return; // Wait for config to be loaded
    }

    const initializeGsi = () => {
      const CLIENT_ID = appConfig.googleClientId;
      if (!CLIENT_ID || CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
        setError("Google Client ID is not configured. Please update metadata.json. Sign-in is disabled.");
        setIsGsiLoading(false);
        return;
      }
      
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
                });

                if (!userInfoResponse.ok) {
                  throw new Error('Failed to fetch user info.');
                }
                
                const userInfo = await userInfoResponse.json();
                const userSession: UserSession = {
                  name: userInfo.name,
                  email: userInfo.email,
                  picture: userInfo.picture,
                };
                
                setUser(userSession);
                localStorage.setItem('userSession', JSON.stringify(userSession));
                setError('');
              } catch (err) {
                 console.error("Error fetching user info or setting session:", err);
                 setError("Failed to process sign-in response.");
              }
            }
          },
          error_callback: (error: any) => {
            console.error('GSI Token Client Error:', error);
            setError(`Sign-in failed. Please close the popup and try again.`);
          }
        });
        setTokenClient(client);
      } catch (error) {
          console.error('GSI Initialization Error:', error);
          setError(`Sign-in initialization failed. Please try refreshing the page.`);
      } finally {
          setIsGsiLoading(false);
      }
    };

    const intervalId = setInterval(() => {
      if (window.google?.accounts?.oauth2) { // Check for the OAuth2 module
        clearInterval(intervalId);
        initializeGsi();
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [appConfig]);


  const handleSignIn = () => {
    if (tokenClient) {
        setError('');
        // Trigger the OAuth 2.0 popup for sign-in
        tokenClient.requestAccessToken();
    } else {
        setError('Google Sign-In is not ready. Please try again in a moment.');
    }
  };
  
  // Effect for Speech Recognition
  useEffect(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError(prev => prev ? prev : 'Speech recognition is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setError('');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(transcript)}`;
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setError('No speech was detected. Please try again.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setError(prev => prev ? prev : "Failed to initialize Speech Recognition. Your browser might not support it or permissions may be denied.");
      console.error("Speech Recognition initialization error:", e);
    }
  }, []);
  
  // Effect to close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVoiceSearch = useCallback(() => {
    if (isListening) return;

    if (recognitionRef.current) {
      try {
        setQuery('');
        setError('');
        recognitionRef.current.start();
      } catch (e) {
        console.error("Could not start recognition", e);
        setIsListening(false);
      }
    } else {
      setError('Speech recognition is not available.');
    }
  }, [isListening]);

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  const renderHeader = () => {
    if (user) {
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="rounded-full overflow-hidden w-10 h-10 border-2 border-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 transition-all"
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl py-1 z-20 animate-fade-in ring-1 ring-black ring-opacity-5">
              <div className="px-4 py-3 border-b border-gray-700">
                <p className="font-semibold text-white truncate">{user.name}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      );
    } else {
      const isConfigMissing = !appConfig?.googleClientId || appConfig.googleClientId.includes('YOUR_GOOGLE_CLIENT_ID');
      const isSignInDisabled = isGsiLoading || isConfigMissing;
      
      let buttonText = 'Sign In';
      if (isGsiLoading) {
        buttonText = 'Loading...';
      } else if (isConfigMissing) {
        buttonText = 'Sign-in Disabled';
      }

      return (
          <button
            onClick={handleSignIn}
            disabled={isSignInDisabled}
            className="px-4 py-2 border border-gray-600 rounded-full text-gray-300 hover:bg-gray-700 hover:border-blue-500 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
      );
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans relative">
      <header className="absolute top-0 right-0 p-6 z-10">
        {renderHeader()}
      </header>

      <main className="w-full max-w-2xl flex flex-col items-center text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Pulsar
          </h1>
        </div>
        <p className="text-gray-400 mb-8">Type or use your voice to search Google.</p>

        <form onSubmit={handleTextSearch} className="w-full relative mb-4">
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Type a search or click the mic'}
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-full py-4 pl-6 pr-36 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              disabled={isListening}
            />
            <div className="absolute right-3 flex items-center space-x-1">
              <button
                type="submit"
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                aria-label="Text search"
              >
                <SearchIcon className="w-6 h-6"/>
              </button>
              <a
                href="https://gemini.google.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Gemini in a new tab"
                title="Open Gemini"
                className="p-2 text-purple-400 hover:text-purple-300 transition-colors rounded-full hover:bg-gray-700"
              >
                <GeminiIcon className="w-6 h-6" />
              </a>
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-2 rounded-full transition-all duration-300 ease-in-out ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                aria-label="Voice search"
                disabled={isListening}
              >
                <MicrophoneIcon className="w-6 h-6"/>
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="w-full mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center animate-fade-in">
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
