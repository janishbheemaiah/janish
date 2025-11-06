import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, MapPin, Users, Clock, Filter, Plus, Search, Download, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import api from '@/lib/api';

const registrationSchema = z.object({
  eventId: z.string(),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone number required'),
  licenseNumber: z.string().min(5, 'License number required'),
  bloodGroup: z.string().min(1, 'Blood group required'),
  bikeModel: z.string().min(2, 'Bike model required'),
  emergencyContact: z.string().min(10, 'Emergency contact required'),
  notes: z.string().optional(),
});

const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(5, 'Location is required'),
  difficulty: z.string().min(1, 'Difficulty level required'),
  maxParticipants: z.number().min(1, 'Max participants must be at least 1'),
  meetingPoint: z.string().min(5, 'Meeting point required'),
  route: z.string().min(10, 'Route description required'),
  requirements: z.string().optional(),
  achievementPoints: z.number().min(0).optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;
type EventFormData = z.infer<typeof eventSchema>;

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  maxParticipants: number;
  registeredCount: number;
  meetingPoint: string;
  route: string;
  requirements?: string;
  image: string;
  photos: any[];
  organizer: any;
  achievementPoints?: number;
}

interface Registration {
  _id: string;
  eventId: any;
  userId: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  bloodGroup: string;
  bikeModel: string;
  emergencyContact: string;
  notes?: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const EventsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const eventForm = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    loadEvents();
    if (user) {
      loadRegistrations();
    }
  }, [user]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filterDifficulty, filterDate]);

  const loadEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) {
      toast.error('Failed to load events');
    }
  };

  const loadRegistrations = async () => {
    try {
      const res = await api.get(`/registrations/user/${user?._id}`);
      setRegistrations(res.data);
    } catch (err) {
      toast.error('Failed to load registrations');
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(event => event.difficulty === filterDifficulty);
    }

    if (filterDate !== 'all') {
      const now = new Date();
      if (filterDate === 'upcoming') {
        filtered = filtered.filter(event => new Date(event.date) >= now);
      } else if (filterDate === 'this-month') {
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getMonth() === thisMonth && eventDate.getFullYear() === thisYear;
        });
      }
    }

    setFilteredEvents(filtered);
  };

  const handleEventRegistration = async (data: RegistrationFormData) => {
    if (!user) {
      toast.error('Please login to register for events');
      return;
    }

    setIsRegistering(true);
    try {
      await api.post('/registrations', {
        eventId: data.eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        licenseNumber: data.licenseNumber,
        bloodGroup: data.bloodGroup,
        bikeModel: data.bikeModel,
        emergencyContact: data.emergencyContact,
        notes: data.notes
      });

      toast.success('Registration submitted successfully!');
      setSelectedEvent(null);
      registrationForm.reset();
      loadRegistrations(); // Reload to update state
      loadEvents(); // Reload to update counts
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCreateEvent = async (data: EventFormData) => {
    if (!user?.isAdmin) {
      toast.error('Only admins can create events');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('date', new Date(data.date).toISOString());
      formData.append('time', data.time);
      formData.append('location', data.location);
      formData.append('difficulty', data.difficulty);
      formData.append('maxParticipants', data.maxParticipants.toString());
      formData.append('meetingPoint', data.meetingPoint);
      formData.append('route', data.route);
      // Achievement points for completing this event
      if (typeof data.achievementPoints !== 'undefined') {
        formData.append('achievementPoints', data.achievementPoints.toString());
      }
      if (data.requirements) formData.append('requirements', data.requirements);

      // Append photos
      selectedPhotos.forEach((photo, index) => {
        formData.append('photos', photo);
      });

      await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Event created successfully!');
      setShowCreateEvent(false);
      eventForm.reset();
      setSelectedPhotos([]);
      loadEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event. Please try again.');
    }
  };

  const exportRegistrations = async (eventId: string) => {
    try {
      const res = await api.get(`/registrations?eventId=${eventId}`);
      const eventRegistrations = res.data;
      const event = events.find(e => e._id === eventId);
      
      if (eventRegistrations.length === 0) {
        toast.error('No registrations found for this event');
        return;
      }

      const csvContent = [
        ['Name', 'Email', 'Phone', 'License Number', 'Blood Group', 'Bike Model', 'Emergency Contact', 'Status', 'Registered At'],
        ...eventRegistrations.map((reg: any) => [
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
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event?.title}_registrations.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Registration data exported successfully!');
    } catch (err) {
      toast.error('Failed to export registrations');
    }
  };

  const isUserRegistered = (eventId: string) => {
    return user && registrations.some(reg => reg.eventId && reg.eventId._id === eventId && reg.userId === user._id);
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
            Motorcycle Events & Rides
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Join organized rides, connect with fellow riders, and experience epic adventures
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            {user?.isAdmin && (
              <Dialog open={showCreateEvent} onOpenChange={setShowCreateEvent}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Event</DialogTitle>
                    <DialogDescription>
                      Fill in the details for your new motorcycle event
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={eventForm.handleSubmit(handleCreateEvent)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Event Title</Label>
                        <Input
                          placeholder="Adventure Ride"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('title')}
                        />
                        {eventForm.formState.errors.title && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.title.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Location</Label>
                        <Input
                          placeholder="City, State"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('location')}
                        />
                        {eventForm.formState.errors.location && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.location.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Description</Label>
                      <Textarea
                        placeholder="Describe your event..."
                        className="bg-slate-700 border-slate-600 text-white"
                        {...eventForm.register('description')}
                      />
                      {eventForm.formState.errors.description && (
                        <p className="text-red-400 text-sm">{eventForm.formState.errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Date</Label>
                        <Input
                          type="date"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('date')}
                        />
                        {eventForm.formState.errors.date && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.date.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Time</Label>
                        <Input
                          type="time"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('time')}
                        />
                        {eventForm.formState.errors.time && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.time.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-white">Difficulty</Label>
                        <Select onValueChange={(value) => eventForm.setValue('difficulty', value)}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        {eventForm.formState.errors.difficulty && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.difficulty.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Max Participants</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="30"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('maxParticipants', { valueAsNumber: true })}
                        />
                        {eventForm.formState.errors.maxParticipants && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.maxParticipants.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Achievement Points</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('achievementPoints', { valueAsNumber: true })}
                        />
                        {eventForm.formState.errors.achievementPoints && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.achievementPoints.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Meeting Point</Label>
                        <Input
                          placeholder="Parking lot address"
                          className="bg-slate-700 border-slate-600 text-white"
                          {...eventForm.register('meetingPoint')}
                        />
                        {eventForm.formState.errors.meetingPoint && (
                          <p className="text-red-400 text-sm">{eventForm.formState.errors.meetingPoint.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Route Description</Label>
                      <Textarea
                        placeholder="Start → Stop 1 → Stop 2 → End (distance)"
                        className="bg-slate-700 border-slate-600 text-white"
                        {...eventForm.register('route')}
                      />
                      {eventForm.formState.errors.route && (
                        <p className="text-red-400 text-sm">{eventForm.formState.errors.route.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Requirements (Optional)</Label>
                      <Textarea
                        placeholder="License requirements, gear, bike specs..."
                        className="bg-slate-700 border-slate-600 text-white"
                        {...eventForm.register('requirements')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Event Photos (Optional)</Label>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedPhotos(files);
                        }}
                        className="bg-slate-700 border-slate-600 text-white file:bg-orange-500 file:text-white file:border-none file:rounded file:px-3 file:py-1 file:mr-3"
                      />
                      {selectedPhotos.length > 0 && (
                        <p className="text-sm text-gray-400">{selectedPhotos.length} photo(s) selected</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                      Create Event
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <Card key={event._id} className="bg-slate-800 border-slate-700 overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group">
              <div className="relative">
                <img
                  src={event.photos && event.photos.length > 0 ? `http://localhost:5000/${event.photos[0].path}` : event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <Badge className={`${
                    event.difficulty === 'Beginner' ? 'bg-green-500' :
                    event.difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {event.difficulty}
                  </Badge>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-slate-900/80 text-white">
                    {event.registeredCount}/{event.maxParticipants} riders
                  </Badge>
                </div>
              </div>
              
              <CardHeader>
                <CardTitle className="text-white">{event.title}</CardTitle>
                <CardDescription className="text-gray-400">{event.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3 text-sm text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-orange-500" />
                    Organized by {event.organizer?.name || event.organizer || 'Unknown'}
                  </div>
                  {event.achievementPoints !== undefined && event.achievementPoints > 0 && (
                    <div className="mt-2">
                      <Badge className="bg-indigo-500 text-white">+{event.achievementPoints} pts</Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {isUserRegistered(event._id) ? (
                    <Badge className="bg-green-500 text-white">Registered</Badge>
                  ) : event.registeredCount >= event.maxParticipants ? (
                    <Badge variant="destructive">Full</Badge>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                          onClick={() => {
                            setSelectedEvent(event);
                            registrationForm.setValue('eventId', event._id);
                            if (user) {
                              registrationForm.setValue('name', user.name);
                              registrationForm.setValue('email', user.email);
                              registrationForm.setValue('phone', user.phone || '');
                              registrationForm.setValue('licenseNumber', user.licenseNumber || '');
                              registrationForm.setValue('bloodGroup', user.bloodGroup || '');
                              registrationForm.setValue('bikeModel', user.bikeModel || '');
                            }
                          }}
                        >
                          Register Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-white">Register for {selectedEvent?.title}</DialogTitle>
                          <DialogDescription>
                            Please fill in your details to register for this event
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedEvent && (
                          <div className="bg-slate-700 p-4 rounded-lg mb-4">
                            <h4 className="text-white font-semibold mb-2">Event Details</h4>
                            <div className="space-y-1 text-sm text-gray-400">
                              <p><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()} at {selectedEvent.time}</p>
                              <p><strong>Meeting Point:</strong> {selectedEvent.meetingPoint}</p>
                              <p><strong>Route:</strong> {selectedEvent.route}</p>
                              {selectedEvent.requirements && (
                                <p><strong>Requirements:</strong> {selectedEvent.requirements}</p>
                              )}
                              <p><strong>Achievement Points:</strong> {selectedEvent.achievementPoints ?? 0}</p>
                              <p><strong>Organizer:</strong> {selectedEvent.organizer.name || selectedEvent.organizer}</p>
                            </div>
                          </div>
                        )}
                        
                        <form onSubmit={registrationForm.handleSubmit(handleEventRegistration)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Full Name</Label>
                              <Input
                                placeholder="John Doe"
                                className="bg-slate-700 border-slate-600 text-white"
                                {...registrationForm.register('name')}
                              />
                              {registrationForm.formState.errors.name && (
                                <p className="text-red-400 text-sm">{registrationForm.formState.errors.name.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-white">Email</Label>
                              <Input
                                type="email"
                                placeholder="john@example.com"
                                className="bg-slate-700 border-slate-600 text-white"
                                {...registrationForm.register('email')}
                              />
                              {registrationForm.formState.errors.email && (
                                <p className="text-red-400 text-sm">{registrationForm.formState.errors.email.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Phone Number</Label>
                              <Input
                                placeholder="+1 234 567 8900"
                                className="bg-slate-700 border-slate-600 text-white"
                                {...registrationForm.register('phone')}
                              />
                              {registrationForm.formState.errors.phone && (
                                <p className="text-red-400 text-sm">{registrationForm.formState.errors.phone.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-white">License Number</Label>
                              <Input
                                placeholder="DL1234567890"
                                className="bg-slate-700 border-slate-600 text-white"
                                {...registrationForm.register('licenseNumber')}
                              />
                              {registrationForm.formState.errors.licenseNumber && (
                                <p className="text-red-400 text-sm">{registrationForm.formState.errors.licenseNumber.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white">Blood Group</Label>
                              <Select onValueChange={(value) => registrationForm.setValue('bloodGroup', value)}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                  <SelectValue placeholder="Select blood group" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-700 border-slate-600">
                                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {registrationForm.formState.errors.bloodGroup && (
                                <p className="text-red-400 text-sm">{registrationForm.formState.errors.bloodGroup.message}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-white">Bike Model</Label>
                              <Input
                                placeholder="Harley Davidson Street 750"
                                className="bg-slate-700 border-slate-600 text-white"
                                {...registrationForm.register('bikeModel')}
                              />
                              {registrationForm.formState.errors.bikeModel && (
                                <p className="text-red-400 text-sm">{registrationForm.formState.errors.bikeModel.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Emergency Contact</Label>
                            <Input
                              placeholder="Emergency contact phone number"
                              className="bg-slate-700 border-slate-600 text-white"
                              {...registrationForm.register('emergencyContact')}
                            />
                            {registrationForm.formState.errors.emergencyContact && (
                              <p className="text-red-400 text-sm">{registrationForm.formState.errors.emergencyContact.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white">Additional Notes (Optional)</Label>
                            <Textarea
                              placeholder="Any special requirements or notes..."
                              className="bg-slate-700 border-slate-600 text-white"
                              {...registrationForm.register('notes')}
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                            disabled={isRegistering}
                          >
                            {isRegistering ? 'Registering...' : 'Submit Registration'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {user?.isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportRegistrations(event._id)}
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;