import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, RotateCw, Volume2, Maximize, ChevronLeft, Settings, Subtitles, Check, PictureInPicture2, FastForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubtitleTrack {
  id: number;
  name: string;
  lang: string;
}

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose?: () => void;
  isModal?: boolean;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
}

export default function VideoPlayer({ url, title, onClose, isModal, intro, outro }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<number>(-1); // -1 is Off
  const [showSettings, setShowSettings] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  
  const navigate = useNavigate();
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
          const tracks = data.subtitleTracks.map((t, index) => ({
            id: index,
            name: t.name || t.lang || `Track ${index + 1}`,
            lang: t.lang || ''
          }));
          setSubtitleTracks(tracks);
        });

        hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, (_, data) => {
          setCurrentSubtitle(data.id);
        });

      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
      }
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [url]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(cur);
      const p = (cur / dur) * 100;
      setProgress(p || 0);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(parseFloat(e.target.value));
    }
  };

  const jump = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const skipTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.error('PiP failed', err);
    }
  };

  const setSubtitleTrack = (id: number) => {
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = id;
      setCurrentSubtitle(id);
    } else if (videoRef.current) {
      // Fallback for native HLS (iOS)
      const tracks = videoRef.current.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = i === id ? 'showing' : 'disabled';
      }
      setCurrentSubtitle(id);
    }
  };

  const showSkipIntro = intro && currentTime >= intro.start && currentTime <= intro.end;
  const showSkipOutro = outro && currentTime >= outro.start && currentTime <= outro.end;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full bg-black flex items-center justify-center overflow-hidden cursor-none ${isModal ? 'h-full rounded-xl' : 'h-screen'}`}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onTimeUpdate={handleProgress}
        onClick={togglePlay}
        autoPlay
      />

      {/* Top Bar */}
      <div className={`absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <h1 className="text-xl font-medium tracking-tight">{title}</h1>
          </div>
        </div>
      </div>

      {/* Skip Buttons Overlay */}
      <div className="absolute right-8 bottom-36 flex flex-col gap-4 items-end">
        {showSkipIntro && (
          <button 
            onClick={() => skipTo(intro.end)}
            className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-3 transition-all scale-100 active:scale-95 animate-in slide-in-from-right-10 duration-500"
          >
            <FastForward className="w-5 h-5 fill-white" /> Skip Intro
          </button>
        )}
        {showSkipOutro && (
          <button 
            onClick={() => skipTo(outro.end)}
            className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-3 transition-all scale-100 active:scale-95 animate-in slide-in-from-right-10 duration-500"
          >
            <FastForward className="w-5 h-5 fill-white" /> Skip Outro
          </button>
        )}
      </div>

      {/* Settings Menu */}
      {showSettings && (
        <div className="absolute right-8 bottom-32 glass p-6 rounded-2xl w-64 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Subtitles</h3>
          <div className="space-y-2">
            <button 
              onClick={() => setSubtitleTrack(-1)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentSubtitle === -1 ? 'bg-brand text-white' : 'hover:bg-white/10 text-gray-300'}`}
            >
              Off {currentSubtitle === -1 && <Check className="w-4 h-4" />}
            </button>
            {subtitleTracks.map((track) => (
              <button 
                key={track.id}
                onClick={() => setSubtitleTrack(track.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentSubtitle === track.id ? 'bg-brand text-white' : 'hover:bg-white/10 text-gray-300'}`}
              >
                {track.name} {currentSubtitle === track.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="group relative w-full h-1 bg-white/20 mb-6 cursor-pointer">
          <input 
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
          />
          <div className="h-full bg-brand relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-brand rounded-full scale-0 group-hover:scale-100 transition-transform" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={togglePlay} className="hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
            </button>
            <div className="flex items-center gap-6">
              <button onClick={() => jump(-10)} className="hover:text-brand transition-colors"><RotateCcw className="w-6 h-6" /></button>
              <button onClick={() => jump(10)} className="hover:text-brand transition-colors"><RotateCw className="w-6 h-6" /></button>
            </div>
            <div className="flex items-center gap-4 group/vol">
              <Volume2 className="w-6 h-6" />
              <div className="w-0 group-hover/vol:w-24 overflow-hidden transition-all duration-300">
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={volume} 
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (videoRef.current) videoRef.current.volume = v;
                  }}
                  className="w-24 accent-brand"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`hover:scale-110 transition-transform ${showSettings || currentSubtitle !== -1 ? 'text-brand' : 'text-white'}`}
            >
              <Subtitles className="w-6 h-6" />
            </button>
            <button 
              onClick={togglePiP}
              className={`hover:scale-110 transition-transform ${isPipActive ? 'text-brand' : 'text-white'}`}
            >
              <PictureInPicture2 className="w-6 h-6" />
            </button>
            <button className="hover:rotate-45 transition-transform"><Settings className="w-6 h-6" /></button>
            <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform"><Maximize className="w-6 h-6" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

