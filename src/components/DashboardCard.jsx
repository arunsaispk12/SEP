import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  chartType = 'bar',
  chartData,
  color = 'purple',
  delay = 0,
  className = ''
}) => {
  const getColorScheme = (color) => {
    const schemes = {
      purple: {
        gradient: 'from-purple-accent to-purple-600',
        chartColor: '#7B61FF',
        glow: 'shadow-purple-accent/25'
      },
      cyan: {
        gradient: 'from-cyan-accent to-cyan-400',
        chartColor: '#00D4FF',
        glow: 'shadow-cyan-accent/25'
      },
      green: {
        gradient: 'from-green-500 to-emerald-400',
        chartColor: '#10b981',
        glow: 'shadow-green-500/25'
      },
      orange: {
        gradient: 'from-orange-500 to-yellow-400',
        chartColor: '#f59e0b',
        glow: 'shadow-orange-500/25'
      },
      red: {
        gradient: 'from-red-500 to-pink-400',
        chartColor: '#ef4444',
        glow: 'shadow-red-500/25'
      }
    };
    return schemes[color] || schemes.purple;
  };

  const colorScheme = getColorScheme(color);

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={chartData}>
              <Bar
                dataKey="value"
                fill={colorScheme.chartColor}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={60}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={15}
                outerRadius={25}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || colorScheme.chartColor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={colorScheme.chartColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={60}>
            <AreaChart data={chartData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={colorScheme.chartColor}
                fill={`url(#gradient-${color})`}
                strokeWidth={2}
              />
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorScheme.chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={colorScheme.chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 20px 40px rgba(123, 97, 255, 0.15)`
      }}
      className={`bg-navy-light/80 backdrop-blur-xl rounded-2xl p-6 border border-purple-accent/20 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorScheme.gradient} shadow-lg ${colorScheme.glow}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-2xl font-bold text-white mt-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData && chartData.length > 0 && (
        <div className="mt-4">
          {renderChart()}
        </div>
      )}

      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-accent/20 via-cyan-accent/20 to-purple-accent/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.div>
  );
};

export default DashboardCard;