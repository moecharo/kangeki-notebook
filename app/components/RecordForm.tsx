'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Category, KangekiRecord } from '@/types';
import type { TmdbMovie } from '@/types';
import { saveRecord, updateRecord, getTmdbApiKey, getUserTags, saveUserTag } from '@/lib/storage';
import { searchMovies, getMovieCredits, getPosterUrl } from '@/lib/tmdb';
import { PRESET_TAGS } from '@/lib/tags';

interface Props {
  initial?: KangekiRecord;
}

type FormState = {
  title: string;
  category: Category;
  watchedDate: string;
  imageUrl: string;
  staffNames: string[];
  castNames: string[];
  venue: string;
  tags: string[];
  review: string;
  ticketPrice: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function RecordForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: initial?.title ?? '',
    category: initial?.category ?? '映画',
    watchedDate: initial?.watchedDate ?? today(),
    imageUrl: initial?.imageUrl ?? '',
    staffNames: initial?.staffNames?.length ? initial.staffNames : [''],
    castNames: initial?.castNames?.length ? initial.castNames : [''],
    venue: initial?.venue ?? '',
    tags: initial?.tags ?? [],
    review: initial?.review ?? '',
    ticketPrice: initial?.ticketPrice != null ? String(initial.ticketPrice) : '',
  });

  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TmdbMovie[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [userTags, setUserTags] = useState<string[]>(() => getUserTags());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const apiKey = getTmdbApiKey();

  // ── TMDB検索 ──
  const handleTmdbSearch = useCallback(async () => {
    if (!apiKey) { setTmdbError('設定画面でアクセストークンを登録してください'); return; }
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    setTmdbError('');
    try {
      const results = await searchMovies(tmdbQuery, apiKey);
      setTmdbResults(results.slice(0, 8));
      if (results.length === 0) setTmdbError('検索結果が見つかりませんでした');
    } catch {
      setTmdbError('TMDB検索に失敗しました。アクセストークンを確認してください');
    } finally {
      setTmdbLoading(false);
    }
  }, [apiKey, tmdbQuery]);

  const handleTmdbSelect = useCallback(async (movie: TmdbMovie) => {
    const posterUrl = getPosterUrl(movie.poster_path);
    setForm(f => ({ ...f, title: movie.title, imageUrl: posterUrl ?? '' }));
    setTmdbResults([]);
    setTmdbQuery('');
    if (!apiKey) return;
    try {
      const credits = await getMovieCredits(movie.id, apiKey);
      const director = credits.crew.find(c => c.job === 'Director')?.name ?? '';
      const topCast = credits.cast.slice(0, 3).map(c => c.name);
      setForm(f => ({
        ...f,
        staffNames: director ? [director] : [''],
        castNames: topCast.length > 0 ? topCast : [''],
      }));
    } catch { /* credits fetch failure is non-fatal */ }
  }, [apiKey]);

  // ── 複数エントリー操作 ──
  function updateEntry(field: 'staffNames' | 'castNames', idx: number, value: string) {
    setForm(f => {
      const arr = [...f[field]];
      arr[idx] = value;
      return { ...f, [field]: arr };
    });
  }
  function addEntry(field: 'staffNames' | 'castNames') {
    setForm(f => ({ ...f, [field]: [...f[field], ''] }));
  }
  function removeEntry(field: 'staffNames' | 'castNames', idx: number) {
    setForm(f => {
      const arr = f[field].filter((_, i) => i !== idx);
      return { ...f, [field]: arr.length ? arr : [''] };
    });
  }

  // ── タグ操作 ──
  function toggleTag(tag: string) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  }
  function addCustomTag() {
    const t = customTagInput.trim();
    if (!t || form.tags.includes(t)) { setCustomTagInput(''); return; }
    saveUserTag(t);
    setUserTags(getUserTags());
    setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setCustomTagInput('');
  }

  // ── 保存 ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'タイトルは必須です';
    if (!form.watchedDate) errs.watchedDate = '見た日付は必須です';
    const imageUrlTrimmed = form.imageUrl.trim();
    if (imageUrlTrimmed) {
      try {
        const { protocol } = new URL(imageUrlTrimmed);
        if (protocol !== 'https:' && protocol !== 'http:') errs.imageUrl = '画像URLはhttps://で始まるURLを指定してください';
      } catch {
        errs.imageUrl = '画像URLの形式が正しくありません';
      }
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const ticketPriceRaw = parseInt(form.ticketPrice, 10);
    const data = {
      title: form.title.trim(),
      category: form.category,
      watchedDate: form.watchedDate,
      imageUrl: imageUrlTrimmed || null,
      staffNames: form.staffNames.map(s => s.trim()).filter(Boolean),
      castNames: form.castNames.map(c => c.trim()).filter(Boolean),
      venue: form.venue.trim() || null,
      tags: form.tags,
      review: form.review.trim() || null,
      ticketPrice: form.ticketPrice !== '' && !isNaN(ticketPriceRaw) ? ticketPriceRaw : null,
    };

    if (initial) {
      updateRecord(initial.id, data);
      router.push(`/record?id=${initial.id}`);
    } else {
      const rec = saveRecord(data);
      router.push(`/record?id=${rec.id}`);
    }
  }

  const catColors: Record<Category, string> = {
    映画: 'rgba(90,127,160,0.2)', 舞台: 'rgba(107,143,94,0.2)', LIVE: 'rgba(192,98,74,0.2)',
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* カテゴリ */}
      <div>
        <span className="field-label">カテゴリ <span style={{ color: 'var(--accent-red)' }}>*</span></span>
        <div className="flex gap-2">
          {(['映画', '舞台', 'LIVE'] as Category[]).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setForm(f => ({ ...f, category: cat }))}
              style={{
                flex: 1, padding: '8px', border: '1.5px solid',
                borderColor: form.category === cat ? 'var(--tan)' : 'var(--beige)',
                background: form.category === cat ? catColors[cat] : '#fffdf8',
                borderRadius: '3px', cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: form.category === cat ? 600 : 400,
                color: 'var(--text-main)', fontSize: '0.9rem',
              }}
            >
              {cat === '映画' ? '🎬' : cat === '舞台' ? '🎭' : '🎤'} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TMDB検索（映画のみ） */}
      {form.category === '映画' && (
        <div className="card p-3">
          <span className="field-label">🔍 映画を検索して自動入力（TMDB）</span>
          {!apiKey && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-red)', marginBottom: '6px' }}>
              ⚠ アクセストークンが未設定です。<a href="/settings" style={{ color: 'var(--accent-blue)' }}>設定画面</a>から登録してください
            </p>
          )}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="input-field"
              placeholder="映画タイトルを入力..."
              value={tmdbQuery}
              onChange={e => setTmdbQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleTmdbSearch())}
              disabled={!apiKey}
            />
            <button
              type="button"
              className="btn-tape btn-tape-blue"
              onClick={handleTmdbSearch}
              disabled={!apiKey || tmdbLoading}
              style={{ padding: '8px 12px', opacity: !apiKey ? 0.5 : 1 }}
            >
              {tmdbLoading ? '...' : '検索'}
            </button>
          </div>
          {tmdbError && <p style={{ fontSize: '0.8rem', color: 'var(--accent-red)' }}>{tmdbError}</p>}
          {tmdbResults.length > 0 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {tmdbResults.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleTmdbSelect(m)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                    background: '#fffdf8', border: '1px solid var(--beige)', borderRadius: '3px',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  {m.poster_path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt="" width={32} height={48} style={{ borderRadius: '2px', objectFit: 'cover' }} />
                  )}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {m.title} {m.release_date && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({m.release_date.slice(0, 4)})</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* タイトル */}
      <div>
        <label className="field-label" htmlFor="title">タイトル <span style={{ color: 'var(--accent-red)' }}>*</span></label>
        <input
          id="title"
          type="text"
          className="input-field"
          placeholder="作品名・舞台名・イベント名"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
        {errors.title && <p style={{ fontSize: '0.78rem', color: 'var(--accent-red)', marginTop: '2px' }}>{errors.title}</p>}
      </div>

      {/* 見た日付 */}
      <div>
        <label className="field-label" htmlFor="watchedDate">見た日付 <span style={{ color: 'var(--accent-red)' }}>*</span></label>
        <input
          id="watchedDate"
          type="date"
          className="input-field"
          value={form.watchedDate}
          onChange={e => setForm(f => ({ ...f, watchedDate: e.target.value }))}
        />
        {errors.watchedDate && <p style={{ fontSize: '0.78rem', color: 'var(--accent-red)', marginTop: '2px' }}>{errors.watchedDate}</p>}
      </div>

      {/* 画像URL */}
      <div>
        <label className="field-label" htmlFor="imageUrl">画像URL <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（任意）</span></label>
        <input
          id="imageUrl"
          type="url"
          className="input-field"
          placeholder="https://..."
          value={form.imageUrl}
          onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
        />
        {errors.imageUrl && <p style={{ fontSize: '0.78rem', color: 'var(--accent-red)', marginTop: '2px' }}>{errors.imageUrl}</p>}
      </div>

      {/* 推しスタッフ */}
      <div>
        <span className="field-label">推しスタッフ <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（監督・演出家など / 任意）</span></span>
        {form.staffNames.map((name, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <input
              type="text"
              className="input-field"
              placeholder={form.category === '映画' ? '監督名' : form.category === '舞台' ? '演出家名' : '制作スタッフ名'}
              value={name}
              onChange={e => updateEntry('staffNames', idx, e.target.value)}
            />
            {form.staffNames.length > 1 && (
              <button type="button" onClick={() => removeEntry('staffNames', idx)}
                style={{ padding: '0 8px', background: 'none', border: '1px solid var(--beige)', borderRadius: '3px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => addEntry('staffNames')}
          style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit' }}>
          ＋ スタッフを追加
        </button>
      </div>

      {/* 推しキャスト */}
      <div>
        <span className="field-label">推しキャスト <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（俳優・演者・アーティスト / 任意）</span></span>
        {form.castNames.map((name, idx) => (
          <div key={idx} className="flex gap-2 mb-1">
            <input
              type="text"
              className="input-field"
              placeholder={form.category === '映画' ? '俳優名' : form.category === '舞台' ? '演者名' : 'アーティスト名'}
              value={name}
              onChange={e => updateEntry('castNames', idx, e.target.value)}
            />
            {form.castNames.length > 1 && (
              <button type="button" onClick={() => removeEntry('castNames', idx)}
                style={{ padding: '0 8px', background: 'none', border: '1px solid var(--beige)', borderRadius: '3px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => addEntry('castNames')}
          style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontFamily: 'inherit' }}>
          ＋ キャストを追加
        </button>
      </div>

      {/* 見た場所 */}
      <div>
        <label className="field-label" htmlFor="venue">見た場所 <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（任意）</span></label>
        <input
          id="venue"
          type="text"
          className="input-field"
          placeholder="TOHOシネマズ・帝国劇場・Zepp大阪・配信 など"
          value={form.venue}
          onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
        />
      </div>

      {/* タグ */}
      <div>
        <span className="field-label">タグ <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（任意）</span></span>
        {Object.entries(PRESET_TAGS).map(([group, tags]) => (
          <div key={group} style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>{group}</p>
            <div className="flex flex-wrap gap-1">
              {tags.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`tag-chip ${form.tags.includes(tag) ? 'selected' : ''}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        {userTags.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>カスタム</p>
            <div className="flex flex-wrap gap-1">
              {userTags.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`tag-chip ${form.tags.includes(tag) ? 'selected' : ''}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            className="input-field"
            placeholder="タグを自由入力して追加..."
            value={customTagInput}
            onChange={e => setCustomTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
            style={{ fontSize: '0.85rem' }}
          />
          <button type="button" onClick={addCustomTag}
            className="btn-tape btn-tape-green"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            追加
          </button>
        </div>
      </div>

      {/* 感想 */}
      <div>
        <label className="field-label" htmlFor="review">感想 <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（任意・星評価なし）</span></label>
        <textarea
          id="review"
          className="input-field"
          placeholder="一言でも長文でも、気持ちのままに..."
          value={form.review}
          onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
          style={{ minHeight: '100px' }}
        />
      </div>

      {/* チケット代 */}
      <div>
        <label className="field-label" htmlFor="ticketPrice">チケット代 <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>（任意・¥）</span></label>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--brown)', fontWeight: 600 }}>¥</span>
          <input
            id="ticketPrice"
            type="number"
            min="0"
            step="1"
            className="input-field"
            placeholder="3500"
            value={form.ticketPrice}
            onChange={e => setForm(f => ({ ...f, ticketPrice: e.target.value }))}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={() => router.back()}
          style={{
            padding: '8px 16px', background: 'none', border: '1.5px solid var(--beige)',
            borderRadius: '3px', cursor: 'pointer', color: 'var(--text-muted)',
            fontFamily: 'inherit', fontSize: '0.9rem',
          }}>
          キャンセル
        </button>
        <button type="submit" className="btn-tape" style={{ fontSize: '1rem', padding: '10px 28px' }}>
          📌 保存する
        </button>
      </div>
    </form>
  );
}
