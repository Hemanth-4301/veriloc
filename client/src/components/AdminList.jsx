import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Users, Edit, Trash2, Loader2 } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner.jsx";

const AdminList = ({ refreshSignal }) => {
  const { getAdmins, updateAdmin, deleteAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, [refreshSignal]);

  const fetchAdmins = async () => {
    setLoading(true);
    const result = await getAdmins();
    if (result.success) {
      setAdmins(result.data.admins);
    }
    setLoading(false);
  };

  const handleEdit = (admin) => {
    setEditingId(admin._id);
    setEditData({
      username: admin.username,
      email: admin.email,
      fingerprintID: admin.fingerprintID,
    });
  };

  const handleSave = async (adminId) => {
    const result = await updateAdmin(adminId, editData);
    if (result.success) {
      setEditingId(null);
      setEditData({});
      fetchAdmins();
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (adminId) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      const result = await deleteAdmin(adminId);
      if (result.success) {
        fetchAdmins();
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admins..." />;
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:space-x-2 mb-4 sm:mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Admin List
          </h2>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 sm:ml-2">
          ({admins.length} {admins.length === 1 ? 'admin' : 'admins'})
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, email, or fingerprint ID..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        />
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No admins found
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Create your first admin using the form above.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-4">
            {admins
              .filter((a) => {
                const q = search.toLowerCase();
                return (
                  a.username.toLowerCase().includes(q) ||
                  a.email.toLowerCase().includes(q) ||
                  String(a.fingerprintID).includes(q)
                );
              })
              .map((admin) => (
                <div
                  key={admin._id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                >
                  {/* Admin Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {admin.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        {editingId === admin._id ? (
                          <input
                            type="text"
                            value={editData.username}
                            onChange={(e) =>
                              setEditData({ ...editData, username: e.target.value })
                            }
                            className="input-field text-sm font-medium"
                          />
                        ) : (
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {admin.username}
                          </h3>
                        )}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            admin.isSuperAdmin
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Mobile Actions */}
                    <div className="flex items-center space-x-2">
                      {editingId === admin._id ? (
                        <>
                          <button
                            onClick={() => handleSave(admin._id)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(admin)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Admin Details */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Email:</span>
                      {editingId === admin._id ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="input-field text-sm ml-2 inline-block w-48"
                        />
                      ) : (
                        <span className="ml-2 text-gray-900 dark:text-gray-100">
                          {admin.email}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Fingerprint ID:</span>
                      {editingId === admin._id ? (
                        <input
                          type="number"
                          min="1000"
                          max="9999"
                          value={editData.fingerprintID}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              fingerprintID: parseInt(e.target.value),
                            })
                          }
                          className="input-field text-sm ml-2 inline-block w-24"
                        />
                      ) : (
                        <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
                          {admin.fingerprintID}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fingerprint ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {admins
                  .filter((a) => {
                    const q = search.toLowerCase();
                    return (
                      a.username.toLowerCase().includes(q) ||
                      a.email.toLowerCase().includes(q) ||
                      String(a.fingerprintID).includes(q)
                    );
                  })
                  .map((admin) => (
                  <tr
                    key={admin._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === admin._id ? (
                        <input
                          type="text"
                          value={editData.username}
                          onChange={(e) =>
                            setEditData({ ...editData, username: e.target.value })
                          }
                          className="input-field text-sm"
                        />
                      ) : (
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-sm">
                              {admin.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {admin.username}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === admin._id ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) =>
                            setEditData({ ...editData, email: e.target.value })
                          }
                          className="input-field text-sm"
                        />
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">
                          {admin.email}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === admin._id ? (
                        <input
                          type="number"
                          min="1000"
                          max="9999"
                          value={editData.fingerprintID}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              fingerprintID: parseInt(e.target.value),
                            })
                          }
                          className="input-field text-sm"
                        />
                      ) : (
                        <span className="font-mono text-gray-900 dark:text-gray-100">
                          {admin.fingerprintID}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.isSuperAdmin
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}
                      >
                        {admin.isSuperAdmin ? "Super Admin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === admin._id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(admin._id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-1 rounded transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminList;
