import { useState } from "react";
import PinEntry from "./PinEntry";

// Module-level auth state - persists during navigation but resets on page refresh
let cachedAuth = false;

export default function ProtectedTimerRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(cachedAuth);

  const handleSuccess = () => {
    cachedAuth = true; // Cache for navigation between timer pages
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <PinEntry onSuccess={handleSuccess} />;
  }

  return children;
}
