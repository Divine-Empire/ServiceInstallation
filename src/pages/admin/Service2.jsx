import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Loader2,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  FileText,
  Calendar
} from "lucide-react";
import CustomDropdown from '../../components/ui/CustomDropdown';
import { useToast } from "../../contexts/ToastContext";

const API_URL = import.meta.env.VITE_SHEET_API_URL;
const INSTALLATION_SHEET = import.meta.env.VITE_SHEET_INSTALLATION;
const INTIMATION_SERVICE_3_SHEET = import.meta.env.VITE_SHEET_INTIMATION_SERVICE_3;
const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

// Handle viewing file in new tab
const handleViewFile = (url) => {
  if (!url) return;
  const fileIdMatch = url.match(/\/d\/(.+?)\/|\/d\/(.+?)$|id=(.+?)$|open\?id=(.+?)$/);
  const fileId = fileIdMatch ? (fileIdMatch[1] || fileIdMatch[2] || fileIdMatch[3] || fileIdMatch[4]) : null;

  if (fileId) {
    // Use preview format to show file without download option
    const viewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};



const IntimationService3Page = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("");

  // Data states
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    followUpStatus: "",
    workingHours: "",
    nextDate: "",
    remarks: ""
  });

  // Success popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Fetch data from sheets
  const fetchData = async () => {
    try {
      setLoading(true);
      const [installRes, intimationRes] = await Promise.all([
        fetch(`${API_URL}?sheet=${INSTALLATION_SHEET}&action=getData`),
        fetch(`${API_URL}?sheet=${INTIMATION_SERVICE_3_SHEET}&action=getData`)
      ]);

      const installData = await installRes.json();
      const intimationData = await intimationRes.json();

      // Process Pending Data from Service Installation
      // Logic: Column AJ (index 35) != Null AND Column AK (index 36) == Null
      if (installData.success && installData.data) {
        const pData = [];
        // Data starts from index 6 (Row 7)
        for (let i = 6; i < installData.data.length; i++) {
          const row = installData.data[i];
          if (!row) continue;

          const colAJ = row[35]; // Column AJ (index 35)
          const colAK = row[36]; // Column AK (index 36)

          if (colAJ && String(colAJ).trim() !== "" && (!colAK || String(colAK).trim() === "")) {
            pData.push({
              rowIndex: i + 1,
              serialNo: row[1] || '',         // B: Serial No.
              orderNo: row[2] || '',          // C: Order No.
              companyName: row[3] || '',      // D: Company Name
              contactPerson: row[4] || '',    // E: Contact Person Name
              contactNo: row[5] || '',        // F: Contact Person No.
              nextDate: row[40] || '',        // AO: Next Date (index 40)
              customerRemarks: row[41] || '', // AP: Customer Remarks (index 41)
              workingHoursShared: row[39] || '', // AN: Working Hours Shared (index 39)
              invoiceNo: row[6] || '',        // G: Invoice No.
              invoiceDate: row[7] || '',      // H: Invoice Date
              invoiceCopy: row[8] || '',      // I: Invoice Copy
              machineName: row[9] || '',      // J: Machine Name
              installationService: row[16] || '', // Q: Installation/Service
              engineerName: row[17] || '',    // R: Engineer Name
              serviceVideo: row[18] || '',    // S: Service Video Upload
              remarks: row[20] || ''          // U: Remarks
            });
          }
        }
        setPendingData(pData.reverse());
      }

      // Process History Data from Service Installation 3 sheet
      // Cross-reference with Installation sheet for Company Name, Contact Person, Contact No, Machine Name
      if (intimationData.success && intimationData.data) {
        const hData = [];

        // Create a lookup map from Installation data for quick access
        // Key: serialNo + orderNo, Value: { companyName, contactPerson, contactNo, machineName }
        const installLookup = {};
        if (installData.success && installData.data) {
          for (let i = 6; i < installData.data.length; i++) {
            const row = installData.data[i];
            if (row && row[1] && row[2]) {
              const key = `${String(row[1]).trim()}|${String(row[2]).trim()}`; // B: Serial No. | C: Order No.
              installLookup[key] = {
                companyName: row[3] || '',     // D: Company Name
                contactPerson: row[4] || '',   // E: Contact Person Name
                contactNo: row[5] || '',       // F: Contact Person No.
                machineName: row[9] || ''      // J: Machine Name
              };
            }
          }
        }

        for (let i = 6; i < intimationData.data.length; i++) {
          const row = intimationData.data[i];
          if (row && row[1]) { // B: Intimation No
            const serialNo = row[2] || '';     // C: Serial No.
            const orderNo = row[3] || '';      // D: Order No.
            const lookupKey = `${String(serialNo).trim()}|${String(orderNo).trim()}`;
            const installInfo = installLookup[lookupKey] || {};

            hData.push({
              intimationNo: row[1] || '',       // B: Intimation No.
              serialNo: serialNo,               // C: Serial No.
              orderNo: orderNo,                 // D: Order No.
              companyName: installInfo.companyName || '',      // From Installation D
              contactPerson: installInfo.contactPerson || '',  // From Installation E
              contactNo: installInfo.contactNo || '',          // From Installation F
              machineName: installInfo.machineName || '',      // From Installation J
              followUpStatus: row[4] || '',     // E: Follow-up Status
              workingHours: row[5] || '',       // F: Working Hours Shared By Customer Per Day
              nextDate: row[6] || '',           // G: Next Date
              remarks: row[7] || ''             // H: Remarks
            });
          }
        }
        setHistoryData(hData.reverse());
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic
  const hasActiveFilters = searchTerm !== "" || filterCompany !== "";

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterCompany("");
  };

  const filterItem = (item) => {
    const matchesSearch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCompany = filterCompany ? item.companyName === filterCompany : true;
    return matchesSearch && matchesCompany;
  };

  const currentDataForFilters = activeTab === 'pending' ? pendingData : historyData;
  const uniqueCompanies = [...new Set(currentDataForFilters.map(d => d.companyName).filter(Boolean))].sort();

  const filteredPending = pendingData.filter(filterItem);
  const filteredHistory = historyData.filter(filterItem);

  // Handle Intimation button click
  const handleIntimationClick = (item) => {
    setSelectedItem(item);
    setFormData({
      followUpStatus: "",
      workingHours: "",
      nextDate: "",
      remarks: ""
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.followUpStatus) {
      showToast("Please select Follow-up Status", "error");
      return;
    }
    if (formData.followUpStatus !== "Done" && !formData.workingHours) {
      showToast("Please enter Working Hours", "error");
      return;
    }
    if (formData.followUpStatus === "Pending" && !formData.nextDate) {
      showToast("Please select Next Date", "error");
      return;
    }

    try {
      setLoading(true);

      // Generate timestamp in YYYY-MM-DD HH:mm:ss format (proper date format for Google Sheets)
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // Generate Intimation No (IS-001, IS-002, ...)
      let maxNum = 0;
      historyData.forEach(item => {
        if (item.intimationNo && item.intimationNo.startsWith('IS-')) {
          const numStr = item.intimationNo.split('-')[1];
          const num = parseInt(numStr);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const intimationNo = `IS-${String(maxNum + 1).padStart(3, '0')}`;

      // Prepare row data for Service Installation 3 sheet
      // Columns A-H: Timestamp, Intimation No, Serial No, Order No, Follow-up Status, Working Hours, Next Date, Remarks
      const rowData = [
        timestamp,                    // A: Timestamp
        intimationNo,                 // B: Intimation No.
        selectedItem.serialNo,        // C: Serial No.
        selectedItem.orderNo,         // D: Order No.
        formData.followUpStatus,      // E: Follow-up Status
        formData.followUpStatus === "Done" ? "" : formData.workingHours, // F: Working Hours (blank if Done)
        formData.followUpStatus === "Done" ? "" : formData.nextDate, // G: Next Date (blank if Done)
        formData.remarks              // H: Remarks
      ];

      // Insert into Service Installation 3 sheet
      const response = await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({
          action: 'insert',
          sheetName: INTIMATION_SERVICE_3_SHEET,
          rowData: JSON.stringify(rowData)
        })
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        setShowSuccessPopup(true);

        // Fetch fresh data
        fetchData();

        // Auto hide success popup after 5 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 5000);
      } else {
        throw new Error(result.message || "Failed to save intimation");
      }

    } catch (error) {
      console.error("Error saving intimation:", error);
      showToast("Error saving intimation: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[88vh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Header & Controls */}
      <div className="flex-shrink-0 px-4 py-3 lg:px-6 bg-white border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <nav className="flex space-x-2 bg-gray-100/80 p-1 rounded-lg self-start lg:self-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "pending"
                ? "bg-white text-sky-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending ({pendingData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "history"
                ? "bg-white text-sky-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>History ({historyData.length})</span>
            </button>
          </nav>

          {/* Search */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px] lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="flex-1 min-w-[200px] lg:w-64">
              <CustomDropdown
                value={filterCompany}
                onChange={setFilterCompany}
                options={uniqueCompanies}
                placeholder="All Companies"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer whitespace-nowrap p-2 rounded-md hover:bg-red-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 flex flex-col">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            </div>
          )}

          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {activeTab === 'pending' ? (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Serial No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Company Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Next Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Customer Remarks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Working Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Copy</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Machine Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Install/Service</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Engineer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Service Video</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPending.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() => handleIntimationClick(item)}
                              className="px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm text-xs font-bold"
                            >
                              Intimation
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sky-600">{item.serialNo || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.orderNo || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 min-w-[150px] max-w-[200px]">
                            <div className="whitespace-normal break-words">{item.companyName || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.contactPerson || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.contactNo || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(item.nextDate) || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 min-w-[150px] max-w-[200px]">
                            <div className="whitespace-normal break-words">{item.customerRemarks || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.workingHoursShared || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.invoiceNo || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(item.invoiceDate) || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.invoiceCopy && (
                              <button
                                onClick={() => handleViewFile(item.invoiceCopy)}
                                className="text-sky-600 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> View
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 min-w-[150px] max-w-[200px]">
                            <div className="whitespace-normal break-words" title={item.machineName}>{item.machineName || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.installationService || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.engineerName || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {item.serviceVideo && (
                              <button
                                onClick={() => handleViewFile(item.serviceVideo)}
                                className="text-sky-600 hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> View
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={item.remarks}>{item.remarks || '-'}</td>
                        </tr>
                      ))}
                      {filteredPending.length === 0 && (
                        <tr>
                          <td colSpan="17" className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                              <Clock className="w-10 h-10 text-gray-300" />
                              <p>No pending intimations found.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredPending.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">{item.serialNo}</p>
                          <h3 className="font-bold text-gray-900">{item.companyName}</h3>
                          <p className="text-xs text-gray-500">Order: {item.orderNo}</p>
                        </div>
                        <button
                          onClick={() => handleIntimationClick(item)}
                          className="px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm text-xs font-bold"
                        >
                          Intimation
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Contact Person</p>
                          <p className="text-xs font-semibold text-gray-700">{item.contactPerson || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Phone</p>
                          <p className="text-xs font-semibold text-gray-700">{item.contactNo || '-'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Next Date</p>
                          <p className="text-xs font-semibold text-sky-600">{formatDate(item.nextDate) || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Working Hours</p>
                          <p className="text-xs font-semibold text-gray-700">{item.workingHoursShared || '-'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-50 space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Customer Remarks</p>
                        <p className="text-xs text-gray-700 break-words">{item.customerRemarks || '-'}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-50 space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Machine</p>
                        <p className="text-xs text-gray-700 line-clamp-2">{item.machineName || '-'}</p>
                      </div>
                    </div>
                  ))}
                  {filteredPending.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                      <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No pending intimations found.</p>
                    </div>
                  )}
                </div>
              </>

            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Intimation No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Serial No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Company Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Machine Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Follow-up Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Working Hours/Day</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Next Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sky-600">{item.intimationNo || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.serialNo || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.orderNo || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 min-w-[150px] max-w-[200px]">
                            <div className="whitespace-normal break-words">{item.companyName || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.contactPerson || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.contactNo || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 min-w-[180px] max-w-[250px]">
                            <div className="whitespace-normal break-words" title={item.machineName}>{item.machineName || '-'}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.followUpStatus === 'Done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {item.followUpStatus || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.workingHours || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(item.nextDate) || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={item.remarks}>{item.remarks || '-'}</td>
                        </tr>
                      ))}
                      {filteredHistory.length === 0 && (
                        <tr>
                          <td colSpan="11" className="p-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                              <CheckCircle className="w-10 h-10 text-gray-300" />
                              <p>No intimation history found.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredHistory.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">{item.intimationNo}</p>
                          <h3 className="font-bold text-gray-900">{item.companyName || '-'}</h3>
                          <p className="text-xs text-gray-500">Serial: {item.serialNo} | Order: {item.orderNo}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.followUpStatus === 'Done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {item.followUpStatus || '-'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Contact Person</p>
                          <p className="text-xs font-semibold text-gray-700">{item.contactPerson || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Contact No.</p>
                          <p className="text-xs font-semibold text-gray-700">{item.contactNo || '-'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Working Hours</p>
                          <p className="text-xs font-semibold text-gray-700">{item.workingHours || '-'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Next Date</p>
                          <p className="text-xs font-semibold text-sky-600">{formatDate(item.nextDate) || '-'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-50 space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Machine Name</p>
                        <p className="text-xs text-gray-700 line-clamp-2">{item.machineName || '-'}</p>
                      </div>

                      {item.remarks && (
                        <div className="pt-2 border-t border-gray-50 space-y-1">
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Remarks</p>
                          <p className="text-xs text-gray-700">{item.remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                      <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm">No intimation history found.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Intimation Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <h3 className="text-base font-semibold text-gray-900">
                Intimation - {selectedItem.serialNo}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                disabled={loading}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              {/* Prefilled Information - Compact */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <p className="text-gray-500">Serial No.</p>
                    <p className="font-medium text-gray-900 truncate">{selectedItem.serialNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Order No.</p>
                    <p className="font-medium text-gray-900 truncate">{selectedItem.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Invoice No.</p>
                    <p className="font-medium text-gray-900 truncate">{selectedItem.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Invoice Date</p>
                    <p className="font-medium text-gray-900 truncate">{formatDate(selectedItem.invoiceDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Company</p>
                    <p className="font-medium text-gray-900 truncate">{selectedItem.companyName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Engineer</p>
                    <p className="font-medium text-gray-900 truncate">{selectedItem.engineerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium text-gray-900 truncate">{selectedItem.installationService}</p>
                  </div>
                  <div className="col-span-4">
                    <p className="text-gray-500">Machine Name</p>
                    <p className="font-medium text-gray-900 break-words">{selectedItem.machineName || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Form Fields - Grid Layout */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className={formData.followUpStatus === "Done" ? "col-span-2" : ""}>
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Follow-up Status <span className="text-red-600">*</span>
                  </label>
                  <CustomDropdown
                    value={formData.followUpStatus}
                    onChange={(val) => setFormData(prev => ({ ...prev, followUpStatus: val }))}
                    options={["Pending", "Done"]}
                    placeholder="Select Status"
                    disabled={loading}
                  />
                </div>

                {formData.followUpStatus !== "Done" && (
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Working Hours/Day <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.workingHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      placeholder="Enter hours"
                      disabled={loading}
                    />
                  </div>
                )}

                {formData.followUpStatus !== "Done" && (
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Next Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.nextDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    placeholder="Enter remarks"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 text-center max-w-sm w-full">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-sm text-gray-600">Intimation saved successfully.</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="bg-green-500 h-1" style={{ animation: 'shrink 5s linear forwards' }}></div>
            </div>
            <style>{`
              @keyframes shrink {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntimationService3Page;
