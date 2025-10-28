export enum Sender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  imageUrl?: string;
}

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  licenseId: string;
  status: 'pending' | 'approved';
  isAdmin: boolean;
  authMethod: 'email' | 'google';
}