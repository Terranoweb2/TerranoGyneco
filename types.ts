
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
