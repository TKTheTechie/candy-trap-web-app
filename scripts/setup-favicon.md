# Favicon Setup Instructions

To add the Cub Scouts logo as your favicon, follow these steps:

## 1. Save the Cub Scouts Logo
Save the Cub Scouts logo image you provided to your computer.

## 2. Create Favicon Files
You'll need to create multiple sizes for different devices. Use an online favicon generator like:
- https://favicon.io/favicon-converter/
- https://realfavicongenerator.net/

Upload your Cub Scouts logo and download the generated favicon package.

## 3. Add Files to Static Directory
Place these files in the `static/` directory:

```
static/
├── favicon.ico (16x16, 32x32, 48x48)
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png (180x180)
└── android-chrome-192x192.png (optional)
```

## 4. Files Already Updated
✅ The layout file (`src/routes/+layout.svelte`) has been updated to reference these favicon files.

## 5. Quick Setup (Alternative)
If you want a quick setup, you can:
1. Save your Cub Scouts logo as `favicon.ico` in the `static/` directory
2. The app will automatically use it

The layout is now configured to use proper favicon files from the static directory!