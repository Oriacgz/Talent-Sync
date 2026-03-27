import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-fade animate-[fade-in_180ms_ease]">
      {children}
    </div>
  );
}
