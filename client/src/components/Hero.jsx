"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner.jsx";
import {
  BookOpen,
  ArrowRight,
  Activity,
  Clock,
  Users,
  CheckCircle,
  BarChart3,
  Shield,
  Zap,
  Eye,
} from "lucide-react";

const Hero = () => {
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoomStats = async () => {
      try {
        const response = await fetch(
          "https://veriloc-api.onrender.com/api/rooms"
        );
        const data = await response.json();
        const roomStats = {
          total: data.rooms.length,
          available: data.rooms.filter((room) => room.status === "Vacant")
            .length,
          occupied: data.rooms.filter((room) => room.status === "Occupied")
            .length,
        };
        setStats(roomStats);
      } catch (error) {
        console.error("Failed to fetch room stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchRoomStats();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Blue gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-transparent to-blue-200/30 dark:from-blue-900/20 dark:via-transparent dark:to-blue-800/10"></div>
        
        {/* Animated blue orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300/5 rounded-full blur-3xl"></div>
        
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(0,0,0,0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0,0,0,0.1) 2%, transparent 0%)`,
              backgroundSize: "100px 100px",
            }}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glowing-border {
          animation: glowing-border 4s ease-in-out infinite !important;
        }
        
        @keyframes glowing-border {
          0% {
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4), 0 0 16px rgba(59, 130, 246, 0.3), 0 0 24px rgba(59, 130, 246, 0.2) !important;
          }
          25% {
            box-shadow: 0 0 8px rgba(147, 51, 234, 0.4), 0 0 16px rgba(147, 51, 234, 0.3), 0 0 24px rgba(147, 51, 234, 0.2) !important;
          }
          50% {
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4), 0 0 16px rgba(59, 130, 246, 0.3), 0 0 24px rgba(59, 130, 246, 0.2) !important;
          }
          75% {
            box-shadow: 0 0 8px rgba(168, 85, 247, 0.4), 0 0 16px rgba(168, 85, 247, 0.3), 0 0 24px rgba(168, 85, 247, 0.2) !important;
          }
          100% {
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4), 0 0 16px rgba(59, 130, 246, 0.3), 0 0 24px rgba(59, 130, 246, 0.2) !important;
          }
        }
        
        .dark .glowing-border {
          animation: glowing-border-dark 4s ease-in-out infinite !important;
        }
        
        @keyframes glowing-border-dark {
          0% {
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.5), 0 0 16px rgba(99, 102, 241, 0.4), 0 0 24px rgba(99, 102, 241, 0.3) !important;
          }
          25% {
            box-shadow: 0 0 8px rgba(168, 85, 247, 0.5), 0 0 16px rgba(168, 85, 247, 0.4), 0 0 24px rgba(168, 85, 247, 0.3) !important;
          }
          50% {
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.5), 0 0 16px rgba(99, 102, 241, 0.4), 0 0 24px rgba(99, 102, 241, 0.3) !important;
          }
          75% {
            box-shadow: 0 0 8px rgba(147, 51, 234, 0.5), 0 0 16px rgba(147, 51, 234, 0.4), 0 0 24px rgba(147, 51, 234, 0.3) !important;
          }
          100% {
            box-shadow: 0 0 8px rgba(99, 102, 241, 0.5), 0 0 16px rgba(99, 102, 241, 0.4), 0 0 24px rgba(99, 102, 241, 0.3) !important;
          }
        }
      ` }} />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <motion.div
            className="text-center lg:text-left order-1 lg:order-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 backdrop-blur-sm mb-8 lg:mb-12"
            >
              <div className="w-2 h-2 bg-black/60 dark:bg-white/60 rounded-full" />
              <span className="text-sm font-medium text-black dark:text-white">
                Intelligent Campus Management
              </span>
            </motion.div>

            {/* Title */}
            <motion.div variants={itemVariants} className="mb-8 lg:mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-serif font-bold text-black dark:text-white mb-4 lg:mb-6 tracking-tight">
                <span className="block text-black dark:text-white">
                  VERILOC
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-light text-black dark:text-white mt-2 lg:mt-4">
                  Smart Classroom
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-light text-black dark:text-white">
                  Management
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl lg:text-2xl text-black dark:text-white mb-8 lg:mb-12 max-w-4xl mx-auto lg:mx-0 font-light leading-relaxed"
            >
              Transform your educational space with intelligent occupancy
              monitoring, real-time analytics, and predictive insights that
              enhance learning experiences.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={containerVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 lg:mb-16"
            >
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => {
                  const el = document.getElementById("room-search");
                  if (el)
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Explore Rooms</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 border-2 border-black/30 dark:border-white/30 text-black dark:text-white font-semibold rounded-lg hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/50 dark:hover:border-white/50 transition-all duration-300"
                onClick={() => navigate("/about")}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Learn More</span>
                </div>
              </motion.button>
            </motion.div>

            {/* Status Indicator */}
            <motion.div
              variants={fadeInUpVariants}
              className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-black/60 dark:bg-white/60 rounded-full" />
                <span className="text-sm font-medium text-black dark:text-white">
                  System Status: Operational
                </span>
              </div>
              <div className="w-px h-4 bg-black/30 dark:bg-white/30" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-black/70 dark:text-white/70" />
                <span className="text-sm text-black/70 dark:text-white/70">
                  Updated just now
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            className="order-2 lg:order-2 [perspective:1000px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative">
              {/* Main Card */}
              <motion.div
                className="relative bg-black/5 dark:bg-white/5 backdrop-blur-3xl rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden transform-gpu glowing-border"
                style={{
                  animation: 'glowing-border 4s ease-in-out',
                }}
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                {/* Card Header */}
                <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl border-b border-black/10 dark:border-white/10 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-black/20 dark:border-white/20">
                        <BarChart3 className="w-6 h-6 text-black dark:text-white" />
                      </div>
                      <div>
                        <h3 className="text-black dark:text-white font-semibold">
                          Live Dashboard
                        </h3>
                        <p className="text-black/70 dark:text-white/70 text-sm">
                          Real-time monitoring
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-black/60 dark:bg-white/60 rounded-full" />
                      <span className="text-black/80 dark:text-white/80 text-sm font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-black/20 dark:border-white/20">
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {statsLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-pulse">...</div>
                          </div>
                        ) : (
                          stats.total
                        )}
                      </div>
                      <div className="text-xs text-black/70 dark:text-white/70 uppercase tracking-wider">
                        Rooms
                      </div>
                    </div>
                    <div className="text-center p-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-black/20 dark:border-white/20">
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {statsLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-pulse">...</div>
                          </div>
                        ) : (
                          stats.available
                        )}
                      </div>
                      <div className="text-xs text-black/70 dark:text-white/70 uppercase tracking-wider">
                        Available
                      </div>
                    </div>
                    <div className="text-center p-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-black/20 dark:border-white/20">
                      <div className="text-2xl font-bold text-black dark:text-white">
                        {statsLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-pulse">...</div>
                          </div>
                        ) : (
                          stats.occupied
                        )}
                      </div>
                      <div className="text-xs text-black/70 dark:text-white/70 uppercase tracking-wider">
                        Occupied
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        icon: Shield,
                        text: "Secure Access Control",
                      },
                      {
                        icon: Zap,
                        text: "Real-time Updates",
                      },
                      {
                        icon: Eye,
                        text: "Live Monitoring",
                      },
                      {
                        icon: Activity,
                        text: "Analytics & Reports",
                      },
                    ].map((feature, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-black/20 dark:border-white/20"
                        variants={fadeInUpVariants}
                      >
                        <div
                          className={`p-2 rounded-lg bg-black/10 dark:bg-white/10 backdrop-blur-sm border border-black/20 dark:border-white/20`}
                        >
                          <feature.icon
                            className={`w-4 h-4 text-black dark:text-white`}
                          />
                        </div>
                        <span className="text-sm font-medium text-black dark:text-white">
                          {feature.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Activity Status */}
                  <div className="flex items-center justify-between p-3 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-xl border border-black/20 dark:border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-black/10 dark:bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-black/20 dark:border-white/20">
                        <Activity className="w-4 h-4 text-black dark:text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-black dark:text-white">
                          System Active
                        </div>
                        <div className="text-xs text-black/70 dark:text-white/70">
                          Last updated 2 min ago
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-black/60 dark:bg-white/60 rounded-full" />
                      <div
                        className="w-2 h-2 bg-black/60 dark:bg-white/60 rounded-full"
                      />
                      <div
                        className="w-2 h-2 bg-black/60 dark:bg-white/60 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 bg-black/10 dark:bg-white/10 rounded-full opacity-30 blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                  x: [0, 10, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: 0,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute -bottom-6 -left-6 w-16 h-16 bg-black/10 dark:bg-white/10 rounded-full opacity-30 blur-2xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                  x: [0, -10, 0],
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: 0,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute top-1/2 -right-8 w-24 h-24 bg-black/10 dark:bg-white/10 rounded-full opacity-20 blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  x: [0, 15, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: 0,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute top-1/4 -left-8 w-28 h-28 bg-black/10 dark:bg-white/10 rounded-full opacity-20 blur-2xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  x: [-15, 0, -15],
                }}
                transition={{
                  duration: 9,
                  repeat: 0,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
};

export default Hero;
