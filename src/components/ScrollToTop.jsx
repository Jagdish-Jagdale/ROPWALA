import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Immediate scroll attempts
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
        document.body.scrollTo(0, 0);

        // Delayed scroll to handle render updates
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
            document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }, 0);

        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
