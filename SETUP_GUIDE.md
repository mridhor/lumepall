# Snobol AI - Setup Guide

This guide will help you set up both localhost development and Vercel deployment for your Snobol AI project.

## 🏠 Localhost Development Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager
- Git

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Environment Variables Setup
1. Copy the environment template:
```bash
cp env.example .env.local
```

2. Fill in your environment variables in `.env.local`:
```env
# Supabase Configuration
SNOBOL_SUPABASE_URL=your_supabase_project_url
SNOBOL_NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (if using AI features)
OPENAI_API_KEY=your_openai_api_key

# Alpha Vantage API (if using stock data)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

### Step 3: Start Development Server
```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

## 🚀 Vercel Deployment Setup

### Prerequisites
- Vercel account (sign up at [vercel.com](https://vercel.com))
- GitHub repository with your code
- Environment variables ready

### Step 1: Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Configure environment variables (see Step 3)
6. Click "Deploy"

#### Option B: Deploy via CLI
```bash
# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# For production deployment
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel
1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
SNOBOL_SUPABASE_URL = your_supabase_project_url
SNOBOL_NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
OPENAI_API_KEY = your_openai_api_key
ALPHA_VANTAGE_API_KEY = your_alpha_vantage_api_key
```

### Step 4: Configure Build Settings
Vercel should automatically detect your Next.js project, but you can verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

## 🔧 Additional Configuration

### Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Set up your database tables as needed

### Domain Configuration (Optional)
1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Configure DNS settings as instructed

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure `.env.local` is in the root directory
   - Restart the development server after adding new variables
   - Check variable names match exactly (case-sensitive)

2. **Build Failures**
   - Check all environment variables are set in Vercel
   - Ensure all dependencies are in `package.json`
   - Check for TypeScript errors: `npm run lint`

3. **Supabase Connection Issues**
   - Verify your Supabase URL and key are correct
   - Check Supabase project is active
   - Ensure RLS policies are configured if needed

4. **API Route Issues**
   - Check API routes are in `src/app/api/` directory
   - Verify environment variables are available in API routes
   - Check Vercel function logs for errors

## 🔄 Continuous Deployment

Once connected to Vercel:
- Every push to your main branch will trigger automatic deployment
- Preview deployments are created for pull requests
- You can configure custom deployment settings in `vercel.json`

## 📊 Monitoring

- Check deployment status in Vercel dashboard
- Monitor function logs for API routes
- Use Vercel Analytics for performance insights

## 🆘 Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)

