"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import {
  User,
  Bell,
  Palette,
  Shield,
  Save,
  Camera,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usersAPI } from "@/lib/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profileImage: user?.profileImage || "",
  });
  const [preferences, setPreferences] = useState({
    pomodoroLength: user?.preferences?.pomodoroLength || 25,
    shortBreakLength: user?.preferences?.shortBreakLength || 5,
    longBreakLength: user?.preferences?.longBreakLength || 15,
    sessionsBeforeLongBreak: user?.preferences?.sessionsBeforeLongBreak || 4,
    autoStartBreaks: user?.preferences?.autoStartBreaks || false,
    autoStartPomodoros: user?.preferences?.autoStartPomodoros || false,
    soundEnabled: user?.preferences?.soundEnabled !== false,
    notificationsEnabled: user?.preferences?.notificationsEnabled !== false,
  });

  const tabs = [
    { id: "profile", name: "Profile", icon: User },
    { id: "timer", name: "Timer", icon: Bell },
    { id: "notifications", name: "Notifications", icon: Bell },
    { id: "appearance", name: "Appearance", icon: Palette },
    { id: "privacy", name: "Privacy", icon: Shield },
  ];

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await usersAPI.updateProfile(profileData);
      updateUser(response.data.user);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);

    try {
      await usersAPI.updatePreferences(preferences);
      updateUser({ preferences });
      toast.success("Preferences updated successfully!");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update preferences"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileData({ ...profileData, profileImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Customize your FocusMate experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "bg-primary-100 text-primary-700 border border-primary-200"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="card">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Profile Information
                  </h2>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Profile Image */}
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                          {profileData.profileImage ? (
                            <img
                              src={profileData.profileImage}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 text-primary-600" />
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                          <Camera className="w-3 h-3 text-white" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Profile Photo
                        </h3>
                        <p className="text-sm text-gray-600">
                          Upload a photo to personalize your account
                        </p>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="input-field"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="input-field"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {loading && <div className="spinner"></div>}
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Timer Tab */}
              {activeTab === "timer" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Timer Settings
                  </h2>

                  <div className="space-y-6">
                    {/* Duration Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pomodoro Length (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={preferences.pomodoroLength}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              pomodoroLength: parseInt(e.target.value),
                            })
                          }
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Short Break (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={preferences.shortBreakLength}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              shortBreakLength: parseInt(e.target.value),
                            })
                          }
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Long Break (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={preferences.longBreakLength}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              longBreakLength: parseInt(e.target.value),
                            })
                          }
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sessions Before Long Break
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={preferences.sessionsBeforeLongBreak}
                          onChange={(e) =>
                            setPreferences({
                              ...preferences,
                              sessionsBeforeLongBreak: parseInt(e.target.value),
                            })
                          }
                          className="input-field"
                        />
                      </div>
                    </div>

                    {/* Auto-start Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Auto-start Breaks
                          </h3>
                          <p className="text-sm text-gray-600">
                            Automatically start break timers after focus
                            sessions
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setPreferences({
                              ...preferences,
                              autoStartBreaks: !preferences.autoStartBreaks,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.autoStartBreaks
                              ? "bg-primary-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences.autoStartBreaks
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Auto-start Pomodoros
                          </h3>
                          <p className="text-sm text-gray-600">
                            Automatically start focus sessions after breaks
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setPreferences({
                              ...preferences,
                              autoStartPomodoros:
                                !preferences.autoStartPomodoros,
                            })
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            preferences.autoStartPomodoros
                              ? "bg-primary-600"
                              : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              preferences.autoStartPomodoros
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handlePreferencesUpdate}
                      disabled={loading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {loading && <div className="spinner"></div>}
                      <Save className="w-4 h-4" />
                      <span>Save Timer Settings</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Notification Settings
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {preferences.soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-primary-600" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Sound Notifications
                          </h3>
                          <p className="text-sm text-gray-600">
                            Play sound when timer completes
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            soundEnabled: !preferences.soundEnabled,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.soundEnabled
                            ? "bg-primary-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.soundEnabled
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-primary-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Push Notifications
                          </h3>
                          <p className="text-sm text-gray-600">
                            Receive browser notifications for reminders
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            notificationsEnabled:
                              !preferences.notificationsEnabled,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.notificationsEnabled
                            ? "bg-primary-600"
                            : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.notificationsEnabled
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      onClick={handlePreferencesUpdate}
                      disabled={loading}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {loading && <div className="spinner"></div>}
                      <Save className="w-4 h-4" />
                      <span>Save Notification Settings</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === "appearance" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Appearance
                  </h2>
                  <div className="text-center py-8">
                    <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Theme Customization
                    </h3>
                    <p className="text-gray-600">
                      Theme options coming soon! Stay tuned for dark mode and
                      custom color schemes.
                    </p>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === "privacy" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Privacy & Security
                  </h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Data Privacy
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Your focus data is stored securely and never shared with
                        third parties. You have full control over your
                        information.
                      </p>
                      <button className="btn-secondary text-sm">
                        Download My Data
                      </button>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h3 className="font-medium text-red-900 mb-2">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-red-700 mb-4">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
