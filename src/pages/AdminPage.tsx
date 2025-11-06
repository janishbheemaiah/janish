import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Calendar, Camera, MessageSquare, TrendingUp, Download, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Registration {
  _id: string;
  eventId: { _id: string; title: string };
  userId: { _id: string; name: string; email: string };
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  bloodGroup: string;
  bikeModel: string;
  emergencyContact: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
  startCode?: string;
  endCode?: string;
  checkIn?: boolean;
  checkOut?: boolean;
  overallStatus?: 'Completed' | 'LeftEarly' | 'Absent';
  message?: string;
  achievementPoints?: number;
  approvedPoints?: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  registeredCount: number;
  maxParticipants: number;
}

interface Photo {
  _id: string;
  title: string;
  uploadedBy: { _id: string; name: string };
  uploadedAt: string;
  likes: string[];
  comments: any[];
  url: string;
}

interface Message {
  _id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'new' | 'replied' | 'closed';
}

interface UserMessage {
  _id: string;
  senderId: { _id: string; name: string; email: string };
  receiverId: { _id: string; name: string; email: string };
  content: string;
  isRead: boolean;
  type: 'user-to-admin' | 'admin-to-user';
  createdAt: string;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  imageUrl: string;
  specialization: string;
}

const AdminPage = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkOutCode, setCheckOutCode] = useState('');
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    role: '',
    bio: '',
    specialization: '',
    image: null as File | null
  });
  const [achievementPoints, setAchievementPoints] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load registrations
      try {
        const regRes = await api.get('/registrations');
        setRegistrations((regRes.data || []).filter(reg => reg != null));
      } catch (regErr) {
        console.error('Failed to load registrations:', regErr);
        setRegistrations([]);
        toast.error('Failed to load registrations');
      }

      // Load events
      try {
        const eventRes = await api.get('/events');
        setEvents((eventRes.data || []).filter(Boolean));
      } catch (eventErr) {
        console.error('Failed to load events:', eventErr);
        setEvents([]);
        toast.error('Failed to load events');
      }

      // Load photos (from gallery)
      try {
        const photoRes = await api.get('/photos');
        const processedPhotos = (photoRes.data || []).filter(Boolean).map((photo: any) => ({
          _id: photo._id,
          title: photo.title || 'Untitled Photo',
          uploadedBy: photo.uploadedBy || { _id: '', name: 'Unknown' },
          uploadedAt: photo.createdAt || new Date().toISOString(),
          likes: photo.likes || [],
          comments: photo.comments || [],
          url: photo.path ? `http://localhost:5000/uploads/${photo.filename}` : '',
          filename: photo.filename,
          description: photo.description || '',
          tags: photo.tags || []
        })).filter(Boolean);
        setPhotos(processedPhotos);
      } catch (photoErr) {
        console.error('Failed to load photos:', photoErr);
        setPhotos([]);
        toast.error('Failed to load photos');
      }

      // Load contact messages
      try {
        const contactRes = await api.get('/contact');
        setMessages((contactRes.data || []).filter(Boolean));
      } catch (contactErr) {
        console.error('Failed to load contact messages:', contactErr);
        setMessages([]);
        toast.error('Failed to load contact messages');
      }

      // Load user messages
      try {
        const userMessageRes = await api.get('/messages/admin');
        setUserMessages((userMessageRes.data || []).filter(Boolean));
      } catch (userMessageErr) {
        console.error('Failed to load user messages:', userMessageErr);
        setUserMessages([]);
        toast.error('Failed to load user messages');
      }

      // Load users
      try {
        const userRes = await api.get('/users');
        setUsers((userRes.data || []).filter(Boolean));
      } catch (userErr) {
        console.error('Failed to load users:', userErr);
        setUsers([]);
        toast.error('Failed to load users');
      }

      // Load team members
      try {
        const teamRes = await api.get('/teams');
        setTeamMembers((teamRes.data || []).filter(Boolean));
      } catch (teamErr) {
        console.error('Failed to load team members:', teamErr);
        setTeamMembers([]);
        toast.error('Failed to load team members');
      }
    } catch (err) {
      toast.error('Failed to load admin data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationAction = async (registrationId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const points = achievementPoints[registrationId] || 0;
      await api.put(`/registrations/${registrationId}`, { status, achievementPoints: points });
      toast.success(`Registration ${action}d successfully`);
      // Clear the points for this registration
      setAchievementPoints(prev => {
        const newPoints = { ...prev };
        delete newPoints[registrationId];
        return newPoints;
      });
      loadData(); // Reload data
    } catch (err) {
      toast.error(`Failed to ${action} registration`);
      console.error(err);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    try {
      await api.delete(`/registrations/${registrationId}`);
      toast.success('Registration deleted successfully');
      loadData(); // Reload data
    } catch (err) {
      toast.error('Failed to delete registration');
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    if (!checkInCode.trim()) {
      toast.error('Please enter a start code');
      return;
    }
    try {
      await api.post('/registrations/checkin', { code: checkInCode });
      toast.success('Check-in successful');
      setCheckInCode('');
      loadData(); // Reload data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
      console.error(err);
    }
  };

  const handleCheckOut = async () => {
    if (!checkOutCode.trim()) {
      toast.error('Please enter an end code');
      return;
    }
    try {
      await api.post('/registrations/checkout', { code: checkOutCode });
      toast.success('Check-out successful');
      setCheckOutCode('');
      loadData(); // Reload data
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
      console.error(err);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo._id !== photoId);
    setPhotos(updatedPhotos);
    localStorage.setItem('motoConnectPhotos', JSON.stringify(updatedPhotos));
    toast.success('Photo deleted successfully');
  };

  const handleReply = async (userId: string) => {
    if (!replyMessage.trim()) return;

    try {
      await api.post('/messages', { receiverId: userId, content: replyMessage });
      setReplyMessage('');
      setSelectedUserId('');
      toast.success('Reply sent!');
      loadData(); // Reload messages
    } catch (error) {
      console.error('Failed to send reply', error);
      toast.error('Failed to send reply');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/messages/${messageId}`);
      setUserMessages(userMessages.filter(m => m._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleUpdateMessageStatus = async (messageId: string, status: string) => {
    try {
      await api.put(`/contact/${messageId}`, { status });
      toast.success('Message status updated');
      loadData(); // Reload messages
    } catch (error) {
      toast.error('Failed to update message status');
    }
  };

  const handleDeleteContactMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this contact message?')) return;

    try {
      await api.delete(`/contact/${messageId}`);
      setMessages(messages.filter(m => m._id !== messageId));
      toast.success('Contact message deleted');
    } catch (error) {
      toast.error('Failed to delete contact message');
    }
  };

  const handleAddTeamMember = async () => {
    if (!teamForm.name || !teamForm.role || !teamForm.bio || !teamForm.specialization) {
      toast.error('Please fill all fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', teamForm.name);
    formData.append('role', teamForm.role);
    formData.append('bio', teamForm.bio);
    formData.append('specialization', teamForm.specialization);
    if (teamForm.image) formData.append('image', teamForm.image);

    try {
      await api.post('/teams', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Team member added successfully');
      setTeamForm({ name: '', role: '', bio: '', specialization: '', image: null });
      loadData();
    } catch (error) {
      toast.error('Failed to add team member');
    }
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamForm({
      name: member.name,
      role: member.role,
      bio: member.bio,
      specialization: member.specialization,
      image: null
    });
  };

  const handleUpdateTeamMember = async () => {
    if (!editingTeamMember) return;

    const formData = new FormData();
    formData.append('name', teamForm.name);
    formData.append('role', teamForm.role);
    formData.append('bio', teamForm.bio);
    formData.append('specialization', teamForm.specialization);
    if (teamForm.image) formData.append('image', teamForm.image);

    try {
      await api.put(`/teams/${editingTeamMember._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Team member updated successfully');
      setEditingTeamMember(null);
      setTeamForm({ name: '', role: '', bio: '', specialization: '', image: null });
      loadData();
    } catch (error) {
      toast.error('Failed to update team member');
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      await api.delete(`/teams/${id}`);
      toast.success('Team member deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete team member');
    }
  };

  const exportRegistrations = () => {
    const csvContent = [
      ['Event ID', 'Name', 'Email', 'Phone', 'License', 'Blood Group', 'Bike Model', 'Emergency Contact', 'Status', 'Registered At'],
      ...(registrations || []).filter(reg => reg != null).map(reg => [
        reg.eventId,
        reg.name,
        reg.email,
        reg.phone,
        reg.licenseNumber,
        reg.bloodGroup,
        reg.bikeModel,
        reg.emergencyContact,
        reg.status,
        new Date(reg.registeredAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_registrations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Registration data exported successfully!');
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Analytics data
  const monthlyData = [
    { month: 'Oct', events: 4, registrations: 85, photos: 23 },
    { month: 'Nov', events: 6, registrations: 120, photos: 45 },
    { month: 'Dec', events: 8, registrations: 156, photos: 67 },
  ];

  const eventStatusData = [
    { name: 'Upcoming', value: (events || []).filter(e => e != null && new Date(e.date) > new Date()).length, color: '#3b82f6' },
    { name: 'Past', value: (events || []).filter(e => e != null && new Date(e.date) <= new Date()).length, color: '#10b981' },
  ];

  const registrationStatusData = [
    { name: 'Pending', value: (registrations || []).filter(r => r != null && r.status === 'pending').length, color: '#f59e0b' },
    { name: 'Approved', value: (registrations || []).filter(r => r != null && r.status === 'approved').length, color: '#10b981' },
    { name: 'Rejected', value: (registrations || []).filter(r => r != null && r.status === 'rejected').length, color: '#ef4444' },
  ];

  const stats = [
    {
      title: 'Total Users',
      value: (users || []).filter(Boolean).length,
      icon: Users,
      change: '+12%',
      color: 'text-blue-500'
    },
    {
      title: 'Active Events',
      value: (events || []).filter(e => e != null && new Date(e.date) > new Date()).length,
      icon: Calendar,
      change: '+25%',
      color: 'text-green-500'
    },
    {
      title: 'Total Photos',
      value: (photos || []).filter(Boolean).length,
      icon: Camera,
      change: '+18%',
      color: 'text-purple-500'
    },
    {
      title: 'Pending Registrations',
      value: (registrations || []).filter(r => r != null && r.status === 'pending').length,
      icon: MessageSquare,
      change: '+8%',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your Moto Connect community and monitor platform activity
            </p>
          </div>
          <Button onClick={loadData} variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            Refresh Data
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-green-500 text-sm font-medium">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} bg-slate-700 p-3 rounded-lg`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Monthly Activity</CardTitle>
              <CardDescription>Events, registrations, and photo uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="events" stroke="#f97316" strokeWidth={2} />
                  <Line type="monotone" dataKey="registrations" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="photos" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Registration Status</CardTitle>
              <CardDescription>Current registration status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={registrationStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {registrationStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800">
            <TabsTrigger value="registrations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Registrations
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Events
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Gallery
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Team
            </TabsTrigger>
            <TabsTrigger value="messages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Contact Messages
            </TabsTrigger>
            <TabsTrigger value="user-messages" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              User Messages
            </TabsTrigger>
          </TabsList>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            {/* Check-In/Check-Out Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Check-In Panel</CardTitle>
                  <CardDescription>Enter start code to check-in rider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter start code"
                      value={checkInCode}
                      onChange={(e) => setCheckInCode(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      onClick={handleCheckIn}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Check-In
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Check-Out Panel</CardTitle>
                  <CardDescription>Enter end code to check-out rider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter end code"
                      value={checkOutCode}
                      onChange={(e) => setCheckOutCode(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                    <Button
                      onClick={handleCheckOut}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Check-Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Event Registrations</CardTitle>
                    <CardDescription>Manage participant registrations</CardDescription>
                  </div>
                  <Button
                    onClick={exportRegistrations}
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(registrations || []).filter(reg => reg != null).map((registration, index) => (
                    <div key={registration._id || index} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{registration.name}</h4>
                          <p className="text-gray-400 text-sm">{registration.email}</p>
                          <p className="text-gray-400 text-sm">Event: {registration.eventId?.title || 'Unknown Event'}</p>
                        </div>
                        <Badge className={
                          registration.status === 'pending' ? 'bg-yellow-500' :
                          registration.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                        }>
                          {registration.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-400 mb-3">
                        <div>
                          <span className="font-medium">Phone:</span> {registration.phone}
                        </div>
                        <div>
                          <span className="font-medium">License:</span> {registration.licenseNumber}
                        </div>
                        <div>
                          <span className="font-medium">Blood:</span> {registration.bloodGroup}
                        </div>
                        <div>
                          <span className="font-medium">Bike:</span> {registration.bikeModel}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {registration.status === 'pending' && (
                          <>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Points"
                                value={achievementPoints[registration._id] || ''}
                                onChange={(e) => setAchievementPoints(prev => ({
                                  ...prev,
                                  [registration._id]: parseInt(e.target.value) || 0
                                }))}
                                className="w-20 bg-slate-600 border-slate-500 text-white"
                                min="0"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleRegistrationAction(registration._id, 'approve')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRegistrationAction(registration._id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {registration.status === 'approved' && (
                          <div className="text-sm text-gray-400">
                            Approved Points: {(registration as any).approvedPoints || 0}
                          </div>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRegistration(registration._id)}
                          className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {registrations.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No registrations yet</h3>
                      <p className="text-gray-400">Registrations will appear here as users sign up for events.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Event Management</CardTitle>
                <CardDescription>Overview of all events and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(events || []).filter(Boolean).map((event, index) => (
                    <div key={event.id || index} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">{event.title}</h4>
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          {event.registeredCount}/{event.maxParticipants} riders
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Date: {new Date(event.date).toLocaleDateString()}</span>
                        <span>
                          {new Date(event.date) > new Date() ? 'Upcoming' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {events.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No events created</h3>
                      <p className="text-gray-400">Create your first event to get started.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Gallery Management</CardTitle>
                <CardDescription>Moderate and manage community photos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(photos || []).filter(Boolean).map((photo, index) => (
                    <div key={photo._id || index} className="bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="text-white font-medium text-sm mb-1">{photo.title}</h4>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>by {photo.uploadedBy?.name || 'Unknown'}</span>
                          <span>{(photo.likes || []).length} likes</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePhoto(photo._id)}
                          className="w-full"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}

                  {photos.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No photos uploaded</h3>
                      <p className="text-gray-400">Community photos will appear here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Team Management</CardTitle>
                <CardDescription>Manage team members and their profile pictures</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add/Edit Form */}
                <div className="mb-6 p-4 bg-slate-700 rounded-lg">
                  <h3 className="text-white font-semibold mb-4">
                    {editingTeamMember ? 'Edit Team Member' : 'Add New Team Member'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Name"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                    <Input
                      placeholder="Role"
                      value={teamForm.role}
                      onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                    <Input
                      placeholder="Specialization"
                      value={teamForm.specialization}
                      onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setTeamForm({ ...teamForm, image: e.target.files?.[0] || null })}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Upload profile picture (optional for edit)</p>
                    </div>
                  </div>
                  <textarea
                    placeholder="Bio"
                    value={teamForm.bio}
                    onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                    className="w-full mt-4 p-2 bg-slate-600 border border-slate-500 text-white rounded"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={editingTeamMember ? handleUpdateTeamMember : handleAddTeamMember}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      {editingTeamMember ? 'Update' : 'Add'} Team Member
                    </Button>
                    {editingTeamMember && (
                      <Button
                        onClick={() => {
                          setEditingTeamMember(null);
                          setTeamForm({ name: '', role: '', bio: '', specialization: '', image: null });
                        }}
                        variant="outline"
                        className="border-slate-600 text-white"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Team Members List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(teamMembers || []).filter(Boolean).map((member, index) => (
                    <div key={member._id || index} className="bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={member.imageUrl}
                        alt={member.name}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h4 className="text-white font-medium text-sm mb-1">{member.name}</h4>
                        <p className="text-orange-500 text-xs mb-1">{member.role}</p>
                        <p className="text-gray-400 text-xs mb-2">{member.specialization}</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleEditTeamMember(member)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTeamMember(member._id)}
                            className="flex-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {teamMembers.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No team members</h3>
                      <p className="text-gray-400">Add your first team member above.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Contact Messages</CardTitle>
                <CardDescription>Messages from the contact form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(messages || []).filter(Boolean).map((message, index) => (
                    <div key={message._id || index} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-semibold">{message.name}</h4>
                        <Badge className={
                          message.status === 'new' ? 'bg-blue-500' :
                          message.status === 'replied' ? 'bg-green-500' : 'bg-gray-500'
                        }>
                          {message.category} - {message.status}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{message.email}</p>
                      <h5 className="text-white font-medium mb-2">{message.subject}</h5>
                      <p className="text-gray-300 text-sm mb-3">{message.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Submitted: {new Date(message.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          {message.status === 'new' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateMessageStatus(message._id, 'replied')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Mark Replied
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteContactMessage(message._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No messages</h3>
                      <p className="text-gray-400">Contact form messages will appear here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Messages Tab */}
          <TabsContent value="user-messages">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User Messages</CardTitle>
                <CardDescription>Messages from users for ride queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Messages List */}
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {(userMessages || []).filter(Boolean).map((message, index) => (
                      <div key={message._id || index} className={`p-3 rounded-lg ${message.senderId?._id === user._id ? 'bg-orange-600 text-white ml-12' : 'bg-slate-700 text-white mr-12'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{message.senderId?.name || 'Unknown'} ({message.type})</span>
                          <span className="text-xs opacity-75">{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{message.content}</p>
                        {message.type === 'user-to-admin' && message.senderId && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedUserId(message.senderId._id)}
                            className="mt-2 bg-blue-600 hover:bg-blue-700"
                          >
                            Reply
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleDeleteMessage(message._id)}
                          className="mt-2 bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                    {userMessages.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-white text-lg font-semibold mb-2">No user messages</h3>
                        <p className="text-gray-400">User messages will appear here.</p>
                      </div>
                    )}
                  </div>

                  {/* Reply Section */}
                  {selectedUserId && (
                    <div className="border-t border-slate-600 pt-4">
                      <h4 className="text-white font-medium mb-2">Reply to {(users || []).find(u => u && u._id === selectedUserId)?.name || 'User'}</h4>
                      <div className="flex gap-2">
                        <Input
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          className="bg-slate-700 border-slate-600 text-white flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && handleReply(selectedUserId)}
                        />
                        <Button
                          onClick={() => handleReply(selectedUserId)}
                          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                          disabled={!replyMessage.trim()}
                        >
                          Send Reply
                        </Button>
                        <Button
                          onClick={() => setSelectedUserId('')}
                          variant="outline"
                          className="border-slate-600 text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
