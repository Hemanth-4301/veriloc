import React, { useState } from "react";
import { Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";

const RoomManagement = ({ onRoomsUpdated }) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearStep, setClearStep] = useState(1);
  const [showVacantModal, setShowVacantModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [vacantFormData, setVacantFormData] = useState({
    roomNumbers: "",
    days: [],
    timeSlots: [],
  });

  const allDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const predefinedTimeSlots = [
    "9:00-10:00",
    "10:00-11:00",
    "11:30-12:30",
    "12:30-1:30",
    "2:30-3:30",
    "3:30-4:30",
  ];

  const handleClearAll = async () => {
    if (clearStep === 1) {
      setClearStep(2);
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete("/rooms/clear-all");
      toast.success(response.data.message);
      setShowClearConfirm(false);
      setClearStep(1);
      if (onRoomsUpdated) onRoomsUpdated();
    } catch (error) {
      console.error("Clear all rooms error:", error);
      toast.error(error.response?.data?.message || "Failed to clear rooms");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAllVacant = async () => {
    try {
      // Parse room numbers
      const roomNumbers = vacantFormData.roomNumbers
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r);

      if (roomNumbers.length === 0) {
        toast.error("Please enter at least one room number");
        return;
      }

      if (vacantFormData.days.length === 0) {
        toast.error("Please select at least one day");
        return;
      }

      if (vacantFormData.timeSlots.length === 0) {
        toast.error("Please select at least one time slot");
        return;
      }

      setLoading(true);
      const response = await api.post("/rooms/make-all-vacant", {
        roomNumbers,
        days: vacantFormData.days,
        timeSlots: vacantFormData.timeSlots,
      });

      toast.success(response.data.message);
      setShowVacantModal(false);
      setVacantFormData({ roomNumbers: "", days: [], timeSlots: [] });
      if (onRoomsUpdated) onRoomsUpdated();
    } catch (error) {
      console.error("Make all vacant error:", error);
      toast.error(
        error.response?.data?.message || "Failed to make rooms vacant"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setVacantFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const selectAllDays = () => {
    setVacantFormData((prev) => ({
      ...prev,
      days: prev.days.length === allDays.length ? [] : [...allDays],
    }));
  };

  const toggleTimeSlot = (slot) => {
    setVacantFormData((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(slot)
        ? prev.timeSlots.filter((s) => s !== slot)
        : [...prev.timeSlots, slot],
    }));
  };

  const selectAllTimeSlots = () => {
    setVacantFormData((prev) => ({
      ...prev,
      timeSlots:
        prev.timeSlots.length === predefinedTimeSlots.length
          ? []
          : [...predefinedTimeSlots],
    }));
  };

  return (
    <div className="card p-4 sm:p-6 mb-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Room Management Actions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clear All Rooms Button */}
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 transform hover:scale-100 shadow-lg"
        >
          <Trash2 className="h-5 w-5" />
          <span className="font-medium">Clear All Rooms</span>
        </button>

        {/* Make All Vacant Button */}
        <button
          onClick={() => setShowVacantModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-300 transform hover:scale-100 shadow-lg"
        >
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Make All Rooms Vacant</span>
        </button>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              {clearStep === 1
                ? "Clear All Rooms?"
                : "Are You Absolutely Sure?"}
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              {clearStep === 1
                ? "This will permanently delete all rooms from the database. This action cannot be undone!"
                : "This is the final confirmation. All room data will be permanently deleted!"}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearStep(1);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className={`flex-1 px-4 py-2 ${
                  clearStep === 1
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-red-500 hover:bg-red-600"
                } text-white rounded-lg transition-colors font-medium`}
                disabled={loading}
              >
                {loading
                  ? "Clearing..."
                  : clearStep === 1
                  ? "Continue"
                  : "Yes, Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Make All Vacant Modal */}
      {showVacantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl my-8">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Make All Rooms Vacant
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will create or update all combinations of rooms, days, and
              time slots as vacant.
            </p>

            <div className="space-y-4">
              {/* Room Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Room Numbers (comma-separated)
                </label>
                <input
                  type="text"
                  value={vacantFormData.roomNumbers}
                  onChange={(e) =>
                    setVacantFormData({
                      ...vacantFormData,
                      roomNumbers: e.target.value,
                    })
                  }
                  placeholder="e.g., 101, 102, 103, 201"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Days
                </label>
                <button
                  onClick={selectAllDays}
                  className="mb-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
                  type="button"
                >
                  {vacantFormData.days.length === allDays.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {allDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        vacantFormData.days.includes(day)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Slots
                </label>
                <button
                  onClick={selectAllTimeSlots}
                  className="mb-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
                  type="button"
                >
                  {vacantFormData.timeSlots.length ===
                  predefinedTimeSlots.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {predefinedTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleTimeSlot(slot)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        vacantFormData.timeSlots.includes(slot)
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowVacantModal(false);
                  setVacantFormData({
                    roomNumbers: "",
                    days: [],
                    timeSlots: [],
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleMakeAllVacant}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                disabled={loading}
              >
                {loading ? "Processing..." : "Create/Update Rooms"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
