'use client';

import { Input, Label } from '@illajwala/ui';

type PolicyFormFieldProps = {
  id: string;
  label: string;
  type?: 'number' | 'text';
  value: number;
  min?: number;
  max?: number;
  description: string;
  onChange: (value: number) => void;
};

export const PolicyFormField = ({
  id,
  label,
  type = 'number',
  value,
  min,
  max,
  description,
  onChange,
}: PolicyFormFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};
