import React, { useEffect, useState, useMemo } from 'react';
import { catalogClient, isFieldVisible, isFieldRequired } from '@/shared/api';
import type { FormDefinition, FormAnswer, FormField } from '@/shared/api/contractTypes';
import { Layers, AlertCircle, CheckCircle2, Sliders, Info } from 'lucide-react';

interface DynamicFormRendererProps {
  serviceUuid: string;
  initialAnswers?: FormAnswer[];
  onChange?: (answers: FormAnswer[], isValid: boolean) => void;
  readOnly?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  serviceUuid,
  initialAnswers = [],
  onChange,
  readOnly = false,
}) => {
  const [schema, setSchema] = useState<FormDefinition | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Map of fieldCode -> value
  const [values, setValues] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    for (const a of initialAnswers) {
      map[a.fieldCode] = a.value !== undefined ? a.value : (a.optionCodes?.[0] || '');
    }
    return map;
  });

  // Load form schema whenever serviceUuid changes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    catalogClient
      .getFormSchema(serviceUuid)
      .then((def) => {
        if (!mounted) return;
        setSchema(def);

        // Prepopulate defaults if not set in values
        setValues((prev) => {
          const next = { ...prev };
          for (const f of def.fields) {
            if (next[f.code] === undefined && f.defaultValue !== undefined) {
              next[f.code] = f.defaultValue;
            }
          }
          return next;
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || 'Failed to load dynamic form schema');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [serviceUuid]);

  // Compute visibility and requiredness
  const visibleFields = useMemo(() => {
    if (!schema?.fields) return [];
    return schema.fields.filter((f) => isFieldVisible(f, values));
  }, [schema, values]);

  // Check validation
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const f of visibleFields) {
      const isReq = isFieldRequired(f, values);
      const val = values[f.code];
      if (isReq && (val === undefined || val === null || val === '')) {
        errors[f.code] = `${f.label} is required`;
      }
    }
    return errors;
  }, [visibleFields, values]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Propagate answers to parent
  useEffect(() => {
    if (!onChange || !schema) return;
    const answers: FormAnswer[] = visibleFields.map((f) => {
      const val = values[f.code];
      const isChoice = f.type === 'single_select' || f.type === 'multi_select' || f.options;
      return {
        fieldCode: f.code,
        value: val,
        optionCodes: isChoice && val ? [String(val)] : undefined,
      };
    });
    onChange(answers, isValid);
  }, [values, visibleFields, isValid, onChange, schema]);

  const handleFieldChange = (fieldCode: string, newVal: any) => {
    if (readOnly) return;
    setValues((prev) => ({
      ...prev,
      [fieldCode]: newVal,
    }));
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <span>Loading OpenAPI dynamic form definition (GET /catalog/services/{serviceUuid}/form-schema)...</span>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
        <AlertCircle size={15} className="shrink-0" />
        <span>Dynamic Form: Using standard clinical specifications. ({error || 'Default fields active'})</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Clinical Specifications ({schema.service?.code || 'SERVICE'})
          </span>
        </div>

      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        Clinical parameters for the selected service:
      </p>

      {/* Dynamic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {visibleFields.map((field) => {
          const req = isFieldRequired(field, values);
          const currentVal = values[field.code];
          const hasError = Boolean(validationErrors[field.code]);

          return (
            <div key={field.code} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                  {field.label} {req && <span className="text-rose-500">*</span>}
                </label>
                <span className="text-[9px] font-mono text-slate-400">{field.code}</span>
              </div>

              {/* Single Select / Options */}
              {field.options && field.options.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {field.options.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleFieldChange(field.code, opt.code)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        currentVal === opt.code
                          ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <div className="truncate text-xs">{opt.label}</div>
                    </button>
                  ))}
                </div>
              ) : field.type === 'boolean' ? (
                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={Boolean(currentVal)}
                    onChange={(e) => handleFieldChange(field.code, e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {field.label}
                  </span>
                </label>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  step="0.1"
                  disabled={readOnly}
                  value={currentVal !== undefined ? currentVal : ''}
                  onChange={(e) => handleFieldChange(field.code, parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                    hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder={`Enter ${field.label}`}
                />
              ) : (
                <input
                  type="text"
                  disabled={readOnly}
                  value={currentVal !== undefined ? currentVal : ''}
                  onChange={(e) => handleFieldChange(field.code, e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                    hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder={`Enter ${field.label}`}
                />
              )}

              {hasError && (
                <p className="text-[10px] text-rose-500 font-medium">{validationErrors[field.code]}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
