'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';

type Props = {
  defaultValue: 'services' | 'software';
};

export function TypeSelect({ defaultValue }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const handleChange = (value: string) => {
    const next = new URLSearchParams(Array.from(params.entries()));

    if (value === 'services') {
      next.delete('type');
    } else {
      next.set('type', 'software');
    }

    const query = next.toString();
    router.push(query ? `/?${query}` : '/');
  };

  return (
    <Select defaultValue={defaultValue} onValueChange={handleChange}>
      <SelectTrigger className={'w-44'}>
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value={'services'}>Services</SelectItem>
        <SelectItem value={'software'}>Software</SelectItem>
      </SelectContent>
    </Select>
  );
}




