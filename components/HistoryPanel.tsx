import React, { useEffect } from 'react';
import { ChatMessage, Sender } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ChatMessage[];
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

const AIIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 015.69 3.117.75.75 0 01-.981.814A5.25 5.25 0 0012 13.5a5.25 5.25 0 00-4.709 2.431.75.75 0 01-.981-.814z" clipRule="evenodd" />
    </svg>
);


export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, conversation }) => {
    
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
    
    const filteredConversation = conversation.filter(msg => msg.sender !== Sender.System);

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
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="history-panel-title"
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <header className="flex items-center justify-between p-4 border-b">
                        <h2 id="history-panel-title" className="text-xl font-bold text-gray-800">
                            Historique de la Conversation
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800 transition-colors"
                            aria-label="Fermer l'historique"
                        >
                            <CloseIcon />
                        </button>
                    </header>

                    {/* Content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {filteredConversation.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Aucun historique pour le moment.</p>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {filteredConversation.map((msg) => (
                                    <li key={msg.id} className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === Sender.User ? 'bg-pink-100 text-pink-600' : 'bg-gray-200 text-gray-700'}`}>
                                            {msg.sender === Sender.User ? <UserIcon /> : <AIIcon />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">
                                                {msg.sender === Sender.User ? "Médecin" : "TerranoGyneco"}
                                            </p>
                                            <p className="text-gray-700 whitespace-pre-wrap">{msg.text}</p>
                                            {msg.imageUrl && msg.sender === Sender.AI && (
                                                <div className="mt-2">
                                                    <img
                                                        src={msg.imageUrl}
                                                        alt="Illustration Médicale de l'historique"
                                                        className="rounded-lg max-w-xs w-full border"
                                                    />
                                                </div>
                                            )}
                                        </div>
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