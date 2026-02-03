import { Link, useLocation } from 'react-router-dom';
import { Film, Mail, Facebook, Twitter, Instagram, Youtube, Globe } from 'lucide-react';

export function Footer() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
      { label: 'Blog', path: '/blog' },
    ],
    Support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Admin Login', path: '/admin/login' },
    ],
    Content: [
      { label: 'Movies', path: '/content/film' },
      { label: 'Series', path: '/content/series' },
      { label: 'Anime', path: '/content/anime' },
      { label: 'Music', path: '/content/music' },
    ],
    Community: [
      { label: 'Forums', path: '/forums' },
      { label: 'Contributors', path: '/contributors' },
      { label: 'Partner With Us', path: '/partners' },
      { label: 'Advertise', path: '/advertise' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', url: 'https://facebook.com' },
    { icon: Twitter, label: 'Twitter', url: 'https://twitter.com' },
    { icon: Instagram, label: 'Instagram', url: 'https://instagram.com' },
    { icon: Youtube, label: 'YouTube', url: 'https://youtube.com' },
  ];

  // Special admin/normal site link logic
  const isAdminPortal = location.pathname.startsWith('/admin');

  return (
    <footer className="bg-gray-100 text-gray-700 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <Film className="w-8 h-8 text-red-600 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-xl font-bold text-gray-900">NaijaMation</span>
            </Link>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Your premier destination for authentic Nigerian cinema and African storytelling.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-red-600 hover:scale-110 transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-gray-700" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-600 hover:text-red-600 hover:translate-x-1 inline-block transition-all duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                © {currentYear} NaijaMation. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <span>English (US)</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/terms"
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/cookies"
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Cookies
              </Link>
              <Link
                to="/help"
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-600">
            <p>Powered by modern web technologies • Built with passion in Africa</p>
            <div className="flex items-center gap-4">
              {isAdminPortal ? (
                <Link
                  to="/"
                  className="text-xs text-red-600 font-semibold hover:underline border border-red-600 rounded px-2 py-1 bg-white transition-colors"
                >
                  ← Back to Main Site
                </Link>
              ) : (
                <Link
                  to="/admin/login"
                  className="text-xs text-red-600 font-semibold hover:underline border border-red-600 rounded px-2 py-1 bg-white transition-colors"
                >
                  Admin Portal
                </Link>
              )}
              <Mail className="w-3 h-3" />
              <a href="mailto:hello@naijamation.com" className="hover:text-red-600 transition-colors">
                hello@naijamation.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
