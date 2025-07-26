import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();

  if (user) {
    // If user is logged in, redirect to home
    router.replace("/(tabs)");
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-50 to-white">
      <ScrollView className="flex-1 px-6">
        <View className="flex-1 justify-center items-center py-12">
          {/* Logo/Icon */}
          <View className="w-24 h-24 bg-blue-600 rounded-full items-center justify-center mb-8">
            <Ionicons name="storefront" size={48} color="white" />
          </View>

          {/* Welcome Text */}
          <Text className="text-4xl font-bold text-gray-800 text-center mb-4">
            Welcome to Our Store
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-12 leading-relaxed">
            Discover amazing products, enjoy seamless shopping, and get fast
            delivery right to your doorstep.
          </Text>

          {/* Features */}
          <View className="w-full mb-12">
            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">
                  Quality Products
                </Text>
                <Text className="text-gray-600">
                  Curated selection of high-quality items
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="flash" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">
                  Fast Delivery
                </Text>
                <Text className="text-gray-600">
                  Quick and reliable shipping
                </Text>
              </View>
            </View>

            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                <Ionicons name="shield-checkmark" size={24} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800">
                  Secure Shopping
                </Text>
                <Text className="text-gray-600">
                  Safe and secure payment options
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full space-y-4">
            <TouchableOpacity
              className="bg-blue-600 rounded-lg py-4 items-center shadow-lg"
              onPress={() => router.push("/register")}
            >
              <Text className="text-white font-semibold text-lg">
                Create Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white border-2 border-blue-600 rounded-lg py-4 items-center"
              onPress={() => router.push("/login")}
            >
              <Text className="text-blue-600 font-semibold text-lg">
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-4"
              onPress={() => router.push("/(tabs)/products")}
            >
              <Text className="text-gray-600 text-center">Browse as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
