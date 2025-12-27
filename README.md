# 🍭 Candy Trap Alert - Cub Scouts Demo

A fun, LEGO-themed web application designed for Cub Scouts (ages 7-8) that demonstrates real-time messaging using Solace PubSub+. The app features a colorful interface inspired by the Cub Scouts colors (blue and yellow) and LEGO design elements.

## 🎯 Features

- **LEGO-themed UI**: Fun, colorful design with LEGO brick elements and Cub Scout colors
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Alerts**: Connects to Solace PubSub+ to receive candy trap alerts
- **Audio Alerts**: Plays alarm sounds when intruders are detected
- **Interactive Demo**: Perfect for demonstrating IoT concepts to young scouts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Solace PubSub+ Cloud account (optional for demo mode)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd candy-trap-web-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with your Solace broker configuration:

```bash
# Copy from .env.example and update with your values
cp .env.example .env
```

Then edit `.env` with your Solace PubSub+ details:

```bash
VITE_SOLACE_URL=wss://your-solace-broker.messaging.solace.cloud:443
VITE_SOLACE_VPN_NAME=your-vpn-name
VITE_SOLACE_USERNAME=your-username
VITE_SOLACE_PASSWORD=your-password
VITE_SOLACE_TOPIC=CANDY/ALERT
```

### Solace PubSub+ Setup

The app will automatically use the environment variables for configuration. If no `.env` file is present, it will fall back to demo values.

### Demo Mode

The app now includes **real Solace broker connectivity**! It will attempt to connect to your configured Solace broker using the environment variables. If the connection fails, you can use the "Retry Connection" button.

**Connection Features:**
- Real-time connection to Solace PubSub+ brokers
- Automatic subscription to the configured topic
- Connection timeout and error handling
- Manual disconnect and retry functionality
- Detailed connection status indicators

The app will show different connection states:
- 🟢 **Connected**: Successfully connected and subscribed
- 🔴 **Connection Failed**: Check your credentials and network
- ⚪ **Connecting**: Attempting to establish connection
- ⚪ **Disconnected**: Not connected to broker

## 🧪 Testing the Connection

To test your Solace connection:

1. **Start the app** and click "START"
2. **Check connection status** - you should see "Connected" if successful
3. **Send real messages** - publish to your configured topic using Solace tools:

```bash
# Using Solace CLI (replace with your topic)
solace message publish --topic "CANDY/ALERT" --message "Alert message"
```

4. **Monitor logs** - check browser console for detailed connection information

## 📱 How to Use

1. **Splash Screen**: Click the "START" button to begin
2. **Scanning Screen**: The app connects to the security system and begins monitoring
3. **Alert Mode**: When a message is received on the configured topic, the screen flashes red and plays an alarm
4. **Reset**: Click "Reset System" to return to the splash screen

## 🎵 Audio Setup

The app supports both MP3 audio files and generated alarm sounds:

1. **MP3 File**: Place an `alarm.mp3` file in the `static/` directory
2. **Generated Sound**: If no MP3 is found, the app uses Web Audio API to generate alarm sounds

## 🚀 Deployment to GitHub Pages

The project includes automated GitHub Pages deployment:

1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy the site
3. Your app will be available at `https://yourusername.github.io/candy-trap-web-app`

### Manual Deployment

```bash
npm run build
npm run preview
```

## 🎨 Customization

### Colors

The app uses Cub Scout colors defined in `tailwind.config.js`:

- `cub-blue`: #003f7f (Official Cub Scout blue)
- `cub-yellow`: #ffd700 (Official Cub Scout yellow)
- `lego-red`: #d50000 (LEGO red for alerts)
- `lego-green`: #00a651 (LEGO green for status)

### Fonts

The app uses the "Fredoka" font family for a fun, LEGO-like appearance.

## 📋 Topic Structure

The app subscribes to the topic defined in `VITE_SOLACE_TOPIC` (default: `CANDY/ALERT`). Send messages to this topic to trigger alerts:

```bash
# Example using Solace CLI (replace with your topic if different)
solace message publish --topic "CANDY/ALERT" --message "Intruder detected!"
```

## 🛠 Development

### Project Structure

```
src/
├── lib/
│   └── audioUtils.ts          # Audio generation utilities
├── routes/
│   ├── +layout.ts            # Layout configuration
│   └── +page.svelte          # Main application component
├── app.html                  # HTML template
└── app.css                   # Global styles (if needed)
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## 🎪 Demo Tips for Cub Scouts

1. **Start with the Story**: "We're protecting our candy from sneaky intruders!"
2. **Explain the Technology**: "This is like a smart doorbell that sends messages through the internet"
3. **Interactive Elements**: Let the scouts click the buttons and watch the scanning animation
4. **Real-world Connections**: Relate to home security systems, smart doorbells, etc.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Audio Not Playing
- Ensure you have an `alarm.mp3` file in the `static/` directory
- Check browser audio permissions
- The app will fallback to generated sounds if MP3 fails

### Solace Connection Issues
- Verify your Solace credentials
- Check network connectivity
- Use demo mode for offline demonstrations

### Build Issues
- Ensure Node.js 18+ is installed
- Clear `node_modules` and reinstall dependencies
- Check for TypeScript errors

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team.

---

Made with ❤️ for Cub Scouts everywhere! 🏕️