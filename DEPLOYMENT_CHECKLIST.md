# Vercel Deployment Checklist

## Pre-Deployment

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created and running
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (add `0.0.0.0/0` for Vercel)
- [ ] MongoDB connection string copied
- [ ] Code pushed to Git repository (GitHub/GitLab/Bitbucket)

## Vercel Configuration

- [ ] Vercel account created
- [ ] Project imported from Git repository
- [ ] Environment variables set:
  - [ ] `MONGODB_URI` - Your MongoDB connection string
  - [ ] `NODE_ENV` - Set to `production` (optional)
- [ ] Build settings configured:
  - [ ] Build Command: `cd client && npm install && npm run build`
  - [ ] Output Directory: `client/build`
  - [ ] Install Command: `npm install && cd client && npm install`

## Post-Deployment

- [ ] Visit deployment URL
- [ ] Test form submission
- [ ] Verify campaigns are saved to MongoDB
- [ ] Check campaign list displays correctly
- [ ] Test all form sections (A, B, C)
- [ ] Verify error messages work
- [ ] Check success messages appear

## Troubleshooting

If deployment fails:
1. Check Vercel build logs
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct
4. Check MongoDB Atlas IP whitelist
5. Verify package.json files are correct

If API doesn't work:
1. Check function logs in Vercel dashboard
2. Verify MongoDB connection
3. Test `/api/health` endpoint
4. Check browser console for CORS errors

## Quick Commands

```bash
# Deploy to Vercel (first time)
vercel

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# Check environment variables
vercel env ls
```



