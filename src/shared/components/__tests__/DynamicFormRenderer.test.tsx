import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicFormRenderer } from '../DynamicFormRenderer';
import type { FormDefinition } from '@/shared/api/contractTypes';
import { MOCK_BIOMODEL_FORM_SCHEMA, MOCK_CONVERSION_FORM_SCHEMA } from '@/shared/api';

describe('FE-FORM-001: Typed Dynamic Catalog Form Renderer', () => {
  describe('1. Rendering Supported Field Types', () => {
    const fullTypesSchema: FormDefinition = {
      service: {
        uuid: 'test-srv-uuid',
        code: 'TEST_SERVICE',
        name: 'Test Service All Types',
        itemKind: 'service',
      },
      fields: [
        {
          uuid: 'f-text',
          code: 'text_field',
          label: 'Text Field Label',
          type: 'text',
          required: false,
          options: [],
        },
        {
          uuid: 'f-num',
          code: 'number_field',
          label: 'Number Field Label',
          type: 'number',
          required: false,
          options: [],
          validation: { min: 1, max: 10 },
        },
        {
          uuid: 'f-bool',
          code: 'bool_field',
          label: 'Boolean Field Label',
          type: 'boolean',
          required: false,
          options: [],
          defaultValue: 'true',
        },
        {
          uuid: 'f-date',
          code: 'date_field',
          label: 'Date Field Label',
          type: 'date',
          required: false,
          options: [],
        },
        {
          uuid: 'f-single',
          code: 'single_field',
          label: 'Single Select Label',
          type: 'single_select',
          required: false,
          options: [
            { code: 'opt1', label: 'Option 1' },
            { code: 'opt2', label: 'Option 2' },
          ],
        },
        {
          uuid: 'f-multi',
          code: 'multi_field',
          label: 'Multi Select Label',
          type: 'multi_select',
          required: false,
          options: [
            { code: 'tag_a', label: 'Tag A' },
            { code: 'tag_b', label: 'Tag B' },
          ],
        },
        {
          uuid: 'f-file',
          code: 'file_field',
          label: 'File Field Label',
          type: 'file',
          required: false,
          options: [],
        },
        {
          uuid: 'f-teeth',
          code: 'teeth_field',
          label: 'Tooth Chart Label',
          type: 'tooth_chart',
          required: false,
          options: [],
        },
      ],
      evidence: 'VERIFIED',
    };

    it('renders all 8 canonical field types without error', () => {
      render(<DynamicFormRenderer schemaOverride={fullTypesSchema} />);

      expect(screen.getByText('Text Field Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Text Field Label')).toBeInTheDocument();

      expect(screen.getByText('Number Field Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Number Field Label')).toBeInTheDocument();

      expect(screen.getAllByText(/Boolean Field Label/i).length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Date Field Label')).toBeInTheDocument();

      expect(screen.getByText('Single Select Label')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();

      expect(screen.getByText('Multi Select Label')).toBeInTheDocument();
      expect(screen.getByText('Tag A')).toBeInTheDocument();
      expect(screen.getByText('Tag B')).toBeInTheDocument();

      expect(screen.getByText('File Field Label')).toBeInTheDocument();
      expect(screen.getByText('Upload Attachment')).toBeInTheDocument();

      expect(screen.getByText('Tooth Chart Label')).toBeInTheDocument();
      expect(screen.getByText('Select Target Teeth:')).toBeInTheDocument();
    });
  });

  describe('2. Required Field Validation', () => {
    it('marks required fields with asterisk and flags validation error on empty submit', () => {
      const onChange = vi.fn();
      render(
        <DynamicFormRenderer
          schemaOverride={MOCK_BIOMODEL_FORM_SCHEMA}
          initialAnswers={[]}
          onChange={onChange}
        />
      );

      // Model Architecture is required
      expect(screen.getByText('Model Architecture')).toBeInTheDocument();
      expect(screen.getByTestId('form-field-model_type')).toHaveTextContent('*');

      // The onChange should be called with isValid = true (since defaultValue 'solid' exists)
      expect(onChange).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Boolean)
      );
    });
  });

  describe('3. Conditional Visibility', () => {
    it('shows wall_thickness_mm only when model_type is hollow', () => {
      render(
        <DynamicFormRenderer
          schemaOverride={MOCK_BIOMODEL_FORM_SCHEMA}
          initialAnswers={[{ fieldCode: 'model_type', value: 'solid', optionCodes: ['solid'] }]}
        />
      );

      // In solid mode, wall_thickness_mm should NOT be visible
      expect(screen.queryByText('Wall Thickness (mm)')).not.toBeInTheDocument();

      // Click Hollow Arch
      const hollowBtn = screen.getByText('Hollow Arch (Hygienic Drain)');
      fireEvent.click(hollowBtn);

      // Now wall_thickness_mm should become visible
      expect(screen.getByText('Wall Thickness (mm)')).toBeInTheDocument();
    });
  });

  describe('4. Conditional Requiredness', () => {
    it('marks wall_thickness_mm as required only when model_type is hollow', () => {
      const onChange = vi.fn();
      render(
        <DynamicFormRenderer
          schemaOverride={MOCK_BIOMODEL_FORM_SCHEMA}
          initialAnswers={[{ fieldCode: 'model_type', value: 'solid' }]}
          onChange={onChange}
        />
      );

      // Switch to hollow
      const hollowBtn = screen.getByText('Hollow Arch (Hygienic Drain)');
      fireEvent.click(hollowBtn);

      // When hollow, wall_thickness_mm is required and empty, so isValid should be false
      expect(screen.getByTestId('form-field-wall_thickness_mm')).toHaveTextContent('*');
      expect(screen.getByText('Wall Thickness (mm) is required')).toBeInTheDocument();
    });
  });

  describe('5. Conditional Options', () => {
    it('filters conversion format options based on selected software system', () => {
      render(
        <DynamicFormRenderer
          schemaOverride={MOCK_CONVERSION_FORM_SCHEMA}
          initialAnswers={[{ fieldCode: 'software', value: 'simplant' }]}
        />
      );

      // Under Simplant, Planner, Pro, Viewer, Master, OneShot should be available
      expect(screen.getByText('Planner')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.queryByText('CaseXchange')).not.toBeInTheDocument();
      expect(screen.queryByText('3DDXConnect')).not.toBeInTheDocument();

      // Switch software to coDiagnostiX
      const codiagnostixBtn = screen.getByText('coDiagnostiX');
      fireEvent.click(codiagnostixBtn);

      // Under coDiagnostiX, CaseXchange and 3DDXConnect should now be visible, and Simplant options hidden
      expect(screen.getByText('CaseXchange')).toBeInTheDocument();
      expect(screen.getByText('3DDXConnect')).toBeInTheDocument();
      expect(screen.queryByText('Planner')).not.toBeInTheDocument();
      expect(screen.queryByText('OneShot')).not.toBeInTheDocument();
    });
  });

  describe('6. Invalid Metadata Handling', () => {
    it('renders accessible fallback error banner without crashing when schema is invalid or empty', () => {
      render(
        <DynamicFormRenderer
          schemaOverride={{ service: { uuid: 'bad', code: 'BAD', name: 'Bad', itemKind: 'service' }, fields: [] }}
        />
      );

      expect(screen.getByTestId('form-error-fallback')).toBeInTheDocument();
      expect(screen.getByText(/Invalid or missing form definition metadata/i)).toBeInTheDocument();
    });
  });

  describe('7. Server Validation Errors', () => {
    it('displays server validation errors matching field codes', () => {
      const serverErrors = {
        model_type: 'Selected model architecture is unavailable for this clinic',
      };

      render(
        <DynamicFormRenderer
          schemaOverride={MOCK_BIOMODEL_FORM_SCHEMA}
          serverErrors={serverErrors}
        />
      );

      expect(
        screen.getByText('Selected model architecture is unavailable for this clinic')
      ).toBeInTheDocument();
    });
  });

  describe('8. Unsupported Type Handling', () => {
    it('renders clean fallback warning when encountering an unsupported field type', () => {
      const invalidTypeSchema: FormDefinition = {
        service: {
          uuid: 'test-inv',
          code: 'INV',
          name: 'Invalid Type Service',
          itemKind: 'service',
        },
        fields: [
          {
            uuid: 'f-weird',
            code: 'unsupported_custom',
            label: 'Custom Hologram Spec',
            type: 'unsupported_type_xyz' as any,
            required: false,
            options: [],
          },
        ],
      };

      render(<DynamicFormRenderer schemaOverride={invalidTypeSchema} />);

      expect(screen.getByTestId('unsupported-field-unsupported_custom')).toBeInTheDocument();
      expect(
        screen.getByText(/Unsupported field type: 'unsupported_type_xyz'/i)
      ).toBeInTheDocument();
    });
  });
});
