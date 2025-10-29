import React, { useState, useMemo } from 'react';
import { StoredConversation, Source } from '../types';

const ArrowDownIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const SearchIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface SourcesPageProps {
  conversations: StoredConversation[];
  onClose: () => void;
}

const SourceCard: React.FC<{ source: Source }> = ({ source }) => (
    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="block p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm">
        <p className="font-semibold text-pink-600 dark:text-pink-400 truncate">{source.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{new URL(source.uri).hostname}</p>
        {source.snippet && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                {source.snippet}
            </p>
        )}
    </a>
);

const ConversationSources: React.FC<{ conversation: StoredConversation }> = ({ conversation }) => {
    const [isOpen, setIsOpen] = useState(true);
    const allSources = useMemo(() => conversation.messages.flatMap(msg => msg.sources || []), [conversation.messages]);

    if (allSources.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors focus:outline-none">
                <div className="text-left truncate pr-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 truncate">{conversation.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{allSources.length} source{allSources.length > 1 ? 's' : ''} • {new Date(conversation.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                </div>
                <ArrowDownIcon className={`w-6 h-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 space-y-3 border-t border-gray-200 dark:border-slate-700">
                    {allSources.map((source, index) => <SourceCard key={`${conversation.id}-${index}`} source={source} />)}
                </div>
            )}
        </div>
    );
};


export const SourcesPage: React.FC<SourcesPageProps> = ({ conversations, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = useMemo(() => {
        const conversationsWithSources = conversations.filter(c => c.messages.some(m => m.sources && m.sources.length > 0));

        if (!searchTerm) {
            return conversationsWithSources;
        }

        const lowercasedFilter = searchTerm.toLowerCase();
        
        return conversationsWithSources.map(convo => {
            const newConvo = { ...convo };
            newConvo.messages = convo.messages.map(msg => {
                if (!msg.sources) return { ...msg, sources: [] };
                const matchingSources = msg.sources.filter(source =>
                    source.title.toLowerCase().includes(lowercasedFilter) ||
                    source.uri.toLowerCase().includes(lowercasedFilter) ||
                    source.snippet?.toLowerCase().includes(lowercasedFilter)
                );
                return { ...msg, sources: matchingSources };
            }).filter(msg => msg.sources && msg.sources.length > 0);
            
            return newConvo;
        }).filter(c => c.messages.length > 0);

    }, [conversations, searchTerm]);
    
    const totalSources = useMemo(() => conversations.reduce((acc, curr) => acc + (curr.messages.flatMap(m => m.sources || []).length), 0), [conversations]);

    return (
        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-100 dark:bg-gray-900/95" >
            <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Bibliothèque de Sources</h2>
                         <p className="text-gray-600 dark:text-gray-400 mt-1">{totalSources} source{totalSources > 1 ? 's' : ''} trouvée{totalSources > 1 ? 's' : ''} dans {conversations.filter(c => c.messages.some(m => m.sources && m.sources.length > 0)).length} conversations.</p>
                    </div>
                     <button
                        onClick={onClose}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition-colors"
                    >
                        Retourner au Chat
                    </button>
                </header>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Rechercher par mot-clé, titre ou URL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-slate-800 dark:text-white"
                    />
                     {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <CloseIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                        </button>
                    )}
                </div>

                {filteredConversations.length > 0 ? (
                    <div className="space-y-4">
                        {filteredConversations.map(convo => <ConversationSources key={convo.id} conversation={convo} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4">
                         <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md mx-auto shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                                {searchTerm ? "Aucun résultat" : "Bibliothèque vide"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                               {searchTerm ? "Aucune source ne correspond à votre recherche." : "Aucune source n'a encore été trouvée dans vos conversations."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};
