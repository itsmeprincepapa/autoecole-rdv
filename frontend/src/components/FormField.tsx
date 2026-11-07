import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Champ de formulaire avec son libellé (le label est relié au champ pour l'accessibilité)
export default function FormField({ label, id, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name;
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={fieldId}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        {...props}
      />
    </div>
  );
}