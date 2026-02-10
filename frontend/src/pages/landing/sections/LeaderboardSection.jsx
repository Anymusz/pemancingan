// File: src/components/LeaderboardSection.jsx
import React from "react";
import { LoaderOne, LoaderTwo } from "../../../components/ui/loader";

const LeaderboardSection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">
            Loading Animations Preview
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            2 jenis animasi loading untuk Sistem Pemancingan
          </p>
        </div>

        {/* Grid Loader Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Loader One */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center justify-center h-32">
                <LoaderOne />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Loader One
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Bouncing dots - Untuk loading kecil
                </p>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                  Best for: Button, Card, Inline
                </div>
              </div>
            </div>
          </div>

          {/* Loader Two */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="flex items-center justify-center h-32">
                <LoaderTwo />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                  Loader Two
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Wave text - Untuk loading screen
                </p>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                  Best for: Full Page, Splash Screen
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Example Section */}
        <div className="bg-slate-800 dark:bg-slate-950 rounded-2xl shadow-lg p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            Cara Penggunaan
          </h2>
          <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
              <code>{`import { LoaderOne, LoaderTwo } from '@/components/ui/loader';

// Loader tanpa text (bouncing dots)
<LoaderOne />

// Loader dengan custom text (wave animation)
<LoaderTwo text="Memuat data..." />
<LoaderTwo text="Loading" />
<LoaderTwo text="Mohon tunggu" />`}</code>
            </pre>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
              💡 LoaderOne - Small Loading
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Loading di dalam button</li>
              <li>• Loading inline di card</li>
              <li>• Loading di form input</li>
              <li>• Quick action feedback</li>
            </ul>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">
              🎨 LoaderTwo - Full Page
            </h4>
            <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
              <li>• Initial app loading</li>
              <li>• Fetch data besar (dashboard)</li>
              <li>• Page transition</li>
              <li>• Authentication check</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardSection;
