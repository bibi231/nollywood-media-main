# 🇳🇬 NaijaMation: The Future of African Digital Storytelling

NaijaMation is a high-performance, cinematic streaming and content platform dedicated to Nollywood media and African digital creators. Engineered for the next generation of storytellers, it combines a premium viewing experience with advanced creator tools and real-time analytics.

## ✨ Core Features

### 🎬 Cinematic Viewing Experience
- **Enhanced Video Player**: Custom-built HLS/MP4 player with gesture controls, playback speed adjustments, and picture-in-picture support.
- **Smart Progress Tracking**: Pick up right where you left off with cross-device "Continue Watching" synchronization.
- **Content Analytics**: Sophisticated watch-time tracking and real-time view counts for every film.

### 🤖 Creator Studio 2.0
- **AI Content Generation**: Integrated AI video generator tools for creators to rapidly prototype and create shorts.
- **Advanced Upload Manager**: Support for high-bitrate video and audio tracks with automatic metadata indexing.
- **Performance Insights**: Real-time analytics dashboard showing subscriber growth, engagement heatmaps, and trending scores.

### 🌓 Premium Design System
- **Dynamic Theming**: True dark mode support with a focus on high-contrast African aesthetics.
- **Responsive Layouts**: Fully optimized for mobile density, ensuring a premium experience on any device.
- **Live Search & Discovery**: Fast, keyword-based search with genre and regional categorization.

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Vanilla CSS (Glassmorphism & Neon Design System) |
| **Icons** | Lucide React |
| **Database** | PostgreSQL (Neon Serverless) |
| **Storage** | Cloudflare R2 (S3 Compatible) |
| **Architecture** | Custom Supabase Adapter Pattern for seamless API migration |
| **Deployments** | Vercel (Production) |

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm / pnpm / yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/bibi231/nollywood-media-main.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env`):
   ```env
   VITE_API_BASE=your_vercel_api_url
   VITE_R2_PUBLIC_URL=your_r2_cdn_url
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📈 Roadmap
- [x] Phase 5: Cinematic Video Player & Tracking
- [x] Phase 6: Real-time Analytics & View Counting
- [x] Phase 7: Advanced Uploads & Audio Support
- [ ] Phase 8: Community Forums & Live Streaming (Upcoming)

## 📄 License
This project is licensed under the MIT License.

---
*NaijaMation — Empowering African creators to own their narrative.*
