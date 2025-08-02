export type VisibleWhenCondition =
  | { key: string; equals: any }
  | { key: string; notEquals: any };

export type VisibleWhen = {
  all?: VisibleWhenCondition[];
  any?: VisibleWhenCondition[];
};

export type FormField =
  | {
      type:
        | 'text'
        | 'date'
        | 'photo'
        | 'signature'
        | 'time'
        | 'datetime'
        | 'barcode'
        | 'imageSelect';
      label: string;
      key: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'boolean';
      label: string;
      key: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'number' | 'decimal';
      label: string;
      key: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'currency';
      label: string;
      key: string;
      currencySymbol?: string;
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'select';
      label: string;
      key: string;
      options: { label: string; value: string }[];
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'multiselect';
      label: string;
      key: string;
      options: string[] | { label: string; value: string }[];
      required?: boolean;
      visibleWhen?: VisibleWhen;
    }
  | {
      type: 'section';
      key: string;
      label: string;
      repeatable?: boolean;
      useModal?: boolean;
      fields: FormField[];
      visibleWhen?: VisibleWhen;
    };

export type FormSection = {
  key: string;
  label: string;
  repeatable?: boolean;
  useModal?: boolean;
  fields: FormField[];
};

export type FormSchema = FormSection[];
