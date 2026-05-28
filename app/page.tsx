'use client';
import { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { KangekiRecord } from '@/types';
import { getRecordsSnapshot, subscribeRecords } from '@/lib/storage';
import CategoryBadge from './components/CategoryBadge';
import RecordImage from './components/RecordImage';

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${y}年${parseInt(m)}月${parseInt(day)}日`;
}

function thisMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function TimelinePage() {
  const records = useSyncExternalStore(subscribeRecords, getRecordsSnapshot, () => [] as KangekiRecord[]);
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [accordionHidden, setAccordionHidden] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? records.filter(r => r.title.toLowerCase().includes(q)) : [...records];
    list.sort((a, b) => {
      const diff = a.watchedDate.localeCompare(b.watchedDate);
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [records, query, sortAsc]);

  const monthKey = thisMonthKey();
  const monthRecords = records.filter(r => r.watchedDate.startsWith(monthKey));
  const monthCount = monthRecords.length;
  const monthTotal = monthRecords.reduce((s, r) => s + (r.ticketPrice ?? 0), 0);

  return (
    <>
      {/* 検索・ソート */}
      <div className="flex gap-2 mb-4">
        <input
          type="search"
          className="input-field"
          placeholder="タイトルで検索..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          className="btn-tape btn-tape-blue whitespace-nowrap"
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          onClick={() => setSortAsc(p => !p)}
        >
          {sortAsc ? '↑ 古い順' : '↓ 新しい順'}
        </button>
      </div>

      {/* タイムライン */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📔</div>
          <p style={{ fontSize: '0.95rem' }}>まだ記録がありません</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>右下の ＋ ボタンから最初の記録を追加しましょう</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(record => (
            <Link key={record.id} href={`/record?id=${record.id}`} style={{ textDecoration: 'none' }}>
              <div className="card p-3 flex gap-3 hover:shadow-md transition-shadow cursor-pointer">
                <RecordImage imageUrl={record.imageUrl} category={record.category} width={72} height={100} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap mb-1">
                    <CategoryBadge category={record.category} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(record.watchedDate)}
                    </span>
                  </div>
                  <h2 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', margin: '4px 0', lineHeight: 1.4 }}>
                    {record.title}
                  </h2>
                  {record.venue && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>📍 {record.venue}</p>
                  )}
                  {record.review && (
                    <p style={{
                      fontSize: '0.8rem', color: 'var(--brown)', margin: '4px 0 0',
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {record.review}
                    </p>
                  )}
                  {record.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {record.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="tag-chip selected" style={{ cursor: 'default' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {record.ticketPrice != null && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--brown)', whiteSpace: 'nowrap', alignSelf: 'flex-start', fontWeight: 600 }}>
                    ¥{record.ticketPrice.toLocaleString()}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 下部アコーディオン */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--parchment)',
        borderTop: '2px solid var(--beige)',
        boxShadow: '0 -2px 8px var(--shadow)',
        zIndex: 30,
      }}>
        <div style={{ maxWidth: '672px', margin: '0 auto' }}>
          <button
            onClick={() => setAccordionOpen(p => !p)}
            style={{
              width: '100%', padding: '8px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: 'var(--brown)', fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 600,
            }}
          >
            <span>📅 今月のまとめ</span>
            <span>{accordionOpen ? '▼' : '▲'}</span>
          </button>
          {accordionOpen && (
            <div style={{ padding: '0 16px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                <button
                  onClick={() => setAccordionHidden(p => !p)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'inherit',
                  }}
                >
                  {accordionHidden ? '👁 表示する' : '🙈 目隠しする'}
                </button>
              </div>
              {accordionHidden ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '4px 0' }}>
                  ●●● 目隠し中 ●●●
                </p>
              ) : (
                <div className="flex gap-4 justify-around">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--accent-red)' }}>{monthCount}<span style={{ fontSize: '0.85rem' }}>作品</span></div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>今月の鑑賞数</div>
                  </div>
                  <div style={{ color: 'var(--beige)', fontSize: '1.5rem' }}>|</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--accent-red)' }}>¥{monthTotal.toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>今月のチケット代</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link href="/record/new">
        <button className="fab" aria-label="新規記録を追加">＋</button>
      </Link>
    </>
  );
}
