export interface Track {
  id: string
  videoId: string
  title: string
  artist: string
  album?: string
  thumbnail: string
  duration: number
  durationText: string
}

export interface Podcast {
  id: string
  channelId: string
  name: string
  host: string
  description: string
  thumbnail: string
  category: string
}

export interface PodcastEpisode {
  id: string
  videoId: string
  podcastId: string
  title: string
  thumbnail: string
  duration: number
  durationText: string
  publishedAt: string
  description?: string
  artist?: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  thumbnail?: string
  tracks: Track[]
  userId: string
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export const INDIAN_PODCASTERS: Podcast[] = [
  {
    id: 'nikhil-kamath',
    channelId: 'UCCjyq_K1Pd2cEN_HDwOF1XQ',
    name: 'WTF is with Nikhil Kamath',
    host: 'Nikhil Kamath',
    description: 'Candid conversations about business, investing, and life in India.',
    thumbnail: '',
    category: 'Business',
  },
  {
    id: 'raj-shamani',
    channelId: 'UCQHx5noNnHRNfUdFqMFmSXA',
    name: 'Raj Shamani Clips',
    host: 'Raj Shamani',
    description: 'Business, entrepreneurship, and the mindset of successful people.',
    thumbnail: '',
    category: 'Entrepreneurship',
  },
  {
    id: 'beer-biceps',
    channelId: 'UCfh3oaFPX9WKU49IMTN3yWg',
    name: 'BeerBiceps',
    host: 'Ranveer Allahbadia',
    description: 'Mindset, fitness, spirituality and modern India.',
    thumbnail: '',
    category: 'Lifestyle',
  },
  {
    id: 'study-iq',
    channelId: 'UCioKLTyMFn2PEbkHIGx1WYA',
    name: 'Study IQ Education',
    host: 'Anuj Pachhel',
    description: 'Best educational content for competitive exams in India.',
    thumbnail: '',
    category: 'Education',
  },
  {
    id: 'ankit-agrawal',
    channelId: 'UCpPeUqQFjuqW7f9KVBLJJVA',
    name: 'Ankit Agrawal',
    host: 'Ankit Agrawal',
    description: 'Finance, investing and personal growth for young Indians.',
    thumbnail: '',
    category: 'Finance',
  },
  {
    id: 'founders-untold',
    channelId: 'UCshfGqQ6HnaxLBQF_oGTZpA',
    name: 'Founders Untold',
    host: 'Siddhartha Ahluwalia',
    description: 'Real startup stories from Indian founders.',
    thumbnail: '',
    category: 'Startups',
  },
  {
    id: 'irani-talks',
    channelId: 'UCidgHCsGBs7EYGAm7mMYFbA',
    name: 'Irani Talks',
    host: 'Shantanu Irani',
    description: 'Deep conversations on startups, investing, and building companies.',
    thumbnail: '',
    category: 'Startups',
  },
  {
    id: 'trueblue-talks',
    channelId: 'UCCCQxvUhiXVpblhM0Mk8Vhw',
    name: 'The Ranveer Show',
    host: 'Ranveer Allahbadia',
    description: 'Long form podcast with scientists, celebrities, entrepreneurs.',
    thumbnail: '',
    category: 'Lifestyle',
  },
]
