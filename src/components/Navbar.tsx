import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Bell, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-colors duration-300 ${isScrolled ? 'bg-[#0f1014] shadow-xl' : 'bg-transparent'}`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-brand font-black text-2xl tracking-tighter uppercase">
            Stellar<span className="text-white">Stream</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/tv-shows" className="hover:text-white transition-colors">TV Shows</Link>
            <Link to="/movies" className="hover:text-white transition-colors">Movies</Link>
            <Link to="/sports" className="hover:text-white transition-colors">Sports</Link>
            <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Titles, people, genres" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand w-64 transition-all"
            />
          </form>

          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-gray-400 hover:text-white">
              <Bell className="w-5 h-5" />
            </button>
            
            {user ? (
              <div className="group relative">
                <button className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                    {profile ? profile.name[0] : user.email[0]}
                  </div>
                </button>
                
                <div className="absolute right-0 top-full pt-2 hidden group-hover:block">
                  <div className="glass rounded-lg py-2 w-48 shadow-2xl">
                    <div className="px-4 py-2 border-bottom border-white/5 mb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">Profiles</p>
                    </div>
                    <button onClick={() => navigate('/profiles')} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-3">
                      <User className="w-4 h-4" /> Switch Profile
                    </button>
                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-3 text-red-400">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/login" className="bg-brand text-white px-6 py-1.5 rounded-full text-sm font-bold hover:bg-brand/80 transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
