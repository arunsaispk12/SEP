import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserCog,
  Calendar,
  Briefcase,
  CalendarCheck
} from 'lucide-react';

const SidebarTabs = ({ activeTab, setActiveTab, tabs }) => {
  const getTabIcon = (tabId) => {
    const iconMap = {
      dashboard: LayoutDashboard,
      account: UserCog,
      calendar: Calendar,
      cases: Briefcase,
      sync: CalendarCheck,
      personal: LayoutDashboard,
      manager: LayoutDashboard,
      admin: UserCog,
      users: UserCog,
    };

    return iconMap[tabId] || LayoutDashboard;
  };

  return (
    <div className="fixed left-0 top-16 h-full w-64 bg-navy-light/95 backdrop-blur-xl border-r border-purple-accent/20 shadow-2xl z-40">
      <div className="p-4">
        <nav className="space-y-2">
          {tabs.map((tab, index) => {
            const IconComponent = getTabIcon(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-accent to-cyan-accent text-white shadow-lg shadow-purple-accent/25'
                    : 'text-gray-300 hover:bg-glass-light/50 hover:text-white'
                }`}
              >
                <motion.div
                  animate={{ rotate: isActive ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {React.createElement(IconComponent, {
                    className: `w-5 h-5 ${isActive ? 'text-white' : 'text-purple-accent'}`
                  })}
                </motion.div>

                <span className="font-medium">{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 w-1 h-8 bg-cyan-accent rounded-r-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="h-px bg-gradient-to-r from-transparent via-purple-accent/30 to-transparent mb-4"></div>
        <p className="text-xs text-gray-500 text-center">
          Service Engineer Planner v1.0
        </p>
      </div>
    </div>
  );
};

export default SidebarTabs;