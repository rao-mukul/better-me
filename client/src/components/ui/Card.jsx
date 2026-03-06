import { forwardRef } from "react";

const Card = forwardRef(function Card({ children, className = "" }, ref) {
  return (
    <div
      ref={ref}
      className={`bg-navy-800/60 backdrop-blur-sm border border-navy-700/50 rounded-2xl p-4 ${className}`}
    >
      {children}
    </div>
  );
});

export default Card;
