import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactForm = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const handleSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);

    try {
      const response = await api.post('/contact', data);

      toast.success('Message sent successfully! We\'ll get back to you soon.');
      contactForm.reset();
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      content: "motoconnect1789@gmail.com",
      description: "Send us an email anytime",
      link: "mailto:motoconnect1789@gmail.com"
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+91 8618496592",
      description: "Mon-Fri, 9AM-6PM IST",
      link: "tel:+918618496592"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      content: "Manglore, puttur, Neharu nagar, karnataka, 574203",
      description: "Drop by our office",
      link: "https://maps.google.com"
    },
    {
      icon: Clock,
      title: "Support Hours",
      content: "24/7 Emergency Support",
      description: "For ride emergencies",
      link: "tel:+918618496592"
    }
  ];

  const faqItems = [
    {
      question: "How do I join a ride?",
      answer: "Browse our Events page, find a ride that interests you, and click 'Register Now'. You'll need to create an account and fill out a registration form with your riding details and emergency contact information."
    },
    {
      question: "What are the safety requirements?",
      answer: "All riders must have a valid motorcycle license, appropriate safety gear (helmet, jacket, gloves, boots), and their motorcycle must be in good working condition. We conduct safety briefings before every ride."
    },
    {
      question: "Can beginners join your rides?",
      answer: "Absolutely! We have rides for all skill levels, including beginner-friendly routes. Look for rides marked as 'Beginner' difficulty level, and consider joining our safety workshops first."
    },
    {
      question: "What if I need to cancel my registration?",
      answer: "You can cancel your registration up to 24 hours before the ride by contacting us. For same-day cancellations, please call our emergency support line."
    },
    {
      question: "Do you provide motorcycle insurance?",
      answer: "No, all riders must have their own valid motorcycle insurance. We recommend checking with your insurance provider about coverage for group rides and events."
    },
    {
      question: "How do I become a ride leader?",
      answer: "Ride leaders must have extensive riding experience, complete our leadership training program, and demonstrate strong safety knowledge. Contact us if you're interested in this role."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
            Get in Touch
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions, suggestions, or need support? We're here to help you make the most of your Moto Connect experience.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
              <CardHeader className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <info.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">{info.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a 
                  href={info.link}
                  className="text-orange-500 hover:text-orange-400 font-semibold block mb-2"
                >
                  {info.content}
                </a>
                <p className="text-gray-400 text-sm">{info.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageCircle className="h-6 w-6 mr-2 text-orange-500" />
                Send us a Message
              </CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={contactForm.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your full name"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                      {...contactForm.register('name')}
                    />
                    {contactForm.formState.errors.name && (
                      <p className="text-red-400 text-sm">{contactForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                      {...contactForm.register('email')}
                    />
                    {contactForm.formState.errors.email && (
                      <p className="text-red-400 text-sm">{contactForm.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="Your phone number"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                      {...contactForm.register('phone')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Category *</Label>
                    <Select onValueChange={(value) => contactForm.setValue('category', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="events">Event Question</SelectItem>
                        <SelectItem value="safety">Safety Concern</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    {contactForm.formState.errors.category && (
                      <p className="text-red-400 text-sm">{contactForm.formState.errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your inquiry"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                    {...contactForm.register('subject')}
                  />
                  {contactForm.formState.errors.subject && (
                    <p className="text-red-400 text-sm">{contactForm.formState.errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400"
                    {...contactForm.register('message')}
                  />
                  {contactForm.formState.errors.message && (
                    <p className="text-red-400 text-sm">{contactForm.formState.errors.message.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Quick answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {faqItems.map((faq, index) => (
                  <div key={index} className="border-b border-slate-700 pb-4 last:border-b-0 last:pb-0">
                    <h4 className="text-white font-semibold mb-2">{faq.question}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-red-900/20 border-red-700">
              <CardHeader>
                <CardTitle className="text-red-400">Emergency Support</CardTitle>
                <CardDescription className="text-red-300">
                  For ride emergencies or urgent safety concerns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-red-400">
                    <Phone className="h-5 w-5 mr-3" />
                    <span className="font-semibold">24/7 Emergency Line: +91 8618496592</span>
                  </div>
                  <p className="text-red-300 text-sm">
                    Call this number if you're on a ride and need immediate assistance, have a breakdown, 
                    or encounter any safety emergency. Our support team is available around the clock.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Connect With Us</CardTitle>
                <CardDescription>
                  Follow us on social media for updates and community highlights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <a 
                    href="#" 
                    className="flex items-center justify-center p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">Facebook</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center justify-center p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">Instagram</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center justify-center p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">Twitter</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center justify-center p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    <span className="text-white font-medium">YouTube</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Location/Office Hours */}
        <div className="mt-12">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Office Location & Hours</CardTitle>
              <CardDescription>
                Visit us in person or know when to reach us
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-white font-semibold mb-3">Office Address</h4>
                  <div className="space-y-2 text-gray-400">
                    <p>Moto Connect Headquarters</p>
                    <p>Manglore, puttur</p>
                    <p>Neharu nagar, karnataka, 574203</p>
                    <p>India</p>
                  </div>
                  <a 
                    href="https://maps.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-orange-500 hover:text-orange-400 font-medium"
                  >
                    Get Directions →
                  </a>
                </div>
                
                <div>
                  <h4 className="text-white font-semibold mb-3">Business Hours</h4>
                  <div className="space-y-2 text-gray-400">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span>9:00 AM - 6:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday:</span>
                      <span>10:00 AM - 4:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday:</span>
                      <span>Closed</span>
                    </div>
                    <div className="flex justify-between text-orange-500">
                      <span>Emergency Support:</span>
                      <span>24/7</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;