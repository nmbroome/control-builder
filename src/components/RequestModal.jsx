'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

export function RequestModal({ type, controlId, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    requirement: '',
    priority: 'medium',
  });

  const handleSubmit = () => {
    onSubmit({
      type,
      controlContext: controlId,
      ...form,
      requestId: `VR-2026-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Request New {type === 'event' ? 'Event' : 'Field'}
          </h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'event' ? 'Event Name' : 'Field Name'}
            </label>
            <input
              type="text"
              placeholder={
                type === 'event'
                  ? 'e.g., product.options.presented'
                  : 'e.g., pep.office_details'
              }
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="What this represents"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regulatory Requirement
            </label>
            <textarea
              placeholder="Why is this needed? Cite the regulation."
              value={form.requirement}
              onChange={(e) => setForm({ ...form, requirement: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="critical">Critical - Regulatory deadline</option>
              <option value="high">High - Exam finding</option>
              <option value="medium">Medium - Process improvement</option>
              <option value="low">Low - Nice to have</option>
            </select>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <strong>Note:</strong> This request will be sent to Engineering for review.
            Average response: 1-3 business days.
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.requirement}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={16} /> Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}
