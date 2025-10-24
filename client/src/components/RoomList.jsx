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
  const [itemsPerPage] = useState(10);

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

  // Pagination logic
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedRooms.map((room, index) => (
          <div
            key={`${room._id}-${index}`}
            className="card p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {room.roomNumber}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`badge ${
                    room.status === "Vacant" ? "badge-success" : "badge-danger"
                  }`}
                >
                  {room.status}
                </span>
                {showActions && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(room)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      disabled={
                        loading || (editingId && editingId !== room._id)
                      }
                    >
                      {loading && editingId === room._id ? (
                        <Loader2 className="h-4 w-4 text-gray-600 dark:text-gray-400 animate-spin" />
                      ) : (
                        <Edit className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(room._id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editingId === room._id ? (
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
                {/* Save / Cancel buttons inside edit panel so they're always visible */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
                  <button
                    onClick={() => handleSave(room._id)}
                    disabled={loading}
                    className="flex-1 btn-primary flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 btn-secondary flex items-center justify-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{room.day}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{room.duration}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredRooms.length)} of {filteredRooms.length}{" "}
            rooms
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;
