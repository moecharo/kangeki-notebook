'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { KangekiRecord } from '@/types';
import { getRecordById } from '@/lib/storage';
import RecordForm from '@/app/components/RecordForm';

function EditForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') ?? '';
  const [record, setRecord] = useState<KangekiRecord | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) setRecord(getRecordById(id));
  }, [id]);

  if (!id || !record) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '40px' }}>記録が見つかりません</p>;
  }

  return (
    <>
      <h1 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--dark-brown)', marginBottom: '16px' }}>
        <span className="tape" style={{ transform: 'none', marginRight: '8px' }}>✏ 記録を編集</span>
      </h1>
      <RecordForm initial={record} />
    </>
  );
}

export default function EditRecordPage() {
  return (
    <Suspense>
      <EditForm />
    </Suspense>
  );
}
