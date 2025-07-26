import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  User: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const API_BASE_URL = "http://localhost:5000/api";

// export default function AdminDashboard() {
//   const [stats, setStats] = useState<DashboardStats | null>(null);
//   const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const { token, user } = useAuth();

//   useEffect(() => {
//     if (user?.role === 'admin') {
//       fetchDashboardData();
//     }
//   }, [user]);

//   const fetchDashboardData = async () => {
//     try {
//       setIsLoading(true);
//       const response = await fetch(`${API_BASE_URL}/users/admin/dashboard`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       const data = await response.json();

//       if (data.success) {
//         setStats(data.data.statistics);
//         setRecentOrders(data.data.recentOrders);
//       }
//     } catch (error) {
//       console.error('Failed to fetch dashboard data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatCurrency = (amount: number) => {
//     return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'short',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   if (user?.role !== 'admin') {
//     return (
//       <SafeAreaView className="flex-1 bg-white justify-center items-center">
//         <Ionicons name="shield-outline" size={80} color="#9CA3AF" />
//         <Text className="text-xl font-bold text-gray-800 mt-4">Access Denied</Text>
//         <Text className="text-gray-600 text-center mt-2">
//           You don't have permission to access this page
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   if (isLoading) {
//     return (
//       <SafeAreaView className="flex-1 bg-white justify-center items-center">
//         <Text className="text-gray-500">Loading dashboard...</Text>
//       </SafeAreaView>
//     );
//   }

//   const adminActions = [
//     {
//       title: 'Manage Products',
//       description: 'Add, edit, and manage products',
//       icon: 'cube-outline',
//       color: '#3B82F6',
//       onPress: () => Alert.alert('Coming Soon', 'Product management will be available soon'),
//     },
//     {
//       title: 'Manage Orders',
//       description: 'View and update order status',
//       icon: 'receipt-outline',
//       color: '#10B981',
//       onPress: () => Alert.alert('Coming Soon', 'Order management will be available soon'),
//     },
//     {
//       title: 'Manage Users',
//       description: 'View and manage user accounts',
//       icon: 'people-outline',
//       color: '#F59E0B',
//       onPress: () => Alert.alert('Coming Soon', 'User management will be available soon'),
//     },
//     {
//       title: 'Analytics',
//       description: 'View detailed analytics and reports',
//       icon: 'analytics-outline',
//       color: '#8B5CF6',
//       onPress: () => Alert.alert('Coming Soon', 'Analytics will be available soon'),
//     },
//   ];

//   return (
//     <SafeAreaView className="flex-1 bg-gray-50">
//       {/* Header */}
//       <View className="bg-white px-4 py-3 border-b border-gray-200">
//         <Text className="text-xl font-bold text-gray-800">Admin Dashboard</Text>
//         <Text className="text-gray-600">Welcome back, {user.firstName}</Text>
//       </View>

//       <ScrollView className="flex-1">
//         {/* Stats Cards */}
//         {stats && (
//           <View className="p-4">
//             <Text className="text-lg font-semibold text-gray-800 mb-3">Overview</Text>

//             {/* Revenue Card */}
//             <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 mb-4">
//               <Text className="text-white text-sm opacity-90">Total Revenue</Text>
//               <Text className="text-white text-2xl font-bold">
//                 {formatCurrency(stats.orders.revenue)}
//               </Text>
//               <Text className="text-white text-sm opacity-90 mt-1">
//                 From {stats.orders.completed} completed orders
//               </Text>
//             </View>

//             {/* Stats Grid */}
//             <View className="flex-row flex-wrap -mx-2">
//               <View className="w-1/2 px-2 mb-4">
//                 <View className="bg-white rounded-lg p-4 shadow-sm">
//                   <View className="flex-row items-center mb-2">
//                     <Ionicons name="people" size={20} color="#3B82F6" />
//                     <Text className="text-gray-600 text-sm ml-2">Users</Text>
//                   </View>
//                   <Text className="text-2xl font-bold text-gray-800">{stats.users.total}</Text>
//                   <Text className="text-green-600 text-xs">
//                     +{stats.users.newThisMonth} this month
//                   </Text>
//                 </View>
//               </View>

//               <View className="w-1/2 px-2 mb-4">
//                 <View className="bg-white rounded-lg p-4 shadow-sm">
//                   <View className="flex-row items-center mb-2">
//                     <Ionicons name="receipt" size={20} color="#10B981" />
//                     <Text className="text-gray-600 text-sm ml-2">Orders</Text>
//                   </View>
//                   <Text className="text-2xl font-bold text-gray-800">{stats.orders.total}</Text>
//                   <Text className="text-orange-600 text-xs">
//                     {stats.orders.pending} pending
//                   </Text>
//                 </View>
//               </View>

//               <View className="w-1/2 px-2 mb-4">
//                 <View className="bg-white rounded-lg p-4 shadow-sm">
//                   <View className="flex-row items-center mb-2">
//                     <Ionicons name="cube" size={20} color="#F59E0B" />
//                     <Text className="text-gray-600 text-sm ml-2">Products</Text>
//                   </View>
//                   <Text className="text-2xl font-bold text-gray-800">{stats.products.total}</Text>
//                   {stats.products.lowStock > 0 && (
//                     <Text className="text-red-600 text-xs">
//                       {stats.products.lowStock} low stock
//                     </Text>
//                   )}
//                 </View>
//               </View>

//               <View className="w-1/2 px-2 mb-4">
//                 <View className="bg-white rounded-lg p-4 shadow-sm">
//                   <View className="flex-row items-center mb-2">
//                     <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
//                     <Text className="text-gray-600 text-sm ml-2">Delivered</Text>
//                   </View>
//                   <Text className="text-2xl font-bold text-gray-800">{stats.orders.completed}</Text>
//                   <Text className="text-green-600 text-xs">Completed orders</Text>
//                 </View>
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Quick Actions */}
//         <View className="p-4">
//           <Text className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</Text>

//           <View className="flex-row flex-wrap -mx-2">
//             {adminActions.map((action, index) => (
//               <View key={index} className="w-1/2 px-2 mb-4">
//                 <TouchableOpacity
//                   className="bg-white rounded-lg p-4 shadow-sm"
//                   onPress={action.onPress}
//                 >
//                   <View className="items-center">
//                     <View
//                       className="w-12 h-12 rounded-full items-center justify-center mb-2"
//                       style={{ backgroundColor: `${action.color}15` }}
//                     >
//                       <Ionicons name={action.icon as any} size={24} color={action.color} />
//                     </View>
//                     <Text className="font-semibold text-gray-800 text-center text-sm">
//                       {action.title}
//                     </Text>
//                     <Text className="text-gray-600 text-xs text-center mt-1">
//                       {action.description}
//                     </Text>
//                   </View>
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </View>
//         </View>

//         {/* Recent Orders */}
//         {recentOrders.length > 0 && (
//           <View className="p-4">
//             <View className="flex-row items-center justify-between mb-3">
//               <Text className="text-lg font-semibold text-gray-800">Recent Orders</Text>
//               <TouchableOpacity>
//                 <Text className="text-blue-600 font-medium">View All</Text>
//               </TouchableOpacity>
//             </View>

//             <View className="bg-white rounded-lg shadow-sm overflow-hidden">
//               {recentOrders.map((order, index) => (
//                 <TouchableOpacity
//                   key={order.id}
//                   className={`p-4 ${index < recentOrders.length - 1 ? 'border-b border-gray-100' : ''}`}
//                   onPress={() => router.push(`/order/${order.id}`)}
//                 >
//                   <View className="flex-row items-center justify-between">
//                     <View className="flex-1">
//                       <Text className="font-semibold text-gray-800 text-sm">
//                         #{order.orderNumber}
//                       </Text>
//                       <Text className="text-gray-600 text-xs mt-1">
//                         {order.User.firstName} {order.User.lastName}
//                       </Text>
//                       <Text className="text-gray-500 text-xs">
//                         {formatDate(order.createdAt)}
//                       </Text>
//                     </View>
//                     <View className="items-end">
//                       <Text className="font-bold text-gray-800">
//                         {formatCurrency(order.totalAmount)}
//                       </Text>
//                       <View className={`px-2 py-1 rounded-full mt-1 ${
//                         order.status === 'pending' ? 'bg-orange-100' :
//                         order.status === 'delivered' ? 'bg-green-100' : 'bg-blue-100'
//                       }`}>
//                         <Text className={`text-xs font-medium capitalize ${
//                           order.status === 'pending' ? 'text-orange-600' :
//                           order.status === 'delivered' ? 'text-green-600' : 'text-blue-600'
//                         }`}>
//                           {order.status}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           </View>
//         )}
//       </ScrollView>
//     </SafeAreaView>
//   );
// }
