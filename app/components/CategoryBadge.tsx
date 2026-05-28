import type { Category } from '@/types';

const MAP: Record<Category, { cls: string; icon: string }> = {
  映画: { cls: 'badge-movie', icon: '🎬' },
  舞台: { cls: 'badge-stage', icon: '🎭' },
  LIVE: { cls: 'badge-live',  icon: '🎤' },
};

export default function CategoryBadge({ category }: { category: Category }) {
  const { cls, icon } = MAP[category];
  return <span className={`badge ${cls}`}>{icon} {category}</span>;
}
