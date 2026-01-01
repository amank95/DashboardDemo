# Vercel Deployment Guide

This guide will help you deploy the Ad Rank Controller application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. MongoDB Atlas account (or any MongoDB instance with connection string)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare MongoDB

1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier is fine)
3. Create a database user
4. Whitelist IP addresses (add `0.0.0.0/0` to allow all IPs, or Vercel's IPs)
5. Get your connection string (it will look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Push your code to Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import Project in Vercel:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Vercel will auto-detect the project

3. **Configure Build Settings:**
   - **Framework Preset:** Other (or Create React App if available)
   - **Root Directory:** Leave as default (`.`)
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/build`
   - **Install Command:** `npm install && cd client && npm install`
   
   **Note:** If the build still fails, try setting the Build Command to just: `cd client && npm install && npm run build` (the installCommand should handle root dependencies, but including install in build ensures client deps are there)

4. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add the following:
     - `MONGODB_URI` - Your MongoDB connection string
     - `NODE_ENV` - Set to `production`
     - `REACT_APP_API_URL` - Leave empty (will use relative URLs)

5. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add Environment Variables:**
   ```bash
   vercel env add MONGODB_URI
   vercel env add NODE_ENV
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

## Step 3: Verify Deployment

1. Visit your Vercel deployment URL
2. Test the application:
   - Fill out the form
   - Submit a campaign
   - Check if campaigns appear in the table

## Project Structure for Vercel

```
Dashboard/
├── api/                    # Serverless functions (Vercel)
│   ├── campaigns.js        # Campaign API endpoint
│   ├── health.js           # Health check endpoint
│   └── db.js               # MongoDB connection utility
├── client/                 # React frontend
│   ├── src/
│   └── build/             # Build output (generated)
├── server/                 # Original Express server (not used in Vercel)
├── vercel.json            # Vercel configuration
└── package.json
```

## Important Notes

1. **MongoDB Connection:**
   - The connection is cached globally to work with serverless functions
   - Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or Vercel's IP ranges

2. **API Routes:**
   - API routes are in `/api` folder
   - They automatically become serverless functions
   - Access via `/api/campaigns` and `/api/health`

3. **Environment Variables:**
   - Set `MONGODB_URI` in Vercel dashboard
   - Don't commit `.env` files to Git

4. **Build Process:**
   - Vercel builds the React app in the `client` folder
   - The build output is served as static files
   - API routes are deployed as serverless functions

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify build command is correct

### API Not Working
- Check environment variables are set correctly
- Verify MongoDB connection string is valid
- Check function logs in Vercel dashboard

### CORS Issues
- CORS headers are already set in API functions
- If issues persist, check browser console for errors

### MongoDB Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has proper permissions

## Local Development vs Production

- **Local:** Uses Express server on port 5000
- **Production (Vercel):** Uses serverless functions in `/api` folder
- The API service automatically switches between absolute and relative URLs

## Updating Deployment

After making changes:
1. Push to Git
2. Vercel will automatically redeploy (if connected to Git)
3. Or run `vercel --prod` manually

## Support

For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

