
// Fix: Import useState from React.
import React, { useState } from 'react';
import { ChatMessage, Sender } from '../types';

interface ConversationViewProps {
  conversation: ChatMessage[];
  currentInputTranscription: string;
  isAiTyping: boolean;
  onImageClick: (url: string) => void;
}

const ImagePlaceholder = () => (
    <div className="mt-3 bg-gray-200 rounded-lg w-full aspect-video flex items-center justify-center animate-pulse">
        <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
    </div>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a2.25 2.25 0 01-2.25 2.25h-1.5a2.25 2.25 0 01-2.25-2.25v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
);

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.042.586.042h4.4c.196 0 .391-.017.586-.042m-5.572 2.186a2.25 2.25 0 01-2.248 2.247M7.217 10.907a2.25 2.25 0 012.248-2.247m0 0h4.4c.69 0 1.318.336 1.714.868m-5.572-2.186a2.25 2.25 0 00-2.248 2.247m0 0c-.195-.025-.39-.042-.586-.042h-4.4a2.25 2.25 0 00-2.248 2.247m5.572-2.186c-.195.025-.39.042-.586.042m0 0a2.25 2.25 0 012.248 2.247m0 0h4.4a2.25 2.25 0 012.248-2.247" />
    </svg>
);


const MessageBubble: React.FC<{ message: ChatMessage, onImageClick: (url: string) => void }> = ({ message, onImageClick }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isUser = message.sender === Sender.User;
  const isSystem = message.sender === Sender.System;

  const handleCopy = () => {
    if (isSystem || !message.text) return;

    navigator.clipboard.writeText(message.text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleShare = async () => {
    if (navigator.share && message.text) {
        try {
            await navigator.share({
                title: 'Extrait de la conversation TerranoGyneco',
                text: message.text,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    } else {
        alert("La fonction de partage n'est pas supportée sur ce navigateur.");
    }
  };


  if (isSystem) {
      return (
          <div className="text-center my-2">
              <p className="text-sm font-medium text-gray-600 px-4 py-2 bg-gray-200 rounded-lg inline-block mx-auto">
                  {message.text}
              </p>
          </div>
      );
  }

  return (
    <div className={`group flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-xl rounded-2xl p-4 shadow ${
          isUser
            ? 'bg-pink-500 text-white rounded-br-none'
            : 'bg-white text-gray-800 rounded-bl-none'
        }`}
      >
        {isCopied && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center z-10">
            <span className="text-white font-bold text-lg">Copié !</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.imageUrl && (
          <div className="mt-3">
            {!isImageLoaded && <ImagePlaceholder />}
            <img
              src={message.imageUrl}
              alt="Illustration Médicale"
              className={`rounded-lg max-w-sm w-full cursor-zoom-in ${isImageLoaded ? 'block' : 'hidden'}`}
              onLoad={() => setIsImageLoaded(true)}
              onClick={(e) => {
                  e.stopPropagation();
                  onImageClick(message.imageUrl!);
              }}
            />
          </div>
        )}
      </div>

      {!isUser && message.text && (
         <div className="flex-shrink-0 self-center flex flex-col gap-1 opacity-50 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
           <button
             onClick={handleCopy}
             className="text-gray-500 hover:text-pink-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
             aria-label="Copier le texte"
           >
             <CopyIcon />
           </button>
           {typeof navigator.share !== 'undefined' && (
              <button
                onClick={handleShare}
                className="text-gray-500 hover:text-pink-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Partager le texte"
              >
                <ShareIcon />
              </button>
           )}
        </div>
      )}
    </div>
  );
};

const TypingIndicator = () => (
    <div className="flex items-end gap-2 justify-start">
        <div className="relative max-w-xl rounded-2xl p-4 shadow bg-white text-gray-800 rounded-bl-none">
            <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
);


export const ConversationView: React.FC<ConversationViewProps> = ({ conversation, currentInputTranscription, isAiTyping, onImageClick }) => {
    const conversationEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, currentInputTranscription, isAiTyping]);

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-6 overflow-y-auto flex flex-col">
            {conversation.length === 0 && !isAiTyping && !currentInputTranscription ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-white p-4">
                     <div className="bg-black/30 backdrop-blur-sm p-8 rounded-2xl">
                        <img src="https://res.cloudinary.com/dxy0fiahv/image/upload/v1760883038/logo_Dr-T_sqgqy5.png" alt="Logo" className="w-24 h-24 mb-4 mx-auto" />
                        <h2 className="text-2xl font-bold">Bonjour Docteur.</h2>
                        <p className="text-lg text-white/80 mt-2 max-w-md">Je suis TerranoGyneco. Appuyez sur le microphone pour commencer.</p>
                     </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {conversation.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} onImageClick={onImageClick} />
                    ))}
                    {currentInputTranscription && (
                         <div className="flex justify-end">
                            <div className="max-w-xl rounded-2xl p-4 shadow bg-pink-500 text-white/70 rounded-br-none italic">
                               <p>{currentInputTranscription}...</p>
                            </div>
                        </div>
                    )}
                    {isAiTyping && <TypingIndicator />}
                    <div ref={conversationEndRef} />
                </div>
            )}
        </div>
    );
};
