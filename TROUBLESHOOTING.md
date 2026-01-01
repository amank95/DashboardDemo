# Vercel Deployment Troubleshooting

## Error: "react-scripts: command not found"

This error occurs when dependencies aren't installed before building.

### Solution 1: Update Vercel Build Settings

In your Vercel project settings:

1. Go to **Settings** → **General**
2. Under **Build & Development Settings**:
   - **Install Command:** `npm install && cd client && npm install`
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/build`

### Solution 2: Manual Override in Vercel Dashboard

If the vercel.json isn't being respected:

1. Go to your project in Vercel dashboard
2. Click **Settings** → **General**
3. Scroll to **Build & Development Settings**
4. Override the commands:
   - **Install Command:** `npm install && cd client && npm install`
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/build`

### Solution 3: Check package.json

Ensure `react-scripts` is in `client/package.json` dependencies (not devDependencies for production builds):

```json
{
  "dependencies": {
    "react-scripts": "5.0.1"
  }
}
```

### Solution 4: Use Root Directory Approach

If the above doesn't work, try setting the root directory to `client`:

1. In Vercel Settings → General
2. Set **Root Directory** to `client`
3. Update **Build Command** to: `npm install && npm run build`
4. Update **Output Directory** to: `build`
5. Update **Install Command** to: `npm install`

**Note:** If using this approach, you'll need to adjust the API routes configuration.

## Other Common Issues

### MongoDB Connection Errors

- Verify `MONGODB_URI` environment variable is set
- Check MongoDB Atlas IP whitelist includes Vercel IPs (or use `0.0.0.0/0`)
- Ensure connection string format is correct

### API Routes Not Working

- Check that `/api` folder exists in root directory
- Verify serverless functions are deployed (check Functions tab in Vercel)
- Check function logs for errors

### Build Timeout

- Large node_modules can cause timeouts
- Try using `.vercelignore` to exclude unnecessary files
- Consider using `npm ci` instead of `npm install` for faster installs

### CORS Errors

- CORS headers are set in API functions
- Check browser console for specific error messages
- Verify API URL is correct (should be relative in production)

## Error: Works Locally But Not on Vercel

If campaign submission works locally but fails on Vercel:

### Common Cause: Module Path Resolution

Vercel serverless functions may have issues resolving paths like `../server/models/Campaign`.

**Solution:** The Campaign model has been moved to `api/models/Campaign.js` to make it self-contained. Make sure you've pulled the latest code.

### Check 1: Verify File Structure

Ensure your `api` folder has:
- `api/campaigns.js`
- `api/db.js`
- `api/models/Campaign.js` ← This should exist

### Check 2: Dependencies in Root package.json

Vercel uses the root `package.json` for serverless functions. Ensure these are in `dependencies` (not `devDependencies`):
- `mongoose`
- `dotenv` (if needed)

## Error: 500 Internal Server Error on Campaign Submit

If you're getting a 500 error when submitting campaigns:

### Check 1: MongoDB Connection String

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `MONGODB_URI` is set correctly
3. Format should be: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
4. Make sure there are no extra spaces or quotes

### Check 2: MongoDB Atlas Network Access

1. Go to MongoDB Atlas → Network Access
2. Ensure IP whitelist includes `0.0.0.0/0` (all IPs) or Vercel's IP ranges
3. Click "Add IP Address" → "Allow Access from Anywhere"

### Check 3: Test MongoDB Connection

Visit: `https://your-app.vercel.app/api/test-db`

This will test if MongoDB connection is working. You should see:
- `success: true` if connection works
- `success: false` with error message if it fails

### Check 4: Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions tab
2. Click on the failed function (`/api/campaigns`)
3. Check the logs for specific error messages
4. Look for MongoDB connection errors

### Check 5: Verify Environment Variables

In Vercel Dashboard:
- Settings → Environment Variables
- Make sure `MONGODB_URI` is set for **Production**, **Preview**, and **Development**
- Redeploy after adding/updating environment variables

## Still Having Issues?

1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set
3. Test locally first: `npm run build` in client directory
4. Check Vercel function logs for runtime errors
5. Test MongoDB connection using `/api/test-db` endpoint

