import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { cn } from '../../lib/utils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const baseStyle = 'rounded-xl font-semibold items-center justify-center flex-row gap-2';

  const sizeStyles = {
    sm: 'px-4 py-2.5 min-h-[40px]',
    md: 'px-6 py-3.5 min-h-[48px]',
    lg: 'px-8 py-4 min-h-[52px]',
  };

  const variantStyles = {
    primary: 'bg-blue-600 shadow-lg shadow-blue-600/25',
    secondary: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent',
    danger: 'bg-red-600 shadow-lg shadow-red-600/25',
    outline: 'bg-transparent border-2 border-blue-600',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-gray-700 dark:text-gray-300',
    ghost: 'text-blue-600',
    danger: 'text-white',
    outline: 'text-blue-600',
  };

  const sizeText = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={cn(
        baseStyle,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50'
      )}
      style={style}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#3B82F6'} size="small" />
      ) : icon ? (
        icon
      ) : null}
      <Text
        className={cn(
          'font-semibold',
          textStyles[variant],
          sizeText[size]
        )}
        style={textStyle}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
