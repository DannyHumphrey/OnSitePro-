import React, { createContext, useContext, useState } from 'react';

export type FormCounts = {
  inbox: number;
  drafts: number;
  outbox: number;
  sent: number;
};

export type FormCountsContextValue = {
  counts: FormCounts;
  setCounts: React.Dispatch<React.SetStateAction<FormCounts>>;
};

const FormCountsContext = createContext<FormCountsContextValue | undefined>(undefined);

export function FormCountsProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<FormCounts>({ inbox: 0, drafts: 0, outbox: 0, sent: 0 });
  return (
    <FormCountsContext.Provider value={{ counts, setCounts }}>
      {children}
    </FormCountsContext.Provider>
  );
}

export function useFormCounts() {
  const ctx = useContext(FormCountsContext);
  if (!ctx) {
    throw new Error('useFormCounts must be used within FormCountsProvider');
  }
  return ctx;
}
