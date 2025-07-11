"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  AlertTriangle,
  Brain,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { sessionsAPI } from "@/lib/api";
import DistractionLogger from "@/components/Distractions/DistractionLogger";
import SessionReflection from "@/components/Timer/SessionReflection";
import toast from "react-hot-toast";

interface TimerSettings {
  pomodoroLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  sessionsBeforeLongBreak: number;
}

const PomodoroTimer = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionType, setSessionType] = useState<
    "pomodoro" | "shortBreak" | "longBreak"
  >("pomodoro");
  const [sessionCount, setSessionCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [task, setTask] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<any>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const settings: TimerSettings = user?.preferences || {
    pomodoroLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    sessionsBeforeLongBreak: 4,
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
    }
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  // Request notification permission on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const showNotification = (title: string, body: string) => {
    if (
      user?.preferences?.notificationsEnabled !== false &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  };

  const handleTimerComplete = async () => {
    setIsActive(false);
    setIsPaused(false);

    // Play notification sound
    if (audioRef.current && user?.preferences?.soundEnabled !== false) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.log("Could not play notification sound");
      }
    }

    // Show browser notification
    if (sessionType === "pomodoro") {
      showNotification("Pomodoro Complete!", "Great work! Time for a break.");
    } else {
      showNotification("Break Complete!", "Ready to focus again?");
    }

    // Complete the session if it was a pomodoro
    if (sessionType === "pomodoro" && currentSessionId) {
      try {
        const sessionData = {
          type: sessionType,
          task: task,
          plannedDuration: settings.pomodoroLength,
          actualDuration: settings.pomodoroLength,
        };

        setCompletedSessionData(sessionData);
        setShowReflection(true);

        setSessionCount((prev) => prev + 1);
        toast.success("Pomodoro completed! Please reflect on your session. 🎉");
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    // Auto-start next session based on preferences
    const shouldStartLongBreak =
      sessionCount > 0 &&
      (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0;

    if (sessionType === "pomodoro") {
      const nextType = shouldStartLongBreak ? "longBreak" : "shortBreak";
      setSessionType(nextType);
      setTimeLeft(
        nextType === "longBreak"
          ? settings.longBreakLength * 60
          : settings.shortBreakLength * 60
      );

      if (user?.preferences?.autoStartBreaks) {
        setIsActive(true);
      }
    } else {
      setSessionType("pomodoro");
      setTimeLeft(settings.pomodoroLength * 60);

      if (user?.preferences?.autoStartPomodoros) {
        startNewSession();
      }
    }

    // Reset distraction count for new session
    setDistractionCount(0);
  };

  const startNewSession = async () => {
    if (sessionType === "pomodoro") {
      try {
        const response = await sessionsAPI.create({
          type: "pomodoro",
          plannedDuration: settings.pomodoroLength,
          task: task.trim() || undefined,
        });
        setCurrentSessionId(response.data.session._id);
      } catch (error) {
        console.error("Failed to create session:", error);
        toast.error("Failed to start session");
        return;
      }
    }

    setIsActive(true);
    setIsPaused(false);
    setDistractionCount(0);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = async () => {
    setIsActive(false);
    setIsPaused(false);

    // Complete the session with actual duration if it was a pomodoro
    if (sessionType === "pomodoro" && currentSessionId) {
      const actualDuration = Math.round(
        (settings.pomodoroLength * 60 - timeLeft) / 60
      );
      try {
        await sessionsAPI.complete(currentSessionId, {
          actualDuration,
          completed: false,
          mood: "neutral",
          productivity: 2,
        });
      } catch (error) {
        console.error("Failed to complete session:", error);
      }
    }

    setCurrentSessionId(null);
    setDistractionCount(0);
    resetTimer();
  };

  const resetTimer = () => {
    setTimeLeft(settings.pomodoroLength * 60);
    setSessionType("pomodoro");
    setIsActive(false);
    setIsPaused(false);
    setCurrentSessionId(null);
    setDistractionCount(0);
  };

  const handleDistraction = (distraction: any) => {
    setDistractionCount((prev) => prev + 1);

    // Show visual feedback
    if (distractionCount >= 2) {
      toast.error("Multiple distractions detected! Try to refocus. 🎯");
    } else {
      toast("Distraction logged", { icon: "📱" });
    }
  };

  const handleReflectionComplete = (reflection: any) => {
    setShowReflection(false);
    setCompletedSessionData(null);
    setCurrentSessionId(null);
  };

  const handleReflectionSkip = () => {
    setShowReflection(false);
    setCompletedSessionData(null);

    // Still complete the session in the background
    if (currentSessionId) {
      sessionsAPI
        .complete(currentSessionId, {
          actualDuration: settings.pomodoroLength,
          completed: true,
          mood: "neutral",
          productivity: 3,
        })
        .catch(console.error);
    }

    setCurrentSessionId(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case "pomodoro":
        return "text-primary-600";
      case "shortBreak":
        return "text-success-600";
      case "longBreak":
        return "text-secondary-600";
      default:
        return "text-primary-600";
    }
  };

  const getSessionBg = () => {
    switch (sessionType) {
      case "pomodoro":
        return "from-primary-500 to-primary-600";
      case "shortBreak":
        return "from-success-500 to-success-600";
      case "longBreak":
        return "from-secondary-500 to-secondary-600";
      default:
        return "from-primary-500 to-primary-600";
    }
  };

  const progress =
    sessionType === "pomodoro"
      ? ((settings.pomodoroLength * 60 - timeLeft) /
          (settings.pomodoroLength * 60)) *
        100
      : sessionType === "shortBreak"
      ? ((settings.shortBreakLength * 60 - timeLeft) /
          (settings.shortBreakLength * 60)) *
        100
      : ((settings.longBreakLength * 60 - timeLeft) /
          (settings.longBreakLength * 60)) *
        100;

  return (
    <>
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          {/* Session Type */}
          <div className="mb-6">
            <h2 className={`text-2xl font-bold ${getSessionColor()}`}>
              {sessionType === "pomodoro"
                ? "Focus Time"
                : sessionType === "shortBreak"
                ? "Short Break"
                : "Long Break"}
            </h2>
            <p className="text-gray-600 mt-1">
              Session {sessionCount + 1} • Next:{" "}
              {sessionType === "pomodoro"
                ? sessionCount > 0 &&
                  (sessionCount + 1) % settings.sessionsBeforeLongBreak === 0
                  ? "Long Break"
                  : "Short Break"
                : "Focus Time"}
            </p>
          </div>

          {/* Distraction Alert */}
          {isActive && sessionType === "pomodoro" && distractionCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-4 p-3 rounded-lg flex items-center justify-center space-x-2 ${
                distractionCount >= 3
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {distractionCount} distraction{distractionCount > 1 ? "s" : ""}{" "}
                logged
              </span>
            </motion.div>
          )}

          {/* Timer Circle */}
          <div className="relative w-64 h-64 mx-auto mb-8">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`${getSessionColor()} transition-all duration-1000 ease-in-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getSessionColor()}`}>
                  {formatTime(timeLeft)}
                </div>
                {sessionType === "pomodoro" && (
                  <div className="text-sm text-gray-500 mt-1">
                    {Math.round(progress)}% complete
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Task Input */}
          {sessionType === "pomodoro" && !isActive && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="What are you working on?"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="input-field text-center"
                maxLength={200}
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4 mb-6">
            {!isActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startNewSession}
                className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${getSessionBg()} text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200`}
              >
                <Play className="w-5 h-5" />
                <span>Start</span>
              </motion.button>
            ) : (
              <>
                {isPaused ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resumeTimer}
                    className="flex items-center space-x-2 px-6 py-3 bg-success-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Play className="w-5 h-5" />
                    <span>Resume</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={pauseTimer}
                    className="flex items-center space-x-2 px-6 py-3 bg-warning-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Pause className="w-5 h-5" />
                    <span>Pause</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopTimer}
                  className="flex items-center space-x-2 px-6 py-3 bg-error-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Square className="w-5 h-5" />
                  <span>Stop</span>
                </motion.button>
              </>
            )}
          </div>

          {/* Additional Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetTimer}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          {/* Session Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">
                  {sessionCount}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">
                  {Math.floor((sessionCount * settings.pomodoroLength) / 60)}h{" "}
                  {(sessionCount * settings.pomodoroLength) % 60}m
                </div>
                <div className="text-sm text-gray-600">Focus Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary-600">
                  {Math.floor(sessionCount / settings.sessionsBeforeLongBreak)}
                </div>
                <div className="text-sm text-gray-600">Cycles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Distraction Logger - Only show during active Pomodoro sessions */}
        {isActive && sessionType === "pomodoro" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-gray-900">
                  Distraction Tracker
                </h3>
              </div>
              <DistractionLogger
                sessionId={currentSessionId || undefined}
                onDistraction={handleDistraction}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Session Reflection Modal */}
      {showReflection && completedSessionData && currentSessionId && (
        <SessionReflection
          sessionId={currentSessionId}
          sessionData={completedSessionData}
          onComplete={handleReflectionComplete}
          onSkip={handleReflectionSkip}
        />
      )}
    </>
  );
};

export default PomodoroTimer;
