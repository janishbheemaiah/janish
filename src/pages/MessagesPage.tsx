import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, User, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  receiverId: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  isRead: boolean;
  isDeleted?: boolean;
  type: string;
  createdAt: string;
}

interface Conversation {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  messages: Message[];
  lastMessage: Message;
}

const MessagesPage = () => {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [startNewConversation, setStartNewConversation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
      // Auto-refresh messages every 15 seconds to catch updates
      const interval = setInterval(fetchMessages, 15000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Check if we should start a new conversation
    const userId = searchParams.get('user');
    if (userId && currentUser && !loading) {
      // Always fetch user details and start conversation with fresh messages
      fetchUserDetails(userId).then(() => {
        fetchConversationWith(userId);
      });
    }
  }, [searchParams, loading, currentUser]);

  const fetchUserDetails = async (userId: string) => {
    try {
      const res = await api.get(`/users/${userId}`);
      const user = res.data;
      setSelectedConversation({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        messages: [],
        lastMessage: ({} as Message) // Placeholder
      });
    } catch (err) {
      console.error('Failed to fetch user details', err);
      toast.error('Failed to load user details');
    }
  };

  const fetchConversationWith = async (otherUserId: string) => {
    try {
      const res = await api.get(`/messages/with/${otherUserId}`);
      const messages: Message[] = res.data;

      // Get user info first
      const userRes = await api.get(`/users/${otherUserId}`);
      const userData = userRes.data;

      // Filter messages to hide deleted ones from receiver
      const filteredMessages = messages.filter(message => 
        !message.isDeleted || message.senderId._id === currentUser!._id
      );

      // Use the fetched user data
      const otherUser = {
        _id: userData._id,
        name: userData.name,
        email: userData.email
      };

      setSelectedConversation({
        user: otherUser,
        messages: filteredMessages,
        lastMessage: filteredMessages[filteredMessages.length - 1] || ({} as Message)
      });
    } catch (err) {
      console.error('Failed to fetch conversation', err);
      toast.error('Failed to load conversation');
    }
  };

  const fetchMessages = async () => {
    // Guard: Only fetch if currentUser exists
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get(`/messages/user/${currentUser._id}`);
      const messages: Message[] = res.data;

      // Group messages by conversation and filter deleted messages correctly
      const conversationMap = new Map<string, Conversation>();
      messages.forEach(message => {
        // Skip deleted messages unless current user is sender
        if (message.isDeleted && message.senderId._id !== currentUser._id) {
          return;
        }

        const otherUser = message.senderId._id === currentUser._id ? message.receiverId : message.senderId;
        // Use email as key to ensure unique conversations per user
        const key = otherUser.email.toLowerCase();

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            user: otherUser,
            messages: [],
            lastMessage: message
          });
        }

        const conversation = conversationMap.get(key)!;
        // Add message to thread
        conversation.messages.push(message);
        // Update last message if this is newer and not deleted (or if sender)
        if ((!message.isDeleted || message.senderId._id === capturedUser!._id) && 
            (!conversation.lastMessage || new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt))) {
          conversation.lastMessage = message;
        }
      });

      const conversationsArray = Array.from(conversationMap.values())
        .filter(conv => conv.messages.length > 0) // Remove empty conversations
        .sort((a, b) =>
          new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
        );
      setConversations(conversationsArray);
    } catch (err) {
      console.error('Failed to fetch messages', err);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !currentUser) return;

    try {
      await api.post('/messages', {
        receiverId: selectedConversation.user._id,
        content: newMessage
      });

      setNewMessage('');
      toast.success('Message sent!');
      // Refresh both the conversation and conversation list
      await fetchConversationWith(selectedConversation.user._id);
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
      toast.error('Failed to send message');
    }
  };

  const [unsendModalOpen, setUnsendModalOpen] = useState(false);
  const [unsendCandidate, setUnsendCandidate] = useState<string | null>(null);

  const openUnsendModal = (messageId: string) => {
    setUnsendCandidate(messageId);
    setUnsendModalOpen(true);
  };

  const closeUnsendModal = () => {
    setUnsendCandidate(null);
    setUnsendModalOpen(false);
  };

  const handleUnsendConfirmed = async () => {
    if (!unsendCandidate) return;
    try {
      await api.delete(`/messages/${unsendCandidate}`);
      closeUnsendModal();

      // Show toast with Undo action (10s window)
      toast.success('Message unsent', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await api.post(`/messages/${unsendCandidate}/restore`);
              toast.success('Message restored');
              if (selectedConversation) await fetchConversationWith(selectedConversation.user._id);
              fetchMessages();
            } catch (err) {
              toast.error('Restore failed');
            }
          }
        }
      });

      if (selectedConversation) await fetchConversationWith(selectedConversation.user._id);
      fetchMessages();
    } catch (err) {
      console.error('Failed to unsend', err);
      toast.error('Failed to unsend message');
    }
  };

  const handleConnectUs = async () => {
    try {
      const res = await api.get('/users/admins');
      const admins = res.data;
      if (!admins || admins.length === 0) {
        toast.error('No admins available');
        return;
      }
      const admin = admins[0];
      // open conversation with admin
      await fetchConversationWith(admin._id);
    } catch (err) {
      console.error('Failed to get admins', err);
      toast.error('Failed to contact admins');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await api.put(`/messages/${messageId}/read`);
    } catch (err) {
      console.error('Failed to mark message as read', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Please log in to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
          <p className="text-gray-400">Connect with other riders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className={`lg:col-span-1 ${selectedConversation ? 'hidden lg:block' : ''}`}>
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Conversations</CardTitle>
                <CardDescription>Your message threads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                  {conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-gray-400">Start a conversation by visiting a rider's profile!</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.user._id}
                      onClick={async () => {
                        // Update URL to allow navigation between conversations
                        setSearchParams({ user: conversation.user._id });
                        // Mark unread messages as read
                        conversation.messages.forEach(msg => {
                          if (!msg.isRead && msg.receiverId._id === currentUser._id) {
                            markAsRead(msg._id);
                          }
                        });
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation?.user._id === conversation.user._id
                          ? 'bg-orange-500/20 border border-orange-500'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{conversation.user.name}</h4>
                          <p className="text-gray-400 text-sm truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message Thread */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <Card className="bg-slate-800 border-slate-700 h-[600px] flex flex-col">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setSearchParams({});
                        setSelectedConversation(null);
                      }}
                      className="lg:hidden p-2 hover:bg-slate-700 rounded-lg"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    {selectedConversation.user.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedConversation.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.senderId._id === currentUser!._id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId._id === currentUser!._id
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-700 text-gray-200'
                            }`}>
                            {/* If message is deleted and current user is sender show placeholder */}
                            {message.isDeleted && message.senderId._id === currentUser!._id ? (
                              <p className="text-sm text-gray-300 italic">You unsent this message</p>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                            <p className={`text-xs mt-1 ${
                              message.senderId._id === currentUser!._id ? 'text-orange-100' : 'text-gray-400'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>

                            {/* Unsend button for sender and only if within allowed state */}
                            {message.senderId._id === currentUser!._id && !message.isDeleted && (
                              <button
                                onClick={() => openUnsendModal(message._id)}
                                className="absolute -top-2 -right-8 text-xs text-gray-400 hover:text-red-400"
                                title="Unsend message"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-slate-700 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1 bg-slate-700 border border-slate-500 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700 h-[600px] flex flex-col items-center justify-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-gray-400">Choose a message thread to start chatting</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Unsend Confirmation Modal */}
      <Dialog open={unsendModalOpen} onOpenChange={setUnsendModalOpen}>
        <DialogContent className="bg-slate-800 border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Unsend Message?</DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. The message will be removed for everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={closeUnsendModal}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnsendConfirmed}
              className="bg-red-600 hover:bg-red-700"
            >
              Unsend
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesPage;
