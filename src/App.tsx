/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MutationList from './components/MutationList';
import MutationForm from './components/MutationForm';
import IndexBookManager from './components/IndexBookManager';
import SyncSettings from './components/SyncSettings';
import { MutationRecord, IndexPlotRecord, SyncSettings as SyncSettingsType } from './types';
import { MOCK_MUTATIONS, MOCK_INDEX_BOOK } from './utils/mockData';

export default function App() {
  // 1. Core States
  const [activeTab, setActiveTab] = useState<'mutations' | 'new-entry' | 'index-book' | 'sync-settings'>('mutations');
  const [mutations, setMutations] = useState<MutationRecord[]>([]);
  const [indexRecords, setIndexRecords] = useState<IndexPlotRecord[]>([]);
  const [editRecord, setEditRecord] = useState<MutationRecord | null>(null);

  // 2. Integration / Synchronizer States
  const [syncSettings, setSyncSettings] = useState<SyncSettingsType>({
    appsScriptUrl: '',
    isConnected: false,
    lastSyncTime: null
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 3. Initial Load from LocalStorage or Fallback Mock Data
  useEffect(() => {
    // Load Mutations
    const savedMutations = localStorage.getItem('land_mutations');
    if (savedMutations) {
      try {
        setMutations(JSON.parse(savedMutations));
      } catch (e) {
        setMutations(MOCK_MUTATIONS);
      }
    } else {
      setMutations(MOCK_MUTATIONS);
      localStorage.setItem('land_mutations', JSON.stringify(MOCK_MUTATIONS));
    }

    // Load Index Book
    const savedIndexBook = localStorage.getItem('land_index_book');
    if (savedIndexBook) {
      try {
        setIndexRecords(JSON.parse(savedIndexBook));
      } catch (e) {
        setIndexRecords(MOCK_INDEX_BOOK);
      }
    } else {
      setIndexRecords(MOCK_INDEX_BOOK);
      localStorage.setItem('land_index_book', JSON.stringify(MOCK_INDEX_BOOK));
    }

    // Load Sync Settings
    const savedSettings = localStorage.getItem('land_sync_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSyncSettings(parsed);
      } catch (e) {
        // use default empty settings
      }
    }
  }, []);

  // Save changes to LocalStorage whenever state changes
  useEffect(() => {
    if (mutations.length > 0) {
      localStorage.setItem('land_mutations', JSON.stringify(mutations));
    }
  }, [mutations]);

  useEffect(() => {
    if (indexRecords.length > 0) {
      localStorage.setItem('land_index_book', JSON.stringify(indexRecords));
    }
  }, [indexRecords]);

  // 4. Remote Web App API Integrations
  // Test connection to Apps Script Web App URL
  const testConnection = async (urlOverride?: string): Promise<boolean> => {
    const url = urlOverride !== undefined ? urlOverride : syncSettings.appsScriptUrl;
    if (!url) return false;

    setIsTesting(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action: 'testConnection' })
      });

      const resJson = await response.json();
      const success = resJson && resJson.status === 'success';

      setSyncSettings(prev => {
        const updated = { ...prev, isConnected: success };
        localStorage.setItem('land_sync_settings', JSON.stringify(updated));
        return updated;
      });

      return success;
    } catch (err) {
      console.error('Connection test error:', err);
      setSyncSettings(prev => {
        const updated = { ...prev, isConnected: false };
        localStorage.setItem('land_sync_settings', JSON.stringify(updated));
        return updated;
      });
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  // Full Synchronize Action (Fetch latest Mutations & Index Book from Spreadsheet)
  const syncNow = async () => {
    if (!syncSettings.appsScriptUrl || !syncSettings.isConnected) return;

    setIsSyncing(true);
    try {
      // 1. Fetch remote Mutations
      const mutationResponse = await fetch(`${syncSettings.appsScriptUrl}?action=readAll`, {
        method: 'GET',
        redirect: 'follow'
      });
      const remoteMutations: MutationRecord[] = await mutationResponse.json();

      // 2. Fetch remote Index Book
      const indexResponse = await fetch(`${syncSettings.appsScriptUrl}?action=readIndexBook`, {
        method: 'GET',
        redirect: 'follow'
      });
      const remoteIndexBook: IndexPlotRecord[] = await indexResponse.json();

      // Update state and local storage
      if (Array.isArray(remoteMutations)) {
        setMutations(remoteMutations.map(m => ({ ...m, synced: true })));
        localStorage.setItem('land_mutations', JSON.stringify(remoteMutations));
      }

      if (Array.isArray(remoteIndexBook)) {
        setIndexRecords(remoteIndexBook);
        localStorage.setItem('land_index_book', JSON.stringify(remoteIndexBook));
      }

      setSyncSettings(prev => {
        const updated = {
          ...prev,
          lastSyncTime: new Date().toLocaleString('bn-BD'),
          isConnected: true
        };
        localStorage.setItem('land_sync_settings', JSON.stringify(updated));
        return updated;
      });

      alert('গুগল স্প্রেডশিটের সাথে সকল মিউটেশন ও সূচী বইয়ের তথ্য সাফল্যের সাথে সিঙ্ক করা হয়েছে!');
    } catch (err) {
      console.error('Sync failure:', err);
      alert('সিঙ্ক করার সময় কিছু সমস্যা হয়েছে। স্প্রেডশিটের নেটওয়ার্ক বা কানেকশন সেটিংস চেক করুন।');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Settings from settings panel
  const saveSyncSettings = async (url: string) => {
    const updated = { ...syncSettings, appsScriptUrl: url, isConnected: false };
    setSyncSettings(updated);
    localStorage.setItem('land_sync_settings', JSON.stringify(updated));

    if (url) {
      // Proactively test connection
      await testConnection(url);
    }
  };

  // Save Mutation (either locally or sync to Google Sheet)
  const saveMutation = async (record: MutationRecord): Promise<boolean> => {
    const isEditing = mutations.some(m => m.id === record.id);
    let synced = false;

    // Try Google Sheets update first if connected
    if (syncSettings.appsScriptUrl && syncSettings.isConnected) {
      try {
        const action = isEditing ? 'updateMutation' : 'createMutation';
        const response = await fetch(syncSettings.appsScriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({
            action,
            data: record
          })
        });

        const resJson = await response.json();
        if (resJson && resJson.status === 'success') {
          synced = true;
        }
      } catch (err) {
        console.error('Remote save failed, falling back to local storage:', err);
      }
    }

    const updatedRecord = { ...record, synced };

    if (isEditing) {
      setMutations(prev => prev.map(m => m.id === record.id ? updatedRecord : m));
    } else {
      setMutations(prev => [updatedRecord, ...prev]);
    }

    setEditRecord(null);
    setActiveTab('mutations');
    return true;
  };

  // Delete Mutation (either locally or sync to Google Sheet)
  const deleteMutation = async (id: string): Promise<boolean> => {
    let deletedRemotely = false;

    // Try Google Sheets deletion first if connected
    if (syncSettings.appsScriptUrl && syncSettings.isConnected) {
      try {
        const response = await fetch(syncSettings.appsScriptUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify({
            action: 'deleteMutation',
            id
          })
        });

        const resJson = await response.json();
        if (resJson && resJson.status === 'success') {
          deletedRemotely = true;
        }
      } catch (err) {
        console.error('Remote delete failed, clearing locally:', err);
      }
    }

    setMutations(prev => prev.filter(m => m.id !== id));
    
    if (syncSettings.isConnected && !deletedRemotely) {
      alert('রেকর্ডটি লোকাল থেকে ডিলিট করা হয়েছে, তবে রিমোট স্প্রেডশিট থেকে ডিলিট করা সম্ভব হয়নি। সংযোগটি চেক করুন।');
    } else {
      alert('রেকর্ডটি সফলভাবে মুছে ফেলা হয়েছে!');
    }

    return true;
  };

  // Bulk Upload/Sync Plot Index Book records to Google Sheet
  const syncIndexBook = async (records: IndexPlotRecord[]): Promise<boolean> => {
    if (!syncSettings.appsScriptUrl || !syncSettings.isConnected) {
      return false; // Stays only in local storage if not connected
    }

    try {
      const response = await fetch(syncSettings.appsScriptUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          action: 'syncIndexBook',
          data: records
        })
      });

      const resJson = await response.json();
      return resJson && resJson.status === 'success';
    } catch (err) {
      console.error('Index Book upload to Google Sheet failed:', err);
      return false;
    }
  };

  const handleEditTrigger = (record: MutationRecord) => {
    setEditRecord(record);
    setActiveTab('new-entry');
  };

  const handleCancelEdit = () => {
    setEditRecord(null);
    setActiveTab('mutations');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncedMode={syncSettings.appsScriptUrl !== '' && syncSettings.isConnected}
        isConnected={syncSettings.isConnected}
        totalMutations={mutations.length}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Sync Info Header Bar if connected */}
        {syncSettings.appsScriptUrl && syncSettings.isConnected && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs font-semibold text-emerald-800">
              <span className="font-bold">✓ গুগল স্প্রেডশিট কানেকশন সক্রিয়:</span> {syncSettings.appsScriptUrl.substring(0, 50)}...
              {syncSettings.lastSyncTime && (
                <span className="ml-3 text-slate-500 font-normal">সর্বশেষ সিঙ্ক: {syncSettings.lastSyncTime}</span>
              )}
            </div>
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
            >
              এখনই রিলোড / সিঙ্ক করুন
            </button>
          </div>
        )}

        {/* Tab Router Panels */}
        <div className="animate-fade-in">
          {activeTab === 'mutations' && (
            <MutationList
              records={mutations}
              onEdit={handleEditTrigger}
              onDelete={deleteMutation}
              isSyncedMode={syncSettings.appsScriptUrl !== '' && syncSettings.isConnected}
            />
          )}

          {activeTab === 'new-entry' && (
            <MutationForm
              onSave={saveMutation}
              indexRecords={indexRecords}
              editRecord={editRecord}
              onCancelEdit={handleCancelEdit}
            />
          )}

          {activeTab === 'index-book' && (
            <IndexBookManager
              indexRecords={indexRecords}
              setIndexRecords={setIndexRecords}
              onSyncWithServer={syncIndexBook}
              isSyncedMode={syncSettings.appsScriptUrl !== '' && syncSettings.isConnected}
            />
          )}

          {activeTab === 'sync-settings' && (
            <SyncSettings
              settings={syncSettings}
              onSaveSettings={saveSyncSettings}
              onTestConnection={() => testConnection()}
              onSyncNow={syncNow}
              isTesting={isTesting}
              isSyncing={isSyncing}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs mt-12 border-t border-slate-800">
        <p className="font-semibold text-slate-500">
          ভূমি সেবা অটো-মিউটেশন পোর্টাল © ২০২৬ | ইউনিয়ন ভূমি সহকারী কার্যালয়
        </p>
        <p className="text-[10px] mt-1 text-slate-600">
          নিরাপদ ডাটা আদান প্রদানের জন্য গুগল সিকিউর অ্যাপস স্ক্রিপ্ট ও স্প্রেডশিট প্রযুক্তি দ্বারা চালিত
        </p>
      </footer>
    </div>
  );
}
