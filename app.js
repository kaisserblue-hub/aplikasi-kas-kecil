(() => {
  'use strict';

  const config = window.APP_CONFIG;
  const today = () => new Date().toISOString().slice(0, 10);
  const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const initialData = {
    users: config.demoUsers.map((user, index) => ({ ...user, id: index + 1, active: true, created_at: today() })),
    incomes: [],
    expenses: [],
    activities: []
  };

  const state = { user: null, selectedExpenseId: null };
  const localMode = !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY;

  function readData() {
    const stored = localStorage.getItem(config.storageKey);
    if (stored) {
      try { return JSON.parse(stored); } catch (_) { /* reset below */ }
    }
    localStorage.setItem(config.storageKey, JSON.stringify(initialData));
    return clone(initialData);
  }

  function writeData(data) { localStorage.setItem(config.storageKey, JSON.stringify(data)); }
  function toast(message) {
    const element = document.getElementById('notifikasiToast');
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 2400);
  }
  function setPage(page) {
    document.querySelectorAll('.content').forEach((item) => item.classList.toggle('active', item.id === page));
    document.querySelectorAll('.menu-item').forEach((item) => item.classList.toggle('active', item.dataset.page === page));
  }
  function approvedExpenses(data) { return data.expenses.filter((item) => item.status === 'approved'); }
  function balance(data) { return data.incomes.reduce((s, x) => s + Number(x.amount), 0) - approvedExpenses(data).reduce((s, x) => s + Number(x.amount), 0); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }

  function render() {
    const data = readData();
    const amount = balance(data);
    const todayIncome = data.incomes.filter((x) => x.date === today()).reduce((s, x) => s + Number(x.amount), 0);
    const todayExpense = approvedExpenses(data).filter((x) => x.date === today()).reduce((s, x) => s + Number(x.amount), 0);
    document.getElementById('saldoAmount').textContent = money(amount);
    document.getElementById('pemasukanHari').textContent = money(todayIncome);
    document.getElementById('pengeluaranHari').textContent = money(todayExpense);
    document.getElementById('menungguPersetujuan').textContent = data.expenses.filter((x) => x.status === 'pending').length;
    document.getElementById('cadanganAmount').textContent = money(Math.max(0, amount * 0.3));
    document.getElementById('saldoStatus').textContent = amount < config.threshold ? 'Menipis' : 'Normal';
    document.getElementById('notifikasiCard').style.display = amount < config.threshold ? 'block' : 'none';
    document.getElementById('notifikasiText').textContent = `Saldo di bawah ${money(config.threshold)}.`;
    document.getElementById('userInfo').textContent = state.user ? `${state.user.name} (${state.user.role})` : '';
    document.getElementById('loginPage').classList.toggle('active', !state.user);
    document.getElementById('dashboardPage').classList.toggle('active', Boolean(state.user));
    renderTables(data);
    renderReport(data);
    applyRole();
  }

  function renderTables(data) {
    const incomeBody = document.querySelector('#tabelPemasukan tbody');
    incomeBody.innerHTML = data.incomes.length ? data.incomes.slice().reverse().map((x) => `<tr><td>${x.date}</td><td>${money(x.amount)}</td><td>${escapeHtml(x.description)}</td><td>-</td></tr>`).join('') : '<tr><td colspan="4">Belum ada data.</td></tr>';
    const expenseBody = document.querySelector('#tabelPengeluaran tbody');
    expenseBody.innerHTML = data.expenses.length ? data.expenses.slice().reverse().map((x) => `<tr><td>${x.date}</td><td>${escapeHtml(x.category)}</td><td>${money(x.amount)}</td><td>${escapeHtml(x.description)}</td><td><span class="status-badge status-${x.status}">${x.status}</span></td><td>-</td></tr>`).join('') : '<tr><td colspan="6">Belum ada data.</td></tr>';
    const approvals = data.expenses.filter((x) => x.status === 'pending');
    document.querySelector('#tabelPersetujuan tbody').innerHTML = approvals.length ? approvals.map((x) => `<tr><td>${x.date}</td><td>${x.category}</td><td>${money(x.amount)}</td><td>${escapeHtml(x.description)}</td><td>${escapeHtml(x.created_by)}</td><td>pending</td><td><button class="action-link" data-review="${x.id}">Review</button></td></tr>`).join('') : '<tr><td colspan="7">Tidak ada permintaan.</td></tr>';
    document.querySelectorAll('[data-review]').forEach((button) => button.addEventListener('click', () => openApproval(Number(button.dataset.review))));
    const rows = [...data.incomes.map((x) => [x.date, 'Pemasukan', '-', x.amount, x.description, 'approved']), ...data.expenses.map((x) => [x.date, 'Pengeluaran', x.category, x.amount, x.description, x.status])].sort((a, b) => b[0].localeCompare(a[0]));
    document.querySelector('#tabelRiwayat tbody').innerHTML = rows.length ? rows.map((x) => `<tr>${x.map((v, i) => `<td>${i === 3 ? money(v) : escapeHtml(v)}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="6">Belum ada transaksi.</td></tr>';
    document.getElementById('totalPengguna').textContent = data.users.length;
    document.getElementById('totalTransaksi').textContent = data.incomes.length + data.expenses.length;
    document.getElementById('totalPemasukanAdmin').textContent = money(data.incomes.reduce((s, x) => s + Number(x.amount), 0));
    document.getElementById('totalPengeluaranAdmin').textContent = money(approvedExpenses(data).reduce((s, x) => s + Number(x.amount), 0));
    document.querySelector('#tabelPengguna tbody').innerHTML = data.users.map((x) => `<tr><td>${x.email}</td><td>${x.name}</td><td>${x.role}</td><td>${x.active ? 'Aktif' : 'Nonaktif'}</td><td>${x.created_at}</td></tr>`).join('');
    document.querySelector('#tabelAktivitas tbody').innerHTML = data.activities.slice().reverse().map((x) => `<tr><td>${x.date}</td><td>${x.user}</td><td>${x.type}</td><td>${money(x.amount)}</td><td>${x.status}</td></tr>`).join('');
  }

  function applyRole() {
    const role = state.user?.role;
    const allowed = role === 'kasir' ? ['dashboard-content', 'pemasukan', 'pengeluaran', 'laporan', 'riwayat'] : role === 'direktur' ? ['dashboard-content', 'pengeluaran', 'persetujuan', 'laporan', 'riwayat'] : ['dashboard-content', 'laporan', 'riwayat', 'admin'];
    document.querySelectorAll('.menu-item').forEach((item) => { item.style.display = allowed.includes(item.dataset.page) ? 'block' : 'none'; });
  }

  function reportRows(data) {
    return [...data.incomes.map((x) => [x.date, 'Pemasukan', '-', x.amount, x.description, 'approved']), ...data.expenses.map((x) => [x.date, 'Pengeluaran', x.category, x.amount, x.description, x.status])];
  }
  function renderReport(data) {
    const rows = reportRows(data);
    const income = rows.filter((x) => x[1] === 'Pemasukan').reduce((s, x) => s + Number(x[3]), 0);
    const expense = rows.filter((x) => x[1] === 'Pengeluaran' && x[5] === 'approved').reduce((s, x) => s + Number(x[3]), 0);
    document.getElementById('laporanContainer').innerHTML = `<h3>Ringkasan Kas Kecil</h3><table><tbody><tr><td>Total pemasukan</td><td>${money(income)}</td></tr><tr><td>Total pengeluaran disetujui</td><td>${money(expense)}</td></tr><tr><td>Saldo</td><td>${money(income - expense)}</td></tr></tbody></table>`;
  }
  function openApproval(id) {
    const item = readData().expenses.find((x) => x.id === id);
    if (!item) return;
    state.selectedExpenseId = id;
    document.getElementById('detailPengeluaran').innerHTML = `<p><strong>${item.category}</strong> — ${money(item.amount)}</p><p>${escapeHtml(item.description)}</p>`;
    document.getElementById('modalPersetujuan').classList.add('active');
  }
  function closeApproval() { document.getElementById('modalPersetujuan').classList.remove('active'); state.selectedExpenseId = null; }
  function decide(status) { const data = readData(); const item = data.expenses.find((x) => x.id === state.selectedExpenseId); if (!item) return; item.status = status; item.approved_by = state.user.email; data.activities.push({ date: today(), user: state.user.email, type: `Pengeluaran ${status}`, amount: item.amount, status }); writeData(data); closeApproval(); render(); toast(`Pengeluaran ${status === 'approved' ? 'disetujui' : 'ditolak'}.`); }
  function csvExport() { const rows = [['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Keterangan', 'Status'], ...reportRows(readData())]; const csv = rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'laporan-kas-kecil.csv'; link.click(); }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', (event) => { event.preventDefault(); const email = document.getElementById('email').value.trim(); const password = document.getElementById('password').value; const user = readData().users.find((x) => x.email === email && x.password === password); if (!user) { document.getElementById('loginError').textContent = 'Email atau password salah.'; document.getElementById('loginError').style.display = 'block'; return; } state.user = user; document.getElementById('loginError').style.display = 'none'; render(); });
    document.getElementById('logoutBtn').addEventListener('click', () => { state.user = null; render(); });
    document.querySelectorAll('.menu-item').forEach((item) => item.addEventListener('click', () => setPage(item.dataset.page)));
    document.getElementById('formPemasukan').addEventListener('submit', (event) => { event.preventDefault(); const data = readData(); const amount = Number(document.getElementById('nominalPemasukan').value); data.incomes.push({ id: Date.now(), date: document.getElementById('tglPemasukan').value, amount, description: document.getElementById('keteranganPemasukan').value, created_by: state.user.email }); data.activities.push({ date: today(), user: state.user.email, type: 'Pemasukan', amount, status: 'approved' }); writeData(data); event.target.reset(); render(); toast('Pemasukan disimpan.'); });
    document.getElementById('formPengeluaran').addEventListener('submit', (event) => { event.preventDefault(); const data = readData(); const amount = Number(document.getElementById('nominalPengeluaran').value); data.expenses.push({ id: Date.now(), date: document.getElementById('tglPengeluaran').value, category: document.getElementById('kategoriPengeluaran').value, amount, description: document.getElementById('keteranganPengeluaran').value, status: 'pending', created_by: state.user.email }); writeData(data); event.target.reset(); render(); toast('Pengeluaran diajukan untuk persetujuan.'); });
    document.getElementById('btnSetujui').addEventListener('click', () => decide('approved'));
    document.getElementById('btnTolak').addEventListener('click', () => decide('rejected'));
    document.getElementById('btnBatalModal').addEventListener('click', closeApproval);
    document.querySelector('.close').addEventListener('click', closeApproval);
    document.getElementById('btnExportExcel').addEventListener('click', csvExport);
    document.getElementById('btnExportPDF').addEventListener('click', () => window.print());
    document.getElementById('btnGenerateLaporan').addEventListener('click', () => renderReport(readData()));
    document.getElementById('tglPemasukan').value = today();
    document.getElementById('tglPengeluaran').value = today();
    render();
    if (localMode) toast('Mode demo aktif: isi Supabase URL dan anon key untuk database online.');
  });
})();
