export enum Sender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export interface Source {
  uri: string;
  title: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  imageUrl?: string;
  sources?: Source[];
}

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}