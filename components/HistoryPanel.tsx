import React, { useEffect, useState } from 'react';
import { StoredConversation } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: StoredConversation[];
  activeConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);


export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, conversations, activeConversationId, onLoadConversation, onNewConversation, onRenameConversation, onDeleteConversation }) => {
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [titleInput, setTitleInput] = useState('');

    const handleRenameStart = (conversation: StoredConversation) => {
        setRenamingId(conversation.id);
        setTitleInput(conversation.title);
    };

    const handleRenameCancel = () => {
        setRenamingId(null);
        setTitleInput('');
    };

    const handleRenameSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (renamingId && titleInput.trim()) {
            onRenameConversation(renamingId, titleInput.trim());
            handleRenameCancel();
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible.")) {
            onDeleteConversation(id);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ease-in-out ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-panel-title"
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <header className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                        <h2 id="history-panel-title" className="text-xl font-bold text-gray-800 dark:text-gray-200">
                            Historique des Conversations
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            aria-label="Fermer l'historique"
                        >
                            <CloseIcon />
                        </button>
                    </header>
                    
                    {/* New Conversation Button */}
                    <div className="p-4 border-b dark:border-gray-700">
                        <button
                            onClick={onNewConversation}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition-colors"
                        >
                            <PlusIcon />
                            Nouvelle Conversation
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-2 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center p-4">
                                <p className="text-gray-500 dark:text-gray-400">Aucune conversation sauvegardée.</p>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {conversations.map((convo) => (
                                    <li key={convo.id}>
                                        {renamingId === convo.id ? (
                                            <form onSubmit={handleRenameSave} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                                <input
                                                    type="text"
                                                    value={titleInput}
                                                    onChange={(e) => setTitleInput(e.target.value)}
                                                    className="w-full p-2 border border-pink-500 rounded-md bg-white dark:bg-gray-900 dark:text-white"
                                                    autoFocus
                                                    onBlur={handleRenameCancel}
                                                />
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <button type="button" onClick={handleRenameCancel} className="px-3 py-1 text-sm rounded-md hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600">Annuler</button>
                                                    <button type="submit" className="px-3 py-1 text-sm rounded-md bg-pink-500 text-white hover:bg-pink-600">Enregistrer</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div
                                                onClick={() => onLoadConversation(convo.id)}
                                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                                    activeConversationId === convo.id ? 'bg-pink-100 dark:bg-pink-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                <div className="truncate pr-2">
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{convo.title}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(convo.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleRenameStart(convo); }} className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Renommer"><PencilIcon /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(convo.id); }} className="p-2 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Supprimer"><TrashIcon /></button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};