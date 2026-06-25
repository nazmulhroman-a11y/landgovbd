/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Eye, Edit, Trash2, Download, AlertCircle, Calendar, Phone, CheckCircle, Clock, XCircle, Info, ExternalLink } from 'lucide-react';
import { MutationRecord } from '../types';
import { downloadCSV } from '../utils/csv';

interface MutationListProps {
  records: MutationRecord[];
  onEdit: (record: MutationRecord) => void;
  onDelete: (id: string) => Promise<boolean>;
  isSyncedMode: boolean;
}

export default function MutationList({
  records,
  onEdit,
  onDelete,
  isSyncedMode
}: MutationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<MutationRecord | null>(null);

  // Filter and search logic
  const filteredRecords = records.filter(record => {
    // Status Filter
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false;
    }

    // Search Query (Application No, Name, Case No, Mobile)
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return (
      record.applicationNumber.toLowerCase().includes(query) ||
      record.name.toLowerCase().includes(query) ||
      record.caseNumber.toLowerCase().includes(query) ||
      record.mobile.includes(query)
    );
  });

  // Handle Delete
  const handleDeleteClick = async (id: string, appNo: string) => {
    const isConfirmed = window.confirm(`আপনি কি নিশ্চিত যে আবেদন নম্বর "${appNo}" সম্বলিত মিউটেশন রেকর্ডটি মুছে ফেলতে চান?`);
    if (!isConfirmed) return;

    await onDelete(id);
  };

  // Status Badge Helper
  const getStatusBadge = (status: MutationRecord['status']) => {
    switch (status) {
      case 'মঞ্জুর':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle size={12} />
            মঞ্জুর
          </span>
        );
      case 'নামঞ্জুর':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200 inline-flex items-center gap-1">
            <XCircle size={12} />
            নামঞ্জুর
          </span>
        );
      case 'তদন্তাধীন':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
            <Clock size={12} />
            তদন্তাধীন
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
            <Info size={12} />
            অপেক্ষমান
          </span>
        );
    }
  };

  // Export all filtered records to CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    downloadCSV(
      filteredRecords,
      [
        { key: 'applicationNumber', label: 'আবেদন নম্বর' },
        { key: 'name', label: 'আবেদনকারীর নাম' },
        { key: 'caseNumber', label: 'কেস নম্বর' },
        { key: 'mobile', label: 'মোবাইল নম্বর' },
        { key: 'landAmount', label: 'জমির পরিমাণ (শতাংশ)' },
        { key: 'address', label: 'জমির ঠিকানা' },
        { key: 'halDag', label: 'হাল দাগ' },
        { key: 'sabekDag', label: 'সাবেক দাগ' },
        { key: 'applicationType', label: 'আবেদনের ধরণ' },
        { key: 'status', label: 'স্ট্যাটাস' },
        { key: 'decisionReason', label: 'মঞ্জুর/নামঞ্জুরের কারণ' },
        { key: 'manualComments', label: 'ম্যানুয়াল মন্তব্য' },
        { key: 'uploadDate', label: 'আপলোডের তারিখ' }
      ],
      `ভূমি_অফিস_মিউটেশন_রেকর্ডস_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div id="mutation-list-container" className="space-y-6">
      
      {/* Search and Filters Panel */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="আবেদন নম্বর, আবেদনকারী, কেস বা মোবাইল দিয়ে সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
            />
          </div>

          {/* Right Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer text-slate-700"
            >
              <option value="all">সব ক্যাটাগরি (All Status)</option>
              <option value="মঞ্জুর">মঞ্জুর (Approved)</option>
              <option value="নামঞ্জুর">নামঞ্জুর (Rejected)</option>
              <option value="তদন্তাধীন">তদন্তাধীন (Investigating)</option>
              <option value="অপেক্ষমান">অপেক্ষমান (Pending)</option>
            </select>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              CSV ডাউনলোড
            </button>
          </div>

        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {filteredRecords.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-600 font-bold text-xs uppercase">
                  <th className="py-3.5 px-5">আবেদন ও কেস নম্বর</th>
                  <th className="py-3.5 px-5">আবেদনকারী/মোবাইল</th>
                  <th className="py-3.5 px-5 text-center">হাল / সাবেক দাগ</th>
                  <th className="py-3.5 px-5 text-center">জমির পরিমাণ</th>
                  <th className="py-3.5 px-5">স্ট্যাটাস</th>
                  <th className="py-3.5 px-5 text-center">তারিখ</th>
                  <th className="py-3.5 px-5 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition-all">
                    {/* App Number / Case */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800">{record.applicationNumber}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">কেস: {record.caseNumber || 'প্রদান করা হয়নি'}</div>
                      <div className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {record.applicationType}
                      </div>
                    </td>

                    {/* Applicant & Mobile */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-700">{record.name}</div>
                      <div className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                        <Phone size={11} className="text-slate-400" />
                        {record.mobile || '-'}
                      </div>
                    </td>

                    {/* Plot Numbers */}
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded font-bold text-emerald-800 bg-emerald-50 border border-emerald-100">
                          হাল: {record.halDag || '-'}
                        </span>
                        <span className="px-2 py-0.5 rounded font-semibold text-amber-700 bg-amber-50 border border-amber-100">
                          সাবেক: {record.sabekDag || '-'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px] mx-auto" title={record.address}>
                        {record.address}
                      </div>
                    </td>

                    {/* Land Area */}
                    <td className="py-4 px-5 text-center">
                      <div className="font-extrabold text-slate-800 text-sm">
                        {record.landAmount} <span className="text-xs text-slate-500 font-normal">শতাংশ</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-5">{getStatusBadge(record.status)}</td>

                    {/* Date */}
                    <td className="py-4 px-5 text-center text-xs font-semibold text-slate-600">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {record.uploadDate}
                      </div>
                    </td>

                    {/* Actions Panel */}
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* View details */}
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-all cursor-pointer"
                          title="বিস্তারিত বিবরণ"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Edit record */}
                        <button
                          onClick={() => onEdit(record)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-800 rounded-lg transition-all cursor-pointer"
                          title="সংশোধন করুন"
                        >
                          <Edit size={16} />
                        </button>

                        {/* Delete record */}
                        <button
                          onClick={() => handleDeleteClick(record.id, record.applicationNumber)}
                          className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-slate-300 stroke-[1.2] mb-3" size={48} />
              <h3 className="text-slate-700 font-bold text-base">কোনো মিউটেশন আবেদন পাওয়া যায়নি</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' 
                  ? 'আপনার সার্চ ফিল্টার বা কি-ওয়ার্ড পরিবর্তন করে দেখুন।' 
                  : 'নতুন আবেদন এন্ট্রি ও মেলানো ট্যাব থেকে আবেদন যোগ করুন।'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record details popup Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-2xl w-full overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between border-b-4 border-amber-500">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-amber-400" />
                <h3 className="font-bold text-base md:text-lg">মিউটেশন আবেদনের বিস্তারিত রেকর্ড</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-emerald-100 hover:text-white p-1 hover:bg-emerald-900 rounded-lg transition-all cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Primary Card */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">আবেদন নম্বর</span>
                  <span className="font-bold text-slate-800 text-sm md:text-base">{selectedRecord.applicationNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">কেস নম্বর</span>
                  <span className="font-semibold text-slate-800 text-sm">{selectedRecord.caseNumber || 'প্রদান করা হয়নি'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">আবেদনকারী / দাতা</span>
                  <span className="font-bold text-emerald-800 text-sm">{selectedRecord.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">মোবাইল</span>
                  <span className="font-semibold text-slate-700 text-sm">{selectedRecord.mobile || 'প্রদান করা হয়নি'}</span>
                </div>
              </div>

              {/* Land info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">জমির খতিয়ান ও দাগ সূচী</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-slate-400 block">হাল দাগ</span>
                    <span className="font-extrabold text-emerald-800 text-base">{selectedRecord.halDag || '-'}</span>
                  </div>
                  <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                    <span className="text-[10px] font-bold text-slate-400 block">সাবেক দাগ</span>
                    <span className="font-bold text-amber-700 text-base">{selectedRecord.sabekDag || '-'}</span>
                  </div>
                  <div className="bg-slate-100/50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">পরিমাণ</span>
                    <span className="font-extrabold text-slate-800 text-base">{selectedRecord.landAmount} শতাংশ</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">জমির ঠিকানা ও মৌজা</span>
                  <p className="text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100">
                    {selectedRecord.address || 'প্রদান করা হয়নি'}
                  </p>
                </div>
              </div>

              {/* Decision Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">সিদ্ধান্ত ও বিবরণ</h4>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">বর্তমান স্ট্যাটাস:</span>
                  {getStatusBadge(selectedRecord.status)}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">মঞ্জুর/নামঞ্জুরের কারণ বা বিবরণ</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg mt-1 border border-slate-100 leading-relaxed font-medium">
                    {selectedRecord.decisionReason || 'কোনো কারণ বা বিবরণ সংযুক্ত করা হয়নি।'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">ম্যানুয়াল মন্তব্য ও করণীয়</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg mt-1 border border-slate-100 leading-relaxed font-medium">
                    {selectedRecord.manualComments || 'কোনো মন্তব্য নেই।'}
                  </p>
                </div>
              </div>

              {/* App Meta */}
              <div className="flex justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100">
                <span>আপলোডের তারিখ: {selectedRecord.uploadDate}</span>
                <span>ID: {selectedRecord.id}</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                onClick={() => {
                  onEdit(selectedRecord);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit size={13} />
                সম্পাদনা করুন
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
