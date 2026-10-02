import { JobApplicationRepository } from "./JobApplicationRepository";
import { ApplicationStats } from "./ApplicationStats";
import type { JobApplicationRecord } from "./JobApplicationRecord";

document.addEventListener('DOMContentLoaded', async () => {
  setupVersion();
  await loadAndRenderDashboard();
  setupEvents();
});

function setupVersion() {
  const versionLabel = document.getElementById('version-label');
  if (versionLabel && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    const manifest = chrome.runtime.getManifest();
    if (manifest?.version) {
      versionLabel.textContent = `v${manifest.version}`;
    }
  }
}

async function loadAndRenderDashboard() {
  const repo = new JobApplicationRepository();
  const records = await repo.getAll();
  const stats = new ApplicationStats(records);

  renderMetrics(stats, records);
  renderDailyChart(stats);
  renderTable(records);
}

function renderMetrics(stats: ApplicationStats, records: JobApplicationRecord[]) {
  const totalEl = document.getElementById('total-applied-count');
  const todayEl = document.getElementById('today-applied-count');
  const activeDaysEl = document.getElementById('active-days-count');
  const avgPerDayEl = document.getElementById('avg-per-day-count');

  const total = stats.getTotalCount();
  const today = stats.getTodayCount();
  const breakdown = stats.getDailyBreakdown();
  const activeDays = breakdown.length;
  const avg = activeDays > 0 ? (total / activeDays).toFixed(1) : '0';

  if (totalEl) totalEl.textContent = String(total);
  if (todayEl) todayEl.textContent = String(today);
  if (activeDaysEl) activeDaysEl.textContent = String(activeDays);
  if (avgPerDayEl) avgPerDayEl.textContent = String(avg);
}

function renderDailyChart(stats: ApplicationStats) {
  const chartContainer = document.getElementById('chart-bars-container');
  if (!chartContainer) return;

  const breakdown = stats.getDailyBreakdown();

  if (breakdown.length === 0) {
    chartContainer.innerHTML = '<div class="empty-state">No hay actividades registradas aún.</div>';
    return;
  }

  chartContainer.innerHTML = '';
  const maxCount = Math.max(...breakdown.map(b => b.count), 1);

  breakdown.forEach(item => {
    const row = document.createElement('div');
    row.className = 'chart-bar-row';

    const label = document.createElement('span');
    label.className = 'chart-label';
    label.textContent = item.date;

    const track = document.createElement('div');
    track.className = 'chart-bar-track';

    const fill = document.createElement('div');
    fill.className = 'chart-bar-fill';
    const pct = Math.round((item.count / maxCount) * 100);
    fill.style.width = `${pct}%`;

    track.appendChild(fill);

    const val = document.createElement('span');
    val.className = 'chart-value';
    val.textContent = String(item.count);

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(val);

    chartContainer.appendChild(row);
  });
}

function renderTable(records: JobApplicationRecord[], filterQuery: string = '') {
  const tableBody = document.getElementById('applications-table-body');
  if (!tableBody) return;

  const query = filterQuery.toLowerCase().trim();
  const filtered = records.filter(r => {
    if (!query) return true;
    return r.title.toLowerCase().includes(query) || r.company.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="empty-table-cell">No se encontraron registros de postulaciones.</td></tr>';
    return;
  }

  tableBody.innerHTML = '';
  // Show most recent first
  const sorted = [...filtered].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));

  sorted.forEach(record => {
    const tr = document.createElement('tr');

    const titleTd = document.createElement('td');
    titleTd.style.fontWeight = '600';
    titleTd.textContent = record.title || 'Oferta de Empleo';

    const companyTd = document.createElement('td');
    companyTd.textContent = record.company || 'N/A';

    const locationTd = document.createElement('td');
    locationTd.textContent = record.location || 'N/A';

    const dateTd = document.createElement('td');
    const d = new Date(record.appliedAt);
    dateTd.textContent = isNaN(d.getTime()) ? record.appliedAt : d.toLocaleString();

    const statusTd = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge';
    statusBadge.textContent = record.status || 'Postulado';
    statusTd.appendChild(statusBadge);

    tr.appendChild(titleTd);
    tr.appendChild(companyTd);
    tr.appendChild(locationTd);
    tr.appendChild(dateTd);
    tr.appendChild(statusTd);

    tableBody.appendChild(tr);
  });
}

function setupEvents() {
  const searchInput = document.getElementById('history-search-input') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const repo = new JobApplicationRepository();
      const records = await repo.getAll();
      renderTable(records, searchInput.value);
    });
  }

  const clearBtn = document.getElementById('clear-stats-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de que deseas borrar todo el historial de postulaciones registradas?')) {
        const repo = new JobApplicationRepository();
        await repo.clear();
        await loadAndRenderDashboard();
      }
    });
  }
}
