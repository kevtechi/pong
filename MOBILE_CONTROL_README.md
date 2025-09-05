# Mobile Control for Pong Game

This implementation adds mobile control functionality to the Pong game using WebRTC for peer-to-peer communication over the local network.

## Features

- **QR Code Generation**: Automatically generates a QR code for easy mobile access
- **WebRTC Communication**: Peer-to-peer connection between desktop and mobile devices
- **Touch Controls**: Large, responsive touch buttons for mobile control
- **Real-time Connection**: Low-latency communication over local WiFi network
- **Connection Status**: Visual indicators showing connection status

## How to Use

### 1. Start the Game with Mobile Control

1. Open the game in your browser
2. In the game configuration screen, check "Enable mobile control for left player"
3. Configure your ball type (emoji or custom image)
4. Click "Start Game"

### 2. Connect Your Mobile Device

1. A QR code will appear on the game screen
2. Scan the QR code with your phone's camera or QR code app
3. The mobile controller page will open in your phone's browser
4. You'll see connection status indicators on both devices

### 3. Play the Game

- **Desktop**: Use W/S keys for left player, arrow keys for right player
- **Mobile**: Use the large up/down buttons to control the left paddle
- **Both devices**: Press SPACE on desktop to start the game

## Technical Details

### Architecture

- **Signaling Server**: Socket.IO server for WebRTC signaling
- **WebRTC**: Peer-to-peer data channels for low-latency communication
- **QR Code**: Generated using the `qrcode` library
- **Mobile UI**: Touch-optimized interface with visual feedback

### Network Requirements

- Both devices must be on the same WiFi network
- No internet connection required (local network only)
- WebRTC uses STUN servers for NAT traversal

### Files Added/Modified

- `src/app/api/socket/route.ts` - Socket.IO signaling server
- `src/hooks/useWebRTC.ts` - WebRTC connection management
- `src/app/controller/page.tsx` - Mobile controller interface
- `src/components/qr-code-display.tsx` - QR code generation
- `src/components/pong-game.tsx` - Modified to support WebRTC
- `src/components/game-config.tsx` - Added mobile control option
- `src/app/page.tsx` - Updated to pass mobile control state

## Troubleshooting

### Connection Issues

1. **QR Code not working**: Make sure both devices are on the same WiFi network
2. **Mobile can't connect**: Check that the desktop is running on `0.0.0.0` (use `npm run local`)
3. **Controls not responding**: Refresh both pages and try again

### Performance Issues

1. **Lag in controls**: Check WiFi signal strength
2. **Connection drops**: Ensure devices stay on the same network
3. **QR code not scanning**: Try manually entering the URL shown below the QR code

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Run on local network (required for mobile access)
npm run local

# Or run normally (localhost only)
npm run dev
```

### Testing Mobile Control

1. Start the server with `npm run local`
2. Access the game from your computer's IP address
3. Enable mobile control in the game configuration
4. Scan the QR code with your phone
5. Test the connection and controls

## Security Notes

- This implementation is designed for local network use only
- No authentication is implemented (suitable for home/local use)
- WebRTC connections are encrypted by default
- Consider adding authentication for production use
