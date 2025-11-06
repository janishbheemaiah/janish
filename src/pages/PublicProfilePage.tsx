import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, Camera, Award, Bike, Heart, ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface PublicUser {
  _id: string;
  username: string;
  name: string;
  profilePicture?: string;
  bikeModel?: string;
  achievementPoints: number;
  createdAt: string;
}

interface UserPhoto {
  id: string;
  title: string;
  url: string;
  uploadedAt: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
}

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
  };
  text: string;
  createdAt: string;
}

const PublicProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) return;

      try {
        setLoading(true);
        // First get user by username
        const userRes = await api.get(`/users/search?username=${encodeURIComponent(username)}`);
        if (!userRes.data || userRes.data.length === 0) {
          setError('User not found');
          return;
        }

        const foundUser = userRes.data[0];
        setUser(foundUser);

        // Then get their photos
        const photosRes = await api.get(`/photos?userId=${foundUser._id}`);
        const photos = await Promise.all((photosRes.data || []).map(async (photo: any) => {
          // Fetch comments for each photo
          const commentsRes = await api.get(`/photos/${photo._id}/comments`);
          const comments = commentsRes.data || [];

          return {
            id: photo._id,
            title: photo.title || 'Untitled',
            url: `/uploads/${photo.filename}`,
            uploadedAt: photo.createdAt,
            likes: photo.likes?.length || 0,
            isLiked: currentUser ? photo.likes?.includes(currentUser._id) : false,
            comments
          };
        }));
        setUserPhotos(photos);
      } catch (err) {
        console.error('Failed to fetch user profile', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The user you\'re looking for doesn\'t exist.'}</p>
          <Link to="/">
            <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is the current user's own profile
  const isOwnProfile = currentUser && currentUser._id === user._id;

  const handleLike = async (photoId: string) => {
    if (!currentUser) return;

    try {
      const res = await api.post(`/photos/${photoId}/like`);
      setUserPhotos(photos =>
        photos.map(photo =>
          photo.id === photoId
            ? { ...photo, likes: res.data.likes, isLiked: !photo.isLiked }
            : photo
        )
      );
    } catch (err) {
      console.error('Failed to like photo', err);
    }
  };

  const handleComment = async (photoId: string) => {
    if (!currentUser || !newComment[photoId]?.trim()) return;

    try {
      const res = await api.post(`/photos/${photoId}/comments`, { text: newComment[photoId] });
      setUserPhotos(photos =>
        photos.map(photo =>
          photo.id === photoId
            ? { ...photo, comments: [...photo.comments, res.data] }
            : photo
        )
      );
      setNewComment(prev => ({ ...prev, [photoId]: '' }));
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !messageText.trim() || !user) return;

    try {
      await api.post('/messages', { receiverId: user._id, content: messageText });
      setMessageText('');
      setShowMessageDialog(false);
      toast.success('Message sent successfully!');
    } catch (err) {
      console.error('Failed to send message', err);
      toast.error('Failed to send message');
    }
  };

  const stats = [
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
      value: user.achievementPoints,
      color: 'text-yellow-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

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
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-4">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                    <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                    {currentUser && currentUser._id !== user._id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMessageDialog(true)}
                          className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        <Link to={`/messages?user=${user._id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-300 hover:text-white"
                          >
                            Open Chat
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  <p className="text-orange-500 font-medium mb-2">@{user.username}</p>
                  <p className="text-gray-400 text-sm">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
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

                {/* Bike Model */}
                {user.bikeModel && (
                  <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                    <Bike className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-300">{user.bikeModel}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="photos" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-2 bg-slate-800`}>
            <TabsTrigger value="photos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Photos
            </TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600">
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Photos</CardTitle>
                <CardDescription>Photos shared by {user.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userPhotos.map((photo, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h4 className="text-white font-medium mb-1">{photo.title}</h4>
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                          <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLike(photo.id)}
                              disabled={!currentUser}
                              className={`p-1 h-6 w-6 ${photo.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                            >
                              <Heart className={`h-4 w-4 ${photo.isLiked ? 'fill-current' : ''}`} />
                            </Button>
                            <span>{photo.likes}</span>
                            <MessageCircle className="h-4 w-4" />
                            <span>{photo.comments.length}</span>
                          </div>
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-2">
                          {photo.comments.slice(0, 3).map((comment) => (
                            <div key={comment._id} className="bg-slate-600 rounded p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-500 font-medium text-sm">@{comment.user.username}</span>
                                <span className="text-gray-400 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-200 text-sm">{comment.text}</p>
                            </div>
                          ))}
                          {photo.comments.length > 3 && (
                            <p className="text-gray-400 text-xs">+{photo.comments.length - 3} more comments</p>
                          )}

                          {/* Add Comment */}
                          {currentUser && (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment[photo.id] || ''}
                                onChange={(e) => setNewComment(prev => ({ ...prev, [photo.id]: e.target.value }))}
                                className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleComment(photo.id)}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleComment(photo.id)}
                                disabled={!newComment[photo.id]?.trim()}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {userPhotos.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-white text-lg font-semibold mb-2">No photos yet</h3>
                      <p className="text-gray-400">This rider hasn't shared any photos.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Achievements</CardTitle>
                <CardDescription>{user.name}'s riding milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-700 rounded-lg">
                    <User className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="text-white font-semibold">New Member</h4>
                    <p className="text-gray-400 text-sm">Joined Moto Connect</p>
                  </div>
                  {userPhotos.length >= 1 && (
                    <div className="text-center p-4 bg-slate-700 rounded-lg">
                      <Camera className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Photographer</h4>
                      <p className="text-gray-400 text-sm">Shared photos with the community</p>
                    </div>
                  )}
                  {user.achievementPoints >= 50 && (
                    <div className="text-center p-4 bg-slate-700 rounded-lg">
                      <Award className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <h4 className="text-white font-semibold">Achiever</h4>
                      <p className="text-gray-400 text-sm">Earned achievement points</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Message Dialog */}
        {showMessageDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="bg-slate-800 border-slate-700 w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="text-white">Send Message</CardTitle>
                <CardDescription>Send a message to {user.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full bg-slate-700 border border-slate-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 resize-none"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMessageDialog(false);
                      setMessageText('');
                    }}
                    className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;
