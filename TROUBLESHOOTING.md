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

## Still Having Issues?

1. Check Vercel build logs for specific error messages
2. Verify all environment variables are set
3. Test locally first: `npm run build` in client directory
4. Check Vercel function logs for runtime errors

