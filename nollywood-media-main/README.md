# NaijaMation - Nollywood Streaming Platform

A modern, full-featured streaming platform for Nollywood films with comprehensive admin CMS, user authentication, and content management.

## Features

### Frontend Features
- Browse catalog of Nollywood films with beautiful card layouts
- Search and filter by genre, region, year, and language
- Responsive video player with MP4 support
- User authentication with email/password
- Personal watchlist and watch progress tracking
- Continue watching functionality
- Genre-specific pages and content organization

### Admin CMS Features
- Complete film catalog management (Create, Read, Update, Delete)
- User management with role-based access control
- Analytics dashboard with key metrics
- Protected admin routes accessible only to admin users
- Bulk content management capabilities
- Real-time content updates

### Authentication System
- Sign up and sign in from any page via modal
- Session management with automatic refresh
- Role-based access control (user, admin, super_admin)
- Password reset functionality
- Secure RLS policies in database

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Routing**: React Router DOM v7
- **Backend**: Supabase (PostgreSQL + Auth)
- **Video Player**: Custom MP4 player with HLS.js support
- **Icons**: Lucide React
- **Build Tool**: Vite

## Database Schema

### Tables
- **films**: Complete film catalog with metadata
- **streams**: Video streaming URLs and poster images
- **captions**: Subtitle tracks for films
- **user_roles**: Role assignments for users
- **user_watchlist**: User's saved films
- **watch_progress**: Playback progress tracking

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd nollywood-media
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Run database migrations
The migrations in `supabase/migrations/` will be automatically applied. Ensure your Supabase project is set up.

5. Start the development server
```bash
npm run dev
```

6. Create your first admin account
See [CREATE_ADMIN.md](./CREATE_ADMIN.md) for instructions.

## Admin Access

### Creating Admin Users

After signing up through the UI, grant admin access via SQL:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

### Accessing the Admin Dashboard

1. Sign in with an admin account
2. Click your profile icon in the header
3. Select "Admin Dashboard"
4. Navigate to `/admin`

### Admin Features

- **Dashboard** (`/admin`): Overview with key metrics
- **Films** (`/admin/films`): Manage film catalog
- **Users** (`/admin/users`): Manage user roles
- **Analytics** (`/admin/analytics`): View platform metrics
- **Settings** (`/admin/settings`): Configure platform

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthModal.tsx   # Login/signup modal
│   ├── Header.tsx      # Main navigation
│   ├── ProtectedRoute.tsx  # Route protection
│   └── ...
├── context/            # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── CatalogProvider.tsx  # Film catalog state
├── pages/              # Page components
│   ├── admin/          # Admin dashboard pages
│   │   ├── AdminLayout.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Films.tsx
│   │   ├── FilmEditor.tsx
│   │   ├── Users.tsx
│   │   └── ...
│   ├── Home.tsx
│   ├── WatchPage.tsx
│   └── ...
├── lib/                # Utilities and helpers
│   ├── supabase.ts     # Supabase client
│   └── catalog.ts      # Catalog filtering logic
└── types/              # TypeScript type definitions
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **films**: Public read, admin write
- **user_roles**: Users can read own role, admins can manage all
- **user_watchlist**: Users can only access their own watchlist
- **watch_progress**: Users can only access their own progress
- **streams**: Public can read active streams, admins can manage

### Authentication

- Passwords are securely hashed by Supabase Auth
- JWT tokens are automatically managed
- Sessions auto-refresh before expiration
- Admin routes are protected with role checks

## API Integration

### Supabase Client

The Supabase client is initialized in `src/lib/supabase.ts` and used throughout the app:

```typescript
import { supabase } from '../lib/supabase';

// Query films
const { data, error } = await supabase
  .from('films')
  .select('*')
  .order('created_at', { ascending: false });

// Add to watchlist
const { error } = await supabase
  .from('user_watchlist')
  .insert({ user_id: user.id, film_id: filmId });
```

## Future Enhancements

Planned features for future releases:

- HLS streaming support with adaptive bitrate
- Subtitle/caption support with VTT files
- Advanced analytics with charts and graphs
- Bulk import/export for film catalog
- Search with autocomplete suggestions
- Email notifications for new content
- Social sharing features
- Mobile app versions
- Payment integration for subscriptions
- Live streaming capabilities

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [CREATE_ADMIN.md](./CREATE_ADMIN.md) guide
- Review the Supabase documentation

## Acknowledgments

- Nollywood film industry for inspiring this platform
- Supabase for providing the backend infrastructure
- React and Vite teams for the excellent development tools
