import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Loader2, Play, Pause, Volume2, Download, Check, X, Camera, FileText, 
  RefreshCw, BookOpen, Calendar, ExternalLink, Share2, Mail, MessageCircle, Instagram, Copy,
  Video, Image as ImageIcon, Music, Film, Mic
} from 'lucide-react';
import { generatePoetry, generateVoice, PoetryResult, VoiceGender, VoiceStyle, SitarRaga, SITAR_RAGAS, pickNextRaga } from './services/poetryService';
import { generateSherStoryCard } from './utils/storyCardGenerator';
import { generateSherStoryVideo, VideoStoryResult } from './utils/storyVideoGenerator';

interface CulturalAd {
  category: 'festival' | 'book' | 'brand';
  categoryLabel: string;
  categoryLabelHindi: string;
  title: string;
  titleUrdu: string;
  subtitle: string;
  badge: string;
  highlight: string;
  linkText: string;
  url: string;
}

const CULTURAL_ADS: CulturalAd[] = [
  {
    category: 'festival',
    categoryLabel: 'Urdu Poetry Festival',
    categoryLabelHindi: 'उर्दू मुशायरा व जश्न',
    title: 'Jashn-e-Rekhta 2025',
    titleUrdu: 'جشنِ ریختہ ۲۰۲۵',
    subtitle: 'The world’s largest festival celebrating Urdu poetry, Ghazals, Nazms, Dastangoi and Sufi baithaks.',
    badge: 'Poetry Festival • New Delhi',
    highlight: 'Grand Mushaira & Hindustani Kavi Sammelan',
    linkText: 'Explore Mehfil Schedule',
    url: 'https://jashnerekhta.org',
  },
  {
    category: 'book',
    categoryLabel: 'Classic Poetry Books',
    categoryLabelHindi: 'कालजयी शायरी व किताबें',
    title: 'Diwan-e-Ghalib & Faiz Anthologies',
    titleUrdu: 'دیوانِ غالب و فیض احمد فیض',
    subtitle: 'Rare collector archival editions by Rajkamal & Rekhta Books with Urdu nastaliq and Hindi translation.',
    badge: 'Hardcover Sahitya Series',
    highlight: 'Mir, Ghalib, Faiz & Sahir Ludhianvi',
    linkText: 'Browse Poetry Books',
    url: 'https://rekhtabooks.com',
  },
  {
    category: 'festival',
    categoryLabel: 'Literature Festival',
    categoryLabelHindi: 'जयपुर साहित्य महोत्सव',
    title: 'Jaipur Literature Festival (JLF)',
    titleUrdu: 'جے پور لٹریچر فیسٹیول',
    subtitle: 'The world’s grandest literary gathering featuring intimate poetry hours and Hindustani bhasha sammelans.',
    badge: 'Cultural Gathering • Diggi Palace',
    highlight: 'Poetry Hour with Gulzar & Shayars',
    linkText: 'View Festival Program',
    url: 'https://jaipurliteraturefestival.org',
  },
  {
    category: 'brand',
    categoryLabel: 'Heritage Cultural Brand',
    categoryLabelHindi: 'साहित्य अकादमी व वाणी प्रकाशन',
    title: 'Vani Prakashan & Urdu Academy',
    titleUrdu: 'وانی پرکاشن و اردو اکیڈمی',
    subtitle: 'Publishing the timeless voices of Dushyant Kumar, modern ghazals, and promoting classical Hindustani arts.',
    badge: '60+ Years of Literary Heritage',
    highlight: 'Patron of Letters & Youth Fellowships',
    linkText: 'Discover Literary Editions',
    url: 'https://sahitya-akademi.gov.in',
  },
];

function CandleIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Candle flame glow halo with subtle flicker */}
      <circle cx="12" cy="5" r="4.5" className="fill-amber-400/25 stroke-none flame-halo-anim" />
      {/* Flickering Flame */}
      <g className="flame-flicker-group" style={{ transformOrigin: "12px 6.5px" }}>
        <path 
          d="M12 2C12.8 3.6 14.2 4.9 14.2 6.5a2.2 2.2 0 1 1-4.4 0C9.8 4.9 11.2 3.6 12 2z" 
          className="fill-amber-400 stroke-amber-600 transition-colors" 
        />
      </g>
      {/* Wick */}
      <line x1="12" y1="6.5" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Candle Pillar / Wax */}
      <path 
        d="M8.5 9.5h7c.3 0 .5.2.5.5v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 19V10c0-.3.2-.5.5-.5z" 
        className="fill-natural-bg/90 stroke-current" 
      />
      {/* Wax drip detailing */}
      <path d="M10 9.5v2.2c0 .4.3.7.7.7s.7-.3.7-.7V9.5" strokeWidth="1.2" />
      {/* Stand / Saucer */}
      <path d="M5.5 21.5h13" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 21.5l1-1.5h7l1 1.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ShamaaIcon({ 
  className = "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14", 
  onClick 
}: { 
  className?: string; 
  onClick?: () => void; 
}) {
  return (
    <div 
      onClick={onClick} 
      className="flex flex-col items-center justify-center cursor-pointer group select-none transition-transform active:scale-95"
      title="शमा-ए-महफ़िल • شمعِ محفل — The Shamaa of the Mehfil"
      aria-label="Shamaa of the Mehfil"
    >
      <svg 
        viewBox="0 0 32 36" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
      >
        {/* Shamaa ambient flame glow with flickering pulse */}
        <circle cx="16" cy="7.5" r="8" className="fill-amber-400/25 blur-[1.5px] stroke-none flame-halo-anim" />
        <circle cx="16" cy="7.5" r="4.5" className="fill-amber-300/40 stroke-none flame-halo-anim" />
        
        {/* Flickering Flame Group */}
        <g className="flame-flicker-group">
          {/* Flickering Outer Flame */}
          <path 
            d="M16 1.8C17.3 3.8 19.5 5.8 19.5 8a3.5 3.5 0 1 1-7 0c0-2.2 2.2-4.2 3.5-6.2z" 
            className="fill-amber-400 stroke-amber-600 transition-colors group-hover:fill-amber-300" 
          />
          
          {/* Inner Flame Core */}
          <path 
            d="M16 4.5C16.6 5.6 17.6 6.8 17.6 8a1.6 1.6 0 1 1-3.2 0c0-1.2 1-2.4 1.6-3.5z" 
            className="fill-amber-100 stroke-amber-200" 
          />
        </g>
        
        {/* Candle Wick */}
        <line x1="16" y1="8" x2="16" y2="12" stroke="#332414" strokeWidth="1.6" />
        
        {/* Shamaa Candle Pillar */}
        <path 
          d="M11 12h10c.5 0 .9.4.9.9v14.2a1.8 1.8 0 0 1-1.8 1.8h-8.2a1.8 1.8 0 0 1-1.8-1.8V12.9c0-.5.4-.9.9-.9z" 
          className="fill-[#fdfaf5] stroke-natural-accent" 
        />
        
        {/* Melted Wax Drips */}
        <path d="M13 12v3.2c0 .5.4.9.9.9s.9-.4.9-.9V12" stroke="#7A7865" strokeWidth="1.2" />
        <path d="M18 12v2c0 .4.3.8.8.8s.8-.4.8-.8V12" stroke="#7A7865" strokeWidth="1.1" />
        
        {/* Mehfil Brass Shamaadaani (Pedestal & Base) */}
        <path d="M8 29h16" stroke="currentColor" strokeWidth="2" />
        <path d="M10 29l1.6-2.5h8.8l1.6 2.5" stroke="currentColor" strokeWidth="1.5" className="fill-[#e8dcc8]" />
        <path d="M6 32h20" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-natural-accent/80 font-serif italic mt-0.5 group-hover:text-natural-accent transition-colors">
        शमा-ए-महफ़िल
      </span>
    </div>
  );
}

/**
 * Abstract white vector Jaali illustration featuring two additional rows of the small circular
 * spandrel Jaali pattern above the central Mughal pointed arch, with a soft vertical fade mask
 * at the top so the Jaali pattern merges seamlessly into the pale handmade paper background.
 */
function JaliWoodenPanelPattern() {
  const cx = 390;
  const left = 16;
  const right = 764;
  // Two full 40px rows (80px+) of the small circular Jaali pattern above the crown of the arch
  const spandrelTopY = 0;
  const archTopY = 92;
  const bottomY = 458;

  // Central pointed ogee arch shape (without outer rectangular frames)
  const outerArchPath = `M ${left},${bottomY} L ${left},222 C ${left},154 ${cx - 190},116 ${cx},${archTopY} C ${cx + 190},116 ${right},154 ${right},222 L ${right},${bottomY}`;
  const innerArchPath = `M ${left + 12},${bottomY} L ${left + 12},226 C ${left + 12},162 ${cx - 175},126 ${cx},${archTopY + 11} C ${cx + 175},126 ${right - 12},162 ${right - 12},226 L ${right - 12},${bottomY}`;
  const innerArchClipPath = `${innerArchPath} Z`;

  return (
    <div
      className="w-[calc(100%+2rem)] sm:w-[calc(100%+4rem)] -mx-4 sm:-mx-8 mt-auto pt-4 select-none pointer-events-none z-10"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 780 462"
        className="w-full h-auto block"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vertical fade gradient & mask so the top of the Jaali merges seamlessly into the background */}
          <linearGradient id="jaali-top-fade-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="8%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.72" />
            <stop offset="34%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </linearGradient>
          <mask id="jaali-top-fade-mask">
            <rect x="0" y="0" width="780" height="462" fill="url(#jaali-top-fade-grad)" />
          </mask>

          {/* Seamless Geometric Star-and-Rosette Jaali Lattice Tile */}
          <pattern
            id="mehfil-jali-lattice"
            x="3"
            y="14"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer Octagonal & Hexagonal Interlocking Strapwork */}
            <polygon
              points="32,2.5 53,11 61.5,32 53,53 32,61.5 11,53 2.5,32 11,11"
              stroke="#FFFFFF"
              strokeWidth="2.4"
            />
            {/* Inner 8-Pointed Star Rosette */}
            <polygon
              points="32,10 38,23.5 51.5,17.5 43,32 51.5,46.5 38,40.5 32,54 26,40.5 12.5,46.5 21,32 12.5,17.5 26,23.5"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Central Octagon & Pinwheel Ribs */}
            <polygon
              points="32,21 40,24 43,32 40,40 32,43 24,40 21,32 24,24"
              stroke="#FFFFFF"
              strokeWidth="1.8"
            />
            <line x1="32" y1="2.5" x2="32" y2="21" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="32" y1="43" x2="32" y2="61.5" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="2.5" y1="32" x2="21" y2="32" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="43" y1="32" x2="61.5" y2="32" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="11" y1="11" x2="24" y2="24" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="40" y1="40" x2="53" y2="53" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="53" y1="11" x2="40" y2="24" stroke="#FFFFFF" strokeWidth="1.9" />
            <line x1="24" y1="40" x2="11" y2="53" stroke="#FFFFFF" strokeWidth="1.9" />

            {/* Corner 4-Pointed Star Interstices at Tile Vertices */}
            <path
              d="M 0,12 L 11,11 L 12,0 M 52,0 L 53,11 L 64,12 M 0,52 L 11,53 L 12,64 M 52,64 L 53,53 L 64,52"
              stroke="#FFFFFF"
              strokeWidth="2.1"
            />
            {/* Diagonal Corner Cross Tie-Bars */}
            <line x1="0" y1="0" x2="11" y2="11" stroke="#FFFFFF" strokeWidth="2.1" />
            <line x1="64" y1="0" x2="53" y2="11" stroke="#FFFFFF" strokeWidth="2.1" />
            <line x1="0" y1="64" x2="11" y2="53" stroke="#FFFFFF" strokeWidth="2.1" />
            <line x1="64" y1="64" x2="53" y2="53" stroke="#FFFFFF" strokeWidth="2.1" />

            {/* Center Rosette Boss */}
            <circle cx="32" cy="32" r="3.6" stroke="#FFFFFF" strokeWidth="1.8" />
          </pattern>

          {/* Small Circular / Spandrel Jaali Pattern Extended by Two Rows Above the Central Arch */}
          <pattern
            id="mehfil-spandrel-lattice"
            x="10"
            y="12"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <polygon
              points="20,1.5 34,6.5 38.5,20 34,33.5 20,38.5 6.5,33.5 1.5,20 6.5,6.5"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <polygon
              points="20,7.5 25,15 32.5,12.5 27.5,20 32.5,27.5 25,25 20,32.5 15,25 7.5,27.5 12.5,20 7.5,12.5 15,15"
              stroke="#FFFFFF"
              strokeWidth="1.6"
            />
            <circle cx="20" cy="20" r="3.2" stroke="#FFFFFF" strokeWidth="1.4" />
            <line x1="20" y1="0" x2="20" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="0" y1="20" x2="40" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="40" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="40" y1="0" x2="0" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
          </pattern>

          {/* Clip Paths for the Extended Spandrel Lattice and Central Arch */}
          <clipPath id="single-bay-spandrel-clip">
            <rect x={left} y={spandrelTopY} width={right - left} height={bottomY - spandrelTopY} />
          </clipPath>
          <clipPath id="single-inner-arch-clip">
            <path d={innerArchClipPath} />
          </clipPath>
        </defs>

        <g mask="url(#jaali-top-fade-mask)">
          {/* Small Circular / Spandrel Jaali Lattice Extended Two Rows Above the Arch */}
          <g clipPath="url(#single-bay-spandrel-clip)">
            <rect
              x={left}
              y={spandrelTopY}
              width={right - left}
              height={bottomY - spandrelTopY}
              fill="url(#mehfil-spandrel-lattice)"
            />
          </g>

          {/* Solid Pale Paper Backing Behind the Central Arch Rib */}
          <path d={`${outerArchPath} Z`} fill="#FAF6EE" />

          {/* Intricate Star-and-Rosette Jaali Lattice Inside the Central Shape */}
          <g clipPath="url(#single-inner-arch-clip)">
            <rect
              x={left + 12}
              y={archTopY + 10}
              width={right - left - 24}
              height={bottomY - archTopY - 10}
              fill="url(#mehfil-jali-lattice)"
            />
          </g>

          {/* Central Arch Shape (Open at the Base, No Outer Rectangular Frame) */}
          <path d={outerArchPath} stroke="#FFFFFF" strokeWidth="3.6" strokeLinecap="round" />
          <path d={innerArchPath} stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />

          {/* Subtle Crown Finial at the Apex of the Central Arch */}
          <circle cx={cx} cy={archTopY + 2} r="6" fill="#FAF6EE" stroke="#FFFFFF" strokeWidth="2.4" />
          <circle cx={cx} cy={archTopY + 2} r="2.4" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
}

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [result, setResult] = useState<PoetryResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSherModal, setShowSherModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('male');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('Master Poet');
  const [currentRaga, setCurrentRaga] = useState<SitarRaga>(() => {
    try {
      const saved = localStorage.getItem('irshad_last_raga') as SitarRaga | null;
      if (saved && SITAR_RAGAS.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore storage access errors
    }
    return 'Rag Yaman';
  });
  const [storyFormat, setStoryFormat] = useState<'video' | 'photo'>('video');
  const [storyCardUrl, setStoryCardUrl] = useState<string | null>(null);
  const [storyCardGenerating, setStoryCardGenerating] = useState(false);
  const [storyVideoResult, setStoryVideoResult] = useState<VideoStoryResult | null>(null);
  const [storyVideoGenerating, setStoryVideoGenerating] = useState(false);
  const [storyVideoProgress, setStoryVideoProgress] = useState(0);
  const [storyVideoProgressLabel, setStoryVideoProgressLabel] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(132);

  // Continuously track real rendered header height including async font loading
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeaderHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    }

    if (document.fonts) {
      document.fonts.ready.then(updateHeaderHeight);
    }

    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Rotate cultural poetry ads while generating poetry
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % CULTURAL_ADS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [loading]);

  const currentAd = CULTURAL_ADS[activeAdIndex] || CULTURAL_ADS[0];

  // Safely request ad refresh from Google AdSense during poetry generation
  useEffect(() => {
    if (loading) {
      try {
        // @ts-expect-error Google AdSense global
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Safe fallback in environments without live Google AdSense
      }
    }
  }, [loading]);

  const reset = () => {
    setImage(null);
    setResult(null);
    setAudioUrl(null);
    setError(null);
    setVoiceLoading(false);
    setLoading(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setStoryCardUrl(null);
    setStoryVideoResult(null);
    setStoryVideoGenerating(false);
    setStoryVideoProgress(0);
    setStoryFormat('video');
    setShowSherModal(false);
    setShowVoiceModal(false);
  };

  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setError("Please select a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImage(optimizedDataUrl);
        } else {
          setImage(rawDataUrl);
        }
        setResult(null);
        setAudioUrl(null);
        setError(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlaying(false);
      };
      img.onerror = () => {
        setImage(rawDataUrl);
        setResult(null);
        setAudioUrl(null);
        setError(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlaying(false);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleIrshaad = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setAudioUrl(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);

    // Choose a new Raga (Rag Yaman, Rag Darbari, or Rag Malkauns) guaranteed not to repeat the previous one
    let prevRaga: SitarRaga | null = currentRaga;
    try {
      const stored = localStorage.getItem('irshad_last_raga') as SitarRaga | null;
      if (stored && SITAR_RAGAS.includes(stored)) {
        prevRaga = stored;
      }
    } catch {
      // Ignore storage errors
    }
    const nextRaga = pickNextRaga(prevRaga);
    setCurrentRaga(nextRaga);
    try {
      localStorage.setItem('irshad_last_raga', nextRaga);
    } catch {
      // Ignore storage errors
    }

    try {
      const poetry = await generatePoetry(image, 'image/jpeg', prevRaga);
      if (poetry.raga && SITAR_RAGAS.includes(poetry.raga) && poetry.raga !== prevRaga) {
        setCurrentRaga(poetry.raga);
        try {
          localStorage.setItem('irshad_last_raga', poetry.raga);
        } catch {
          // Ignore storage errors
        }
      }
      setResult(poetry);
      
      // Pre-generate 9:16 Photo Card with dark gradient & #C8718D typography for instant sharing
      generateSherStoryCard(image, poetry.sherUrdu, poetry.sherHindi)
        .then(cardData => setStoryCardUrl(cardData))
        .catch(err => console.warn("Failed to pre-generate photo card", err));
      
      // Invoke modal dialog to choose voice gender & style once poetry is generated
      setShowVoiceModal(true);
    } catch (err: any) {
      setError(err?.message || "The soul was quiet this time. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVoice = async (
    selectedGender: VoiceGender = voiceGender,
    selectedStyle: VoiceStyle = voiceStyle
  ) => {
    if (!result?.sherUrdu) return;
    setVoiceLoading(true);
    setError(null);
    try {
      const audioDataUri = await generateVoice(result.sherUrdu, selectedGender, selectedStyle, currentRaga);
      setAudioUrl(audioDataUri);
      setStoryVideoResult(null);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioDataUri);
      audioRef.current = audio;
      audio.onplay = () => setPlaying(true);
      audio.onpause = () => setPlaying(false);
      audio.onended = () => setPlaying(false);
      setShowVoiceModal(false);
      await audio.play().catch(e => console.warn("Audio play blocked", e));
      setFeedbackNotice(`Reciting as ${selectedStyle} (${selectedGender === 'male' ? 'Male' : 'Female'}) • Santoor: ${currentRaga}`);
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (voiceErr: any) {
      console.warn("Voice generation failed:", voiceErr);
      setError(voiceErr?.message || "Failed to generate voice recitation.");
    } finally {
      setVoiceLoading(false);
    }
  };

  const togglePlaySher = (specificAudioUrl?: string) => {
    const targetAudio = specificAudioUrl || audioUrl;
    if (!targetAudio) return;

    if (audioRef.current && audioRef.current.src === targetAudio) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(targetAudio);
    audioRef.current = audio;
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
    audio.onended = () => setPlaying(false);
    audio.play().catch(e => console.warn("Audio play blocked", e));
  };

  const downloadAudio = (targetAudioUrl?: string | null, customTitle?: string) => {
    const audioSrc = targetAudioUrl || audioUrl;
    if (!audioSrc) {
      setError("Recording not available to download yet.");
      return;
    }

    try {
      let downloadLinkHref = audioSrc;
      let cleanupUrl: string | null = null;

      if (audioSrc.startsWith('data:')) {
        const parts = audioSrc.split(',');
        const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'audio/wav';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });
        downloadLinkHref = URL.createObjectURL(blob);
        cleanupUrl = downloadLinkHref;
      }

      const a = document.createElement('a');
      a.href = downloadLinkHref;
      const rawTitle = customTitle || result?.title || 'irshaad_voice';
      const safeFilename = rawTitle
        .trim()
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '_') || 'irshaad_voice';

      a.download = `${safeFilename}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (cleanupUrl) {
        setTimeout(() => URL.revokeObjectURL(cleanupUrl!), 2500);
      }

      setFeedbackNotice("Downloaded (.wav)");
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download file.");
    }
  };

  const triggerGenerateStoryVideo = async (targetAudioUrl: string) => {
    if (!image || !result) return;
    setStoryVideoGenerating(true);
    setStoryVideoProgress(0);
    setStoryVideoProgressLabel('Preparing canvas & recitation audio...');

    try {
      const videoRes = await generateSherStoryVideo(
        image,
        result.sherUrdu,
        result.sherHindi,
        targetAudioUrl,
        (progress, label) => {
          setStoryVideoProgress(progress);
          setStoryVideoProgressLabel(label);
        }
      );
      setStoryVideoResult(videoRes);
    } catch (err: unknown) {
      console.error("Story video generation error:", err);
      setError("Could not render story video. You can still share or download the photo card.");
    } finally {
      setStoryVideoGenerating(false);
    }
  };

  const handleGenerateVoiceAndVideo = async () => {
    if (!result?.sherUrdu || !image) return;
    setVoiceLoading(true);
    setError(null);
    try {
      const audioDataUri = await generateVoice(result.sherUrdu, voiceGender, voiceStyle, currentRaga);
      setAudioUrl(audioDataUri);
      setVoiceLoading(false);
      await triggerGenerateStoryVideo(audioDataUri);
    } catch (err: any) {
      setVoiceLoading(false);
      setError(err?.message || "Failed to generate recitation audio.");
    }
  };

  const handleOpenSherModal = async () => {
    if (!image || !result) return;
    setShowSherModal(true);

    // 1. Generate Photo card in background if not ready
    if (!storyCardUrl && !storyCardGenerating) {
      setStoryCardGenerating(true);
      generateSherStoryCard(image, result.sherUrdu, result.sherHindi)
        .then(cardData => setStoryCardUrl(cardData))
        .catch(err => console.warn("Failed to generate photo card", err))
        .finally(() => setStoryCardGenerating(false));
    }

    // 2. If audio is already available and video is not yet rendered, start video generation
    if (audioUrl && !storyVideoResult && !storyVideoGenerating) {
      triggerGenerateStoryVideo(audioUrl);
    }
  };

  const handleDownloadVideo = () => {
    if (!storyVideoResult || !result) return;
    const a = document.createElement('a');
    a.href = storyVideoResult.videoUrl;
    const safeTitle = (result.title || 'irshaad_sher').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    a.download = `${safeTitle}_story_with_voice.${storyVideoResult.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setFeedbackNotice(`Video Story with voice downloaded (.${storyVideoResult.extension})`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleShareInstagramVideo = async () => {
    if (!result) return;

    if (!storyVideoResult) {
      if (audioUrl) {
        await triggerGenerateStoryVideo(audioUrl);
      } else {
        await handleGenerateVoiceAndVideo();
      }
      return;
    }

    const safeTitle = (result.title || 'irshaad_sher').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    const filename = `${safeTitle}_story_with_voice.${storyVideoResult.extension}`;
    const videoFile = new File([storyVideoResult.blob], filename, { type: storyVideoResult.mimeType });

    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        if (navigator.canShare({ files: [videoFile] })) {
          await navigator.share({
            files: [videoFile],
            title: `इरशाद... | ${result.title}`,
            text: `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed from vision on https://irshad.live`,
          });
          return;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn("Native video file share interrupted, falling back to download & copy", err);
    }

    handleDownloadVideo();
    try {
      await navigator.clipboard.writeText(
        `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed from vision on https://irshad.live`
      );
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 4000);
    } catch {
      // ignore
    }
    setFeedbackNotice("Video with voice downloaded & caption copied! Ready to post on Instagram Stories or Reels.");
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleShareWhatsAppVideo = async () => {
    if (!result) return;
    if (!storyVideoResult) {
      if (audioUrl) await triggerGenerateStoryVideo(audioUrl);
      return;
    }

    const safeTitle = (result.title || 'irshaad_sher').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    const filename = `${safeTitle}_story_with_voice.${storyVideoResult.extension}`;
    const videoFile = new File([storyVideoResult.blob], filename, { type: storyVideoResult.mimeType });

    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        if (navigator.canShare({ files: [videoFile] })) {
          await navigator.share({
            files: [videoFile],
            title: `इरशाद... | ${result.title}`,
            text: `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed on irshad.live\nhttps://irshad.live`,
          });
          return;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }

    handleDownloadVideo();
    const shareText = `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed from vision on irshad.live\nhttps://irshad.live`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadCard = () => {
    if (!storyCardUrl || !result) return;
    const a = document.createElement('a');
    a.href = storyCardUrl;
    const safeTitle = (result.title || 'irshaad_sher').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    a.download = `${safeTitle}_story_9x16.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setFeedbackNotice("9:16 Story card downloaded");
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const handleShareInstagram = async () => {
    if (!storyCardUrl || !result) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const response = await fetch(storyCardUrl);
        const blob = await response.blob();
        const file = new File([blob], 'irshaad_sher_story.png', { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `इरशाद... | ${result.title}`,
            text: `${result.sherUrdu}\n${result.sherHindi}\n\n✦ Composed from my vision on https://irshad.live`,
          });
          return;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn("Native file share was not completed, falling back to download & copy", err);
    }

    handleDownloadCard();
    try {
      await navigator.clipboard.writeText(
        `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed from my vision on https://irshad.live`
      );
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 4000);
    } catch {
      // ignore clipboard error
    }
    setFeedbackNotice("Card downloaded & text copied to clipboard! Ready to post on Instagram.");
    setTimeout(() => setFeedbackNotice(null), 4500);
  };

  const handleShareWhatsApp = async () => {
    if (!result) return;
    
    try {
      if (storyCardUrl && typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
        const response = await fetch(storyCardUrl);
        const blob = await response.blob();
        const file = new File([blob], 'irshaad_sher_story.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `इरशाद... | ${result.title}`,
            text: `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed on irshad.live\nhttps://irshad.live`,
          });
          return;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }

    const shareText = `${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed from vision on irshad.live\nhttps://irshad.live`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareEmail = () => {
    if (!result) return;
    const subject = `इरशाद... | ${result.title}`;
    const body = `${result.sherUrdu}\n\n${result.sherHindi}\n\n---\nFull Verse:\n${result.poem}\n\n✦ Composed from vision on https://irshad.live`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#3E021A] flex justify-center">
      <div 
        className="relative min-h-screen w-full max-w-3xl handmade-paper-canvas flex flex-col items-center px-4 sm:px-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-x-hidden"
        style={{ paddingTop: `${headerHeight}px` }}
      >
        <div className="pointer-events-none absolute inset-0 atmosphere opacity-60" />
        
        {/* Header without Drop Shadow and with Dotted Tearable Diary Line */}
        <motion.header 
          ref={headerRef}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 mx-auto w-full max-w-3xl px-4 sm:px-8 flex justify-between items-center z-40 bg-natural-bg/95 backdrop-blur-md pb-3 sm:pb-4 border-b-[3px] border-dotted border-white gap-2 sm:gap-4"
        >
          {/* Left: Hindi Devanagari Header in Gotu font with Hindi byline */}
          <div 
            className="flex flex-col items-start cursor-pointer select-none group shrink-0 pt-[20px]" 
            onClick={reset} 
            title="इरशाद... — Return to canvas"
          >
            <h1 className="font-gotu text-2xl sm:text-3xl md:text-5xl font-bold [-webkit-text-stroke:0.65px_#81314A] [text-shadow:_0_0.5px_0_#81314A] tracking-normal text-[#81314A] group-hover:opacity-80 transition-opacity leading-none">
              इरशाद...
            </h1>
            <span className="font-gotu text-xs sm:text-sm md:text-base text-[#81314A] font-normal tracking-wide mt-1 leading-snug">
              रोशनी का हर ज़र्रा एक नज़्म है
            </span>
          </div>

          {/* Center: Large Candle Icon Indicating the Shamaa of the Mehfil */}
          <div className="flex flex-col items-center justify-center shrink-0 pt-[20px]">
            <ShamaaIcon 
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" 
              onClick={() => setShowAbout(true)} 
            />
          </div>

          {/* Right: Urdu Script Irshaad with Urdu byline */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0 pt-[16px] sm:pt-[18px]">
            <button 
              onClick={() => setShowAbout(true)} 
              className="group select-none cursor-pointer py-0.5 sm:py-1 px-2 rounded-xl hover:bg-[#81314A]/10 active:scale-95 transition-all text-right flex flex-col items-end"
              title="ارشاد... — About & Mehfil"
              aria-label="About Irshaad in Urdu"
              dir="rtl"
            >
              <span className="w-full text-right font-urdu font-black text-3xl sm:text-4xl md:text-5xl text-[#81314A] group-hover:opacity-80 transition-opacity block leading-none drop-shadow-[0_0.5px_0_#81314A] [text-shadow:_0_0.5px_0_#81314A] -translate-y-1.5 sm:-translate-y-2" dir="rtl">
                ارشاد...
              </span>
              <span className="w-full text-right font-urdu text-xs sm:text-sm md:text-base text-[#81314A] font-semibold block mt-2 sm:mt-2.5 leading-snug" dir="rtl">
                روشنی کا ہر ذرہ ایک نظم ہے
              </span>
            </button>
          </div>
        </motion.header>

        <main className="w-full z-10 flex-1 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!image ? (
              /* STATE 1: Blank tearable diary canvas with Camera icon ABOVE the Hindi Devanagari verse */
              <motion.div
                key="blank-canvas"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full flex flex-col items-center justify-center"
              >
                <div 
                  className={`w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center pt-[56px] pb-16 px-4 transition-all relative ${
                    isDragging ? 'ring-2 ring-natural-accent/60 rounded-3xl bg-amber-950/5' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Camera action button ABOVE the poetic text */}
                  <div className="flex flex-col items-center justify-center w-full mb-8 sm:mb-10">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 sm:p-5 bg-[#81314A] text-white rounded-full hover:bg-[#682439] transition-all flex items-center justify-center shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-black/50 active:scale-95 cursor-pointer group"
                      aria-label="Offer a vision"
                      title="Offer a vision"
                    >
                      <Camera className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 transition-transform group-hover:scale-110 shrink-0" />
                    </button>
                  </div>

                  {/* Two-line poetic statement in Hindi Devanagari script using Gotu font */}
                  <div className="text-[14pt] sm:text-[16pt] md:text-[18pt] text-stone-950 font-gotu font-normal max-w-2xl mx-auto leading-relaxed select-none text-center space-y-1">
                    <p>सौंप दो एक तस्वीर</p>
                    <p>शायरी की हवाओं को</p>
                  </div>
                </div>
              </motion.div>
            ) : !result ? (
              /* STATE 2: Image placed, awaiting recitation. Irshad button on the RIGHT without card layout */
              <motion.div
                key="image-ready"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full grid grid-cols-1 md:grid-cols-2 gap-[28px] items-start pt-8 sm:pt-12 pb-16"
              >
                {/* Left Column: Image with center-aligned "Offer new Image" button */}
                <div className="relative group w-full rounded-2xl overflow-hidden shadow-xl bg-white/70 p-4 sm:p-5 flex flex-col justify-start">
                  <div className="relative w-full rounded-xl overflow-hidden flex items-start justify-center bg-stone-100/60">
                    <img 
                      src={image} 
                      alt="Offered vision" 
                      className="w-full max-h-[420px] object-contain rounded-lg object-top" 
                    />
                  </div>

                  <div className="mt-3.5 flex items-center justify-center px-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#81314A]/10 hover:bg-[#81314A]/20 text-[#81314A] text-xs font-semibold tracking-wide font-sans transition-all cursor-pointer hover:shadow-xs active:scale-95"
                      title="Offer new Image"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Offer new Image</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Uncarded Irshad button at the top */}
                <div className="flex flex-col justify-between items-center text-center pt-2">
                  {/* Top part: Irshad action button with yellow text matching the sparkle */}
                  <div className="w-full flex flex-col items-center">
                    <button 
                      type="button"
                      onClick={handleIrshaad}
                      disabled={loading}
                      className={`px-10 py-4 text-amber-300 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-black/50 active:scale-95 w-full sm:w-auto ${
                        loading 
                          ? 'bg-[#81314A] opacity-100 cursor-wait' 
                          : 'bg-[#81314A] hover:bg-[#682439] cursor-pointer'
                      }`}
                      aria-label="Irshad - Generate poetry from vision"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
                          <span>Breathing Soul...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300" />
                          <span>Irshad</span>
                        </>
                      )}
                    </button>

                    {loading && (
                      <p className="font-serif italic text-natural-muted text-xs sm:text-sm mt-3 animate-pulse text-center">
                        The mehfil listens closely. Weaving verses and couplets...
                      </p>
                    )}
                  </div>

                {/* Bottom part of the box: Advertisement shown ONLY while poetry is being generated (limited to Urdu/Hindi poetry festivals, books & cultural brands) */}
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mt-6 flex flex-col items-center"
                  >
                    <div className="w-full max-w-md rounded-xl overflow-hidden border border-natural-border/80 bg-white/95 p-3.5 shadow-md flex flex-col text-left">
                      <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-natural-border/40 px-0.5">
                        <span className="text-[9px] uppercase tracking-widest text-natural-muted font-sans font-semibold">
                          साहित्यिक विज्ञापन • Cultural Partner
                        </span>
                        <span className="text-[9px] text-amber-800/90 bg-amber-50 px-2 py-0.5 rounded font-sans font-medium border border-amber-200/60">
                          {currentAd.categoryLabelHindi}
                        </span>
                      </div>

                      {/* Google AdSense Responsive Unit with Cultural Keywords & Targeting */}
                      <div className="w-full relative overflow-hidden rounded-lg bg-stone-50/90 border border-natural-border/60 p-3 text-left">
                        <ins 
                          className="adsbygoogle"
                          style={{ display: 'block' }}
                          data-ad-client="ca-pub-8859410334476721"
                          data-ad-format="auto"
                          data-full-width-responsive="true"
                        />

                        {/* Curated Urdu/Hindi Poetry Festival, Book & Cultural Brand Showcase */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-natural-accent bg-natural-accent/10 px-2 py-0.5 rounded-full mb-1">
                                {currentAd.category === 'book' ? (
                                  <BookOpen className="w-3 h-3" />
                                ) : (
                                  <Calendar className="w-3 h-3" />
                                )}
                                {currentAd.categoryLabel}
                              </span>
                              <h4 className="text-sm sm:text-base font-serif font-bold text-natural-ink leading-snug">
                                {currentAd.title}
                              </h4>
                            </div>
                            <span className="urdu-text text-base text-stone-700 leading-none shrink-0" dir="rtl">
                              {currentAd.titleUrdu}
                            </span>
                          </div>

                          <p className="text-xs font-serif text-natural-ink/80 leading-relaxed italic">
                            {currentAd.subtitle}
                          </p>

                          <div className="flex items-center justify-between pt-1.5 text-[10px] text-natural-muted border-t border-stone-200/60 mt-0.5">
                            <span className="font-medium text-stone-600 truncate max-w-[210px]">
                              ✦ {currentAd.highlight}
                            </span>
                            <span className="font-sans font-semibold text-natural-accent hover:underline flex items-center gap-0.5 shrink-0">
                              {currentAd.linkText}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Explicit limitation notice & pagination dots */}
                      <div className="mt-2 pt-1 flex items-center justify-between px-0.5 text-[9px] text-natural-muted/75 font-sans">
                        <span>Limited to Urdu/Hindi poetry festivals, books & cultural brands</span>
                        <div className="flex items-center gap-1">
                          {CULTURAL_ADS.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveAdIndex(idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                                idx === activeAdIndex ? 'bg-natural-accent w-3' : 'bg-stone-300'
                              }`}
                              title={`View ${CULTURAL_ADS[idx].title}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Empty spacer when not generating so the Irshaad button remains comfortably positioned at the top */
                  <div className="w-full h-8" />
                )}
              </div>
            </motion.div>
          ) : (
            /* STATE 3: Recited Result. Left: Image & recitation audio. Right: Poetry and Sher */
              <motion.div
                key="result-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-[24px] items-start w-full pt-8 sm:pt-12 pb-16"
              >
                {/* Left Column: Image with center-aligned Offer new Image button */}
                <div className="md:col-span-5 flex flex-col gap-6">
                  <div className="relative group w-full rounded-2xl overflow-hidden shadow-2xl bg-white/60 p-2 sm:p-3 border border-natural-border/50">
                    <div className="relative w-full rounded-xl overflow-hidden">
                      <img 
                        src={image} 
                        alt="Vision" 
                        className="w-full h-auto max-h-[400px] object-cover rounded-xl grayscale-[0.15] hover:grayscale-0 transition-all duration-500" 
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-center px-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#81314A]/10 hover:bg-[#81314A]/20 text-[#81314A] text-xs font-semibold font-sans transition-colors cursor-pointer"
                        title="Offer new Image"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Offer new Image</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Control Icons Bar above Essence (Sher) and Verse (Nazm) */}
                <div className="md:col-span-7 flex flex-col h-full py-1 sm:py-2 relative">
                  {/* Top Control Icons Bar: Play, Edit Voice Type, and Download (left-aligned) | Share (right-aligned) */}
                  <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-natural-border/50">
                    <div className="flex items-center gap-2.5">
                      {/* Play / Pause Icon */}
                      <button
                        type="button"
                        onClick={() => {
                          if (audioUrl) {
                            togglePlaySher();
                          } else if (!voiceLoading) {
                            setShowVoiceModal(true);
                          }
                        }}
                        disabled={voiceLoading}
                        className="p-2.5 bg-[#81314A] text-amber-300 rounded-full hover:bg-[#682439] transition-all shadow-md flex items-center justify-center active:scale-95 cursor-pointer disabled:opacity-70"
                        aria-label={playing ? "Pause recitation" : "Play recitation"}
                        title={playing ? "Pause recitation" : "Play recitation"}
                      >
                        {voiceLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        ) : playing ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      {/* Edit Voice Type Icon */}
                      <button
                        type="button"
                        onClick={() => setShowVoiceModal(true)}
                        className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[#81314A] border border-natural-border/70 hover:border-[#81314A] transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer"
                        aria-label="Edit voice type"
                        title={`Edit voice type (${voiceStyle} • ${voiceGender === 'male' ? 'Male' : 'Female'})`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Download Icon */}
                      <button
                        type="button"
                        onClick={() => {
                          if (audioUrl) {
                            downloadAudio();
                          } else if (storyCardUrl) {
                            handleDownloadCard();
                          } else {
                            setShowVoiceModal(true);
                          }
                        }}
                        className="p-2.5 rounded-full bg-white/80 hover:bg-white text-[#81314A] border border-natural-border/70 hover:border-[#81314A] transition-all shadow-xs flex items-center justify-center active:scale-95 cursor-pointer"
                        aria-label="Download"
                        title={audioUrl ? "Download recitation audio (.wav)" : "Download"}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right-aligned Share Icon */}
                    <button
                      type="button"
                      onClick={handleOpenSherModal}
                      className="p-2.5 bg-[#81314A] text-amber-300 hover:bg-[#682439] rounded-full transition-all shadow-md flex items-center justify-center active:scale-95 cursor-pointer"
                      aria-label="Share"
                      title="शेर IT — Share story card or video"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Couplet: Urdu version (right-aligned) followed by Hindi version (left-aligned) */}
                  <div className="mb-8 sm:mb-10 pb-8 border-b border-natural-border/50">
                    <div className="urdu-text mb-4 text-[#1A1917] text-[20px] sm:text-[24px] md:text-[28px] text-right leading-[1.8]" dir="rtl">
                      {result.sherUrdu}
                    </div>
                    <p className="font-hindi text-black font-normal text-base sm:text-lg md:text-xl tracking-wide text-left leading-relaxed whitespace-pre-line">
                      {result.sherHindi}
                    </p>
                  </div>

                  {/* Verse at the bottom (no scroll, same Hindi body font size as the poem above, title reduced by 10pt) */}
                  <div className="flex-1 flex flex-col justify-start text-left">
                    <h2 className="font-hindi font-bold [-webkit-text-stroke:0.55px_currentColor] [text-shadow:_0_0.4px_0_currentColor] text-[11pt] sm:text-[13pt] md:text-[26pt] leading-tight text-natural-ink mb-5">
                      {result.title}
                    </h2>
                    <div className="space-y-4 sm:space-y-5 text-base sm:text-lg md:text-xl font-hindi font-normal text-natural-ink/90 leading-relaxed tracking-wide text-left">
                      {result.poem.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
          )}
              </AnimatePresence>
      </main>



      {/* Hidden file input for file selection */}
      <input 
        type="file" 
        hidden 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        accept="image/*"
      />

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 sm:bottom-12 px-6 py-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-full shadow-lg z-50 flex items-center gap-2"
        >
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} />
          <span>{error}</span>
        </motion.div>
      )}

      {feedbackNotice && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-8 sm:bottom-12 px-6 py-3 bg-natural-accent text-white border border-natural-accent/30 text-xs rounded-full shadow-xl z-50 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{feedbackNotice}</span>
        </motion.div>
      )}

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAbout(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-natural-bg/95 border border-natural-border/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Warm decorative candle light glow */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-natural-accent border border-amber-500/20">
                    <CandleIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h2 className="font-gotu text-2xl md:text-3xl font-bold [-webkit-text-stroke:0.55px_#81314A] [text-shadow:_0_0.5px_0_#81314A] text-[#81314A] leading-none">
                        इरशाद...
                      </h2>
                      <span className="font-urdu font-bold text-xl md:text-2xl text-[#81314A]" dir="rtl">
                        ارشاد...
                      </span>
                    </div>
                    <p className="serif italic text-xs text-natural-muted mt-1">
                      The Voice of Poetry &amp; Remembrance
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAbout(false)}
                  className="p-1.5 rounded-full text-natural-muted hover:text-natural-ink hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-natural-ink text-sm leading-relaxed serif">
                <p>
                  <strong className="text-natural-accent font-semibold not-italic">"इरशाद"</strong> (Irshaad) is the traditional call of Urdu mushairas—an eager invitation from the gathering asking the poet to speak, illuminate, and give voice to the quiet spaces of the heart.
                </p>
                <p className="text-natural-muted text-xs md:text-sm">
                  Just as a glowing candle (<em className="font-serif">शमा</em>) is placed before the poet in a mehfil, this canvas invites you to share an image and receive a reflective free-verse poem along with an evocative couplet (<em className="font-serif">शे'र</em>) in both Hindi and Nastaliq Urdu scripts, accompanied by the poet's authentic voice.
                </p>
                <div className="p-3.5 rounded-2xl bg-white/60 border border-natural-border/50 text-xs italic text-natural-muted space-y-1">
                  <div className="flex items-center gap-1.5 text-natural-accent font-sans not-italic font-semibold text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> The Poetic Touch
                  </div>
                  <p>
                    "हाथ छूटे भी तो रिश्ते नहीं छूटा करते... वक्त की शाख़ से लम्हे नहीं टूटा करते।"
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-natural-border/60 flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase tracking-widest text-natural-muted/60">
                  Quiet Whispers
                </span>
                <button
                  onClick={() => setShowAbout(false)}
                  className="px-5 py-2 bg-[#81314A] text-white rounded-full text-[10px] uppercase tracking-widest font-semibold hover:bg-[#682439] transition-colors shadow-sm cursor-pointer"
                >
                  Return to Mehfil
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal (Google AdSense Compliance) */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-natural-bg/95 border border-natural-border/80 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-natural-border/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-hindi text-xl md:text-2xl font-bold text-[#81314A]">
                    Privacy Policy • गोपनीयता नीति
                  </h3>
                </div>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="p-1.5 rounded-full text-natural-muted hover:text-natural-ink hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-natural-ink/80 serif leading-relaxed">
                <div>
                  <h4 className="font-sans font-bold text-natural-ink uppercase tracking-wider text-[11px] mb-1">
                    1. Real-Time Vision &amp; Image Privacy
                  </h4>
                  <p>
                    When you offer an image to "इरशाद...", it is analyzed in real-time memory solely to generate verses and couplets. We do not permanently store, catalogue, sell, or distribute your images. Temporary memory buffers are cleared when generation completes.
                  </p>
                </div>

                <div>
                  <h4 className="font-sans font-bold text-natural-ink uppercase tracking-wider text-[11px] mb-1">
                    2. Google AdSense &amp; Advertising Cookies
                  </h4>
                  <p>
                    We display advertisements through Google AdSense. Google uses cookies to serve ads based on a user's prior visits to this and other websites. Users may opt out of personalized advertising by visiting:
                  </p>
                  <div className="mt-1 flex flex-col gap-1 font-sans text-xs">
                    <a
                      href="https://adssettings.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#81314A] underline flex items-center gap-1 font-medium"
                    >
                      Google Ads Settings <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://www.aboutads.info"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#81314A] underline flex items-center gap-1 font-medium"
                    >
                      Network Advertising Initiative (aboutads.info) <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-sans font-bold text-natural-ink uppercase tracking-wider text-[11px] mb-1">
                    3. Contact Information
                  </h4>
                  <p>
                    For questions regarding this policy or the platform, contact: <strong className="font-sans">sourabh.dubey@gmail.com</strong>
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-natural-border/60 flex items-center justify-between">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-sans text-[#81314A] hover:underline flex items-center gap-1"
                >
                  Full Document (/privacy) <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="px-5 py-2 bg-[#81314A] text-white rounded-full text-[10px] uppercase tracking-widest font-semibold hover:bg-[#682439] transition-colors shadow-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHER IT Modal — Fullscreen 9:16 Visual Card & Multi-Platform Sharing */}
      <AnimatePresence>
        {showSherModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowSherModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="bg-natural-bg border border-natural-border/80 rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-natural-border/60 gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-hindi text-xl sm:text-2xl font-extrabold text-[#81314A]">
                    शेर IT
                  </span>
                  <span className="text-xs font-serif italic text-stone-500 hidden sm:inline">
                    9:16 Story &amp; Status
                  </span>
                </div>

                {/* Story Format Selector Tabs */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-stone-200/80 p-1 rounded-2xl border border-natural-border/60">
                    <button
                      type="button"
                      onClick={() => {
                        setStoryFormat('video');
                        if (!storyVideoResult && !storyVideoGenerating && audioUrl) {
                          triggerGenerateStoryVideo(audioUrl);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        storyFormat === 'video'
                          ? 'bg-[#81314A] text-white shadow-sm'
                          : 'text-stone-700 hover:text-black'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video with Voice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoryFormat('photo')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        storyFormat === 'photo'
                          ? 'bg-[#81314A] text-white shadow-sm'
                          : 'text-stone-700 hover:text-black'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Photo Card</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSherModal(false)}
                    className="p-1.5 rounded-full text-natural-muted hover:text-natural-ink hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Content Area: Left = 9:16 Preview (Video or Photo), Right = Sharing Options */}
              <div className="flex-1 overflow-y-auto pt-4 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* 9:16 Preview Box */}
                <div className="md:col-span-6 flex flex-col items-center justify-center">
                  <div className="relative aspect-[9/16] w-full max-w-[270px] sm:max-w-[310px] rounded-2xl overflow-hidden shadow-2xl border border-natural-border/80 bg-stone-900 flex items-center justify-center">
                    {storyFormat === 'video' ? (
                      storyVideoGenerating ? (
                        <div className="flex flex-col items-center justify-center gap-3.5 p-6 text-center text-stone-200">
                          <Loader2 className="w-9 h-9 text-amber-400 animate-spin" />
                          <div className="flex flex-col items-center gap-1 w-full max-w-[220px]">
                            <span className="font-serif italic text-sm text-amber-100">
                              Weaving Video Story with Voice...
                            </span>
                            <span className="font-sans text-[11px] text-stone-300">
                              {storyVideoProgressLabel || 'Synthesizing 1080×1920 video...'}
                            </span>
                            {/* Animated Progress Bar */}
                            <div className="w-full h-1.5 bg-stone-700 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-[#81314A] transition-all duration-300 rounded-full"
                                style={{ width: `${Math.max(storyVideoProgress, 8)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              {storyVideoProgress}%
                            </span>
                          </div>
                        </div>
                      ) : storyVideoResult ? (
                        <video
                          key={storyVideoResult.videoUrl}
                          src={storyVideoResult.videoUrl}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="w-full h-full object-contain rounded-2xl select-none bg-black"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-stone-300">
                          <Music className="w-8 h-8 text-amber-400/80" />
                          <p className="font-serif italic text-xs text-stone-300 max-w-[210px] leading-relaxed">
                            Combine your vision image, couplet, and poet recitation into a living 9:16 video.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (audioUrl) {
                                triggerGenerateStoryVideo(audioUrl);
                              } else {
                                handleGenerateVoiceAndVideo();
                              }
                            }}
                            className="px-4 py-2 bg-[#81314A] text-white rounded-full text-xs font-semibold hover:bg-[#682439] transition-all shadow-md active:scale-95 cursor-pointer mt-1"
                          >
                            {audioUrl ? "Generate Video Story" : "Compose Voice & Video"}
                          </button>
                        </div>
                      )
                    ) : (
                      storyCardGenerating ? (
                        <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-stone-200 bg-black w-full h-full">
                          <Loader2 className="w-8 h-8 text-[#C8718D] animate-spin" />
                          <span className="font-serif italic text-xs sm:text-sm text-stone-300">
                            Weaving 9:16 Photo Card...
                          </span>
                        </div>
                      ) : storyCardUrl ? (
                        <img 
                          src={storyCardUrl} 
                          alt="9:16 Sher Story Card" 
                          className="w-full h-full object-contain select-none bg-black" 
                        />
                      ) : (
                        <span className="font-serif italic text-xs text-natural-muted">Preparing card...</span>
                      )
                    )}
                  </div>
                  <span className="text-[10px] font-sans text-natural-muted mt-2 text-center">
                    {storyFormat === 'video' 
                      ? '1080 × 1920 HD • Audio recitation synchronized • Story & Reel ready'
                      : 'Standard 1080 × 1920 HD Story & Status format'}
                  </span>
                </div>

                {/* Right: Sharing Actions */}
                <div className="md:col-span-6 flex flex-col gap-3 justify-center">
                  <div className="mb-1">
                    <h4 className="font-serif italic text-lg sm:text-xl font-bold text-natural-ink">
                      {storyFormat === 'video' ? 'Share Video Story with Voice' : 'Share Photo Story Card'}
                    </h4>
                    <p className="text-xs text-natural-muted font-sans mt-0.5">
                      {storyFormat === 'video'
                        ? 'Publishes to Instagram Stories, WhatsApp Status & Reels with the poet reciting aloud:'
                        : 'Choose where you would like to post or save your custom 9:16 card:'}
                    </p>
                  </div>

                  {storyFormat === 'video' ? (
                    <>
                      {/* 1. Instagram Stories & Reels (Video with Recitation Audio) */}
                      <button
                        type="button"
                        onClick={handleShareInstagramVideo}
                        className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-95 transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/20 shrink-0">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <span>Instagram Stories &amp; Reels</span>
                          </div>
                          <span className="text-[11px] opacity-90 block leading-tight font-sans">
                            Direct Story share with sound on mobile • Auto-downloads on desktop
                          </span>
                        </div>
                      </button>

                      {/* 2. WhatsApp Status & Video */}
                      <button
                        type="button"
                        onClick={handleShareWhatsAppVideo}
                        className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#25D366] text-white hover:bg-[#20ba59] transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/20 shrink-0">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs sm:text-sm uppercase tracking-wider">
                            WhatsApp Status &amp; Chat
                          </div>
                          <span className="text-[11px] opacity-90 block leading-tight font-sans">
                            Share 9:16 video with recitation audio to Status or contacts
                          </span>
                        </div>
                      </button>

                      {/* 3. Direct Download Video */}
                      <button
                        type="button"
                        onClick={() => {
                          if (storyVideoResult) {
                            handleDownloadVideo();
                          } else if (audioUrl) {
                            triggerGenerateStoryVideo(audioUrl);
                          } else {
                            handleGenerateVoiceAndVideo();
                          }
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[#81314A] text-white hover:bg-[#682439] transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/15 shrink-0">
                          <Download className="w-4 h-4 text-amber-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs uppercase tracking-wider">
                            Download Video (.{storyVideoResult?.extension || 'mp4'})
                          </div>
                          <span className="text-[10px] text-white/80 block leading-tight font-sans">
                            Save full HD 9:16 video with poet's recitation to device
                          </span>
                        </div>
                      </button>

                      {/* Re-render Video button if user wants to recreate */}
                      {storyVideoResult && !storyVideoGenerating && (
                        <div className="pt-0.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (audioUrl) triggerGenerateStoryVideo(audioUrl);
                            }}
                            className="text-[11px] font-sans text-stone-500 hover:text-[#81314A] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Re-render video story</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Photo Card Options */}
                      {/* 1. Instagram */}
                      <button
                        type="button"
                        onClick={handleShareInstagram}
                        className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white hover:opacity-95 transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/20 shrink-0">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                            <span>Instagram Stories &amp; Feed</span>
                          </div>
                          <span className="text-[11px] opacity-90 block leading-tight font-sans">
                            Direct Story share on mobile • Auto-downloads on desktop
                          </span>
                        </div>
                      </button>

                      {/* 2. WhatsApp */}
                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-[#25D366] text-white hover:bg-[#20ba59] transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/20 shrink-0">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs sm:text-sm uppercase tracking-wider">
                            WhatsApp Status &amp; Chat
                          </div>
                          <span className="text-[11px] opacity-90 block leading-tight font-sans">
                            Share couplet &amp; card directly to contacts or status
                          </span>
                        </div>
                      </button>

                      {/* 3. Email */}
                      <button
                        type="button"
                        onClick={handleShareEmail}
                        className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-stone-800 text-white hover:bg-stone-900 transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/10 shrink-0">
                          <Mail className="w-4 h-4 text-stone-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs uppercase tracking-wider">
                            Email Couplet &amp; Poem
                          </div>
                          <span className="text-[10px] text-stone-300 block leading-tight font-sans">
                            Send full verse &amp; couplet directly via your email client
                          </span>
                        </div>
                      </button>

                      {/* 4. Direct Download */}
                      <button
                        type="button"
                        onClick={handleDownloadCard}
                        className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-[#81314A] text-white hover:bg-[#682439] transition-all shadow-md active:scale-98 cursor-pointer text-left"
                      >
                        <div className="p-2 rounded-xl bg-white/15 shrink-0">
                          <Download className="w-4 h-4 text-amber-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-sans font-bold text-xs uppercase tracking-wider">
                            Download Image (.png)
                          </div>
                          <span className="text-[10px] text-white/80 block leading-tight font-sans">
                            Save original HD card to device gallery or files
                          </span>
                        </div>
                      </button>
                    </>
                  )}

                  {/* Copy Text Shortcut */}
                  <div className="pt-1 flex items-center justify-between text-xs text-natural-muted">
                    <button
                      type="button"
                      onClick={() => {
                        if (result) {
                          navigator.clipboard.writeText(`${result.sherUrdu}\n\n${result.sherHindi}\n\n✦ Composed from vision on irshad.live\nhttps://irshad.live`);
                          setCopiedNotice(true);
                          setTimeout(() => setCopiedNotice(false), 3000);
                        }
                      }}
                      className="flex items-center gap-1.5 hover:text-natural-ink transition-colors cursor-pointer text-[11px]"
                    >
                      {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNotice ? "Copied couplet to clipboard!" : "Copy caption text"}</span>
                    </button>
                    <span className="text-[11px] font-serif italic text-stone-500">
                      irshad.live
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Selection Modal Dialog (Invoked once poetry is generated) */}
      <AnimatePresence>
        {showVoiceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!voiceLoading) setShowVoiceModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="bg-natural-bg border border-natural-border/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-gotu text-xl sm:text-2xl text-[#81314A] leading-tight">
                    Choose the Poet&apos;s Voice
                  </h3>
                  <p className="text-xs font-serif italic text-natural-muted mt-0.5">
                    Select voice gender and recitation persona for your verse
                  </p>
                </div>
                {!voiceLoading && (
                  <button
                    type="button"
                    onClick={() => setShowVoiceModal(false)}
                    className="p-1.5 rounded-full text-natural-muted hover:text-natural-ink hover:bg-black/5 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* 1. Gender Selection: Male / Female */}
              <div className="mb-5">
                <label className="block text-[11px] uppercase tracking-widest text-natural-muted font-sans font-semibold mb-2">
                  Voice Gender
                </label>
                <div className="grid grid-cols-2 gap-2.5 bg-stone-200/70 p-1.5 rounded-2xl border border-natural-border/60">
                  {(['male', 'female'] as VoiceGender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={voiceLoading}
                      onClick={() => setVoiceGender(g)}
                      className={`py-2.5 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                        voiceGender === g
                          ? 'bg-[#81314A] text-amber-300 shadow-sm'
                          : 'text-stone-700 hover:text-black'
                      }`}
                    >
                      {g === 'male' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Style Selection: Master Poet, Dawn melody, Mystic Soul */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-widest text-natural-muted font-sans font-semibold mb-2">
                  Recitation Style
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {([
                    {
                      id: 'Master Poet' as VoiceStyle,
                      label: 'Master Poet',
                      desc: 'Seasoned mushaira gravitas & dramatic passion',
                    },
                    {
                      id: 'Dawn melody' as VoiceStyle,
                      label: 'Dawn melody',
                      desc: 'Gentle morning-breeze softness & lyrical grace',
                    },
                    {
                      id: 'Mystic Soul' as VoiceStyle,
                      label: 'Mystic Soul',
                      desc: 'Meditative Sufi stillness & spiritual depth',
                    },
                  ]).map((item) => {
                    const active = voiceStyle === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={voiceLoading}
                        onClick={() => setVoiceStyle(item.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          active
                            ? 'bg-[#81314A]/10 border-[#81314A] shadow-xs'
                            : 'bg-white/60 border-natural-border/70 hover:border-[#81314A]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`font-serif font-bold text-sm ${active ? 'text-[#81314A]' : 'text-natural-ink'}`}>
                            {item.label}
                          </span>
                          {active && <Check className="w-3.5 h-3.5 text-[#81314A] shrink-0" />}
                        </div>
                        <span className="text-[11px] font-serif italic text-natural-muted leading-snug">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Confirm & Generate Voice Action */}
              <button
                type="button"
                disabled={voiceLoading}
                onClick={() => handleGenerateVoice(voiceGender, voiceStyle)}
                className="w-full py-3.5 px-6 bg-[#81314A] hover:bg-[#682439] text-amber-300 rounded-full text-xs uppercase tracking-widest font-semibold transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 disabled:opacity-80 disabled:cursor-wait"
              >
                {voiceLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Composing &amp; Playing Voice...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-amber-300" />
                    <span>Generate &amp; Play Voice</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* White Vector Jali Wooden Paneling Pattern above the Footer */}
      <JaliWoodenPanelPattern />

      {/* Elegant Footer with Compliance Links below the Jaali */}
      <footer className="w-full pt-4 pb-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs text-natural-muted font-sans z-10 select-none">
        <span className="font-gotu text-stone-700">इरशाद... • irshad.live</span>
        <span className="hidden sm:inline text-stone-300">•</span>
        <button 
          onClick={() => setShowAbout(true)} 
          className="hover:text-[#81314A] transition-colors cursor-pointer"
        >
          About &amp; Mehfil
        </button>
        <span className="text-stone-300">•</span>
        <button 
          onClick={() => setShowPrivacy(true)} 
          className="hover:text-[#81314A] transition-colors cursor-pointer"
        >
          Privacy Policy
        </button>
      </footer>

      </div>
    </div>
  );
}
