import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Sun, Moon, User } from 'lucide-react';

const Navbar = ({ user, logout, isDark, toggleTheme }) => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-glass-dark/80 backdrop-blur-xl border-b border-purple-accent/20 shadow-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section - App Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-accent to-cyan-accent rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SEP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-accent to-cyan-accent bg-clip-text text-transparent">
                  Service Engineer Planner
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">
                  Manage schedules for field service engineers across multiple locations
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-glass-light/50 hover:bg-glass-light/70 transition-all duration-300 backdrop-blur-sm border border-purple-accent/20 hover:border-purple-accent/40"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-purple-accent" />
              )}
            </motion.button>

            {/* User Avatar */}
            <div className="flex items-center space-x-3 p-2 rounded-xl bg-glass-light/30 backdrop-blur-sm border border-purple-accent/20">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-accent to-cyan-accent rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user.avatar || '👨‍🔧'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-200">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-red-500/25 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Animated bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-accent/50 to-transparent"></div>
    </motion.nav>
  );
};

export default Navbar;