/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, 
  Download, 
  Image as ImageIcon, 
  Loader2, 
  History,
  Trash2,
  Palette,
  Ghost,
  Rocket,
  Star,
  Search,
  Plus,
  Heart,
  Share2,
  Cloud,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  timestamp: number;
  height?: number; // For Pinterest-style masonry
}

const FEATURED_IMAGES: GeneratedImage[] = [
  {
    id: 'f1',
    url: 'https://picsum.photos/seed/toon1/400/600',
    prompt: 'A cute astronaut cat floating in space',
    style: '3D Animation',
    timestamp: Date.now(),
    height: 600
  },
  {
    id: 'f2',
    url: 'https://picsum.photos/seed/toon2/400/400',
    prompt: 'Cyberpunk ramen shop in Tokyo',
    style: 'Anime Style',
    timestamp: Date.now(),
    height: 400
  },
  {
    id: 'f3',
    url: 'https://picsum.photos/seed/toon3/400/500',
    prompt: 'A magical forest with glowing mushrooms',
    style: 'Classic Disney',
    timestamp: Date.now(),
    height: 500
  },
  {
    id: 'f4',
    url: 'https://picsum.photos/seed/toon4/400/700',
    prompt: 'Superhero dog flying over a city',
    style: 'Comic Book',
    timestamp: Date.now(),
    height: 700
  },
  {
    id: 'f5',
    url: 'https://picsum.photos/seed/toon5/400/450',
    prompt: 'Retro future car driving on a neon highway',
    style: 'Vibrant Toon',
    timestamp: Date.now(),
    height: 450
  },
  {
    id: 'f6',
    url: 'https://picsum.photos/seed/toon6/400/550',
    prompt: 'A cozy cottage in a giant pumpkin',
    style: 'Sketchy Doodle',
    timestamp: Date.now(),
    height: 550
  },
  {
    id: 'f7',
    url: 'https://picsum.photos/seed/toon7/400/400',
    prompt: 'Samurai robot in a bamboo forest',
    style: 'Anime Style',
    timestamp: Date.now(),
    height: 400
  },
  {
    id: 'f8',
    url: 'https://picsum.photos/seed/toon8/400/650',
    prompt: 'A dragon made of candy and sprinkles',
    style: '3D Animation',
    timestamp: Date.now(),
    height: 650
  },
  {
    id: 'f9',
    url: 'https://picsum.photos/seed/toon9/400/500',
    prompt: 'Steampunk owl with brass wings',
    style: 'Comic Book',
    timestamp: Date.now(),
    height: 500
  },
  {
    id: 'f10',
    url: 'https://picsum.photos/seed/toon10/400/400',
    prompt: 'Underwater city with bubble domes',
    style: 'Vibrant Toon',
    timestamp: Date.now(),
    height: 400
  },
  {
    id: 'f11',
    url: 'https://picsum.photos/seed/toon11/400/600',
    prompt: 'A wizard mouse brewing a potion',
    style: 'Classic Disney',
    timestamp: Date.now(),
    height: 600
  },
  {
    id: 'f12',
    url: 'https://picsum.photos/seed/toon12/400/450',
    prompt: 'Neon jellyfish in a dark ocean',
    style: 'Anime Style',
    timestamp: Date.now(),
    height: 450
  },
  {
    id: 'f13',
    url: 'https://picsum.photos/seed/toon13/400/700',
    prompt: 'A giant turtle carrying a village',
    style: '3D Animation',
    timestamp: Date.now(),
    height: 700
  },
  {
    id: 'f14',
    url: 'https://picsum.photos/seed/toon14/400/550',
    prompt: 'Space explorer discovering a crystal planet',
    style: 'Comic Book',
    timestamp: Date.now(),
    height: 550
  },
  {
    id: 'f15',
    url: 'https://picsum.photos/seed/toon15/400/400',
    prompt: 'A fox playing a violin in the rain',
    style: 'Sketchy Doodle',
    timestamp: Date.now(),
    height: 400
  }
];

const TOON_STYLES = [
  { id: 'vibrant', name: 'Vibrant', prompt: 'vibrant, high-quality cartoon illustration, bold outlines, bright colors' },
  { id: 'anime', name: 'Anime', prompt: 'modern anime art style, high detail, expressive eyes, cinematic lighting' },
  { id: 'ghibli', name: 'Ghibli', prompt: 'Studio Ghibli art style, hand-painted aesthetic, soft watercolor textures, whimsical and nostalgic atmosphere' },
  { id: 'disney', name: 'Disney', prompt: '1940s classic Disney animation style, soft edges, whimsical characters, hand-painted background' },
  { id: 'pixar', name: 'Pixar', prompt: 'modern 3D animation style, Pixar-like, soft lighting, detailed textures, cute proportions' },
  { id: 'comic', name: 'Comic', prompt: 'classic comic book art, halftone dots, dramatic shadows, bold ink lines' },
  { id: 'sketch', name: 'Sketch', prompt: 'playful hand-drawn sketch, colored pencil texture, loose lines, charming doodle style' },
  { id: 'pixel', name: 'Pixel', prompt: 'detailed 16-bit pixel art, retro video game style, vibrant color palette' },
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(TOON_STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Anime', 'Ghibli', 'Disney', 'Pixar', 'Comic', 'Sketch', 'Vibrant'];

  const generateImage = async () => {
    if (!prompt.trim() && !uploadedImage) return;

    setIsGenerating(true);
    setError(null);

    try {
      const parts: any[] = [];
      
      if (uploadedImage) {
        parts.push({
          inlineData: {
            data: uploadedImage.split(',')[1],
            mimeType: 'image/png'
          }
        });
        const transformationPrompt = `Transform this image into a ${selectedStyle.name} cartoon. Style details: ${selectedStyle.prompt}. ${prompt}`;
        parts.push({ text: transformationPrompt });
      } else {
        const cartoonPrompt = `${selectedStyle.prompt} of: ${prompt}. Playful and high quality.`;
        parts.push({ text: cartoonPrompt });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: { aspectRatio: "1:1" },
        },
      });

      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
          break;
        }
      }

      if (imageUrl) {
        const newImage: GeneratedImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: imageUrl,
          prompt: prompt,
          style: selectedStyle.name,
          timestamp: Date.now(),
          height: 400 + Math.floor(Math.random() * 300) // Random height for masonry
        };
        setHistory(prev => [newImage, ...prev]);
        setShowGenerator(false);
        setPrompt('');
      } else {
        throw new Error('Oops! The toon machine got stuck. Try again!');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate toon');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `toon-${filename.slice(0, 20)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const allImages = [...history, ...FEATURED_IMAGES];
  const filteredImages = allImages.filter(img => {
    if (activeCategory === 'All') return true;
    return img.style.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#FFDE59] font-sans">
      {/* Pinterest-style Header */}
      <header className="sticky top-0 z-50 bg-white border-b-4 border-[#2D2D2D] px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-10 h-10 bg-[#FF5757] border-2 border-[#2D2D2D] rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_#2D2D2D]">
            <Palette className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight text-[#2D2D2D] hidden sm:block">ToonCraft</h1>
        </div>

        <div className="flex-1 max-w-2xl mx-auto relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2D2D2D]/40 group-focus-within:text-[#FF5757] transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input 
            id="main-search-input"
            type="text" 
            placeholder="Search for toons or type to generate..."
            className="w-full bg-[#F0F0F0] border-2 border-transparent focus:border-[#2D2D2D] rounded-full py-2.5 pl-12 pr-4 outline-none font-bold transition-all"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setShowGenerator(true)}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button 
            id="create-toon-header-btn"
            onClick={() => setShowGenerator(!showGenerator)}
            className="toon-button w-10 h-10 p-0 flex items-center justify-center rounded-full"
            title="Create Toon"
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 bg-[#2D2D2D] rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
            RK
          </div>
        </div>
      </header>

      {/* Category Bar */}
      <div id="category-bar" className="bg-white border-b-4 border-[#2D2D2D] px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar sticky top-[72px] z-30">
        {categories.map((cat) => (
          <button
            id={`category-btn-${cat.toLowerCase()}`}
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full font-display font-bold text-sm transition-all whitespace-nowrap border-2 ${
              activeCategory === cat 
                ? 'bg-[#FF5757] text-white border-[#2D2D2D] shadow-[2px_2px_0px_0px_#2D2D2D]' 
                : 'bg-[#F0F0F0] text-[#2D2D2D] border-transparent hover:border-[#2D2D2D]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Generator Overlay */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[120px] z-40 p-4 bg-[#FFDE59]/95 backdrop-blur-md border-b-4 border-[#2D2D2D] shadow-2xl"
          >
            <div className="max-w-3xl mx-auto">
              <div className="toon-card p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-black text-2xl text-[#2D2D2D] flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-[#FF5757]" />
                    What are we baking today?
                  </h2>
                  <button 
                    onClick={() => setShowGenerator(false)}
                    className="text-[#2D2D2D]/40 hover:text-[#FF5757] transition-colors"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black uppercase tracking-wider text-[#2D2D2D]/60">Select Your Style</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                    {TOON_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`p-3 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 group ${
                          selectedStyle.id === style.id
                            ? 'bg-[#FF5757] border-[#2D2D2D] text-white shadow-[4px_4px_0px_0px_#2D2D2D] -translate-y-1'
                            : 'bg-white border-transparent hover:border-[#2D2D2D] text-[#2D2D2D]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#2D2D2D] shadow-[2px_2px_0px_0px_#2D2D2D] group-hover:scale-110 transition-transform ${
                          selectedStyle.id === style.id ? 'bg-white text-[#FF5757]' : 'bg-[#FFDE59]'
                        }`}>
                          {style.id === 'anime' && <Star className="w-5 h-5" />}
                          {style.id === 'ghibli' && <Cloud className="w-5 h-5" />}
                          {style.id === 'disney' && <Heart className="w-5 h-5" />}
                          {style.id === 'pixar' && <Zap className="w-5 h-5" />}
                          {style.id === 'comic' && <Plus className="w-5 h-5" />}
                          {style.id === 'sketch' && <Palette className="w-5 h-5" />}
                          {style.id === 'vibrant' && <Sparkles className="w-5 h-5" />}
                          {style.id === 'pixel' && <Ghost className="w-5 h-5" />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight text-center">{style.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Upload Zone */}
                  <div className="w-full md:w-64 shrink-0">
                    <label 
                      id="image-upload-label"
                      className={`relative h-48 border-4 border-dashed border-[#2D2D2D] rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                        uploadedImage ? 'bg-white' : 'bg-[#F0F0F0] hover:bg-white'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload}
                      />
                      {uploadedImage ? (
                        <>
                          <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setUploadedImage(null);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-[#FF5757] border-2 border-[#2D2D2D] rounded-full flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#2D2D2D]"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <div className="w-12 h-12 bg-white border-2 border-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-2 shadow-[2px_2px_0px_0px_#2D2D2D]">
                            <Plus className="w-6 h-6 text-[#2D2D2D]" />
                          </div>
                          <p className="text-xs font-black uppercase tracking-wider text-[#2D2D2D]">Add Photo</p>
                          <p className="text-[10px] text-[#2D2D2D]/60 mt-1">To transform it</p>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <input
                        id="generator-prompt-input"
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && generateImage()}
                        placeholder={uploadedImage ? "Add details (e.g. 'wearing a cape')..." : "A cat wearing a space suit..."}
                        className="flex-1 toon-input w-full text-xl"
                        disabled={isGenerating}
                      />
                    </div>

                    <button
                      id="generate-toon-btn"
                      onClick={generateImage}
                      disabled={isGenerating || (!prompt.trim() && !uploadedImage)}
                      className="toon-button px-8 py-4 w-full text-xl flex items-center justify-center gap-3"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          <span>{uploadedImage ? 'Transform Photo' : 'Toon It!'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="px-6 py-3 bg-[#FF5757] border-4 border-[#2D2D2D] rounded-2xl text-white font-bold">
                    {error}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {['Pizza monster', 'Skating dinosaur', 'Super hero dog', 'Dancing robot'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setPrompt(suggestion)}
                      className="px-4 py-1.5 bg-white border-2 border-[#2D2D2D] rounded-full text-xs font-bold text-[#2D2D2D] hover:bg-[#5CE1E6] transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Masonry Feed */}
      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        <div className="masonry-grid">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img, index) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="masonry-item group"
              >
                <div 
                  className="toon-card overflow-hidden relative cursor-zoom-in"
                  onClick={() => setSelectedImage(img)}
                >
                  <img 
                    src={img.url} 
                    alt={img.prompt} 
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ minHeight: img.height || 300 }}
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-[#2D2D2D] shadow-[2px_2px_0px_0px_#2D2D2D]">
                        <p className="text-[10px] font-black text-[#2D2D2D] uppercase tracking-wider">
                          {img.style}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle save logic here
                          }}
                          className="px-4 py-2 bg-[#FF5757] text-white border-2 border-[#2D2D2D] rounded-full font-display font-bold text-sm shadow-[2px_2px_0px_0px_#2D2D2D] hover:scale-105 transition-transform"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-2">
                        <button className="w-8 h-8 bg-white border-2 border-[#2D2D2D] rounded-full flex items-center justify-center text-[#2D2D2D] shadow-[2px_2px_0px_0px_#2D2D2D] hover:scale-110 transition-transform">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 bg-white border-2 border-[#2D2D2D] rounded-full flex items-center justify-center text-[#2D2D2D] shadow-[2px_2px_0px_0px_#2D2D2D] hover:scale-110 transition-transform">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(img.url, img.prompt);
                        }}
                        className="w-8 h-8 bg-white border-2 border-[#2D2D2D] rounded-lg flex items-center justify-center text-[#2D2D2D] hover:bg-[#7ED957] transition-colors shrink-0"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isGenerating && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="toon-card bg-white px-8 py-4 flex items-center gap-4 animate-bounce">
              <Loader2 className="w-8 h-8 text-[#FF5757] animate-spin" />
              <p className="font-display font-black text-xl text-[#2D2D2D]">Baking a new toon...</p>
            </div>
          </div>
        )}
      </main>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl w-full bg-white border-8 border-[#2D2D2D] rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_0px_#2D2D2D] flex flex-col md:flex-row"
            >
              <div className="flex-1 bg-[#F0F0F0] flex items-center justify-center p-4">
                <img 
                  src={selectedImage.url} 
                  alt={selectedImage.prompt}
                  className="max-h-[70vh] w-auto rounded-2xl border-4 border-[#2D2D2D] shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-white border-t-8 md:border-t-0 md:border-l-8 border-[#2D2D2D]">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#FF5757] border-2 border-[#2D2D2D] rounded-full flex items-center justify-center text-white">
                        <Palette className="w-4 h-4" />
                      </div>
                      <span className="font-display font-black text-lg">ToonCraft</span>
                    </div>
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="w-8 h-8 flex items-center justify-center text-[#2D2D2D]/40 hover:text-[#FF5757] transition-colors"
                    >
                      <Plus className="w-6 h-6 rotate-45" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-display font-black text-2xl text-[#2D2D2D] leading-tight">
                      {selectedImage.prompt}
                    </h3>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFDE59] border-2 border-[#2D2D2D] rounded-full">
                      <Star className="w-4 h-4 text-[#FF5757] fill-current" />
                      <span className="text-xs font-black uppercase tracking-wider">{selectedImage.style}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 toon-button py-3 text-sm">Save</button>
                    <button className="w-12 h-12 bg-white border-4 border-[#2D2D2D] rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#2D2D2D]">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t-4 border-[#F0F0F0]">
                  <button 
                    onClick={() => downloadImage(selectedImage.url, selectedImage.prompt)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#7ED957] border-4 border-[#2D2D2D] rounded-2xl font-display font-bold shadow-[4px_4px_0px_0px_#2D2D2D] hover:translate-y-[-2px] transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Download Toon
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Mobile */}
      <button 
        id="mobile-fab-create"
        onClick={() => setShowGenerator(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#FF5757] border-4 border-[#2D2D2D] rounded-full flex items-center justify-center text-white shadow-[4px_4px_0px_0px_#2D2D2D] hover:scale-110 active:scale-95 transition-all sm:hidden"
      >
        <Plus className="w-8 h-8" />
      </button>
    </div>
  );
}
