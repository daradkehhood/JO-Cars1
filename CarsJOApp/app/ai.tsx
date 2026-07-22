import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

export default function AIScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'مرحباً! أنا مساعد JO Cars الذكي. كيف يمكنني مساعدتك اليوم؟\n\nيمكنني مساعدتك في:\n- تقدير سعر سيارة\n- البحث عن سيارة مناسبة\n- نصائح الشراء\n- مقارنة السيارات' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const quickActions = [
    { label: 'تقدير سعر سيارة', icon: 'cash' },
    { label: 'uggest سيارة عائلية', icon: 'car' },
    { label: 'نصائح شراء مستعمل', icon: 'bulb' },
    { label: 'مقارنة موديلات', icon: 'git-compare' },
  ];

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await api.aiChat(msg);
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.data?.response || res.response || 'عذراً، لم أتمكن من فهم سؤالك.' };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <Text className="text-lg font-bold text-gray-900 dark:text-white">المساعد الذكي</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView ref={scrollRef} className="flex-1 px-4 py-3" contentContainerStyle={{ paddingBottom: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map(msg => (
            <View key={msg.id} className={`mb-3 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
              {msg.role === 'assistant' && (
                <View className="flex-row items-center gap-1 mb-1">
                  <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center"><Ionicons name="sparkles" size={10} color="#fff" /></View>
                  <Text className="text-xs text-blue-600 font-medium">JO Cars AI</Text>
                </View>
              )}
              <View className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'}`}>
                <Text className={`text-base leading-6 ${msg.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{msg.content}</Text>
              </View>
            </View>
          ))}
          {loading && (
            <View className="self-start mb-3">
              <View className="flex-row items-center gap-1 mb-1">
                <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center"><Ionicons name="sparkles" size={10} color="#fff" /></View>
                <Text className="text-xs text-blue-600 font-medium">JO Cars AI</Text>
              </View>
              <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <Text className="text-gray-400 animate-pulse">...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {messages.length <= 1 && (
          <View className="px-4 pb-3">
            <View className="flex-row flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <TouchableOpacity key={i} onPress={() => sendMessage(action.label)} className="bg-blue-50 dark:bg-blue-500/10 px-3 py-2 rounded-xl flex-row items-center gap-1.5">
                  <Ionicons name={action.icon as any} size={14} color="#3B82F6" />
                  <Text className="text-sm text-blue-600 dark:text-blue-400 font-medium">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
            <TextInput value={input} onChangeText={setInput} placeholder="اكتب رسالتك..." placeholderTextColor="#9CA3AF" className="flex-1 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} multiline />
            <TouchableOpacity onPress={() => sendMessage()} disabled={!input.trim() || loading} className={`w-9 h-9 rounded-full items-center justify-center ${input.trim() && !loading ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
