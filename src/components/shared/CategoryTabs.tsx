import { useData } from '@/context/DataContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryKey } from '@/types';

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'jarelturg', label: 'J\u00e4relturg' },
  { key: 'newCars', label: 'Uued s\u00f5idukid' },
  { key: 'imports', label: 'Import' },
  { key: 'koguTurg', label: 'Kogu turg' },
];

export default function CategoryTabs() {
  const { activeCategory, setCategory } = useData();

  return (
    <Tabs
      value={activeCategory}
      onValueChange={(val) => setCategory(val as CategoryKey)}
    >
      <TabsList className="h-auto gap-0 bg-transparent p-0 border-b border-border rounded-none w-full justify-start">
        {CATEGORIES.map(({ key, label }) => (
          <TabsTrigger
            key={key}
            value={key}
            className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:font-semibold data-[state=active]:shadow-none"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
