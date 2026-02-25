import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserCog,
  Calendar,
  Briefcase,
  CalendarCheck,
  Shield,
} from 'lucide-react';

const SidebarTabs = ({ activeTab, setActiveTab, tabs, isOpen, onClose }) => {
  const getTabIcon = (tabId) => {
    const iconMap = {
      dashboard: LayoutDashboard,
      account: UserCog,
      calendar: Calendar,
      cases: Briefcase,
      sync: CalendarCheck,
      personal: LayoutDashboard,
      manager: LayoutDashboard,
      admin: Shield,
      users: UserCog,
    };
    return iconMap[tabId] || LayoutDashboard;
  };

  return (
    <div
      className={`sidebar-panel
        fixed left-0 top-16 h-[calc(100vh-64px)] w-64
        bg-navy-light/95 backdrop-blur-xl
        border-r border-purple-accent/20 shadow-2xl z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      <div className="flex flex-col h-full p-4">
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {tabs.map((tab, index) => {
            const IconComponent = getTabIcon(tab.id);
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setActiveTab(tab.id);
                  onClose();
                }}
                className={`
                  relative w-full flex items-center space-x-3 px-4 py-3 rounded-xl
                  transition-all duration-300 backdrop-blur-sm min-h-touch
                  ${isActive
                    ? 'bg-gradient-to-r from-purple-accent to-cyan-accent text-white shadow-lg shadow-purple-accent/25'
                    : 'text-gray-300 hover:bg-glass-light/50 hover:text-white'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute left-0 w-1 h-8 bg-cyan-accent rounded-r-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={{ rotate: isActive ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <IconComponent
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-purple-accent'}`}
                  />
                </motion.div>

                <span className="font-medium text-sm">{tab.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="pt-4 flex-shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent via-purple-accent/30 to-transparent mb-3" />
          <p className="text-xs text-gray-500 text-center">Service Engineer Planner v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarTabs;
