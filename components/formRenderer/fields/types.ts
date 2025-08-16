// Visibility rules
export type VisibleWhenOp =
  | { key: string; equals: unknown }
  | { key: string; notEquals: unknown };

export type VisibleWhen = {
  all?: VisibleWhenOp[];
  any?: VisibleWhenOp[];
};

// Common field props
type FieldBase<TType extends string> = {
  type: TType;
  label: string;
  key: string;
  required?: boolean;
  visibleWhen?: VisibleWhen;
};

// Helpers
export type SelectOption = { label: string; value: string };
type PrimitiveFieldTypes =
  | 'text'
  | 'date'
  | 'photo'
  | 'signature'
  | 'time'
  | 'datetime'
  | 'barcode'
  | 'imageSelect';

// ✅ Make PrimitiveField a *union of* FieldBase<'text'> | FieldBase<'date'> | ...
type PrimitiveField =
  { [K in PrimitiveFieldTypes]: FieldBase<K> }[PrimitiveFieldTypes];

// ✅ Same for number/decimal so Extract<FormField, { type: 'number' }> works
type NumberField = FieldBase<'number'> | FieldBase<'decimal'>;

type BooleanField = FieldBase<'boolean'>;

type CurrencyField = FieldBase<'currency'> & {
  currencySymbol?: string;
};

type SelectField = FieldBase<'select'> & {
  options: string[] | SelectOption[];
};

type MultiSelectField = FieldBase<'multiselect'> & {
  options: string[] | SelectOption[];
};

type SectionField = {
  type: 'section';
  key: string;
  label: string;
  repeatable?: boolean;
  useModal?: boolean;
  fields: FormField[];
  visibleWhen?: VisibleWhen;
};

export type FormField =
  | PrimitiveField
  | BooleanField
  | NumberField
  | CurrencyField
  | SelectField
  | MultiSelectField
  | SectionField;

export type FormSection = {
  key: string;
  label: string;
  repeatable?: boolean;
  useModal?: boolean;
  fields: FormField[];
};

export type FormSchema = FormSection[];
