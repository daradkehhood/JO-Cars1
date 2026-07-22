import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../lib/api';
import { ForumTopic, ForumPost } from '../../../types';
import { useAuthStore } from '../../../store/authStore';
import { formatDate, getInitials } from '../../../lib/utils';

export default function ForumTopicScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const loadTopic = async () => {
    try {
      const res = await api.getForumTopic(slug!);
      const data = res.data || res;
      setTopic(data);
      setPosts(data.posts || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (slug) loadTopic(); }, [slug]);

  const handleReply = async () => {
    if (!reply.trim() || !topic) return;
    setSending(true);
    try {
      const res = await api.createForumPost({ topicId: topic.id, content: reply.trim() });
      setPosts(prev => [...prev, res.data || res]);
      setReply('');
    } catch (error: any) { Alert.alert('خطأ', error.message || 'فشل الإرسال'); }
    finally { setSending(false); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>{topic?.title || '...'}</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
        {topic && (
          <View className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 mb-4">
            <Text className="text-base font-bold text-gray-900 dark:text-white mb-2">{topic.title}</Text>
            <Text className="text-gray-600 dark:text-gray-400 leading-6">{topic.content}</Text>
            <View className="flex-row items-center gap-2 mt-3">
              <Text className="text-xs text-gray-400">{topic.user?.name || 'مستخدم'}</Text>
              <Text className="text-xs text-gray-400">{formatDate(topic.createdAt)}</Text>
              <Text className="text-xs text-gray-400">{topic.views} مشاهدة</Text>
            </View>
          </View>
        )}

        <Text className="text-sm font-bold text-gray-900 dark:text-white mb-3">{posts.length} رد</Text>

        {posts.map(post => (
          <View key={post.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs font-bold">{getInitials(post.user?.name || 'U')}</Text>
              </View>
              <Text className="text-sm font-semibold text-gray-900 dark:text-white">{post.user?.name || 'مستخدم'}</Text>
              <Text className="text-xs text-gray-400 mr-auto">{formatDate(post.createdAt)}</Text>
            </View>
            <Text className="text-gray-600 dark:text-gray-400 leading-6">{post.content}</Text>
          </View>
        ))}
      </ScrollView>

      {isAuthenticated && (
        <View className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2">
            <TextInput value={reply} onChangeText={setReply} placeholder="اكتب ردك..." placeholderTextColor="#9CA3AF" className="flex-1 text-base text-gray-900 dark:text-white" style={{ fontSize: 16 }} />
            <TouchableOpacity onPress={handleReply} disabled={!reply.trim() || sending} className={`w-9 h-9 rounded-full items-center justify-center ${reply.trim() ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <Ionicons name="send" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
