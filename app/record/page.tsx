'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { KangekiRecord } from '@/types';
import { getRecordById, deleteRecord } from '@/lib/storage';
import CategoryBadge from '@/app/components/CategoryBadge';
import RecordImage from '@/app/components/RecordImage';

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${y}年${parseInt(m)}月${parseInt(day)}日`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ borderBottom: '1px dashed var(--beige)', paddingBottom: '10px', marginBottom: '10px' }}>
      <span className="field-label" style={{ marginBottom: '2px' }}>{label}</span>
      <div style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

function RecordDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const router = useRouter();
  const [record, setRecord] = useState<KangekiRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setRecord(getRecordById(id));
  }, [id]);

  if (!id || !record) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>記録が見つかりません</p>;
  }

  function handleDelete() {
    deleteRecord(id);
    router.push('/');
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '0 4px' }}>
          ←
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>記録詳細</span>
      </div>

      <div className="card p-4">
        <div className="flex gap-4 mb-4">
          <RecordImage imageUrl={record.imageUrl} category={record.category} width={96} height={136} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CategoryBadge category={record.category} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(record.watchedDate)}</span>
            </div>
            <h1 style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--dark-brown)', lineHeight: 1.4, marginBottom: '6px' }}>
              {record.title}
            </h1>
            {record.venue && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>📍 {record.venue}</p>
            )}
            {record.ticketPrice != null && (
              <p style={{ fontSize: '0.82rem', color: 'var(--brown)', margin: '4px 0 0', fontWeight: 600 }}>
                🎟 ¥{record.ticketPrice.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {record.staffNames.length > 0 && <Row label="推しスタッフ" value={record.staffNames.join('、')} />}
        {record.castNames.length > 0 && <Row label="推しキャスト" value={record.castNames.join('、')} />}
        {record.tags.length > 0 && (
          <Row label="タグ" value={
            <div className="flex flex-wrap gap-1 mt-1">
              {record.tags.map(tag => (
                <span key={tag} className="tag-chip selected" style={{ cursor: 'default' }}>{tag}</span>
              ))}
            </div>
          } />
        )}
        {record.review && <Row label="感想" value={<p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{record.review}</p>} />}

        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
          登録: {new Date(record.createdAt).toLocaleDateString('ja-JP')}
          {record.createdAt !== record.updatedAt && ` / 更新: ${new Date(record.updatedAt).toLocaleDateString('ja-JP')}`}
        </p>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            padding: '8px 16px', background: 'rgba(192,98,74,0.1)', border: '1.5px solid rgba(192,98,74,0.4)',
            borderRadius: '3px', cursor: 'pointer', color: 'var(--accent-red)',
            fontFamily: 'inherit', fontSize: '0.85rem',
          }}
        >
          🗑 削除
        </button>
        <Link href={`/record/edit?id=${record.id}`}>
          <button className="btn-tape btn-tape-blue" style={{ fontSize: '0.9rem' }}>✏ 編集する</button>
        </Link>
      </div>

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px',
        }}>
          <div className="card p-5" style={{ maxWidth: '320px', width: '100%' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--dark-brown)' }}>削除の確認</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              「{record.title}」の記録を削除しますか？この操作は元に戻せません。
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)}
                style={{ padding: '8px 16px', background: 'none', border: '1.5px solid var(--beige)', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}>
                キャンセル
              </button>
              <button onClick={handleDelete}
                style={{ padding: '8px 16px', background: 'rgba(192,98,74,0.2)', border: '1.5px solid rgba(192,98,74,0.5)', borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--accent-red)', fontWeight: 600 }}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function RecordPage() {
  return (
    <Suspense>
      <RecordDetail />
    </Suspense>
  );
}
