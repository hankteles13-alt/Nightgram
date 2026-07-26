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

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-1',
    username: 'cyber_ghost',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80',
    caption: 'Tokyo after midnight just hits different. The neon lights talk to you when the crowds are gone. 🌧️🌌',
    location: 'Shinjuku, Tokyo',
    time: '2 hours ago',
    likes: 124,
    comments: [
      {
        id: 'c-1',
        username: 'neon_wanderer',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'This reflection is absolutely insane! Did you use a circular polarizer?',
        time: '1h ago'
      },
      {
        id: 'c-2',
        username: 'star_chaser',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        text: 'Stunning. Wish our streets glowed like this.',
        time: '45m ago'
      }
    ],
    isLiked: false,
    isSaved: false,
    mood: 'Urban Neon',
    tags: ['cyberpunk', 'tokyotravel', 'rainynight']
  },
  {
    id: 'post-2',
    username: 'star_chaser',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1000&auto=format&fit=crop&q=80',
    caption: 'Lost in the starry expanse. Took this single exposure in Oregon with a 20s shutter speed. Worth the freezing wind! 🌌🏔️',
    location: 'Mount Hood National Forest, Oregon',
    time: '4 hours ago',
    likes: 312,
    comments: [
      {
        id: 'c-3',
        username: 'cyber_ghost',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        text: 'The clarity of the Milky Way core is unreal. What ISO did you use?',
        time: '3h ago'
      },
      {
        id: 'c-4',
        username: 'star_chaser',
        userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        text: 'ISO 3200 at f/2.8! Standard wide prime lens 🙌',
        time: '2h ago'
      }
    ],
    isLiked: true,
    isSaved: true,
    mood: 'Starry Sky',
    tags: ['astrophotography', 'galaxy', 'campinglife']
  },
  {
    id: 'post-3',
    username: 'cozy_owl',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=1000&auto=format&fit=crop&q=80',
    caption: 'Rain pattering on the glass, jazz playing softly in the background, and a warm cup of matcha. This is peak late-night comfort. 🌧️🍵🎹',
    location: 'Luna Lounge Café',
    time: '6 hours ago',
    likes: 95,
    comments: [
      {
        id: 'c-5',
        username: 'midnight_dreamer',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'The exact mood I am in right now. Cozy cafe nights are unmatched.',
        time: '5h ago'
      }
    ],
    isLiked: false,
    isSaved: false,
    mood: 'Quiet Cozy',
    tags: ['jazzvibes', 'rainyday', 'cafenight']
  }
];

export const INITIAL_STORIES: Story[] = [
  {
    id: 'story-1',
    username: 'cyber_ghost',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    caption: 'Vaporwave fuel stations at 2 AM ⛽💜',
    mood: 'Urban Neon'
  },
  {
    id: 'story-2',
    username: 'neon_wanderer',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=600&auto=format&fit=crop&q=80',
    caption: 'Sucker for wet neon reflections.',
    mood: 'Urban Neon'
  },
  {
    id: 'story-3',
    username: 'star_chaser',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&auto=format&fit=crop&q=80',
    caption: 'Stargazing on a clear summer night ✨🔭',
    mood: 'Starry Sky'
  },
  {
    id: 'story-4',
    username: 'cozy_owl',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=600&auto=format&fit=crop&q=80',
    caption: 'Lo-fi coding setup in the attic room 🎧💻',
    mood: 'Quiet Cozy'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'luna',
    text: 'Welcome to Nightgram, Ray! 🌌 I am Luna, your midnight companion. How is the late-night air feeling where you are tonight?',
    timestamp: '12:05 AM'
  },
  {
    id: 'msg-2',
    sender: 'me',
    text: 'Hey Luna! Just debugging some code and looking for nice nocturnal photos.',
    timestamp: '12:06 AM'
  },
  {
    id: 'msg-3',
    sender: 'luna',
    text: 'A classic midnight pursuit! There is something magical about coding under the moon—no noise, just you and the logic flow. Check out the "Urban Neon" or "Quiet Cozy" channels in the feed for inspiration! Let me know if you need any poetic ideas for your next post caption.',
    timestamp: '12:07 AM'
  }
];

export const MOODS = [
  { name: 'All Vibes', icon: '✨' },
  { name: 'Urban Neon', icon: '🌌' },
  { name: 'Starry Sky', icon: '✨' },
  { name: 'Quiet Cozy', icon: '☕' },
  { name: 'Rainy Roads', icon: '🌧️' },
  { name: 'Retro Arcade', icon: '🎮' }
];

export const NOTIFICATIONS = [
  {
    id: 'n-1',
    username: 'cyber_ghost',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    action: 'liked your post',
    target: '"Midnight Espresso Reflections"',
    time: '15m ago',
    unread: true
  },
  {
    id: 'n-2',
    username: 'neon_wanderer',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    action: 'commented on your post: "Absolutely captures the mood!"',
    target: '"Midnight Espresso Reflections"',
    time: '1h ago',
    unread: true
  },
  {
    id: 'n-3',
    username: 'star_chaser',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    action: 'started following you',
    target: '',
    time: '3h ago',
    unread: false
  },
  {
    id: 'n-4',
    username: 'cozy_owl',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    action: 'starred your comment in Cafe Lounge',
    target: '',
    time: '5h ago',
    unread: false
  }
];
