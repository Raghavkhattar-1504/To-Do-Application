import { useState } from 'react';
import { SearchIcon } from './icons.jsx';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form role="search" onSubmit={submit} className="flex items-center gap-3 rounded border border-slate-200 bg-white px-4 py-3">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for a task"
        aria-label="Search for a task"
        className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
      <button type="submit" aria-label="Search" className="text-ink">
        <SearchIcon className="h-5 w-5" />
      </button>
    </form>
  );
}
