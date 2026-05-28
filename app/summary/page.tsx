'use client';
import { useState, useMemo, useSyncExternalStore } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { KangekiRecord } from '@/types';
import { getRecordsSnapshot, subscribeRecords } from '@/lib/storage';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CAT_COLORS = {
  映画: 'rgba(90,127,160,0.7)',
  舞台: 'rgba(107,143,94,0.7)',
  LIVE: 'rgba(192,98,74,0.7)',
};

export default function SummaryPage() {
  const records = useSyncExternalStore(subscribeRecords, getRecordsSnapshot, () => [] as KangekiRecord[]);
  const [mode, setMode] = useState<'月別' | '年別'>('月別');

  const { labels, datasets, tableRows } = useMemo(() => {
    if (mode === '月別') {
      const months = [...new Set(records.map(r => r.watchedDate.slice(0, 7)))].sort().slice(-12);
      const data = (cat: '映画' | '舞台' | 'LIVE') => months.map(m => records.filter(r => r.watchedDate.startsWith(m) && r.category === cat).length);
      const tableRows = months.map(m => {
        const monthRecs = records.filter(r => r.watchedDate.startsWith(m));
        const total = monthRecs.reduce((s, r) => s + (r.ticketPrice ?? 0), 0);
        const count = monthRecs.length;
        const [y, mo] = m.split('-');
        return { label: `${y}年${parseInt(mo)}月`, count, total };
      }).reverse();
      return {
        labels: months.map(m => { const [y, mo] = m.split('-'); return `${y}/${parseInt(mo)}`; }),
        datasets: [
          { label: '映画', data: data('映画'), backgroundColor: CAT_COLORS['映画'] },
          { label: '舞台', data: data('舞台'), backgroundColor: CAT_COLORS['舞台'] },
          { label: 'LIVE', data: data('LIVE'), backgroundColor: CAT_COLORS['LIVE'] },
        ],
        tableRows,
      };
    } else {
      const years = [...new Set(records.map(r => r.watchedDate.slice(0, 4)))].sort();
      const data = (cat: '映画' | '舞台' | 'LIVE') => years.map(y => records.filter(r => r.watchedDate.startsWith(y) && r.category === cat).length);
      const tableRows = years.map(y => {
        const yearRecs = records.filter(r => r.watchedDate.startsWith(y));
        const total = yearRecs.reduce((s, r) => s + (r.ticketPrice ?? 0), 0);
        const count = yearRecs.length;
        return { label: `${y}年`, count, total };
      }).reverse();
      return {
        labels: years,
        datasets: [
          { label: '映画', data: data('映画'), backgroundColor: CAT_COLORS['映画'] },
          { label: '舞台', data: data('舞台'), backgroundColor: CAT_COLORS['舞台'] },
          { label: 'LIVE', data: data('LIVE'), backgroundColor: CAT_COLORS['LIVE'] },
        ],
        tableRows,
      };
    }
  }, [records, mode]);

  const totalCount = records.length;
  const totalSpend = records.reduce((s, r) => s + (r.ticketPrice ?? 0), 0);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { font: { family: 'Yomogi' }, color: '#5c3d1e' } },
      title: { display: false },
    },
    scales: {
      x: { stacked: true, ticks: { color: '#8b7355', font: { family: 'Yomogi' } }, grid: { color: 'rgba(201,170,133,0.2)' } },
      y: { stacked: true, ticks: { color: '#8b7355', stepSize: 1, font: { family: 'Yomogi' } }, grid: { color: 'rgba(201,170,133,0.2)' } },
    },
  };

  return (
    <>
      <h1 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--dark-brown)', marginBottom: '16px' }}>
        <span className="tape" style={{ transform: 'none', marginRight: '8px' }}>📊 サマリー</span>
      </h1>

      {/* トータル */}
      <div className="card p-4 mb-4 flex gap-4 justify-around">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-red)' }}>{totalCount}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>総鑑賞作品数</div>
        </div>
        <div style={{ color: 'var(--beige)', fontSize: '1.5rem' }}>|</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--accent-red)' }}>¥{totalSpend.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>累計チケット代</div>
        </div>
      </div>

      {/* モード切替 */}
      <div className="flex gap-2 mb-4">
        {(['月別', '年別'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '8px',
              background: mode === m ? 'rgba(192,98,74,0.2)' : '#fffdf8',
              border: '1.5px solid', borderColor: mode === m ? 'rgba(192,98,74,0.5)' : 'var(--beige)',
              borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: mode === m ? 600 : 400, color: 'var(--text-main)',
            }}>
            {m}
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p>まだ記録がありません</p>
        </div>
      ) : (
        <>
          {/* グラフ */}
          <div className="card p-4 mb-4">
            <Bar data={{ labels, datasets }} options={chartOptions} />
          </div>

          {/* テーブル */}
          <div className="card overflow-hidden">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--parchment)', borderBottom: '2px solid var(--beige)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--brown)', fontWeight: 600 }}>{mode === '月別' ? '月' : '年'}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--brown)', fontWeight: 600 }}>作品数</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--brown)', fontWeight: 600 }}>チケット代</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--beige)', background: i % 2 === 0 ? '#fffdf8' : 'var(--parchment)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text-main)' }}>{row.label}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--dark-brown)', fontWeight: 600 }}>{row.count}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--brown)' }}>
                      {row.total > 0 ? `¥${row.total.toLocaleString()}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
