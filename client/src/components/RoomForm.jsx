import React, { useState, useEffect } from "react";
import { Plus, Loader2, Check, X, Users } from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext.jsx";

const RoomForm = ({ onRoomCreated }) => {
  const { admin, isSuperAdmin } = useAuth();

  const [formData, setFormData] = useState({
    roomNumber: "",
    day: "Monday",
    duration: "",
    status: "Vacant",
    authorizedAdmins: [],
  });
  const [createMultiple, setCreateMultiple] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const response = await api.get("/auth/admins");
      setAdmins(response.data.admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to fetch admins");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAdminChange = (adminId, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        authorizedAdmins: [...formData.authorizedAdmins, adminId],
      });
    } else {
      setFormData({
        ...formData,
        authorizedAdmins: formData.authorizedAdmins.filter(
          (id) => id !== adminId
        ),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // No authorized admin required

    let allCreated = false;

    try {
      if (createMultiple) {
        if (selectedDays.length === 0) {
          toast.error("Please select at least one day");
          setLoading(false);
          return;
        }

        // Create multiple room entries
        const roomsToCreate = [];
        const errors = [];

        // Validate time slots first
        for (const timeSlot of timeSlots.filter((slot) => slot.trim())) {
          const durationRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
          if (!durationRegex.test(timeSlot)) {
            errors.push(
              `Invalid time format: ${timeSlot}. Use HH:MM-HH:MM format`
            );
          }
        }

        if (errors.length > 0) {
          toast.error(errors.join("\n"));
          setLoading(false);
          return;
        }

        // Build room entries for each day and time slot combination
        for (const day of selectedDays) {
          for (const timeSlot of timeSlots.filter((slot) => slot.trim())) {
            roomsToCreate.push({
              roomNumber: formData.roomNumber.trim().toUpperCase(),
              day,
              duration: timeSlot.trim(),
              status: formData.status,
            });
          }
        }

        if (roomsToCreate.length === 0) {
          toast.error("Please add at least one time slot");
          setLoading(false);
          return;
        }

        // Create rooms sequentially to avoid race conditions
        let successCount = 0;
        let failedRooms = [];

        for (const room of roomsToCreate) {
          try {
            await api.post("/rooms", room);
            successCount++;
          } catch (error) {
            console.error("Error creating room:", error);
            const errorMessage =
              error.response?.data?.message || "Unknown error";
            // Format the error message to be more user-friendly
            let formattedError = errorMessage;
            if (errorMessage.includes("Time slot conflict")) {
              formattedError = errorMessage;
            }
            failedRooms.push(
              `${room.roomNumber} (${room.day}, ${room.duration}): ${formattedError}`
            );
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} room(s)!`);
          if (failedRooms.length > 0) {
            // Show detailed failures and keep the form so user can retry or adjust
            console.warn("Some rooms failed to create:", failedRooms);
            toast.error(
              `${failedRooms.length} room(s) failed. See console for details.`
            );
            // Do not reset the form entirely so user can fix issues and retry
            if (onRoomCreated) {
              await onRoomCreated();
            }
          } else {
            // All created successfully
            allCreated = true;
            if (onRoomCreated) {
              await onRoomCreated();
            }
            // reset form only when everything succeeded
            allCreated = true;
            resetForm();
          }
        } else if (failedRooms.length > 0) {
          toast.error("Failed to create rooms:\n" + failedRooms.join("\n"));
        }
      } else {
        // Create single room entry
        const durationRegex = /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
        if (!durationRegex.test(formData.duration)) {
          toast.error(
            "Duration must be in format HH:MM-HH:MM (e.g., 9:00-10:00)"
          );
          setLoading(false);
          return;
        }

        // Normalize the room data
        const normalizedData = {
          ...formData,
          roomNumber: formData.roomNumber.trim().toUpperCase(),
          day: formData.day,
          duration: formData.duration.trim(),
          status: formData.status,
        };

        try {
          await api.post("/rooms", normalizedData);
          toast.success("Room created successfully!");
          resetForm();
          if (onRoomCreated) {
            onRoomCreated();
          }
        } catch (error) {
          console.error("Error creating room:", error);
          const errorMessage =
            error.response?.data?.message || "Failed to create room";
          
          // Display a more user-friendly error message
          if (errorMessage.includes("Time slot conflict")) {
            toast.error(errorMessage, { duration: 6000 });
          } else {
            toast.error(errorMessage);
          }
        }
      }

      // Reset form
      // Only reset here if all entries were created (allCreated flag) or we're not in createMultiple mode
      if (!createMultiple || allCreated) {
        resetForm();
        if (onRoomCreated) {
          onRoomCreated();
        }
      }
    } catch (error) {
      console.error("Error creating room:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create room";
      const validationErrors = error.response?.data?.errors;

      if (validationErrors && validationErrors.length > 0) {
        toast.error(validationErrors[0].msg);
      } else if (errorMessage.includes("Time slot conflict")) {
        toast.error(errorMessage, { duration: 6000 });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      roomNumber: "",
      day: "Monday",
      duration: "",
      status: "Vacant",
      authorizedAdmins: [],
    });
    setCreateMultiple(false);
    setSelectedDays([]);
    setTimeSlots([""]);
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      roomNumber: "",
      day: "Monday",
      duration: "",
      status: "Vacant",
      authorizedAdmins: [],
    });
    setCreateMultiple(false);
    setSelectedDays([]);
    setTimeSlots([""]);
    setShowForm(false);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, ""]);
  };

  const removeTimeSlot = (index) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index, value) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[index] = value;
    setTimeSlots(newTimeSlots);
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  if (!showForm) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Room Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add new rooms to the system
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Room</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Add New Room
        </h3>
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Create Multiple Toggle */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <input
            type="checkbox"
            id="createMultiple"
            checked={createMultiple}
            onChange={(e) => setCreateMultiple(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="createMultiple"
            className="text-sm font-medium text-blue-800 dark:text-blue-200"
          >
            Create multiple time slots for this room
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Room Number *
            </label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              required
              placeholder="e.g., R101, A205, 300"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Day *
            </label>
            {createMultiple ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <label
                    key={day}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedDays.includes(day)
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.slice(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {createMultiple ? "Time Slots *" : "Duration *"}
            </label>
            {createMultiple ? (
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={slot}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="flex-1 input-field"
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
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Time Slot</span>
                </button>
              </div>
            ) : (
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select duration</option>
                <option value="9:00-10:00">9:00-10:00</option>
                <option value="10:00-11:00">10:00-11:00</option>
                <option value="11:30-12:30">11:30-12:30</option>
                <option value="12:30-1:30">12:30-1:30</option>
                <option value="2:30-3:30">2:30-3:30</option>
                <option value="3:30-4:30">3:30-4:30</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
            </select>
          </div>
        </div>

        {/* Multiple Room Creation UI */}
        {createMultiple && (
          <div className="space-y-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create Multiple Time Slots
            </h4>

            {/* Days Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Days *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <label
                    key={day}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedDays.includes(day)
                        ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.slice(0, 3)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Time Slots *
              </label>
              <div className="space-y-2">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <select
                      value={slot}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="flex-1 input-field"
                    >
                      <option value="">Select duration</option>
                      <option value="9:00-10:00">9:00-10:00</option>
                      <option value="10:00-11:00">10:00-11:00</option>
                      <option value="11:30-12:30">11:30-12:30</option>
                      <option value="12:30-1:30">12:30-1:30</option>
                      <option value="2:30-3:30">2:30-3:30</option>
                      <option value="3:30-4:30">3:30-4:30</option>
                    </select>
                    {timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">Add Time Slot</span>
                </button>
              </div>
            </div>

            {/* Preview */}
            {selectedDays.length > 0 &&
              timeSlots.some((slot) => slot.trim()) && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                    Preview: Will create{" "}
                    {selectedDays.length *
                      timeSlots.filter((slot) => slot.trim()).length}{" "}
                    room entries
                  </p>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {selectedDays
                      .map((day) =>
                        timeSlots
                          .filter((slot) => slot.trim())
                          .map(
                            (slot) =>
                              `${formData.roomNumber} - ${day} - ${slot}`
                          )
                          .join(", ")
                      )
                      .join(", ")}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Admin selection removed per requirements */}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Create Room
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary flex-1 flex items-center justify-center"
          >
            <X className="h-5 w-5 mr-2" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoomForm;
