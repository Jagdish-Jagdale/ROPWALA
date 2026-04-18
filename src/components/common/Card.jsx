export default function Card({ children, className = '', title, action }) {
    return (
        <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
            {(title || action) && (
                <div className="mb-4 flex items-center justify-between">
                    {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div>{children}</div>
        </div>
    );
}
