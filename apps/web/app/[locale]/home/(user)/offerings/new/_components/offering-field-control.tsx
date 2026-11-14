'use client';

import { type ReactElement, cloneElement } from 'react';

import { useFormField } from '@kit/ui/form';

// Use the native label association. The shared FormControl points
// aria-labelledby at the control itself, which can hide the label.
export function OfferingFieldControl({
  render,
}: {
  render: ReactElement<{
    id?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }>;
}) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return cloneElement(render, {
    id: formItemId,
    'aria-describedby': error
      ? `${formDescriptionId} ${formMessageId}`
      : formDescriptionId,
    'aria-invalid': !!error,
  });
}
