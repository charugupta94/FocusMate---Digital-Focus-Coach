'use client';

import React from 'react';
import Layout from '@/components/Layout/Layout';
import PomodoroTimer from '@/components/Timer/PomodoroTimer';
import { motion } from 'framer-motion';

const TimerPage = () => {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Focus Timer</h1>
          <p className="text-gray-600">
            Use the Pomodoro technique to boost your productivity and maintain focus
          </p>
        </div>

        <PomodoroTimer />

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Set Your Task</h3>
            <p className="text-gray-600 text-sm">
              Define what you want to accomplish during this focus session
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-success-100 text-success-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Focus Deeply</h3>
            <p className="text-gray-600 text-sm">
              Work with full concentration until the timer rings
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-secondary-100 text-secondary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Take a Break</h3>
            <p className="text-gray-600 text-sm">
              Rest and recharge before starting your next session
            </p>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default TimerPage;