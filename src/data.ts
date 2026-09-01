import { Post, Story, UserProfile, Message } from './types';

export const CURRENT_USER: UserProfile = {
  username: 'midnight_dreamer',
  displayName: 'Ray Mitchell',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio: 'Chasing neon signs, wet asphalt reflections, and late night espresso ☕✨ | Developer by day, Nightgrammer by night 🌌',
  followers: 432,
  following: 189,
  stars: 1240,
};

export const PRESET_SCENES = [
  {
    id: 'tokyo_cyber',
    name: 'Cyberpunk Tokyo',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?w=1000&auto=format&fit=crop&q=80',
    description: 'Neon signs glowing in the rain-soaked alleys of Shinjuku.',
  },
  {
    id: 'rainy_lights',
    name: 'Moody Rain Grid',
    url: 'https://images.unsplash.com/photo-1514924013511-c8f4117702a3?w=1000&auto=format&fit=crop&q=80',
    description: 'City traffic lights washing over wet concrete and steam.',
  },
  {
    id: 'neon_cafe',
    name: 'Midnight Café',
    url: 'https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?w=1000&auto=format&fit=crop&q=80',
    description: 'A cozy corner café glowing with warm tungsten bulbs.',
  },
  {
    id: 'starry_sky',
    name: 'Cosmic Camping',
    url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=1000&auto=format&fit=crop&q=80',
    description: 'The Milky Way stretching over a quiet pine forest tent.',
  },
  {
    id: 'highway_dusk',
    name: 'Neon Expressway',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1000&auto=format&fit=crop&q=80',
    description: 'Long exposure headlight streaks bridging across city skylines.',
  },
  {
    id: 'arcade_glow',
    name: 'Retro Arcade',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1000&auto=format&fit=crop&q=80',
    description: 'Vibrant blue and magenta cabinets shining in a dark arcade.',
  }
];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_MESSAGES: Message[] = [];

export const MOODS = [
  { name: 'All Vibes', icon: '✨' },
  { name: 'Urban Neon', icon: '🌌' },
  { name: 'Starry Sky', icon: '✨' },
  { name: 'Quiet Cozy', icon: '☕' },
  { name: 'Rainy Roads', icon: '🌧️' },
  { name: 'Retro Arcade', icon: '🎮' }
];

export const NOTIFICATIONS: any[] = [];

