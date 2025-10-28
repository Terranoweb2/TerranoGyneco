

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob, GenerateContentResponse } from '@google/genai';
import { Header } from '../components/Header';
import { ConversationView } from '../components/ConversationView';
import { ChatMessage, Sender } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audio';
import { SettingsModal } from '../components/SettingsModal';
import { HistoryPanel } from '../components/HistoryPanel';
import { ImageZoomModal } from '../components/ImageZoomModal';

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

const ChatPage: React.FC = () => {
    const [status, setStatus] = useState<Status>('IDLE');
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [micSensitivity, setMicSensitivity] = useState(1.0);
    const [isEnding, setIsEnding] = useState(false);
    const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const playingSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const isEndingRef = useRef(isEnding);

    useEffect(() => {
        isEndingRef.current = isEnding;
    }, [isEnding]);

    const generateMedicalIllustrationFunction: FunctionDeclaration = {
        name: 'generate_medical_illustration',
        description: "Génère une illustration médicalement précise basée sur une description textuelle. À utiliser lorsque l'utilisateur demande une image, un diagramme ou une illustration.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                prompt: {
                    type: Type.STRING,
                    description: 'Une description détaillée de l\'illustration médicale à générer. Par exemple : "une illustration de l\'endométriose sur les ovaires".',
                },
            },
            required: ['prompt'],
        },
    };

    const generateImage = useCallback(async (prompt: string, turnId: string) => {
        setStatus('THINKING');
        setConversation(prev => [
            ...prev,
            { id: `image-status-${Date.now()}`, sender: Sender.System, text: `Génération de l'illustration pour : "${prompt}"...` }
        ]);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                const base64ImageBytes: string = imagePart.inlineData.data;
                const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
                
                setConversation(prev => {
                    const newConversation = [...prev];
                    const aiTurnIndex = newConversation.findIndex(msg => msg.id === turnId);
                    if (aiTurnIndex !== -1) {
                        newConversation[aiTurnIndex].imageUrl = imageUrl;
                    }
                    // remove status message
                    return newConversation.filter(msg => !msg.id.startsWith('image-status-'));
                });

            } else {
                 throw new Error("No image data returned from API.");
            }

        } catch (error) {
            console.error('Image generation failed:', error);
             setConversation(prev => [
                ...prev,
                { id: `image-error-${Date.now()}`, sender: Sender.System, text: `Échec de la génération de l'illustration. Veuillez réessayer.` }
            ]);
        } finally {
             if (!isEndingRef.current) {
                setStatus('LISTENING');
            }
        }
    }, []);

    const stopConversation = useCallback(async () => {
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
        if (gainNodeRef.current) {
            gainNodeRef.current.disconnect();
            gainNodeRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
    }, []);

    const endSessionPolitely = useCallback(async () => {
        if (isEndingRef.current) return;
        setIsEnding(true);
        setIsAiTyping(false);

        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }

        playingSourcesRef.current.forEach(source => source.stop());
        playingSourcesRef.current.clear();
        
        setCurrentInputTranscription('');

        try {
            setStatus('THINKING');
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: "Entendu. La session est terminée. N'hésitez pas si vous avez d'autres questions plus tard. Au revoir." }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (base64Audio && outputAudioContextRef.current) {
                setStatus('SPEAKING');
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                const sourceNode = outputAudioContextRef.current.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(outputAudioContextRef.current.destination);
                sourceNode.start();
                sourceNode.onended = () => {
                    stopConversation();
                };
            } else {
                throw new Error("Failed to generate goodbye audio.");
            }
        } catch (error) {
            console.error("Failed to end session politely:", error);
            stopConversation();
        }
    }, [stopConversation]);
    
    const handleSensitivityChange = (value: number) => {
        setMicSensitivity(value);
        if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = value;
        }
    };

    const initAudio = async () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (!outputAudioContextRef.current || outputAudioContextRef.current.state === 'closed') {
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (outputAudioContextRef.current.state === 'suspended') {
            await outputAudioContextRef.current.resume();
        }

        if (!mediaStreamRef.current || mediaStreamRef.current.getTracks().every(t => t.readyState === 'ended')) {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
    };


    const startConversation = useCallback(async () => {
        setStatus('LISTENING');
        setConversation([]);

        try {
            await initAudio();
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            let nextStartTime = 0;
            let tempInput = '';
            let tempOutput = '';
            let aiTurnId = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    systemInstruction: "Vous êtes TerranoGyneco, un assistant médical IA de pointe spécialisé en gynécologie. Vous conversez avec un gynécologue professionnel. Fournissez des réponses précises, détaillées et basées sur des preuves à leurs questions. Votre ton doit être professionnel, précis et collaboratif. Lorsqu'on vous demande une illustration ou une image, utilisez l'outil `generate_medical_illustration` pour créer une image médicalement précise pour appuyer votre explication.",
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [generateMedicalIllustrationFunction] }],
                },
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
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                const sample = inputData[i] * 32768;
                                int16[i] = Math.max(-32768, Math.min(32767, sample));
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
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
                                setConversation(prev => [...prev, { id: `user-${Date.now()}`, sender: Sender.User, text: tempInput.trim() }]);
                            }
                            tempInput = '';
                            setCurrentInputTranscription('');
                            setIsAiTyping(true);
                            aiTurnId = `ai-${Date.now()}`;
                        }

                        if (message.serverContent) {
                            if (message.serverContent.speechRecognitionError) {
                                console.error('Erreur de reconnaissance vocale:', message.serverContent.speechRecognitionError);
                                setConversation(prev => [
                                    ...prev,
                                    {
                                        id: `transcription-error-${Date.now()}`,
                                        sender: Sender.System,
                                        text: "Désolé, une erreur de transcription est survenue. Veuillez réessayer de parler."
                                    }
                                ]);
                                tempInput = '';
                                setCurrentInputTranscription('');
                            }

                            if (message.serverContent.inputTranscription) {
                                tempInput += message.serverContent.inputTranscription.text;
                                setCurrentInputTranscription(tempInput);
                                
                                const normalizedInput = tempInput.toLowerCase().trim().replace(/[.,!?]/g, '');
                                const shouldStop = STOP_PHRASES.some(phrase => normalizedInput.endsWith(phrase));
                                if (shouldStop) {
                                    endSessionPolitely();
                                    return;
                                }
                            }
                            if (message.serverContent.outputTranscription) {
                                tempOutput += message.serverContent.outputTranscription.text;
                            }

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
                                    setConversation(prev => [...prev, { id: aiTurnId, sender: Sender.AI, text: tempOutput.trim() }]);
                                }
                                tempInput = '';
                                tempOutput = '';
                                setCurrentInputTranscription('');
                                aiTurnId = '';
                            }
                        }
                        if (message.toolCall?.functionCalls) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'generate_medical_illustration' && fc.args.prompt) {
                                    await generateImage(fc.args.prompt, aiTurnId);
                                    sessionPromiseRef.current?.then(session => session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result: "OK, la génération de l'image a été déclenchée." } }
                                    }));
                                }
                            }
                        }
                    },
                    onclose: () => {
                        if (!isEndingRef.current) {
                            console.log('Session fermée inopinément.');
                             setStatus('ERROR');
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Erreur de session:', e);
                        if (!isEndingRef.current) {
                            setStatus('ERROR');
                            stopConversation();
                        }
                    },
                },
            });

        } catch (error) {
            console.error('Échec du démarrage de la conversation:', error);
            setStatus('ERROR');
        }
    }, [stopConversation, generateImage, generateMedicalIllustrationFunction, micSensitivity, endSessionPolitely]);
    
    useEffect(() => {
        return () => {
            stopConversation();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
                outputAudioContextRef.current.close();
            }
        }
    }, [stopConversation]);

    const handleButtonClick = () => {
        if (status === 'IDLE' || status === 'ERROR') {
            startConversation();
        } else {
            if (!isEnding) {
                 endSessionPolitely();
            }
        }
    };

    const handleImageZoom = (url: string) => {
        setZoomedImageUrl(url);
    };

    const handleCloseZoom = () => {
        setZoomedImageUrl(null);
    };

    const getStatusText = () => {
        if(isEnding) return 'Fin de la session...';
        switch(status){
            case 'IDLE': return 'Appuyez pour démarrer la conversation';
            case 'LISTENING': return 'Écoute...';
            case 'THINKING': return 'Réflexion...';
            case 'SPEAKING': return 'Parle...';
            case 'ERROR': return 'Une erreur est survenue. Appuyez pour redémarrer.';
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
            />
            <HistoryPanel
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                conversation={conversation}
            />
            <ImageZoomModal imageUrl={zoomedImageUrl} onClose={handleCloseZoom} />
             <main className="flex-1 flex flex-col overflow-hidden relative" style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://images.unsplash.com/photo-1587327901593-3701363675a8')", backgroundSize: 'cover', backgroundPosition: 'center'}}>
                <ConversationView 
                    conversation={conversation} 
                    currentInputTranscription={currentInputTranscription} 
                    isAiTyping={isAiTyping}
                    onImageClick={handleImageZoom}
                />
                <footer className="w-full p-4 bg-white/50 backdrop-blur-sm border-t border-gray-200">
                    <div className="max-w-5xl mx-auto flex flex-col items-center gap-3">
                        <button
                            onClick={handleButtonClick}
                            className={`relative flex items-center justify-center w-20 h-20 rounded-full text-white transition-all duration-300 ease-in-out shadow-lg transform hover:scale-105 ${isConversationActive ? 'bg-red-500' : 'bg-pink-500'}`}
                            aria-label={!isConversationActive ? 'Démarrer la conversation' : 'Arrêter la conversation'}
                            disabled={isEnding}
                        >
                           {status === 'LISTENING' && <div className="absolute w-full h-full bg-pink-400 rounded-full animate-ping"></div>}
                           {!isConversationActive ? <MicIcon className="w-8 h-8" /> : <StopIcon className="w-8 h-8"/>}
                        </button>
                        <p className="text-gray-600 font-medium h-5">{getStatusText()}</p>
                    </div>
                </footer>
            </main>
        </>
    );
};

export default ChatPage;
