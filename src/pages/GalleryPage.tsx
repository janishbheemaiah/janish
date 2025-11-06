import { useState, useRef, useEffect } from 'react';
import { Camera, Heart, MessageCircle, Trash2, Upload, Filter, Grid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  likes: string[];
  comments: Comment[];
  category: 'ride' | 'bike' | 'scenery' | 'group' | 'other';
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

const GalleryPage = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Upload form state
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: 'ride' as Photo['category']
  });

  // Load photos from backend on component mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await api.get('/photos');
        const mappedPhotos = res.data.map((p: any) => ({
          id: p._id,
          url: `http://localhost:5000/uploads/${p.filename}`,
          title: p.title || 'Untitled',
          description: p.description || '',
          uploadedBy: p.uploadedBy?.name || 'Unknown',
          uploadedAt: p.createdAt,
          likes: p.likes || [], // likes from backend
          comments: [], // comments are kept local
          category: p.tags[0] || 'other'
        }));
        setPhotos(mappedPhotos);
      } catch (error) {
        console.error('Failed to fetch photos', error);
      }
    };
    fetchPhotos();
  }, []);

  const filteredPhotos = filterCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === filterCategory);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    if (!uploadData.title.trim()) {
      toast.error('Please enter a title for your photo');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('title', uploadData.title.trim());
    formData.append('description', uploadData.description.trim());
    formData.append('tags', uploadData.category);

    try {
      const res = await api.post('/photos/upload', formData);
      // Add to photos state
      const newPhoto: Photo = {
        id: res.data._id,
        url: `http://localhost:5000/uploads/${res.data.filename}`,
        title: res.data.title,
        description: res.data.description,
        uploadedBy: user?.name || 'Anonymous',
        uploadedAt: res.data.createdAt,
        likes: [],
        comments: [],
        category: res.data.tags[0] || 'other'
      };
      setPhotos([newPhoto, ...photos]);

      // Reset form and close dialog
      setUploadDialog(false);
      setUploadData({ title: '', description: '', category: 'ride' });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    }
  };

  const handleLike = async (photoId: string) => {
    if (!user) {
      toast.error('Please login to like photos');
      return;
    }

    try {
      const res = await api.post(`/photos/${photoId}/like`);
      const updatedPhotos = photos.map(photo => {
        if (photo.id === photoId) {
          const isLiked = photo.likes.includes(user._id);
          return {
            ...photo,
            likes: isLiked
              ? photo.likes.filter(id => id !== user._id)
              : [...photo.likes, user._id]
          };
        }
        return photo;
      });
      setPhotos(updatedPhotos);
      toast.success(res.data.message);
    } catch (error) {
      console.error('Failed to like photo', error);
      toast.error('Failed to like photo');
    }
  };

  const handleComment = (photoId: string) => {
    if (!user || !commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      userId: user._id,
      userName: user.name,
      text: commentText.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedPhotos = photos.map(photo => {
      if (photo.id === photoId) {
        return {
          ...photo,
          comments: [...photo.comments, newComment]
        };
      }
      return photo;
    });

    setPhotos(updatedPhotos);
    // Note: comments are kept local, not persisted to backend
    setCommentText('');
    toast.success('Comment added!');
  };

  const handleDelete = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    if (!user?.isAdmin && photo.uploadedBy !== user?.name) {
      toast.error('You can only delete your own photos');
      return;
    }

    try {
      await api.delete(`/photos/${photoId}`);
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      setSelectedPhoto(null);
      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
            Moto Gallery
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Share your riding adventures, showcase your bikes, and explore amazing photos from the community
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ride">Rides</SelectItem>
                  <SelectItem value="bike">Bikes</SelectItem>
                  <SelectItem value="scenery">Scenery</SelectItem>
                  <SelectItem value="group">Group Photos</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex bg-slate-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-orange-500' : ''}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-orange-500' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {user && (
              <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Upload New Photo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Title *</label>
                      <Input
                        placeholder="Give your photo a title..."
                        value={uploadData.title}
                        onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Description</label>
                      <Textarea
                        placeholder="Tell us about this photo..."
                        value={uploadData.description}
                        onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Category</label>
                      <Select value={uploadData.category} onValueChange={(value: Photo['category']) => setUploadData({...uploadData, category: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="ride">Ride</SelectItem>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="scenery">Scenery</SelectItem>
                          <SelectItem value="group">Group Photo</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => {
                          if (!uploadData.title.trim()) {
                            toast.error('Please enter a title for your photo');
                            return;
                          }
                          fileInputRef.current?.click();
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Photo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Photo Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="bg-slate-800 border-slate-700 overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group cursor-pointer">
                <div className="relative">
                  <img 
                    src={photo.url} 
                    alt={photo.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-slate-900/80 text-white">
                      {photo.category}
                    </Badge>
                  </div>
                  {(user?.isAdmin || photo.uploadedBy === user?.name) && (
                    <div className="absolute top-2 left-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(photo.id);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-1 truncate">{photo.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{photo.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>by {photo.uploadedBy}</span>
                    <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(photo.id)}
                        className={`p-1 ${photo.likes.includes(user?._id || '') ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                      >
                        <Heart className={`h-4 w-4 ${photo.likes.includes(user?._id || '') ? 'fill-current' : ''}`} />
                        <span className="ml-1">{photo.likes.length}</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPhoto(photo)}
                        className="p-1 text-gray-400 hover:text-orange-500"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="ml-1">{photo.comments.length}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPhotos.map((photo) => (
              <Card key={photo.id} className="bg-slate-800 border-slate-700 overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img 
                      src={photo.url} 
                      alt={photo.title}
                      className="w-full h-48 md:h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                  </div>
                  <CardContent className="md:w-2/3 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white text-xl font-semibold mb-2">{photo.title}</h3>
                        <Badge className="mb-2">{photo.category}</Badge>
                      </div>
                      {(user?.isAdmin || photo.uploadedBy === user?.name) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(photo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-gray-400 mb-4">{photo.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Uploaded by {photo.uploadedBy}</span>
                      <span>{new Date(photo.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        onClick={() => handleLike(photo.id)}
                        className={`${photo.likes.includes(user?._id || '') ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                      >
                        <Heart className={`h-5 w-5 mr-2 ${photo.likes.includes(user?._id || '') ? 'fill-current' : ''}`} />
                        {photo.likes.length} likes
                      </Button>
                      
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedPhoto(photo)}
                        className="text-gray-400 hover:text-orange-500"
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        {photo.comments.length} comments
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No photos found</h3>
            <p className="text-gray-400">Be the first to share your riding adventures!</p>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="space-y-4">
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.title}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
                
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white text-xl font-semibold">{selectedPhoto.title}</h3>
                    {(user?.isAdmin || selectedPhoto.uploadedBy === user?.name) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(selectedPhoto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-gray-400 mb-4">{selectedPhoto.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>by {selectedPhoto.uploadedBy}</span>
                    <span>{new Date(selectedPhoto.uploadedAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <Button
                      variant="ghost"
                      onClick={() => handleLike(selectedPhoto.id)}
                      className={`${selectedPhoto.likes.includes(user?._id || '') ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${selectedPhoto.likes.includes(user?._id || '') ? 'fill-current' : ''}`} />
                      {selectedPhoto.likes.length} likes
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="border-t border-slate-700 pt-4">
                  <h4 className="text-white font-semibold mb-4">Comments ({selectedPhoto.comments.length})</h4>
                  
                  {user && (
                    <div className="flex gap-3 mb-4">
                      <Input
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(selectedPhoto.id);
                          }
                        }}
                      />
                      <Button
                        onClick={() => handleComment(selectedPhoto.id)}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                      >
                        Post
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedPhoto.comments.map((comment) => (
                      <div key={comment.id} className="bg-slate-700 p-3 rounded-lg">
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                          <span className="font-medium text-white">{comment.userName}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300">{comment.text}</p>
                      </div>
                    ))}
                    
                    {selectedPhoto.comments.length === 0 && (
                      <p className="text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;