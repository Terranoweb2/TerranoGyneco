import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  isConversationActive: boolean;
  isTranscriptionEnabled: boolean;
  onTranscriptionToggle: (isEnabled: boolean) => void;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, sensitivity, onSensitivityChange, isConversationActive, isTranscriptionEnabled, onTranscriptionToggle }) => {
  if (!isOpen) return null;

  const handleSensitivityChangeInternal = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSensitivityChange(parseFloat(e.target.value));
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-11/12 max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Fermer les paramètres"
        >
            <CloseIcon />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Paramètres Audio</h2>

        <div className="space-y-6">
            <div>
                <label htmlFor="sensitivity" className="block text-md font-medium text-gray-700 mb-2">
                    Sensibilité du microphone
                </label>
                <div className="flex items-center gap-4">
                     <input
                        id="sensitivity"
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.1"
                        value={sensitivity}
                        onChange={handleSensitivityChangeInternal}
                        disabled={isConversationActive}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="font-semibold text-gray-700 w-12 text-center">{sensitivity.toFixed(1)}x</span>
                </div>
            </div>
            
            <hr className="border-gray-200" />
            
             <div>
                <div className="flex items-center justify-between">
                    <div>
                        <label id="transcription-label" className="block text-md font-medium text-gray-700">
                            Transcription en direct
                        </label>
                        <p className="text-sm text-gray-500">Afficher le texte de la conversation.</p>
                    </div>
                     <button
                        type="button"
                        onClick={() => onTranscriptionToggle(!isTranscriptionEnabled)}
                        disabled={isConversationActive}
                        className={`relative inline-flex flex-shrink-0 items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed ${isTranscriptionEnabled ? 'bg-pink-600' : 'bg-gray-300'}`}
                        aria-pressed={isTranscriptionEnabled}
                        aria-labelledby="transcription-label"
                    >
                        <span className="sr-only">Activer la transcription</span>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isTranscriptionEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>
            
             {isConversationActive && (
                <p className="text-sm text-center text-gray-600 bg-gray-100 p-3 rounded-lg">
                    Les ajustements sont désactivés pendant une conversation.
                </p>
            )}
            
            <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                <p>
                    <strong>Note :</strong> Le taux d'échantillonnage audio est fixé à 16kHz pour une compatibilité optimale avec l'API et ne peut pas être modifié.
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};