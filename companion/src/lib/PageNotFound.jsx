import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    // Crawlers get a real 404 once the route has resolved.
    useEffect(() => {
        const meta = document.createElement('meta');
        meta.name = 'prerender-status-code';
        meta.content = '404';
        document.head.appendChild(meta);
        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0b0e14] text-[#e9edf2] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#161b22] border border-[#ff6b6b] flex items-center justify-center mx-auto text-2xl font-mono font-bold text-[#ff6b6b]">
                    404
                </div>
                <h1 className="text-3xl font-extrabold text-white">404 — Off the table</h1>
                <p className="text-sm text-[#aeb8c4]">
                    The page <code className="font-mono text-white">&quot;{pageName}&quot;</code> could not be found.
                    Maybe it hasn&apos;t been synthesized yet.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Link
                        to="/"
                        className="px-4 py-2 rounded-lg bg-[#4f9dff] text-[#07121f] font-semibold text-xs sm:text-sm no-underline"
                    >
                        ← Back to the periodic table
                    </Link>
                    <Link
                        to="/elements"
                        className="px-4 py-2 rounded-lg bg-[#1c232d] border border-[#2a323d] text-white text-xs sm:text-sm no-underline hover:border-[#4f9dff]"
                    >
                        Browse all 118 elements
                    </Link>
                </div>
            </div>
        </div>
    );
}