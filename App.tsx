import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import ChatPage from './pages/ChatPage';
import HomePage from './pages/HomePage';
import { SourcesPage } from './pages/SourcesPage';
import { StoredConversation, ChatMessage } from './types';

export type Theme = 'light' | 'dark';
export type View = 'welcome' | 'chat' | 'sources';

const CONVERSATIONS_KEY = 'terrano-gyneco-conversations';

const App: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('terrano-theme') as Theme) || 'light'
    );
    const [view, setView] = useState<View>('welcome');

    // --- Conversation State Lifted from ChatPage ---
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('terrano-theme', theme);
    }, [theme]);
    
    useEffect(() => {
        const savedConversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') as StoredConversation[];
        const sorted = savedConversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllConversations(sorted);
        
        if (sorted.length > 0) {
            setActiveConversationId(sorted[0].id);
        } else {
            startNewConversation([]); // Start with a fresh one if none exist
        }
    }, []);
    
    const saveAllConversations = (conversations: StoredConversation[]) => {
        const sorted = conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(sorted));
        setAllConversations(sorted);
    };

    const handleSaveConversation = useCallback((id: string, messages: ChatMessage[], title?: string) => {
        setAllConversations(prev => {
            const convoIndex = prev.findIndex(c => c.id === id);
            if (convoIndex === -1) return prev;

            const updatedConversations = [...prev];
            const currentConvo = { ...updatedConversations[convoIndex] };
            currentConvo.messages = messages;
            if (title) currentConvo.title = title;
            
            // Move updated conversation to the top
            updatedConversations.splice(convoIndex, 1);
            updatedConversations.unshift(currentConvo);

            localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConversations));
            return updatedConversations;
        });
    }, []);

    const startNewConversation = useCallback((currentConversations: StoredConversation[]) => {
        const newId = `convo-${Date.now()}`;
        const newConversation: StoredConversation = { id: newId, title: "Nouvelle Conversation", createdAt: new Date().toISOString(), messages: [] };
        
        const updatedConversations = [newConversation, ...currentConversations];
        saveAllConversations(updatedConversations);
        setActiveConversationId(newId);
        
        if (isHistoryOpen) setIsHistoryOpen(false);
        if (view === 'sources') setView('chat');
    }, [isHistoryOpen, view]);

    const loadConversation = useCallback((id: string) => {
        setActiveConversationId(id);
        if (isHistoryOpen) setIsHistoryOpen(false);
        if (view === 'sources') setView('chat');
    }, [isHistoryOpen, view]);

    const renameConversation = useCallback((id: string, newTitle: string) => {
        const updated = allConversations.map(c => c.id === id ? { ...c, title: newTitle } : c);
        saveAllConversations(updated);
    }, [allConversations]);

    const deleteConversation = useCallback((id: string) => {
        const updated = allConversations.filter(c => c.id !== id);
        saveAllConversations(updated);

        if (activeConversationId === id) {
            if (updated.length > 0) {
                setActiveConversationId(updated[0].id);
            } else {
                startNewConversation([]);
            }
        }
    }, [allConversations, activeConversationId, startNewConversation]);

    const activeConversation = allConversations.find(c => c.id === activeConversationId);

    return (
        <div className="flex flex-col h-screen font-sans bg-gray-50 dark:bg-gray-900">
            {(view === 'chat' || view === 'sources') && (
                <Header
                    onSettingsClick={() => setIsSettingsOpen(true)}
                    onHistoryClick={() => setIsHistoryOpen(true)}
                    onSourcesClick={() => setView('sources')}
                />
            )}
            
            {view === 'welcome' && <HomePage onStart={() => setView('chat')} />}

            {view === 'chat' && activeConversation && (
                <ChatPage
                    key={activeConversation.id} // Re-mounts component on conversation change
                    conversationData={activeConversation}
                    allConversations={allConversations}
                    onSaveConversation={handleSaveConversation}
                    onStartNewConversation={() => startNewConversation(allConversations)}
                    onLoadConversation={loadConversation}
                    onRenameConversation={renameConversation}
                    onDeleteConversation={deleteConversation}
                    isSettingsOpen={isSettingsOpen}
                    setIsSettingsOpen={setIsSettingsOpen}
                    isHistoryOpen={isHistoryOpen}
                    setIsHistoryOpen={setIsHistoryOpen}
                    theme={theme}
                    setTheme={setTheme}
                />
            )}

            {view === 'sources' && (
                <SourcesPage conversations={allConversations} onClose={() => setView('chat')} />
            )}
        </div>
    );
};

export default App;