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
    <footer className="bg-black text-gray-400 border-t border-white/5 mt-auto relative overflow-hidden">
      {/* Decorative Brand Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 sm:gap-8">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6 group">
              <Film className="w-8 h-8 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)] group-hover:scale-110 transition-transform duration-300" />
              <span className="text-2xl font-black text-white tracking-tighter uppercase italic">
                Naija<span className="text-red-600">Mation</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-xs">
              The premium destination for cinematic African storytelling. Experience the next era of Nollywood.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-900 border border-white/5 rounded-xl hover:bg-gray-800 hover:border-red-600/50 hover:scale-110 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-gray-400" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-black mb-6 text-xs uppercase tracking-[0.2em]">
                {category}
              </h3>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-gray-500 hover:text-red-500 hover:translate-x-1 inline-flex items-center transition-all duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 py-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <p className="text-xs text-gray-600 font-medium">
                © {currentYear} NAIJAMATION MEDIA. ALL RIGHTS RESERVED.
              </p>
              <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-bold">
                <Globe className="w-3 h-3 text-red-600" />
                <span>Global Edition</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 text-[10px] font-black uppercase tracking-[0.1em] text-gray-600">
              {['Terms', 'Privacy', 'Cookies', 'Help'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase() === 'help' ? 'help' : item.toLowerCase()}`}
                  className="hover:text-red-500 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border-t border-white/5 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <p className="flex items-center gap-2 italic">
              Built with precision for the <span className="text-red-600/80">Creator Economy</span>
            </p>
            <div className="flex items-center gap-6">
              <Link
                to={isAdminPortal ? "/" : "/admin/login"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${isAdminPortal
                  ? 'border-white/10 hover:bg-white/5 text-gray-500'
                  : 'border-red-600/50 hover:bg-red-600/10 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.1)]'
                  }`}
              >
                {isAdminPortal ? "Main Site" : "Admin Portal"}
              </Link>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-red-600" />
                <a href="mailto:contact@naijamation.com" className="hover:text-white transition-colors">
                  contact@naijamation.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
