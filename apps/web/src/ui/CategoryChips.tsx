import type { CategoryId } from '@hiddenspot/shared';
import { useCatalog } from '@hiddenspot/shared/react';
import { CategoryIcon } from './CategoryIcon';
import { ChipGroup, FilterChip } from './FilterChip';

interface CategoryChipsProps {
  selected: CategoryId[];
  onToggle: (id: CategoryId) => void;
  /** When provided, an "All" chip clears the selection. */
  onClear?: () => void;
  layout?: 'scroll' | 'wrap';
}

/** Category filter row. Categories come from the data service through CatalogProvider. */
export function CategoryChips({ selected, onToggle, onClear, layout }: CategoryChipsProps) {
  const { categories } = useCatalog();
  return (
    <ChipGroup label="Filter by category" layout={layout}>
      {onClear ? (
        <FilterChip label="All" selected={selected.length === 0} onClick={onClear} />
      ) : null}
      {categories.map((category) => (
        <FilterChip
          key={category.id}
          label={category.name}
          icon={<CategoryIcon icon={category.icon} size="sm" />}
          selected={selected.includes(category.id)}
          onClick={() => onToggle(category.id)}
        />
      ))}
    </ChipGroup>
  );
}
