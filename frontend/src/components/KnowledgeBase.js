import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { 
  Alert,
  AlertDescription
} from "./ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Home,
  Phone,
  FileCode,
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { uploadKnowledgeBase, getKnowledgeBases } from '../services/api';

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem('user_id') || '');
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [kbName, setKbName] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [userId]);

  const fetchKnowledgeBases = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await getKnowledgeBases(userId);
      setKnowledgeBases(data);
    } catch (err) {
      setError('Failed to load knowledge bases: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!userId) {
      setError('User ID is required');
      return;
    }

    if (!kbName) {
      setError('Knowledge base name is required');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    formData.append('kbName', kbName);

    try {
      await uploadKnowledgeBase(formData);
      setSuccess('Knowledge base uploaded successfully!');
      setKbName(''); // Reset the form
      e.target.value = null; // Reset the file input
      fetchKnowledgeBases(); // Refresh the list
    } catch (err) {
      setError('Failed to upload knowledge base: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const getFileTypeIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="text-blue-500" />;
      case 'txt':
        return <FileText className="text-green-500" />;
      case 'csv':
        return <FileText className="text-yellow-500" />;
      case 'json':
        return <FileText className="text-purple-500" />;
      default:
        return <FileText />;
    }
  };

  const getFileTypeLabel = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    return extension.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Voice AI Platform</h1>
        </div>

        <nav className="mt-5">
          <ul>
            <li>
              <button 
                onClick={() => handleNavigation('/dashboard')} 
                className={`flex items-center px-4 py-3 w-full text-left ${location.pathname === '/dashboard' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Home className="h-5 w-5 mr-3" />
                <span>Dashboard</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/call-management')} 
                className={`flex items-center justify-between px-4 py-3 w-full text-left ${location.pathname === '/call-management' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-3" />
                  <span>Call Management</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/knowledge')} 
                className={`flex items-center justify-between px-4 py-3 w-full text-left ${location.pathname === '/knowledge' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-3" />
                  <span>Knowledge</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/scripts')} 
                className={`flex items-center px-4 py-3 w-full text-left ${location.pathname === '/scripts' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <FileCode className="h-5 w-5 mr-3" />
                <span>Scripts</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => handleNavigation('/configuration')} 
                className={`flex items-center px-4 py-3 w-full text-left ${location.pathname === '/configuration' ? 'bg-gray-100 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Settings className="h-5 w-5 mr-3" />
                <span>Configuration</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-64 border-t border-gray-200">
          <div className="p-4 flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center text-white mr-3">
              A
            </div>
            <div>
              <p className="font-medium">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          
          <button 
            onClick={() => handleNavigation('/logout')} 
            className="flex items-center px-4 py-3 w-full text-left text-gray-600 hover:bg-gray-100 border-t border-gray-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Knowledge Base Management</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchKnowledgeBases}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Form */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Knowledge Base</h3>
                  
                  <div className="mb-4">
                    <Input
                      placeholder="Knowledge Base Name (e.g., Product Documentation)"
                      value={kbName}
                      onChange={(e) => setKbName(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.csv,.json"
                  />
                  
                  <Button
                    className="w-full mt-2 bg-gray-600 hover:bg-gray-700"
                    variant="default"
                    onClick={handleFileSelect}
                    disabled={uploading || !kbName}
                  >
                    {uploading ? (
                      <div className="flex items-center">
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </div>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center mt-2 text-gray-500">
                    Supported formats: PDF, DOC, DOCX, TXT, CSV, JSON
                  </p>
                  
                  {error && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert className="mt-4 bg-green-50 text-green-800 border-green-200">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Knowledge Base List */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Your Knowledge Bases</h3>
                  
                  <Separator className="my-2" />
                  
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : knowledgeBases.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">
                        No knowledge bases found. Upload your first file to get started.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>File</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {knowledgeBases.map((kb) => (
                          <TableRow key={kb.id}>
                            <TableCell className="font-medium">{kb.kbName}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {getFileTypeIcon(kb.originalFilename)}
                                <span className="ml-2">{kb.originalFilename}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(kb.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getFileTypeLabel(kb.originalFilename)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;