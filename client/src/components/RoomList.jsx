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
    // Sort slots by start time
    group.slots.sort((a, b) => {
      const aStart = a.duration.split("-")[0];
      const bStart = b.duration.split("-")[0];
      return aStart.localeCompare(bStart);
    });
    return group;
  });

  // Sort by room number, then by day
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {paginatedRooms.map((roomGroup, groupIndex) => (
          <div
            key={`${roomGroup.roomNumber}-${roomGroup.day}-${groupIndex}`}
            className="card p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
          >
            {/* Card Header */}
            <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Room {roomGroup.roomNumber}
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">{roomGroup.day}</span>
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              {roomGroup.slots.map((slot, slotIndex) => (
                <div
                  key={slot._id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    slot.status === "Vacant"
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {slot.duration}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`badge text-xs ${
                        slot.status === "Vacant"
                          ? "badge-success"
                          : "badge-danger"
                      }`}
                    >
                      {slot.status}
                    </span>
                    {showActions && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            // Find the full room object for editing
                            const fullRoom = rooms.find(
                              (r) => r._id === slot._id
                            );
                            if (fullRoom) handleEdit(fullRoom);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          disabled={
                            loading || (editingId && editingId !== slot._id)
                          }
                        >
                          {loading && editingId === slot._id ? (
                            <Loader2 className="h-3 w-3 text-gray-600 dark:text-gray-400 animate-spin" />
                          ) : (
                            <Edit className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(slot._id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit Form - Show if any slot in this group is being edited */}
            {roomGroup.slots.some((slot) => editingId === slot._id) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Edit Slot
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={editData.roomNumber}
                      onChange={(e) =>
                        setEditData({ ...editData, roomNumber: e.target.value })
                      }
                      className="input-field mt-1"
                      placeholder="Room number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Duration
                    </label>
                    <select
                      value={editData.duration}
                      onChange={(e) =>
                        setEditData({ ...editData, duration: e.target.value })
                      }
                      className="input-field mt-1"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Day
                    </label>
                    <select
                      value={editData.day}
                      onChange={(e) =>
                        setEditData({ ...editData, day: e.target.value })
                      }
                      className="input-field mt-1"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                      className="input-field mt-1"
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => handleSave(editingId)}
                      disabled={loading}
                      className="flex-1 btn-primary flex items-center justify-center text-sm py-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 btn-secondary flex items-center justify-center text-sm py-2"
                    >
                      <X className="h-4 w-4 mr-1" />
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
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 sm:mt-8 space-y-3 sm:space-y-0">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, groupedRoomsArray.length)} of{" "}
            {groupedRoomsArray.length} room groups
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="flex space-x-1 max-w-[200px] overflow-x-auto scrollbar-hide">
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
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg flex-shrink-0 ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
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
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RoomList);
