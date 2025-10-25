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
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: addKeyframes }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/10 dark:bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-black/20 dark:border-white/20 transition-all duration-300 hover:shadow-black/10 dark:hover:shadow-white/10 hover:bg-black/15 dark:hover:bg-white/15">
          {/* Header */}
          <div className="bg-white/20 dark:bg-black/20 p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black/10 dark:bg-white/10 rounded-2xl backdrop-blur-sm mb-4 border border-black/20 dark:border-white/20">
              <Shield className="h-8 w-8 text-black dark:text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black dark:text-white mb-1">
              Welcome Back
            </h1>
            <p className="text-black/80 dark:text-white/80 text-sm">
              Sign in to your VERILOC admin account
            </p>
          </div>
          
          {/* Admin Disclaimer Banner */}
          <div className="bg-black/5 dark:bg-white/5 border-t border-b border-black/20 dark:border-white/20 px-6 py-3">
            <p className="text-center text-black/80 dark:text-white/80 text-sm font-medium">
              🔒 This portal is exclusively for authorized administrators only
            </p>
          </div>
          
          {/* Form container */}
          <div className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-black dark:text-white mb-2"
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
                  className="w-full px-4 py-2.5 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 focus:border-black dark:focus:border-white transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-black dark:text-white mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pr-10 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-black/20 dark:border-white/20 rounded-lg text-black dark:text-white placeholder-black/60 dark:placeholder-white/60 focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 focus:border-black dark:focus:border-white transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
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
                  className="h-4 w-4 text-black dark:text-white focus:ring-black dark:focus:ring-white border-black/20 dark:border-white/20 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-black dark:text-white"
                >
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black/10 dark:bg-white/10 backdrop-blur-sm hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 transform hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-black/50 dark:focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed border border-black/20 dark:border-white/20"
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
