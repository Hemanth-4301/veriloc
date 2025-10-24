"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
    <div className="relative w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(0,0,0,0.1) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(0,0,0,0.1) 2%, transparent 0%)`,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <motion.div
            className="text-center lg:text-left order-2 lg:order-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUpVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm mb-8 lg:mb-12"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Intelligent Campus Management
              </span>
            </motion.div>

            {/* Title */}
            <motion.div variants={itemVariants} className="mb-8 lg:mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-serif font-bold text-gray-900 dark:text-white mb-4 lg:mb-6 tracking-tight">
                <span className="block bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-white dark:via-blue-200 dark:to-white bg-clip-text text-transparent">
                  VERILOC
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-light text-gray-600 dark:text-gray-300 mt-2 lg:mt-4">
                  Smart Classroom
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-light text-gray-600 dark:text-gray-300">
                  Management
                </span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 lg:mb-12 max-w-4xl mx-auto lg:mx-0 font-light leading-relaxed"
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
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
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
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300"
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
              className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 backdrop-blur-sm shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  System Status: Operational
                </span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Updated just now
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column */}
          <motion.div
            className="order-1 lg:order-2 [perspective:1000px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="relative">
              {/* Main Card */}
              <motion.div
                className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-2xl dark:shadow-gray-900/50 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transform-gpu"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                animate={{
                  rotateY: mousePosition.x / 40,
                  rotateX: -mousePosition.y / 40,
                  y: -8,
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          Live Dashboard
                        </h3>
                        <p className="text-blue-100 text-sm">
                          Real-time monitoring
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-blue-100 text-sm font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        24
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Rooms
                      </div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        8
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Available
                      </div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        16
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
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
                        color: "text-blue-600",
                      },
                      {
                        icon: Zap,
                        text: "Real-time Updates",
                        color: "text-emerald-600",
                      },
                      {
                        icon: Eye,
                        text: "Live Monitoring",
                        color: "text-purple-600",
                      },
                      {
                        icon: Activity,
                        text: "Analytics & Reports",
                        color: "text-indigo-600",
                      },
                    ].map((feature, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                        variants={fadeInUpVariants}
                      >
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600`}
                        >
                          <feature.icon
                            className={`w-4 h-4 ${feature.color}`}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {feature.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Activity Status */}
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          System Active
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Last updated 2 min ago
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <div
                        className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                  x: [0, 10, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full opacity-20 blur-xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  rotate: [360, 180, 0],
                  x: [0, -10, 0],
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                className="absolute top-1/2 -right-8 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-15 blur-xl"
                animate={{
                  scale: [1, 1.3, 1],
                  x: [0, 15, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute top-1/4 -left-8 w-28 h-28 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full opacity-15 blur-xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  x: [-15, 0, -15],
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
};

export default Hero;
