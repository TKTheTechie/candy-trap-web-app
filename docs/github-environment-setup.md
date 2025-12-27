# GitHub Environment Variables Setup

This guide explains how to configure environment variables for GitHub Pages deployment.

## 🔧 Setting Up Repository Variables/Secrets

### Step 1: Access Repository Settings
1. Go to your GitHub repository: `https://github.com/TKTheTechie/candy-trap-web-app`
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Environment Variables

You can add variables in two ways:

#### Option A: Repository Variables (Recommended for non-sensitive data)
Click the **Variables** tab and add:
- `VITE_SOLACE_URL` = `wss://your-broker.messaging.solace.cloud:443`
- `VITE_SOLACE_VPN_NAME` = `your-vpn-name`
- `VITE_SOLACE_USERNAME` = `your-username`
- `VITE_SOLACE_TOPIC` = `CANDY/ALERT`

#### Option B: Repository Secrets (For sensitive data)
Click the **Secrets** tab and add:
- `VITE_SOLACE_PASSWORD` = `your-password`

### Step 3: Verify Configuration
The GitHub Actions workflow will:
1. Use **Variables** first (if set)
2. Fall back to **Secrets** (if Variables not set)
3. Use **default values** (if neither Variables nor Secrets are set)

## 🔍 Troubleshooting

### Check Build Logs
1. Go to **Actions** tab in your repository
2. Click on the latest deployment
3. Check the "Debug Environment Variables" step
4. Verify your variables are being used

### Test Locally
```bash
# Build and check if env vars are included
npm run build
npm run check-env
```

### Common Issues

1. **Variables not showing up**: Make sure variable names start with `VITE_`
2. **Still using defaults**: Check that variable names match exactly
3. **Build failing**: Ensure all required variables are set

## 📝 Variable Reference

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `VITE_SOLACE_URL` | Variable | WebSocket URL for Solace broker | Demo broker URL |
| `VITE_SOLACE_VPN_NAME` | Variable | VPN name for Solace service | `candy-trap-demo` |
| `VITE_SOLACE_USERNAME` | Variable | Username for authentication | `candy-trap-user` |
| `VITE_SOLACE_PASSWORD` | Secret | Password for authentication | `candy123` |
| `VITE_SOLACE_TOPIC` | Variable | Topic to subscribe to | `CANDY/ALERT` |

## 🚀 After Setup

Once configured:
1. **Push changes** to trigger new deployment
2. **Check Actions tab** for build success
3. **Visit GitHub Pages URL** to test with your Solace broker
4. **Check browser console** for connection status

The environment variables will be baked into the build and work on GitHub Pages!