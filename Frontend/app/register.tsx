import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      await register(formData);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-8">
        <Text className="text-3xl font-bold text-center mb-8 text-gray-800">
          Create Account
        </Text>
        <Text className="text-gray-600 text-center mb-8">
          Join us and start shopping today
        </Text>

        <View className="space-y-4">
          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-gray-700 mb-2 font-medium">First Name*</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
                placeholder="First name"
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 mb-2 font-medium">Last Name*</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
                placeholder="Last name"
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Email*</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Password*</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
              placeholder="Enter your password (min 6 characters)"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Phone</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
              placeholder="Phone number"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Address</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
              placeholder="Street address"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
            />
          </View>

          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-gray-700 mb-2 font-medium">City</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
                placeholder="City"
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 mb-2 font-medium">State</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
                placeholder="State"
                value={formData.state}
                onChangeText={(value) => updateFormData('state', value)}
              />
            </View>
          </View>

          <View>
            <Text className="text-gray-700 mb-2 font-medium">Zip Code</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 bg-gray-50"
              placeholder="Zip code"
              value={formData.zipCode}
              onChangeText={(value) => updateFormData('zipCode', value)}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            className={`bg-blue-600 rounded-lg py-3 mt-6 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600">Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}