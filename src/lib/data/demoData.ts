import {
  Campaign,
  Creative,
  PerformanceObservation,
  AudienceObservation,
  Platform,
  CampaignObjective,
  CampaignStatus,
  VisualStyle,
  AnimationStyle,
  CharacterUsage,
  CreativeFormat,
  AspectRatio,
} from '@/types';

function createPrng(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateDeterministicDemoData(): {
  campaigns: Campaign[];
  creatives: Creative[];
  observations: PerformanceObservation[];
  audienceObservations: AudienceObservation[];
} {
  const prng = createPrng(42);

  const clients = [
    'Amul Dairy & Topicals',
    'CRED Rewards',
    'Swiggy Food & Instamart',
    'Zomato Delivery',
    'boAt Lifestyle',
    'Tata Play',
    'Mamaearth Natural Care',
    'PhonePe UPI & Insurance',
  ];

  const campaigns: Campaign[] = [
    {
      id: 'cmp-in-101',
      name: 'Amul: Topical Match Day Cartoons',
      clientName: 'Amul Dairy & Topicals',
      platform: 'Meta',
      objective: 'BRAND_AWARENESS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 4500000,
      description: 'Iconic Amul Butter Girl topical 2D cartoon commentary during the cricket league season.',
    },
    {
      id: 'cmp-in-102',
      name: 'Amul: Utterly Butterly Reels',
      clientName: 'Amul Dairy & Topicals',
      platform: 'JioCinema',
      objective: 'VIDEO_VIEWS',
      status: 'ACTIVE',
      startDate: '2024-01-05',
      endDate: null,
      currency: 'INR',
      budget: 6500000,
      description: 'Animated Amul girl short bumper ads broadcast during live digital streaming matches.',
    },
    {
      id: 'cmp-in-103',
      name: 'CRED: Retro 16-Bit Boss Fight',
      clientName: 'CRED Rewards',
      platform: 'YouTube',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 8500000,
      description: 'Humorous 2D pixel cartoon animation showing retro video game credit card coin collection.',
    },
    {
      id: 'cmp-in-104',
      name: 'CRED: The Indiranagar Meme Quest',
      clientName: 'CRED Rewards',
      platform: 'Meta',
      objective: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: '2024-01-12',
      endDate: null,
      currency: 'INR',
      budget: 3500000,
      description: 'Meme-style hand-drawn comics & caricatures satirizing Bangalore traffic and credit bills.',
    },
    {
      id: 'cmp-in-105',
      name: 'Swiggy: Late Night Biryani Cravings',
      clientName: 'Swiggy Food & Instamart',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 7200000,
      description: '2D cartoon food mascots dancing inside midnight cravings hunger dreams with instant 20-min delivery.',
    },
    {
      id: 'cmp-in-106',
      name: 'Swiggy: Instamart 10-Min Flash Mascots',
      clientName: 'Swiggy Food & Instamart',
      platform: 'Google Ads',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-08',
      endDate: null,
      currency: 'INR',
      budget: 5500000,
      description: 'Animated quick-commerce delivery helmet mascot rescuing households from missing coriander and milk.',
    },
    {
      id: 'cmp-in-107',
      name: 'Swiggy: Regional Vernacular Voice Search',
      clientName: 'Swiggy Food & Instamart',
      platform: 'ShareChat',
      objective: 'TRAFFIC',
      status: 'ACTIVE',
      startDate: '2024-01-15',
      endDate: null,
      currency: 'INR',
      budget: 2800000,
      description: 'Animated 2D cartoon voice assistant teaching regional food orders across Hindi, Tamil, and Telugu.',
    },
    {
      id: 'cmp-in-108',
      name: 'Zomato: Samosa vs Burger Animated Duel',
      clientName: 'Zomato Delivery',
      platform: 'YouTube',
      objective: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: '2024-01-05',
      endDate: null,
      currency: 'INR',
      budget: 4800000,
      description: '3D animated comedy sketch featuring street food snacks dueling for the monsoon evening snack throne.',
    },
    {
      id: 'cmp-in-109',
      name: 'Zomato: Gold Dining Out Festival',
      clientName: 'Zomato Delivery',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-10',
      endDate: null,
      currency: 'INR',
      budget: 5200000,
      description: 'Illustrated motion graphics food map showcasing 1+1 buffet discounts across top Indian restaurants.',
    },
    {
      id: 'cmp-in-110',
      name: 'boAt: Cyberpunk Bass Beast (3D)',
      clientName: 'boAt Lifestyle',
      platform: 'YouTube',
      objective: 'VIDEO_VIEWS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 7800000,
      description: '3D character animation of futuristic Indian street gamers dropping heavy bass beats with ANC headphones.',
    },
    {
      id: 'cmp-in-111',
      name: 'boAt: Anime Headphone Avatars',
      clientName: 'boAt Lifestyle',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-14',
      endDate: null,
      currency: 'INR',
      budget: 4200000,
      description: 'Anime-inspired Indian characters transforming into audio cyborgs for Gen-Z sound enthusiasts.',
    },
    {
      id: 'cmp-in-112',
      name: 'boAt: Republic Day Sound Storm',
      clientName: 'boAt Lifestyle',
      platform: 'Google Ads',
      objective: 'CONVERSIONS',
      status: 'PAUSED',
      startDate: '2024-01-18',
      endDate: '2024-01-30',
      currency: 'INR',
      budget: 3200000,
      description: 'Patriotic tricolor soundwave motion graphics with special festive discounts.',
    },
    {
      id: 'cmp-in-113',
      name: 'Tata Play: Jingalala Cartoon Family',
      clientName: 'Tata Play',
      platform: 'JioCinema',
      objective: 'BRAND_AWARENESS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 6800000,
      description: 'Wholesome 3D animated Indian family discovering OTT binging on their television screens.',
    },
    {
      id: 'cmp-in-114',
      name: 'Tata Play: Binge App Smart Bundle',
      clientName: 'Tata Play',
      platform: 'Google Ads',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-05',
      endDate: null,
      currency: 'INR',
      budget: 4600000,
      description: 'Motion graphics comparison showing 25+ OTT apps united under 1 single monthly plan.',
    },
    {
      id: 'cmp-in-115',
      name: 'Mamaearth: Onion Hair Oil Botanic Tale',
      clientName: 'Mamaearth Natural Care',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 5900000,
      description: 'Hand-drawn watercolor illustrations explaining organic onion seed hair follicle rejuvenation.',
    },
    {
      id: 'cmp-in-116',
      name: 'Mamaearth: Plant Goodness Mascots',
      clientName: 'Mamaearth Natural Care',
      platform: 'YouTube',
      objective: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: '2024-01-10',
      endDate: null,
      currency: 'INR',
      budget: 3600000,
      description: 'Cute 2D plant sapling mascots showing real tree planting with every e-commerce checkout.',
    },
    {
      id: 'cmp-in-117',
      name: 'PhonePe: SmartSpeaker Sound Mascot',
      clientName: 'PhonePe UPI & Insurance',
      platform: 'YouTube',
      objective: 'BRAND_AWARENESS',
      status: 'ACTIVE',
      startDate: '2024-01-01',
      endDate: null,
      currency: 'INR',
      budget: 8200000,
      description: 'Animated 3D SmartSpeaker device singing humorous jingles across Indian kirana stores in 11 languages.',
    },
    {
      id: 'cmp-in-118',
      name: 'PhonePe: Bike Insurance in 2 Minutes',
      clientName: 'PhonePe UPI & Insurance',
      platform: 'Meta',
      objective: 'CONVERSIONS',
      status: 'ACTIVE',
      startDate: '2024-01-06',
      endDate: null,
      currency: 'INR',
      budget: 6200000,
      description: '2D comic-strip animated explainer of zero-paperwork two-wheeler policy renewal from ₹1.5/day.',
    },
    {
      id: 'cmp-in-119',
      name: 'PhonePe: Enterprise Merchant Gateway',
      clientName: 'PhonePe UPI & Insurance',
      platform: 'LinkedIn',
      objective: 'LEAD_GENERATION',
      status: 'ACTIVE',
      startDate: '2024-01-10',
      endDate: null,
      currency: 'INR',
      budget: 4400000,
      description: 'Clean isometric motion graphics detailing 99.99% transaction success rate for Indian online businesses.',
    },
    {
      id: 'cmp-in-120',
      name: 'Tata Play: IPL Cricket Season Pass',
      clientName: 'Tata Play',
      platform: 'ShareChat',
      objective: 'CONVERSIONS',
      status: 'COMPLETED',
      startDate: '2024-01-01',
      endDate: '2024-02-15',
      currency: 'INR',
      budget: 3000000,
      description: 'Animated cricket fever cards offering 4K live sports channel upgrade at ₹19/month.',
    },
  ];

  const generateThumbSvg = (style: VisualStyle, title: string, color: string) => {
    const encodedTitle = encodeURIComponent(title.slice(0, 20));
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23f4f4f5"/><rect x="12" y="12" width="296" height="156" rx="8" fill="${encodeURIComponent(
      color
    )}" fill-opacity="0.12" stroke="${encodeURIComponent(color)}" stroke-width="2"/><circle cx="160" cy="70" r="32" fill="${encodeURIComponent(
      color
    )}" fill-opacity="0.25"/><text x="160" y="125" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="%2318181b" text-anchor="middle">${encodedTitle}</text><text x="160" y="145" font-family="system-ui,sans-serif" font-size="11" fill="%2371717a" text-anchor="middle">${encodeURIComponent(
      style
    )}</text></svg>`;
  };

  const creativesData: {
    campaignId: string;
    name: string;
    format: CreativeFormat;
    visualStyle: VisualStyle;
    animStyle: AnimationStyle;
    charUsage: CharacterUsage;
    duration: number | null;
    aspectRatio: AspectRatio;
    primaryMessage: string;
    cta: string;
    tags: string[];
    color: string;
  }[] = [

    {
      campaignId: 'cmp-in-101',
      name: 'Amul Girl Match Day Topical (2D)',
      format: 'ILLUSTRATED_GRAPHIC',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Mascot',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Cricket Mein Jeet, Amul Pe Dil Meet! Utterly Butterly Delicious.',
      cta: 'Share Topical',
      tags: ['amul', 'cartoon', 'topical', 'mascot'],
      color: '#e11d48',
    },
    {
      campaignId: 'cmp-in-101',
      name: 'Polka Dot Dress Toast Hop (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Mascot',
      duration: 12,
      aspectRatio: '9:16',
      primaryMessage: 'Spreading butter love across Indian breakfast tables since 1966.',
      cta: 'Order Amul Butter',
      tags: ['breakfast', 'mascot', '2d-cartoon'],
      color: '#f43f5e',
    },

    {
      campaignId: 'cmp-in-102',
      name: 'Wicket Celebration Butter Dance (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 15,
      aspectRatio: '16:9',
      primaryMessage: 'Sixer hit, butter toast lit! Celebrate every boundary with Amul.',
      cta: 'Explore Products',
      tags: ['cricket', '3D', 'mascot'],
      color: '#ef4444',
    },
    {
      campaignId: 'cmp-in-102',
      name: 'Tricolor Ice Cream Scoop Story (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 20,
      aspectRatio: '16:9',
      primaryMessage: 'Real milk, real almonds, pure happiness in every bite.',
      cta: 'Find Parlour',
      tags: ['icecream', 'cartoon'],
      color: '#f97316',
    },

    {
      campaignId: 'cmp-in-103',
      name: 'Retro 8-Bit Pixel Bill Buster (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 25,
      aspectRatio: '16:9',
      primaryMessage: 'Pay credit card bills on time and win jackpots up to ₹1 Lakh.',
      cta: 'Download CRED',
      tags: ['cred', 'pixel', 'retro', 'gaming'],
      color: '#18181b',
    },
    {
      campaignId: 'cmp-in-103',
      name: 'Chibi Banker Arcade Jump',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 15,
      aspectRatio: '16:9',
      primaryMessage: 'Turn dull bill payments into legendary reward chests.',
      cta: 'Claim Coins',
      tags: ['arcade', 'cartoon', 'fintech'],
      color: '#27272a',
    },

    {
      campaignId: 'cmp-in-104',
      name: 'Silk Board Jam Caricature Comic',
      format: 'CAROUSEL',
      visualStyle: 'Hand-Drawn Illustration',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Things slower than Bangalore signal: paying bills with OTP loops.',
      cta: 'Switch to CRED',
      tags: ['comic', 'bangalore', 'humor'],
      color: '#3b82f6',
    },
    {
      campaignId: 'cmp-in-104',
      name: 'Retro Synthwave Credit Score Glow',
      format: 'ANIMATION',
      visualStyle: 'Motion Graphics',
      animStyle: 'Motion Graphics',
      charUsage: 'No Character',
      duration: 18,
      aspectRatio: '9:16',
      primaryMessage: 'Track your experiential credit health for free in 30 seconds.',
      cta: 'Check Score',
      tags: ['synthwave', 'motion'],
      color: '#8b5cf6',
    },

    {
      campaignId: 'cmp-in-105',
      name: 'Gulab Jamun Mascot 2AM Dance (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Mascot',
      duration: 12,
      aspectRatio: '9:16',
      primaryMessage: 'Hot syrup, warm hearts: sweet cravings delivered in 25 mins.',
      cta: 'Order Sweets',
      tags: ['swiggy', 'mascot', 'dessert', 'midnight'],
      color: '#f97316',
    },
    {
      campaignId: 'cmp-in-105',
      name: 'Biryani Handi Steam Symphony (Motion)',
      format: 'VIDEO',
      visualStyle: 'Motion Graphics',
      animStyle: 'Motion Graphics',
      charUsage: 'No Character',
      duration: 15,
      aspectRatio: '9:16',
      primaryMessage: 'Dum pukht aroma straight from your city’s best bawarchi.',
      cta: 'Order Biryani',
      tags: ['biryani', 'motion'],
      color: '#ea580c',
    },
    {
      campaignId: 'cmp-in-105',
      name: 'Chai & Samosa Rain Doodle (Hand-Drawn)',
      format: 'ILLUSTRATED_GRAPHIC',
      visualStyle: 'Hand-Drawn Illustration',
      animStyle: 'Not Applicable',
      charUsage: 'Cartoon Character',
      duration: null,
      aspectRatio: '4:5',
      primaryMessage: 'Baarish, adrak chai aur crispy samosa. Swiggy it now.',
      cta: 'Snack Now',
      tags: ['monsoon', 'illustrated', 'snack'],
      color: '#d97706',
    },

    {
      campaignId: 'cmp-in-106',
      name: 'Instamart 10-Min Helmet Mascot (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 10,
      aspectRatio: '1:1',
      primaryMessage: 'Ran out of dhaniya? Instamart arrives before tadka burns.',
      cta: 'Open Instamart',
      tags: ['instamart', 'mascot', '3D', 'quick-commerce'],
      color: '#ea580c',
    },
    {
      campaignId: 'cmp-in-106',
      name: 'Emergency Ice Cream Delivery Countdown',
      format: 'STATIC_IMAGE',
      visualStyle: 'Motion Graphics',
      animStyle: 'Not Applicable',
      charUsage: 'No Character',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Midnight cravings sorted in 8 to 12 minutes.',
      cta: 'Order Now',
      tags: ['grocery', 'display'],
      color: '#f59e0b',
    },

    {
      campaignId: 'cmp-in-107',
      name: 'Dosa Master Cartoon Flip (2D Vernacular)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 15,
      aspectRatio: '9:16',
      primaryMessage: 'Crispy ghee roast dosa delivered hot to your doorstep.',
      cta: 'Swiggy Kar Lo',
      tags: ['vernacular', 'cartoon', 'breakfast'],
      color: '#059669',
    },

    {
      campaignId: 'cmp-in-108',
      name: 'Chaat Mascot Epic Battle (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 30,
      aspectRatio: '16:9',
      primaryMessage: 'Pani Puri vs Dahi Vada: The crunchiest showdown of the year.',
      cta: 'Order Street Food',
      tags: ['zomato', '3D', 'mascot', 'streetfood'],
      color: '#dc2626',
    },
    {
      campaignId: 'cmp-in-108',
      name: 'The Red Delivery Bag Odyssey (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 20,
      aspectRatio: '16:9',
      primaryMessage: 'Braving traffic, rain, and stairs to bring hot happiness.',
      cta: 'Tip Partner',
      tags: ['cartoon', 'storytelling'],
      color: '#b91c1c',
    },

    {
      campaignId: 'cmp-in-109',
      name: 'Zomato Gold Dining Caricatures',
      format: 'CAROUSEL',
      visualStyle: 'Hand-Drawn Illustration',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Unlock 1+1 buffet & flat 40% off across 2,500 premium cafes.',
      cta: 'Join Gold',
      tags: ['dining', 'carousel', 'illustrated'],
      color: '#ef4444',
    },

    {
      campaignId: 'cmp-in-110',
      name: 'Desi Cyberpunk Bass Avatar (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Human Character',
      duration: 35,
      aspectRatio: '16:9',
      primaryMessage: '50-hour battery life with boAt Signature Sound. Plug into Nirvana.',
      cta: 'Shop boAt',
      tags: ['boat', '3D', 'cyberpunk', 'audio'],
      color: '#06b6d4',
    },
    {
      campaignId: 'cmp-in-110',
      name: 'Gully Cricket Beats Drop (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Cartoon Character',
      duration: 24,
      aspectRatio: '16:9',
      primaryMessage: 'Sound that turns every street boundary into a festival.',
      cta: 'Explore ANC',
      tags: ['cricket', '3D', 'music'],
      color: '#0284c7',
    },

    {
      campaignId: 'cmp-in-111',
      name: 'Anime Streetwear Audio Heroine (Anime)',
      format: 'ANIMATION',
      visualStyle: 'Anime-Inspired',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 14,
      aspectRatio: '9:16',
      primaryMessage: 'Desi anime aesthetic meets thunderous 13mm bass drivers.',
      cta: 'Get Nirvana',
      tags: ['anime', 'gen-z', 'music'],
      color: '#ec4899',
    },
    {
      campaignId: 'cmp-in-111',
      name: 'Neon Mumbai Rain Beats (Anime)',
      format: 'ANIMATION',
      visualStyle: 'Anime-Inspired',
      animStyle: 'Mixed Animation',
      charUsage: 'Human Character',
      duration: 18,
      aspectRatio: '9:16',
      primaryMessage: 'IPX5 splash resistance for monsoon local train playlists.',
      cta: 'Shop Earbuds',
      tags: ['anime', 'monsoon', 'mumbai'],
      color: '#a855f7',
    },

    {
      campaignId: 'cmp-in-112',
      name: 'Tricolor Audio Pulse Banner',
      format: 'STATIC_IMAGE',
      visualStyle: 'Motion Graphics',
      animStyle: 'Not Applicable',
      charUsage: 'No Character',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Proudly made in India: up to 65% off on smartwatches & audio.',
      cta: 'Shop Deals',
      tags: ['madeinindia', 'display'],
      color: '#16a34a',
    },

    {
      campaignId: 'cmp-in-113',
      name: 'Jingalala Mascot Family Movie Night (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 25,
      aspectRatio: '16:9',
      primaryMessage: 'Tata Play Jingalala: 600+ HD channels with zero buffering.',
      cta: 'Book Connection',
      tags: ['tataplay', 'mascot', 'family', '3D'],
      color: '#4f46e5',
    },
    {
      campaignId: 'cmp-in-113',
      name: 'Grandpa Cricket Replay Comic (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 15,
      aspectRatio: '16:9',
      primaryMessage: 'Pause, rewind, and record live sports whenever you want.',
      cta: 'Upgrade HD',
      tags: ['cartoon', 'sports', 'tv'],
      color: '#4338ca',
    },

    {
      campaignId: 'cmp-in-114',
      name: 'Binge OTT Stack Explainer (Motion)',
      format: 'ANIMATION',
      visualStyle: 'Motion Graphics',
      animStyle: 'Motion Graphics',
      charUsage: 'No Character',
      duration: 20,
      aspectRatio: '1:1',
      primaryMessage: 'Netflix, Prime, Hotstar & Zee5: one simple bill at ₹299/mo.',
      cta: 'Activate Binge',
      tags: ['ott', 'motion-graphics'],
      color: '#6366f1',
    },

    {
      campaignId: 'cmp-in-115',
      name: 'Ayurvedic Herb Botanical Watercolor',
      format: 'ILLUSTRATED_GRAPHIC',
      visualStyle: 'Hand-Drawn Illustration',
      animStyle: 'Not Applicable',
      charUsage: 'No Character',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Toxin-free red onion seed & plant keratin for 2x stronger roots.',
      cta: 'Shop Herbal',
      tags: ['mamaearth', 'botanical', 'hand-drawn'],
      color: '#15803d',
    },
    {
      campaignId: 'cmp-in-115',
      name: 'Onion Hair Oil Step-by-Step Comic',
      format: 'CAROUSEL',
      visualStyle: '2D Cartoon',
      animStyle: 'Not Applicable',
      charUsage: 'Cartoon Character',
      duration: null,
      aspectRatio: '4:5',
      primaryMessage: 'Dadi ke nuskhe, modern science: 3 steps to reduce hair fall.',
      cta: 'Read Guide',
      tags: ['haircare', 'cartoon', 'comic'],
      color: '#166534',
    },

    {
      campaignId: 'cmp-in-116',
      name: 'Sapling Mascot Forest Journey (2D)',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Mascot',
      duration: 30,
      aspectRatio: '16:9',
      primaryMessage: 'Every order plants a tree in Indian conservation belts.',
      cta: 'Track Your Tree',
      tags: ['environment', 'mascot', '2d-cartoon'],
      color: '#15803d',
    },

    {
      campaignId: 'cmp-in-117',
      name: 'Singing SmartSpeaker Kirana Jingle (3D)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 20,
      aspectRatio: '16:9',
      primaryMessage: 'PhonePe pe 50 rupaye prapt hue! Trusted by 3.5 Crore Indian merchants.',
      cta: 'Get SmartSpeaker',
      tags: ['phonepe', 'smartspeaker', 'mascot', 'fintech'],
      color: '#7c3aed',
    },
    {
      campaignId: 'cmp-in-117',
      name: 'Bazaar QR Voice Payment Mascot',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 15,
      aspectRatio: '9:16',
      primaryMessage: 'Zero UPI downtime, clear voice confirmations in your mother tongue.',
      cta: 'Join PhonePe',
      tags: ['mascot', 'upi'],
      color: '#6d28d9',
    },

    {
      campaignId: 'cmp-in-118',
      name: 'Two-Wheeler Insurance Comic: 2 Mins',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 18,
      aspectRatio: '9:16',
      primaryMessage: 'Traffic police stopped you? Renew bike insurance instantly in 2 clicks.',
      cta: 'Renew at ₹1.5/day',
      tags: ['insurance', 'humor', 'cartoon'],
      color: '#5b21b6',
    },
    {
      campaignId: 'cmp-in-118',
      name: 'Instant Claim Settlement Infographic',
      format: 'STATIC_IMAGE',
      visualStyle: 'Motion Graphics',
      animStyle: 'Not Applicable',
      charUsage: 'No Character',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Hassle-free digital claims approved in under 20 minutes.',
      cta: 'Compare Plans',
      tags: ['insurance', 'display'],
      color: '#4c1d95',
    },

    {
      campaignId: 'cmp-in-119',
      name: 'Fintech Payment Orchestration (Motion)',
      format: 'ANIMATION',
      visualStyle: 'Motion Graphics',
      animStyle: 'Motion Graphics',
      charUsage: 'No Character',
      duration: 28,
      aspectRatio: '1:1',
      primaryMessage: '99.99% transaction reliability across RuPay, UPI, and NetBanking.',
      cta: 'Integrate Gateway',
      tags: ['b2b', 'fintech', 'motion'],
      color: '#3b82f6',
    },

    {
      campaignId: 'cmp-in-120',
      name: 'Cricket Trophy Cartoon Celebration',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 12,
      aspectRatio: '9:16',
      primaryMessage: 'Enjoy every IPL boundary in crystal clear 4K Hindi commentary.',
      cta: 'Subscribe at ₹19',
      tags: ['cricket', 'vernacular', 'sharechat'],
      color: '#1d4ed8',
    },

    {
      campaignId: 'cmp-in-101',
      name: 'Amul Maska Bun Monsoon Illustration',
      format: 'ILLUSTRATED_GRAPHIC',
      visualStyle: 'Hand-Drawn Illustration',
      animStyle: 'Not Applicable',
      charUsage: 'Mascot',
      duration: null,
      aspectRatio: '1:1',
      primaryMessage: 'Crispy bun, generous butter: Mumbai monsoon perfection.',
      cta: 'Taste Tradition',
      tags: ['mumbai', 'monsoon', 'mascot'],
      color: '#e11d48',
    },
    {
      campaignId: 'cmp-in-103',
      name: '8-Bit Auto Rickshaw Meter Meter Dash',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Cartoon Character',
      duration: 16,
      aspectRatio: '9:16',
      primaryMessage: 'Avoid peak meter surges by earning cashback coins with CRED.',
      cta: 'Pay Bills',
      tags: ['retro', 'cartoon', 'auto'],
      color: '#18181b',
    },
    {
      campaignId: 'cmp-in-105',
      name: 'Chai Glass Animated Jingle Reel',
      format: 'VIDEO',
      visualStyle: 'Mixed Media',
      animStyle: 'Mixed Animation',
      charUsage: 'Cartoon Character',
      duration: 14,
      aspectRatio: '9:16',
      primaryMessage: 'Kadak cutting chai with piping hot biscuits.',
      cta: 'Swiggy Chai',
      tags: ['chai', 'cartoon', 'reels'],
      color: '#ea580c',
    },
    {
      campaignId: 'cmp-in-108',
      name: 'Golgappa Water Blast (3D Animation)',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Cartoon Character',
      duration: 18,
      aspectRatio: '9:16',
      primaryMessage: 'Teekha ya meetha? Get the crunchiest golgappas delivered now.',
      cta: 'Order Chaat',
      tags: ['chaat', '3D', 'animation'],
      color: '#dc2626',
    },
    {
      campaignId: 'cmp-in-110',
      name: 'Desi Hip-Hop Bass Mascot Beat',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 20,
      aspectRatio: '9:16',
      primaryMessage: 'Feel the sub-bass pulse with boAt Rockerz 550.',
      cta: 'Plug In',
      tags: ['mascot', '3D', 'audio'],
      color: '#0891b2',
    },
    {
      campaignId: 'cmp-in-115',
      name: 'Haldi Chandan Glow Animated Doodle',
      format: 'ANIMATION',
      visualStyle: 'Hand-Drawn Illustration',
      animStyle: 'Flat Animation',
      charUsage: 'No Character',
      duration: 12,
      aspectRatio: '1:1',
      primaryMessage: 'Pure turmeric & saffron brightening face wash.',
      cta: 'Glow Naturally',
      tags: ['ayurveda', 'hand-drawn'],
      color: '#eab308',
    },
    {
      campaignId: 'cmp-in-117',
      name: 'SmartSpeaker Festive Garba Jingle',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Mascot',
      duration: 15,
      aspectRatio: '9:16',
      primaryMessage: 'Festive season payment announcements in Gujarati & Marathi.',
      cta: 'Get Soundbox',
      tags: ['festive', 'mascot', 'audio'],
      color: '#7c3aed',
    },
    {
      campaignId: 'cmp-in-105',
      name: 'Midnight Hunger Live Action Delivery Story',
      format: 'VIDEO',
      visualStyle: 'Live Action',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: 25,
      aspectRatio: '16:9',
      primaryMessage: 'Real Swiggy delivery partner navigating Mumbai rain to deliver hot biryani.',
      cta: 'Order Now',
      tags: ['live-action', 'mumbai', 'swiggy'],
      color: '#ea580c',
    },
    {
      campaignId: 'cmp-in-101',
      name: 'Amul Gopi the Cow Happy Pasture Tale',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Animal Character',
      duration: 15,
      aspectRatio: '1:1',
      primaryMessage: 'Direct farm milk procurement ensuring pure nutrition for Indian households.',
      cta: 'Learn More',
      tags: ['amul', 'animal-character', 'farm'],
      color: '#2563eb',
    },
    {
      campaignId: 'cmp-in-109',
      name: 'boAt Beast Mode Workout Athlete Live Action',
      format: 'VIDEO',
      visualStyle: 'Live Action',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: 20,
      aspectRatio: '9:16',
      primaryMessage: 'Sweatproof ANC earbuds tested during high-intensity training.',
      cta: 'Shop Now',
      tags: ['fitness', 'live-action', 'athlete'],
      color: '#0284c7',
    },
    {
      campaignId: 'cmp-in-103',
      name: 'CRED Indian Cricket Legend Dressing Room Talk',
      format: 'VIDEO',
      visualStyle: 'Live Action',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: 30,
      aspectRatio: '16:9',
      primaryMessage: 'Former cricket coach explains paying credit card bills on time.',
      cta: 'Download CRED',
      tags: ['cricket', 'celebrity', 'live-action'],
      color: '#18181b',
    },
    {
      campaignId: 'cmp-in-115',
      name: 'Mamaearth Forest Fawn Nature Tale',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Animal Character',
      duration: 15,
      aspectRatio: '1:1',
      primaryMessage: 'Plant goodness with every order. One bottle, one tree planted in rural India.',
      cta: 'Plant Goodness',
      tags: ['nature', 'animal-character', 'csr'],
      color: '#16a34a',
    },
    {
      campaignId: 'cmp-in-113',
      name: 'Tata Play Sunday Family Movie Night Live Action',
      format: 'VIDEO',
      visualStyle: 'Live Action',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: 20,
      aspectRatio: '16:9',
      primaryMessage: 'Grandparents and kids enjoying blockbuster Bollywood premieres together.',
      cta: 'Recharge Now',
      tags: ['family', 'live-action', 'tataplay'],
      color: '#9333ea',
    },
    {
      campaignId: 'cmp-in-117',
      name: 'PhonePe Kirana Dukan Fast QR Live Action',
      format: 'VIDEO',
      visualStyle: 'Live Action',
      animStyle: 'Not Applicable',
      charUsage: 'Human Character',
      duration: 18,
      aspectRatio: '9:16',
      primaryMessage: 'Zero transaction failure at 3.5 Crore Indian merchant counters.',
      cta: 'Accept UPI',
      tags: ['kirana', 'upi', 'live-action'],
      color: '#6d28d9',
    },
    {
      campaignId: 'cmp-in-110',
      name: 'boAt Bass Hound Puppy Ear Flap Animation',
      format: 'ANIMATION',
      visualStyle: '3D Animation',
      animStyle: '3D Character Animation',
      charUsage: 'Animal Character',
      duration: 12,
      aspectRatio: '9:16',
      primaryMessage: 'Puppy ears bopping to 40mm tuned bass drivers.',
      cta: 'Hear The Bass',
      tags: ['bass', 'puppy', 'animal-character'],
      color: '#0891b2',
    },
    {
      campaignId: 'cmp-in-106',
      name: 'Swiggy Cat Waiting for Whiskas Delivery',
      format: 'ANIMATION',
      visualStyle: '2D Cartoon',
      animStyle: 'Flat Animation',
      charUsage: 'Animal Character',
      duration: 14,
      aspectRatio: '1:1',
      primaryMessage: '10-minute pet food & treat delivery with Swiggy Instamart.',
      cta: 'Get Pet Care',
      tags: ['cat', 'instamart', 'animal-character'],
      color: '#f97316',
    },
  ];

  const creatives: Creative[] = creativesData.map((c, idx) => ({
    id: `crt-in-${201 + idx}`,
    campaignId: c.campaignId,
    name: c.name,
    thumbnailUrl: generateThumbSvg(c.visualStyle, c.name, c.color),
    creativeFormat: c.format,
    visualStyle: c.visualStyle,
    animationStyle: c.animStyle,
    characterUsage: c.charUsage,
    durationSeconds: c.duration,
    aspectRatio: c.aspectRatio,
    primaryMessage: c.primaryMessage,
    callToAction: c.cta,
    tags: c.tags,
  }));

  const campaignMap = new Map<string, Campaign>();
  for (const c of campaigns) {
    campaignMap.set(c.id, c);
  }

  const observations: PerformanceObservation[] = [];
  const startDate = new Date('2024-01-01T00:00:00Z');

  const styleCtrFactor: Record<VisualStyle, number> = {
    '2D Cartoon': 1.48,
    '3D Animation': 1.28,
    'Anime-Inspired': 1.52,
    'Hand-Drawn Illustration': 1.18,
    'Motion Graphics': 1.08,
    'Live Action': 0.88,
    'Mixed Media': 1.22,
    'Other': 0.9,
    'Unknown': 0.8,
  };

  const charCtrFactor: Record<CharacterUsage, number> = {
    'Mascot': 1.38,
    'Cartoon Character': 1.32,
    'Animal Character': 1.25,
    'Human Character': 0.95,
    'No Character': 0.9,
    'Unknown': 0.85,
  };

  let obsCounter = 1;

  for (let day = 0; day < 90; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];

    const dayOfWeek = currentDate.getDay();
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1.0;

    for (const creative of creatives) {
      const camp = campaignMap.get(creative.campaignId);
      if (!camp) continue;

      if (camp.startDate > dateStr) continue;
      if (camp.endDate && camp.endDate < dateStr) continue;

      const baseDailySpend = 2500 + prng() * 6500;
      let dailySpend = Math.round(baseDailySpend * weekendMultiplier);

      if (day >= 40 && day <= 48 && (camp.platform === 'JioCinema' || camp.platform === 'Meta')) {
        dailySpend = Math.round(dailySpend * 1.9);
      }
      if (camp.id === 'cmp-in-112' && day > 30) {
        dailySpend = 0;
      }
      if (camp.id === 'cmp-in-120' && day > 45) {
        dailySpend = 0;
      }

      if (dailySpend === 0) continue;

      const cpmBaseline =
        camp.platform === 'LinkedIn'
          ? 280
          : camp.platform === 'JioCinema'
          ? 180
          : camp.platform === 'Meta'
          ? 95
          : camp.platform === 'YouTube'
          ? 110
          : 65;

      const cpm = cpmBaseline * (0.85 + prng() * 0.3);
      const impressions = Math.max(50, Math.round((dailySpend / cpm) * 1000));
      const reach = Math.round(impressions * (0.78 + prng() * 0.15));

      const baseCtr = 0.016;
      const styleFactor = styleCtrFactor[creative.visualStyle] || 1.0;
      const charFactor = charCtrFactor[creative.characterUsage] || 1.0;
      const durationFactor = creative.durationSeconds
        ? creative.durationSeconds <= 15
          ? 1.2
          : creative.durationSeconds <= 30
          ? 1.05
          : 0.85
        : 1.0;

      const randomNoise = 0.8 + prng() * 0.4;
      const effectiveCtr = Math.min(0.08, baseCtr * styleFactor * charFactor * durationFactor * randomNoise);
      const clicks = Math.max(1, Math.round(impressions * effectiveCtr));

      let cvr = 0.04;
      if (camp.objective === 'CONVERSIONS') cvr = 0.055 + prng() * 0.035;
      else if (camp.objective === 'BRAND_AWARENESS' || camp.objective === 'VIDEO_VIEWS') cvr = 0.008 + prng() * 0.01;
      else if (camp.objective === 'LEAD_GENERATION') cvr = 0.045 + prng() * 0.02;

      const conversions = Math.max(0, Math.round(clicks * cvr));

      let conversionValue: number | null = null;
      if (
        camp.clientName.includes('Swiggy') ||
        camp.clientName.includes('Zomato') ||
        camp.clientName.includes('Amul')
      ) {
        const aov = 420 + prng() * 380;
        conversionValue = conversions > 0 ? Math.round(conversions * aov) : 0;
      } else if (camp.clientName.includes('boAt') || camp.clientName.includes('Mamaearth')) {
        const aov = 1250 + prng() * 1100;
        conversionValue = conversions > 0 ? Math.round(conversions * aov) : 0;
      }

      let videoViews: number | null = null;
      let completedVideoViews: number | null = null;
      if (creative.creativeFormat === 'ANIMATION' || creative.creativeFormat === 'VIDEO') {
        const viewRate = 0.65 + prng() * 0.2;
        videoViews = Math.round(impressions * viewRate);
        const completionRate =
          creative.durationSeconds && creative.durationSeconds <= 15 ? 0.48 + prng() * 0.25 : 0.22 + prng() * 0.18;
        completedVideoViews = Math.round(videoViews * completionRate);
      }

      let likes: number | null = null;
      let comments: number | null = null;
      let shares: number | null = null;

      if (camp.platform === 'Meta' || camp.platform === 'ShareChat' || camp.platform === 'YouTube') {
        likes = Math.round(clicks * (1.4 + prng() * 1.6));
        comments = Math.round(clicks * (0.06 + prng() * 0.18));
        shares = Math.round(clicks * (0.1 + prng() * 0.25));
      }

      observations.push({
        id: `obs-in-${obsCounter++}`,
        date: dateStr,
        campaignId: camp.id,
        creativeId: creative.id,
        platform: camp.platform,
        impressions,
        reach,
        clicks,
        spend: dailySpend,
        conversions,
        conversionValue,
        videoViews,
        completedVideoViews,
        likes,
        comments,
        shares,
        currency: 'INR',
        attributionWindow: '7d_click_1d_view',
        source: 'DEMO',
      });
    }
  }

  const audienceObservations: AudienceObservation[] = [];
  const ageGroups: ('18-24' | '25-34' | '35-44' | '45-54' | '55+')[] = ['18-24', '25-34', '35-44', '45-54', '55+'];
  const genders: ('Female' | 'Male' | 'Other')[] = ['Female', 'Male', 'Other'];
  const indianRegions = [
    'Mumbai & Maharashtra',
    'Bengaluru & Karnataka',
    'Delhi NCR',
    'Chennai & Tamil Nadu',
    'Hyderabad & Telangana',
    'Kolkata & West Bengal',
    'Ahmedabad & Gujarat',
    'Pune & Rest of West',
  ];
  const devices: ('Mobile' | 'Desktop' | 'Tablet')[] = ['Mobile', 'Desktop', 'Tablet'];
  const placements: ('Feed' | 'Stories' | 'Reels' | 'Search' | 'Video In-Stream')[] = [
    'Feed',
    'Stories',
    'Reels',
    'Search',
    'Video In-Stream',
  ];

  let audCounter = 1;
  for (let i = 0; i < campaigns.length; i++) {
    const cmp = campaigns[i];
    for (const age of ageGroups) {
      for (const gender of genders) {
        const audSpend = 12000 + prng() * 35000;
        const audImpr = Math.round((audSpend / 90) * 1000);
        const audClicks = Math.round(audImpr * (0.016 + prng() * 0.024));
        const audConv = Math.round(audClicks * (0.03 + prng() * 0.04));

        audienceObservations.push({
          id: `aud-in-${audCounter++}`,
          campaignId: cmp.id,
          date: '2024-03-01',
          ageGroup: age,
          gender: gender,
          region: indianRegions[Math.floor(prng() * indianRegions.length)],
          device: devices[Math.floor(prng() * devices.length)],
          placement: placements[Math.floor(prng() * placements.length)],
          impressions: audImpr,
          clicks: audClicks,
          spend: Math.round(audSpend),
          conversions: audConv,
        });
      }
    }
  }

  return {
    campaigns,
    creatives,
    observations,
    audienceObservations,
  };
}
