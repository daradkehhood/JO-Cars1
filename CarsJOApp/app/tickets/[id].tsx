import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Ticket, TicketMessage } from '../../types';
import { formatDate } from '../../lib/utils';
import LoadingScreen from '../../components/shared/Loading';

export default function TicketDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const loadTicket = async () => {
    if (!id) return;
    try { const res = await api.getTicket(id); setTicket(res.data || res); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTicket(); }, [id]);

  const handleReply = async () => {
    if (!reply.trim() || !id) return;
    setSending(true);
    try {
      await api.replyTicket(id, reply.trim());
      setReply('');
      loadTicket();
    } catch (error: any) { Alert.alert('خطأ', error.message || 'فشل الإرسال'); }
    finally { setSending(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!ticket) return <View className="flex-1 items-center justify-center"><Text>التذكرة غير موجودة</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{ticket.subject}</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
        <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
          <Text className="text-base text-gray-600 dark:text-gray-400 leading-6">{ticket.message}</Text>
          <Text className="text-xs text-gray-400 mt-2">{formatDate(ticket.createdAt)}</Text>
        </View>

        {(ticket.messages || []).map((msg: TicketMessage) => (
          <View key={msg.id} className={`mb-3 ${msg.isStaff ? 'mr-8' : 'ml-8'}`}>
            <View className={`rounded-2xl px-4 py-3 ${msg.isStaff ? 'bg-blue-600 rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-800 rounded-tl-sm'}`}>
              <Text className={`text-sm font-semibold mb-1 ${msg.isStaff ? 'text-blue-200' : 'text-gray-500'}`}>{msg.isStaff ? 'الدعم الفني' : 'أنت'}</Text>
              <Text className={`text-base leading-6 ${msg.isStaff ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{msg.content}</Text>
            </View>
            <Text className={`text-xs text-gray-400 mt-1 ${msg.isStaff ? 'text-right mr-2' : 'text-left ml-2'}`}>{formatDate(msg.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>

      {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
              <TextInput value={reply} onChangeText={setReply} placeholder="اكتب ردك..." placeholderTextColor="#9CA3AF" className="flex-1 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
              <TouchableOpacity onPress={handleReply} disabled={!reply.trim() || sending} className={`w-9 h-9 rounded-full items-center justify-center ${reply.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
