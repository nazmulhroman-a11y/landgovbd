/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ইউনিয়ন ভূমি অফিস - মিউটেশন ও সূচী রেকর্ড ব্যবস্থাপনা সিস্টেম
 * Google Apps Script Backend API
 * 
 * এই কোডটি আপনার গুগল স্প্রেডশিটের "Extensions" -> "Apps Script" মেনুতে গিয়ে পেস্ট করুন।
 * তারপর "Deploy" -> "New deployment" এ ক্লিক করে Web App হিসেবে ডেপ্লয় করুন।
 * Access: "Anyone" নির্বাচন করুন, যাতে ফ্রন্টএন্ড অ্যাপটি এর সাথে যোগাযোগ করতে পারে।
 */

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "readAll") {
    return handleReadAll();
  } else if (action === "readIndexBook") {
    return handleReadIndexBook();
  }
  
  return createJSONResponse({ status: "error", message: "Invalid GET action: " + action });
}

function doPost(e) {
  var result;
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    
    if (action === "createMutation") {
      result = handleCreateMutation(postData.data);
    } else if (action === "updateMutation") {
      result = handleUpdateMutation(postData.data);
    } else if (action === "deleteMutation") {
      result = handleDeleteMutation(postData.id);
    } else if (action === "syncIndexBook") {
      result = handleSyncIndexBook(postData.data);
    } else if (action === "testConnection") {
      result = { status: "success", message: "ভূমি অফিস কানেকশন সফল হয়েছে!" };
    } else {
      result = { status: "error", message: "Invalid POST action" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }
  
  return createJSONResponse(result);
}

// JSON Response Helper with CORS support
function createJSONResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Sheets Access Helpers
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    setupHeaders(sheet, sheetName);
  }
  return sheet;
}

function setupHeaders(sheet, sheetName) {
  if (sheetName === "Mutations") {
    sheet.appendRow([
      "আইডি", "আবেদন নম্বর", "নাম", "কেস নম্বর", "মোবাইল", 
      "জমির পরিমাণ", "ঠিকানা", "হাল দাগ", "সাবেক দাগ", 
      "আবেদনের ধরণ", "স্ট্যাটাস", "মঞ্জুর/নামঞ্জুরের কারণ", 
      "ম্যানুয়াল মন্তব্য", "আপলোডের তারিখ"
    ]);
    sheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#e2f0d9");
  } else if (sheetName === "IndexBook") {
    sheet.appendRow([
      "আইডি", "হাল দাগ", "সাবেক দাগ", "মালিকের নাম", "জমির পরিমাণ", "ঠিকানা", "মন্তব্য"
    ]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#fce4d6");
  }
}

// 1. Read All Mutations
function handleReadAll() {
  var sheet = getOrCreateSheet("Mutations");
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJSONResponse([]);
  }
  
  var headers = data[0];
  var records = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    records.push({
      id: row[0].toString(),
      applicationNumber: row[1].toString(),
      name: row[2].toString(),
      caseNumber: row[3].toString(),
      mobile: row[4].toString(),
      landAmount: row[5].toString(),
      address: row[6].toString(),
      halDag: row[7].toString(),
      sabekDag: row[8].toString(),
      applicationType: row[9].toString(),
      status: row[10].toString(),
      decisionReason: row[11].toString(),
      manualComments: row[12].toString(),
      uploadDate: row[13].toString()
    });
  }
  
  return createJSONResponse(records);
}

// 2. Read Index Book
function handleReadIndexBook() {
  var sheet = getOrCreateSheet("IndexBook");
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJSONResponse([]);
  }
  
  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    records.push({
      id: row[0].toString(),
      halDag: row[1].toString(),
      sabekDag: row[2].toString(),
      ownerName: row[3].toString(),
      landAmount: row[4].toString(),
      address: row[5].toString(),
      remarks: row[6].toString()
    });
  }
  
  return createJSONResponse(records);
}

// 3. Create Mutation
function handleCreateMutation(item) {
  var sheet = getOrCreateSheet("Mutations");
  
  sheet.appendRow([
    item.id,
    item.applicationNumber,
    item.name,
    item.caseNumber,
    item.mobile,
    item.landAmount,
    item.address,
    item.halDag,
    item.sabekDag,
    item.applicationType,
    item.status,
    item.decisionReason,
    item.manualComments,
    item.uploadDate
  ]);
  
  return { status: "success", message: "Mutation created successfully", id: item.id };
}

// 4. Update Mutation
function handleUpdateMutation(item) {
  var sheet = getOrCreateSheet("Mutations");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === item.id.toString()) {
      var rowIndex = i + 1; // 1-indexed and header row
      
      sheet.getRange(rowIndex, 2).setValue(item.applicationNumber);
      sheet.getRange(rowIndex, 3).setValue(item.name);
      sheet.getRange(rowIndex, 4).setValue(item.caseNumber);
      sheet.getRange(rowIndex, 5).setValue(item.mobile);
      sheet.getRange(rowIndex, 6).setValue(item.landAmount);
      sheet.getRange(rowIndex, 7).setValue(item.address);
      sheet.getRange(rowIndex, 8).setValue(item.halDag);
      sheet.getRange(rowIndex, 9).setValue(item.sabekDag);
      sheet.getRange(rowIndex, 10).setValue(item.applicationType);
      sheet.getRange(rowIndex, 11).setValue(item.status);
      sheet.getRange(rowIndex, 12).setValue(item.decisionReason);
      sheet.getRange(rowIndex, 13).setValue(item.manualComments);
      sheet.getRange(rowIndex, 14).setValue(item.uploadDate);
      
      return { status: "success", message: "Mutation updated successfully" };
    }
  }
  
  return { status: "error", message: "Mutation not found with ID: " + item.id };
}

// 5. Delete Mutation
function handleDeleteMutation(id) {
  var sheet = getOrCreateSheet("Mutations");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Mutation deleted successfully" };
    }
  }
  
  return { status: "error", message: "Mutation not found" };
}

// 6. Bulk Sync Index Book
function handleSyncIndexBook(items) {
  var sheet = getOrCreateSheet("IndexBook");
  
  // Clear previous records except headers
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  if (items && items.length > 0) {
    var rows = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      rows.push([
        item.id || "idx_" + i + "_" + Date.now(),
        item.halDag || "",
        item.sabekDag || "",
        item.ownerName || "",
        item.landAmount || "",
        item.address || "",
        item.remarks || ""
      ]);
    }
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }
  
  return { status: "success", message: "Index book synced with " + items.length + " entries" };
}
`;
