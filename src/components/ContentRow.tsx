import React from 'react';
import { ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Content } from '../types';
import { useNavigate } from 'react-router-dom';

interface ContentRowProps {
  title: string;
  items: Content[];
  loading?: boolean;
}

export default function ContentRow({ title, items, loading }: ContentRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-8 group/row">
      <div className="flex items-center justify-between px-4 md:px-12 mb-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white/90">
          {title}
        </h2>
        <button className="text-xs font-bold text-gray-500 uppercase hover:text-brand transition-colors tracking-widest">
          View All
        </button>
      </div>

      <div className="relative group">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/70"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <div 
          ref={rowRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-12 pb-4 snap-x"
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex-none w-[200px] md:w-[280px] snap-start"
              >
                <div className="relative aspect-video-card bg-[#16181f] rounded-lg overflow-hidden border border-white/5 shadow-lg shimmer flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                    <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                  </div>
                  <div className="w-3/4 h-4 bg-white/10 rounded mb-1 animate-pulse" />
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-10 h-3 bg-white/10 rounded animate-pulse" />
                    <div className="w-6 h-3 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(`/watch/${item.id}`)}
                className="flex-none w-[200px] md:w-[280px] snap-start cursor-pointer group/card"
              >
                <div className="relative aspect-video-card bg-gray-900 rounded-lg overflow-hidden border border-white/5 shadow-lg group-hover/card:border-white/20 transition-all">
                  <img 
                    src={item.thumbnail_url} 
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-brand transition-colors">
                        <Play className="w-4 h-4 fill-black" />
                      </button>
                      <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold truncate">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-400">{item.release_year}</span>
                      <span className="text-[10px] bg-white/10 px-1 rounded text-gray-300">HD</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer hover:bg-black/70"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
