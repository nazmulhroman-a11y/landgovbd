/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cloud, Link, Check, Copy, AlertCircle, RefreshCw, FileSpreadsheet, HelpCircle, ArrowRight } from 'lucide-react';
import { SyncSettings as SyncSettingsType } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/appsScriptCode';

interface SyncSettingsProps {
  settings: SyncSettingsType;
  onSaveSettings: (url: string) => void;
  onTestConnection: () => Promise<boolean>;
  onSyncNow: () => Promise<void>;
  isTesting: boolean;
  isSyncing: boolean;
}

export default function SyncSettings({
  settings,
  onSaveSettings,
  onTestConnection,
  onSyncNow,
  isTesting,
  isSyncing
}: SyncSettingsProps) {
  const [urlInput, setUrlInput] = useState(settings.appsScriptUrl);
  const [copied, setCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(urlInput.trim());
    setTestResult(null);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    setTestResult(null);
    const success = await onTestConnection();
    if (success) {
      setTestResult({
        success: true,
        message: 'গুগল স্প্রেডশিটের সাথে সফলভাবে সংযোগ স্থাপন করা হয়েছে!'
      });
    } else {
      setTestResult({
        success: false,
        message: 'সংযোগ স্থাপন করা সম্ভব হয়নি। ইউআরএল (URL) চেক করুন এবং নিশ্চিত করুন যে স্ক্রিপ্টটি সঠিকভাবে ডেপ্লয় করা হয়েছে।'
      });
    }
  };

  return (
    <div id="sync-settings-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Column 1 & 2: Settings and connection details */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Connection Form Card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
            <Cloud className="text-emerald-600" />
            গুগল স্প্রেডশিট ডেটাবেস সংযোগ
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            নিচে আপনার গুগল অ্যাপস স্ক্রিপ্ট (Google Apps Script) ওয়েব অ্যাপ ইউআরএলটি প্রদান করুন, যাতে আপনার অফিসের সকল ডেটা সরাসরি আপনার নিজস্ব গুগল স্প্রেডশিটে সেভ হতে পারে।
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="apps-script-url" className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Link size={16} className="text-slate-400" />
                Google Apps Script Web App URL
              </label>
              <div className="flex gap-2">
                <input
                  id="apps-script-url"
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-emerald-600/10 transition-all cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </form>

          {/* Connection Test Controls */}
          {settings.appsScriptUrl && (
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${settings.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm font-bold text-slate-700">
                  সংযোগের অবস্থা:{' '}
                  <span className={settings.isConnected ? 'text-green-600' : 'text-red-500'}>
                    {settings.isConnected ? 'সংযুক্ত (Connected)' : 'অসংযুক্ত'}
                  </span>
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
                  {isTesting ? 'পরীক্ষা করা হচ্ছে...' : 'সংযোগ পরীক্ষা করুন'}
                </button>

                {settings.isConnected && (
                  <button
                    onClick={onSyncNow}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সব সিঙ্ক করুন'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Test results indicator */}
          {testResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 border ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              {testResult.success ? (
                <Check className="shrink-0 mt-0.5 text-emerald-600" size={18} />
              ) : (
                <AlertCircle className="shrink-0 mt-0.5 text-red-600" size={18} />
              )}
              <p className="text-xs font-semibold">{testResult.message}</p>
            </div>
          )}
        </div>

        {/* Step-by-Step setup guide card */}
        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <HelpCircle className="text-amber-500" />
            গুগল স্প্রেডশিট ডেটাবেস তৈরির সহজ নির্দেশিকা
          </h3>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">১</span>
              <p>
                প্রথমে আপনার গুগল ড্রাইভ থেকে একটি নতুন <strong>Google Sheet</strong> তৈরি করুন এবং এর একটি সুন্দর নাম দিন (যেমন: <code>ভূমি অফিস ডেটাবেস</code>)।
              </p>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">২</span>
              <p>
                স্প্রেডশিটের উপরের মেনুবার থেকে <strong>Extensions &gt; Apps Script</strong> এ ক্লিক করুন। একটি নতুন কোড উইন্ডো ওপেন হবে।
              </p>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">৩</span>
              <p>
                ডান পাশের বক্স থেকে <strong>"গুগল অ্যাপস স্ক্রিপ্ট কোড"</strong> কপি করুন এবং আগের উইন্ডোর সকল কোড মুছে দিয়ে এটি পেস্ট করুন।
              </p>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">৪</span>
              <p>
                উপরে ডানদিকের <strong>Deploy &gt; New deployment</strong> বাটনে ক্লিক করুন। <br />
                - Select Type: <strong>Web app</strong> (গিয়ার আইকন থেকে সিলেক্ট করুন)<br />
                - Execute as: <strong>Me (your-email)</strong><br />
                - Who has access: <strong>Anyone</strong> (অবশ্যই "Anyone" সিলেক্ট করবেন)<br />
                এরপর <strong>Deploy</strong> এ ক্লিক করুন। প্রয়োজনে Google কে authorization দিন।
              </p>
            </div>

            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs">৫</span>
              <p>
                ডিপ্লয় সফল হলে একটি <strong>Web app URL</strong> পাবেন। সেই URL-টি কপি করে উপরে এনে বসিয়ে দিয়ে <strong>"সংরক্ষণ করুন"</strong> বাটনে ক্লিক করুন।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Copy Code Panel */}
      <div className="bg-slate-900 text-slate-100 rounded-xl shadow-xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-1.5">
              <FileSpreadsheet size={18} />
              গুগল অ্যাপস স্ক্রিপ্ট কোড
            </h3>
            <button
              onClick={handleCopyCode}
              className={`p-2 rounded-lg flex items-center gap-1.5 transition-all text-xs cursor-pointer font-semibold ${
                copied ? 'bg-green-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'কপি হয়েছে' : 'কপি করুন'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            এই কোডটি সরাসরি কপি করে গুগল অ্যাপস স্ক্রিপ্টে পেস্ট করুন। এটি আপনার জন্য স্বয়ংক্রিয়ভাবে স্প্রেডশিটে <strong>Mutations</strong> ও <strong>IndexBook</strong> শীট দুটি তৈরি করবে।
          </p>
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-300 leading-relaxed overflow-y-auto max-h-[350px] scrollbar-thin select-all">
            {GOOGLE_APPS_SCRIPT_CODE}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ArrowRight size={14} className="text-amber-400" />
            <span>কোডটি আপনার স্প্রেডশিটে রান করার পর স্বয়ংক্রিয়ভাবে হেডার ও ফরম্যাট তৈরি হবে।</span>
          </div>
        </div>
      </div>

    </div>
  );
}
