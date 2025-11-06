import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Edit, Save, Camera, Calendar, Award, MapPin, Phone, Mail, Bike, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import api from '@/lib/api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  bikeModel: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserEvent {
  id: string;
  registrationId: string;
  title: string;
  date: string;
  location: string;
  status: 'registered' | 'completed' | 'cancelled' | 'rejected' | 'pending';
  startCode?: string;
  endCode?: string;
  overallStatus?: 'Completed' | 'LeftEarly' | 'Absent' | 'Cancelled' | 'PendingApproval';
  message?: string;
  achievementPoints?: number;
  approvedPoints?: number;
}

interface UserPhoto {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  likes: number;
}

interface Message {
  _id: string;
  senderId: { _id: string; name: string; email: string };
  receiverId: { _id: string; name: string; email: string };
  content: string;
  isRead: boolean;
  type: 'user-to-admin' | 'admin-to-user';
  createdAt: string;
}

const ProfilePage = () => {
  const { user, updateProfile, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      licenseNumber: user?.licenseNumber || '',
      bloodGroup: user?.bloodGroup || '',
      bikeModel: user?.bikeModel || '',
    },
  });

  useEffect(() => {
    if (user) {
      // Load user's registered events from backend
      const fetchRegistrations = async () => {
        try {
          const res = await api.get(`/registrations/user/${user._id}?t=${Date.now()}`);
          const userEventsList: UserEvent[] = (res.data || []).filter(Boolean).map((reg: any) => ({
            id: reg.eventId?._id,
            registrationId: reg._id,
            title: reg.eventId?.title,
            date: reg.registeredAt,
            location: reg.eventId?.location,
            status: reg.overallStatus === 'Completed' ? 'completed' : (reg.status === 'rejected' ? 'rejected' : (reg.status === 'approved' ? 'registered' : 'pending')),
            startCode: reg.startCode,
            endCode: reg.endCode,
            overallStatus: reg.overallStatus,
            message: reg.message,
            achievementPoints: reg.achievementPoints,
            approvedPoints: reg.approvedPoints
          })).filter(Boolean);
          setUserEvents(userEventsList);
        } catch (error) {
          console.error('Failed to fetch registrations', error);
        }
      };
      fetchRegistrations();

      // Fetch latest profile data to ensure achievement points are updated
      const fetchLatestProfile = async () => {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data);
        } catch (err) {
          console.error('Failed to fetch latest profile');
        }
      };
      fetchLatestProfile();

      // Load user's uploaded photos from backend
      const fetchPhotos = async () => {
        try {
          const res = await api.get(`/photos?userId=${user._id}`);
          const photos = (res.data || []).filter(Boolean).map((photo: any) => ({
            id: photo._id,
            title: photo.title || 'Untitled',
            url: `/uploads/${photo.filename}`,
            uploadedAt: photo.createdAt,
            likes: photo.likes?.length || 0
          })).filter(Boolean);
          setUserPhotos(photos);
        } catch (error) {
          console.error('Failed to fetch photos', error);
        }
      };
      fetchPhotos();

      // Fetch admin id
      const fetchAdmin = async () => {
        try {
          const res = await api.get('/users/admins');
          if (res.data.length > 0) {
            setAdminId(res.data[0]._id);
          }
        } catch (error) {
          console.error('Failed to fetch admin', error);
        }
      };
      fetchAdmin();

      // Fetch messages
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/messages/user/${user._id}`);
          setMessages((res.data || []).filter(Boolean));
        } catch (error) {
          console.error('Failed to fetch messages', error);
        }
      };
      fetchMessages();
    }
  }, [user, refreshKey]);



  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await updateProfile(data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const res = await api.post('/auth/upload-profile-picture', formData);
      // Update user in context
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !adminId) return;

    try {
      await api.post('/messages', { receiverId: adminId, content: newMessage });
      setNewMessage('');
      // Refetch messages
      const res = await api.get(`/messages/user/${user._id}`);
      setMessages(res.data);
      toast.success('Message sent!');
    } catch (error) {
      console.error('Failed to send message', error);
      toast.error('Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(messages.filter(m => m._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;

    const message = messages.find(m => m._id === selectedMessageId);
    if (!message) return;

    try {
      await api.post('/messages', { receiverId: message.senderId._id, content: replyMessage });
      setReplyMessage('');
      setSelectedMessageId('');
      // Refetch messages
      const res = await api.get(`/messages/user/${user._id}`);
      setMessages(res.data);
      toast.success('Reply sent');
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  const handleReRegister = async (registrationId: string) => {
    try {
      await api.put(`/registrations/${registrationId}/request-reapproval`);
      toast.success('Re-approval requested! Please wait for admin approval.');
      refreshProfile();
    } catch (error: any) {
      console.error('Re-approval request failed', error);
      const message = error.response?.data?.message || 'Failed to request re-approval. Please try again.';
      toast.error(message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please login to view your profile.</p>
        </div>
      </div>
    );
  }

  const totalAchievementPoints = user?.achievementPoints || 0;

  // Function to refresh profile data
  const refreshProfile = () => {
    setRefreshKey(prev => prev + 1);
  };

  const stats = [
    {
      icon: Calendar,
      label: 'Events Joined',
      value: userEvents.length,
      color: 'text-blue-500'
    },
    {
      icon: Camera,
      label: 'Photos Shared',
      value: userPhotos.length,
      color: 'text-green-500'
    },
    {
      icon: Heart,
      label: 'Total Likes',
      value: userPhotos.reduce((sum, photo) => sum + photo.likes, 0),
      color: 'text-red-500'
    },
    {
      icon: Award,
      label: 'Achievement Points',
      value: totalAchievementPoints,
      color: 'text-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-red-600 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
                    {user.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                </div>
                <label htmlFor="profilePicture" className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 rounded-full p-2 cursor-pointer transition-colors">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                    {user.username && (
                      <p className="text-orange-500 font-medium mb-2">@{user.username}</p>
                    )}
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">{user.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    {user.isAdmin && (
                      <Badge className="bg-orange-500 text-white">Admin</Badge>
                    )}
                    <Badge variant="outline" className="border-green-500 text-green-500">
                      Active Member
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshProfile}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className={`${stat.color} mb-1`}>
                        <stat.icon className="h-6 w-6 mx-auto" />
                      </div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full ${user.isAdmin ? 'grid-cols-4' : 'grid-cols-5'} bg-slate-800`}>
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              My Events
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              My Photos
            </TabsTrigger>
            {!user.isAdmin && (
              <TabsTrigger value="connect" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
                Connect with Us
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Riding Information */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Bike className="h-5 w-5 mr-2 text-orange-500" />
                    Riding Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-400">License Number</Label>
                    <p className="text-white">{user.licenseNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Blood Group</Label>
                    <p className="text-white">{user.bloodGroup || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Bike Model</Label>
                    <p className="text-white">{user.bikeModel || 'Not provided'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(userEvents || []).slice(0, 3).map((event, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{event.title}</p>
                          <p className="text-gray-400 text-xs">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                        <Badge className={event.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                    {(userEvents || []).length === 0 && (
                      <p className="text-gray-400 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Award className="h-5 w-5 mr-2 text-yellow-500" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700 rounded-lg">
                    <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="text-white font-semibold">New Member</h4>
                    <p className="text-gray-400 text-sm">Joined Moto Connect</p>
                  </div>
                  {userEvents.length >= 1 && (
                    <div className="text-center p-4 bg-slate-700 rounded-lg">
                      <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">First Ride</h4>
                      <p className="text-gray-400 text-sm">Joined your first event</p>
                    </div>
                  )}
                  {userPhotos.length >= 1 && (
                    <div className="text-center p-4 bg-slate-700 rounded-lg">
                      <Camera className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Photographer</h4>
                      <p className="text-gray-400 text-sm">Shared your first photo</p>
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
                <CardTitle className="text-white">My Events</CardTitle>
                <CardDescription>Events you've registered for or completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(userEvents || []).map((event, index) => (
                    <div key={index} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <Calendar className="h-5 w-5 text-orange-500" />
                          <div>
                            <h4 className="text-white font-medium">{event.title}</h4>
                            <p className="text-gray-400 text-sm">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Badge className={
                          event.status === 'completed' ? 'bg-green-500' :
                          event.status === 'rejected' ? 'bg-red-500' :
                          event.overallStatus === 'PendingApproval' ? 'bg-yellow-500' : 'bg-blue-500'
                        }>
                          {event.overallStatus === 'PendingApproval' ? 'Pending Approval' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                      {event.overallStatus && (
                        <div className="mb-3">
                          <Badge className={
                            event.overallStatus === 'Completed' ? 'bg-green-500' :
                            event.overallStatus === 'LeftEarly' ? 'bg-yellow-500' :
                            event.overallStatus === 'Cancelled' ? 'bg-red-500' : 'bg-gray-500'
                          }>
                            {event.overallStatus}
                          </Badge>
                          {event.message && (
                            <p className="text-gray-300 text-sm mt-1">{event.message}</p>
                          )}
                          {event.status === 'rejected' && (
                            <Button
                              size="sm"
                              className="mt-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                              onClick={() => handleReRegister(event.registrationId)}
                            >
                              Re-register
                            </Button>
                          )}
                        </div>
                      )}
                      {(event.overallStatus === 'Absent' || event.overallStatus === 'LeftEarly') && event.startCode && event.endCode && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {event.overallStatus === 'Absent' && (
                            <>
                              <div>
                                <Label className="text-gray-400">Start Code:</Label>
                                <p className="text-white font-mono">{event.startCode}</p>
                              </div>
                              <div>
                                <Label className="text-gray-400">End Code:</Label>
                                <p className="text-white font-mono">{event.endCode}</p>
                              </div>
                            </>
                          )}
                          {event.overallStatus === 'LeftEarly' && (
                            <div className="col-span-2">
                              <Label className="text-gray-400">End Code (for check-out):</Label>
                              <p className="text-white font-mono">{event.endCode}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {(userEvents || []).length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No events yet</h3>
                      <p className="text-gray-400 mb-4">Join your first ride to get started!</p>
                      <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                        Browse Events
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">My Photos</CardTitle>
                <CardDescription>Photos you've shared with the community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(userPhotos || []).map((photo, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="text-white font-medium mb-1">{photo.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{photo.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(userPhotos || []).length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No photos yet</h3>
                      <p className="text-gray-400 mb-4">Share your riding adventures!</p>
                      <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                        Upload Photo
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connect with Us Tab */}
          <TabsContent value="connect">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Connect with Us</CardTitle>
                <CardDescription>Send messages to our admin for any queries related to rides</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Messages List */}
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {(messages || []).map((message) => (
                      <div key={message._id} className={`p-3 rounded-lg ${message.senderId?._id === user._id ? 'bg-orange-600 text-white ml-12' : 'bg-slate-700 text-white mr-12'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{message.senderId?.name || 'Unknown'}</span>
                          <span className="text-xs opacity-75">{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{message.content}</p>
                        {message.senderId?._id === user._id && (
                          <Button size="sm" onClick={() => handleDeleteMessage(message._id)} className="mt-1 bg-red-500 hover:bg-red-600">
                            Delete
                          </Button>
                        )}
                        {message.senderId?._id !== user._id && message.senderId && (
                          <Button size="sm" onClick={() => setSelectedMessageId(message._id)} className="mt-1 bg-blue-500 hover:bg-blue-600">
                            Reply
                          </Button>
                        )}
                      </div>
                    ))}
                    {(messages || []).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No messages yet. Start a conversation!</p>
                      </div>
                    )}
                  </div>

                  {/* Send Message */}
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  Profile Settings
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Full Name</Label>
                      <Input
                        id="name"
                        disabled={!isEditing}
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                        {...profileForm.register('name')}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-red-400 text-sm">{profileForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        disabled={!isEditing}
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                        {...profileForm.register('email')}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-red-400 text-sm">{profileForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white">Phone Number</Label>
                      <Input
                        id="phone"
                        disabled={!isEditing}
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                        {...profileForm.register('phone')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="text-white">License Number</Label>
                      <Input
                        id="licenseNumber"
                        disabled={!isEditing}
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                        {...profileForm.register('licenseNumber')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup" className="text-white">Blood Group</Label>
                      <Select 
                        disabled={!isEditing}
                        onValueChange={(value) => profileForm.setValue('bloodGroup', value)}
                        defaultValue={user.bloodGroup}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white disabled:opacity-50">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bikeModel" className="text-white">Bike Model</Label>
                      <Input
                        id="bikeModel"
                        disabled={!isEditing}
                        placeholder="e.g., Harley Davidson Street 750"
                        className="bg-slate-700 border-slate-600 text-white disabled:opacity-50"
                        {...profileForm.register('bikeModel')}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;