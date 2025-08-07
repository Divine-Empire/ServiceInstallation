import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowUpCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  DollarSign,
  BarChart2,
  Calendar,
  ThermometerSun,
  Settings,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowDownCircle,
  FileText,
  Phone,
  MapPin,
  RefreshCw,
  Eye,
} from "lucide-react";

const Dashboard = () => {
  const [sheetData, setSheetData] = useState([]);
  const [installationData, setInstallationData] = useState([]);
  const [loaderSheetData, setLoaderSheetData] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);

  // Updated configuration for your Google Sheets
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyu-ZSfqc7JeysL6qh62ySVaCib8DUUyan1F7Bk6TxsTu6mfn0X9cyw78rK2TawiOKz/exec";
  const SHEET_NAME = "FMS";
  const SHEET_ID = "1Y6f5BiPuUfuGgPRK2AEE8NyAvJ9kOQxHMXd2ED1R6rU";

  const fetchSheetData = async () => {
    try {
      setLoaderSheetData(true);
      console.log("Fetching sheet data...");
      
      const response = await fetch(`${SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`);
      const result = await response.json();

      if (result.success && result.data) {
        console.log("Raw sheet data:", result.data);
        
        // Get data starting from row 7 (index 6 in 0-based array)
        const dataRows = result.data.slice(6); // Skip first 6 rows to start from row 7
        
        // Filter out completely empty rows
        const filteredData = dataRows.filter(row => 
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        console.log("Filtered data rows:", filteredData.length);
        setSheetData(filteredData);
        setInstallationData(filteredData);
      } else {
        console.error("Failed to fetch sheet data:", result.error || result.message);
        // Fallback to mock data for demo
        setInstallationData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      // Fallback to mock data for demo
      setInstallationData([]);
    } finally {
      setLoaderSheetData(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  // Calculate statistics based on your requirements
  const getComprehensiveStats = () => {
    if (!installationData || installationData.length === 0) {
      return {
        totalOrders: 0,
        pendingIntimations: 0,
        pendingFollowups: 0,
        completedServices: 0
      };
    }

    // Total Orders: Count from Column B (index 1)
    const totalOrders = installationData.filter(row => 
      row[1] !== null && row[1] !== undefined && row[1] !== ''
    ).length;
    
    // Pending Intimations: Column K (index 10) = Not Null and Column L (index 11) = Null
    const pendingIntimations = installationData.filter(row => {
      const columnK = row[10]; // Column K
      const columnL = row[11]; // Column L
      return (columnK !== null && columnK !== undefined && columnK !== '') && 
             (columnL === null || columnL === undefined || columnL === '');
    }).length;
    
    // Pending Followups: Column V (index 21) = Not Null and Column W (index 22) = Null
    const pendingFollowups = installationData.filter(row => {
      const columnV = row[21]; // Column V
      const columnW = row[22]; // Column W
      return (columnV !== null && columnV !== undefined && columnV !== '') && 
             (columnW === null || columnW === undefined || columnW === '');
    }).length;
    
    // Completed Services: Column V (index 21) = Not Null and Column W (index 22) = Not Null
    const completedServices = installationData.filter(row => {
      const columnV = row[21]; // Column V
      const columnW = row[22]; // Column W
      return (columnV !== null && columnV !== undefined && columnV !== '') && 
             (columnW !== null && columnW !== undefined && columnW !== '');
    }).length;

    return {
      totalOrders,
      pendingIntimations,
      pendingFollowups,
      completedServices
    };
  };

  const stats = getComprehensiveStats();

  // Format table data from sheet rows
  const formatTableData = () => {
    return installationData.map((row, index) => ({
      "Order No.": row[1] || "", // Column B
      "Is Installation Required Or Not?": row[2] || "", // Column C
      "COMPANY NAME": row[3] || "", // Column D
      "CONTACT PERSON NAME": row[4] || "", // Column E
      "CONTACT PERSON NO.": row[5] || "", // Column F
      "INVOICE DATE": row[6] || "", // Column G
      "INVOICE NO": row[7] || "", // Column H
      "Invoice Copy Upload": row[8] || "", // Column I
      "Actual material rcvd (plan)": row[9] || "", // Column J
      rowIndex: index
    }));
  };

  const tableData = formatTableData();

  const handleFileClick = (fileName) => {
    if (fileName && fileName.trim() !== '') {
      setSelectedFile(fileName);
      setShowFileModal(true);
    }
  };

  const FileModal = ({ isOpen, onClose, fileName }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">File Preview</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">File: {fileName}</p>
            <p className="text-sm text-gray-500">
              File preview would be shown here in a real implementation
            </p>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Service & Installation</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchSheetData}
            disabled={loaderSheetData}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loaderSheetData ? "animate-spin" : ""} />
            <span>Refresh Data</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar size={16} />
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>



      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                <Package size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Total Orders</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.totalOrders}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Intimations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center">
                <Timer size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Pending Intimations</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.pendingIntimations}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Followups */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
                <AlertCircle size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Pending Followups</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.pendingFollowups}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={24} className="text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 font-medium">Completed Services</p>
                <h3 className="text-3xl font-bold text-gray-900">{stats.completedServices}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation & Service Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Installation & Service Orders</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Showing {Math.min(tableData.length, 20)} of {tableData.length} orders
            </span>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All Orders
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg">
          <div className="overflow-x-auto overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Order No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Installation Required
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Company Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Contact Person
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Contact No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Invoice Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Invoice No.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Invoice Copy
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material Received
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.slice(0, 20).map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100">
                      {order["Order No."] || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-100">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-semibold ${
                        order["Is Installation Required Or Not?"] === "Yes"
                          ? "bg-blue-100 text-blue-800"
                          : order["Is Installation Required Or Not?"] === "No"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order["Is Installation Required Or Not?"] || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-100">
                      <div className="max-w-32 truncate" title={order["COMPANY NAME"]}>
                        {order["COMPANY NAME"] || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-100">
                      <div className="max-w-28 truncate" title={order["CONTACT PERSON NAME"]}>
                        {order["CONTACT PERSON NAME"] || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                      {order["CONTACT PERSON NO."] || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                      {order["INVOICE DATE"] || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                      {order["INVOICE NO"] || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-100">
                      {order["Invoice Copy Upload"] ? (
                        <button
                          onClick={() => handleFileClick(order["Invoice Copy Upload"])}
                          className="text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1"
                        >
                          <Eye size={14} />
                          <span className="max-w-20 truncate" title={order["Invoice Copy Upload"]}>
                            View File
                          </span>
                        </button>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {order["Actual material rcvd (plan)"] || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-lg">
          </div>
        </div>
      </div>

      {/* File Modal */}
      <FileModal 
        isOpen={showFileModal} 
        onClose={() => setShowFileModal(false)} 
        fileName={selectedFile} 
      />
    </div>
  );
};

export default Dashboard;