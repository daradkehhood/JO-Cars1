import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, onPress, style, className: propClassName, noPadding }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className={cn(
          'bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm',
          !noPadding && 'p-4',
          propClassName
        )}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={cn(
        'bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm',
        !noPadding && 'p-4',
        propClassName
      )}
      style={style}
    >
      {children}
    </View>
  );
}

interface SectionProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

export function Section({ title, subtitle, action, onAction, children }: SectionProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3 px-1">
        <View>
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
          {subtitle && (
            <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</Text>
          )}
        </View>
        {action && onAction && (
          <TouchableOpacity onPress={onAction}>
            <Text className="text-blue-600 dark:text-blue-400 text-sm font-medium">{action}</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, action, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="mb-4 opacity-50">{icon}</View>
      <Text className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
        {title}
      </Text>
      {description && (
        <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">{description}</Text>
      )}
      {action && onAction && (
        <TouchableOpacity onPress={onAction} className="bg-blue-600 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
