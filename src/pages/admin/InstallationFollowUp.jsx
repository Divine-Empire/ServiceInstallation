import React, { useState, useEffect, useRef } from "react";
import {
    Filter,
    Search,
    Loader2,
    Clock,
    CheckCircle,
    X,
    ChevronDown,
    Plus,
    Upload,
    FileText,
    Camera
} from "lucide-react";
import CustomDropdown from '../../components/ui/CustomDropdown';
import { useToast } from "../../contexts/ToastContext";

const API_URL = import.meta.env.VITE_SHEET_API_URL;
const INSTALLATION_SHEET = import.meta.env.VITE_SHEET_INSTALLATION;
const FOLLOW_UP_SHEET = import.meta.env.VITE_FOLLOW_UP_SHEET;
const DROP_DOWN_SHEET = import.meta.env.VITE_SHEET_DROP_NAME;
const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

// Format timestamp for display helper
const displayTimestamp = (dateStr) => {
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



const InstallationFollowUp = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("pending");
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Data states
    const [pendingData, setPendingData] = useState([]);
    const [historyData, setHistoryData] = useState([]);

    // Filter states
    const [filterCompany, setFilterCompany] = useState("");

    // Lookups
    const [engineerOptions, setEngineerOptions] = useState([]);
    const [installationServiceOptions, setInstallationServiceOptions] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        clientStatus: "",
        intimationRequired: "",
        installationService: "",
        engineerName: "",
        remarks: "",
        nextFollowUpDate: "",
        whatDidCustomerSay: "",
        serviceReport: null,
        serviceReportPreview: null,
        serviceReportType: "" // image, video, pdf
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [installRes, followUpRes, dropdownRes] = await Promise.all([
                fetch(`${API_URL}?sheet=${INSTALLATION_SHEET}&action=getData`),
                fetch(`${API_URL}?sheet=${FOLLOW_UP_SHEET}&action=getData`),
                fetch(`${API_URL}?sheet=${DROP_DOWN_SHEET}&action=getData`)
            ]);

            const installData = await installRes.json();
            const followUpData = await followUpRes.json();
            const dropdownData = await dropdownRes.json();

            // Process Dropdowns
            if (dropdownData.success && dropdownData.data) {
                const sheetData = dropdownData.data.slice(1);
                const engineers = sheetData.map(row => row[1]).filter(Boolean); // B
                const services = sheetData.map(row => row[2]).filter(Boolean); // C
                setEngineerOptions([...new Set(engineers)]);
                setInstallationServiceOptions([...new Set(services)]);
            }

            // Build a lookup map from Service Installation sheet for Company Name, Contact Person Name, Contact Person No, Machine Name
            // Key: serialNo + '|' + orderNo -> { companyName, contactPersonName, contactPersonNo, machineName }
            const installationLookup = {};
            if (installData.success && installData.data) {
                for (let i = 6; i < installData.data.length; i++) {
                    const row = installData.data[i];
                    if (row && row[1]) { // B: Serial No
                        const serialNo = String(row[1] || '').trim();
                        const orderNo = String(row[2] || '').trim(); // C: Order No
                        const key = `${serialNo}|${orderNo}`;
                        installationLookup[key] = {
                            companyName: row[3] || '',      // D: Company Name
                            contactPersonName: row[4] || '', // E: Contact Person Name
                            contactPersonNo: row[5] || '',   // F: Contact Person No
                            machineName: row[9] || ''        // J: Machine Name
                        };
                    }
                }
            }

            // Process History Data (From Service Installation Follow-Up) first to use for filtering pending
            let setOfFollowedUp = new Set();
            if (followUpData.success && followUpData.data) {
                const hData = [];
                for (let i = 6; i < followUpData.data.length; i++) {
                    const row = followUpData.data[i];
                    if (row && row[1]) { // B: Follow-Up No
                        const serialNo = String(row[2] || '').trim(); // C: Serial No
                        const orderNo = String(row[3] || '').trim();  // D: Order No
                        const lookupKey = `${serialNo}|${orderNo}`;
                        const lookupData = installationLookup[lookupKey] || {};

                        hData.push({
                            timestamp: row[0],         // A
                            followUpNo: row[1],        // B
                            serialNo: serialNo,        // C
                            orderNo: orderNo,          // D
                            // Looked up from Service Installation sheet
                            companyName: lookupData.companyName || '',
                            contactPersonName: lookupData.contactPersonName || '',
                            contactPersonNo: lookupData.contactPersonNo || '',
                            machineName: lookupData.machineName || '',
                            // Direct fields from Service Installation Follow-Up
                            clientStatus: row[4],      // E
                            intimationRequired: row[5],// F
                            installationService: row[6],// G
                            engineerName: row[7],      // H
                            serviceReport: row[8],     // I
                            nextDate: row[9],          // J
                            remarks: row[10]           // K
                        });
                        if (row[2]) setOfFollowedUp.add(String(row[2]).trim());
                    }
                }
                setHistoryData(hData.reverse());
            }

            // Process Pending Data
            // Logic: L (index 11) != Null AND M (index 12) == Null
            if (installData.success && installData.data) {
                const pData = [];
                // Data starts from index 6 (Row 7)
                for (let i = 6; i < installData.data.length; i++) {
                    const row = installData.data[i];
                    if (!row) continue;

                    const colL = row[11];
                    const colM = row[12];

                    if (colL && String(colL).trim() !== "" && (!colM || String(colM).trim() === "")) {
                        pData.push({
                            rowIndex: i + 1,
                            timestamp: row[0] || '',     // A: Timestamp
                            serialNo: row[1] || '',      // B: Serial No.
                            orderNo: row[2] || '',       // C: Order No.
                            companyName: row[3] || '',   // D: Company Name
                            contactPerson: row[4] || '', // E: Contact Person Name
                            contactNo: row[5] || '',     // F: Contact Person No.
                            invoiceNo: row[6] || '',     // G: Invoice No.
                            invoiceDate: row[7] || '',   // H: Invoice Date
                            invoiceCopy: row[8] || '',   // I: Invoice Copy
                            machineName: row[9] || '',   // J: Machine Name
                            remarks: row[10] || '',      // K: Remarks
                            colL: colL || '',            // L: Logic Col
                            nextDate: row[19] || '',     // T: Next Date
                            customerRemark: row[20] || '' // U: Customer Remark
                        });
                    }
                }
                setPendingData(pData.reverse());
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

    const handleFollowUpClick = (item) => {
        setSelectedItem(item);
        setFormData({
            clientStatus: "",
            intimationRequired: "",
            installationService: "",
            engineerName: "",
            remarks: "",
            nextFollowUpDate: "",
            whatDidCustomerSay: "",
            serviceReport: null,
            serviceReportPreview: null,
            serviceReportType: ""
        });
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast("File size must be less than 10MB", "error");
                return;
            }

            const type = file.type;
            let reportType = "other";
            if (type.startsWith('image/')) reportType = "image";
            else if (type.startsWith('video/')) reportType = "video";
            else if (type === 'application/pdf') reportType = "pdf";

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    serviceReport: file,
                    serviceReportPreview: reader.result,
                    serviceReportType: reportType
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadFile = async (file) => {
        if (!file) return "";
        try {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                    try {
                        const base64Data = reader.result;
                        const response = await fetch(API_URL, {
                            method: 'POST',
                            body: new URLSearchParams({
                                action: 'uploadFile',
                                base64Data: base64Data,
                                fileName: `followUp_${Date.now()}_${file.name}`,
                                mimeType: file.type,
                                folderId: FOLDER_ID
                            })
                        });
                        const result = await response.json();
                        if (result.success) resolve(result.fileUrl);
                        else reject(new Error(result.error || 'Upload failed'));
                    } catch (err) { reject(err); }
                };
                reader.readAsDataURL(file);
            });
        } catch (err) {
            console.error("Upload error:", err);
            throw err;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.clientStatus) {
            showToast("Please select client status", "error");
            return;
        }
        if (formData.clientStatus === 'Yes') {
            if (!formData.intimationRequired) {
                showToast("Please select intimation required", "error");
                return;
            }
            if (formData.intimationRequired === 'Yes') {
                if (!formData.installationService) {
                    showToast("Installation / Service is required", "error");
                    return;
                }
                if (!formData.engineerName) {
                    showToast("Engineer Name is required", "error");
                    return;
                }
            } else {
                // Intimation Required = No
                if (!formData.remarks) {
                    showToast("Remarks are required", "error");
                    return;
                }
            }
        } else if (formData.clientStatus === 'No') {
            if (!formData.remarks) {
                showToast("Remarks are required when status is 'No'", "error");
                return;
            }
        } else if (formData.clientStatus === 'Next Date') {
            if (!formData.nextFollowUpDate) {
                showToast("Next Follow-Up Date is required", "error");
                return;
            }
            if (!formData.whatDidCustomerSay) {
                showToast("'What did Customer Said?' field is required", "error");
                return;
            }
        }

        try {
            setLoading(true);

            // Generate Follow-Up No
            let maxNum = 0;
            historyData.forEach(item => {
                if (item.followUpNo && item.followUpNo.startsWith('FN-')) {
                    const numString = item.followUpNo.split('-')[1];
                    const num = parseInt(numString);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                }
            });
            const followUpNo = `FN-${String(maxNum + 1).padStart(3, '0')}`;

            // Upload report
            let reportUrl = "";
            if (formData.serviceReport) {
                reportUrl = await uploadFile(formData.serviceReport);
            }

            // Generate Timestamp manually to ensure Google Sheets recognizes it as a Date
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            // Prepare Row Data for 'Service Installation Follow-Up'
            const followUpRowData = [
                timestamp,                          // A: Timestamp
                followUpNo,                         // B: Follow-Up No
                selectedItem.serialNo,              // C: Serial No
                selectedItem.orderNo,               // D: Order No
                formData.clientStatus,              // E: Client Status
                formData.intimationRequired || '',  // F: Intimation Required
                formData.installationService || '', // G: Installation/Service
                formData.engineerName || '',        // H: Engineer Name
                reportUrl,                          // I: Service Video/Report Upload
                formData.nextFollowUpDate || '',    // J: Next Date
                formData.clientStatus === 'Next Date' ? formData.whatDidCustomerSay : (formData.remarks || '') // K: Remarks
            ];

            // 1. Insert into Follow-Up Sheet
            const res = await fetch(API_URL, {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'insert',
                    sheetName: FOLLOW_UP_SHEET,
                    rowData: JSON.stringify(followUpRowData)
                })
            });

            const result = await res.json();
            if (result.success) {
                setShowModal(false);
                setShowSuccessPopup(true);
                fetchData();

                // Auto-hide success popup after 5 seconds
                setTimeout(() => {
                    setShowSuccessPopup(false);
                }, 5000);
            } else {
                throw new Error(result.message || "Failed to save to follow-up sheet");
            }

        } catch (error) {
            console.error("Submit error:", error);
            showToast("Error saving follow-up: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

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

    const filteredPending = pendingData.filter(filterItem);
    const filteredHistory = historyData.filter(filterItem);

    const uniqueCompanies = [...new Set([...pendingData, ...historyData].map(d => d.companyName).filter(Boolean))].sort();

    return (
        <div className="h-[88vh] bg-gray-50 flex flex-col overflow-hidden">
            {/* Header & Controls */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200">
                <div className="flex flex-col gap-4 px-4 py-3 lg:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2 sm:gap-4 bg-gray-100/80 p-1 rounded-lg self-start lg:self-auto">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "pending"
                                ? "bg-white text-sky-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            Pending ({pendingData.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeTab === "history"
                                ? "bg-white text-sky-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            History ({historyData.length})
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[150px] lg:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                            />
                        </div>

                        <div className="flex-1 min-w-[150px] lg:w-48">
                            <CustomDropdown
                                value={filterCompany}
                                onChange={setFilterCompany}
                                options={uniqueCompanies}
                                placeholder="All Companies"
                            />
                        </div>

                        {(hasActiveFilters || searchTerm) && (
                            <button
                                onClick={handleClearFilters}
                                className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer whitespace-nowrap p-2 rounded-md hover:bg-red-50 transition-colors"
                            >
                                Clear All
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Action</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Serial No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Next Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Customer Remark</th>
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
                                            {filteredPending.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => handleFollowUpClick(item)}
                                                            className="px-3 py-1.5 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors shadow-sm text-xs font-medium"
                                                        >
                                                            Follow Up
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.serialNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.orderNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.nextDate)}</td>
                                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-600 min-w-[150px]">{item.customerRemark || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.companyName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.contactPerson || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.contactNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.invoiceNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.invoiceDate)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {item.invoiceCopy && (
                                                            <button
                                                                onClick={() => handleViewFile(item.invoiceCopy)}
                                                                className="text-sky-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <FileText className="w-3 h-3" /> View
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-600 min-w-[150px]">{item.machineName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-600 min-w-[200px]">{item.remarks || '-'}</td>
                                                </tr>
                                            ))}
                                            {filteredPending.length === 0 && (
                                                <tr>
                                                    <td colSpan="11" className="p-12 text-center text-gray-500">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Clock className="w-10 h-10 text-gray-300" />
                                                            <p>No pending follow-ups found.</p>
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
                                                    onClick={() => handleFollowUpClick(item)}
                                                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm text-xs font-bold"
                                                >
                                                    Follow Up
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
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Invoice No</p>
                                                    <p className="text-xs font-semibold text-gray-700">{item.invoiceNo}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Invoice Date</p>
                                                    <p className="text-xs font-semibold text-gray-700">{formatDate(item.invoiceDate)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Next Date</p>
                                                    <p className="text-xs font-semibold text-sky-600">{formatDate(item.nextDate) || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Cust. Remark</p>
                                                    <p className="text-xs font-semibold text-gray-700 truncate">{item.customerRemark || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-50 space-y-1">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Machines</p>
                                                <p className="text-xs text-gray-700 line-clamp-2">{item.machineName}</p>
                                            </div>

                                            {item.invoiceCopy && (
                                                <div className="pt-2 flex justify-end">
                                                    <button
                                                        onClick={() => handleViewFile(item.invoiceCopy)}
                                                        className="text-sky-600 text-xs font-bold flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-md"
                                                    >
                                                        <FileText className="w-3 h-3" /> View Invoice
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredPending.length === 0 && (
                                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                                            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm">No pending follow-ups found.</p>
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
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Follow-Up No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Serial No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Order No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Company Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Contact Person No.</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Machine Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Client Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Intimation Required</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Installation / Service</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Engineer Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Service Video Upload</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Next Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Remarks / What did Customer Said</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredHistory.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-600">{item.followUpNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.serialNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.orderNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.companyName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.contactPersonName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.contactPersonNo || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-600 min-w-[150px]">{item.machineName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.clientStatus === 'Yes' ? 'bg-green-100 text-green-700' :
                                                            item.clientStatus === 'No' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {item.clientStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.intimationRequired || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.installationService || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.engineerName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {item.serviceReport && (
                                                            <button
                                                                onClick={() => handleViewFile(item.serviceReport)}
                                                                className="text-sky-600 hover:underline flex items-center gap-1"
                                                            >
                                                                <Upload className="w-3 h-3" /> View
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.nextDate ? formatDate(item.nextDate) : '-'}</td>
                                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-600 min-w-[200px]">{item.remarks || '-'}</td>
                                                </tr>
                                            ))}
                                            {filteredHistory.length === 0 && (
                                                <tr>
                                                    <td colSpan="14" className="p-12 text-center text-gray-500">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <CheckCircle className="w-10 h-10 text-gray-300" />
                                                            <p>No follow-up history found.</p>
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
                                                    <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">{item.followUpNo}</p>
                                                    <h3 className="font-bold text-gray-900">{item.serialNo}</h3>
                                                    <p className="text-xs text-gray-500">Order: {item.orderNo}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.clientStatus === 'Yes' ? 'bg-green-100 text-green-700' :
                                                    item.clientStatus === 'No' ? 'bg-red-100 text-red-700' :
                                                        'bg-sky-100 text-sky-700'
                                                    }`}>
                                                    {item.clientStatus}
                                                </span>
                                            </div>

                                            {/* Company & Contact Info */}
                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                                <div className="space-y-1 col-span-2">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Company Name</p>
                                                    <p className="text-xs font-semibold text-gray-900">{item.companyName || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Contact Person</p>
                                                    <p className="text-xs font-semibold text-gray-700">{item.contactPersonName || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Contact No.</p>
                                                    <p className="text-xs font-semibold text-gray-700">{item.contactPersonNo || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-50 space-y-1">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Machine Name</p>
                                                <p className="text-xs text-gray-700 line-clamp-2">{item.machineName || '-'}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Intimation</p>
                                                    <p className="text-xs font-semibold text-gray-700">{item.intimationRequired || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Service</p>
                                                    <p className="text-xs font-semibold text-gray-700 text-sky-600">{item.installationService || '-'}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Engineer</p>
                                                    <p className="text-xs font-semibold text-gray-700">{item.engineerName || '-'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Next Follow-up</p>
                                                    <p className="text-xs font-semibold text-red-600">{item.nextDate ? formatDate(item.nextDate) : '-'}</p>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-50 space-y-1">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Remarks</p>
                                                <p className="text-xs text-gray-700 leading-relaxed italic">"{item.remarks || 'No remarks'}"</p>
                                            </div>

                                            {item.serviceReport && (
                                                <div className="pt-2 flex justify-end">
                                                    <button
                                                        onClick={() => handleViewFile(item.serviceReport)}
                                                        className="text-sky-600 text-xs font-bold flex items-center gap-1 px-2 py-1 bg-sky-50 rounded-md"
                                                    >
                                                        <Upload className="w-3 h-3" /> View Report
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                                            <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm">No follow-up history found.</p>
                                        </div>
                                    )}
                                </div>
                            </>

                        )}
                    </div>
                </div>
            </div>

            {/* Follow Up Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setShowModal(false)} />
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative border border-white/20">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Follow Up Form</h2>
                                <p className="text-xs text-gray-500">Processing follow-up for SN: {selectedItem.serialNo}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Pre-filled info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Order No.</label>
                                    <p className="text-sm font-semibold text-gray-900">{selectedItem.orderNo}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Company Name</label>
                                    <p className="text-sm font-semibold text-gray-900">{selectedItem.companyName}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Invoice Date</label>
                                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedItem.invoiceDate)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Invoice No</label>
                                    <p className="text-sm font-semibold text-gray-900">{selectedItem.invoiceNo}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 uppercase">Machine Names</label>
                                    <p className="text-sm font-semibold text-gray-900">{selectedItem.machineName}</p>
                                </div>
                            </div>

                            {/* Client Status */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Status <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.clientStatus}
                                        onChange={(e) => setFormData({ ...formData, clientStatus: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none bg-white font-medium"
                                        required
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                        <option value="Next Date">Next Date for Follow-Up</option>
                                    </select>
                                </div>

                                {/* Conditional Fields for 'Yes' */}
                                {formData.clientStatus === 'Yes' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Intimation Required <span className="text-red-500">*</span></label>
                                            <select
                                                value={formData.intimationRequired}
                                                onChange={(e) => setFormData({ ...formData, intimationRequired: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none bg-white"
                                            >
                                                <option value="">Select Option</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                        </div>

                                        {formData.intimationRequired === 'Yes' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                <div className="md:col-span-2 border-t border-gray-100 pt-4 mb-2">
                                                    <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider">Service Details</h3>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Installation / Service <span className="text-red-500">*</span></label>
                                                    <CustomDropdown
                                                        value={formData.installationService}
                                                        onChange={(val) => setFormData({ ...formData, installationService: val })}
                                                        options={installationServiceOptions}
                                                        placeholder="Select Service Type"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Engineer Name <span className="text-red-500">*</span></label>
                                                    <CustomDropdown
                                                        value={formData.engineerName}
                                                        onChange={(val) => setFormData({ ...formData, engineerName: val })}
                                                        options={engineerOptions}
                                                        placeholder="Select Engineer"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Service Report (Image/Video/PDF - Max 10MB) <span className="text-red-500">*</span></label>
                                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-sky-400 transition-colors group relative overflow-hidden">
                                                        {formData.serviceReportPreview ? (
                                                            <div className="text-center">
                                                                {formData.serviceReportType === 'image' ? (
                                                                    <img src={formData.serviceReportPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-sm" />
                                                                ) : formData.serviceReportType === 'video' ? (
                                                                    <video src={formData.serviceReportPreview} className="max-h-40 mx-auto rounded-lg" controls />
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <FileText className="w-16 h-16 text-sky-600" />
                                                                        <span className="text-sm font-medium text-gray-900">{formData.serviceReport?.name}</span>
                                                                    </div>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, serviceReport: null, serviceReportPreview: null, serviceReportType: "" })}
                                                                    className="mt-2 text-xs text-red-600 font-medium hover:underline"
                                                                >
                                                                    Remove File
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1 text-center">
                                                                <Upload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-sky-500 transition-colors" />
                                                                <div className="flex text-sm text-gray-600">
                                                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500">
                                                                        <span>Upload a file</span>
                                                                        <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*,video/*,application/pdf" />
                                                                    </label>
                                                                    <p className="pl-1">or drag and drop</p>
                                                                </div>
                                                                <p className="text-xs text-gray-500">Images, Videos, PDFs up to 10MB</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
                                                    <textarea
                                                        value={formData.remarks}
                                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                                                        rows="2"
                                                        placeholder="Enter service remarks..."
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {formData.intimationRequired === 'No' && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
                                                <textarea
                                                    value={formData.remarks}
                                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                                                    rows="4"
                                                    placeholder="Enter remarks..."
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Conditional Fields for 'No' */}
                                {formData.clientStatus === 'No' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks <span className="text-red-500">*</span></label>
                                        <textarea
                                            value={formData.remarks}
                                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none"
                                            rows="4"
                                            placeholder="Why not?"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Conditional Fields for 'Next Date' */}
                                {formData.clientStatus === 'Next Date' && (
                                    <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Next Date for Follow-Up <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                value={formData.nextFollowUpDate}
                                                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none bg-white/50 backdrop-blur-sm"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">What did Customer Said <span className="text-red-500">*</span></label>
                                            <textarea
                                                value={formData.whatDidCustomerSay}
                                                onChange={(e) => setFormData({ ...formData, whatDidCustomerSay: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-600 outline-none bg-white/50 backdrop-blur-sm"
                                                rows="3"
                                                placeholder="Enter what the customer said..."
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2 text-sm font-medium text-gray-700 bg-white/80 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors backdrop-blur-sm"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-lg shadow-sky-600/20 disabled:opacity-70"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
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
                        <p className="text-sm text-gray-600">Follow-up saved successfully.</p>
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

export default InstallationFollowUp;
