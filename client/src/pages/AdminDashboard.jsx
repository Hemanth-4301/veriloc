import React, { useState, useEffect } from "react";
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

  const fetchAnalyticsData = async () => {
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
  };

  const fetchRecentActivity = async () => {
    try {
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

  const fetchDashboardData = async () => {
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
  };

  const handleRoomUpdate = async () => {
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
  };

  const renderOverview = () => (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="card p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Total Rooms
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.totalRooms}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0 ml-3">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">+12% from last week</span>
          </div>
        </div>

        <div className="card p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Vacant Rooms
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.vacantRooms}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-xl flex-shrink-0 ml-3">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Available now</span>
          </div>
        </div>

        <div className="card p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Occupied Rooms
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.occupiedRooms}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/20 rounded-xl flex-shrink-0 ml-3">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-red-600 dark:text-red-400">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">In use</span>
          </div>
        </div>

        <div className="card p-4 sm:p-5 lg:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                Total Admins
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.totalAdmins}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0 ml-3">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Active users</span>
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
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
            </div>
          </div>
          <div className="h-72 overflow-y-auto smooth-scroll space-y-3">
            {recentActivity.map((activity) => (
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
            ))}
            {recentActivity.length === 0 && (
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
          <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
            <div className="card p-3 sm:p-4 lg:p-6 w-full max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
                <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Advanced Analytics
                </h2>
                <button
                  onClick={fetchAnalyticsData}
                  disabled={analyticsLoading}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 transform text-xs sm:text-base flex-shrink-0 ${
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
                <div className="w-full min-w-0">
                  <OccupancyGraph data={analyticsData} />
                </div>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                System Settings
              </h2>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Hardware Integration
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    To update room status from hardware, send POST requests to:
                  </p>
                  <code className="block p-3 bg-blue-100 dark:bg-blue-800 rounded-lg text-xs font-mono">
                    POST /api/rooms/update
                  </code>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Body:{" "}
                    {`{ "roomNumber": "R101", "status": "Occupied", "fingerprintID": 1001 }`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      System Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Database
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Connected
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          API Server
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400">
                          Running
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Hardware
                        </span>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                          Standby
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Quick Stats
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Uptime
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          99.9%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Last Backup
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          2 hours ago
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Version
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
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
          <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
