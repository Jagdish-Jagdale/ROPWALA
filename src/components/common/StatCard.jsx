import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, variant = 'gray', change, isPositive, iconBg, iconColor, borderColor }) => {
    const variants = {
        gray: {
            iconBg: 'bg-gray-50',
            iconColor: 'text-gray-400',
            borderColor: 'border-l-gray-400',
            titleColor: 'text-gray-500'
        },
        green: {
            iconBg: 'bg-green-50',
            iconColor: 'text-green-600',
            borderColor: 'border-l-green-500',
            titleColor: 'text-green-600'
        },
        blue: {
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-l-blue-500',
            titleColor: 'text-blue-600'
        },
        red: {
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
            borderColor: 'border-l-red-500',
            titleColor: 'text-red-600'
        },
        amber: {
            iconBg: 'bg-orange-50',
            iconColor: 'text-orange-600',
            borderColor: 'border-l-orange-500',
            titleColor: 'text-orange-600'
        },
        purple: {
            iconBg: 'bg-purple-50',
            iconColor: 'text-purple-600',
            borderColor: 'border-l-purple-500',
            titleColor: 'text-purple-600'
        }
    };

    const currentVariant = variants[variant] || variants.gray;
    const finalIconBg = iconBg || currentVariant.iconBg;
    const finalIconColor = iconColor || currentVariant.iconColor;
    const finalBorderColor = borderColor || currentVariant.borderColor;
    const finalTitleColor = currentVariant.titleColor;

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-[4px] ${finalBorderColor} flex items-center justify-between hover:shadow-md transition-all relative overflow-hidden h-[90px]`}>
            <div className="flex flex-col justify-center">
                <p className={`text-[12px] font-bold mb-1 ${finalTitleColor}`}>
                    {title}
                </p>
                <h3 className="text-3xl font-extrabold text-gray-900 leading-none">
                    {value}
                </h3>

                {change !== undefined && (
                    <div className={`inline-flex items-center gap-1 text-[11px] font-bold mt-2 ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {change}%
                    </div>
                )}
            </div>

            <div className={`w-12 h-12 ${finalIconBg} rounded-full flex items-center justify-center ${finalIconColor} shrink-0 ml-4`}>
                {Icon && (
                    React.isValidElement(Icon) ? Icon : <Icon size={24} />
                )}
            </div>
        </div>
    );
};

export default StatCard;
