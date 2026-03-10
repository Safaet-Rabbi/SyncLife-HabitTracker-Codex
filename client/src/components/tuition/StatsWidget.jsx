import React from 'react';
import { useSelector } from 'react-redux';
import { Users, CalendarDays } from 'lucide-react';

const StatsWidget = () => {
  const { dashboardStats, isLoading, error } = useSelector((state) => state.tuition);

  if (isLoading) return <div className="text-center p-4 dark:text-gray-200">Loading stats...</div>;
  if (error) return <div className="text-center p-4 text-red-500 dark:text-red-400">Error: {error}</div>;

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/95 dark:bg-gray-800 backdrop-blur-md rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center">
          <Users className="text-blue-600 dark:text-blue-400 mr-4" size={32} />
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{dashboardStats.totalStudents}</p>
          </div>
        </div>
      </div>
      <div className="bg-white/95 dark:bg-gray-800 backdrop-blur-md rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDays className="text-green-600 dark:text-green-400 mr-4" size={32} />
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Teaching Days (This Month)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {dashboardStats.totalTeachingDaysThisMonth || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsWidget;
