'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

export function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  grouped = false,
  onRequestNew,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();

    if (grouped) {
      return Object.fromEntries(
        Object.entries(options)
          .map(([cat, items]) => [
            cat,
            items.filter(
              (i) =>
                i.id.toLowerCase().includes(lower) ||
                i.description?.toLowerCase().includes(lower)
            ),
          ])
          .filter(([, items]) => items.length > 0)
      );
    }

    return options.filter((o) =>
      (typeof o === 'string' ? o : o.id).toLowerCase().includes(lower)
    );
  }, [options, search, grouped]);

  const selectedLabel = useMemo(() => {
    if (!value) return null;

    if (grouped) {
      for (const items of Object.values(options)) {
        const found = items.find((i) => i.id === value);
        if (found) return found;
      }
    }

    return typeof options[0] === 'string'
      ? value
      : options.find((o) => o.id === value);
  }, [value, options, grouped]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-gray-400 bg-white text-sm"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-600'}>
          {selectedLabel
            ? typeof selectedLabel === 'string'
              ? selectedLabel
              : selectedLabel.id
            : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-600" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {grouped
              ? Object.entries(filteredOptions).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-50 uppercase">
                      {category}
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onChange(item.id);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex flex-col ${
                          value === item.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span className="text-sm font-medium">{item.id}</span>
                        {item.description && (
                          <span className="text-xs text-gray-700">
                            {item.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))
              : filteredOptions.map((opt) => {
                  const id = typeof opt === 'string' ? opt : opt.id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onChange(id);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 text-sm ${
                        value === id ? 'bg-blue-50' : ''
                      }`}
                    >
                      {id}
                    </button>
                  );
                })}
          </div>
          {onRequestNew && (
            <button
              onClick={() => {
                onRequestNew();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 border-t border-gray-100 flex items-center gap-2 text-sm"
            >
              <Plus size={14} /> Request new...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
