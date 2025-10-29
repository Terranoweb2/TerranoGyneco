import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob, GenerateContentResponse } from '@google/genai';
import { ConversationView } from '../components/ConversationView';
import { ChatMessage, Sender, StoredConversation, Source } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { SettingsModal } from '../components/SettingsModal';
import { HistoryPanel } from '../components/HistoryPanel';
import { ImageZoomModal } from '../components/ImageZoomModal';
import { Theme } from '../App';

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
    conversationData: StoredConversation;
    allConversations: StoredConversation[];
    onSaveConversation: (id: string, messages: ChatMessage[], title?: string) => void;
    onStartNewConversation: () => void;
    onLoadConversation: (id: string) => void;
    onRenameConversation: (id: string, newTitle: string) => void;
    onDeleteConversation: (id: string) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    isHistoryOpen: boolean;
    setIsHistoryOpen: (isOpen: boolean) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const SETTINGS_KEY = 'terrano-gyneco-settings';


const ChatPage: React.FC<ChatPageProps> = ({
    conversationData,
    allConversations,
    onSaveConversation,
    onStartNewConversation,
    onLoadConversation,
    onRenameConversation,
    onDeleteConversation,
    isSettingsOpen,
    setIsSettingsOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    theme,
    setTheme
}) => {
    const [status, setStatus] = useState<Status>('IDLE');
    const [conversation, setConversation] = useState<ChatMessage[]>(conversationData.messages);
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [micSensitivity, setMicSensitivity] = useState(1.0);
    const [isTranscriptionEnabled, setIsTranscriptionEnabled] = useState(true);
    const [aiVoice, setAiVoice] = useState('Kore');
    const [isEnding, setIsEnding] = useState(false);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState('');

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

    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    // --- Settings Management ---
    useEffect(() => {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const { sensitivity, transcription, voice } = JSON.parse(savedSettings);
            if (sensitivity) setMicSensitivity(sensitivity);
            if (typeof transcription === 'boolean') setIsTranscriptionEnabled(transcription);
            if (voice) setAiVoice(voice);
        }
    }, []);

    useEffect(() => {
        const settings = { sensitivity: micSensitivity, transcription: isTranscriptionEnabled, voice: aiVoice };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [micSensitivity, isTranscriptionEnabled, aiVoice]);
    
    const handleDeleteMessage = useCallback((messageId: string) => {
        setConversation(prev => {
            const updated = prev.filter(msg => msg.id !== messageId);
            onSaveConversation(conversationData.id, updated);
            return updated;
        });
    }, [onSaveConversation, conversationData.id]);

    // --- Auto-Save Logic ---
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            const isActive = statusRef.current !== 'IDLE' && statusRef.current !== 'ERROR';
            const hasMessages = conversationRef.current.length > 0;

            if (isActive && hasMessages) {
                onSaveConversation(conversationData.id, conversationRef.current);
                setAutoSaveStatus('Sauvegarde automatique...');
                setTimeout(() => setAutoSaveStatus(''), 3000); // Clear message after 3 seconds
            }
        }, 120000); // 2 minutes

        return () => {
            clearInterval(autoSaveInterval);
        };
    }, [onSaveConversation, conversationData.id]);
    
    const handleClearCache = () => {
        console.log("Clearing application cache...");
        localStorage.clear();
        window.location.reload();
    };

    // --- Core Conversation Logic ---

    const generateMedicalIllustrationFunction: FunctionDeclaration = {
        name: 'generate_medical_illustration',
        description: "Génère une illustration médicalement précise basée sur une description textuelle. À utiliser lorsque l'utilisateur demande une image, un diagramme ou une illustration.",
        parameters: { type: Type.OBJECT, properties: { prompt: { type: Type.STRING, description: 'Une description détaillée de l\'illustration médicale à générer.' } }, required: ['prompt'] },
    };

    const searchProfessionalSourcesFunction: FunctionDeclaration = {
        name: 'search_professional_sources',
        description: "Recherche sur le web des sources médicales professionnelles et fiables (études, articles de recherche, directives cliniques) sur un sujet donné. À utiliser lorsque la question nécessite des informations factuelles à jour ou des références.",
        parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: 'Le sujet de recherche précis.' } }, required: ['query'] },
    };
    
    const executeSearch = async (query: string, turnId: string): Promise<string> => {
        setStatus('THINKING');
        setConversation(prev => [...prev, { id: `search-status-${Date.now()}`, sender: Sender.System, text: `Recherche de sources pour : "${query}"...` }]);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const prompt = `Analysez les résultats de recherche pour la requête "${query}" et fournissez une réponse au format JSON. Le JSON doit avoir deux clés: "summary" (une synthèse en français des informations) et "sources" (un tableau d'objets avec "title", "uri", et "snippet" pour chaque source). Ne renvoyez que l'objet JSON brut.`;

            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { tools: [{googleSearch: {}}] },
            });

            setConversation(prev => prev.filter(msg => !msg.id.startsWith('search-status-')));
            
            let summary = response.text; // Default to full text if parsing fails
            let sources: Source[] = [];
            
            try {
                let jsonString = response.text.trim();
                const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonMatch && jsonMatch[1]) {
                    jsonString = jsonMatch[1];
                }

                const result = JSON.parse(jsonString);
                
                if (result.summary && typeof result.summary === 'string') {
                    summary = result.summary;
                }
                if (result.sources && Array.isArray(result.sources)) {
                    sources = result.sources.filter(s => s.uri && s.title && s.snippet);
                }
            } catch (e) {
                console.warn("Failed to parse JSON from search result, using fallback.", e);
                // JSON parsing failed, use grounding chunks as a fallback for sources.
                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                sources = groundingChunks
                    .map(chunk => chunk.web)
                    .filter((web): web is { uri: string; title: string; } => !!web && !!web.uri)
                    .map(web => ({ uri: web.uri, title: web.title || web.uri }));
            }

            if (sources.length > 0) {
                 setConversation(prev => {
                    const newConversation = [...prev];
                    const aiTurnIndex = newConversation.findIndex(msg => msg.id === turnId);
                    if (aiTurnIndex !== -1) {
                        newConversation[aiTurnIndex].sources = [...(newConversation[aiTurnIndex].sources || []), ...sources];
                    } else {
                        // This case might happen if turn hasn't been created yet.
                        newConversation.push({ id: turnId, sender: Sender.AI, text: '', sources });
                    }
                    return newConversation;
                });
            }
            return summary;
        } catch (error) {
            console.error("La recherche de sources a échoué:", error);
            setConversation(prev => [...prev.filter(msg => !msg.id.startsWith('search-status-')), { id: `search-error-${Date.now()}`, sender: Sender.System, text: `Échec de la recherche de sources.` }]);
            return "Désolé, une erreur est survenue lors de la recherche d'informations.";
        }
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
        
        if (finalMessages.length > 0) {
             onSaveConversation(conversationData.id, finalMessages);
        }

    }, [onSaveConversation, conversationData.id]);

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
                systemInstruction: "Vous êtes TerranoGyneco, un assistant IA expert en gynécologie pour un médecin. Écoutez patiemment. Si une question nécessite des données factuelles, des études récentes ou des références, utilisez l'outil `search_professional_sources`. Pour les demandes d'images, utilisez `generate_medical_illustration`. Soyez prêt à être interrompu ; si le médecin parle, arrêtez-vous et écoutez.",
                tools: [{ functionDeclarations: [generateMedicalIllustrationFunction, searchProfessionalSourcesFunction] }],
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
                                    if (newConversation.length === 1 && conversationData.title === "Nouvelle Conversation") {
                                        const newTitle = userMessage.text.split(' ').slice(0, 5).join(' ') + (userMessage.text.split(' ').length > 5 ? '...' : '');
                                        onRenameConversation(conversationData.id, newTitle);
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
                                    sessionPromiseRef.current?.then(session => session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "OK, l'illustration a été générée et est maintenant visible." } } }));
                                }
                                if (fc.name === 'search_professional_sources' && fc.args.query) {
                                    const searchResult = await executeSearch(fc.args.query, aiTurnId);
                                    sessionPromiseRef.current?.then(session => session.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: searchResult } } }));
                                }
                            }
                        }
                    },
                    onclose: () => { if (!isEndingRef.current) setStatus('ERROR'); },
                    onerror: (e: ErrorEvent) => { console.error('Erreur de session:', e); if (!isEndingRef.current) setStatus('ERROR'); },
                },
            });
        } catch (error) { console.error('Échec du démarrage de la conversation:', error); setStatus('ERROR'); }
    }, [aiVoice, isTranscriptionEnabled, micSensitivity, endSessionPolitely, generateImage, onRenameConversation, conversationData.id, conversationData.title]);
    
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
            case 'THINKING': return 'Recherche...';
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
                theme={theme}
                onThemeChange={setTheme}
            />
            <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                conversations={allConversations}
                activeConversationId={conversationData.id}
                onLoadConversation={onLoadConversation}
                onNewConversation={onStartNewConversation}
                onRenameConversation={onRenameConversation}
                onDeleteConversation={onDeleteConversation}
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
                <footer className="w-full p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
                    <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
                        <div className="relative h-20 w-20">
                            <button
                                onClick={handleButtonClick}
                                className={`relative flex items-center justify-center w-20 h-20 rounded-full text-white transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 ${isConversationActive ? 'bg-red-500' : 'bg-pink-500'}`}
                                aria-label={!isConversationActive ? 'Démarrer la conversation' : 'Arrêter la conversation'}
                                disabled={isEnding}
                            >
                               {status === 'LISTENING' && <div className="absolute w-full h-full bg-pink-400 rounded-full animate-ping"></div>}
                               {status === 'THINKING' && <div className="absolute w-full h-full bg-blue-400 rounded-full animate-ping"></div>}
                               {!isConversationActive ? <MicIcon className="w-8 h-8" /> : <StopIcon className="w-8 h-8"/>}
                            </button>
                        </div>
                        <p className="text-gray-800 dark:text-gray-300 font-medium h-5 transition-opacity duration-300">
                            {autoSaveStatus || getStatusText()}
                        </p>
                    </div>
                </footer>
            </main>
        </>
    );
};

export default ChatPage;