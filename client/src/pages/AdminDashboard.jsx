import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  Users,
  MapPin,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Filter,
  Plus,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import AdminForm from "../components/AdminForm.jsx";
import AdminList from "../components/AdminList.jsx";
import RoomForm from "../components/RoomForm.jsx";
import RoomList from "../components/RoomList.jsx";
import OccupancyGraph from "../components/OccupancyGraph.jsx";
import api from "../services/api.js";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const { admin } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    totalAdmins: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "admins", label: "Admins", icon: Users, adminOnly: true },
    { id: "rooms", label: "Rooms", icon: MapPin },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await api.get("/rooms/analytics");
      setAnalyticsData(response.data.analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to fetch analytics data");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setRecentActivityLoading(true);
      const response = await api.get("/admin/activity");
      const activities = response.data.activities.map((activity) => ({
        id: activity._id,
        type: activity.type,
        message: activity.message,
        time: formatTimeAgo(activity.createdAt),
        icon: getActivityIcon(activity.type),
      }));
      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      // Fallback to empty array if API fails
      setRecentActivity([]);
    } finally {
      setRecentActivityLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - activityDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "room_update":
        return MapPin;
      case "room_updated":
        return MapPin;
      case "admin_login":
      case "admin_logout":
        return Users;
      case "room_created":
      case "room_deleted":
        return Shield;
      case "room_status_changed":
        return Activity;
      case "system":
        return Shield;
      default:
        return Activity;
    }
  };

  const fetchDashboardData = useCallback(async () => {
    const results = await Promise.allSettled([
          api.get("/rooms"),
          api.get("/auth/admins"),
          api.get("/rooms/occupancy"),
        ]);

    const roomsResult = results[0];
    const adminsResult = results[1];
    const occupancyResult = results[2];

    // Rooms (required for dashboard)
    if (roomsResult.status === "fulfilled") {
      const roomsData = roomsResult.value.data.rooms || [];
      setRooms(roomsData);
      setStats((prev) => ({
        ...prev,
        totalRooms: roomsData.length,
        occupiedRooms: roomsData.filter((room) => room.status === "Occupied")
          .length,
        vacantRooms: roomsData.filter((room) => room.status === "Vacant")
          .length,
      }));
    } else {
      console.error("Rooms fetch failed:", roomsResult.reason);
      toast.error("Failed to fetch rooms");
      setRooms([]);
      setStats((prev) => ({
        ...prev,
        totalRooms: 0,
        occupiedRooms: 0,
        vacantRooms: 0,
      }));
    }

    // Admins (optional; should work for all admins now)
    if (adminsResult.status === "fulfilled") {
      const admins = adminsResult.value.data.admins || [];
      setStats((prev) => ({ ...prev, totalAdmins: admins.length }));
    } else {
      // Don't block dashboard if this fails; just set zero
      console.warn("Admins fetch failed:", adminsResult.reason);
      setStats((prev) => ({ ...prev, totalAdmins: 0 }));
    }

    // Occupancy (optional for charts)
    if (occupancyResult.status === "fulfilled") {
      // we already fetch analytics separately; keep for completeness
    } else {
      console.warn("Occupancy fetch failed:", occupancyResult.reason);
    }

    // Recent Activity
      await fetchRecentActivity();
  }, []);

  const handleRoomUpdate = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const response = await api.get("/rooms");
      setRooms(response.data.rooms);
      await fetchDashboardData();
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to refresh rooms");
    } finally {
      setRoomsLoading(false);
    }
  }, [fetchDashboardData]);

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex flex-col items-center sm:items-start sm:flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Total Admins
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.totalAdmins}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 lg:p-3 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center justify-center sm:justify-start text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>+12% from last week</span>
          </div>
        </div>

        <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex flex-col items-center sm:items-start sm:flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Vacant Rooms
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.vacantRooms}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 lg:p-3 bg-green-100 dark:bg-green-900/20 rounded-xl flex-shrink-0">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center justify-center sm:justify-start text-xs sm:text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>Available now</span>
          </div>
        </div>

        <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex flex-col items-center sm:items-start sm:flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Occupied Rooms
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.occupiedRooms}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 lg:p-3 bg-red-100 dark:bg-red-900/20 rounded-xl flex-shrink-0">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center justify-center sm:justify-start text-xs sm:text-sm text-red-600 dark:text-red-400">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>In use</span>
          </div>
        </div>

        <div className="card p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="flex flex-col items-center sm:items-start sm:flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Total Admins
              </p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.totalAdmins}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 lg:p-3 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 lg:mt-4 flex items-center justify-center sm:justify-start text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span>Active users</span>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Quick Actions
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ready</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab("rooms")}
              className="group relative p-4 bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-black rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 dark:bg-black/20 rounded-lg">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Add Room</div>
                  <div className="text-sm opacity-80">Create classroom</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className="group relative p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-900 dark:text-gray-100 rounded-xl hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Add Admin</div>
                  <div className="text-sm opacity-70">Manage users</div>
                </div>
              </div>
            </button>
            <button
              onClick={handleRoomUpdate}
              className="group relative p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 rounded-xl hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-200 dark:bg-blue-700 rounded-lg">
                  <RefreshCw className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Refresh Data</div>
                  <div className="text-sm opacity-70">Update all</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className="group relative p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 text-green-700 dark:text-green-300 rounded-xl hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-200 dark:bg-green-700 rounded-lg">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Analytics</div>
                  <div className="text-sm opacity-70">View reports</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Recent Activity
            </h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${recentActivityLoading ? 'bg-blue-500' : 'bg-green-500'}`}></div>
              <span className={`text-xs font-medium ${recentActivityLoading ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}>
                {recentActivityLoading ? 'Loading' : 'Live'}
              </span>
            </div>
          </div>
          <div className="h-72 overflow-y-auto smooth-scroll space-y-3">
            {recentActivityLoading ? (
              // Enhanced Loading state
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="relative mb-6">
                  {/* Outer rotating ring */}
                  <div className="w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                  </div>
                  
                  {/* Inner pulsing dot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-ping"></div>
                  
                  {/* Center icon */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                    <Activity className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                
                {/* Loading text with animation */}
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Loading Activities
                  </p>
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fetching recent system activity
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className="w-48 mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            ) : recentActivity.length > 0 ? (
              // Show activities
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200 hover:shadow-sm">
                  <div className="p-2 bg-indigo-50 dark:bg-gray-700 rounded-lg border border-indigo-100 dark:border-gray-600 flex-shrink-0">
                    <activity.icon className="h-4 w-4 text-indigo-600 dark:text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 font-medium">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // No activity state
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No recent activity</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Activity will appear here when actions are performed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="card p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
          <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
            Occupancy Analytics
          </h3>
          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            <button
              onClick={fetchAnalyticsData}
              disabled={analyticsLoading}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-300 transform text-xs sm:text-base ${
                analyticsLoading
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 shadow-lg"
              }`}
            >
              <RefreshCw
                className={`h-3 w-3 sm:h-4 sm:w-4 ${analyticsLoading ? "animate-spin" : ""} flex-shrink-0`}
              />
              <span className="font-medium hidden sm:inline whitespace-nowrap">
                {analyticsLoading ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
        <div className="w-full max-w-full overflow-hidden">
          <div className="w-full min-w-0">
            <OccupancyGraph data={analyticsData} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "admins":
        return (
          <div className="space-y-4 sm:space-y-6">
            <AdminForm onAdminCreated={fetchDashboardData} />
            <AdminList refreshSignal={stats.totalAdmins} />
          </div>
        );
      case "rooms":
        return (
          <div className="space-y-6">
            <RoomForm onRoomCreated={handleRoomUpdate} />
            <RoomList
              rooms={rooms}
              showActions={true}
              onRoomUpdate={handleRoomUpdate}
            />
          </div>
        );
      case "analytics":
        return (
          <div className="w-full max-w-full overflow-hidden">
            <div className="card p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
                <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Advanced Analytics
                </h2>
                <button
                  onClick={fetchAnalyticsData}
                  disabled={analyticsLoading}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 transform text-xs sm:text-base flex-shrink-0 w-full sm:w-auto ${
                    analyticsLoading
                      ? "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 shadow-lg"
                  }`}
                >
                  <RefreshCw
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      analyticsLoading ? "animate-spin" : ""
                    } flex-shrink-0`}
                  />
                  <span className="font-medium whitespace-nowrap">
                    {analyticsLoading ? "Refreshing..." : "Refresh"}
                  </span>
                </button>
              </div>
              <div className="w-full max-w-full overflow-hidden">
                <div className="w-full min-w-0 overflow-hidden">
                  <OccupancyGraph data={analyticsData} />
                </div>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6">
                System Settings
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base">
                    Hardware Integration
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    To update room status from hardware, send POST requests to:
                  </p>
                  <div className="overflow-x-auto">
                    <code className="block p-2 sm:p-3 bg-blue-100 dark:bg-blue-800 rounded-lg text-xs font-mono whitespace-nowrap sm:whitespace-pre">
                      POST /api/rooms/update
                    </code>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 break-words">
                    Body: {`{ "roomNumber": "R101", "status": "Occupied", "fingerprintID": 1001 }`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
                      System Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Database
                        </span>
                        <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                          Connected
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          API Server
                        </span>
                        <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
                          Running
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Hardware
                        </span>
                        <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                          Standby
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">
                      Quick Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Uptime
                        </span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">
                          99.9%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Last Backup
                        </span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">
                          2 hours ago
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Version
                        </span>
                        <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">
                          v1.0.0
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-2 sm:py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white dark:text-black font-bold text-xs sm:text-sm">
                V
              </span>
            </div>
            <h1 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              Admin Dashboard
            </h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
          >
            {isSidebarOpen ? <X size={18} className="sm:w-5 sm:h-5" /> : <Menu size={18} className="sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
          transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:h-screen
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="h-full overflow-y-auto smooth-scroll">
            {/* Sidebar Header */}
            <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
                  <span className="text-white dark:text-black font-bold text-sm lg:text-lg">
                    V
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    VERILOC
                  </h1>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 truncate">
                    Admin Dashboard
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="p-4 lg:p-6">
              <div className="space-y-1">
                {sidebarItems.map((item) => {
                  if (item.adminOnly && !admin?.isSuperAdmin) return null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl text-left transition-all duration-200 text-sm lg:text-base
                        ${
                          activeTab === item.id
                            ? "bg-black dark:bg-white text-white dark:text-black shadow-lg"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <item.icon size={18} className="lg:w-5 lg:h-5 flex-shrink-0" />
                      <span className="font-medium truncate">{item.label}</span>
                      {activeTab === item.id && (
                        <div className="ml-auto w-1.5 h-1.5 lg:w-2 lg:h-2 bg-white dark:bg-black rounded-full flex-shrink-0"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 lg:p-6 border-t border-gray-100 dark:border-gray-800 mt-auto">
              <div className="p-3 lg:p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white dark:text-black font-semibold text-sm lg:text-lg">
                      {admin?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base truncate">
                      {admin?.username}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {admin?.isSuperAdmin ? "Super Admin" : "Admin"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          {/* Content Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {sidebarItems.find((item) => item.id === activeTab)?.label}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 mt-2">
                    {activeTab === "overview"
                      ? "Welcome back! Here's what's happening with your classroom occupancy system."
                      : "Manage your classroom occupancy system efficiently"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-full overflow-hidden">
            <div className="max-w-7xl mx-auto w-full">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Global CSS for Chart.js containment */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Ensure Chart.js canvas doesn't cause horizontal scrolling */
        .chartjs-render-monitor,
        canvas {
          max-width: 100% !important;
          width: 100% !important;
          height: auto !important;
        }
        
        /* Prevent any chart-related overflow */
        [role="img"],
        .chartjs-wrapper {
          overflow: hidden !important;
          max-width: 100% !important;
        }
      ` }} />
    </div>
  );
};

export default AdminDashboard;
