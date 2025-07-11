"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import {
  Trophy,
  Star,
  Award,
  Target,
  Clock,
  Zap,
  Shield,
  Crown,
} from "lucide-react";
import { badgesAPI } from "@/lib/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: {
    type: string;
    value: number;
  };
  rarity: string;
  earned?: boolean;
  progress?: number;
}

const AchievementsPage = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchBadges();
    fetchUserBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await badgesAPI.getAll();
      setBadges(response.data.badges);
    } catch (error) {
      console.error("Failed to fetch badges:", error);
      toast.error("Failed to load badges");
    }
  };

  const fetchUserBadges = async () => {
    try {
      const response = await badgesAPI.getUserBadges();
      setUserBadges(response.data.badges);
    } catch (error) {
      console.error("Failed to fetch user badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewBadges = async () => {
    try {
      const response = await badgesAPI.checkBadges();
      if (response.data.newBadges.length > 0) {
        toast.success(
          `🎉 You earned ${response.data.newBadges.length} new badge(s)!`
        );
        fetchUserBadges();
      } else {
        toast.success("No new badges earned yet. Keep going!");
      }
    } catch (error) {
      console.error("Failed to check badges:", error);
      toast.error("Failed to check for new badges");
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case "trophy":
        return Trophy;
      case "star":
        return Star;
      case "award":
        return Award;
      case "target":
        return Target;
      case "clock":
        return Clock;
      case "zap":
        return Zap;
      case "shield":
        return Shield;
      case "crown":
        return Crown;
      default:
        return Trophy;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-700 border-gray-300";
      case "rare":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "epic":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "legendary":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "streak":
        return "text-orange-600 bg-orange-100";
      case "time":
        return "text-blue-600 bg-blue-100";
      case "consistency":
        return "text-green-600 bg-green-100";
      case "milestone":
        return "text-purple-600 bg-purple-100";
      case "challenge":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const earnedBadgeIds = userBadges.map((badge) => badge._id);
  const badgesWithStatus = badges.map((badge) => ({
    ...badge,
    earned: earnedBadgeIds.includes(badge._id),
  }));

  const filteredBadges = badgesWithStatus.filter((badge) => {
    if (filter === "all") return true;
    if (filter === "earned") return badge.earned;
    if (filter === "locked") return !badge.earned;
    return badge.category === filter;
  });

  const earnedCount = badgesWithStatus.filter((badge) => badge.earned).length;
  const totalCount = badges.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

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
          className="text-center"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Achievements
          </h1>
          <p className="text-gray-600 mb-6">
            Celebrate your focus journey milestones
          </p>

          {/* Progress Overview */}
          <div className="card max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-900">
                  {earnedCount}/{totalCount}
                </p>
                <p className="text-sm text-gray-600">Badges Earned</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">
                  {completionPercentage}%
                </p>
                <p className="text-sm text-gray-600">Complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <button
              onClick={checkForNewBadges}
              className="btn-primary w-full mt-4"
            >
              Check for New Badges
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {[
            "all",
            "earned",
            "locked",
            "streak",
            "time",
            "consistency",
            "milestone",
            "challenge",
          ].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === filterOption
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Badges Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredBadges.map((badge, index) => {
            const Icon = getBadgeIcon(badge.icon);
            const isEarned = badge.earned;

            return (
              <motion.div
                key={badge._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`card text-center relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  isEarned ? "border-2 border-primary-200" : "opacity-75"
                }`}
              >
                {/* Rarity Border */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    badge.rarity === "legendary"
                      ? "bg-gradient-to-r from-yellow-400 to-orange-400"
                      : badge.rarity === "epic"
                      ? "bg-gradient-to-r from-purple-400 to-pink-400"
                      : badge.rarity === "rare"
                      ? "bg-gradient-to-r from-blue-400 to-cyan-400"
                      : "bg-gray-300"
                  }`}
                ></div>

                {/* Badge Icon */}
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isEarned
                      ? "bg-gradient-to-br from-primary-500 to-secondary-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon className="w-8 h-8" />
                </div>

                {/* Badge Info */}
                <h3
                  className={`font-bold mb-2 ${
                    isEarned ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {badge.name}
                </h3>
                <p
                  className={`text-sm mb-3 ${
                    isEarned ? "text-gray-600" : "text-gray-400"
                  }`}
                >
                  {badge.description}
                </p>

                {/* Category & Rarity */}
                <div className="flex justify-center space-x-2 mb-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      badge.category
                    )}`}
                  >
                    {badge.category}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getRarityColor(
                      badge.rarity
                    )}`}
                  >
                    {badge.rarity}
                  </span>
                </div>

                {/* Criteria */}
                <div
                  className={`text-xs ${
                    isEarned ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {badge.criteria.type.replace("_", " ")}:{" "}
                  {badge.criteria.value}
                </div>

                {/* Earned Indicator */}
                {isEarned && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Locked Overlay */}
                {!isEarned && (
                  <div className="absolute inset-0 bg-gray-50 bg-opacity-50 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {filteredBadges.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No badges found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or start completing focus sessions to
              earn badges!
            </p>
          </motion.div>
        )}

        {/* Recent Achievements */}
        {userBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.slice(0, 6).map((badge) => {
                const Icon = getBadgeIcon(badge.icon);
                return (
                  <div
                    key={badge._id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{badge.name}</p>
                      <p className="text-sm text-gray-600">{badge.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default AchievementsPage;
