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
} from "lucide-react";

const Service3 = () => {
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

  const [dateFilterTabDueDate, setDateFilterTabDueDate] = useState("");
  const [dateFilterTabNextDate, setDateFilterTabNextDate] = useState("");

  const API_URL =
    "https://script.google.com/macros/s/AKfycbzuNLpnDvKCNwtfWvNttA3SZEl0EBNTdszqFDRu4eqjrQSJvy9lA7UG-NAGrbMqCx5d/exec";

  const [intimationData, setIntimationData] = useState({
    followupStatus: "",
    workingHours: "",
    nextDate: "",
    remarks: "",
  });

  // Fetch data from Google Sheets
  const fetchSheetData = async (sheetName) => {
    try {
      const response = await fetch(
        `${API_URL}?sheet=${sheetName}&action=fetch`
      );
      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  // Process pending data from Service Installation sheet
  const processPendingData = (rawData) => {
    if (rawData && rawData.length > 6) {
      // Data starts from row 7 (index 6), skip header rows
      const dataRows = rawData.slice(6);

      const formattedData = dataRows
        .map((row, index) => {
          const record = {
            id: `pending_${index + 1}`,
            serialNo: row[1] || "", // Column B
            orderNo: row[2] || "", // Column C
            companyName: row[3] || "", // Column D
            invoiceNo: row[4] || "", // Column E
            invoiceDate: formatDateForDisplay(row[5]) || "", // Column F
            entryNo: row[6] || "", // Column G
            clientStatus: row[7] || "", // Column H
            intimationRequired: row[8] || "", // Column I
            machineName: row[9] || "", // Column J
            installationService: row[10] || "", // Column K
            engineerName: row[11] || "", // Column L
            serviceVideo: row[12] || "", // Column M
            remarks: row[13] || "", // Column N
            columnP: row[15] || "", // Column P (index 15)
            columnQ: row[16], // Column Q (index 16)

            Plaand3: row[31], // Column Q (index 16)
            Actual3: row[32], // Column Q (index 16)

            workingHoursShared: row[21] || "", // Column V (index 21)
            nextDate: formatDateForDisplay(row[22]) || "", // Column W (index 22)
            dueDate: formatDateForDisplay(row[25]) || "", // Column W (index 22)

            invoiceCopy: formatDateForDisplay(row[38]) || "",
          };


          return record;
        })
        .filter((record) => {
          // Show in pending if: Column P is not null/empty AND Column Q is null/empty
          const hasOrderNo =
            record.orderNo && String(record.orderNo).trim() !== "";

          return hasOrderNo;
        });

      return formattedData.filter(
        (record) => record.Plaand3 !== "" && record.Actual3 === ""
      );
    } else {
      return [];
    }
  };

  // Process history data from Service Intimation sheet
  const processHistoryData = (rawData) => {
    if (rawData && rawData.length > 0) {
      // Skip header row if exists
      const dataRows = rawData.slice(1);

      const formattedData = dataRows
        .map((row, index) => ({
          id: `history_${index + 1}`,
          timestamp: formatDateForDisplay(row[0]) || "", // Column A
          serialNo: row[1] || "", // Column B
          orderNo: row[2] || "", // Column C
          companyName: row[3] || "", // Column D
          invoiceNo: row[4] || "", // Column E
          invoiceDate: formatDateForDisplay(row[5]) || "", // Column F
          entryNo: row[6] || "", // Column G
          machineName: row[7] || "", // Column H
          installationService: row[8] || "", // Column I
          engineerName: row[9] || "", // Column J
          followupStatus: row[10] || "", // Column K
          workingHours: row[11] || "", // Column L
          nextDate: formatDateForDisplay(row[12]) || "", // Column M
          remarks: row[13] || "", // Column N
          serviceNo: row[14] || "", // column O
          dueDate: formatDateForDisplay(row[15]) || "", // column

          Plaand1: row[17],
          Actual1: row[18],

          FollowupStatus1: row[20] || "", // column U
          WorkingHoursSharedByCustomerPerDay1: row[21] || "", // column V
          NextDate1: formatDateForDisplay(row[22]) || "", // column W
          Remarks1: row[23] || "", // column X

          Plaand3: row[31],
          Actual3: row[32],

          FollowupStatus3: row[34] || "", // column U
          WorkingHoursSharedByCustomerPerDay3: row[35] || "", // column V
          NextDate3: formatDateForDisplay(row[36]) || "", // column W
          Remarks3: row[37] || "", // column X
          
          invoiceCopy: formatDateForDisplay(row[38]) || "",
        }))
        .filter((record) => record.orderNo && record.orderNo.trim() !== ""); // Filter out empty rows

      return formattedData.filter(
        (record) => record.Plaand3 !== "" && record.Actual3 !== ""
      );
    } else {
      return [];
    }
  };

  // Load all data simultaneously with synchronized updates
  const loadAllData = async () => {
    setLoadingData(true);

    try {
      // Fetch all raw data simultaneously
      const [serviceIntimationRawData] = await Promise.all([
        fetchSheetData("Service Intimation"),
      ]);

      // Process all data simultaneously
      const processedPendingData = processPendingData(serviceIntimationRawData);
      const processedHistoryData = processHistoryData(serviceIntimationRawData);

      // Update all state simultaneously
      setPendingData(processedPendingData);
      setHistoryData(processedHistoryData);

    } catch (error) {
      // Set empty data on error
      setPendingData([]);
      setHistoryData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Format date from various formats to DD/MM/YYYY for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";

    const dateStr = String(dateString);

    // If it's already in DD/MM/YYYY format, return as is
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // If it contains time, extract date part
    if (dateStr.includes(" ")) {
      return dateStr.split(" ")[0];
    }

    // Try to parse and format
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {
      console.log("Date parsing failed for:", dateStr);
    }

    return dateStr;
  };

  // Format date to DD/MM/YYYY hh:mm:ss for storage
  const formatDateTimeForStorage = (date = new Date()) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  // Format date input (YYYY-MM-DD) to DD/MM/YYYY for storage
  const formatDateForStorage = (dateInput) => {
    if (!dateInput) return "";

    try {
      const [year, month, day] = dateInput.split("-");
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateInput;
    }
  };

  // Generate next serial number
  const generateSerialNumber = (existingData) => {
    const maxNumber = existingData.reduce((max, record) => {
      if (record.serialNo && record.serialNo.startsWith("SF-")) {
        const num = parseInt(record.serialNo.replace("SF-", ""));
        return Math.max(max, num || 0);
      }
      return max;
    }, 0);

    return `SF-${String(maxNumber + 1).padStart(3, "0")}`;
  };

  // Submit intimation form
  const handleIntimationSubmit = async () => {
    if (!intimationData.followupStatus) {
      alert("Please fill Followup Status");
      return;
    }

    try {
      setLoadingData(true);

      // Generate timestamp and serial number
      const timestamp = formatDateTimeForStorage();
      const serialNo = generateSerialNumber(historyData);

      // Format next date for storage
      const nextDateForStorage = intimationData.nextDate
        ? formatDateForStorage(intimationData.nextDate)
        : "";

      // Prepare row data for Service Intimation sheet
      const rowData = [
        "", // Column A - Timestamp (will be set by Google Sheets)
        "", // Column B - Serial No (will be set by Google Sheets)
        "", // Column C - Order No
        "", // Column D - Company Name
        "", // Column E - Invoice No
        "", // Column F - Invoice Date
        "", // Column G - Entry No
        "", // Column H - Machine Name
        "", // Column I - Installation/Service
        "", // Column J - Engineer Name
        "", // Column K - Followup Status
        "", // Column L - Working Hours
        "", // Column M - Next Date
        "", // Column N - Remarks
        "", // Column O - Service No.
        "", // Column P - Service No.
        "", // Column Q - Service No.
        "", // Column R - Plaand1
        "", // Column S - Actual1
        "", // Column T - FollowupStatus1
        "", // Column U - WorkingHoursSharedByCustomerPerDay1
        "", // Column V - NextDate1
        "", // Column W - Remarks1
        "", // Column X - Plaand3
        "", // Column Y - Actual3
        "", // Column Z - FollowupStatus3
        "", // Column AA - WorkingHoursSharedByCustomerPerDay3
        "", // Column AB - NextDate3
        "", // Column AC - Remarks3
        "", // Column AD - Plaand2
        "", // Column AE - Actual2
        "", // Column AF - FollowupStatus2
        timestamp, // Column S - Timestamp
        "",
        intimationData.followupStatus, // Column K - Followup Status
        intimationData.workingHours || "", // Column L - Working Hours
        formatDateForDisplay(nextDateForStorage), // Column M - Next Date
        intimationData.remarks || "", // Column N - Remarks

        // serialNo, // Column T - Serial No
        // selectedRecord.orderNo, // Column C - Order No
        // selectedRecord.companyName, // Column D - Company Name
        // selectedRecord.invoiceNo, // Column E - Invoice No
        // selectedRecord.invoiceDate, // Column F - Invoice Date
        // selectedRecord.entryNo, // Column G - Entry No
        // selectedRecord.machineName, // Column H - Machine Name
        // selectedRecord.installationService, // Column I - Installation/Service
        // selectedRecord.engineerName, // Column J - Engineer Name
        // "", // Column O - Service No.
        // "", // Column P - Service No.
        // selectedRecord.serialNo || "", // Column Q - Service No.
      ];

      const findRowIndex = (data, serialNo, orderNo) => {
        if (!data || !Array.isArray(data)) {
          console.error("Invalid data provided to findRowIndex");
          return -1;
        }

        for (let i = 0; i < data.length; i++) {
          if (data[i] && data[i][1] === serialNo && data[i][2] === orderNo) {
            return i + 1; // +1 because sheet rows are 1-indexed
          }
        }
        return -1; // Not found
      };

      // Fetch current data to find the row index
      const currentData = await fetchSheetData("Service Intimation");
      const rowIndex = findRowIndex(
        currentData,
        selectedRecord.serialNo,
        selectedRecord.orderNo
      );

      if (rowIndex === -1) {
        alert("Record not found in the sheet. Please refresh and try again.");
        setLoadingData(false);
        return;
      }

      // Submit to Google Sheets
      const formData = new URLSearchParams();
      formData.append("sheetName", "Service Intimation");
      formData.append("action", "update");
      formData.append("rowIndex", rowIndex);
      formData.append("rowData", JSON.stringify(rowData));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {

        // Refresh all data to maintain synchronization
        await loadAllData();

        setShowIntimationModal(false);
        setSelectedRecord(null);
        setIntimationData({
          followupStatus: "",
          workingHours: "",
          nextDate: "",
          remarks: "",
        });
        alert("Service intimation submitted successfully!");
      } else {
        alert(
          "Error submitting intimation: " + (result.error || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error submitting intimation:", error);
      alert("Error submitting intimation: " + error.message);
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
      followupStatus: "",
      workingHours: "",
      nextDate: "",
      remarks: "",
    });
    setShowIntimationModal(true);
  };

  // Direct file view handler - opens file in new tab
  const handleFileView = (filePath) => {
    if (filePath && filePath.trim() !== "") {
      // Check if the filePath is a URL (Google Drive link or other URL)
      const isUrl =
        filePath &&
        (filePath.startsWith("http://") || filePath.startsWith("https://"));

      if (isUrl) {
        // Check if it's a Google Drive link and format it for direct viewing
        const isGoogleDriveLink = filePath.includes("drive.google.com");

        let finalUrl = filePath;

        if (isGoogleDriveLink) {
          // For Google Drive links, extract file ID and use viewer
          if (filePath.includes("/view")) {
            finalUrl = filePath.replace("/view", "/preview");
          } else if (filePath.includes("id=")) {
            finalUrl = `https://drive.google.com/file/d/${
              filePath.split("id=")[1].split("&")[0]
            }/preview`;
          } else {
            finalUrl = filePath + "/preview";
          }
        }

        // Open in new tab
        window.open(finalUrl, "_blank", "noopener,noreferrer");
      } else {
        // For non-URL content, we could create a data URL or blob, but for simplicity
        // we'll just alert the user that it's not a viewable file
        alert("File content: " + filePath);
      }
    }
  };

  const rawData = activeTab === "pending" ? pendingData : historyData;

  const filteredDataa = rawData.filter((record) => {
    const companyMatch =
      selectedCompany === "all" ||
      record.companyName?.toLowerCase().includes(selectedCompany.toLowerCase());

    const statusMatch =
      selectedStatus === "all" ||
      record.followupStatus?.toLowerCase() === selectedStatus.toLowerCase();

    const searchMatch =
      record.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.engineerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());

    return companyMatch && statusMatch && searchMatch;
  });

  const filterByDateCategoryDueDate = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter((item) => {
      if (dateFilterTabDueDate === "") return true;

      if (!item.dueDate || item.dueDate === "-") return false;

      // Parse DD/MM/YYYY format
      const dateParts = item.dueDate.split("/");
      if (dateParts.length !== 3) return false;

      const nextDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      nextDate.setHours(0, 0, 0, 0);

      if (dateFilterTabDueDate === "today") {
        return nextDate.getTime() === today.getTime();
      } else if (dateFilterTabDueDate === "upcoming") {
        return nextDate.getTime() > today.getTime();
      } else if (dateFilterTabDueDate === "overdue") {
        return nextDate.getTime() < today.getTime();
      }
      return true;
    });
  };

  const filterByDateCategoryNextDate = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.filter((item) => {
      if (dateFilterTabNextDate === "") return true;

      if (!item.nextDate || item.nextDate === "-") return false;

      // Parse DD/MM/YYYY format
      const dateParts = item.nextDate.split("/");
      if (dateParts.length !== 3) return false;

      const nextDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
      nextDate.setHours(0, 0, 0, 0);

      if (dateFilterTabNextDate === "today") {
        return nextDate.getTime() === today.getTime();
      } else if (dateFilterTabNextDate === "upcoming") {
        return nextDate.getTime() > today.getTime();
      } else if (dateFilterTabNextDate === "overdue") {
        return nextDate.getTime() < today.getTime();
      }
      return true;
    });
  };

  const filteredDataAfterDueDate = filterByDateCategoryDueDate(filteredDataa);
  const filteredData = filterByDateCategoryNextDate(filteredDataAfterDueDate);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Service 3
        </h1>
        <button
          onClick={loadAllData}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={loadingData}
        >
          {loadingData ? "Loading..." : "Refresh Data"}
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
              {[
                ...new Set(
                  rawData
                    .map((record) => record.companyName)
                    .filter((name) => name)
                ),
              ].map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
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
                <option value="done">Done</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="sm:flex justify-between">
        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === "pending"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingData.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === "history"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveTab("history")}
          >
            History ({historyData.length})
          </button>
        </div>

        <div>
          <h1 className=" text-gray-900">Due Date</h1>

          <div className="mb-4 flex gap-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setDateFilterTabDueDate("")}
              className={`px-4 py-2 rounded-md transition-all bg-transparent text-gray-700 hover:bg-green-100 border border-red-500`}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setDateFilterTabDueDate("today")}
              className={`px-4 py-2 rounded-md transition-all ${
                dateFilterTabDueDate === "today"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-green-100"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilterTabDueDate("upcoming")}
              className={`px-4 py-2 rounded-md transition-all ${
                dateFilterTabDueDate === "upcoming"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-green-100"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setDateFilterTabDueDate("overdue")}
              className={`px-4 py-2 rounded-md transition-all ${
                dateFilterTabDueDate === "overdue"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-red-100"
              }`}
            >
              Overdue
            </button>
          </div>
        </div>

        <div>
          <h1>Next Date</h1>

          <div className="mb-4 flex gap-2 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 p-1 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setDateFilterTabNextDate("")}
              className={`px-4 py-2 rounded-md transition-all bg-transparent text-gray-700 hover:bg-green-100 border border-red-500`}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => setDateFilterTabNextDate("today")}
              className={`px-4 py-2 rounded-md transition-all ${
                dateFilterTabNextDate === "today"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-green-100"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilterTabNextDate("upcoming")}
              className={`px-4 py-2 rounded-md transition-all ${
                dateFilterTabNextDate === "upcoming"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-green-100"
              }`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setDateFilterTabNextDate("overdue")}
              className={`px-4 py-2 rounded-md transition-all ${
                dateFilterTabNextDate === "overdue"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-red-100"
              }`}
            >
              Overdue
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {activeTab === "pending" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky-col sticky-col-1">
                    Action
                  </th>
                )}
                {activeTab === "history" && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky-col sticky-col-1">
                    Serial No.
                  </th>
                )}
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer sticky-col sticky-col-2"
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No
                </th>
                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Hours Shared
                </th> */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Copy
                </th>
                {activeTab === "pending" && (
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
                      Service Video Upload
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Hours Shared
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </>
                )}
                {activeTab === "history" && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entry No.
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
                      Followup Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Stemp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service Due Date
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {activeTab === "pending" && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm sticky-col sticky-col-1">
                      <button
                        onClick={() => handleIntimation(record)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                      >
                        Service 3
                      </button>
                    </td>
                  )}
                  {activeTab === "history" && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky-col sticky-col-1">
                      {record.serialNo}
                    </td>
                  )}
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky-col sticky-col-2">
                    {record.orderNo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.companyName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.invoiceNo}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.nextDate || "-"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.invoiceDate}
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.invoiceCopy ? (
                          <button
                            onClick={() => handleFileView(record.invoiceCopy)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </button>
                        ) : (
                          "-"
                        )}
                  </td>
                  {activeTab === "pending" && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.entryNo}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.clientStatus === "Yes"
                              ? "bg-green-100 text-green-800"
                              : record.clientStatus === "No"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {record.clientStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.intimationRequired === "Yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {record.intimationRequired}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.machineName || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.installationService || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <UserCircle
                            size={16}
                            className="text-gray-400 mr-2"
                          />
                          {record.engineerName || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {record.serviceVideo ? (
                          <button
                            onClick={() => handleFileView(record.serviceVideo)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.workingHoursShared || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.dueDate || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.remarks || "-"}
                      </td>
                    </>
                  )}
                  {activeTab === "history" && (
                    <>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.entryNo}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.machineName || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.installationService || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <UserCircle
                            size={16}
                            className="text-gray-400 mr-2"
                          />
                          {record.engineerName || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.followupStatus3 === "Done"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {record.FollowupStatus3}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {record.FollowupStatus3 === "Done" && record.timestamp}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.WorkingHoursSharedByCustomerPerDay3 || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.NextDate3 || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.Remarks3 || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.serviceNo || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.dueDate || "-"}
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
              <h2 className="text-lg font-semibold text-gray-800">
                Service 3 Form
              </h2>
              <button
                onClick={() => setShowIntimationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pre-filled fields - Compact Layout */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order No.
                  </label>
                  <input
                    type="text"
                    value={selectedRecord?.orderNo || ""}
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
                    value={selectedRecord?.companyName || ""}
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
                    value={selectedRecord?.invoiceDate || ""}
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
                    value={selectedRecord?.invoiceNo || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine Name
                  </label>
                  <input
                    type="text"
                    value={selectedRecord?.machineName || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installation/Service
                  </label>
                  <input
                    type="text"
                    value={selectedRecord?.installationService || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engineer Name
                </label>
                <input
                  type="text"
                  value={selectedRecord?.engineerName || ""}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              {/* Editable fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Followup Status *
                </label>
                <select
                  value={intimationData.followupStatus}
                  onChange={(e) =>
                    setIntimationData({
                      ...intimationData,
                      followupStatus: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Status</option>
                  <option value="Done">Done</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Hours Shared By Customer Per Day
                </label>
                <input
                  type="number"
                  value={intimationData.workingHours}
                  onChange={(e) =>
                    setIntimationData({
                      ...intimationData,
                      workingHours: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter working hours (e.g., 8 hours)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Date
                </label>
                <input
                  type="date"
                  value={intimationData.nextDate}
                  onChange={(e) =>
                    setIntimationData({
                      ...intimationData,
                      nextDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={intimationData.remarks}
                  onChange={(e) =>
                    setIntimationData({
                      ...intimationData,
                      remarks: e.target.value,
                    })
                  }
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
                {loadingData ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service3;
