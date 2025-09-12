import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  UserCircle,
  Eye,
  X,
  Calendar,
  Clock,
  Upload,
  FileText,
  Plus,
  Minus,
} from "lucide-react";

const Intimation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("orderNo");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");
  const [loadingData, setLoadingData] = useState(false);
  const [showIntimationModal, setShowIntimationModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [dropdownData, setDropdownData] = useState({
    machines: [],
    engineers: [],
    services: []
  });

  const API_URL = "https://script.google.com/macros/s/AKfycbzuNLpnDvKCNwtfWvNttA3SZEl0EBNTdszqFDRu4eqjrQSJvy9lA7UG-NAGrbMqCx5d/exec";
  const DRIVE_FOLDER_ID = "1C_5l0mf4iLYkpWiJ0uL-Gs92BahBWSKp";

  const [intimationData, setIntimationData] = useState({
    clientStatus: "",
    intimationRequired: "",
    machineNames: [""],
    installationService: "",
    engineerName: "",
    serviceVideo: null,
    nextDate: "",
    remarks: ""
  });

  // Handle file click to open in new tab without downloading
  const handleFileView = (fileName) => {
    if (!fileName || fileName.trim() === '') return;

    if (fileName.includes('drive.google.com')) {
      let viewUrl = fileName;

      if (fileName.includes('/view')) {
        viewUrl = fileName.replace('/view', '/preview');
      } else if (fileName.includes('id=')) {
        const fileId = fileName.split('id=')[1].split('&')[0];
        viewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      } else if (!fileName.includes('/preview')) {
        viewUrl = fileName + '/preview';
      }

      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(fileName, '_blank', 'noopener,noreferrer');
    }
  };

  // Fetch data from Google Sheets
  const fetchSheetData = async (sheetName) => {
    try {
      const response = await fetch(`${API_URL}?sheet=${sheetName}&action=fetch`);
      const result = await response.json();

      if (result.success && result.data) {
        console.log(`${sheetName} data fetched:`, result.data.length, 'rows');
        return result.data;
      } else {
        console.error(`Failed to fetch ${sheetName} data:`, result.error);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ${sheetName} data:`, error);
      return [];
    }
  };

  // const formatDateTimeFromISO = (isoString) => {
  //   if (!isoString) return "";

  //   try {
  //     const date = new Date(isoString);
  //     if (isNaN(date.getTime())) return isoString; // Return original if invalid date

  //     const day = String(date.getDate()).padStart(2, '0');
  //     const month = String(date.getMonth() + 1).padStart(2, '0');
  //     const year = date.getFullYear();
  //     const hours = String(date.getHours()).padStart(2, '0');
  //     const minutes = String(date.getMinutes()).padStart(2, '0');
  //     const seconds = String(date.getSeconds()).padStart(2, '0');

  //     return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  //   } catch (e) {
  //     console.log('Date formatting failed for:', isoString);
  //     return isoString;
  //   }
  // };

  // Process pending data from FMS sheet

  const processPendingData = (rawData) => {
    if (rawData && rawData.length > 6) {
      const dataRows = rawData.slice(6);
      console.log('FMS raw data rows after header skip:', dataRows.length);

      const formattedData = dataRows
        .map((row, index) => {
          const record = {
            id: `pending_${index + 1}`,
            orderNo: row[1] || "",
            installationRequired: row[2] || "",
            companyName: row[3] || "",
            contactPersonName: row[4] || "",
            contactPersonNo: row[5] || "",
            invoiceDate: formatDateForDisplay(row[6]) || "",
            invoiceNo: row[7] || "",
            invoiceCopy: row[8] || "",
            actualMaterial: formatDateForDisplay(row[9]) || "",
            columnK: row[10] || "",
            columnL: row[11] || "",
            nextDate: formatDateForDisplay(row[13]) || "",
          };

          if (index < 5) {
            console.log(`Pending Row ${index}:`, {
              orderNo: record.orderNo,
              columnK: record.columnK,
              columnL: record.columnL,
              shouldShow: record.orderNo && record.columnK && record.columnK.trim() !== "" && (!record.columnL || record.columnL.trim() === "")
            });
          }

          return record;
        })
        .filter(record => {
          const hasOrderNo = record.orderNo && record.orderNo.trim() !== "";
          const hasColumnK = record.columnK && record.columnK.trim() !== "";
          const columnLEmpty = !record.columnL || record.columnL.trim() === "";

          return hasOrderNo && hasColumnK && columnLEmpty;
        });

      console.log('Processed pending data:', formattedData.length, 'records');
      return formattedData;
    } else {
      console.log('No FMS data or insufficient rows');
      return [];
    }
  };

  // Process history data from Service Installation sheet - UPDATED to start from row 7
  const processHistoryData = (rawData) => {
    if (rawData && rawData.length > 6) {
      // Changed from slice(1) to slice(6) to start from row 7 (0-based indexing)
      const dataRows = rawData.slice(6);
      console.log('Service Installation raw data rows after row 6 header skip:', dataRows.length);

      const formattedData = dataRows
        .map((row, index) => ({
          id: `history_${index + 1}`,
          timestamp: row[0] || "",
          serialNo: row[1] || "",
          orderNo: row[2] || "",
          companyName: row[3] || "",
          invoiceNo: row[4] || "",
          invoiceDate: formatDateForDisplay(row[5]) || "",
          entryNo: row[6] || "",
          clientStatus: row[7] || "",
          intimationRequired: row[8] || "",
          machineName: row[9] || "",
          installationService: row[10] || "",
          engineerName: row[11] || "",
          serviceVideo: row[12] || "",
          remarks: row[13] || "",
          extendDate: formatDateForDisplay(row[14]) || "",
          contactPersonName: "",
          contactPersonNo: "",
          invoiceCopy: "",
        }))
        .filter(record => record.orderNo && record.orderNo.trim() !== "");

      console.log('Processed history data:', formattedData.length, 'records');
      return formattedData;
    } else {
      console.log('No Service Installation data or insufficient rows');
      return [];
    }
  };

  // Format date from DD/MM/YYYY hh:mm:ss to DD/MM/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";

    const dateStr = String(dateString);

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    if (dateStr.includes(' ')) {
      return dateStr.split(' ')[0];
    }

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.log('Date parsing failed for:', dateStr);
    }

    return dateStr;
  };

  // Format date to DD/MM/YYYY hh:mm:ss for storage
  const formatDateForStorage = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      }
    } catch (e) {
      console.log('Date formatting failed for:', dateString);
    }

    return dateString;
  };

  // Load dropdown data from Drop-Down Master sheet
  const processDropdownData = (rawData) => {
    if (rawData && rawData.length > 0) {
      const dataRows = rawData.slice(1);

      const machines = [...new Set(dataRows.map(row => row[0]).filter(val => val))];
      const engineers = [...new Set(dataRows.map(row => row[1]).filter(val => val))];
      const services = [...new Set(dataRows.map(row => row[2]).filter(val => val))];

      console.log('Processed dropdown data:', { machines: machines.length, engineers: engineers.length, services: services.length });

      return {
        machines,
        engineers,
        services
      };
    } else {
      console.log('No dropdown data');
      return { machines: [], engineers: [], services: [] };
    }
  };

  // Load all data simultaneously
  const loadAllData = async () => {
    console.log('=== STARTING DATA LOADING ===');
    setLoadingData(true);

    try {
      console.log('Fetching all sheets simultaneously...');
      const [fmsRawData, serviceRawData, dropdownRawData] = await Promise.all([
        fetchSheetData("FMS"),
        fetchSheetData("Service Installation"),
        fetchSheetData("Drop-Down Master")
      ]);

      console.log('Raw data fetched successfully');
      console.log('- FMS rows:', fmsRawData?.length || 0);
      console.log('- Service Installation rows:', serviceRawData?.length || 0);
      console.log('- Dropdown rows:', dropdownRawData?.length || 0);

      console.log('Processing all data...');
      const processedPendingData = processPendingData(fmsRawData);
      const processedHistoryData = processHistoryData(serviceRawData);
      const processedDropdownData = processDropdownData(dropdownRawData);

      console.log('Updating all state simultaneously...');
      setPendingData(processedPendingData);
      setHistoryData(processedHistoryData);
      setDropdownData(processedDropdownData);

      console.log('=== DATA LOADING COMPLETED ===');
      console.log('Final counts:');
      console.log('- Pending records:', processedPendingData.length);
      console.log('- History records:', processedHistoryData.length);

    } catch (error) {
      console.error('=== DATA LOADING FAILED ===');
      console.error('Error details:', error);

      setPendingData([]);
      setHistoryData([]);
      setDropdownData({ machines: [], engineers: [], services: [] });
    } finally {
      setLoadingData(false);
      console.log('=== DATA LOADING FINISHED ===');
    }
  };

  // Generate next serial number - OPTIMIZED
  const generateSerialNumber = (existingData, offset = 0) => {
    const maxNumber = existingData.reduce((max, record) => {
      if (record.serialNo && record.serialNo.startsWith('SI-')) {
        const num = parseInt(record.serialNo.replace('SI-', ''));
        return Math.max(max, num || 0);
      }
      return max;
    }, 0);

    return `SI-${String(maxNumber + 1 + offset).padStart(3, '0')}`;
  };

  // Upload file to Google Drive
  const uploadFile = async (file) => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const base64Data = e.target.result;

            const formData = new URLSearchParams();
            formData.append('action', 'uploadFile');
            formData.append('base64Data', base64Data);
            formData.append('fileName', file.name);
            formData.append('mimeType', file.type);
            formData.append('folderId', DRIVE_FOLDER_ID);

            const response = await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });

            const result = await response.json();
            if (result.success) {
              resolve(result.fileUrl);
            } else {
              reject(new Error(result.error || 'Failed to upload file'));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Handle adding a new machine name field
  const addMachineField = () => {
    setIntimationData({
      ...intimationData,
      machineNames: [...intimationData.machineNames, ""]
    });
  };

  // Handle removing a machine name field
  const removeMachineField = (index) => {
    if (intimationData.machineNames.length > 1) {
      const newMachineNames = intimationData.machineNames.filter((_, i) => i !== index);
      setIntimationData({
        ...intimationData,
        machineNames: newMachineNames
      });
    }
  };

  // Handle updating a specific machine name
  const updateMachineName = (index, value) => {
    const newMachineNames = [...intimationData.machineNames];
    newMachineNames[index] = value;
    setIntimationData({
      ...intimationData,
      machineNames: newMachineNames
    });
  };

  // OPTIMIZED BATCH SUBMISSION FUNCTION with automatic refresh
  const handleIntimationSubmit = async () => {
    if (!intimationData.clientStatus) {
      alert("Please fill all required fields");
      return;
    }

    if (intimationData.clientStatus === "Yes" && !intimationData.intimationRequired) {
      alert("Please select intimation required status");
      return;
    }

    if (intimationData.clientStatus === "Yes" && intimationData.intimationRequired === "Yes") {
      const validMachineNames = intimationData.machineNames.filter(name => name.trim() !== "");
      if (validMachineNames.length === 0 || !intimationData.installationService || !intimationData.engineerName) {
        alert("Please fill all machine and service details");
        return;
      }
    }

    if (intimationData.clientStatus === "Given next date for Followup" && !intimationData.nextDate) {
      alert("Please select next date");
      return;
    }

    try {
      setLoadingData(true);

      // Upload file if selected (only once)
      let fileUrl = "";
      if (intimationData.serviceVideo) {
        fileUrl = await uploadFile(intimationData.serviceVideo);
      }

      // Generate timestamp once
      const now = new Date();
      const timestamp = formatDateForStorage(now);

      const invoiceDateForStorage = selectedRecord.invoiceDate ?
        formatDateForStorage(selectedRecord.invoiceDate) : "";

      const validMachineNames = intimationData.machineNames.filter(name => name.trim() !== "");

      // Prepare all rows data at once
      const allRowsData = [];

      if (validMachineNames.length === 0 || intimationData.clientStatus !== "Yes") {
        // Single row submission
        const serialNo = generateSerialNumber(historyData);

        allRowsData.push([
          timestamp,
          serialNo,
          selectedRecord.orderNo,
          selectedRecord.companyName,
          selectedRecord.invoiceNo,
          invoiceDateForStorage,
          "",
          intimationData.clientStatus,
          intimationData.intimationRequired || "",
          "",
          intimationData.installationService || "",
          intimationData.engineerName || "",
          fileUrl,
          intimationData.remarks || "",
          intimationData.nextDate || ""
        ]);
      } else {
        // Multiple rows for multiple machines
        for (let i = 0; i < validMachineNames.length; i++) {
          const serialNo = generateSerialNumber(historyData, i);

          allRowsData.push([
            timestamp,
            serialNo,
            selectedRecord.orderNo,
            selectedRecord.companyName,
            selectedRecord.invoiceNo,
            invoiceDateForStorage,
            "",
            intimationData.clientStatus,
            intimationData.intimationRequired || "",
            validMachineNames[i],
            intimationData.installationService || "",
            intimationData.engineerName || "",
            fileUrl,
            intimationData.remarks || "",
            intimationData.nextDate || ""
          ]);
        }
      }

      // SINGLE BATCH API CALL
      const formData = new URLSearchParams();
      formData.append('sheetName', 'Service Installation');
      formData.append('action', 'batchInsert'); // New action type
      formData.append('rowsData', JSON.stringify(allRowsData)); // All rows at once

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit intimation');
      }

      // Close modal first
      setShowIntimationModal(false);
      setSelectedRecord(null);

      // Reset form data
      setIntimationData({
        clientStatus: "",
        intimationRequired: "",
        machineNames: [""],
        installationService: "",
        engineerName: "",
        serviceVideo: null,
        nextDate: "",
        remarks: ""
      });

      // Show success message
      alert(`Intimation submitted successfully! ${allRowsData.length} record(s) added.`);

      // Force page refresh and data reload
      console.log('Intimation submitted successfully, refreshing data...');
      await loadAllData();

      // Force component re-render by switching tabs
      if (activeTab === "pending") {
        setActiveTab("history");
        setTimeout(() => setActiveTab("pending"), 100);
      }

    } catch (error) {
      console.error('Error submitting intimation:', error);
      alert('Error submitting intimation: ' + error.message);
    } finally {
      setLoadingData(false);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleIntimation = (record) => {
    setSelectedRecord(record);
    setIntimationData({
      clientStatus: "",
      intimationRequired: "",
      machineNames: [""],
      installationService: "",
      engineerName: "",
      serviceVideo: null,
      nextDate: "",
      remarks: ""
    });
    setShowIntimationModal(true);
  };

  const handleImageView = (imagePath) => {
    if (imagePath) {
      handleFileView(imagePath);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setIntimationData({ ...intimationData, serviceVideo: file });
  };

  const rawData = activeTab === "pending" ? pendingData : historyData;

  const filteredData = rawData.filter((record) => {
    const companyMatch =
      selectedCompany === "all" ||
      record.companyName?.toLowerCase().includes(selectedCompany.toLowerCase());

    const statusMatch =
      selectedStatus === "all" ||
      record.clientStatus?.toLowerCase() === selectedStatus.toLowerCase();

    const searchMatch =
      record.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.contactPersonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());

    return companyMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Service Intimation</h1>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={loadingData}
        >
          {loadingData ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-500" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="all">All Companies</option>
              {[...new Set(rawData.map(record => record.companyName).filter(name => name))]
                .map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
            </select>
          </div>
          {activeTab === "history" && (
            <div className="flex items-center space-x-2">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="given next date for followup">Given next date for Followup</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "pending"
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingData.length})
        </button>
        <button
          className={`px-4 py-2 rounded-md ${activeTab === "history"
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 text-gray-700"
            }`}
          onClick={() => setActiveTab("history")}
        >
          History ({historyData.length})
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === "pending" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                )}
                {activeTab === "history" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial No.
                  </th>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("orderNo")}
                >
                  <div className="flex items-center">
                    Order No.
                    {sortColumn === "orderNo" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
                {activeTab === "pending" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Installation Required
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actual Material
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Date
                </th>
                {activeTab === "pending" && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Copy Upload
                    </th>
                  </>
                )}
                {activeTab === "history" && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intimation Required
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Installation/Service
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engineer Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Report
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Extend Date
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {activeTab === "pending" && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleIntimation(record)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                      >
                        INTIMATION
                      </button>
                    </td>
                  )}
                  {activeTab === "history" && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.serialNo}
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.orderNo}
                  </td>
                  {activeTab === "pending" && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${record.installationRequired === 'Yes'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {record.installationRequired}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.companyName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.actualMaterial}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.nextDate || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.invoiceNo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateForDisplay(record.invoiceDate)}
                  </td>
                  {activeTab === "pending" && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.contactPersonName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.contactPersonNo}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {record.invoiceCopy ? (
                          <button
                            onClick={() => handleImageView(record.invoiceCopy)}
                            className="text-blue-500 hover:text-blue-700 inline-flex items-center space-x-1"
                          >
                            <Eye size={14} />
                            <span>View File</span>
                          </button>
                        ) : '-'}
                      </td>

                    </>
                  )}
                  {activeTab === "history" && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.entryNo}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${record.clientStatus === 'Yes'
                          ? 'bg-green-100 text-green-800'
                          : record.clientStatus === 'No'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {record.clientStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${record.intimationRequired === 'Yes'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {record.intimationRequired}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="whitespace-normal break-words">
                          {record.machineName || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.installationService || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <UserCircle size={16} className="text-gray-400 mr-2" />
                          {record.engineerName || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {record.serviceVideo ? (
                          <button
                            onClick={() => handleImageView(record.serviceVideo)}
                            className="text-blue-500 hover:text-blue-700 inline-flex items-center space-x-1"
                          >
                            <Eye size={14} />
                            <span>View File</span>
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.remarks || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.extendDate ? (
                          <div className="flex items-center">
                            <Calendar size={16} className="text-gray-400 mr-2" />
                            {record.extendDate}
                          </div>
                        ) : '-'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-8 flex-col items-center text-gray-600 text-sm">
            <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
            Loading data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No records found matching your criteria.
            </p>
          </div>
        ) : null}
      </div>

      {/* Intimation Modal */}
      {showIntimationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Intimation Form</h2>
              <button
                onClick={() => setShowIntimationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pre-filled fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order No.
                  </label>
                  <input
                    type="text"
                    value={selectedRecord?.orderNo || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={selectedRecord?.companyName || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="text"
                    value={formatDateForDisplay(selectedRecord?.invoiceDate) || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice No
                  </label>
                  <input
                    type="text"
                    value={selectedRecord?.invoiceNo || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              {/* Editable fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Status *
                </label>
                <select
                  value={intimationData.clientStatus}
                  onChange={(e) => setIntimationData({ ...intimationData, clientStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Status</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Given next date for Followup">Given next date for Followup</option>
                </select>
              </div>

              {intimationData.clientStatus === "Yes" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intimation Required *
                  </label>
                  <select
                    value={intimationData.intimationRequired}
                    onChange={(e) => setIntimationData({ ...intimationData, intimationRequired: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              )}

              {intimationData.clientStatus === "Yes" && intimationData.intimationRequired && (
                <>
                  {/* Multiple Machine Names Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Machine Names *
                      </label>
                      <button
                        type="button"
                        onClick={addMachineField}
                        className="inline-flex items-center px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                      >
                        <Plus size={12} className="mr-1" />
                        Add Machine
                      </button>
                    </div>

                    <div className="space-y-2">
                      {intimationData.machineNames.map((machineName, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <select
                            value={machineName}
                            onChange={(e) => updateMachineName(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select Machine {index + 1}</option>
                            {dropdownData.machines.map((machine, machineIndex) => (
                              <option key={machineIndex} value={machine}>{machine}</option>
                            ))}
                          </select>
                          {intimationData.machineNames.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMachineField(index)}
                              className="inline-flex items-center px-2 py-2 text-red-500 hover:text-red-700 focus:outline-none"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Display selected machines preview */}
                    {intimationData.machineNames.some(name => name.trim() !== "") && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-xs text-gray-600">Selected machines:</p>
                        <p className="text-sm font-medium text-gray-800">
                          {intimationData.machineNames
                            .filter(name => name.trim() !== "")
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Installation/Service *
                      </label>
                      <select
                        value={intimationData.installationService}
                        onChange={(e) => setIntimationData({ ...intimationData, installationService: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Service</option>
                        {dropdownData.services.map((service, index) => (
                          <option key={index} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Engineer Name *
                      </label>
                      <select
                        value={intimationData.engineerName}
                        onChange={(e) => setIntimationData({ ...intimationData, engineerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Engineer</option>
                        {dropdownData.engineers.map((engineer, index) => (
                          <option key={index} value={engineer}>{engineer}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Report
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="video/*,image/*,.pdf"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">Video, Image, PDF up to 10MB</p>
                        {intimationData.serviceVideo && (
                          <p className="text-sm text-green-600">
                            File selected: {intimationData.serviceVideo.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {intimationData.clientStatus === "Given next date for Followup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Date *
                  </label>
                  <input
                    type="date"
                    value={intimationData.nextDate}
                    onChange={(e) => setIntimationData({ ...intimationData, nextDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={intimationData.remarks}
                  onChange={(e) => setIntimationData({ ...intimationData, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter any remarks or notes..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowIntimationModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={loadingData}
              >
                Cancel
              </button>
              <button
                onClick={handleIntimationSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loadingData}
              >
                {loadingData ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Intimation;