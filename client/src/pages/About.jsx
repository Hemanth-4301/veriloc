import React from "react";
import { 
  Users, 
  Target, 
  Award, 
  Globe, 
  Shield, 
  Zap,
  Building2,
  Heart,
  Lightbulb,
  CheckCircle
} from "lucide-react";

const About = () => {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-gray-600" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with real-time monitoring"
    },
    {
      icon: <Zap className="w-8 h-8 text-gray-600" />,
      title: "Real-time Updates",
      description: "Instant occupancy tracking and notifications"
    },
    {
      icon: <Globe className="w-8 h-8 text-gray-600" />,
      title: "Smart Analytics",
      description: "AI-powered insights and predictive analytics"
    },
    {
      icon: <Users className="w-8 h-8 text-gray-600" />,
      title: "User-Friendly",
      description: "Intuitive interface for all user types"
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative pt-14 px-4 sm:px-6 lg:px-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gray-200/20 dark:bg-gray-600/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gray-200/20 dark:bg-gray-600/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200/50 bg-gray-50/80 dark:border-gray-500/30 dark:bg-gray-500/10 backdrop-blur-sm mb-8">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Next-Generation Campus Technology
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              About <span className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 bg-clip-text text-transparent">VERILOC</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Revolutionizing classroom occupancy monitoring with cutting-edge technology, 
              empowering educational institutions to optimize spaces and enhance learning experiences.
            </p>
            
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/80 dark:bg-gray-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium mb-6">
                <Target className="w-4 h-4" />
                Our Mission
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
                Transforming Educational <span className="text-gray-600">Spaces</span>
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                We're on a mission to transform educational spaces through intelligent occupancy monitoring, 
                creating safer, more efficient, and data-driven learning environments that adapt to modern educational needs.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-gray-50/80 dark:bg-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <CheckCircle className="w-6 h-6 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Real-time Tracking</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Instant classroom utilization monitoring with precise occupancy data
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-gray-50/80 dark:bg-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <CheckCircle className="w-6 h-6 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Smart Analytics</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      AI-powered predictive analytics for optimal space utilization
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-gray-50/80 dark:bg-gray-800/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <CheckCircle className="w-6 h-6 text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Seamless Integration</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Easy integration with existing campus management systems
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4   rounded-3xl blur-2xl"></div>
              <div className="relative bg-gray-900 rounded-3xl p-8 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8"></div>
                <div className="relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-6 w-fit">
                    <Building2 className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Smart Campus Solutions</h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Empowering educational institutions with data-driven insights 
                    for better space management, enhanced student experience, and operational excellence.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span>Live Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>24/7 Support</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
