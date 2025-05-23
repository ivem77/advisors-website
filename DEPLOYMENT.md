# 🚀 Deployment Guide

## Live Demo Sites

Your financial advisor sites are automatically deployed using **demo content** (no API key required) so anyone can preview them safely.

### 🌐 Access Your Live Sites

Once deployed, your sites will be available at:
- **Main Index**: `https://[your-username].github.io/advisors-website/`
- **Austin**: `https://[your-username].github.io/advisors-website/austin-tx/`
- **Dallas**: `https://[your-username].github.io/advisors-website/dallas-tx/`
- **Houston**: `https://[your-username].github.io/advisors-website/houston-tx/`

## 🔧 How It Works

### Automatic Deployment
- ✅ **GitHub Actions** builds sites automatically on every push
- ✅ **Demo content** generation (no API key needed for public previews)
- ✅ **GitHub Pages** hosting (free static site hosting)
- ✅ **Custom domain** support (optional)

### Security Features
- 🔒 **No API keys** exposed in public demos
- 🔒 **Environment variables** stay private
- 🔒 **Demo content** generates realistic but fake data

## 📋 Setup Instructions

### 1. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Trigger Deployment
The deployment will start automatically when you push the workflow file.

## 🎨 Deployment Options

### Option A: GitHub Pages (Current Setup)
- ✅ **Free** hosting
- ✅ **Automatic** builds
- ✅ **Custom domains** supported
- ✅ **HTTPS** included
- 🔗 URL: `https://[username].github.io/[repo-name]/`

### Option B: Netlify (Alternative)
```bash
# Quick Netlify deployment
npm run build
npx netlify deploy --prod --dir=build
```

### Option C: Vercel (Alternative)
```bash
# Quick Vercel deployment
npm run build
npx vercel --prod ./build
```

### Option D: Surge.sh (Alternative)
```bash
# Quick Surge deployment
npm run build
npx surge ./build your-domain.surge.sh
```

## 🔄 Update Process

1. **Make changes** to your code
2. **Push to GitHub** (`git push origin main`)
3. **Automatic build** triggers via GitHub Actions
4. **Sites update** automatically (usually takes 2-3 minutes)

## 📊 What Gets Deployed

- ✅ **All city sites** (Austin, Dallas, Houston)
- ✅ **Professional index page** with city navigation
- ✅ **Complete assets** (fonts, images, styles)
- ✅ **Demo content** (realistic but API-free)
- ✅ **Responsive design** for all devices

## 🛠️ Troubleshooting

### If deployment fails:
1. Check **Actions** tab in GitHub for error logs
2. Ensure all dependencies are in `package.json`
3. Test locally with `npm run generate:demo && npm run build`

### To use real AI content:
1. Set up **repository secrets** for `OPENAI_API_KEY`
2. Modify workflow to use `npm run generate` instead of `generate:demo`
3. **Warning**: This will use your API credits on every build

## 🎯 Next Steps

1. **Enable GitHub Pages** in your repository settings
2. **Push this workflow** to trigger your first deployment
3. **Share the live URL** with anyone for previews
4. **Add more cities** by updating `data/cities.json`

Your sites will be live and publicly accessible within minutes! 🌟 