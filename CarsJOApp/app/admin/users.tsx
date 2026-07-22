import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { User } from '../../types';
import { formatDate } from '../../lib/utils';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadUsers = async (p = 1, q = '') => {
    try {
      const res = await api.request(`/api/admin/users?page=${p}&limit=20&search=${q}`);
      const data = res.data || res;
      if (p === 1) setUsers(data.users || data || []);
      else setUsers(prev => [...prev, ...(data.users || data || [])]);
      setHasMore((data.users || data || []).length === 20);
    } catch (error) { console.error(error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSearch = () => { setPage(1); loadUsers(1, search); };

  const toggleBan = async (userId: string) => {
    try {
      await api.request(`/api/admin/users/${userId}/ban`, { method: 'POST' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !u.isBanned } as any : u));
    } catch (error) { console.error(error); }
  };

  const toggleAdmin = async (userId: string) => {
    try {
      await api.request(`/api/admin/users/${userId}/admin`, { method: 'POST' });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: !u.isAdmin } as any : u));
    } catch (error) { console.error(error); }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 pt-3 pb-2 flex-row items-center gap-2">
        <TouchableOpacity onPress={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Ionicons name="arrow-forward" size={18} color="#6B7280" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">إدارة المستخدمين</Text>
      </View>

      <View className="px-4 mb-3">
        <View className="flex-row gap-2">
          <TextInput value={search} onChangeText={setSearch} onSubmitEditing={handleSearch} placeholder="بحث بالاسم أو البريد..." placeholderTextColor="#9CA3AF" className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white" />
          <TouchableOpacity onPress={handleSearch} className="bg-blue-600 px-4 rounded-xl items-center justify-center">
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(1, search); }} tintColor="#3B82F6" />}>
        {users.map(user => (
          <View key={user.id} className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-base font-bold text-gray-900 dark:text-white">{user.name}</Text>
                  {user.isAdmin && <View className="bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full"><Text className="text-red-600 text-[10px] font-bold">ADMIN</Text></View>}
                  {(user as any).isBanned && <View className="bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full"><Text className="text-red-600 text-[10px] font-bold">محظور</Text></View>}
                </View>
                <Text className="text-xs text-gray-500 mt-0.5">{user.email}</Text>
              </View>
              <Text className="text-xs text-gray-400">{formatDate(user.createdAt)}</Text>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={() => toggleBan(user.id)} className={`flex-1 py-2 rounded-xl items-center ${(user as any).isBanned ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'}`}>
                <Text className={`text-xs font-medium ${(user as any).isBanned ? 'text-green-600' : 'text-red-600'}`}>{(user as any).isBanned ? 'إلغاء الحظر' : 'حظر'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleAdmin(user.id)} className="flex-1 bg-gray-100 dark:bg-gray-800 py-2 rounded-xl items-center">
                <Text className="text-xs font-medium text-gray-600 dark:text-gray-400">{user.isAdmin ? 'إلغاء الإدارة' : 'جعله مدير'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {hasMore && users.length > 0 && (
          <TouchableOpacity onPress={() => { const np = page + 1; setPage(np); loadUsers(np, search); }} className="bg-blue-50 dark:bg-blue-500/10 py-3 rounded-xl items-center mb-4">
            <Text className="text-blue-600 font-medium text-sm">تحميل المزيد</Text>
          </TouchableOpacity>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
