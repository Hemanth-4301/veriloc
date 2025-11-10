import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  Search,
  Filter,
  Check,
  X,
} from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";

const RoomList = ({ rooms = [], showActions = false, onRoomUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const handleEdit = (room) => {
    if (editingId && editingId !== room._id) {
      if (
        !window.confirm(
          "You have unsaved changes. Do you want to switch to editing another room?"
        )
      ) {
        return;
      }
    }

    setEditingId(room._id);
    setEditData({
      roomNumber: room.roomNumber,
      day: room.day,
      duration: room.duration,
      status: room.status,
    });
  };

  const handleSave = async (roomId) => {
    setLoading(true);
    try {
      // Validate room number
      if (!editData.roomNumber || !editData.roomNumber.trim()) {
        toast.error("Room number is required");
        setLoading(false);
        return;
      }

      // Validate duration format HH:MM-HH:MM and valid 24h times
      const durationRegex =
        /^([0-1]?\d|2[0-3]):[0-5]\d-([0-1]?\d|2[0-3]):[0-5]\d$/;
      if (!editData.duration || !durationRegex.test(editData.duration.trim())) {
        toast.error(
          "Duration must be in format HH:MM-HH:MM (e.g., 09:00-10:00)"
        );
        setLoading(false);
        return;
      }

      // Parse times and ensure end is after start
      const [startTime, endTime] = editData.duration.trim().split("-");
      const [startHour, startMinute] = startTime
        .split(":")
        .map((n) => parseInt(n, 10));
      const [endHour, endMinute] = endTime
        .split(":")
        .map((n) => parseInt(n, 10));
      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;
      if (isNaN(startTotal) || isNaN(endTotal) || startTotal >= endTotal) {
        toast.error("End time must be after start time");
        setLoading(false);
        return;
      }

      const payload = {
        roomNumber: editData.roomNumber.trim().toUpperCase(),
        day: editData.day,
        duration: editData.duration.trim(),
        status: editData.status,
      };

      const response = await api.put(`/rooms/${roomId}`, payload);

      if (response?.status === 200) {
        toast.success("Room updated successfully!");
        setEditingId(null);
        setEditData({});
        if (onRoomUpdate) await onRoomUpdate();
      }
    } catch (error) {
      console.error("Error updating room:", error);
      const msg = error.response?.data?.message || "Failed to update room";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (roomId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this room? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      if (response.status === 200) {
        toast.success("Room deleted successfully!");
        if (onRoomUpdate) {
          await onRoomUpdate();
        }
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete room";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Removed handleAdminChange as it's no longer needed

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.day.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || room.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Group rooms by roomNumber and day
  const groupedRooms = filteredRooms.reduce((acc, room) => {
    const key = `${room.roomNumber}-${room.day}`;
    if (!acc[key]) {
      acc[key] = {
        roomNumber: room.roomNumber,
        day: room.day,
        slots: [],
      };
    }
    acc[key].slots.push({
      _id: room._id,
      duration: room.duration,
      status: room.status,
      authorizedAdmins: room.authorizedAdmins,
    });
    return acc;
  }, {});

  // Convert grouped rooms to array and sort slots by duration
  const groupedRoomsArray = Object.values(groupedRooms).map((group) => {
    // Define the expected order of time slots
    const timeSlotOrder = [
      "9:00-10:00",
      "10:00-11:00",
      "11:30-12:30",
      "12:30-1:30",
      "2:30-3:30",
      "3:30-4:30",
    ];

    // Sort slots by the predefined order
    group.slots.sort((a, b) => {
      // Normalize duration strings (handle variations)
      const normalizeDuration = (dur) => {
        // Remove spaces and convert to lowercase for comparison
        return dur.trim().toLowerCase();
      };

      const aNormalized = normalizeDuration(a.duration);
      const bNormalized = normalizeDuration(b.duration);

      // Find index in predefined order
      let aIndex = timeSlotOrder.findIndex(
        (slot) => normalizeDuration(slot) === aNormalized
      );
      let bIndex = timeSlotOrder.findIndex(
        (slot) => normalizeDuration(slot) === bNormalized
      );

      // If not found in predefined order, try to parse as time
      if (aIndex === -1) {
        const aStart = a.duration.split("-")[0].trim();
        const [aHours, aMinutes] = aStart.split(":").map(Number);
        aIndex = aHours * 60 + (aMinutes || 0);
      }

      if (bIndex === -1) {
        const bStart = b.duration.split("-")[0].trim();
        const [bHours, bMinutes] = bStart.split(":").map(Number);
        bIndex = bHours * 60 + (bMinutes || 0);
      }

      return aIndex - bIndex;
    });
    return group;
  }); // Sort by room number, then by day
  groupedRoomsArray.sort((a, b) => {
    if (a.roomNumber !== b.roomNumber) {
      return a.roomNumber.localeCompare(b.roomNumber);
    }
    const dayOrder = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  });

  // Pagination logic
  const totalPages = Math.ceil(groupedRoomsArray.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRooms = groupedRoomsArray.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No rooms found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Try adjusting your filters or add some rooms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input-field"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">All Status</option>
          <option value="Vacant">Vacant</option>
          <option value="Occupied">Occupied</option>
        </select>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {paginatedRooms.map((roomGroup, groupIndex) => (
          <div
            key={`${roomGroup.roomNumber}-${roomGroup.day}-${groupIndex}`}
            className="card p-3 xs:p-4 sm:p-5 lg:p-6 hover:shadow-lg transition-all duration-300"
          >
            {/* Card Header */}
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-1.5 sm:mb-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  Room {roomGroup.roomNumber}
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">
                  {roomGroup.day}
                </span>
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              {roomGroup.slots.map((slot, slotIndex) => (
                <div
                  key={slot._id}
                  className={`flex flex-col xs:flex-row items-start xs:items-center justify-between p-2.5 xs:p-3 rounded-lg border gap-2 xs:gap-0 ${
                    slot.status === "Vacant"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Clock className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-xs xs:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {slot.duration}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 xs:gap-2 w-full xs:w-auto">
                    {/* Status Badge */}
                    <span
                      className={`badge text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5 ${
                        slot.status === "Vacant"
                          ? "badge-success"
                          : "badge-danger"
                      }`}
                    >
                      {slot.status}
                    </span>
                    {/* Allocated Badge - Shows when slot is Occupied (has a class) */}
                    {slot.status === "Occupied" && (
                      <span className="inline-flex items-center px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700 whitespace-nowrap">
                        <span className="hidden xs:inline">📚 </span>Allocated
                      </span>
                    )}
                    {showActions && (
                      <div className="flex items-center space-x-1 ml-auto xs:ml-0">
                        <button
                          onClick={() => {
                            // Find the full room object for editing
                            const fullRoom = rooms.find(
                              (r) => r._id === slot._id
                            );
                            if (fullRoom) handleEdit(fullRoom);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
                          disabled={
                            loading || (editingId && editingId !== slot._id)
                          }
                        >
                          {loading && editingId === slot._id ? (
                            <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 dark:text-gray-400 animate-spin" />
                          ) : (
                            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(slot._id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors touch-manipulation"
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Form - Show if any slot in this group is being edited */}
            {roomGroup.slots.some((slot) => editingId === slot._id) && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  Edit Slot
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={editData.roomNumber}
                      onChange={(e) =>
                        setEditData({ ...editData, roomNumber: e.target.value })
                      }
                      className="input-field text-sm w-full"
                      placeholder="Room number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <select
                      value={editData.duration}
                      onChange={(e) =>
                        setEditData({ ...editData, duration: e.target.value })
                      }
                      className="input-field text-sm w-full"
                      required
                    >
                      <option value="">Select duration</option>
                      <option value="9:00-10:00">9:00-10:00</option>
                      <option value="10:00-11:00">10:00-11:00</option>
                      <option value="11:30-12:30">11:30-12:30</option>
                      <option value="12:30-1:30">12:30-1:30</option>
                      <option value="2:30-3:30">2:30-3:30</option>
                      <option value="3:30-4:30">3:30-4:30</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Day
                    </label>
                    <select
                      value={editData.day}
                      onChange={(e) =>
                        setEditData({ ...editData, day: e.target.value })
                      }
                      className="input-field text-sm w-full"
                    >
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                      className="input-field text-sm w-full"
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2 pt-2">
                    <button
                      onClick={() => handleSave(editingId)}
                      disabled={loading}
                      className="flex-1 btn-primary flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 touch-manipulation"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 btn-secondary flex items-center justify-center text-xs sm:text-sm py-2 sm:py-2.5 touch-manipulation"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 sm:mt-6 lg:mt-8 gap-3 sm:gap-4">
          <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left order-2 sm:order-1">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, groupedRoomsArray.length)} of{" "}
            {groupedRoomsArray.length} room groups
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            >
              <span className="hidden xs:inline">Prev</span>
              <span className="inline xs:hidden">‹</span>
            </button>

            <div className="flex space-x-1 overflow-x-auto scrollbar-hide max-w-[140px] xs:max-w-[180px] sm:max-w-[240px]">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[28px] xs:min-w-[32px] sm:min-w-[36px] px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm font-medium rounded-lg flex-shrink-0 transition-colors touch-manipulation ${
                      currentPage === page
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            >
              <span className="hidden xs:inline">Next</span>
              <span className="inline xs:hidden">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RoomList);
