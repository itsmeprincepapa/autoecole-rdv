// Marque de l'auto-école : une ligne médiane de route sur fond bitume
export default function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#151c26" />
      <path
        d="M16 5v4M16 14v4M16 23v4"
        stroke="#ffc21a"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}