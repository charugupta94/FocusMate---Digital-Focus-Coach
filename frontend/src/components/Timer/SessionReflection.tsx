"use client";

import React, { useState } from "react";
import {
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
  Star,
  MessageSquare,
  Save,
  X,
} from "lucide-react";
import { sessionsAPI, journalAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface SessionReflectionProps {
  sessionId: string;
  sessionData: {
    type: string;
    task?: string;
    plannedDuration: number;
    actualDuration: number;
  };
  onComplete: (reflection: any) => void;
  onSkip: () => void;
}

const SessionReflection: React.FC<SessionReflectionProps> = ({
  sessionId,
  sessionData,
  onComplete,
  onSkip,
}) => {
  const [reflection, setReflection] = useState({
    mood: "neutral",
    productivity: 3,
    notes: "",
    insights: [] as string[],
    createJournalEntry: false,
    journalContent: "",
  });
  const [insightInput, setInsightInput] = useState("");
  const [loading, setLoading] = useState(false);

  const moods = [
    {
      value: "very_distracted",
      icon: Zap,
      label: "Very Distracted",
      color: "text-red-500",
    },
    {
      value: "distracted",
      icon: Frown,
      label: "Distracted",
      color: "text-orange-500",
    },
    { value: "neutral", icon: Meh, label: "Neutral", color: "text-yellow-500" },
    {
      value: "focused",
      icon: Smile,
      label: "Focused",
      color: "text-green-500",
    },
    {
      value: "very_focused",
      icon: Heart,
      label: "Very Focused",
      color: "text-pink-500",
    },
  ];

  const productivityLevels = [
    { value: 1, label: "Very Low", color: "bg-red-500" },
    { value: 2, label: "Low", color: "bg-orange-500" },
    { value: 3, label: "Medium", color: "bg-yellow-500" },
    { value: 4, label: "High", color: "bg-green-500" },
    { value: 5, label: "Very High", color: "bg-blue-500" },
  ];

  const addInsight = () => {
    if (
      insightInput.trim() &&
      !reflection.insights.includes(insightInput.trim())
    ) {
      setReflection({
        ...reflection,
        insights: [...reflection.insights, insightInput.trim()],
      });
      setInsightInput("");
    }
  };

  const removeInsight = (insightToRemove: string) => {
    setReflection({
      ...reflection,
      insights: reflection.insights.filter(
        (insight) => insight !== insightToRemove
      ),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Complete the session with reflection data
      const sessionCompletion = {
        actualDuration: sessionData.actualDuration,
        completed: true,
        mood: reflection.mood,
        productivity: reflection.productivity,
        notes: reflection.notes,
      };

      await sessionsAPI.complete(sessionId, sessionCompletion);

      // Create journal entry if requested
      if (reflection.createJournalEntry && reflection.journalContent.trim()) {
        const journalEntry = {
          title: `${sessionData.type} Session Reflection`,
          content: reflection.journalContent,
          mood: getMoodForJournal(reflection.mood),
          tags: ["session-reflection", sessionData.type],
          insights: reflection.insights,
          session: sessionId,
        };

        await journalAPI.create(journalEntry);
      }

      toast.success("Session reflection saved!");
      onComplete(reflection);
    } catch (error) {
      console.error("Failed to save reflection:", error);
      toast.error("Failed to save reflection");
    } finally {
      setLoading(false);
    }
  };

  const getMoodForJournal = (sessionMood: string) => {
    switch (sessionMood) {
      case "very_focused":
        return "excellent";
      case "focused":
        return "good";
      case "neutral":
        return "okay";
      case "distracted":
        return "bad";
      case "very_distracted":
        return "terrible";
      default:
        return "okay";
    }
  };

  const completionPercentage = Math.round(
    (sessionData.actualDuration / sessionData.plannedDuration) * 100
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Session Reflection
            </h2>
            <button
              onClick={onSkip}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Session Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              Session Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium capitalize">
                  {sessionData.type}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Completion:</span>
                <span className="ml-2 font-medium">
                  {completionPercentage}%
                </span>
              </div>
              <div>
                <span className="text-gray-600">Planned:</span>
                <span className="ml-2 font-medium">
                  {sessionData.plannedDuration} min
                </span>
              </div>
              <div>
                <span className="text-gray-600">Actual:</span>
                <span className="ml-2 font-medium">
                  {sessionData.actualDuration} min
                </span>
              </div>
            </div>
            {sessionData.task && (
              <div className="mt-2">
                <span className="text-gray-600">Task:</span>
                <span className="ml-2 font-medium">{sessionData.task}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How focused did you feel during this session?
              </label>
              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() =>
                        setReflection({ ...reflection, mood: mood.value })
                      }
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        reflection.mood === mood.value
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto ${mood.color}`} />
                      <p className="text-xs mt-1 text-center">{mood.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Productivity Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate your productivity (1-5)
              </label>
              <div className="flex space-x-2">
                {productivityLevels.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      setReflection({
                        ...reflection,
                        productivity: level.value,
                      })
                    }
                    className={`flex-1 p-3 rounded-lg border-2 transition-all duration-200 ${
                      reflection.productivity === level.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${level.color}`}
                      ></div>
                      <Star className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-xs mt-1 text-center">{level.value}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Notes (optional)
              </label>
              <textarea
                value={reflection.notes}
                onChange={(e) =>
                  setReflection({ ...reflection, notes: e.target.value })
                }
                className="input-field"
                rows={3}
                placeholder="How did the session go? Any challenges or wins?"
              />
            </div>

            {/* Insights */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key Insights (optional)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={insightInput}
                  onChange={(e) => setInsightInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addInsight())
                  }
                  className="input-field flex-1"
                  placeholder="What did you learn about your focus patterns?"
                />
                <button
                  type="button"
                  onClick={addInsight}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {reflection.insights.map((insight, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{insight}</span>
                    <button
                      type="button"
                      onClick={() => removeInsight(insight)}
                      className="text-primary-500 hover:text-primary-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Journal Entry Option */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="createJournal"
                  checked={reflection.createJournalEntry}
                  onChange={(e) =>
                    setReflection({
                      ...reflection,
                      createJournalEntry: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="createJournal"
                  className="text-sm font-medium text-gray-700 flex items-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Create journal entry</span>
                </label>
              </div>

              {reflection.createJournalEntry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <textarea
                    value={reflection.journalContent}
                    onChange={(e) =>
                      setReflection({
                        ...reflection,
                        journalContent: e.target.value,
                      })
                    }
                    className="input-field"
                    rows={4}
                    placeholder="Reflect on your session... What went well? What could be improved? How are you feeling?"
                  />
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onSkip}
                className="btn-secondary flex-1"
              >
                Skip Reflection
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {loading && <div className="spinner"></div>}
                <Save className="w-4 h-4" />
                <span>Save Reflection</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SessionReflection;
