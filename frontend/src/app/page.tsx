'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Timer, Target, BookOpen, Trophy, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8 text-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const features = [
    {
      icon: Timer,
      title: 'Pomodoro Timer',
      description: 'Stay focused with customizable work and break intervals',
      color: 'text-primary-600 bg-primary-100',
    },
    {
      icon: Target,
      title: 'Focus Challenges',
      description: 'Build lasting habits with personalized challenges',
      color: 'text-success-600 bg-success-100',
    },
    {
      icon: BookOpen,
      title: 'Reflection Journal',
      description: 'Track your progress and insights after each session',
      color: 'text-secondary-600 bg-secondary-100',
    },
    {
      icon: Trophy,
      title: 'Achievements',
      description: 'Earn badges and celebrate your focus milestones',
      color: 'text-warning-600 bg-warning-100',
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Visualize your productivity patterns and improvements',
      color: 'text-error-600 bg-error-100',
    },
    {
      icon: Shield,
      title: 'Distraction Tracking',
      description: 'Identify and overcome your biggest focus obstacles',
      color: 'text-primary-600 bg-primary-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                  <Timer className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">FocusMate</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Your Personalized
              <span className="block gradient-bg bg-clip-text text-transparent">
                Digital Focus Coach
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Break free from distractions, build deep focus habits, and unlock your productivity potential 
              with intelligent tracking and personalized insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="btn-primary text-lg px-8 py-3">
                Start Your Journey
              </Link>
              <Link href="/auth/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Focused
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed to help you understand, track, and improve your focus habits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card hover:shadow-lg transition-shadow duration-300"
                >
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Focus?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of users who have already improved their productivity and built better focus habits.
            </p>
            <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-block">
              Get Started for Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">FocusMate</span>
          </div>
          <p className="text-gray-400">
            © 2024 FocusMate. Built with ❤️ for better focus and productivity.
          </p>
        </div>
      </footer>
    </div>
  );
}