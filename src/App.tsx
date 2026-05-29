import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ContentRow from './components/ContentRow';
import VideoPlayer from './components/VideoPlayer';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Content, Profile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, UserCircle, LayoutDashboard, Film, Tv, Trophy } from 'lucide-react';

function Home() {
  const [content, setContent] = useState<Content[]>([]);
  const [featured, setFeatured] = useState<Content | null>(null);
  const [trailerContent, setTrailerContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        setContent(data);
        const feat = data.find((c: Content) => c.is_featured);
        setFeatured(feat || data[0]);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (!profile && user) return <Navigate to="/profiles" />;

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <Hero content={featured} onWatchTrailer={setTrailerContent} />
      
      <div className="-mt-32 relative z-10">
        <ContentRow title="Trending Now" items={content} loading={loading} />
        <ContentRow title="Action & Sci-Fi" items={content.filter(c => c.genre.includes('Sci-Fi'))} loading={loading} />
        <ContentRow title="Recommended for You" items={content.slice().reverse()} loading={loading} />
      </div>

      <AnimatePresence>
        {trailerContent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setTrailerContent(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <VideoPlayer 
                url={trailerContent.trailer_url!} 
                title={`${trailerContent.title} - Trailer`} 
                onClose={() => setTrailerContent(null)}
                isModal
                intro={trailerContent.intro_start !== undefined ? { start: trailerContent.intro_start, end: trailerContent.intro_end! } : undefined}
                outro={trailerContent.outro_start !== undefined ? { start: trailerContent.outro_start, end: trailerContent.outro_end! } : undefined}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchResults() {
  const [results, setResults] = useState<Content[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }
  }, [query]);

  return (
    <div className="min-h-screen pt-24 px-4 md:px-12">
      <Navbar />
      <h2 className="text-2xl font-bold mb-8">Results for "{query}"</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {results.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate(`/watch/${item.id}`)}
            className="aspect-video-card bg-gray-900 rounded-lg overflow-hidden border border-white/5 cursor-pointer"
          >
            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>
      {results.length === 0 && <p className="text-gray-500">No results found.</p>}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ views: 1240, watchTime: '450h', subscribers: 85 });
  
  return (
    <div className="min-h-screen pt-24 px-4 md:px-12">
      <Navbar />
      <div className="flex items-center gap-4 mb-8">
        <LayoutDashboard className="w-8 h-8 text-brand" />
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="glass p-8 rounded-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Total Views</p>
          <p className="text-4xl font-black">{stats.views}</p>
        </div>
        <div className="glass p-8 rounded-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Watch Time</p>
          <p className="text-4xl font-black text-brand">{stats.watchTime}</p>
        </div>
        <div className="glass p-8 rounded-2xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Premium Users</p>
          <p className="text-4xl font-black">{stats.subscribers}</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold">Content Management</h3>
          <button className="bg-brand px-4 py-1.5 rounded-lg text-sm font-bold">+ Add Content</button>
        </div>
        <div className="p-8">
          <p className="text-gray-500 text-sm">Real-time inventory management would appear here.</p>
        </div>
      </div>
    </div>
  );
}

import { useLocation } from 'react-router-dom';

function Watch() {
  const [item, setItem] = useState<Content | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/content/${id}`)
      .then(res => res.json())
      .then(data => setItem(data));
  }, [id]);

  if (!item) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <VideoPlayer 
      url={item.stream_url} 
      title={item.title} 
      intro={item.intro_start !== undefined ? { start: item.intro_start, end: item.intro_end! } : undefined}
      outro={item.outro_start !== undefined ? { start: item.outro_start, end: item.outro_end! } : undefined}
    />
  );
}


function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      login(data);
      navigate('/profiles');
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[url('https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&auto=format&fit=crop&q=60')] bg-cover bg-center">
      <div className="absolute inset-0 bg-[#0f1014]/90" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-md p-10 rounded-2xl relative z-10"
      >
        <h1 className="text-3xl font-black mb-2 text-brand tracking-tighter uppercase italic">
          Stellar<span className="text-white">Stream</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">{isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to start streaming.'}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 px-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-xs px-1">{error}</p>}

          <button className="w-full bg-brand py-3 rounded-xl font-bold mt-4 hover:bg-brand/90 transition-all shadow-lg active:scale-95">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-brand font-bold ml-1 hover:underline">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}


import { useNavigate, useLocation } from 'react-router-dom';
import { Pencil, Trash2, X } from 'lucide-react';

function ProfileSelection() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isKids, setIsKids] = useState(false);
  
  const { selectProfile } = useAuth();
  const navigate = useNavigate();

  const fetchProfiles = () => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => setProfiles(data));
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSelect = (p: Profile) => {
    if (isManaging) {
      setEditingProfile(p);
      setNewName(p.name);
      setIsKids(p.is_kids_mode);
    } else {
      selectProfile(p);
      navigate('/');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingProfile ? `/api/profiles/${editingProfile.id}` : '/api/profiles';
    const method = editingProfile ? 'PUT' : 'POST';
    
    await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, is_kids_mode: isKids })
    });
    
    setEditingProfile(null);
    setIsAdding(false);
    setNewName('');
    setIsKids(false);
    fetchProfiles();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      const res = await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProfiles();
        setEditingProfile(null);
      } else {
        const data = await res.json();
        alert(data.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1014] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center w-full max-w-4xl"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-12 tracking-tight text-white/90">
          {isManaging ? 'Manage Profiles' : "Who's watching?"}
        </h1>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 px-4 mb-20">
          {profiles.map((p) => (
            <button 
              key={p.id}
              onClick={() => handleSelect(p)}
              className="group flex flex-col items-center gap-4 relative"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-transparent group-hover:border-brand transition-all overflow-hidden flex items-center justify-center relative">
                <UserCircle className="w-16 h-16 text-gray-500 group-hover:text-white transition-colors" />
                {isManaging && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Pencil className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <span className="text-gray-500 font-medium text-lg group-hover:text-white transition-colors">
                {p.name}
              </span>
            </button>
          ))}
          
          {!isManaging && (
            <button 
              onClick={() => { setIsAdding(true); setNewName(''); setIsKids(false); }}
              className="group flex flex-col items-center gap-4"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center hover:border-gray-500 transition-colors">
                <Plus className="w-8 h-8 text-gray-700 group-hover:text-gray-500" />
              </div>
              <span className="text-gray-700 font-medium text-lg group-hover:text-gray-500">Add Profile</span>
            </button>
          )}
        </div>

        <button 
          onClick={() => setIsManaging(!isManaging)}
          className={`border px-8 py-2 uppercase text-xs font-bold tracking-widest transition-all ${
            isManaging 
              ? 'border-white bg-white text-black' 
              : 'border-gray-500 text-gray-500 hover:border-white hover:text-white'
          }`}
        >
          {isManaging ? 'Done' : 'Manage Profiles'}
        </button>
      </motion.div>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {(editingProfile || isAdding) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setEditingProfile(null); setIsAdding(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="glass w-full max-w-md p-8 p-10 rounded-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">{editingProfile ? 'Edit Profile' : 'Add Profile'}</h2>
                <button onClick={() => { setEditingProfile(null); setIsAdding(false); }}>
                  <X className="w-6 h-6 text-gray-500 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Profile Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    required
                    maxLength={20}
                    placeholder="Enter name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="kids_mode"
                    checked={isKids}
                    onChange={e => setIsKids(e.target.checked)}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 accent-brand"
                  />
                  <label htmlFor="kids_mode" className="text-sm text-gray-400">Kids Profile?</label>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button className="w-full bg-brand py-3 rounded-xl font-bold hover:bg-brand/90 transition-all">
                    Save Changes
                  </button>
                  
                  {editingProfile && (
                    <button 
                      type="button"
                      onClick={() => handleDelete(editingProfile.id)}
                      className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Profile
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/profiles" element={<ProfileSelection />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
