'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  List,
  LayoutGrid,
  ArrowUpDown,
  FileText,
  Edit3,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui';
import { validateControl } from '@/lib/control-validation';

export function ControlList({
  controls,
  onSelectControl,
  onDuplicateControl,
  onDeleteControl,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState(null);
  const [validationFilter, setValidationFilter] = useState('all');
  const [sortBy, setSortBy] = useState('source_file');
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useState('card');

  // Validate all controls once
  const validationMap = useMemo(() => {
    const map = new Map();
    for (const c of controls) {
      map.set(c.scoped_id || c.id, validateControl(c));
    }
    return map;
  }, [controls]);

  // Unique source files for filter pills
  const sourceFiles = useMemo(() => {
    const files = [...new Set(controls.map((c) => c.source_file).filter(Boolean))];
    return files.sort();
  }, [controls]);

  // Filter
  const filteredControls = useMemo(() => {
    let result = controls;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.purpose || '').toLowerCase().includes(q) ||
          (c.triggers || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (sourceFilter) {
      result = result.filter((c) => c.source_file === sourceFilter);
    }

    if (validationFilter === 'valid') {
      result = result.filter((c) => validationMap.get(c.scoped_id || c.id)?.valid);
    } else if (validationFilter === 'invalid') {
      result = result.filter((c) => !validationMap.get(c.scoped_id || c.id)?.valid);
    }

    return result;
  }, [controls, searchQuery, sourceFilter, validationFilter, validationMap]);

  // Sort
  const sortedControls = useMemo(() => {
    const sorted = [...filteredControls].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = (a.name || '').localeCompare(b.name || '');
          break;
        case 'id':
          cmp = a.id.localeCompare(b.id);
          break;
        case 'source_file':
          cmp = (a.source_file || '').localeCompare(b.source_file || '');
          break;
        case 'triggers':
          cmp = (a.triggers?.length || 0) - (b.triggers?.length || 0);
          break;
        case 'inputs':
          cmp = (a.inputs?.length || 0) - (b.inputs?.length || 0);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredControls, sortBy, sortDir]);

  // Group for card view
  const groupedControls = useMemo(() => {
    return sortedControls.reduce((acc, control) => {
      const source = control.source_file || 'Uncategorized';
      if (!acc[source]) acc[source] = [];
      acc[source].push(control);
      return acc;
    }, {});
  }, [sortedControls]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const validCount = useMemo(
    () => [...validationMap.values()].filter((v) => v.valid).length,
    [validationMap]
  );
  const invalidCount = controls.length - validCount;

  // Empty state
  if (controls.length === 0) {
    return (
      <div className="text-center py-12 text-gray-700">
        <FileText size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="mb-2">No controls yet.</p>
        <p className="text-sm">
          Click &quot;New Control&quot; to create one, or &quot;Import&quot; to load a JSON file.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search + Filters Bar */}
      <div className="mb-4 space-y-3">
        {/* Top row: search + validation filter + sort + view toggle */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search controls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Validation filter */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs shrink-0">
            <button
              onClick={() => setValidationFilter('all')}
              className={`px-3 py-2 ${
                validationFilter === 'all' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setValidationFilter('valid')}
              className={`px-3 py-2 flex items-center gap-1 ${
                validationFilter === 'valid'
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <CheckCircle size={12} /> Valid ({validCount})
            </button>
            <button
              onClick={() => setValidationFilter('invalid')}
              className={`px-3 py-2 flex items-center gap-1 ${
                validationFilter === 'invalid'
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'hover:bg-gray-50'
              }`}
            >
              <AlertCircle size={12} /> Issues ({invalidCount})
            </button>
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs bg-white cursor-pointer hover:bg-gray-50"
            >
              <option value="source_file">Sort: Source</option>
              <option value="id">Sort: ID</option>
              <option value="name">Sort: Name</option>
              <option value="triggers">Sort: Triggers</option>
              <option value="inputs">Sort: Inputs</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Sort direction */}
          <button
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 shrink-0"
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown size={14} className="text-gray-500" />
          </button>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 ${viewMode === 'card' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              title="Card view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
              title="Table view"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Source file pills */}
        {sourceFiles.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {sourceFiles.map((source) => (
              <button
                key={source}
                onClick={() => setSourceFilter(sourceFilter === source ? null : source)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  sourceFilter === source
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {source}
              </button>
            ))}
            {sourceFilter && (
              <button
                onClick={() => setSourceFilter(null)}
                className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500 mb-3">
        Showing {filteredControls.length} of {controls.length} controls
      </p>

      {/* Card View */}
      {viewMode === 'card' ? (
        <div className="space-y-6">
          {Object.entries(groupedControls).map(([source, sourceControls]) => (
            <div key={source}>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FileText size={14} />
                {source}
                <Badge>{sourceControls.length}</Badge>
              </h2>
              <div className="grid gap-3">
                {sourceControls.map((control) => {
                  const v = validationMap.get(control.scoped_id || control.id);
                  return (
                    <div
                      key={control.scoped_id || control.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                      onClick={() => onSelectControl(control)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {v?.valid ? (
                              <CheckCircle size={14} className="text-green-500 shrink-0" />
                            ) : (
                              <AlertCircle size={14} className="text-amber-500 shrink-0" />
                            )}
                            <span className="font-mono font-bold text-blue-700">{control.id}</span>
                            {control.primary_rules?.slice(0, 2).map((rule, i) => (
                              <Badge key={i} variant="default">
                                {rule}
                              </Badge>
                            ))}
                            {(control.primary_rules?.length || 0) > 2 && (
                              <Badge variant="default">
                                +{control.primary_rules.length - 2}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium mt-1 text-gray-900">{control.name}</h3>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                            {control.purpose}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateControl(control);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteControl(control);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectControl(control);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {control.triggers?.slice(0, 3).map((t, i) => (
                          <Badge key={i} variant="info">
                            {t}
                          </Badge>
                        ))}
                        {(control.triggers?.length || 0) > 3 && (
                          <Badge variant="default">+{control.triggers.length - 3} more</Badge>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        {control.inputs?.length || 0} inputs · {control.outputs?.length || 0}{' '}
                        outputs · {control.audit_logs?.length || 0} audit logs
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredControls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No controls match your search.</p>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <th className="py-2 px-3 w-8"></th>
                <th
                  className="py-2 px-3 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('id')}
                >
                  ID {sortBy === 'id' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('name')}
                >
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('source_file')}
                >
                  Source {sortBy === 'source_file' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="py-2 px-3 cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('triggers')}
                >
                  Triggers {sortBy === 'triggers' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2 px-3">Inputs</th>
                <th className="py-2 px-3">Outputs</th>
                <th className="py-2 px-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sortedControls.map((control) => {
                const v = validationMap.get(control.scoped_id || control.id);
                return (
                  <tr
                    key={control.scoped_id || control.id}
                    className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer"
                    onClick={() => onSelectControl(control)}
                  >
                    <td className="py-2 px-3">
                      {v?.valid ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : (
                        <AlertCircle size={14} className="text-amber-500" />
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-medium text-blue-700">{control.id}</td>
                    <td className="py-2 px-3 max-w-xs truncate">{control.name}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs">{control.source_file}</td>
                    <td className="py-2 px-3">{control.triggers?.length || 0}</td>
                    <td className="py-2 px-3">{control.inputs?.length || 0}</td>
                    <td className="py-2 px-3">{control.outputs?.length || 0}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateControl(control);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="Duplicate"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteControl(control);
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredControls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No controls match your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
