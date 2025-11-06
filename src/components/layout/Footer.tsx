import { Link } from 'react-router-dom';
import { Bike, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-2 rounded-lg">
                <Bike className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Moto Connect
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Connecting motorcycle enthusiasts worldwide. Join our community for epic rides, safety tips, and unforgettable adventures.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Safety Guidelines
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Ride Rules
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Member Benefits
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Forum
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-orange-500 transition-colors text-sm">
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Get in Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <Mail className="h-4 w-4 text-orange-500" />
                <span>motoconnect1789.com</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <Phone className="h-4 w-4 text-orange-500" />
                <span>+91 8618496592</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400 text-sm">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>MANGLORE,PUTTUR</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 Moto Connect. All rights reserved. Ride safe, ride together.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;