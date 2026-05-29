import React from 'react';
import { Play, Info, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Content } from '../types';

interface HeroProps {
  content: Content | null;
  onWatchTrailer?: (content: Content) => void;
}

export default function Hero({ content, onWatchTrailer }: HeroProps) {
  if (!content) return <div className="h-[85vh] bg-[#0f1014]" />;
  const navigate = useNavigate();

  return (
    <div className="relative h-[85vh] w-full overflow-hidden">
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        <img 
          src={content.thumbnail_url} 
          alt={content.title}
          className="w-full h-full object-cover transform scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1014] via-[#0f1014]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0f1014] to-transparent" />
      </div>

      {/* Content Info */}
      <div className="relative h-full flex flex-col justify-center max-w-screen-2xl mx-auto px-4 md:px-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-brand text-xs font-black px-2 py-0.5 rounded tracking-tighter">PLUS</span>
            <span className="text-sm font-medium text-gray-300 tracking-widest uppercase">{content.genre}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase leading-none italic">
            {content.title}
          </h1>

          <p className="text-gray-300 text-lg mb-8 line-clamp-3 leading-relaxed max-w-xl">
            {content.description}
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/watch/${content.id}`)}
              className="bg-white text-black px-8 py-3 rounded-lg font-bold flex items-center gap-3 hover:bg-white/90 transition-all scale-100 hover:scale-105 active:scale-95 shadow-xl"
            >
              <Play className="w-6 h-6 fill-black" /> Watch Now
            </button>
            {content.trailer_url && (
              <button 
                onClick={() => onWatchTrailer?.(content)}
                className="bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-lg font-bold flex items-center gap-3 hover:bg-white/20 transition-all border border-white/10"
              >
                <Play className="w-6 h-6" /> Watch Trailer
              </button>
            )}
            <button className="bg-white/10 backdrop-blur-md text-white p-3 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/10">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Side Detail (Technical feel like design skill Recipe 12) */}
      <div className="absolute right-12 bottom-24 hidden lg:block">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Release Year</span>
          <span className="text-3xl font-light italic">{content.release_year}</span>
        </div>
      </div>
    </div>
  );
}
