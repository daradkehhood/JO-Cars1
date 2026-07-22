import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantStyles = {
  primary: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400',
  success: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400',
  warning: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400',
  info: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400',
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export default function Badge({ children, variant = 'default', size = 'sm', style }: BadgeProps) {
  return (
    <View
      className={cn(
        'rounded-full self-start',
        variantStyles[variant],
        sizeStyles[size]
      )}
      style={style}
    >
      <Text className={cn('font-medium', variantStyles[variant].split(' ').slice(-1)[0])}>
        {children}
      </Text>
    </View>
  );
}
