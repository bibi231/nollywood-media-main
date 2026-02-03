import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, Home } from 'lucide-react';

export default function Careers() {
  const openings = [
    {
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      location: 'Lagos, Nigeria / Remote',
      type: 'Full-time',
      description: 'Build and scale our streaming platform with React, Node.js, and modern web technologies.',
    },
    {
      title: 'Content Acquisition Manager',
      department: 'Content',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Source and acquire quality African content for our growing platform.',
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Design beautiful, intuitive experiences for creators and viewers.',
    },
    {
      title: 'Community Manager',
      department: 'Community',
      location: 'Lagos, Nigeria / Remote',
      type: 'Full-time',
      description: 'Build and nurture our creator and viewer communities.',
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Lagos, Nigeria',
      type: 'Full-time',
      description: 'Drive growth and brand awareness across African markets.',
    },
    {
      title: 'Data Analyst',
      department: 'Analytics',
      location: 'Remote',
      type: 'Full-time',
      description: 'Analyze user behavior and content performance to drive insights.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-end mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Help us build the future of African entertainment
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Why Work at NaijaMation?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Make an Impact
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Help creators reach millions and build sustainable careers
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💡</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Innovation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Work with cutting-edge technology and solve unique challenges
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🌍</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Global Reach
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Connect African stories with audiences worldwide
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚖️</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Work-Life Balance
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Flexible hours, remote options, and competitive benefits
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Open Positions
          </h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <button className="mt-4 md:mt-0 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                    Apply Now
                  </button>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Don't See a Perfect Fit?
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <a
            href="mailto:careers@naijamation.com"
            className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Send Resume
          </a>
        </div>
      </div>
    </div>
  );
}
