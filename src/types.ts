/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MutationRecord {
  id: string; // Unique local or remote ID
  applicationNumber: string; // আবেদন নম্বর
  name: string; // আবেদনকারীর নাম
  caseNumber: string; // কেস নম্বর
  mobile: string; // মোবাইল নম্বর
  landAmount: string; // জমির পরিমাণ (শতাংশ)
  address: string; // জমির ঠিকানা (মৌজা, গ্রাম)
  halDag: string; // হাল দাগ
  sabekDag: string; // সাবেক দাগ
  applicationType: 'মিউটেশন' | 'নামজারি' | 'দলিল'; // আবেদনের ধরণ
  status: 'মঞ্জুর' | 'নামঞ্জুর' | 'তদন্তাধীন' | 'অপেক্ষমান'; // সিদ্ধান্ত / স্ট্যাটাস
  decisionReason: string; // মঞ্জুর/নামঞ্জুরের কারণ বা বিবরণ
  manualComments: string; // ম্যানুয়াল মন্তব্য
  uploadDate: string; // আপলোডের তারিখ
  synced?: boolean; // Web App এ সিঙ্কড কিনা
}

export interface IndexPlotRecord {
  id: string;
  halDag: string; // হাল দাগ
  sabekDag: string; // সাবেক দাগ
  ownerName: string; // জোতদার/মালিকের নাম
  landAmount: string; // জমির পরিমাণ (শতাংশ)
  address: string; // ঠিকানা / মৌজা
  remarks?: string; // মন্তব্য
}

export interface SyncSettings {
  appsScriptUrl: string; // Google Apps Script Web App URL
  isConnected: boolean;
  lastSyncTime: string | null;
}
