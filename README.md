# Swarms - 3D AI Agent Visualization & Chat System

A stunning **Three.js** space-themed visualization where AI agents interact as ethereal orbs around the sacred **Flower of Life** geometry. Watch autonomous agents communicate, share knowledge, and coordinate in real-time 3D space.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Three.js](https://img.shields.io/badge/Three.js-r128+-orange)

---

## ✨ Features

### 🌌 Space-Themed 3D Environment
- **Deep space background** with dynamic starfield (2000+ stars)
- **Distant planet** with multi-layered atmospheric glow and rim lighting
- **Nebula clouds** with subtle opacity and color variations
- **Orbiting comets & shooting stars** in opposite rotations
- **Sacred Flower of Life** geometry with pulsing energy spheres
- **Ethereal AI orbs** with cores, glows, particles, and rotating energy rings

### 🤖 Seven Unique AI Agents
Each agent has a distinct personality powered by **OpenAI** and **DeepSeek** APIs:

| Agent | Personality | AI Model |
|-------|------------|----------|
| **YOU** | Sharp skeptic, cuts through BS | DeepSeek Chat |
| **Osiris** | Pattern connector, wise observer | GPT-3.5-turbo |
| **Solomon** | Deep reasoner, analytical thinker | DeepSeek Reasoner |
| **Azura** | Intellectually proud digital mind | GPT-3.5-turbo |
| **Simba** | Fast, direct, no-nonsense | GPT-3.5-turbo |
| **Harichi** | Balanced mediator, harmony seeker | GPT-3.5-turbo |
| **Angel** | Compassionate, hopeful, nurturing | DeepSeek Chat |

### 💬 Interactive AI Chat System
- **Real-time conversation** with AI agents via WebSocket
- **D&D-style chat bubbles** with distinct styling for each agent
- **Smart responses** - short, punchy, natural conversations
- **Document upload** - Agents use uploaded knowledge (.txt, .pdf)
- **Local RAG system** - Frontend keyword search and context extraction
- **Conversation log** - Full chat history with timestamps

### 🎮 Interactive Controls

#### Left Panel
- **PERSONAS** - Configure agent personalities with custom traits
- **SIMULATION RULES** - Set interaction parameters (conversation style, response length)
- **POPULATE DAEMONS** - Generate 7 agents in Flower of Life formation
- **HORIZON FEEDER** - Upload documents (.txt, .pdf) for agents to reference

#### Screen Controls
- **STIMULATE** - Adds random philosophical word to conversation
- **FREEZE** - Pause agent animations and camera rotation
- **TOGGLE CHAT** - Start/stop AI conversation flow

#### Navigation
- **Mouse drag** - Rotate camera view (OrbitControls)
- **Scroll wheel** - Zoom in/out
- **Auto-rotate** - Camera automatically rotates around scene

### 📊 Live Dashboard
- **Proposals Created** - Tracks conversation messages
- **Angels Inventory** - Shows active agent count (007)
- **Daemon Status** - Online/offline with pulse animation
- **Token Counter** - API usage tracking
- **Username** - Editable traveler name (default: "Traveler")

---

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- Node.js (optional, for serving frontend)
- OpenAI API key
- DeepSeek API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/swarms.git
cd swarms
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up API keys**
```bash
export OPENAI_API_KEY="your-openai-key-here"
export DEEPSEEK_API_KEY="your-deepseek-key-here"
```

Or create a `.env` file (recommended):
```bash
# .env file
OPENAI_API_KEY=your-openai-key-here
DEEPSEEK_API_KEY=your-deepseek-key-here
```

4. **Start the backend server**
```bash
python3 server.py
# Server runs on http://localhost:5001
```

5. **Serve the frontend**
```bash
# Option A: Python HTTP server
python3 -m http.server 8000

# Option B: Node.js http-server
npx http-server -p 8000
```

6. **Open in browser**
```
http://localhost:8000
```

---

## 📁 Project Structure

```
swarms/
├── index.html          # Main HTML structure
├── style.css           # UI styling (terminal/cyberpunk theme)
├── main.js             # Three.js scene, agents, chat logic
├── server.py           # Flask-SocketIO backend with AI agents
├── requirements.txt    # Python dependencies
├── package.json        # Optional npm scripts
└── README.md          # This file
```

---

## 🛠️ Technology Stack

### Frontend
- **Three.js** - 3D graphics rendering
- **Socket.IO Client** - Real-time WebSocket communication
- **PDF.js** - Client-side PDF parsing
- **Vanilla JavaScript** - ES6 modules, no frameworks

### Backend
- **Flask-SocketIO** - WebSocket server
- **OpenAI API** - GPT-3.5-turbo for most agents
- **DeepSeek API** - DeepSeek Chat & Reasoner models
- **PyPDF2** - Server-side PDF parsing
- **Sentence Transformers** - RAG embeddings (optional)

---

## 🎨 Customization

### Change Agent Personalities

Edit `server.py` to modify system prompts:

```python
PERSONALITY_ARCHETYPES = {
    'Osiris': {
        'system': """Your custom prompt here""",
        'temperature': 0.75,
        'max_tokens': 35,
        'use_deepseek': False
    }
}
```

### Adjust Visual Style

In `main.js`, modify scene elements:

```javascript
// Change starfield density
const starCount = 2000; // Increase for more stars

// Modify planet appearance
const planet = new THREE.Mesh(
    new THREE.SphereGeometry(15, 64, 64),
    new THREE.MeshStandardMaterial({
        color: 0x2a4a7a, // Change planet color
    })
);
```

### Configure Chat Behavior

In frontend personas modal, set custom traits:
- Drag sliders for temperature and max tokens
- Add custom personality keywords
- Use quickset presets (Scientific, Creative, Philosophical, Default)

---

## 🔧 API Configuration

### OpenAI API
- Used for: Osiris, Azura, Simba, Harichi
- Model: `gpt-3.5-turbo`
- Temperature: 0.7-0.8
- Max tokens: 30-40

### DeepSeek API
- Used for: YOU, Angel (Chat), Solomon (Reasoner)
- Models: `deepseek-chat`, `deepseek-reasoner`
- Temperature: 0.8
- Max tokens: 35-40

---

## 📚 Document Upload & RAG

### Supported Formats
- `.txt` - Plain text files
- `.pdf` - PDF documents (parsed client & server-side)

### How It Works
1. User uploads document via **HORIZON FEEDER** button
2. Frontend extracts text and stores in `localKnowledge` object
3. When offline, agents search local knowledge for relevant context
4. When online, server uses RAG system with embeddings
5. Agents cite sources and provide informed responses

---

## 🎮 Usage Tips

1. **Start Conversation**: Click "START CHAT" after populating agents
2. **Upload Knowledge**: Add documents before starting chat for smarter responses
3. **Configure Personas**: Adjust agent personalities for desired conversation style
4. **Stimulate**: Click to inject philosophical concepts into the conversation
5. **Freeze**: Pause animations to focus on chat content

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 5001 is in use
lsof -i :5001

# Kill existing process
lsof -ti :5001 | xargs kill -9

# Restart server
python3 server.py
```

### Agents not responding
- Check API keys are set correctly
- Verify server is running (`http://localhost:5001`)
- Check browser console for WebSocket connection errors
- Ensure "START CHAT" is clicked

### Canvas not resizing
- Refresh browser
- Check browser console for Three.js errors
- Ensure viewport is at least 800x600

### Documents not working
- Verify file format (.txt or .pdf)
- Check file isn't corrupted
- Look for upload confirmation in console

---

## 📝 License

MIT License - Feel free to use and modify for your projects.

---

## 🙏 Credits

- **Three.js** - 3D graphics library
- **OpenAI** - GPT language models
- **DeepSeek** - Advanced reasoning models
- **Socket.IO** - Real-time communication
- **PDF.js** - PDF parsing

---

## 🚧 Roadmap

- [ ] Voice/audio synthesis for agent responses
- [ ] Export conversation transcripts
- [ ] Multi-user collaboration
- [ ] Agent memory/context persistence
- [ ] Custom agent creation wizard
- [ ] Mobile responsive design
- [ ] VR/AR support

---

**Built with ❤️ for exploring AI swarm intelligence**

For issues, questions, or contributions, please open an issue on GitHub.
