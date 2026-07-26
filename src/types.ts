export interface Comment {
  id: string;
  username: string;
  userAvatar: string;
  text: string;
  time: string;
  userId?: string;
}

export interface Post {
  id: string;
  username: string;
  userAvatar: string;
  userId?: string;
  image: string;
  caption: string;
  location: string;
  time: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isSaved: boolean;
  mood: string;
  tags: string[];
  likedBy?: string[];
  savedBy?: string[];
}

export interface Story {
  id: string;
  username: string;
  userAvatar: string;
  userId?: string;
  mediaUrl: string;
  caption: string;
  mood?: string;
}

export interface Message {
  id: string;
  sender: 'me' | 'luna' | 'neon_wanderer' | 'night_owl' | string;
  text: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: any;
  timestampFormatted?: string;
}

export interface ChatParticipantProfile {
  uid: string;
  username: string;
  displayName: string;
  avatar: string;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantProfiles: { [uid: string]: ChatParticipantProfile };
  lastMessage?: string;
  lastMessageTime?: string;
  updatedAt?: any;
  isAICompanion?: boolean;
}

export interface UserProfile {
  uid?: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  stars: number;
}
