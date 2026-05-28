'use client';
import { useState, useEffect } from 'react';
import { getTmdbApiKey, saveTmdbApiKey, clearTmdbApiKey } from '@/lib/storage';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const key = getTmdbApiKey();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(key);
    setInputKey(key);
  }, []);

  function handleSave() {
    const trimmed = inputKey.trim();
    saveTmdbApiKey(trimmed);
    setApiKey(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleClear() {
    clearTmdbApiKey();
    setApiKey('');
    setInputKey('');
  }

  return (
    <>
      <h1 style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--dark-brown)', marginBottom: '16px' }}>
        <span className="tape" style={{ transform: 'none', marginRight: '8px' }}>⚙ 設定</span>
      </h1>

      <div className="card p-4 mb-4">
        <h2 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--brown)', marginBottom: '12px' }}>
          TMDB APIキー
        </h2>

        <div style={{
          padding: '10px 12px', borderRadius: '3px', marginBottom: '12px',
          background: apiKey ? 'rgba(107,143,94,0.12)' : 'rgba(192,98,74,0.08)',
          border: `1px solid ${apiKey ? 'rgba(107,143,94,0.3)' : 'rgba(192,98,74,0.2)'}`,
          fontSize: '0.82rem',
          color: apiKey ? 'var(--accent-green)' : 'var(--accent-red)',
        }}>
          {apiKey ? '✅ APIキーが設定されています。映画の自動検索が使用できます。' : '⚠ APIキーが未設定です。映画の自動検索を使うには登録が必要です。'}
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
          TMDB（The Movie Database）のAPIキーを入力してください。
          APIキーは <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>TMDB公式サイト</a> で無料取得できます。
          キーはこのブラウザのlocalStorageにのみ保存され、外部には送信されません。
        </p>

        <label className="field-label" htmlFor="apikey">APIキー</label>
        <div className="flex gap-2 mb-3">
          <input
            id="apikey"
            type={showKey ? 'text' : 'password'}
            className="input-field"
            placeholder="TMDBのAPIキーを入力..."
            value={inputKey}
            onChange={e => setInputKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
          />
          <button type="button" onClick={() => setShowKey(p => !p)}
            style={{
              padding: '0 12px', background: 'var(--parchment)', border: '1.5px solid var(--beige)',
              borderRadius: '3px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)',
            }}>
            {showKey ? '🙈' : '👁'}
          </button>
        </div>

        <div className="flex gap-2 justify-between">
          <button
            onClick={handleClear}
            disabled={!apiKey}
            style={{
              padding: '8px 16px', background: apiKey ? 'rgba(192,98,74,0.1)' : 'var(--parchment)',
              border: '1.5px solid', borderColor: apiKey ? 'rgba(192,98,74,0.4)' : 'var(--beige)',
              borderRadius: '3px', cursor: apiKey ? 'pointer' : 'default',
              color: apiKey ? 'var(--accent-red)' : 'var(--text-muted)',
              fontFamily: 'inherit', fontSize: '0.85rem', opacity: apiKey ? 1 : 0.5,
            }}
          >
            🗑 クリア
          </button>
          <button onClick={handleSave} className="btn-tape" style={{ position: 'relative' }}>
            {saved ? '✅ 保存しました' : '💾 保存する'}
          </button>
        </div>
      </div>

      <div className="card p-4" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--brown)', marginBottom: '6px' }}>アプリについて</h3>
        <p>エンタメ観劇手帳 — 映画・舞台・LIVEの個人鑑賞記録アプリ</p>
        <p>データはすべてこのブラウザのlocalStorageに保存されます。</p>
        <p style={{ marginTop: '6px' }}>⚠ ブラウザのデータを削除するとすべての記録が消えます。定期的にバックアップをお取りください。</p>
      </div>
    </>
  );
}
