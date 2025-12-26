import React, { useState, useEffect } from 'react';
import { Filter, Search, Plus, X, Loader2, FileText, CheckCircle, Clock, ChevronDown } from 'lucide-react';
import CustomDropdown from '../../components/ui/CustomDropdown';
import { useToast } from '../../contexts/ToastContext';

const API_URL = import.meta.env.VITE_SHEET_API_URL;
const FMS_SHEET = import.meta.env.VITE_SHEET_FMS;
const INSTALLATION_SHEET = import.meta.env.VITE_SHEET_INSTALLATION;
const DROP_DOWN_SHEET = import.meta.env.VITE_SHEET_DROP_NAME;

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

// Format timestamp helper
const formatTimestamp = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Handle viewing file in new tab without immediate download
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



const InstallationPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [machineOptions, setMachineOptions] = useState([]);

  // Filter/Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    machineNames: [''], // Array for multiple machines
    remarks: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all required sheets
      const [fmsRes, installRes, dropdownRes] = await Promise.all([
        fetch(`${API_URL}?sheet=${FMS_SHEET}&action=getData`),
        fetch(`${API_URL}?sheet=${INSTALLATION_SHEET}&action=getData`),
        fetch(`${API_URL}?sheet=${DROP_DOWN_SHEET}&action=getData`)
      ]);

      const fmsData = await fmsRes.json();
      const installData = await installRes.json();
      const dropdownData = await dropdownRes.json();

      // Process Dropdown Data (Machine Names from Col A -> Index 0)
      if (dropdownData.success && dropdownData.data) {
        // Skip header row (index 0)
        const machines = dropdownData.data.slice(1)
          .map(row => row[0]) // Column A
          .filter(item => item); // Filter empty
        setMachineOptions([...new Set(machines)]);
      }

      // Process Pending Data (From FMS)
      // Logic: K (index 10) != Null AND L (index 11) == Null
      // Data starts from Row 7 (index 6, but check if there are headers. Usually row 7 means index 6 in 0-indexed array)
      // Assuming headers are above row 7.
      // Based on typical structure, let's look at the data array.
      if (fmsData.success && fmsData.data) {
        const pData = [];
        // Start from index 6 (Row 7)
        for (let i = 6; i < fmsData.data.length; i++) {
          const row = fmsData.data[i];
          // Check bounds
          if (!row) continue;

          const colK = row[10]; // 11th column
          const colL = row[11]; // 12th column

          const isKNotNull = colK && String(colK).trim() !== '';
          const isLNull = !colL || String(colL).trim() === '';

          if (isKNotNull && isLNull) {
            pData.push({
              rowIndex: i + 1, // Store 1-based index (Row Number in Sheet)
              orderNo: row[1] || '',       // B
              installReq: row[2] || '',    // C
              companyName: row[3] || '',   // D
              contactName: row[4] || '',   // E
              contactNo: row[5] || '',     // F
              invoiceDate: row[6] || '',   // G
              invoiceNo: row[7] || '',     // H
              invoiceCopy: row[8] || '',   // I
              actualMatRcvd: row[9] || ''  // J
            });
          }
        }
        setPendingData(pData.reverse());
      }

      // Process History Data (From Service Installation)
      // Row 7 (index 6) matches the write logic description
      if (installData.success && installData.data) {
        const hData = [];
        for (let i = 6; i < installData.data.length; i++) {
          const row = installData.data[i];
          if (row && row[0]) { // Check if row exists (Timestamp in A)
            hData.push({
              id: i,
              serialNo: row[1] || '',     // B
              orderNo: row[2] || '',      // C
              companyName: row[3] || '',  // D
              contactName: row[4] || '',  // E
              contactNo: row[5] || '',    // F
              invoiceNo: row[6] || '',    // G
              invoiceDate: row[7] || '',  // H
              invoiceCopy: row[8] || '',  // I
              machineName: row[9] || '',  // J
              remarks: row[10] || '',     // K
              nextDate: row[19] || '',    // T
              customerRemark: row[20] || '' // U
            });
          }
        }
        setHistoryData(hData.reverse()); // Show latest first
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

  // Modal Handlers
  const handleInstallClick = (item) => {
    setSelectedItem(item);
    setFormData({
      machineNames: [''], // Start with one empty dropdown
      remarks: ''
    });
    setShowModal(true);
  };

  const handleAddMachine = () => {
    setFormData(prev => ({
      ...prev,
      machineNames: [...prev.machineNames, '']
    }));
  };

  const handleRemoveMachine = (index) => {
    setFormData(prev => ({
      ...prev,
      machineNames: prev.machineNames.filter((_, i) => i !== index)
    }));
  };

  const handleMachineChange = (index, value) => {
    const newMachines = [...formData.machineNames];
    newMachines[index] = value;
    setFormData(prev => ({ ...prev, machineNames: newMachines }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.machineNames.some(m => !m)) {
      showToast("Please select all machine names", "error");
      return;
    }

    try {
      setLoading(true);

      // Generate base data
      const now = new Date();
      // Format: DD/MM/YYYY hh:mm:ss (without comma as per request)
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      const timestampISO = now.toISOString(); // For updating FMS potentially

      // Generate Serial No
      // Logic: Get max existing SN-XXX from history and increment
      // Simple parse: "SN-005" -> 5
      let maxSn = 0;
      historyData.forEach(item => {
        if (item.serialNo && item.serialNo.startsWith('SN-')) {
          const num = parseInt(item.serialNo.split('-')[1]);
          if (!isNaN(num) && num > maxSn) maxSn = num;
        }
      });

      let nextSnStart = maxSn + 1;

      // Prepare Rows for Service Installation Sheet
      const rowsToInsert = formData.machineNames.map((machine, index) => {
        const sn = `SN-${String(nextSnStart + index).padStart(3, '0')}`;

        // Columns A-K
        return [
          timestamp,                  // A: Timestamp
          sn,                         // B: Serial No.
          selectedItem.orderNo,       // C: Order no.
          selectedItem.companyName,   // D: Company Name
          selectedItem.contactName,   // E: Contact Person Name
          selectedItem.contactNo,     // F: Contact Person No
          selectedItem.invoiceNo,     // G: Invoice No
          formatDate(selectedItem.invoiceDate),   // H: Invoice Date (from FMS G)
          selectedItem.invoiceCopy,   // I: Invoice Copy
          machine,                    // J: Machine Name
          formData.remarks            // K: Remarks
        ];
      });

      for (const row of rowsToInsert) {
        await fetch(API_URL, {
          method: 'POST',
          body: new URLSearchParams({
            action: 'insert',
            sheetName: INSTALLATION_SHEET,
            rowData: JSON.stringify(row)
          })
        });
      }

      // FMS Sheet update logic removed as per user request



      setShowModal(false);
      setShowSuccessPopup(true);
      fetchData(); // Refresh in background

      // Auto-hide success popup after 5 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 5000);

    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("Error saving installation: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // Derived Data for Filters (based on active tab data generally available)
  // We compute based on ALL data to show all options, or based on Tab data? 
  // Usually better to show options relevant to the current view.
  const currentDataForFilters = activeTab === 'pending' ? pendingData : historyData;
  const uniqueCompanies = [...new Set(currentDataForFilters.map(d => d.companyName).filter(Boolean))].sort();

  // Filter Data
  const filterItem = (item) => {
    // 1. Search Term
    const matchesSearch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    // 2. Company Filter
    const matchesCompany = filterCompany ? item.companyName === filterCompany : true;

    return matchesSearch && matchesCompany;
  };

  const filteredPending = pendingData.filter(filterItem);
  const filteredHistory = historyData.filter(filterItem);

  return (
    <div className="h-[88vh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Header & Controls */}
      <div className="flex-shrink-0 px-4 py-3 lg:px-6 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Tabs */}
          <nav className="flex space-x-2 bg-gray-200/50 p-1 rounded-lg self-start lg:self-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'pending'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>Pending ({pendingData.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'history'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>History ({historyData.length})</span>
            </button>
          </nav>

          {/* Right: Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 lg:justify-end">
            {/* Company Filter */}
            <div className="w-full sm:w-48">
              <CustomDropdown
                value={filterCompany}
                onChange={setFilterCompany}
                options={uniqueCompanies}
                placeholder="All Companies"
                disabled={loading}
              />
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none w-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden px-4 lg:px-6 py-4 flex flex-col">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            </div>
          )}

          {/* Table Container with Hidden Scrollbar */}
          <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Pending Table */}
            {activeTab === 'pending' && (
              <>
                {/* Desktop View */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Installation Required</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Company Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Copy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actual Material RCVD</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPending.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleInstallClick(item)}
                              className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded hover:bg-sky-700 transition-colors"
                            >
                              Install
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.installReq}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.contactName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.contactNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.invoiceDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.invoiceNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.invoiceCopy && (
                              <button
                                onClick={() => handleViewFile(item.invoiceCopy)}
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> View
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTimestamp(item.actualMatRcvd)}</td>
                        </tr>
                      ))}
                      {filteredPending.length === 0 && (
                        <tr>
                          <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                            {searchTerm || filterCompany ? 'No matching records found' : 'No pending installations'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredPending.length > 0 ? (
                    filteredPending.map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.orderNo}</h3>
                            <p className="text-sm text-gray-600">{item.companyName}</p>
                          </div>
                          <button
                            onClick={() => handleInstallClick(item)}
                            className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded hover:bg-sky-700 transition-colors"
                          >
                            Install
                          </button>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Contact Person</span>
                              <span className="text-gray-900">{item.contactName}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Contact No.</span>
                              <span className="text-gray-900">{item.contactNo}</span>
                            </div>
                          </div>
                          {/* ... truncated fields for brevity if needed, but keeping full ... */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Invoice Date</span>
                              <span className="text-gray-900">{formatDate(item.invoiceDate)}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Invoice No</span>
                              <span className="text-gray-900">{item.invoiceNo}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Installation Required</span>
                            <span className="text-gray-900">{item.installReq}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Actual Material RCVD</span>
                            <span className="text-gray-900">{formatTimestamp(item.actualMatRcvd)}</span>
                          </div>
                          {item.invoiceCopy && (
                            <div className="mt-2 text-right">
                              <button
                                onClick={() => handleViewFile(item.invoiceCopy)}
                                className="text-blue-600 hover:underline text-xs flex justify-end items-center gap-1 w-full"
                              >
                                <FileText className="w-3 h-3" /> View Invoice
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No matching records found
                    </div>
                  )}
                </div>
              </>
            )}

            {/* History Table */}
            {activeTab === 'history' && (
              <>
                {/* Desktop View */}
                <div className="hidden lg:block">
                  <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Serial No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Company Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Copy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Machine Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.serialNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.companyName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.contactName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.contactNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.invoiceNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.invoiceDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.invoiceCopy && (
                              <button
                                onClick={() => handleViewFile(item.invoiceCopy)}
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> View
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-normal break-words text-sm text-gray-900 min-w-[200px]">{item.machineName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.remarks}</td>
                        </tr>
                      ))}
                      {filteredHistory.length === 0 && (
                        <tr>
                          <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                            {searchTerm || filterCompany || filterContact || filterOrderNo ? 'No matching records found' : 'No history records found'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="lg:hidden p-4 space-y-4">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.serialNo}</h3>
                            <p className="text-xs text-gray-500">Order: {item.orderNo}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.companyName}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Machine Name</span>
                              <span className="text-gray-900 font-medium">{item.machineName}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Invoice No</span>
                              <span className="text-gray-900">{item.invoiceNo}</span>
                            </div>
                          </div>
                          {/* ... more fields ... */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Contact Person</span>
                              <span className="text-gray-900">{item.contactName}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 block">Contact No.</span>
                              <span className="text-gray-900">{item.contactNo}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Invoice Date</span>
                            <span className="text-gray-900">{formatDate(item.invoiceDate)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-xs text-gray-500 block">Invoice Date</span>
                              <span className="text-gray-900">{formatDate(item.invoiceDate)}</span>
                            </div>
                          </div>
                          {item.remarks && (
                            <div>
                              <span className="text-xs text-gray-500 block">Remarks</span>
                              <span className="text-gray-900 italic">{item.remarks}</span>
                            </div>
                          )}
                          {item.invoiceCopy && (
                            <div className="mt-2 text-right">
                              <button
                                onClick={() => handleViewFile(item.invoiceCopy)}
                                className="text-blue-600 hover:underline text-xs flex justify-end items-center gap-1 w-full"
                              >
                                <FileText className="w-3 h-3" /> View Invoice
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No matching records found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Install Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Install - {selectedItem.orderNo}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Read Only Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order No.</label>
                  <input type="text" value={selectedItem.orderNo} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" value={selectedItem.companyName} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No</label>
                  <input type="text" value={selectedItem.invoiceNo} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                  <input type="text" value={formatDate(selectedItem.invoiceDate)} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600" />
                </div>
              </div>

              {/* Dynamic Machine Names */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Machine Names</label>
                  <button
                    type="button"
                    onClick={handleAddMachine}
                    className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700"
                    disabled={loading}
                  >

                    <Plus className="w-3 h-3" /> Add Machine
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.machineNames.map((machine, index) => (
                    <div key={index} className="flex gap-2">
                      <CustomDropdown
                        value={machine}
                        onChange={(val) => handleMachineChange(index, val)}
                        options={machineOptions}
                        placeholder="Select Machine"
                        disabled={loading}
                      />
                      {formData.machineNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMachine(index)}
                          className="text-red-600 hover:text-red-800 p-2"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 outline-none"
                  placeholder="Enter remarks..."
                  disabled={loading}

                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={loading}
                >

                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Installation
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
            <p className="text-sm text-gray-600">Installation saved successfully.</p>
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

export default InstallationPage;