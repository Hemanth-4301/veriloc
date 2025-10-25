import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  Users,
  Calendar,
} from "lucide-react";
import RoomList from "../components/RoomList.jsx";
import OccupancyGraph from "../components/OccupancyGraph.jsx";
import Hero from "../components/Hero.jsx";
import api from "../services/api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [filters, setFilters] = useState({
    day: "",
    duration: "",
    roomNumber: "",
    status: "",
  });

  useEffect(() => {
    fetchRooms();
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await api.get("/rooms/analytics");
      setAnalyticsData(response.data.analyticsData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to fetch analytics data");
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/rooms");
      setRooms(response.data.rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      day: "",
      duration: "",
      roomNumber: "",
      status: "",
    });
  };

  const filteredRooms = rooms.filter((room) => {
    return (
      (!filters.day ||
        room.day.toLowerCase().includes(filters.day.toLowerCase())) &&
      (!filters.duration ||
        room.duration.toLowerCase().includes(filters.duration.toLowerCase())) &&
      (!filters.roomNumber ||
        room.roomNumber
          .toLowerCase()
          .includes(filters.roomNumber.toLowerCase())) &&
      (!filters.status || room.status === filters.status)
    );
  });

  const stats = {
    total: rooms.length,
    vacant: rooms.filter((room) => room.status === "Vacant").length,
    occupied: rooms.filter((room) => room.status === "Occupied").length,
  };

  return (
    <div className="min-h-screen bg-light-50 dark:bg-black">
      {/* Hero Section */}
      <Hero stats={stats} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Filters Section */}
        <div id="room-search" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Find Available Rooms
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Search and filter rooms by your preferences
                </p>
              </div>
            </div>
            <button
              onClick={fetchRooms}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                name="roomNumber"
                value={filters.roomNumber}
                onChange={handleFilterChange}
                placeholder="Search by room number..."
              className="pl-12 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 hover:border-gray-400"
              />
            </div>

            <select
              name="day"
              value={filters.day}
              onChange={handleFilterChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 hover:border-gray-400"
            >
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>

            <select
              name="duration"
              value={filters.duration}
              onChange={handleFilterChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 hover:border-gray-400"
            >
              <option value="">All Duration</option>
              <option value="9:00-10:00">9:00-10:00</option>
              <option value="10:00-11:00">10:00-11:00</option>
              <option value="11:30-12:30">11:30-12:30</option>
              <option value="12:30-1:30">12:30-1:30</option>
              <option value="2:30-3:30">2:30-3:30</option>
              <option value="3:30-4:30">3:30-4:30</option>
            </select>

            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-300 hover:border-gray-400"
            >
              <option value="">All Status</option>
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {filteredRooms.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {rooms.length}
                </span>{" "}
                rooms
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Rooms List */}
          <div className="xl:col-span-2">
            <div className="bg-light-100 dark:bg-gray-900 border border-light-300 dark:border-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      Room Availability
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Real-time room status and information
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">
                    Live
                  </span>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner text="Loading rooms..." />
                </div>
              ) : (
                <RoomList rooms={filteredRooms} showActions={false} />
              )}
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6 sm:space-y-8">
            {/* Occupancy Chart */}
            <div className="bg-light-100 dark:bg-gray-900 border border-light-300 dark:border-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 w-full max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Analytics
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Weekly occupancy trends
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchAnalyticsData}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-medium">Refresh</span>
                </button>
              </div>
              <OccupancyGraph data={analyticsData} />
            </div>

            {/* Quick Info */}
            <div className="bg-light-100 dark:bg-gray-900 border border-light-300 dark:border-gray-700 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Quick Info
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Current system status
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="group p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                        Available Rooms
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {stats.vacant} rooms ready for use
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.vacant}
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10 rounded-xl border border-red-200 dark:border-red-800 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Occupied Rooms
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {stats.occupied} rooms currently in use
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.occupied}
                    </div>
                  </div>
                </div>

                <div className="group p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Last Updated
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
