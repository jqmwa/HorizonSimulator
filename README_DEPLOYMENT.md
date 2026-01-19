# Swarms AI - Local LLM Deployment Guide

This application uses **3 local LLM models** instead of API calls, so no API keys are required!

## Models Used

1. **TinyLlama-1.1B** - Fastest, smallest model for quick responses
2. **Qwen2.5-0.5B** - Balanced small model with good instruction following
3. **Phi-2 (2.7B)** - Microsoft's small but capable reasoning model

## Quick Start

### 1. Deploy the Application

```bash
chmod +x deploy.sh start.sh
./deploy.sh
```

This will:
- Create a Python virtual environment
- Install all dependencies
- Download the 3 LLM models (may take 10-30 minutes depending on internet speed)
- Set up the environment

### 2. Start the Server

```bash
./start.sh
```

Or manually:
```bash
source venv/bin/activate
python3 server.py
```

### 3. Open the UI

Open `index.html` in your browser, or serve it with:

```bash
python3 -m http.server 8000
```

Then open: http://localhost:8000

## Manual Setup

If you prefer to set up manually:

### Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Download Models

```bash
python3 download_models.py
```

This will download all 3 models to `~/.cache/huggingface/`

### Start Server

```bash
python3 server.py
```

## System Requirements

- **Python 3.8+**
- **RAM**: At least 8GB (16GB recommended)
- **Disk Space**: ~10GB for all models
- **GPU**: Optional but recommended (CUDA-compatible GPU will speed up inference significantly)

## Model Assignment

Agents are assigned to different models for variety:

- **YOU, Solomon**: Phi-2 (medium) - Better reasoning
- **Osiris, Harichi, Angel**: Qwen2.5-0.5B (small) - Balanced
- **Azura, Simba**: TinyLlama (tiny) - Fast responses

## Troubleshooting

### Models won't load

1. Check disk space: `df -h`
2. Check internet connection for initial download
3. Try downloading models manually: `python3 download_models.py`

### Out of Memory

- Close other applications
- Use CPU mode (models will be slower but use less memory)
- Consider using only 1-2 models instead of all 3

### Slow Responses

- Models run on CPU by default (slower)
- Install CUDA and PyTorch with GPU support for faster inference
- Reduce `max_tokens` in agent configurations

## Production Deployment

For production, consider:

1. **Use a process manager** (PM2, supervisor, systemd)
2. **Set up reverse proxy** (nginx) for the Flask app
3. **Use GPU** for faster inference
4. **Monitor memory usage**
5. **Set up logging** to files

Example systemd service:

```ini
[Unit]
Description=Swarms AI Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/swarms
ExecStart=/path/to/swarms/venv/bin/python3 server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

## Notes

- First model load may take 1-2 minutes
- Models are cached after first download
- No API keys needed - everything runs locally!
- Token counting is disabled (local models don't charge per token)
