import { Input } from '@cuan/ui';

type AuthFormFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
};

export function AuthFormField({ id, label, type, placeholder, value, onChange, required }: AuthFormFieldProps) {
  return (
    <div className='grid gap-2'>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type={type ?? 'text'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
