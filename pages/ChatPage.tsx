import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { ConversationView } from '../components/ConversationView';
import { ChatMessage, Sender, StoredConversation } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { SettingsModal } from '../components/SettingsModal';
import { HistoryPanel } from '../components/HistoryPanel';
import { ImageZoomModal } from '../components/ImageZoomModal';
import { useAuth } from '../contexts/AuthContext';

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 11-13.5 0v-1.5A.75.75 0 016 10.5z" />
    </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3-3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
);

const STOP_PHRASES = [
  "c'est bon", "ça va comme ça", "ça suffit", "merci c'est tout",
  "c'est tout merci", "arrête", "stop", "terminer la session",
  "terminer la conversation", "fin de la conversation", "au revoir"
];

type Status = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR';

interface ChatPageProps {
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    isHistoryOpen: boolean;
    setIsHistoryOpen: (isOpen: boolean) => void;
}

const CONVERSATIONS_KEY = 'terrano-gyneco-conversations';
const SETTINGS_KEY = 'terrano-gyneco-settings';


const ChatPage: React.FC<ChatPageProps> = ({ isSettingsOpen, setIsSettingsOpen, isHistoryOpen, setIsHistoryOpen }) => {
    const [status, setStatus] = useState<Status>('IDLE');
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [micSensitivity, setMicSensitivity] = useState(1.0);
    const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
    const [aiVoice, setAiVoice] = useState('Kore');
    const [isEnding, setIsEnding] = useState(false);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
    const [allConversations, setAllConversations] = useState<StoredConversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');

    const { logout } = useAuth();

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const playingSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    
    const isEndingRef = useRef(isEnding);
    useEffect(() => { isEndingRef.current = isEnding; }, [isEnding]);

    const conversationRef = useRef(conversation);
    useEffect(() => { conversationRef.current = conversation; }, [conversation]);

    const activeConversationIdRef = useRef(activeConversationId);
    useEffect(() => { activeConversationIdRef.current = activeConversationId; }, [activeConversationId]);

    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    // --- History & Settings Management ---
    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const { sensitivity, transcription, voice } = JSON.parse(savedSettings);
            if (sensitivity) setMicSensitivity(sensitivity);
            if (typeof transcription === 'boolean') setIsTranscriptionEnabled(transcription);
            if (voice) setAiVoice(voice);
        }

        const savedConversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') as StoredConversation[];
        setAllConversations(savedConversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        
        if (savedConversations.length > 0) {
            loadConversation(savedConversations[0].id, savedConversations);
        } else {
            startNewConversation([]);
        }
    }, []);

    useEffect(() => {
        const settings = { sensitivity: micSensitivity, transcription: isTranscriptionEnabled, voice: aiVoice };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [micSensitivity, isTranscriptionEnabled, aiVoice]);

    const saveConversation = useCallback((id: string, messages: ChatMessage[], title?: string) => {
        const conversations = JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') as StoredConversation[];
        const convoIndex = conversations.findIndex(c => c.id === id);

        if (convoIndex !== -1) {
            if (messages.length > 0) {
                conversations[convoIndex].messages = messages;
                if(title) conversations[convoIndex].title = title;
                // Move updated conversation to the top
                const updatedConvo = conversations.splice(convoIndex, 1)[0];
                conversations.unshift(updatedConvo);
            } else {
                // If conversation is empty, remove it
                conversations.splice(convoIndex, 1);
            }
        }
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
        setAllConversations(conversations);
    }, []);

    const startNewConversation = useCallback((currentConversations: StoredConversation[]) => {
        if (statusRef.current !== 'IDLE' && statusRef.current !== 'ERROR') return;
        
        const newId = `convo-${Date.now()}`;
        const newConversation: StoredConversation = { id: newId, title: "Nouvelle Conversation", createdAt: new Date().toISOString(), messages: [] };
        
        const updatedConversations = [newConversation, ...currentConversations];
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConversations));

        setAllConversations(updatedConversations);
        setActiveConversationId(newId);
        setConversation([]);
        setStatus('IDLE');
        if (isHistoryOpen) setIsHistoryOpen(false);
    }, [isHistoryOpen]);

    const loadConversation = useCallback((id: string, allConversationsList?: StoredConversation[]) => {
        if (statusRef.current !== 'IDLE' && statusRef.current !== 'ERROR') return;
        const conversationsToSearch = allConversationsList || allConversations;
        const conversationToLoad = conversationsToSearch.find(c => c.id === id);
        if (conversationToLoad) {
            setActiveConversationId(conversationToLoad.id);
            setConversation(conversationToLoad.messages);
        }
        if (isHistoryOpen) setIsHistoryOpen(false);
    }, [allConversations, isHistoryOpen]);

    const renameConversation = useCallback((id: string, newTitle: string) => {
        const updatedConversations = allConversations.map(c => c.id === id ? { ...c, title: newTitle } : c);
        setAllConversations(updatedConversations);
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConversations));
    }, [allConversations]);

    const deleteConversation = useCallback((id: string) => {
        const updatedConversations = allConversations.filter(c => c.id !== id);
        setAllConversations(updatedConversations);
        localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updatedConversations));

        if (activeConversationIdRef.current === id) {
            if (updatedConversations.length > 0) {
                loadConversation(updatedConversations[0].id, updatedConversations);
            } else {
                startNewConversation([]);
            }
        }
    }, [allConversations, loadConversation, startNewConversation]);

    const handleDeleteMessage = useCallback((messageId: string) => {
        setConversation(prev => {
            const updated = prev.filter(msg => msg.id !== messageId);
            if (activeConversationIdRef.current) {
                saveConversation(activeConversationIdRef.current, updated);
            }
            return updated;
        });
    }, [saveConversation]);

    // --- Auto-Save Logic ---
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            const isActive = statusRef.current !== 'IDLE' && statusRef.current !== 'ERROR';
            const hasMessages = conversationRef.current.length > 0;
            const currentId = activeConversationIdRef.current;

            if (isActive && hasMessages && currentId) {
                saveConversation(currentId, conversationRef.current);
                setAutoSaveStatus('Sauvegarde automatique...');
                setTimeout(() => setAutoSaveStatus(''), 3000); // Clear message after 3 seconds
            }
        }, 120000); // 2 minutes

        return () => {
            clearInterval(autoSaveInterval);
        };
    }, [saveConversation]);
    
    const handleClearCache = () => {
        console.log("Clearing application cache...");
        
        localStorage.removeItem(CONVERSATIONS_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        
        logout().then(() => {
            window.location.reload();
        });
    };

    // --- Core Conversation Logic ---

    const generateMedicalIllustrationFunction: FunctionDeclaration = {
        name: 'generate_medical_illustration',
        description: "Génère une illustration médicalement précise basée sur une description textuelle. À utiliser lorsque l'utilisateur demande une image, un diagramme ou une illustration.",
        parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING, description: 'Une description détaillée de l\'illustration médicale à générer.' } }, required: ['prompt'] },
    };

    const generateImage = useCallback(async (prompt: string, turnId: string) => {
        setStatus('THINKING');
        setConversation(prev => [...prev, { id: `image-status-${Date.now()}`, sender: Sender.System, text: `Génération de l'illustration pour : "${prompt}"...` }]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const enhancedPrompt = `Illustration médicale de style diagramme, scientifiquement exacte et clairement étiquetée de : ${prompt}. Fond neutre.`;
            const response = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: enhancedPrompt, config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' } });
            const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            if (base64ImageBytes) {
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setConversation(prev => {
                    const newConversation = prev.filter(msg => !msg.id.startsWith('image-status-'));
                    const aiTurnIndex = newConversation.findIndex(msg => msg.id === turnId);
                    if (aiTurnIndex !== -1) {
                        newConversation[aiTurnIndex].imageUrl = imageUrl;
                    } else {
                        newConversation.push({ id: turnId, sender: Sender.AI, text: '', imageUrl: imageUrl });
                    }
                    return newConversation;
                });
            } else { throw new Error("Aucune donnée d'image retournée par l'API."); }
        } catch (error) {
            console.error("La génération d'image a échoué:", error);
            setConversation(prev => [...prev.filter(msg => !msg.id.startsWith('image-status-')), { id: `image-error-${Date.now()}`, sender: Sender.System, text: `Échec de la génération de l'illustration.` }]);
        } finally { if (!isEndingRef.current) setStatus('LISTENING'); }
    }, []);

    const stopConversation = useCallback(async () => {
        const finalMessages = conversationRef.current;
        const activeId = activeConversationIdRef.current;
        
        setStatus('IDLE');
        setCurrentInputTranscription('');
        setIsAiTyping(false);
        setIsEnding(false);

        playingSourcesRef.current.forEach(source => source.stop());
        playingSourcesRef.current.clear();

        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) { console.error("Error closing session:", e); }
            sessionPromiseRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current = null;
        }
        if (gainNodeRef.current) { gainNodeRef.current.disconnect(); gainNodeRef.current = null; }
        if (mediaStreamSourceRef.current) { mediaStreamSourceRef.current.disconnect(); mediaStreamSourceRef.current = null; }
        if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(track => track.stop()); mediaStreamRef.current = null; }
        
        if (activeId && finalMessages.length > 0) {
             saveConversation(activeId, finalMessages);
        }

    }, [saveConversation]);

    const endSessionPolitely = useCallback(async () => {
        if (isEndingRef.current) return;
        setIsEnding(true);
        setIsAiTyping(false);
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) { console.error("Error closing live session:", e); }
            sessionPromiseRef.current = null;
        }
        playingSourcesRef.current.forEach(source => source.stop());
        playingSourcesRef.current.clear();
        setCurrentInputTranscription('');
        const goodbyeText = "Entendu. La session est terminée. N'hésitez pas si vous avez d'autres questions. Au revoir.";
        try {
            if (outputAudioContextRef.current && outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();
            setStatus('THINKING');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: goodbyeText }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: aiVoice } } } } });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                setConversation(prev => [...prev, { id: `ai-goodbye-${Date.now()}`, sender: Sender.AI, text: goodbyeText }]);
                setStatus('SPEAKING');
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                const sourceNode = outputAudioContextRef.current.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(outputAudioContextRef.current.destination);
                sourceNode.start();
                sourceNode.onended = stopConversation;
            } else { throw new Error("Failed to generate goodbye audio."); }
        } catch (error) {
            console.error("Failed to end session politely:", error);
            setConversation(prev => [...prev, { id: `ai-goodbye-fallback-${Date.now()}`, sender: Sender.AI, text: goodbyeText }]);
            stopConversation();
        }
    }, [stopConversation, aiVoice]);
    
    const handleSensitivityChange = (value: number) => {
        setMicSensitivity(value);
        if (gainNodeRef.current) gainNodeRef.current.gain.value = value;
    };

    const initAudio = async () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();
        if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().every(t => t.readyState === 'ended')) mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    };

    const startConversation = useCallback(async () => {
        setStatus('LISTENING');
        try {
            await initAudio();
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            let nextStartTime = 0; let tempInput = ''; let tempOutput = ''; let aiTurnId = '';
            const liveConfig: any = {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: aiVoice } } },
                systemInstruction: "Vous êtes TerranoGyneco, un assistant IA médical expert en gynécologie et médecine générale pour un médecin. Écoutez avec une extrême patience, même si les questions sont longues ou hésitantes. Prenez toujours en compte la dernière correction de l'utilisateur. Adoptez un ton calme, humain et réfléchi. Vos réponses doivent être d'une précision clinique irréprochable. Soyez prêt à être interrompu ; si le médecin recommence à parler, arrêtez-vous immédiatement et écoutez. Pour toute demande d'image, utilisez l'outil `generate_medical_illustration`.",
                tools: [{ functionDeclarations: [generateMedicalIllustrationFunction] }],
            };
            if (isTranscriptionEnabled) { liveConfig.inputAudioTranscription = {}; liveConfig.outputAudioTranscription = {}; }

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: liveConfig,
                callbacks: {
                    onopen: () => {
                        const source = audioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        gainNodeRef.current = audioContextRef.current!.createGain();
                        gainNodeRef.current.gain.value = micSensitivity;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            if (!scriptProcessorRef.current) return;
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length; const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                            const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(gainNodeRef.current);
                        gainNodeRef.current.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (isEndingRef.current) return;
                        const isStartingAiTurn = (message.serverContent?.outputTranscription || message.serverContent?.modelTurn || message.toolCall) && !aiTurnId;
                        if (isStartingAiTurn) {
                            if (tempInput.trim()) {
                                const userMessage: ChatMessage = { id: `user-${Date.now()}`, sender: Sender.User, text: tempInput.trim() };
                                setConversation(prev => {
                                    const newConversation = [...prev, userMessage];
                                    if (newConversation.length === 1 && activeConversationIdRef.current) {
                                        const newTitle = userMessage.text.split(' ').slice(0, 5).join(' ') + (userMessage.text.split(' ').length > 5 ? '...' : '');
                                        renameConversation(activeConversationIdRef.current, newTitle);
                                    }
                                    return newConversation;
                                });
                            }
                            tempInput = ''; setCurrentInputTranscription(''); setIsAiTyping(true); aiTurnId = `ai-${Date.now()}`;
                        }
                        if (message.serverContent) {
                             if (message.serverContent.inputTranscription) {
                                if (playingSourcesRef.current.size > 0) {
                                    playingSourcesRef.current.forEach(source => source.stop());
                                    playingSourcesRef.current.clear();
                                }
                                tempInput += message.serverContent.inputTranscription.text;
                                setCurrentInputTranscription(tempInput);
                                const normalizedInput = tempInput.toLowerCase().trim().replace(/[.,!?]/g, '');
                                if (STOP_PHRASES.some(phrase => normalizedInput.endsWith(phrase))) { endSessionPolitely(); return; }
                            }
                            if (message.serverContent.outputTranscription) tempOutput += message.serverContent.outputTranscription.text;
                            const base64Audio = message.serverContent.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) {
                                setStatus('SPEAKING');
                                nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current!.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current!, 24000, 1);
                                const sourceNode = outputAudioContextRef.current!.createBufferSource();
                                sourceNode.buffer = audioBuffer;
                                sourceNode.connect(outputAudioContextRef.current!.destination);
                                sourceNode.addEventListener('ended', () => {
                                    playingSourcesRef.current.delete(sourceNode);
                                    if(playingSourcesRef.current.size === 0 && !isEndingRef.current) setStatus('LISTENING');
                                });
                                sourceNode.start(nextStartTime);
                                nextStartTime += audioBuffer.duration;
                                playingSourcesRef.current.add(sourceNode);
                            }
                            if (message.serverContent.turnComplete) {
                                setIsAiTyping(false);
                                if (tempOutput.trim()) {
                                    setConversation(prev => {
                                        const newConversation = [...prev];
                                        const aiTurnIndex = newConversation.findIndex(msg => msg.id === aiTurnId);
                                        if (aiTurnIndex !== -1) newConversation[aiTurnIndex].text = tempOutput.trim();
                                        else newConversation.push({ id: aiTurnId, sender: Sender.AI, text: tempOutput.trim() });
                                        return newConversation;
                                    });
                                }
                                tempInput = ''; tempOutput = ''; setCurrentInputTranscription(''); aiTurnId = '';
                            }
                        }
                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'generate_medical_illustration' && fc.args.prompt) {
                                    await generateImage(fc.args.prompt, aiTurnId);
                                    sessionPromiseRef.current?.then(session => session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "OK" } } }));
                                }
                            }
                        }
                    },
                    onclose: () => { if (!isEndingRef.current) setStatus('ERROR'); },
                    onerror: (e: ErrorEvent) => { console.error('Erreur de session:', e); if (!isEndingRef.current) setStatus('ERROR'); },
                },
            });
        } catch (error) { console.error('Échec du démarrage de la conversation:', error); setStatus('ERROR'); }
    }, [aiVoice, isTranscriptionEnabled, micSensitivity, endSessionPolitely, generateImage, renameConversation]);
    
    useEffect(() => () => { stopConversation(); }, [stopConversation]);

    const handleButtonClick = () => {
        if (status === 'IDLE' || status === 'ERROR') startConversation();
        else if (!isEnding) endSessionPolitely();
    };

    const getStatusText = () => {
        if(isEnding) return 'Fin de la session...';
        switch(status){
            case 'IDLE': return 'Appuyez pour démarrer la conversation';
            case 'LISTENING': return 'Écoute...';
            case 'THINKING': return 'Réflexion...';
            case 'SPEAKING': return 'Parle...';
            case 'ERROR': return 'Erreur. Appuyez pour redémarrer.';
            default: return '';
        }
    }
    
    const isConversationActive = status !== 'IDLE' && status !== 'ERROR';

    return (
        <>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                sensitivity={micSensitivity}
                onSensitivityChange={handleSensitivityChange}
                isConversationActive={isConversationActive}
                isTranscriptionEnabled={isTranscriptionEnabled}
                onTranscriptionToggle={setIsTranscriptionEnabled}
                aiVoice={aiVoice}
                onAiVoiceChange={setAiVoice}
                onClearCache={handleClearCache}
            />
            <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                conversations={allConversations}
                activeConversationId={activeConversationId}
                onLoadConversation={loadConversation}
                onNewConversation={() => startNewConversation(allConversations)}
                onRenameConversation={renameConversation}
                onDeleteConversation={deleteConversation}
            />
            <ImageZoomModal imageUrl={zoomedImageUrl} onClose={() => setZoomedImageUrl(null)} />
             <main className="flex-1 flex flex-col overflow-hidden relative z-0" style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1587327901593-3701363675a8')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <ConversationView 
                    conversation={conversation} 
                    currentInputTranscription={currentInputTranscription} 
                    isAiTyping={isAiTyping}
                    onImageClick={setZoomedImageUrl}
                    onDeleteMessage={handleDeleteMessage}
                />
                <footer className="w-full p-4 bg-white/50 backdrop-blur-sm border-t border-gray-200">
                    <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
                        <div className="relative h-20 w-20">
                            <button
                                onClick={handleButtonClick}
                                className={`relative flex items-center justify-center w-20 h-20 rounded-full text-white transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 ${isConversationActive ? 'bg-red-500' : 'bg-pink-500'}`}
                                aria-label={!isConversationActive ? 'Démarrer la conversation' : 'Arrêter la conversation'}
                                disabled={isEnding}
                            >
                               {status === 'LISTENING' && <div className="absolute w-full h-full bg-pink-400 rounded-full animate-ping"></div>}
                               {!isConversationActive ? <MicIcon className="w-8 h-8" /> : <StopIcon className="w-8 h-8"/>}
                            </button>
                        </div>
                        <p className="text-gray-600 font-medium h-5 transition-opacity duration-300">
                            {autoSaveStatus || getStatusText()}
                        </p>
                    </div>
                </footer>
            </main>
        </>
    );
};

export default ChatPage;