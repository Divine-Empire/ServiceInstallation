import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  PackageCheck,
  ClipboardCheck,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  Bell,
  CheckCircle2,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { useToast } from '../../contexts/ToastContext';

const API_URL = import.meta.env.VITE_SHEET_API_URL;
const FMS_SHEET = import.meta.env.VITE_SHEET_FMS;
const INSTALLATION_SHEET = import.meta.env.VITE_SHEET_INSTALLATION;

// Format date helper DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

// Format timestamp helper DD/MM/YYYY hh:mm:ss
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

const Dashboard = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingInstallation: 0,
    pendingIntimation: 0,
    completeService: 0
  });

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const companyDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Function to fetch data from both sheets
  const fetchSheetData = async () => {
    try {
      setLoading(true);
      const [fmsResponse, installationResponse] = await Promise.all([
        fetch(`${API_URL}?sheet=${FMS_SHEET}&action=getData`),
        fetch(`${API_URL}?sheet=${INSTALLATION_SHEET}&action=getData`)
      ]);

      if (!fmsResponse.ok || !installationResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [fmsData, installationData] = await Promise.all([
        fmsResponse.json(),
        installationResponse.json()
      ]);

      return {
        fms: (fmsData.success && fmsData.data) ? fmsData.data : [],
        installation: (installationData.success && installationData.data) ? installationData.data : []
      };

    } catch (error) {
      console.error('Error fetching sheet data:', error);
      showToast('Failed to load dashboard data. Please refresh the page.', 'error');
      return { fms: [], installation: [] };
    }
  };

  // Calculate statistics from sheet data
  const calculateStats = (data) => {
    const { fms, installation } = data;

    let totalOrders = 0;
    let pendingInstallation = 0;
    let pendingIntimation = 0;
    let completeService = 0;

    // Process FMS Sheet (Start from row 7 / index 6)
    // Total Order: Count from 'FMS' sheet Column 'B7:B' (index 1)
    for (let i = 6; i < fms.length; i++) {
      const row = fms[i];
      if (row && row[1] && row[1].toString().trim() !== '') {
        totalOrders++;
      }
    }

    // Process Service Installation Sheet (Start from row 7 / index 6)
    // Columns: L=11, M=12, V=21, W=22, AJ=35, AK=36
    for (let i = 6; i < installation.length; i++) {
      const row = installation[i];
      if (!row) continue;

      // Pending Installation: L (index 11) != Null AND M (index 12) == Null
      const colL = row[11];
      const colM = row[12];
      const hasL = colL && colL.toString().trim() !== '';
      const hasM = colM && colM.toString().trim() !== '';

      if (hasL && !hasM) {
        pendingInstallation++;
      }

      // Pending Intimation: V (index 21) != Null AND W (index 22) == Null
      const colV = row[21];
      const colW = row[22];
      const hasV = colV && colV.toString().trim() !== '';
      const hasW = colW && colW.toString().trim() !== '';

      if (hasV && !hasW) {
        pendingIntimation++;
      }

      // Complete Service: AJ (index 35) != Null AND AK (index 36) != Null
      const colAJ = row[35];
      const colAK = row[36];
      const hasAJ = colAJ && colAJ.toString().trim() !== '';
      const hasAK = colAK && colAK.toString().trim() !== '';

      if (hasAJ && hasAK) {
        completeService++;
      }
    }

    return {
      totalOrders,
      pendingInstallation,
      pendingIntimation,
      completeService
    };
  };

  // Process table data from FMS sheet
  const processTableData = (fmsData) => {
    const tableRows = [];

    // Start from row 7 (index 6)
    for (let i = 6; i < fmsData.length; i++) {
      const row = fmsData[i];
      if (!row) continue;

      // Only include rows where Order No. (Column B) is not empty
      if (row[1] && row[1].toString().trim() !== '') {
        tableRows.push({
          id: i,
          orderNo: row[1] || '',           // B - Order No.
          installationReq: row[2] || '',   // C - Installation Required
          companyName: row[3] || '',       // D - Company Name
          contactPersonName: row[4] || '', // E - Contact Person Name
          contactPersonNo: row[5] || '',   // F - Contact Person No.
          invoiceDate: row[6] || '',       // G - Invoice Date
          invoiceNo: row[7] || '',         // H - Invoice No
          invoiceCopyUpload: row[8] || '', // I - Invoice Copy Upload
          actualMaterialRcvd: row[9] || '' // J - Actual material RCVD
        });
      }
    }

    return tableRows.reverse(); // Show latest first
  };

  const loadDashboardData = async () => {
    try {
      const data = await fetchSheetData();
      if (data.fms.length > 0 || data.installation.length > 0) {
        const calculatedStats = calculateStats(data);
        setStats(calculatedStats);

        const processedTableData = processTableData(data.fms);
        setTableData(processedTableData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique company names for dropdown
  const uniqueCompanies = [...new Set(tableData.map(item => item.companyName).filter(Boolean))].sort();

  // Filter companies in dropdown based on search
  const filteredCompanies = uniqueCompanies.filter(company =>
    company.toLowerCase().includes(companySearchTerm.toLowerCase())
  );

  // Filter table data based on search term and selected company
  const filteredTableData = tableData.filter(item => {
    const matchesSearch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesCompany = !selectedCompany || item.companyName === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[88vh] bg-gray-50 flex flex-col overflow-hidden">

      <div className="flex-1 overflow-auto px-4 lg:px-6 py-4 space-y-6 relative">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Order"
            value={stats.totalOrders}
            icon={FileText}
            color="text-sky-600"
            bgColor="bg-sky-50"
          />
          <StatCard
            title="Pending Installation"
            value={stats.pendingInstallation}
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
          <StatCard
            title="Pending Intimation"
            value={stats.pendingIntimation}
            icon={Bell}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
          />
          <StatCard
            title="Complete Service"
            value={stats.completeService}
            icon={CheckCircle2}
            color="text-green-600"
            bgColor="bg-green-50"
          />
        </div>

        {/* Installation & Service Order Table */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-sky-600" />
              Installation & Service Order
            </h2>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* Company Name Filter Dropdown */}
              <div className="relative" ref={companyDropdownRef}>
                <button
                  onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                  className="flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm w-full sm:w-48 hover:bg-gray-50"
                >
                  <span className="truncate text-gray-700">
                    {selectedCompany || 'All Companies'}
                  </span>
                  {selectedCompany ? (
                    <X
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompany('');
                        setCompanySearchTerm('');
                      }}
                    />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                {isCompanyDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        placeholder="Search company..."
                        value={companySearchTerm}
                        onChange={(e) => setCompanySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-hidden">
                      <button
                        onClick={() => {
                          setSelectedCompany('');
                          setCompanySearchTerm('');
                          setIsCompanyDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-700"
                      >
                        All Companies
                      </button>
                      {filteredCompanies.map((company, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedCompany(company);
                            setCompanySearchTerm('');
                            setIsCompanyDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${selectedCompany === company ? 'bg-sky-50 text-sky-700' : 'text-gray-700'
                            }`}
                        >
                          {company}
                        </button>
                      ))}
                      {filteredCompanies.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">No companies found</div>
                      )}
                    </div>
                  </div>
                )}
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

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Installation Required</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Company Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Invoice Copy Upload</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Actual Material RCVD</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTableData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">{item.orderNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.installationReq}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px]">{item.companyName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.contactPersonName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.contactPersonNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(item.invoiceDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.invoiceNo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {item.invoiceCopyUpload && (
                          <button
                            onClick={() => handleViewFile(item.invoiceCopyUpload)}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> View
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTimestamp(item.actualMaterialRcvd)}</td>
                    </tr>
                  ))}
                  {filteredTableData.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-4 py-12 text-center text-gray-500">
                        {searchTerm ? 'No matching records found' : 'No data available'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden p-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {filteredTableData.length > 0 ? (
                filteredTableData.map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.orderNo}</h3>
                        <p className="text-sm text-gray-600">{item.companyName}</p>
                      </div>
                      {item.invoiceCopyUpload && (
                        <button
                          onClick={() => handleViewFile(item.invoiceCopyUpload)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                        >
                          <FileText className="w-3 h-3 inline mr-1" /> View
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500 block">Contact Person</span>
                          <span className="text-gray-900">{item.contactPersonName}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Contact No.</span>
                          <span className="text-gray-900">{item.contactPersonNo}</span>
                        </div>
                      </div>
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
                        <span className="text-gray-900">{item.installationReq}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Actual Material RCVD</span>
                        <span className="text-gray-900">{formatTimestamp(item.actualMaterialRcvd)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No matching records found' : 'No data available'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;