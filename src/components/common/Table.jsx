export default function Table({ headers = [], children, className = '' }) {
    return (
        <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function TableRow({ children, className = '', onClick }) {
    return (
        <tr
            onClick={onClick}
            className={`group transition-colors hover:bg-emerald-50/30 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </tr>
    );
}

export function TableCell({ children, className = '' }) {
    return (
        <td className={`px-6 py-4 text-slate-600 ${className}`}>
            {children}
        </td>
    );
}
