'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout/Layout';
import StatsCard from '@/components/Dashboard/StatsCard';
import { Timer, Target, Zap, TrendingUp, Clock, Award } from 'lucide-react';
import { sessionsAPI, usersAPI, challengesAPI } from '@/lib/api';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, sessionsRes, challengesRes] = await Promise.all([
        usersAPI.getStats(),
        sessionsAPI.getToday(),
        challengesAPI.getAll({ status: 'active', limit: 3 }),
      ]);

      setStats(statsRes.data.stats);
      setTodaySessions(sessionsRes.data.sessions);
      setActiveChallenges(challengesRes.data.challenges);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="spinner w-8 h-8 text-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const todayFocusTime = todaySessions
    .filter(session => session.type === 'pomodoro' || session.type === 'custom')
    .reduce((total, session) => total + session.actualDuration, 0);

  const todayCompletedSessions = todaySessions.filter(session => session.completed).length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's your focus journey overview for today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <StatsCard
            title="Today's Focus Time"
            value={formatTime(todayFocusTime)}
            subtitle={`${todayCompletedSessions} sessions completed`}
            icon={Timer}
            color="primary"
          />
          <StatsCard
            title="Current Streak"
            value={`${stats?.currentStreak || 0} days`}
            subtitle={`Best: ${stats?.longestStreak || 0} days`}
            icon={Zap}
            color="success"
          />
          <StatsCard
            title="Total Focus Time"
            value={formatTime(stats?.totalFocusTime || 0)}
            subtitle={`${stats?.totalSessions || 0} sessions`}
            icon={Clock}
            color="secondary"
          />
          <StatsCard
            title="Daily Focus Score"
            value={`${Math.round(stats?.dailyFocusScore || 0)}%`}
            subtitle="Based on your goals"
            icon={TrendingUp}
            color="warning"
          />
          <StatsCard
            title="Active Challenges"
            value={activeChallenges.length}
            subtitle="Keep pushing forward!"
            icon={Target}
            color="error"
          />
          <StatsCard
            title="Achievements"
            value={user?.badges?.length || 0}
            subtitle="Badges earned"
            icon={Award}
            color="primary"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Today's Sessions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Sessions</h3>
            {todaySessions.length > 0 ? (
              <div className="space-y-3">
                {todaySessions.slice(0, 5).map((session) => (
                  <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        session.completed ? 'bg-success-500' : 'bg-gray-400'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.task || `${session.type} session`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(session.actualDuration)} • {new Date(session.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      session.completed 
                        ? 'bg-success-100 text-success-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {session.completed ? 'Completed' : 'Incomplete'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Timer className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No sessions today yet</p>
                <p className="text-sm text-gray-500">Start your first focus session!</p>
              </div>
            )}
          </div>

          {/* Active Challenges */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Challenges</h3>
            {activeChallenges.length > 0 ? (
              <div className="space-y-3">
                {activeChallenges.map((challenge) => (
                  <div key={challenge._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                      <span className="text-sm text-gray-600">
                        {challenge.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${challenge.progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {challenge.progress.current} / {challenge.target.value} {challenge.target.unit}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No active challenges</p>
                <p className="text-sm text-gray-500">Create a challenge to stay motivated!</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card text-center gradient-bg text-white"
        >
          <h3 className="text-xl font-semibold mb-2">Ready to Focus?</h3>
          <p className="text-white/90 mb-6">Start a Pomodoro session and boost your productivity</p>
          <a
            href="/timer"
            className="inline-flex items-center space-x-2 bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <Timer className="w-5 h-5" />
            <span>Start Timer</span>
          </a>
        </motion.div>
      </div>
    </Layout>
  );
};

export default DashboardPage;