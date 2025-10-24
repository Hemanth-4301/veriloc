import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Eye, EyeOff, Loader2, Shield, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      toast.success("Login successful!");
      navigate("/admin");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Add animation keyframes
  const addKeyframes = `
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 7s infinite;
    }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
    .animation-delay-6000 { animation-delay: 6s; }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: addKeyframes }} />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10 dark:opacity-5">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-secondary-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary-500 to-secondary-600 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome Back
            </h1>
            <p className="text-white/90 text-sm">
              Sign in to your VERILOC admin account
            </p>
          </div>
          
          {/* Form container */}
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      toast('Contact administrator to reset password', { icon: 'ℹ️' });
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pr-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                >
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-600 hover:from-primary-600 hover:to-secondary-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 transform hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8">
              <details className="group">
                <summary className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Demo Credentials</span>
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-2 p-3 bg-white/50 dark:bg-gray-800/30 rounded-lg text-sm">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Super Admin:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">admin</code>
                        <span className="text-gray-400">/</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">admin123</code>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Regular Admin:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">john_doe</code>
                        <span className="text-gray-400">/</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">password123</code>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Footer */}
            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                Don't have an account?{' '}
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Please contact the system administrator for account creation', { icon: 'ℹ️' });
                  }}
                >
                  Request access
                </a>
              </p>
              <div className="mt-4 flex justify-center space-x-4">
                <a href="#" className="text-xs text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                  Terms
                </a>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <a href="#" className="text-xs text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated background elements for bottom of screen */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none z-0"></div>
    </div>
  );
};

export default Login;
