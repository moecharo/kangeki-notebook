import RecordForm from '@/app/components/RecordForm';

export default function NewRecordPage() {
  return (
    <>
      <h1 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--dark-brown)', marginBottom: '16px' }}>
        <span className="tape" style={{ transform: 'none', marginRight: '8px' }}>📝 新規記録</span>
      </h1>
      <RecordForm />
    </>
  );
}
