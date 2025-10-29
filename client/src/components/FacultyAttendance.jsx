import React, { useState } from "react";
import {
  Calendar,
  Download,
  Users,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
} from "lucide-react";
import api from "../services/api.js";
import toast from "react-hot-toast";

const FacultyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendance?date=${selectedDate}`);
      setAttendance(response.data.attendance);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Fetch attendance error:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch attendance"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const response = await api.get(
        `/attendance/export-pdf?date=${selectedDate}`,
        {
          responseType: "blob",
        }
      );

      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `faculty-attendance-${selectedDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Attendance exported successfully!");
    } catch (error) {
      console.error("Export PDF error:", error);
      toast.error("Failed to export attendance");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Faculty Attendance Tracker
        </h2>

        {/* Date Selection and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="pl-10 input-field w-full"
              />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <button
              onClick={fetchAttendance}
              disabled={loading}
              className="btn-primary flex items-center space-x-2 px-4 py-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              <span>{loading ? "Loading..." : "Load Attendance"}</span>
            </button>

            {attendance.length > 0 && (
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50"
              >
                {exporting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span>{exporting ? "Exporting..." : "Export PDF"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Faculty
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.total}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Present
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.present}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center space-x-3">
                <UserX className="h-8 w-8 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Absent
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.absent}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Attendance %
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.presentPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {attendance.length > 0 && (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                {/* Desktop Table View */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Faculty Name
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Fingerprint ID
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Activities
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        First Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {attendance.map((record, index) => (
                      <tr
                        key={record.adminId}
                        className={`${
                          index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800"
                        }`}
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {index + 1}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.username}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {record.email}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {record.fingerprintID}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === "Present"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {record.activityCount}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {record.firstActivity
                            ? new Date(
                                record.firstActivity
                              ).toLocaleTimeString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {attendance.map((record, index) => (
                    <div
                      key={record.adminId}
                      className={`p-4 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800"
                      }`}
                    >
                      {/* Header with Name and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              #{index + 1}
                            </span>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {record.username}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {record.email}
                          </p>
                        </div>
                        <span
                          className={`ml-2 px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${
                            record.status === "Present"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Fingerprint ID
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {record.fingerprintID}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Activities
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {record.activityCount}
                          </p>
                        </div>
                        {record.firstActivity && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              First Activity
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {new Date(
                                record.firstActivity
                              ).toLocaleTimeString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && attendance.length === 0 && !stats && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Attendance Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select a date and click "Load Attendance" to view faculty
              attendance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyAttendance;
