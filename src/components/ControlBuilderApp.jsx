'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Edit3, Send, Upload, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui';
import { ControlEditor } from '@/components/ControlEditor';
import { RequestModal } from '@/components/RequestModal';
import { VOCABULARY } from '@/data/vocabulary';
import { buildVocabularyManifest } from '@/lib/vocabulary-export';

function createEmptyControl() {
  return {
    id: '',
    name: '',
    source_file: '',
    scoped_id: '',
    anchor: '',
    why_reg_cite: '',
    system_behavior: '',
    triggers: [],
    inputs: [],
    outputs: [],
    timers_slas: '',
    edge_cases: '',
    audit_logs: [],
    access_control: '',
    alerts_metrics: '',
    primary_rules: [],
    purpose: '',
  };
}

export function ControlBuilderApp() {
  const [controls, setControls] = useState([]);
  const [selectedControl, setSelectedControl] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(null);
  const [requests, setRequests] = useState([]);
  const [view, setView] = useState('controls');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load controls from public/controls.json on startup
  useEffect(() => {
    loadControls();
  }, []);

  const loadControls = async () => {
    setLoading(true);
    try {
      const response = await fetch('/controls.json');
      const data = await response.json();
      if (data.controls && Array.isArray(data.controls)) {
        setControls(data.controls);
      }
    } catch (err) {
      console.error('Failed to load controls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewControl = () => {
    setSelectedControl(createEmptyControl());
  };

  const handleSaveControl = (control) => {
    const existing = controls.findIndex((c) => c.scoped_id === control.scoped_id || c.id === control.id);
    if (existing >= 0) {
      const newControls = [...controls];
      newControls[existing] = control;
      setControls(newControls);
    } else if (control.id) {
      setControls([...controls, control]);
    }
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.controls && Array.isArray(data.controls)) {
          setControls(data.controls);
          setSaveStatus('imported');
          setTimeout(() => setSaveStatus(null), 2000);
        }
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        alert('Failed to parse JSON file. Please check the format.');
      }
    };
    input.click();
  };

  const handleExportVocabularyYAML = () => {
    const yamlContent = buildVocabularyManifest(controls, VOCABULARY);
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'controls-vocabulary.yaml';
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus('exported vocabulary');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Group controls by source_file
  const controlsBySource = controls.reduce((acc, control) => {
    const source = control.source_file || 'Uncategorized';
    if (!acc[source]) acc[source] = [];
    acc[source].push(control);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-gray-700">Loading controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">⚖️ Control Builder</h1>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('controls')}
              className={`px-3 py-1 text-sm ${
                view === 'controls' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              Controls ({controls.length})
            </button>
            <button
              onClick={() => setView('requests')}
              className={`px-3 py-1 text-sm ${
                view === 'requests' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              Requests ({requests.length})
            </button>
          </div>
          {saveStatus && (
            <span className="text-sm text-green-600 font-medium">
              ✓ {saveStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportJSON}
            className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Upload size={16} /> Import
          </button>
          <button
            onClick={handleExportVocabularyYAML}
            className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download size={16} /> Vocabulary
          </button>
          <button
            onClick={handleNewControl}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> New Control
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {selectedControl ? (
          <div className="flex-1 flex flex-col">
            <ControlEditor
              control={selectedControl}
              onChange={(updated) => {
                setSelectedControl(updated);
                handleSaveControl(updated);
              }}
              onClose={() => setSelectedControl(null)}
              vocabulary={VOCABULARY}
              onRequestNew={(type) => setShowRequestModal(type)}
            />
          </div>
        ) : view === 'controls' ? (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {Object.entries(controlsBySource).map(([source, sourceControls]) => (
                <div key={source}>
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText size={14} />
                    {source}
                    <Badge>{sourceControls.length}</Badge>
                  </h2>
                  <div className="grid gap-3">
                    {sourceControls.map((control) => (
                      <div
                        key={control.scoped_id || control.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                        onClick={() => setSelectedControl(control)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-blue-700">{control.id}</span>
                              {control.primary_rules?.slice(0, 2).map((rule, i) => (
                                <Badge key={i} variant="default">{rule}</Badge>
                              ))}
                              {(control.primary_rules?.length || 0) > 2 && (
                                <Badge variant="default">+{control.primary_rules.length - 2}</Badge>
                              )}
                            </div>
                            <h3 className="font-medium mt-1 text-gray-900">{control.name}</h3>
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">{control.purpose}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedControl(control);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 shrink-0"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {control.triggers?.map((t, i) => (
                            <Badge key={i} variant="info">
                              {t}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          {control.inputs?.length || 0} inputs · {control.outputs?.length || 0} outputs · {control.audit_logs?.length || 0} audit logs
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {controls.length === 0 && (
                <div className="text-center py-12 text-gray-700">
                  <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="mb-2">No controls yet.</p>
                  <p className="text-sm">Click &quot;New Control&quot; to create one, or &quot;Import&quot; to load a JSON file.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Vocabulary Requests</h2>
              {requests.length === 0 ? (
                <div className="text-center py-12 text-gray-700">
                  <Send size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>
                    No requests yet. Requests are created when you need an event or field that
                    doesn&apos;t exist in the vocabulary.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-gray-700">{req.requestId}</span>
                            <Badge variant="warning">{req.status}</Badge>
                            <Badge>{req.type}</Badge>
                          </div>
                          <h3 className="font-medium mt-1">{req.name}</h3>
                          <p className="text-sm text-gray-700">{req.description}</p>
                        </div>
                        <Badge
                          variant={
                            req.priority === 'critical'
                              ? 'error'
                              : req.priority === 'high'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {req.priority}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <strong>Justification:</strong> {req.requirement}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showRequestModal && (
        <RequestModal
          type={showRequestModal}
          controlId={selectedControl?.id || ''}
          onClose={() => setShowRequestModal(null)}
          onSubmit={(req) => {
            setRequests([...requests, req]);
          }}
        />
      )}
    </div>
  );
}