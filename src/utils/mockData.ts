/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MutationRecord, IndexPlotRecord } from '../types';

export const MOCK_MUTATIONS: MutationRecord[] = [
  {
    id: 'mut_1',
    applicationNumber: 'MUT-2026-1049',
    name: 'আব্দুর রহমান',
    caseNumber: '১২৪/২০২৬-২৭',
    mobile: '01712345678',
    landAmount: '১২.৫',
    address: 'মৌজা: হরিরামপুর, জে.এল নং ৮৪, সাভার, ঢাকা',
    halDag: '২৪৫০',
    sabekDag: '১২১০',
    applicationType: 'মিউটেশন',
    status: 'মঞ্জুর',
    decisionReason: 'দলিল ও সাবেক রেকর্ডের সাথে ওয়ারিশসূত্রে খতিয়ানের ধারাবাহিকতা বিদ্যমান থাকায় এবং সরজমিনে কোনো বিরোধ না পাওয়ায় আবেদনটি মঞ্জুর করা হলো।',
    manualComments: 'খতিয়ান প্রস্তুতের জন্য রেকর্ড রুমে পাঠানো হয়েছে।',
    uploadDate: '2026-06-10',
    synced: false
  },
  {
    id: 'mut_2',
    applicationNumber: 'MUT-2026-2104',
    name: 'মোছাঃ পারভীন আক্তার',
    caseNumber: '৪৫/২০২৬-২৭',
    mobile: '01911223344',
    landAmount: '৫.৭৫',
    address: 'মৌজা: রাজাসন, জে.এল নং ৯২, সাভার, ঢাকা',
    halDag: '১০৫',
    sabekDag: '৪৫',
    applicationType: 'নামজারি',
    status: 'তদন্তাধীন',
    decisionReason: 'ভূমি সহকারী কর্মকর্তা (ইউনিয়ন) কর্তৃক সরজমিন তদন্ত প্রতিবেদন এখনো দাখিল হয়নি।',
    manualComments: 'তদন্ত তাগিদ পত্র পাঠানো হয়েছে। আগামী সপ্তাহে শুনানি।',
    uploadDate: '2026-06-18',
    synced: false
  },
  {
    id: 'mut_3',
    applicationNumber: 'MUT-2026-3012',
    name: 'মোঃ রফিকুল ইসলাম',
    caseNumber: '৩১২/২০২৫-২৬',
    mobile: '01552342341',
    landAmount: '৮.০',
    address: 'মৌজা: তেঁতুলঝোড়া, জে.এল নং ১৫, সাভার, ঢাকা',
    halDag: '৩১০৩',
    sabekDag: '১৫৪৫',
    applicationType: 'দলিল',
    status: 'নামঞ্জুর',
    decisionReason: 'দাতা সাবেক রেকর্ডের মালিক নন এবং মূল দলিলে দাতার নামের বানানের সাথে বায়া দলিলের মিল নেই। কোনো বৈধ ওয়ারিশ সনদ বা আমমোক্তারনামা পাওয়া যায়নি।',
    manualComments: 'আবেদনকারীকে আপিলের সুযোগ দিয়ে ফাইল বন্ধ করা হলো।',
    uploadDate: '2026-05-24',
    synced: false
  },
  {
    id: 'mut_4',
    applicationNumber: 'MUT-2026-4412',
    name: 'নাসরিন জাহান লতা',
    caseNumber: '১৮৯/২০২৬-২৭',
    mobile: '01819876543',
    landAmount: '১৫.২',
    address: 'মৌজা: হরিরামপুর, জে.এল নং ৮৪, সাভার, ঢাকা',
    halDag: '২৪৫২',
    sabekDag: '১২১২',
    applicationType: 'মিউটেশন',
    status: 'অপেক্ষমান',
    decisionReason: 'আবেদনপত্রের সাথে মূল বায়া দলিল এবং হালনাগাদ দাখিলার অনুলিপি সংযুক্ত না থাকায় শুনানির দিন মূল কপি প্রদর্শনের নির্দেশনা দেয়া হয়েছে।',
    manualComments: 'শুনানির তারিখ: ৩০ জুন, ২০২৬',
    uploadDate: '2026-06-22',
    synced: false
  }
];

export const MOCK_INDEX_BOOK: IndexPlotRecord[] = [
  {
    id: 'idx_1',
    halDag: '২৪৫০',
    sabekDag: '১২১০',
    ownerName: 'মৃত করিম বকশ (উত্তরাধিকারী: আব্দুর রহমান)',
    landAmount: '২৫.০',
    address: 'মৌজা: হরিরামপুর, জে.এল নং ৮৪, সাভার, ঢাকা',
    remarks: 'এসএ খতিয়ান নং ৪১০, আরএস খতিয়ান নং ৮৮০'
  },
  {
    id: 'idx_2',
    halDag: '১০five', // Wait, using numbers instead:
    sabekDag: '৪৫',
    ownerName: 'আজিজুল হক ভূঁইয়া',
    landAmount: '১৫.৫',
    address: 'মৌজা: রাজাসন, জে.এল নং ৯২, সাভার, ঢাকা',
    remarks: 'আরএস খতিয়ান নং ১২'
  },
  {
    id: 'idx_3',
    halDag: '১০৫',
    sabekDag: '৪৫',
    ownerName: 'আজিজুল হক ভূঁইয়া',
    landAmount: '১৫.৫',
    address: 'মৌজা: রাজাসন, জে.এল নং ৯২, সাভার, ঢাকা',
    remarks: 'আরএস খতিয়ান নং ১২'
  },
  {
    id: 'idx_4',
    halDag: '৩১০৩',
    sabekDag: '১৫৪৫',
    ownerName: 'শ্রী সুনীল কুমার ঘোষ',
    landAmount: '৮.০',
    address: 'মৌজা: তেঁতুলঝোড়া, জে.এল নং ১৫, সাভার, ঢাকা',
    remarks: 'এসএ খতিয়ান নং ৯০, আরএস খতিয়ান নং ২৩২'
  },
  {
    id: 'idx_5',
    halDag: '২৪৫২',
    sabekDag: '১২১২',
    ownerName: 'মফিজ উদ্দিন প্রামাণিক',
    landAmount: '৩০.৪০',
    address: 'মৌজা: হরিরামপুর, জে.এল নং ৮৪, সাভার, ঢাকা',
    remarks: 'এসএ খতিয়ান নং ৪১২, আরএস খতিয়ান নং ৮৮২'
  },
  {
    id: 'idx_6',
    halDag: '৫০০',
    sabekDag: '২৪০',
    ownerName: 'তাহমিনা চৌধুরী',
    landAmount: '১০.০০',
    address: 'মৌজা: সাভার পৌরসভা, সাভার, ঢাকা',
    remarks: 'আরএস খতিয়ান নং ৫৬'
  },
  {
    id: 'idx_7',
    halDag: '৮৯০',
    sabekDag: '৪১২',
    ownerName: 'মোঃ আব্দুল খালেক',
    landAmount: '১৮.৫',
    address: 'মৌজা: আশুলিয়া, জে.এল নং ৩, সাভার, ঢাকা',
    remarks: 'সিএস খতিয়ান নং ২০, আরএস খতিয়ান নং ৩৩০'
  }
];
