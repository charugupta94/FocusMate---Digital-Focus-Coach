"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Globe,
  Users,
  Volume2,
  MessageSquare,
  Brain,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { distractionsAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface DistractionLoggerProps {
  sessionId?: string;
  onDistraction?: (distraction: any) => void;
}

const DistractionLogger: React.FC<DistractionLoggerProps> = ({
  sessionId,
  onDistraction,
}) => {
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [detailedDistraction, setDetailedDistraction] = useState({
    type: "phone",
    source: "",
    description: "",
    duration: 0,
    severity: "medium",
  });

  const distractionTypes = [
    {
      type: "phone",
      icon: Smartphone,
      label: "Phone",
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    },
    {
      type: "social_media",
      icon: MessageSquare,
      label: "Social Media",
      color: "bg-pink-100 text-pink-700 hover:bg-pink-200",
    },
    {
      type: "website",
      icon: Globe,
      label: "Website",
      color: "bg-green-100 text-green-700 hover:bg-green-200",
    },
    {
      type: "notification",
      icon: Zap,
      label: "Notification",
      color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    },
    {
      type: "person",
      icon: Users,
      label: "Person",
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    },
    {
      type: "noise",
      icon: Volume2,
      label: "Noise",
      color: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    },
    {
      type: "thought",
      icon: Brain,
      label: "Thought",
      color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    },
    {
      type: "other",
      icon: MoreHorizontal,
      label: "Other",
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    },
  ];

  const handleQuickLog = async (type: string) => {
    try {
      const distraction = {
        type,
        session: sessionId,
        severity: "medium",
        duration: 0,
      };

      const response = await distractionsAPI.create(distraction);
      toast.success(`${type.replace("_", " ")} distraction logged`);

      if (onDistraction) {
        onDistraction(response.data.distraction);
      }
    } catch (error) {
      console.error("Failed to log distraction:", error);
      toast.error("Failed to log distraction");
    }
  };

  const handleDetailedLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const distraction = {
        ...detailedDistraction,
        session: sessionId,
      };

      const response = await distractionsAPI.create(distraction);
      toast.success("Detailed distraction logged");

      setShowDetailedForm(false);
      setDetailedDistraction({
        type: "phone",
        source: "",
        description: "",
        duration: 0,
        severity: "medium",
      });

      if (onDistraction) {
        onDistraction(response.data.distraction);
      }
    } catch (error) {
      console.error("Failed to log detailed distraction:", error);
      toast.error("Failed to log distraction");
    }
  };

  const openDetailedForm = (type: string) => {
    setDetailedDistraction({ ...detailedDistraction, type });
    setShowDetailedForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Quick Log Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {distractionTypes.map((distraction) => {
          const Icon = distraction.icon;
          return (
            <div key={distraction.type} className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickLog(distraction.type)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openDetailedForm(distraction.type);
                }}
                className={`w-full p-3 rounded-lg transition-all duration-200 ${distraction.color} flex flex-col items-center space-y-2`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{distraction.label}</span>
              </motion.button>

              {/* Detailed Log Button */}
              <button
                onClick={() => openDetailedForm(distraction.type)}
                className="absolute top-1 right-1 w-5 h-5 bg-white bg-opacity-80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100"
              >
                <MoreHorizontal className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Click to quick-log • Right-click or ⋯ for detailed logging
      </p>

      {/* Detailed Form Modal */}
      <AnimatePresence>
        {showDetailedForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailedForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Log Distraction Details
              </h3>

              <form onSubmit={handleDetailedLog} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={detailedDistraction.type}
                    onChange={(e) =>
                      setDetailedDistraction({
                        ...detailedDistraction,
                        type: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    {distractionTypes.map((type) => (
                      <option key={type.type} value={type.type}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source (optional)
                  </label>
                  <input
                    type="text"
                    value={detailedDistraction.source}
                    onChange={(e) =>
                      setDetailedDistraction({
                        ...detailedDistraction,
                        source: e.target.value,
                      })
                    }
                    className="input-field"
                    placeholder="e.g., Instagram, colleague, construction noise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={detailedDistraction.description}
                    onChange={(e) =>
                      setDetailedDistraction({
                        ...detailedDistraction,
                        description: e.target.value,
                      })
                    }
                    className="input-field"
                    rows={3}
                    placeholder="What happened? How did it affect your focus?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="3600"
                      value={detailedDistraction.duration}
                      onChange={(e) =>
                        setDetailedDistraction({
                          ...detailedDistraction,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={detailedDistraction.severity}
                      onChange={(e) =>
                        setDetailedDistraction({
                          ...detailedDistraction,
                          severity: e.target.value,
                        })
                      }
                      className="input-field"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDetailedForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Log Distraction
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DistractionLogger;
