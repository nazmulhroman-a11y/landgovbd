/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Landmark, Cloud, CloudOff, Clock, Database, FileSpreadsheet, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'mutations' | 'new-entry' | 'index-book' | 'sync-settings';
  setActiveTab: (tab: 'mutations' | 'new-entry' | 'index-book' | 'sync-settings') => void;
  isSyncedMode: boolean;
  isConnected: boolean;
  totalMutations: number;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  isSyncedMode,
  isConnected,
  totalMutations
}: NavbarProps) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Dhaka'
      };
      
      const banglaDigits: { [key: string]: string } = {
        '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
        '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯',
        'AM': 'পূর্বাহ্ণ', 'PM': 'অপরাহ্ণ', ':': ':', ' ': ' '
      };

      const rawTime = now.toLocaleTimeString('en-US', options);
      const convertedTime = rawTime.split('').map(char => banglaDigits[char] || char).join('');
      
      const dateOptions: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Dhaka'
      };
      const rawDate = now.toLocaleDateString('bn-BD', dateOptions);

      setTimeStr(`${rawDate} | সময়: ${convertedTime}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-emerald-900 text-white shadow-xl border-b-4 border-amber-500 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          {/* Brand/Title */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-emerald-950 p-2.5 rounded-lg shadow-inner flex items-center justify-center animate-pulse">
              <Landmark size={28} className="stroke-[2]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-amber-100 flex items-center gap-2">
                ইউনিয়ন ভূমি অফিস ডিজিটালাইজেশন সিস্টেম
              </h1>
              <p className="text-xs text-emerald-200 font-medium">
                ভূমি সেবা অটো-মিউটেশন ও হাল/সাবেক সূচী বই মেলানোর সহজ পোর্টাল
              </p>
            </div>
          </div>

          {/* Right Status Panel */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-emerald-100 bg-emerald-950/60 p-2 rounded-lg border border-emerald-800/80">
            {/* Clock */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-r border-emerald-800/80 last:border-0">
              <Clock size={14} className="text-amber-400" />
              <span>{timeStr || 'লোড হচ্ছে...'}</span>
            </div>

            {/* Sync Mode Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-r border-emerald-800/80 last:border-0">
              {isSyncedMode ? (
                <>
                  <Cloud size={14} className="text-emerald-400 animate-bounce" />
                  <span className="font-semibold text-emerald-300">গুগল শিট সিঙ্ক সক্রিয়</span>
                </>
              ) : (
                <>
                  <Database size={14} className="text-amber-400" />
                  <span className="font-semibold text-amber-300">অফলাইন ডেমো ডাটাবেস</span>
                </>
              )}
            </div>

            {/* Connection Health Indicator */}
            <div className="flex items-center gap-1.5 px-1 py-1">
              <span className={`relative flex h-2.5 w-2.5`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="font-medium">
                {isSyncedMode ? (isConnected ? 'সংযুক্ত' : 'অসংযুক্ত') : 'সক্রিয়'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-px border-t border-emerald-800 mt-2 scrollbar-none">
          <button
            id="nav-tab-mutations"
            onClick={() => setActiveTab('mutations')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === 'mutations'
                ? 'border-amber-400 text-amber-400 bg-emerald-950/40'
                : 'border-transparent text-emerald-100 hover:text-white hover:border-emerald-600'
            }`}
          >
            <Database size={16} />
            মিউটেশন কেস রেজিস্টার ({totalMutations})
          </button>

          <button
            id="nav-tab-new-entry"
            onClick={() => setActiveTab('new-entry')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === 'new-entry'
                ? 'border-amber-400 text-amber-400 bg-emerald-950/40'
                : 'border-transparent text-emerald-100 hover:text-white hover:border-emerald-600'
            }`}
          >
            <Landmark size={16} />
            নতুন আবেদন এন্ট্রি ও মেলানো
          </button>

          <button
            id="nav-tab-index-book"
            onClick={() => setActiveTab('index-book')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === 'index-book'
                ? 'border-amber-400 text-amber-400 bg-emerald-950/40'
                : 'border-transparent text-emerald-100 hover:text-white hover:border-emerald-600'
            }`}
          >
            <FileSpreadsheet size={16} />
            সাবেক/হাল দাগের সূচী বই
          </button>

          <button
            id="nav-tab-sync-settings"
            onClick={() => setActiveTab('sync-settings')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ml-auto ${
              activeTab === 'sync-settings'
                ? 'border-amber-400 text-amber-400 bg-emerald-950/40'
                : 'border-transparent text-emerald-100 hover:text-white hover:border-emerald-600'
            }`}
          >
            <Settings size={16} />
            গুগল শিট কানেকশন সেটিংস
          </button>
        </div>
      </div>
    </header>
  );
}
