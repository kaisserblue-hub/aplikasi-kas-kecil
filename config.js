// Supabase configuration.
// Isi dua nilai ini dari Project Settings > API di Supabase.
window.SUPABASE_URL = '';
window.SUPABASE_ANON_KEY = '';

window.APP_CONFIG = {
  threshold: 2000000,
  storageKey: 'bmkp_kas_kecil_demo',
  categories: ['PT BMKP', 'PT BMKU'],
  demoUsers: [
    { name: 'Kasir Utama', email: 'kasir@bmkp.com', password: 'password123', role: 'kasir' },
    { name: 'Direktur', email: 'direktur@bmkp.com', password: 'password123', role: 'direktur' },
    { name: 'Admin Monitoring', email: 'admin@bmkp.com', password: 'password123', role: 'admin' }
  ]
};
