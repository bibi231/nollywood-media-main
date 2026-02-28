import React from 'react';
import { Award, Zap, Star, Shield, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export type AchievementType = 'Early Adopter' | 'Top Commenter' | 'Nollywood Scholar' | 'Verified' | string;

interface UserBadgeProps {
    type: AchievementType;
    isVerified?: boolean;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ type, isVerified }) => {
    if (isVerified && type === 'Verified') {
        return (
            <div
                className="inline-flex items-center justify-center ml-1 text-blue-500 hover:text-blue-400 transition-colors"
                title="Verified Creator"
            >
                <CheckCircle2 className="w-4 h-4" />
            </div>
        );
    }

    const getBadgeStyle = (achievement: string) => {
        switch (achievement) {
            case 'Early Adopter':
                return {
                    icon: <Zap className="w-3 h-3 text-yellow-400" />,
                    bg: 'bg-yellow-400/10',
                    text: 'text-yellow-400',
                    border: 'border-yellow-400/20'
                };
            case 'Top Commenter':
                return {
                    icon: <Award className="w-3 h-3 text-purple-400" />,
                    bg: 'bg-purple-400/10',
                    text: 'text-purple-400',
                    border: 'border-purple-400/20'
                };
            case 'Nollywood Scholar':
                return {
                    icon: <Star className="w-3 h-3 text-emerald-400" />,
                    bg: 'bg-emerald-400/10',
                    text: 'text-emerald-400',
                    border: 'border-emerald-400/20'
                };
            case 'Staff':
                return {
                    icon: <Shield className="w-3 h-3 text-red-500" />,
                    bg: 'bg-red-500/10',
                    text: 'text-red-500',
                    border: 'border-red-500/20'
                };
            default:
                return {
                    icon: <HelpCircle className="w-3 h-3 text-gray-400" />,
                    bg: 'bg-gray-800',
                    text: 'text-gray-400',
                    border: 'border-gray-700'
                };
        }
    };

    const style = getBadgeStyle(type);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wide uppercase ml-2 ${style.bg} ${style.text} ${style.border}`}
            title={type}
        >
            {style.icon}
            <span>{type}</span>
        </motion.div>
    );
};
