'use client';

export function RulePreview({ control, vocabulary }) {
  const hasTriggers = control.triggers?.some((t) => t);
  const hasInputs = control.inputs?.some((i) => i);
  const hasOutputs = control.outputs?.some((o) => o);
  const hasAuditLogs = control.audit_logs?.some((l) => l);
  const hasBehavior = !!control.system_behavior;

  if (!hasTriggers && !hasInputs && !hasOutputs && !hasAuditLogs && !hasBehavior) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Rule Summary
      </div>

      {/* WHEN row */}
      {hasTriggers && (
        <div className="flex items-start gap-2 py-1.5" data-testid="rule-when">
          <span className="text-xs font-bold text-blue-600 uppercase w-14 shrink-0 pt-0.5">
            When
          </span>
          <div className="flex flex-wrap gap-1 items-center">
            {control.triggers
              .filter((t) => t)
              .map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-sm font-mono"
                >
                  {t}
                </span>
              ))}
            <span className="text-sm text-gray-500">fires</span>
          </div>
        </div>
      )}

      {/* CHECK row */}
      {hasInputs && (
        <div
          className="flex items-start gap-2 py-1.5 border-t border-gray-100"
          data-testid="rule-check"
        >
          <span className="text-xs font-bold text-amber-600 uppercase w-14 shrink-0 pt-0.5">
            Check
          </span>
          <div className="flex flex-wrap gap-1">
            {control.inputs
              .filter((i) => i)
              .map((inp, i) => {
                const cleanId = inp.replace(/[()]/g, '');
                const fieldMeta = vocabulary.fields[cleanId];
                const isPii = fieldMeta?.pii;
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-sm font-mono ${
                      isPii ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {cleanId}
                    {isPii && <span className="ml-1 text-xs opacity-75">(PII)</span>}
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* THEN row */}
      {hasOutputs && (
        <div
          className="flex items-start gap-2 py-1.5 border-t border-gray-100"
          data-testid="rule-then"
        >
          <span className="text-xs font-bold text-green-600 uppercase w-14 shrink-0 pt-0.5">
            Then
          </span>
          <div className="flex flex-wrap gap-1">
            {control.outputs
              .filter((o) => o)
              .map((out, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-sm font-mono"
                >
                  {out}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* LOG row */}
      {hasAuditLogs && (
        <div
          className="flex items-start gap-2 py-1.5 border-t border-gray-100"
          data-testid="rule-log"
        >
          <span className="text-xs font-bold text-gray-500 uppercase w-14 shrink-0 pt-0.5">
            Log
          </span>
          <div className="flex flex-wrap gap-1">
            {control.audit_logs
              .filter((l) => l)
              .map((log, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-sm font-mono"
                >
                  {log}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* DO row */}
      {hasBehavior && (
        <div
          className="flex items-start gap-2 py-1.5 border-t border-gray-100"
          data-testid="rule-do"
        >
          <span className="text-xs font-bold text-indigo-600 uppercase w-14 shrink-0 pt-0.5">
            Do
          </span>
          <p className="text-sm text-gray-700 line-clamp-2">{control.system_behavior}</p>
        </div>
      )}
    </div>
  );
}
