import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Champ de formulaire avec son libellé (le label est relié au champ pour l'accessibilité)
// Pour un mot de passe, un bouton permet d'afficher ou de masquer la saisie
export default function FormField({ label, id, type, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name;
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={fieldId}
          type={isPassword && visible ? 'text' : type}
          className={`w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 transition placeholder:text-slate-400 focus:border-navy focus:bg-white focus:outline-none focus:ring-4 focus:ring-navy/10 ${
            isPassword ? 'pr-12' : ''
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-navy focus:outline-none focus-visible:text-navy"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {visible ? (
                <>
                  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                  <path d="m2 2 20 20" />
                </>
              ) : (
                <>
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}