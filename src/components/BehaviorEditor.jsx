'use client';

import { useState, useEffect } from 'react';
import { X, Plus, List, AlignLeft } from 'lucide-react';

function parseToSteps(text) {
  if (!text) return [''];
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l);
  if (!lines.length) return [''];
  return lines.map((l) => l.replace(/^\d+\.\s*/, '').trim());
}

function stepsToText(steps) {
  return steps
    .filter((s) => s.trim())
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');
}

export function BehaviorEditor({ value, onChange }) {
  const [mode, setMode] = useState('freeform');
  const [steps, setSteps] = useState(() => parseToSteps(value));

  // Sync steps from value when switching to structured mode
  useEffect(() => {
    if (mode === 'structured') {
      setSteps(parseToSteps(value));
    }
  }, [mode]);

  const updateStep = (index, newValue) => {
    const updated = [...steps];
    updated[index] = newValue;
    setSteps(updated);
    onChange(stepsToText(updated));
  };

  const addStep = () => {
    const updated = [...steps, ''];
    setSteps(updated);
  };

  const removeStep = (index) => {
    const updated = steps.filter((_, i) => i !== index);
    if (updated.length === 0) updated.push('');
    setSteps(updated);
    onChange(stepsToText(updated));
  };

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode('freeform')}
            className={`px-2.5 py-1.5 flex items-center gap-1 ${
              mode === 'freeform' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
            }`}
          >
            <AlignLeft size={12} /> Freeform
          </button>
          <button
            type="button"
            onClick={() => setMode('structured')}
            className={`px-2.5 py-1.5 flex items-center gap-1 ${
              mode === 'structured' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
            }`}
          >
            <List size={12} /> Steps
          </button>
        </div>
      </div>

      {mode === 'freeform' ? (
        <textarea
          placeholder="Describe what the system must do when triggered..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24 text-sm"
        />
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-mono text-gray-400 pt-2.5 w-5 shrink-0 text-right">
                {i + 1}.
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Describe this step..."
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="p-2 text-gray-400 hover:text-red-500"
                title="Remove step"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Plus size={14} /> Add step
          </button>
        </div>
      )}
    </div>
  );
}
