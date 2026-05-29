import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('stellar_stream.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDb() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      subscription_status TEXT DEFAULT 'free', -- 'free', 'premium'
      subscription_end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Profiles (multiple profiles per account)
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      is_kids_mode INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Content (Movies, Shows)
  db.exec(`
    CREATE TABLE IF NOT EXISTS content (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL, -- 'movie', 'show'
      thumbnail_url TEXT,
      trailer_url TEXT,
      stream_url TEXT,
      duration INTEGER,
      rating TEXT,
      genre TEXT,
      release_year INTEGER,
      is_featured INTEGER DEFAULT 0,
      intro_start INTEGER,
      intro_end INTEGER,
      outro_start INTEGER,
      outro_end INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add columns if they don't exist (safety for existing DBs)
  const columns = ['intro_start', 'intro_end', 'outro_start', 'outro_end'];
  for (const col of columns) {
    try {
      db.exec(`ALTER TABLE content ADD COLUMN ${col} INTEGER`);
    } catch (e) {
      // Ignore if column already exists
    }
  }

  // Watch History
  db.exec(`
    CREATE TABLE IF NOT EXISTS watch_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0, -- in seconds
      last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
    )
  `);

  // Watchlist
  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      profile_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      PRIMARY KEY (profile_id, content_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE
    )
  `);

  // Seed initial data if empty
  const count = db.prepare('SELECT count(*) as count FROM content').get() as { count: number };
  if (count.count === 0) {
    const seedContent = [
      {
        id: '1',
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        type: 'movie',
        thumbnail_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop&q=60',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // Public HLS stream
        trailer_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        genre: 'Sci-Fi',
        release_year: 2014,
        is_featured: 1,
        intro_start: 0,
        intro_end: 10,
        outro_start: 50,
        outro_end: 60
      },
      {
        id: '2',
        title: 'Stranger Things',
        description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
        type: 'show',
        thumbnail_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=60',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        trailer_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        genre: 'Drama, Sci-Fi',
        release_year: 2016,
        is_featured: 0,
        intro_start: 5,
        intro_end: 15,
        outro_start: 45,
        outro_end: 55
      },
      {
        id: '3',
        title: 'The Dark Knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        type: 'movie',
        thumbnail_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&auto=format&fit=crop&q=60',
        stream_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        trailer_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        genre: 'Action, Crime',
        release_year: 2008,
        is_featured: 0
      }
    ];

    const insert = db.prepare(`
      INSERT INTO content (id, title, description, type, thumbnail_url, stream_url, genre, release_year, is_featured, intro_start, intro_end, outro_start, outro_end)
      VALUES (@id, @title, @description, @type, @thumbnail_url, @stream_url, @genre, @release_year, @is_featured, @intro_start, @intro_end, @outro_start, @outro_end)
    `);

    for (const item of seedContent) {
      insert.run(item);
    }
  } else {
    // Update existing seed content if columns were just added
    db.prepare(`UPDATE content SET intro_start = 0, intro_end = 10, outro_start = 50, outro_end = 60 WHERE id = '1'`).run();
    db.prepare(`UPDATE content SET intro_start = 5, intro_end = 15, outro_start = 45, outro_end = 55 WHERE id = '2'`).run();
  }
}

export default db;
