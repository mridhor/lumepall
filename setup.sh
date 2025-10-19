#!/bin/bash

echo "🚀 Setting up Snobol AI Development Environment"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please edit .env.local with your actual environment variables"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your environment variables"
echo "2. Run 'npm run dev' to start development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "For Vercel deployment:"
echo "1. Run 'vercel login' to authenticate"
echo "2. Run 'vercel' to deploy"
echo "3. Configure environment variables in Vercel dashboard"

