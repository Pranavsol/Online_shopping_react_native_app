import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CartSummary {
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
}

const API_BASE_URL = 'http://localhost:5000/api';

const PAYMENT_METHODS = [
  { id: 'cash_on_delivery', name: 'Cash on Delivery', icon: 'cash-outline' },
  { id: 'credit_card', name: 'Credit Card', icon: 'card-outline' },
  { id: 'debit_card', name: 'Debit Card', icon: 'card-outline' },
  { id: 'upi', name: 'UPI', icon: 'phone-portrait-outline' },
  { id: 'net_banking', name: 'Net Banking', icon: 'globe-outline' },
  { id: 'wallet', name: 'Digital Wallet', icon: 'wallet-outline' },
];

export default function CheckoutScreen() {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [notes, setNotes] = useState('');
  const [cartSummary, setCartSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const { token, user } = useAuth();

  useEffect(() => {
    if (user) {
      // Pre-fill shipping address with user data
      setShippingAddress({
        fullName: `${user.firstName} ${user.lastName}`,
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
      fetchCartSummary();
    }
  }, [user]);

  const fetchCartSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCartSummary(data.data.summary);
        
        if (data.data.cartItems.length === 0) {
          Alert.alert('Empty Cart', 'Your cart is empty', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/cart') },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateShippingAddress = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!shippingAddress.fullName.trim()) {
      Alert.alert('Error', 'Please enter full name');
      return false;
    }
    if (!shippingAddress.address.trim()) {
      Alert.alert('Error', 'Please enter address');
      return false;
    }
    if (!shippingAddress.city.trim()) {
      Alert.alert('Error', 'Please enter city');
      return false;
    }
    if (!shippingAddress.state.trim()) {
      Alert.alert('Error', 'Please enter state');
      return false;
    }
    if (!shippingAddress.zipCode.trim()) {
      Alert.alert('Error', 'Please enter zip code');
      return false;
    }
    return true;
  };

  const placeOrder = async () => {
    if (!validateForm()) return;

    try {
      setIsPlacingOrder(true);
      
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress,
          paymentMethod,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Order Placed Successfully!',
          `Your order #${data.data.order.orderNumber} has been placed successfully.`,
          [
            {
              text: 'View Order',
              onPress: () => router.replace(`/order/${data.data.order.id}`),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Please sign in to checkout</Text>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-gray-500">Loading checkout...</Text>
      </SafeAreaView>
    );
  }

  const shippingAmount = cartSummary && cartSummary.subtotal > 500 ? 0 : 50;
  const finalTotal = cartSummary ? cartSummary.subtotal + cartSummary.tax + shippingAmount : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800 ml-4">Checkout</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Shipping Address */}
        <View className="bg-white mt-4 mx-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Shipping Address
          </Text>
          
          <View className="space-y-3">
            <View>
              <Text className="text-gray-700 mb-1 font-medium">Full Name*</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                placeholder="Enter full name"
                value={shippingAddress.fullName}
                onChangeText={(value) => updateShippingAddress('fullName', value)}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Address*</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                placeholder="Enter street address"
                value={shippingAddress.address}
                onChangeText={(value) => updateShippingAddress('address', value)}
                multiline
              />
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">City*</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  placeholder="City"
                  value={shippingAddress.city}
                  onChangeText={(value) => updateShippingAddress('city', value)}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 mb-1 font-medium">State*</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                  placeholder="State"
                  value={shippingAddress.state}
                  onChangeText={(value) => updateShippingAddress('state', value)}
                />
              </View>
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Zip Code*</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
                placeholder="Enter zip code"
                value={shippingAddress.zipCode}
                onChangeText={(value) => updateShippingAddress('zipCode', value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View className="bg-white mt-4 mx-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            Payment Method
          </Text>
          
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`flex-row items-center p-3 rounded-lg mb-2 ${
                paymentMethod === method.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
              onPress={() => setPaymentMethod(method.id)}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={paymentMethod === method.id ? '#3B82F6' : '#6B7280'}
              />
              <Text className={`ml-3 font-medium ${
                paymentMethod === method.id ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {method.name}
              </Text>
              {paymentMethod === method.id && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" className="ml-auto" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Notes */}
        <View className="bg-white mt-4 mx-4 rounded-lg p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Order Notes (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
            placeholder="Any special instructions for delivery..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Summary */}
        {cartSummary && (
          <View className="bg-white mt-4 mx-4 rounded-lg p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Order Summary
            </Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-800">₹{cartSummary.subtotal.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Tax</Text>
                <Text className="text-gray-800">₹{cartSummary.tax.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Shipping</Text>
                <Text className="text-gray-800">
                  {shippingAmount === 0 ? 'Free' : `₹${shippingAmount.toFixed(2)}`}
                </Text>
              </View>
              {cartSummary.subtotal <= 500 && (
                <Text className="text-xs text-gray-500">
                  Free shipping on orders above ₹500
                </Text>
              )}
              <View className="flex-row justify-between border-t border-gray-200 pt-2">
                <Text className="text-lg font-bold text-gray-800">Total</Text>
                <Text className="text-lg font-bold text-blue-600">
                  ₹{finalTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Place Order Button */}
      <View className="bg-white border-t border-gray-200 p-4">
        <TouchableOpacity
          className={`bg-blue-600 rounded-lg py-4 items-center ${
            isPlacingOrder ? 'opacity-50' : ''
          }`}
          onPress={placeOrder}
          disabled={isPlacingOrder}
        >
          <Text className="text-white font-semibold text-lg">
            {isPlacingOrder ? 'Placing Order...' : `Place Order • ₹${finalTotal.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}