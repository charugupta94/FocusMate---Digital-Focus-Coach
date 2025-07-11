"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Calendar, TrendingUp, Clock, Target, Brain, Zap } from "lucide-react";
import { sessionsAPI, distractionsAPI, journalAPI } from "@/lib/api";
import { motion } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";

interface AnalyticsData {
  focusTime: any[];
  distractions: any[];
  mood: any[];
  productivity: any[];
}

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData>({
    focusTime: [],
    distractions: [],
    mood: [],
    productivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = subDays(
        endDate,
        period === "7d" ? 7 : period === "30d" ? 30 : 90
      );

      // Fetch sessions data
      const sessionsResponse = await sessionsAPI.getAll({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Fetch distractions analytics
      const distractionsResponse = await distractionsAPI.getAnalytics({
        period,
      });

      // Fetch journal analytics
      const journalResponse = await journalAPI.getAnalytics({ period });

      // Process focus time data
      const focusTimeData = processFocusTimeData(
        sessionsResponse.data.sessions,
        startDate,
        endDate
      );

      // Process distraction data
      const distractionData = distractionsResponse.data.analytics.byType || [];

      // Process mood data
      const moodData = processMoodData(
        journalResponse.data.analytics.dailyMood || []
      );

      // Process productivity data
      const productivityData = processProductivityData(
        sessionsResponse.data.sessions
      );

      setData({
        focusTime: focusTimeData,
        distractions: distractionData,
        mood: moodData,
        productivity: productivityData,
      });

      // Generate insights
      generateInsights(
        sessionsResponse.data.sessions,
        distractionData,
        moodData
      );
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processFocusTimeData = (
    sessions: any[],
    startDate: Date,
    endDate: Date
  ) => {
    const days = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayStr = format(current, "MMM dd");
      const dayStart = startOfDay(current);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayFocusTime = sessions
        .filter((session) => {
          const sessionDate = new Date(session.startTime);
          return (
            sessionDate >= dayStart &&
            sessionDate <= dayEnd &&
            (session.type === "pomodoro" || session.type === "custom")
          );
        })
        .reduce((total, session) => total + session.actualDuration, 0);

      days.push({
        date: dayStr,
        focusTime: Math.round(dayFocusTime),
        sessions: sessions.filter((session) => {
          const sessionDate = new Date(session.startTime);
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        }).length,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const processMoodData = (dailyMood: any[]) => {
    return dailyMood.map((item) => ({
      date: format(
        new Date(item._id.year, item._id.month - 1, item._id.day),
        "MMM dd"
      ),
      mood: Math.round(item.averageMood * 20), // Convert to percentage
      entries: item.entryCount,
    }));
  };

  const processProductivityData = (sessions: any[]) => {
    const productivityLevels = [1, 2, 3, 4, 5];
    return productivityLevels.map((level) => ({
      level: `Level ${level}`,
      count: sessions.filter((session) => session.productivity === level)
        .length,
      percentage:
        Math.round(
          (sessions.filter((session) => session.productivity === level).length /
            sessions.length) *
            100
        ) || 0,
    }));
  };

  const generateInsights = (
    sessions: any[],
    distractions: any[],
    mood: any[]
  ) => {
    const insights = [];

    // Focus time insights
    const totalFocusTime = sessions.reduce(
      (total, session) => total + session.actualDuration,
      0
    );
    const avgFocusTime = Math.round(
      totalFocusTime / Math.max(sessions.length, 1)
    );

    if (avgFocusTime > 25) {
      insights.push(
        "🎯 Great job! Your average session length is above the recommended 25 minutes."
      );
    } else if (avgFocusTime < 15) {
      insights.push(
        "⏰ Consider extending your focus sessions. Aim for 25-minute Pomodoros for optimal productivity."
      );
    }

    // Distraction insights
    const topDistraction = distractions.sort((a, b) => b.count - a.count)[0];
    if (topDistraction) {
      insights.push(
        `📱 Your main distraction source is ${topDistraction._id}. Consider strategies to minimize this.`
      );
    }

    // Mood insights
    const avgMood =
      mood.reduce((sum, item) => sum + item.mood, 0) / Math.max(mood.length, 1);
    if (avgMood > 70) {
      insights.push(
        "😊 Your mood trends are positive! You're maintaining good emotional balance during focus sessions."
      );
    } else if (avgMood < 50) {
      insights.push(
        "🧘 Consider taking more breaks or adjusting your work environment to improve your mood during focus sessions."
      );
    }

    // Completion rate insights
    const completedSessions = sessions.filter(
      (session) => session.completed
    ).length;
    const completionRate = Math.round(
      (completedSessions / Math.max(sessions.length, 1)) * 100
    );

    if (completionRate > 80) {
      insights.push(
        "🏆 Excellent completion rate! You're consistently finishing your focus sessions."
      );
    } else if (completionRate < 60) {
      insights.push(
        "🎯 Try shorter sessions or remove distractions to improve your completion rate."
      );
    }

    setInsights(insights);
  };

  const COLORS = [
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="spinner w-8 h-8 text-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Insights into your focus patterns and productivity
            </p>
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="card text-center">
            <Clock className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(
                data.focusTime.reduce((sum, day) => sum + day.focusTime, 0)
              )}
              m
            </p>
            <p className="text-sm text-gray-600">Total Focus Time</p>
          </div>

          <div className="card text-center">
            <Target className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {data.focusTime.reduce((sum, day) => sum + day.sessions, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Sessions</p>
          </div>

          <div className="card text-center">
            <TrendingUp className="w-8 h-8 text-warning-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(
                data.focusTime.reduce((sum, day) => sum + day.focusTime, 0) /
                  Math.max(data.focusTime.length, 1)
              )}
              m
            </p>
            <p className="text-sm text-gray-600">Daily Average</p>
          </div>

          <div className="card text-center">
            <Brain className="w-8 h-8 text-secondary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {data.mood.length > 0
                ? Math.round(
                    data.mood.reduce((sum, item) => sum + item.mood, 0) /
                      data.mood.length
                  )
                : 0}
              %
            </p>
            <p className="text-sm text-gray-600">Avg Mood Score</p>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Focus Time Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Daily Focus Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.focusTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [`${value} minutes`, "Focus Time"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="focusTime"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Distraction Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distraction Sources
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.distractions}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                >
                  {data.distractions.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Mood Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mood Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.mood}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, "Mood Score"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Productivity Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Productivity Levels
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.productivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [`${value} sessions`, "Count"]}
                />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-6 h-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI-Powered Insights
            </h3>
          </div>

          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700">{insight}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              Complete more focus sessions to get personalized insights!
            </p>
          )}
        </motion.div>

        {/* Weekly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Weekly Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600">
                {Math.round(
                  (data.focusTime.reduce((sum, day) => sum + day.focusTime, 0) /
                    60) *
                    10
                ) / 10}
                h
              </p>
              <p className="text-gray-600">Total Focus Hours</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success-600">
                {data.distractions.reduce((sum, item) => sum + item.count, 0)}
              </p>
              <p className="text-gray-600">Total Distractions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary-600">
                {data.mood.reduce((sum, item) => sum + item.entries, 0)}
              </p>
              <p className="text-gray-600">Journal Entries</p>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
