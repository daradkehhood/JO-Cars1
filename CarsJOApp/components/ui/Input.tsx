import React from 'react';
import { TextInput, View, Text, ViewStyle } from 'react-native';
import { cn } from '../../lib/utils';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  editable?: boolean;
  maxLength?: number;
  textAlignVertical?: 'auto' | 'center' | 'top';
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  icon,
  style,
  editable = true,
  maxLength,
  textAlignVertical,
}: InputProps) {
  return (
    <View className="mb-4" style={style}>
      {label && (
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </Text>
      )}
      <View className="relative">
        {icon && (
          <View className="absolute right-3 top-3.5 z-10">
            {icon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          textAlignVertical={textAlignVertical || (multiline ? 'top' : 'center')}
          className={cn(
            'bg-white dark:bg-gray-800 border rounded-xl px-4 min-h-[52px] text-base text-gray-900 dark:text-white',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-200 dark:border-gray-700 focus:border-blue-500',
            icon ? 'pr-11' : '',
            multiline ? 'py-3' : ''
          )}
          style={{ fontSize: 16 }}
        />
      </View>
      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}
    </View>
  );
}
