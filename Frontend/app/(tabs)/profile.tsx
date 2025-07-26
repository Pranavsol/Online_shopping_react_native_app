import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (user) {
      setEditFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateProfile(editFormData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setEditFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  };

  const updateEditFormData = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Ionicons name="person-outline" size={80} color="#9CA3AF" />
        <Text className="text-2xl font-bold text-gray-800 mt-4 text-center">
          Sign In Required
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-8">
          Please sign in to view your profile
        </Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg py-3 px-8"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-semibold text-lg">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const profileSections = [
    {
      title: 'Account',
      items: [
        { icon: 'receipt-outline', label: 'Order History', onPress: () => router.push('/(tabs)/orders') },
        { icon: 'card-outline', label: 'Payment Methods', onPress: () => Alert.alert('Coming Soon', 'Payment methods management will be available soon') },
        { icon: 'location-outline', label: 'Addresses', onPress: () => Alert.alert('Coming Soon', 'Address management will be available soon') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', onPress: () => Alert.alert('Help', 'For support, please contact us at support@example.com') },
        { icon: 'chatbubble-outline', label: 'Contact Us', onPress: () => Alert.alert('Contact', 'Email: support@example.com\nPhone: +91-1234567890') },
        { icon: 'star-outline', label: 'Rate App', onPress: () => Alert.alert('Thank You', 'Thank you for your feedback!') },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon') },
        { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => Alert.alert('Privacy Policy', 'Your privacy is important to us.') },
        { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => Alert.alert('Terms of Service', 'Please read our terms of service.') },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-800">Profile</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={handleEdit}>
              <Ionicons name="create-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
          ) : (
            <View className="flex-row">
              <TouchableOpacity onPress={handleCancel} className="mr-4">
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                <Text className="text-blue-600 font-medium">
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* User Info */}
        <View className="bg-white mx-4 mt-4 rounded-lg p-4">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Text className="text-2xl font-bold text-blue-600">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-800">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-gray-600">{user.email}</Text>
            {user.role === 'admin' && (
              <View className="bg-blue-100 px-3 py-1 rounded-full mt-2">
                <Text className="text-blue-600 font-medium text-sm">Administrator</Text>
              </View>
            )}
          </View>

          {/* Editable Fields */}
          <View className="space-y-3">
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">First Name</Text>
                {isEditing ? (
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    value={editFormData.firstName}
                    onChangeText={(value) => updateEditFormData('firstName', value)}
                  />
                ) : (
                  <Text className="text-gray-800">{user.firstName}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">Last Name</Text>
                {isEditing ? (
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    value={editFormData.lastName}
                    onChangeText={(value) => updateEditFormData('lastName', value)}
                  />
                ) : (
                  <Text className="text-gray-800">{user.lastName}</Text>
                )}
              </View>
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Phone</Text>
              {isEditing ? (
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  value={editFormData.phone}
                  onChangeText={(value) => updateEditFormData('phone', value)}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text className="text-gray-800">{user.phone || 'Not provided'}</Text>
              )}
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Address</Text>
              {isEditing ? (
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  value={editFormData.address}
                  onChangeText={(value) => updateEditFormData('address', value)}
                  multiline
                />
              ) : (
                <Text className="text-gray-800">{user.address || 'Not provided'}</Text>
              )}
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">City</Text>
                {isEditing ? (
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    value={editFormData.city}
                    onChangeText={(value) => updateEditFormData('city', value)}
                  />
                ) : (
                  <Text className="text-gray-800">{user.city || 'Not provided'}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">State</Text>
                {isEditing ? (
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                    value={editFormData.state}
                    onChangeText={(value) => updateEditFormData('state', value)}
                  />
                ) : (
                  <Text className="text-gray-800">{user.state || 'Not provided'}</Text>
                )}
              </View>
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Zip Code</Text>
              {isEditing ? (
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  value={editFormData.zipCode}
                  onChangeText={(value) => updateEditFormData('zipCode', value)}
                  keyboardType="numeric"
                />
              ) : (
                <Text className="text-gray-800">{user.zipCode || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Profile Sections */}
        {!isEditing && profileSections.map((section) => (
          <View key={section.title} className="bg-white mx-4 mt-4 rounded-lg overflow-hidden">
            <Text className="text-lg font-semibold text-gray-800 p-4 pb-2">
              {section.title}
            </Text>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center justify-between p-4 ${
                  index < section.items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onPress={item.onPress}
              >
                <View className="flex-row items-center">
                  <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                  <Text className="ml-3 text-gray-800 font-medium">{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Admin Dashboard Button */}
        {user.role === 'admin' && !isEditing && (
          <TouchableOpacity
            className="bg-blue-600 mx-4 mt-4 rounded-lg p-4 flex-row items-center justify-center"
            onPress={() => router.push('/(tabs)/admin')}
          >
            <Ionicons name="settings" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Admin Dashboard</Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        {!isEditing && (
          <TouchableOpacity
            className="bg-red-500 mx-4 mt-4 mb-6 rounded-lg p-4 flex-row items-center justify-center"
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}