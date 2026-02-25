import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Sun, Moon, Menu, X } from 'lucide-react';

const Navbar = ({ user, logout, isDark, toggleTheme, sidebarOpen, onMenuToggle }) => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-glass-dark/80 backdrop-blur-xl border-b border-purple-accent/20 shadow-xl"
    >
      <div className="flex justify-between items-center h-16 px-4 sm:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Hamburger button - mobile only */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onMenuToggle}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-glass-light/50 border border-purple-accent/20 text-gray-300 hover:text-white hover:bg-glass-light/70 transition-all duration-200 flex-shrink-0"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>

          {/* Logo + Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-accent to-cyan-accent rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white font-bold text-sm">SEP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-accent to-cyan-accent bg-clip-text text-transparent leading-tight">
                Service Engineer Planner
              </h1>
              <p className="text-xs text-gray-400 hidden md:block">
                Manage schedules for field service engineers
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-glass-light/50 hover:bg-glass-light/70 transition-all duration-300 border border-purple-accent/20 hover:border-purple-accent/40"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-purple-accent" />
            )}
          </motion.button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2 p-2 rounded-xl bg-glass-light/30 backdrop-blur-sm border border-purple-accent/20">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-accent to-cyan-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {user.avatar || '👨‍🔧'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-200 max-w-[100px] truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-2 min-h-touch bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Logout</span>
          </motion.button>
        </div>
      </div>

      {/* Animated bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-accent/50 to-transparent" />
    </motion.nav>
  );
};

export default Navbar;
