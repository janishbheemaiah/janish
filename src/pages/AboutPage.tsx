import { useState, useEffect } from 'react';
import { Users, Target, Heart, Award, Star, Bike, Shield, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const AboutPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await api.get('/teams');
        setTeamMembers(response.data);
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        // Fallback to default if API fails
        setTeamMembers([
          {
            name: "Janish",
            role: "Founder & Lead Rider",
            bio: "Passionate motorcycle enthusiast with extensive riding experience. Founded Moto Connect to bring riders together safely.",
            imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
            specialization: "Long-distance touring"
          },
          {
            name: "Bhuvan",
            role: "Safety Coordinator",
            bio: "Certified motorcycle safety instructor and emergency response specialist. Ensures every ride prioritizes safety.",
            imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face",
            specialization: "Safety training"
          },
          {
            name: "Adarsh",
            role: "Route Planner",
            bio: "Expert in scenic route planning and motorcycle mechanics. Creates unforgettable riding experiences.",
            imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
            specialization: "Route design"
          },
          {
            name: "Chaithanya",
            role: "Community Manager",
            bio: "Builds and nurtures our riding community. Organizes events and connects riders with similar interests.",
            imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
            specialization: "Community building"
          }
        ]);
      }
    };
    fetchTeamMembers();
  }, []);

  const partners = [
    {
      name: "Harley-Davidson",
      type: "Official Partner",
      description: "Providing technical support and expertise"
    },
    {
      name: "Kawasaki",
      type: "Sponsor",
      description: "Supporting our safety training programs"
    },
    {
      name: "Yamaha",
      type: "Partner",
      description: "Event sponsorship and rider gear"
    },
    {
      name: "Local Bike Shops",
      type: "Network",
      description: "Maintenance and repair support"
    }
  ];

  const achievements = [
    {
      icon: Users,
      title: "5,000+ Riders",
      description: "Active community members worldwide"
    },
    {
      icon: Calendar,
      title: "500+ Events",
      description: "Successful rides and gatherings organized"
    },
    {
      icon: Shield,
      title: "Zero Accidents",
      description: "Perfect safety record in organized rides"
    },
    {
      icon: Award,
      title: "Best Community",
      description: "Motorcycle Community of the Year 2024"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1920&h=1080&fit=crop" 
            alt="Motorcycle riders"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-6">
            About Moto Connect
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            More than just a platform - we're a family of riders united by passion, safety, and the open road
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-lg leading-relaxed">
                  To create a safe, inclusive, and vibrant community where motorcycle enthusiasts of all levels can 
                  connect, learn, and experience the freedom of the open road together. We believe that riding is 
                  better when shared with others who understand the passion.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-lg leading-relaxed">
                  To become the world's leading platform for motorcycle community building, where every rider - 
                  from weekend warriors to seasoned veterans - finds their tribe, improves their skills, and 
                  creates lasting memories on two wheels.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-gray-400 text-lg">The principles that guide everything we do</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700 text-center hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Safety First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Every ride begins and ends with safety. We provide training, support, and create an environment 
                  where responsible riding is celebrated and encouraged.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 text-center hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  We believe in the power of connection. Our community is built on mutual respect, shared passion, 
                  and the understanding that we're stronger together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700 text-center hover:transform hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bike className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-white">Adventure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Life is an adventure, and every mile is a story waiting to be told. We create opportunities 
                  for epic journeys and unforgettable experiences.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Meet Our Team</h2>
            <p className="text-gray-400 text-lg">Passionate riders dedicated to building the best community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600 text-center hover:transform hover:scale-105 transition-all duration-300">
                <CardHeader>
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gradient-to-r from-orange-500 to-red-600">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-white">{member.name}</CardTitle>
                  <CardDescription className="text-orange-500 font-semibold">{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-3">{member.bio}</p>
                  <Badge variant="outline" className="border-orange-500 text-orange-500">
                    {member.specialization}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Achievements</h2>
            <p className="text-gray-400 text-lg">Milestones that make us proud</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 text-center hover:bg-slate-700 transition-colors">
                <CardHeader>
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <achievement.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">{achievement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Partners</h2>
            <p className="text-gray-400 text-lg">Trusted brands that support our community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partners.map((partner, index) => (
              <Card key={index} className="bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-colors">
                <CardHeader>
                  <CardTitle className="text-white">{partner.name}</CardTitle>
                  <Badge className="w-fit bg-orange-500">{partner.type}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">{partner.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Our Story</h2>
            <p className="text-gray-400 text-lg">How Moto Connect came to life</p>
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Moto Connect was born from a simple idea: motorcycle riding is better when shared. Our founders, Janish, Bhuvan, Adarsh, and Chaithanya,
                discovered this truth during a group ride in 2025. While the individual journeys were fulfilling, the most
                memorable moments happened when connecting with fellow riders at rest stops and sharing stories along the way.
              </p>

              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Returning from their ride, the team realized that many riders struggled to find like-minded community members who shared
                their passion for safe, responsible riding. Traditional motorcycle clubs often had barriers to entry or
                focused on specific bike brands. There was a need for an inclusive platform that welcomed all riders,
                regardless of their experience level or bike preference.
              </p>

              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                In 2025, Janish, Bhuvan, Adarsh, and Chaithanya partnered to create something
                different. Together, they envisioned a platform that would prioritize safety education, foster genuine
                connections, and organize rides that showcase the beauty of motorcycle culture.
              </p>

              <p className="text-gray-300 text-lg leading-relaxed">
                Today, Moto Connect has grown into a thriving community of thousands of riders who share our core values
                of safety, friendship, and adventure. Every ride we organize, every safety workshop we host, and every
                connection we facilitate brings us closer to our vision of creating the world's most welcoming motorcycle community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Join Our Community?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Experience the joy of riding with fellow enthusiasts who share your passion for the open road
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/login" className="inline-block">
              <button className="bg-white text-orange-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transform hover:scale-105 transition-all duration-200">
                Join Moto Connect
              </button>
            </a>
            <a href="/contact" className="inline-block">
              <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold py-3 px-8 rounded-lg text-lg transform hover:scale-105 transition-all duration-200">
                Get in Touch
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;