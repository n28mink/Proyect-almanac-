import { CategoryIcon } from '@clover/ui';

export const Categories = () => (
  <div style={{ display: 'flex', gap: 20, color: 'var(--color-forest)' }}>
    {['jewelry', 'watches', 'sunglasses', 'shirts', 'collections', 'gifts'].map((slug) => <CategoryIcon key={slug} slug={slug} width={28} height={28} />)}
  </div>
);
