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

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string; 
  licenseId: string;
  status: 'pending' | 'approved';
  isAdmin: boolean;
}
