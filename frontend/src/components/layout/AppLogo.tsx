export default function AppLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="30" fill="#d4e3ce" />
      <g stroke="#a5b99e" strokeWidth="1.5">
        <line x1="38" y1="38" x2="62" y2="62" />
        <line x1="62" y1="38" x2="38" y2="62" />
      </g>
      <g fill="#8ba284">
        <circle cx="38" cy="38" r="3" />
        <circle cx="62" cy="38" r="3" />
        <circle cx="38" cy="62" r="3" />
        <circle cx="62" cy="62" r="3" />
        <circle cx="50" cy="38" r="3" />
        <circle cx="50" cy="62" r="3" />
        <circle cx="38" cy="50" r="3" />
        <circle cx="62" cy="50" r="3" />
      </g>
      <circle cx="50" cy="50" r="4.5" fill="#4f6f4d" />
    </svg>
  );
}
