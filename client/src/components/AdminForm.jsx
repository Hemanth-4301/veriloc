import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";

const AdminForm = ({ onAdminCreated }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    fingerprintID: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register({
      ...formData,
      fingerprintID: parseInt(formData.fingerprintID),
    });

    if (result.success) {
      setFormData({
        username: "",
        password: "",
        email: "",
        fingerprintID: "",
      });
      if (onAdminCreated) onAdminCreated();
    }

    setLoading(false);
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4 sm:mb-6">
        <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
          Add New Admin
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* First Row - Username and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="w-full">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter username"
              disabled={loading}
            />
          </div>

          <div className="w-full">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="Enter email"
              disabled={loading}
            />
          </div>
        </div>

        {/* Second Row - Password and Fingerprint ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="w-full">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password *
            </label>
            <div className="relative w-full">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field w-full pr-12"
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="w-full">
            <label
              htmlFor="fingerprintID"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Fingerprint ID *
            </label>
            <input
              id="fingerprintID"
              name="fingerprintID"
              type="number"
              required
              min="1000"
              max="9999"
              value={formData.fingerprintID}
              onChange={handleChange}
              className="input-field w-full"
              placeholder="1000-9999"
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Fingerprint Setup Instructions
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            1. Enroll the fingerprint on the R307 sensor first
            <br />
            2. Note the 4-digit ID displayed on the OLED screen
            <br />
            3. Enter that ID in the Fingerprint ID field above
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Admin...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default React.memo(AdminForm);
