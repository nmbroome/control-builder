'use client';

import { useState, useMemo } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  Edit3,
  Plus,
  Copy,
} from 'lucide-react';
import { Badge, Section, Dropdown } from '@/components/ui';
import { buildControlPreview } from '@/lib/vocabulary-export';

export function ControlEditor({
  control,
  onChange,
  onClose,
  vocabulary,
  onRequestNew,
}) {
  const [activeTab, setActiveTab] = useState('edit');

  const groupedEvents = useMemo(() => {
    const groups = {};
    Object.entries(vocabulary.events).forEach(([id, data]) => {
      const cat = data.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ id, description: data.description });
    });
    return groups;
  }, [vocabulary.events]);

  const groupedFields = useMemo(() => {
    const groups = {};
    Object.entries(vocabulary.fields).forEach(([id, data]) => {
      const cat = data.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ id, description: data.description });
    });
    return groups;
  }, [vocabulary.fields]);

  const updateControl = (key, value) => {
    onChange({ ...control, [key]: value });
  };

  const addToArray = (key, item) => {
    const currentArray = control[key] || [];
    onChange({ ...control, [key]: [...currentArray, item] });
  };

  const removeFromArray = (key, index) => {
    const currentArray = control[key] || [];
    onChange({ ...control, [key]: currentArray.filter((_, i) => i !== index) });
  };

  const updateArrayItem = (key, index, value) => {
    const currentArray = [...(control[key] || [])];
    currentArray[index] = value;
    onChange({ ...control, [key]: currentArray });
  };

  const generateJSON = () => {
    return JSON.stringify(control, null, 2);
  };

  const generateYAML = useMemo(() => {
    return buildControlPreview(control, vocabulary);
  }, [control, vocabulary]);

  const validation = useMemo(() => {
    const errors = [];
    if (!control.id) errors.push('Control ID is required');
    if (!control.name) errors.push('Control name is required');
    if (!control.triggers?.length) errors.push('At least one trigger is required');
    if (!control.why_reg_cite) errors.push('Regulatory citation is required');
    if (!control.system_behavior) errors.push('System behavior is required');
    return { errors, valid: errors.length === 0 };
  }, [control]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X size={20} />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{control.id || 'New Control'}</h2>
            <p className="text-sm text-gray-700">{control.name || 'Untitled'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                activeTab === 'edit' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                activeTab === 'json' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <FileText size={14} /> JSON
            </button>
            <button
              onClick={() => setActiveTab('yaml')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                activeTab === 'yaml' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <FileText size={14} /> YAML
            </button>
          </div>
          {validation.valid ? (
            <Badge variant="success">
              <CheckCircle size={12} className="inline mr-1" />
              Valid
            </Badge>
          ) : (
            <Badge variant="error">
              <AlertCircle size={12} className="inline mr-1" />
              {validation.errors.length} errors
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {activeTab === 'edit' ? (
          <div className="max-w-2xl mx-auto space-y-3">
            {validation.errors.length > 0 && (
              <div className="space-y-2">
                {validation.errors.map((err, i) => (
                  <div
                    key={i}
                    className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center gap-2"
                  >
                    <AlertCircle size={14} /> {err}
                  </div>
                ))}
              </div>
            )}

            {/* Identity Section */}
            <Section title="Identity">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Control ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., CA-01"
                    value={control.id || ''}
                    onChange={(e) => {
                      const newId = e.target.value.toUpperCase();
                      updateControl('id', newId);
                      if (control.source_file) {
                        updateControl('scoped_id', `${control.source_file}:${newId}`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source File
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., charitable-donation-accounts.md"
                    value={control.source_file || ''}
                    onChange={(e) => {
                      updateControl('source_file', e.target.value);
                      if (control.id) {
                        updateControl('scoped_id', `${e.target.value}:${control.id}`);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Governance & Ownership"
                  value={control.name || ''}
                  onChange={(e) => {
                    updateControl('name', e.target.value);
                    const anchor = `${control.id?.toLowerCase() || ''}-${e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`;
                    updateControl('anchor', anchor);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input
                  type="text"
                  placeholder="Brief purpose statement"
                  value={control.purpose || ''}
                  onChange={(e) => updateControl('purpose', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-700">
                <div>
                  <span className="font-medium">Scoped ID:</span> {control.scoped_id || '—'}
                </div>
                <div>
                  <span className="font-medium">Anchor:</span> {control.anchor || '—'}
                </div>
              </div>
            </Section>

            {/* Regulatory Section */}
            <Section title="Regulatory Basis" badge={<Badge>{control.primary_rules?.length || 0}</Badge>}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why / Reg Citation
                </label>
                <textarea
                  placeholder="Regulatory requirement and citation..."
                  value={control.why_reg_cite || ''}
                  onChange={(e) => updateControl('why_reg_cite', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 text-sm"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Rules
                </label>
                <div className="space-y-2">
                  {(control.primary_rules || []).map((rule, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => updateArrayItem('primary_rules', i, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="e.g., 12 CFR §721.3(b)(2)"
                      />
                      <button
                        onClick={() => removeFromArray('primary_rules', i)}
                        className="p-2 text-gray-600 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addToArray('primary_rules', '')}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Plus size={14} /> Add rule
                  </button>
                </div>
              </div>
            </Section>

            {/* Triggers Section */}
            <Section
              title="Triggers"
              badge={<Badge variant="info">{control.triggers?.length || 0}</Badge>}
            >
              <p className="text-xs text-gray-700 mb-2">Events that activate this control</p>
              <div className="space-y-2">
                {(control.triggers || []).map((trigger, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Dropdown
                        value={trigger}
                        onChange={(val) => updateArrayItem('triggers', i, val)}
                        options={groupedEvents}
                        grouped={true}
                        placeholder="Select event..."
                        onRequestNew={() => onRequestNew('event')}
                      />
                    </div>
                    <button
                      onClick={() => removeFromArray('triggers', i)}
                      className="p-2 text-gray-600 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addToArray('triggers', '')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add trigger
                </button>
              </div>
            </Section>

            {/* System Behavior Section */}
            <Section title="System Behavior">
              <textarea
                placeholder="Describe what the system must do when triggered..."
                value={control.system_behavior || ''}
                onChange={(e) => updateControl('system_behavior', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 text-sm"
              />
            </Section>

            {/* Inputs Section */}
            <Section title="Inputs" badge={<Badge>{control.inputs?.length || 0}</Badge>}>
              <p className="text-xs text-gray-700 mb-2">Data fields this control needs</p>
              <div className="space-y-2">
                {(control.inputs || []).map((input, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Dropdown
                        value={input.replace(/[()]/g, '')}
                        onChange={(val) => updateArrayItem('inputs', i, val)}
                        options={groupedFields}
                        grouped={true}
                        placeholder="Select field..."
                        onRequestNew={() => onRequestNew('field')}
                      />
                    </div>
                    {vocabulary.fields[input.replace(/[()]/g, '')]?.pii && (
                      <Badge variant="pii">PII</Badge>
                    )}
                    <button
                      onClick={() => removeFromArray('inputs', i)}
                      className="p-2 text-gray-600 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addToArray('inputs', '')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add input
                </button>
              </div>
            </Section>

            {/* Outputs Section */}
            <Section title="Outputs" badge={<Badge>{control.outputs?.length || 0}</Badge>}>
              <p className="text-xs text-gray-700 mb-2">Data fields this control produces</p>
              <div className="space-y-2">
                {(control.outputs || []).map((output, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Dropdown
                        value={output}
                        onChange={(val) => updateArrayItem('outputs', i, val)}
                        options={groupedFields}
                        grouped={true}
                        placeholder="Select field..."
                        onRequestNew={() => onRequestNew('field')}
                      />
                    </div>
                    <button
                      onClick={() => removeFromArray('outputs', i)}
                      className="p-2 text-gray-600 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addToArray('outputs', '')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add output
                </button>
              </div>
            </Section>

            {/* Timers & SLAs Section */}
            <Section title="Timers & SLAs" badge={<Badge variant="warning">SLA</Badge>}>
              <textarea
                placeholder="Timing requirements and SLAs..."
                value={control.timers_slas || ''}
                onChange={(e) => updateControl('timers_slas', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 text-sm"
              />
            </Section>

            {/* Edge Cases Section */}
            <Section title="Edge Cases">
              <textarea
                placeholder="Exception handling and edge cases..."
                value={control.edge_cases || ''}
                onChange={(e) => updateControl('edge_cases', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20 text-sm"
              />
            </Section>

            {/* Audit Logs Section */}
            <Section title="Audit Logs" badge={<Badge>{control.audit_logs?.length || 0}</Badge>}>
              <p className="text-xs text-gray-700 mb-2">Events to log for audit trail</p>
              <div className="space-y-2">
                {(control.audit_logs || []).map((log, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={log}
                      onChange={(e) => updateArrayItem('audit_logs', i, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="e.g., policy.version.published"
                    />
                    <button
                      onClick={() => removeFromArray('audit_logs', i)}
                      className="p-2 text-gray-600 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addToArray('audit_logs', '')}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> Add audit log
                </button>
              </div>
            </Section>

            {/* Access Control Section */}
            <Section title="Access Control">
              <textarea
                placeholder="e.g., Edit: CFO/Compliance; Approve: Board."
                value={control.access_control || ''}
                onChange={(e) => updateControl('access_control', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-16 text-sm"
              />
            </Section>

            {/* Alerts & Metrics Section */}
            <Section title="Alerts & Metrics">
              <textarea
                placeholder="Key metrics and alerting criteria..."
                value={control.alerts_metrics || ''}
                onChange={(e) => updateControl('alerts_metrics', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg h-16 text-sm"
              />
            </Section>
          </div>
        ) : activeTab === 'json' ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-xs font-mono whitespace-pre">
                {generateJSON()}
              </pre>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(generateJSON())}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm"
              >
                <Copy size={14} /> Copy JSON
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-xs font-mono whitespace-pre">
                {generateYAML}
              </pre>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(generateYAML)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm"
              >
                <Copy size={14} /> Copy YAML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
