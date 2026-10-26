import React, { useEffect, useState, useMemo } from 'react';
import { catalogClient, isFieldVisible, isFieldRequired, getFieldOptions } from '@/shared/api';
import type { FormDefinition, FormAnswer, FormField } from '@/shared/api/contractTypes';
import { Sliders, AlertCircle, Upload, Calendar, CheckSquare, Square } from 'lucide-react';

export interface DynamicFormRendererProps {
  serviceUuid?: string;
  schemaOverride?: FormDefinition | null;
  initialAnswers?: FormAnswer[];
  serverErrors?: Record<string, string>;
  onChange?: (answers: FormAnswer[], isValid: boolean) => void;
  readOnly?: boolean;
}

const SUPPORTED_CANONICAL_TYPES = new Set([
  'text',
  'number',
  'boolean',
  'date',
  'single_select',
  'multi_select',
  'file',
  'tooth_chart',
]);

// Standard FDI / ISO Dental Chart notation for tooth_chart selector
const DENTAL_TEETH_ISO = [
  '18', '17', '16', '15', '14', '13', '12', '11',
  '21', '22', '23', '24', '25', '26', '27', '28',
  '48', '47', '46', '45', '44', '43', '42', '41',
  '31', '32', '33', '34', '35', '36', '37', '38',
];

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  serviceUuid,
  schemaOverride,
  initialAnswers = [],
  serverErrors = {},
  onChange,
  readOnly = false,
}) => {
  const [schema, setSchema] = useState<FormDefinition | null>(schemaOverride || null);
  const [loading, setLoading] = useState<boolean>(!schemaOverride && Boolean(serviceUuid));
  const [error, setError] = useState<string | null>(null);

  // Map of fieldCode -> value
  const [values, setValues] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    for (const a of initialAnswers) {
      if (a.value !== undefined) {
        map[a.fieldCode] = a.value;
      } else if (a.optionCodes && a.optionCodes.length > 0) {
        map[a.fieldCode] = a.optionCodes.length === 1 ? a.optionCodes[0] : a.optionCodes;
      } else if (a.optionCode) {
        map[a.fieldCode] = a.optionCode;
      } else if (a.valueText !== undefined) {
        map[a.fieldCode] = a.valueText;
      } else if (a.valueNumber !== undefined) {
        map[a.fieldCode] = a.valueNumber;
      } else if (a.valueBoolean !== undefined) {
        map[a.fieldCode] = a.valueBoolean;
      } else if (a.valueDate !== undefined) {
        map[a.fieldCode] = a.valueDate;
      }
    }
    return map;
  });

  // Load form schema if schemaOverride is not provided
  useEffect(() => {
    if (schemaOverride !== undefined) {
      setSchema(schemaOverride);
      setLoading(false);
      return;
    }

    if (!serviceUuid) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    catalogClient
      .getFormSchema(serviceUuid)
      .then((def) => {
        if (!mounted) return;
        setSchema(def);

        // Prepopulate defaults if not set
        setValues((prev) => {
          const next = { ...prev };
          if (def && Array.isArray(def.fields)) {
            for (const f of def.fields) {
              if (next[f.code] === undefined && f.defaultValue !== undefined && f.defaultValue !== null) {
                if (f.type === 'boolean') {
                  next[f.code] = String(f.defaultValue).toLowerCase() === 'true';
                } else if (f.type === 'number') {
                  next[f.code] = Number(f.defaultValue);
                } else {
                  next[f.code] = f.defaultValue;
                }
              }
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
  }, [serviceUuid, schemaOverride]);

  // Compute visible fields
  const visibleFields = useMemo(() => {
    if (!schema || !Array.isArray(schema.fields)) return [];
    return schema.fields.filter((f) => isFieldVisible(f, values));
  }, [schema, values]);

  // Compute client validation errors
  const clientValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    for (const f of visibleFields) {
      const isReq = isFieldRequired(f, values);
      const val = values[f.code];

      if (isReq) {
        if (val === undefined || val === null || val === '') {
          errors[f.code] = `${f.label} is required`;
          continue;
        }
        if (Array.isArray(val) && val.length === 0) {
          errors[f.code] = `${f.label} is required`;
          continue;
        }
      }

      // Numeric bounds validation
      if (f.type === 'number' && val !== undefined && val !== null && val !== '') {
        const num = Number(val);
        if (isNaN(num)) {
          errors[f.code] = `${f.label} must be a valid number`;
        } else if (f.validation?.min !== undefined && num < f.validation.min) {
          errors[f.code] = `${f.label} must be at least ${f.validation.min}`;
        } else if (f.validation?.max !== undefined && num > f.validation.max) {
          errors[f.code] = `${f.label} must be at most ${f.validation.max}`;
        }
      }
    }
    return errors;
  }, [visibleFields, values]);

  // Merged client and server validation errors
  const activeErrors = useMemo(() => {
    return { ...clientValidationErrors, ...serverErrors };
  }, [clientValidationErrors, serverErrors]);

  const isValid = Object.keys(activeErrors).length === 0;

  // Propagate answers to parent
  useEffect(() => {
    if (!onChange || !schema || !Array.isArray(schema.fields)) return;

    const answers: FormAnswer[] = visibleFields.map((f) => {
      const val = values[f.code];
      const answer: FormAnswer = { fieldCode: f.code };

      if (f.type === 'single_select') {
        answer.value = val !== undefined ? String(val) : undefined;
        answer.optionCode = val !== undefined ? String(val) : undefined;
        answer.optionCodes = val !== undefined && val !== '' ? [String(val)] : [];
      } else if (f.type === 'multi_select') {
        const arr = Array.isArray(val) ? val.map(String) : val ? [String(val)] : [];
        answer.value = arr.join(',');
        answer.optionCodes = arr;
      } else if (f.type === 'boolean') {
        answer.value = Boolean(val);
        answer.valueBoolean = Boolean(val);
      } else if (f.type === 'number') {
        const num = val !== undefined && val !== '' ? Number(val) : undefined;
        answer.value = num;
        answer.valueNumber = num;
      } else if (f.type === 'date') {
        answer.value = val ? String(val) : undefined;
        answer.valueDate = val ? String(val) : undefined;
      } else {
        answer.value = val !== undefined ? String(val) : undefined;
        answer.valueText = val !== undefined ? String(val) : undefined;
      }

      return answer;
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

  const toggleMultiSelectOption = (fieldCode: string, optCode: string) => {
    if (readOnly) return;
    setValues((prev) => {
      const currentList: string[] = Array.isArray(prev[fieldCode]) ? prev[fieldCode] : [];
      const exists = currentList.includes(optCode);
      const nextList = exists ? currentList.filter((c) => c !== optCode) : [...currentList, optCode];
      return {
        ...prev,
        [fieldCode]: nextList,
      };
    });
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 flex items-center gap-2">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <span>Loading OpenAPI dynamic form definition...</span>
      </div>
    );
  }

  // Handle Invalid or Missing Form Metadata
  if (error || !schema || !Array.isArray(schema.fields) || schema.fields.length === 0) {
    return (
      <div
        data-testid="form-error-fallback"
        className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2"
      >
        <AlertCircle size={15} className="shrink-0" />
        <span>
          {error || 'Invalid or missing form definition metadata. Standard clinical parameters active.'}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="dynamic-form-container"
      className="p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 space-y-4 text-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            Clinical Specifications ({schema.service?.code || 'SERVICE'})
          </span>
        </div>
        {schema.evidence && (
          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-950/30 px-2 py-0.5 rounded">
            Contract Validated
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400">
        Clinical parameters conforming to OpenAPI 3.0 dynamic catalog specification:
      </p>

      {/* Dynamic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {visibleFields.map((field) => {
          const req = isFieldRequired(field, values);
          const currentVal = values[field.code];
          const fieldError = activeErrors[field.code];
          const hasError = Boolean(fieldError);
          const availableOptions = getFieldOptions(field, values);

          // 1. Check for Unsupported Field Types
          if (!SUPPORTED_CANONICAL_TYPES.has(field.type)) {
            return (
              <div
                key={field.code}
                data-testid={`unsupported-field-${field.code}`}
                className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs col-span-full"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle size={13} />
                  <span>Unsupported field type: &apos;{field.type}&apos; (Field: {field.code})</span>
                </div>
                <p className="text-[11px] mt-0.5 text-rose-600/80">
                  This field cannot be rendered by the canonical catalog form renderer.
                </p>
              </div>
            );
          }

          return (
            <div
              key={field.code}
              data-testid={`form-field-${field.code}`}
              className={`space-y-1.5 ${field.type === 'tooth_chart' ? 'col-span-full' : ''}`}
            >
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                  <span>{field.label}</span>
                  {req && <span className="text-rose-500 font-bold">*</span>}
                </label>
                <span className="text-[9px] font-mono text-slate-400">{field.code}</span>
              </div>

              {/* CANONICAL TYPE 1: single_select */}
              {field.type === 'single_select' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {availableOptions.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleFieldChange(field.code, opt.code)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        currentVal === opt.code
                          ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400'
                      }`}
                    >
                      <div className="truncate text-xs">{opt.label}</div>
                    </button>
                  ))}
                </div>
              ) : field.type === 'multi_select' ? (
                /* CANONICAL TYPE 2: multi_select */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {availableOptions.map((opt) => {
                    const isSelected = Array.isArray(currentVal) && currentVal.includes(opt.code);
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleMultiSelectOption(field.code, opt.code)}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-600/10 border-cyan-500 text-cyan-900 dark:text-cyan-200 font-bold'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400'
                        }`}
                      >
                        {isSelected ? <CheckSquare size={13} className="text-cyan-600" /> : <Square size={13} className="text-slate-400" />}
                        <span className="truncate text-xs">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : field.type === 'boolean' ? (
                /* CANONICAL TYPE 3: boolean */
                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={readOnly}
                    checked={Boolean(currentVal)}
                    onChange={(e) => handleFieldChange(field.code, e.target.checked)}
                    className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {field.label} ({Boolean(currentVal) ? 'Yes' : 'No'})
                  </span>
                </label>
              ) : field.type === 'number' ? (
                /* CANONICAL TYPE 4: number */
                <div className="space-y-1">
                  <input
                    type="number"
                    step="0.1"
                    min={field.validation?.min}
                    max={field.validation?.max}
                    disabled={readOnly}
                    value={currentVal !== undefined && currentVal !== null ? currentVal : ''}
                    onChange={(e) => handleFieldChange(field.code, e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                      hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                    placeholder={`Enter ${field.label}`}
                  />
                  {field.validation && (field.validation.min !== undefined || field.validation.max !== undefined) && (
                    <span className="text-[10px] text-slate-400 block">
                      Permitted range: [{field.validation.min ?? '0'} – {field.validation.max ?? 'unbounded'}]
                    </span>
                  )}
                </div>
              ) : field.type === 'date' ? (
                /* CANONICAL TYPE 5: date */
                <div className="relative">
                  <input
                    type="date"
                    disabled={readOnly}
                    value={currentVal || ''}
                    onChange={(e) => handleFieldChange(field.code, e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                      hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  />
                  <Calendar size={13} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              ) : field.type === 'file' ? (
                /* CANONICAL TYPE 6: file */
                <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                    <Upload size={14} />
                    <span>Upload Attachment</span>
                    <input
                      type="file"
                      disabled={readOnly}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFieldChange(field.code, file.name);
                      }}
                    />
                  </label>
                  <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">
                    {currentVal ? String(currentVal) : 'No file selected'}
                  </span>
                </div>
              ) : field.type === 'tooth_chart' ? (
                /* CANONICAL TYPE 7: tooth_chart */
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Select Target Teeth:
                  </span>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                    {DENTAL_TEETH_ISO.map((tooth) => {
                      const selectedTeeth: string[] = Array.isArray(currentVal) ? currentVal : [];
                      const isSelected = selectedTeeth.includes(tooth);
                      return (
                        <button
                          key={tooth}
                          type="button"
                          disabled={readOnly}
                          onClick={() => {
                            const next = isSelected ? selectedTeeth.filter((t) => t !== tooth) : [...selectedTeeth, tooth];
                            handleFieldChange(field.code, next);
                          }}
                          className={`p-1 rounded text-center font-mono text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-600 text-white font-extrabold shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40'
                          }`}
                        >
                          {tooth}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Selected: {Array.isArray(currentVal) && currentVal.length > 0 ? currentVal.join(', ') : 'None'}
                  </div>
                </div>
              ) : (
                /* CANONICAL TYPE 8: text */
                <input
                  type="text"
                  disabled={readOnly}
                  value={currentVal !== undefined && currentVal !== null ? currentVal : ''}
                  onChange={(e) => handleFieldChange(field.code, e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${
                    hasError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder={`Enter ${field.label}`}
                />
              )}

              {/* Server or Client Validation Error */}
              {hasError && (
                <p data-testid={`field-error-${field.code}`} className="text-[10px] text-rose-500 font-medium">
                  {fieldError}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
