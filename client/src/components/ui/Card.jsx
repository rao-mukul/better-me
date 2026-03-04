export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-navy-800/60 backdrop-blur-sm border border-navy-700/50 rounded-2xl p-4 ${className}`}
    >
      {children}
    </div>
  );
}
