import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Users, Shield, Camera, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HomePage = () => {
  const featuredRides = [
    {
      id: 1,
      title: "Coastal Highway Adventure",
      date: "Nov 15, 2025",
      location: "kerala,waynad",
      participants: 24,
      difficulty: "Intermediate",
      image: "	https://i.pinimg.com/736x/bf/73/57/bf73573b36f6f799f1d0e2ad5374e57c.jpg",
      description: "Experience breathtaking ocean views on this scenic coastal ride."
    },
    {
      id: 2,
      title: "Mountain Trail Expedition",
      date: "Oct 20, 2025",
      location: "Rocky Mountains",
      participants: 18,
      difficulty: "Advanced",
      image: "https://www.overlandescape.com/storage/packages/61812127ce72d159_motorbike_tour.jpg",
      description: "Challenge yourself with winding mountain roads and stunning vistas."
    },
    {
      id: 3,
      title: "City Night Cruise",
      date: "Dec 22, 2025",
      location: "Downtown Metro",
      participants: 32,
      difficulty: "Beginner",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq-38TAF1yxbU2GuIkUC69Q2mJD7Ac3On13A&s",
      description: "Explore the city lights in this relaxed evening ride."
    }
  ];

  const upcomingEvents = [
    {
      title: "manglore Moto Fest",
      date: "Jan 15, 2026",
      type: "Festival"
    },
    {
      title: "Safety Workshop",
      date: "Dec 30, 2024",
      type: "Education"
    },
    {
      title: "Charity Ride",
      date: "march 5, 2025",
      type: "Community"
    }
  ];

  const testimonials = [
    {
      name: "ADARSH",
      text: "Moto Connect has transformed my riding experience. The community is amazing!",
      rating: 5,
      location: "PUTTUR"
    },
    {
      name: "JANISH BHEEMAIAH",
      text: "Found my riding crew through this platform. Safety first, fun always!",
      rating: 5,
      location: "MADIKERI,KODAGU"
    },
    {
      name: "BHUVAN KUMAR",
      text: "Professional organization and unforgettable adventures. Highly recommended!",
      rating: 5,
      location: "HAASAN"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1920&h=1080&fit=crop)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
        
        {/* Animated Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-orange-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-red-500 rounded-full opacity-10 blur-3xl animate-pulse" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent animate-in slide-in-from-bottom duration-1000">
            Moto Connect
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-in slide-in-from-bottom duration-1000 delay-200">
            The Ultimate Platform for Motorcycle Enthusiasts
          </p>
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto animate-in slide-in-from-bottom duration-1000 delay-300">
            Join thousands of riders worldwide. Discover epic routes, connect with fellow enthusiasts, 
            and experience the freedom of the open road with safety and community at our core.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-1000 delay-500">
            <Link to="/events">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 text-lg px-8 py-3">
                Join a Ride
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transform hover:scale-105 transition-all duration-200 text-lg px-8 py-3">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-orange-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-orange-500 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Moto Connect?</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Experience the perfect blend of adventure, safety, and community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-all duration-300 group cursor-pointer">
              <CardHeader className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Community First</CardTitle>
                <CardDescription>
                  Connect with passionate riders who share your love for the open road
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-all duration-300 group cursor-pointer">
              <CardHeader className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Safety Priority</CardTitle>
                <CardDescription>
                  Professional ride leaders, safety briefings, and emergency support on every ride
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-all duration-300 group cursor-pointer">
              <CardHeader className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Epic Adventures</CardTitle>
                <CardDescription>
                  Carefully curated routes and events for riders of all skill levels
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Rides Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Featured Rides</h2>
            <p className="text-gray-400 text-lg">Join our most popular upcoming adventures</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredRides.map((ride) => (
              <Card key={ride.id} className="bg-slate-800 border-slate-700 overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group">
                <div className="relative">
                  <img 
                    src={ride.image} 
                    alt={ride.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4">
                    <Badge className={`${
                      ride.difficulty === 'Beginner' ? 'bg-green-500' :
                      ride.difficulty === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {ride.difficulty}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-white">{ride.title}</CardTitle>
                  <CardDescription>{ride.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                      {ride.date}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                      {ride.location}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-orange-500" />
                      {ride.participants} riders registered
                    </div>
                  </div>
                  
                  <Link to="/events" className="block mt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                      Register Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/events">
              <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                View All Events
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events & Announcements */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Upcoming Events */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-8">Upcoming Events</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <Card key={index} className="bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-semibold">{event.title}</h4>
                          <div className="flex items-center text-gray-400 text-sm mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {event.date}
                          </div>
                        </div>
                        <Badge variant="outline" className="border-orange-500 text-orange-500">
                          {event.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Community Benefits */}
            <div>
              <h3 className="text-3xl font-bold text-white mb-8">Community Benefits</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Safety Training</h4>
                    <p className="text-gray-400 text-sm">Regular workshops on defensive riding and motorcycle maintenance</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Mentorship Program</h4>
                    <p className="text-gray-400 text-sm">Experienced riders guide newcomers through their journey</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Photo Contests</h4>
                    <p className="text-gray-400 text-sm">Monthly photography competitions with exciting prizes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">What Riders Say</h2>
            <p className="text-gray-400 text-lg">Hear from our amazing community members</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-gray-400 text-sm">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of riders who have discovered their passion through Moto Connect
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 text-lg px-8 py-3">
                Register Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/events">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 transform hover:scale-105 transition-all duration-200 text-lg px-8 py-3">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;