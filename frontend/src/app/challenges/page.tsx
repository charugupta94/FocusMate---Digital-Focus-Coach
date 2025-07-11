"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import {
  Plus,
  Target,
  Calendar,
  Trophy,
  Clock,
  TrendingUp,
} from "lucide-react";
import { challengesAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Challenge {
  _id: string;
  title: string;
  description: string;
  type: string;
  duration: number;
  target: {
    value: number;
    unit: string;
  };
  startDate: string;
  endDate: string;
  status: string;
  progress: {
    current: number;
  };
  progressPercentage: number;
}

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    type: "focus_streak",
    duration: 7,
    target: { value: 10, unit: "sessions" },
  });

  useEffect(() => {
    fetchChallenges();
  }, [filter]);

  const fetchChallenges = async () => {
    try {
      const params = filter !== "all" ? { status: filter } : {};
      const response = await challengesAPI.getAll(params);
      setChallenges(response.data.challenges);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await challengesAPI.create(newChallenge);
      toast.success("Challenge created successfully!");
      setShowCreateModal(false);
      setNewChallenge({
        title: "",
        description: "",
        type: "focus_streak",
        duration: 7,
        target: { value: 10, unit: "sessions" },
      });
      fetchChallenges();
    } catch (error) {
      console.error("Failed to create challenge:", error);
      toast.error("Failed to create challenge");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary-100 text-primary-700";
      case "completed":
        return "bg-success-100 text-success-700";
      case "failed":
        return "bg-error-100 text-error-700";
      case "paused":
        return "bg-warning-100 text-warning-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "focus_streak":
        return Target;
      case "time_goal":
        return Clock;
      case "distraction_limit":
        return TrendingUp;
      default:
        return Trophy;
    }
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
              Focus Challenges
            </h1>
            <p className="text-gray-600 mt-2">
              Build lasting habits with personalized challenges
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Challenge</span>
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-2 overflow-x-auto pb-2"
        >
          {["all", "active", "completed", "failed", "paused"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200 ${
                filter === status
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Challenges Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {challenges.map((challenge, index) => {
            const Icon = getTypeIcon(challenge.type);
            const daysLeft = Math.ceil(
              (new Date(challenge.endDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={challenge._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {challenge.title}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                          challenge.status
                        )}`}
                      >
                        {challenge.status}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {challenge.description}
                </p>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">
                      {challenge.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          challenge.progressPercentage,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-2 text-gray-600">
                    <span>
                      {challenge.progress.current} / {challenge.target.value}{" "}
                      {challenge.target.unit}
                    </span>
                    {challenge.status === "active" && (
                      <span>
                        {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Duration */}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{challenge.duration} days</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {challenges.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No challenges yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first challenge to start building better focus habits
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Challenge
            </button>
          </motion.div>
        )}
      </div>

      {/* Create Challenge Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create New Challenge
              </h2>

              <form onSubmit={handleCreateChallenge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newChallenge.title}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        title: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="e.g., 7-Day Focus Streak"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newChallenge.description}
                    onChange={(e) =>
                      setNewChallenge({
                        ...newChallenge,
                        description: e.target.value,
                      })
                    }
                    className="input-field"
                    rows={3}
                    placeholder="Describe your challenge..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={newChallenge.type}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          type: e.target.value,
                        })
                      }
                      className="input-field"
                    >
                      <option value="focus_streak">Focus Streak</option>
                      <option value="time_goal">Time Goal</option>
                      <option value="distraction_limit">
                        Distraction Limit
                      </option>
                      <option value="habit_break">Habit Break</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      value={newChallenge.duration}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="input-field"
                      min="1"
                      max="365"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Value
                    </label>
                    <input
                      type="number"
                      value={newChallenge.target.value}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          target: {
                            ...newChallenge.target,
                            value: parseInt(e.target.value),
                          },
                        })
                      }
                      className="input-field"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={newChallenge.target.unit}
                      onChange={(e) =>
                        setNewChallenge({
                          ...newChallenge,
                          target: {
                            ...newChallenge.target,
                            unit: e.target.value,
                          },
                        })
                      }
                      className="input-field"
                    >
                      <option value="sessions">Sessions</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="distractions">Distractions</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Create Challenge
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default ChallengesPage;
