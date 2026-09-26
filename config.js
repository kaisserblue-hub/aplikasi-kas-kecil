// Supabase configuration - WAJIB DIISI SEBELUM PAKAI
// Ambil dari: https://supabase.com → Projects → Pilih Project → Settings → API
window.SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

window.APP_CONFIG = {
  threshold: 2000000,
  storageKey: 'bmkp_kas_kecil_data',
  categories: ['PT BMKP', 'PT BMKU'],
  demoUsers: [
    { name: 'Kasir Utama', email: 'kasir@bmkp.com', password: 'password123', role: 'kasir' },
    { name: 'Direktur', email: 'direktur@bmkp.com', password: 'password123', role: 'direktur' },
    { name: 'Admin Monitoring', email: 'admin@bmkp.com', password: 'password123', role: 'admin' }
  ]
};

// Cek mode (online dengan Supabase atau demo lokal)
window.USE_SUPABASE = window.SUPABASE_URL && window.SUPABASE_URL.includes('supabase.co') && window.SUPABASE_ANON_KEY;
window.supabaseClient = null;

if (window.USE_SUPABASE && typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
