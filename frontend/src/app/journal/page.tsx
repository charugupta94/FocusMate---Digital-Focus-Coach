"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import {
  Plus,
  BookOpen,
  Calendar,
  Tag,
  Smile,
  Frown,
  Meh,
  Heart,
  Zap,
} from "lucide-react";
import { journalAPI } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface JournalEntry {
  _id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  insights: string[];
  date: string;
  session?: {
    type: string;
    task: string;
  };
}

const JournalPage = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState({ mood: "", tag: "", period: "30d" });
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: "okay",
    tags: [] as string[],
    insights: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchEntries();
  }, [filter]);

  const fetchEntries = async () => {
    try {
      const params: any = {};
      if (filter.mood) params.mood = filter.mood;
      if (filter.tag) params.tag = filter.tag;

      const response = await journalAPI.getAll(params);
      setEntries(response.data.entries);
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await journalAPI.create(newEntry);
      toast.success("Journal entry created successfully!");
      setShowCreateModal(false);
      setNewEntry({
        title: "",
        content: "",
        mood: "okay",
        tags: [],
        insights: [],
      });
      setTagInput("");
      fetchEntries();
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      toast.error("Failed to create journal entry");
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newEntry.tags.includes(tagInput.trim())) {
      setNewEntry({
        ...newEntry,
        tags: [...newEntry.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewEntry({
      ...newEntry,
      tags: newEntry.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "excellent":
        return { icon: Heart, color: "text-pink-500" };
      case "good":
        return { icon: Smile, color: "text-green-500" };
      case "okay":
        return { icon: Meh, color: "text-yellow-500" };
      case "bad":
        return { icon: Frown, color: "text-orange-500" };
      case "terrible":
        return { icon: Zap, color: "text-red-500" };
      default:
        return { icon: Meh, color: "text-gray-500" };
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "excellent":
        return "bg-pink-100 text-pink-700";
      case "good":
        return "bg-green-100 text-green-700";
      case "okay":
        return "bg-yellow-100 text-yellow-700";
      case "bad":
        return "bg-orange-100 text-orange-700";
      case "terrible":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
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
              Reflection Journal
            </h1>
            <p className="text-gray-600 mt-2">
              Track your thoughts, insights, and progress
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Entry</span>
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-4"
        >
          <select
            value={filter.mood}
            onChange={(e) => setFilter({ ...filter, mood: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">All Moods</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="okay">Okay</option>
            <option value="bad">Bad</option>
            <option value="terrible">Terrible</option>
          </select>

          <input
            type="text"
            placeholder="Filter by tag..."
            value={filter.tag}
            onChange={(e) => setFilter({ ...filter, tag: e.target.value })}
            className="input-field w-auto"
          />
        </motion.div>

        {/* Journal Entries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {entries.map((entry, index) => {
            const { icon: MoodIcon, color } = getMoodIcon(entry.mood);

            return (
              <motion.div
                key={entry._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMoodColor(
                        entry.mood
                      )}`}
                    >
                      <MoodIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {entry.title || "Untitled Entry"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {format(new Date(entry.date), "MMM dd, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(
                      entry.mood
                    )}`}
                  >
                    {entry.mood}
                  </span>
                </div>

                <p className="text-gray-700 mb-4 leading-relaxed">
                  {entry.content}
                </p>

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {entry.insights.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
                    <ul className="space-y-1">
                      {entry.insights.map((insight, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-start"
                        >
                          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.session && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Related Session:</span>{" "}
                      {entry.session.type}
                      {entry.session.task && ` - ${entry.session.task}`}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No journal entries yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start reflecting on your focus journey
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Write First Entry
            </button>
          </motion.div>
        )}
      </div>

      {/* Create Entry Modal */}
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
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                New Journal Entry
              </h2>

              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, title: e.target.value })
                    }
                    className="input-field"
                    placeholder="Give your entry a title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How are you feeling?
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {["terrible", "bad", "okay", "good", "excellent"].map(
                      (mood) => {
                        const { icon: MoodIcon, color } = getMoodIcon(mood);
                        return (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => setNewEntry({ ...newEntry, mood })}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                              newEntry.mood === mood
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <MoodIcon className={`w-6 h-6 mx-auto ${color}`} />
                            <p className="text-xs mt-1 capitalize">{mood}</p>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={newEntry.content}
                    onChange={(e) =>
                      setNewEntry({ ...newEntry, content: e.target.value })
                    }
                    className="input-field"
                    rows={6}
                    placeholder="What's on your mind? How was your focus session? What did you learn?"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addTag())
                      }
                      className="input-field flex-1"
                      placeholder="Add a tag..."
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="btn-secondary"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newEntry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center space-x-1"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-primary-500 hover:text-primary-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
                    Save Entry
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

export default JournalPage;
