import { Search } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search articles..."
        className="w-full rounded-lg border border-border bg-bg-card py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
      />
    </div>
  );
}