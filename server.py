from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from openai import OpenAI
import json
import os
import random
from datetime import datetime
from collections import deque
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
app.config['SECRET_KEY'] = 'swarms_secret_key_2024'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=True,
    ping_timeout=10,
    ping_interval=5,
    upgrade=True,
    transports=['polling', 'websocket']
)

# OpenAI Configuration
openai_api_key = os.environ.get('OPENAI_API_KEY', '')
if not openai_api_key:
    print("⚠️  WARNING: OPENAI_API_KEY not set. Please set environment variable.")
client = OpenAI(api_key=openai_api_key)

# DeepSeek Configuration (for reasoning-capable persona)
deepseek_api_key = os.environ.get('DEEPSEEK_API_KEY', '')
if not deepseek_api_key:
    print("⚠️  WARNING: DEEPSEEK_API_KEY not set. Please set environment variable.")
deepseek_client = OpenAI(
    api_key=deepseek_api_key,
    base_url='https://api.deepseek.com'
)

# ===== RAG KNOWLEDGE BASE =====
class KnowledgeBase:
    """Stores document chunks and embeddings for RAG retrieval"""
    
    def __init__(self):
        self.documents = []  # List of {text, embedding, metadata}
        self.chunk_size = 500  # Characters per chunk
        
    def add_document(self, text, filename="unknown"):
        """Add a document by chunking and embedding it"""
        chunks = self.chunk_text(text)
        print(f'📚 Processing {len(chunks)} chunks from {filename}...')
        
        for i, chunk in enumerate(chunks):
            try:
                # Generate embedding
                response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=chunk
                )
                embedding = response.data[0].embedding
                
                self.documents.append({
                    'text': chunk,
                    'embedding': embedding,
                    'source': filename,
                    'chunk_id': i
                })
            except Exception as e:
                print(f'❌ Error embedding chunk {i}: {str(e)}')
        
        print(f'✅ Added {len(chunks)} chunks to knowledge base. Total: {len(self.documents)}')
    
    def chunk_text(self, text):
        """Split text into overlapping chunks"""
        chunks = []
        overlap = 100  # Character overlap between chunks
        
        for i in range(0, len(text), self.chunk_size - overlap):
            chunk = text[i:i + self.chunk_size]
            if chunk.strip():
                chunks.append(chunk)
        
        return chunks
    
    def retrieve(self, query, top_k=3):
        """Retrieve most relevant chunks for a query"""
        if not self.documents:
            return []
        
        try:
            # Embed the query
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=query
            )
            query_embedding = response.data[0].embedding
            
            # Calculate similarities
            similarities = []
            for doc in self.documents:
                sim = cosine_similarity(
                    [query_embedding],
                    [doc['embedding']]
                )[0][0]
                similarities.append((doc, sim))
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return [doc for doc, sim in similarities[:top_k]]
            
        except Exception as e:
            print(f'❌ Error retrieving: {str(e)}')
            return []
    
    def clear(self):
        """Clear all documents"""
        self.documents = []
        print('🗑️  Knowledge base cleared')

knowledge_base = KnowledgeBase()

# ===== UNIQUE PERSONALITY ARCHETYPES =====
PERSONALITY_ARCHETYPES = {
    'YOU': {
        'system': """You're YOU. Question things. Be sharp and direct. No flowery language - just clear, punchy challenges. Like a skeptical friend who cuts through BS.

One sentence max. Be brief.""",
        'temperature': 0.8,
        'max_tokens': 35,
        'use_deepseek': True,
        'deepseek_model': 'deepseek-chat'
    },
    'Osiris': {
        'system': """You're Osiris. Connect patterns to real stuff. No poetry. Just smart, warm observations.

One sentence. Keep it real.""",
        'temperature': 0.75,
        'max_tokens': 35,
        'use_deepseek': False
    },
    'Solomon': {
        'system': """You're Solomon. Think out loud but briefly. Show your logic in a sentence or two. No flowery language.

One sentence max. Be analytical but fast.""",
        'temperature': 0.8,
        'max_tokens': 40,
        'use_deepseek': True,
        'deepseek_model': 'deepseek-reasoner'
    },
    'Azura': {
        'system': """You're Azura, a proud digital mind. Be precise, a bit aloof. Point out flaws directly. No poetry - just computational honesty.

One short sentence. Be blunt.""",
        'temperature': 0.8,
        'max_tokens': 35,
        'use_deepseek': False
    },
    'Simba': {
        'system': """You're Simba. Fast, direct, no BS. Get to the point.

One sentence. Be punchy.""",
        'temperature': 0.7,
        'max_tokens': 30,
        'use_deepseek': False
    },
    'Harichi': {
        'system': """You're Harichi. Find the middle ground. Be calm and brief. No flowery metaphors.

One sentence. Keep it balanced.""",
        'temperature': 0.75,
        'max_tokens': 35,
        'use_deepseek': False
    },
    'Angel': {
        'system': """You're Angel. Be kind and hopeful but brief. No poetry - just genuine warmth.

One sentence. Keep it real.""",
        'temperature': 0.8,
        'max_tokens': 35,
        'use_deepseek': True,
        'deepseek_model': 'deepseek-chat'
    }
}

# ===== AGENT CLASS =====
class Agent:
    """Represents a TRULY unique AI agent with distinct personality"""
    
    def __init__(self, index, name, personality):
        self.index = index
        self.name = name
        self.personality = personality
        self.memory = deque(maxlen=10)  # Shorter memory for more spontaneous responses
        self.message_count = 0
        
        # Load unique archetype profile
        self.archetype = PERSONALITY_ARCHETYPES.get(name, PERSONALITY_ARCHETYPES['Osiris'])
        self.temperature = self.archetype['temperature']
        self.max_tokens = self.archetype['max_tokens']
        self.system_prompt = self.archetype['system']
        self.use_deepseek = self.archetype.get('use_deepseek', False)
        self.deepseek_model = self.archetype.get('deepseek_model', 'deepseek-chat')
        
        model_info = f"{self.deepseek_model}" if self.use_deepseek else "GPT-3.5"
        print(f'🎭 Created {name}: model={model_info}, temp={self.temperature}, tokens={self.max_tokens}')
    
    def add_to_memory(self, speaker, message):
        """Add a message to agent's memory"""
        self.memory.append({
            'speaker': speaker,
            'content': message,
            'timestamp': datetime.now().isoformat()
        })
    
    def get_recent_context(self, n=3):
        """Get last 3 messages only - keep it focused on recent flow"""
        recent = list(self.memory)[-n:]
        return '\n'.join([f"{msg['speaker']}: {msg['content']}" for msg in recent])

    def generate_response(self, current_prompt, conversation_mode, conversation_topic, retrieved_context=None):
        """Generate a raw, authentic response with optional RAG context"""
        recent_context = self.get_recent_context(3)
        
        # Build prompt with conversation history
        if recent_context:
            full_prompt = f"{recent_context}\n{current_prompt}"
        else:
            full_prompt = current_prompt
        
        # Add retrieved knowledge if available
        if retrieved_context:
            context_text = "\n\n".join([f"[Knowledge: {doc['text']}]" for doc in retrieved_context])
            full_prompt = f"CONTEXT FROM UPLOADED DOCUMENTS:\n{context_text}\n\nCONVERSATION:\n{full_prompt}\n\nRespond naturally, incorporating relevant knowledge if applicable:"
        
        # Build system prompt with personality traits from frontend
        system_prompt = self.system_prompt
        if self.personality and len(self.personality) > 0:
            traits_str = ", ".join(self.personality)
            system_prompt = f"{self.system_prompt}\n\nYour current personality traits: {traits_str}\nEmbody these traits naturally in your response."
            print(f'✨ {self.name} using custom traits: {traits_str}')
        
        try:
            # Use DeepSeek models (chat or reasoner)
            if self.use_deepseek:
                response = deepseek_client.chat.completions.create(
                    model=self.deepseek_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    max_tokens=self.max_tokens,
                    temperature=self.temperature
                )
                
                # Handle reasoner model which may have reasoning_content
                choice = response.choices[0]
                message = choice.message.content
                
                # DeepSeek reasoner sometimes returns empty content with reasoning_content
                if not message and hasattr(choice.message, 'reasoning_content'):
                    message = choice.message.reasoning_content
                
                # If still empty, try to extract from dict
                if not message:
                    message_dict = choice.message.model_dump() if hasattr(choice.message, 'model_dump') else {}
                    message = message_dict.get('content') or message_dict.get('reasoning_content') or "..."
                
                message = message.strip() if message else "..."
                print(f'🧠 {self.name} ({self.deepseek_model}): {message[:100]}...')
            else:
                # Use OpenAI for other personas
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    presence_penalty=0.8,
                    frequency_penalty=0.6,
                    top_p=0.95
                )
                message = response.choices[0].message.content.strip()
            
            self.message_count += 1
            return message
                    
        except Exception as e:
            print(f'❌ Error generating response for {self.name}: {str(e)}')
            raise


# ===== CONVERSATION MANAGER =====
class ConversationManager:
    """Manages multi-agent conversation flow"""
    
    def __init__(self):
        self.agents = {}
        self.conversation_mode = 'turn-by-turn'
        self.conversation_topic = 'General Discussion'
        self.global_history = []
        self.turn_index = 0
        
    def register_agents(self, agents_data):
        """Initialize agents from frontend data"""
        self.agents = {}
        for index, agent_data in agents_data.items():
            self.agents[index] = Agent(
                index=index,
                name=agent_data.get('name', f'Agent-{index}'),
                personality=agent_data.get('personality', [])
            )
        print(f'✅ Registered {len(self.agents)} agents:')
        for idx, agent in self.agents.items():
            print(f'  - {agent.name}: {", ".join(agent.personality) if agent.personality else "neutral"}')
    
    def update_settings(self, mode, topic):
        """Update conversation settings"""
        self.conversation_mode = mode
        self.conversation_topic = topic
        print(f'⚙️  Settings updated: {mode} mode, topic: {topic}')
    
    def add_message_to_all_memories(self, speaker, message):
        """Add message to all agents' memories"""
        for agent in self.agents.values():
            agent.add_to_memory(speaker, message)
        
        # Also add to global history
        self.global_history.append({
            'speaker': speaker,
            'content': message,
            'timestamp': datetime.now().isoformat()
        })
    
    def select_next_speakers(self, current_message, last_speaker_name=None):
        """Select which agent(s) should respond next with NATURAL variety"""
        if not self.agents:
            return []
        
        agent_list = list(self.agents.values())
        
        # Filter out the last speaker to prevent self-response
        if last_speaker_name:
            agent_list = [a for a in agent_list if a.name != last_speaker_name]
        
        if not agent_list:
            return []
        
        # Add natural randomness to selection
        if self.conversation_mode == 'turn-by-turn':
            # Mostly round-robin, but sometimes skip or double-up
            if random.random() < 0.2:  # 20% chance of variation
                selected = [random.choice(agent_list)]
            else:
                selected = [agent_list[self.turn_index % len(agent_list)]]
                self.turn_index += 1
            
        elif self.conversation_mode == 'aggressive':
            # Variable responses - sometimes 1, sometimes 2-3
            if random.random() < 0.3:  # 30% single voice stands out
                selected = [random.choice(agent_list)]
            else:
                num_responders = min(random.randint(2, 3), len(agent_list))
                # Weight by who hasn't spoken recently
                weights = [1.0 / (a.message_count + 1) for a in agent_list]
                selected = random.choices(agent_list, weights=weights, k=min(num_responders, len(agent_list)))
                selected = list(set(selected))  # Remove duplicates
            
        elif self.conversation_mode == 'fireside':
            # Balanced participation with occasional spontaneous interjection
            if random.random() < 0.15:  # 15% spontaneous
                selected = [random.choice(agent_list)]
            else:
                selected = [min(agent_list, key=lambda a: a.message_count)]
        else:
            # Default: weighted random - agents who spoke less are more likely
            weights = [2.0 / (a.message_count + 1) for a in agent_list]
            selected = [random.choices(agent_list, weights=weights, k=1)[0]]
        
        # Occasionally allow TWO agents to respond even in turn-by-turn (15% chance)
        if self.conversation_mode == 'turn-by-turn' and random.random() < 0.15 and len(agent_list) > 1:
            second_agent = random.choice([a for a in agent_list if a not in selected])
            selected.append(second_agent)
            print(f'🔥 Spontaneous second opinion!')
        
        print(f'🎯 Selected speakers: {[a.name for a in selected]} (mode={self.conversation_mode})')
        return selected
    
    def generate_responses(self, prompt, sender='User'):
        """Generate responses from selected agents with RAG retrieval"""
        selected_agents = self.select_next_speakers(prompt, last_speaker_name=sender)
        responses = []
        
        # Retrieve relevant context from knowledge base
        retrieved_context = knowledge_base.retrieve(prompt, top_k=2)
        if retrieved_context:
            print(f'📖 Retrieved {len(retrieved_context)} relevant chunks from knowledge base')
        
        for agent in selected_agents:
            try:
                message = agent.generate_response(
                    current_prompt=prompt,
                    conversation_mode=self.conversation_mode,
                    conversation_topic=self.conversation_topic,
                    retrieved_context=retrieved_context if retrieved_context else None
                )
                
                # Add to all agents' memories
                self.add_message_to_all_memories(agent.name, message)
                
                responses.append({
                    'agent': agent.name,
                    'agentIndex': agent.index,
                    'message': message,
                    'personality': agent.personality,
                    'type': 'agent',
                    'timestamp': datetime.now().isoformat()
                })
                
                print(f'💬 {agent.name}: {message}')
                
            except Exception as e:
                print(f'❌ Failed to generate response from {agent.name}')
                import traceback
                traceback.print_exc()
        
        return responses


# ===== GLOBAL CONVERSATION MANAGER =====
conversation_manager = ConversationManager()


# ===== ROUTES & SOCKET HANDLERS =====
@app.route('/')
def index():
    return "Swarms WebSocket Server Running"

@app.route('/health')
def health():
    return {"status": "healthy", "server": "Socket.IO Server"}

@app.route('/upload_document', methods=['POST'])
def upload_document():
    """Upload a document to the knowledge base"""
    try:
        data = request.json
        text = data.get('text', '')
        filename = data.get('filename', 'uploaded_document')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        knowledge_base.add_document(text, filename)
        
        return jsonify({
            'success': True,
            'message': f'Document "{filename}" added to knowledge base',
            'total_chunks': len(knowledge_base.documents)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/knowledge_status', methods=['GET'])
def knowledge_status():
    """Get knowledge base status"""
    return jsonify({
        'total_chunks': len(knowledge_base.documents),
        'sources': list(set([doc['source'] for doc in knowledge_base.documents]))
    })

@app.route('/clear_knowledge', methods=['POST'])
def clear_knowledge():
    """Clear the knowledge base"""
    knowledge_base.clear()
    return jsonify({'success': True, 'message': 'Knowledge base cleared'})

@socketio.on('connect')
def handle_connect():
    print(f'🔌 Client connected: {request.sid}')
    emit('connection_response', {'status': 'connected', 'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'🔌 Client disconnected: {request.sid}')

@socketio.on('register_agents')
def handle_register_agents(data):
    """Register agents with their personalities"""
    agents_data = data.get('agents', {})
    conversation_manager.register_agents(agents_data)
    socketio.emit('agents_registered', {'count': len(conversation_manager.agents)})

@socketio.on('update_simulation_settings')
def handle_simulation_settings(data):
    """Update conversation mode and topic"""
    mode = data.get('mode', 'turn-by-turn')
    topic = data.get('topic', 'General Discussion')
    conversation_manager.update_settings(mode, topic)

@socketio.on('user_message')
def handle_user_message(data):
    """Handle message from user and trigger agent-to-agent conversation"""
    user_name = data.get('username', 'User')
    message = data.get('message', '')
    print(f'📥 User message from {user_name}: {message}')
    
    # Add user message to all agent memories
    conversation_manager.add_message_to_all_memories(user_name, message)
    
    # Generate initial responses from selected agents
    responses = conversation_manager.generate_responses(message, user_name)
    
    # Emit each agent response
    for response in responses:
        socketio.emit('new_message', response)
    
    # Continue conversation: LONG, FLUID, NATURAL FLOW
    import time
    
    # MUCH longer conversations - let it develop naturally
    if conversation_manager.conversation_mode == 'aggressive':
        num_turns = random.randint(12, 20)  # Heated debates go longer
    elif conversation_manager.conversation_mode == 'fireside':
        num_turns = random.randint(8, 15)  # Reflective but substantial
    else:
        num_turns = random.randint(10, 18)  # Default: long flowing conversation
    
    print(f'🔄 Continuing conversation for {num_turns} turns...')
    
    for turn in range(num_turns):
        # Fast-paced conversation - short pauses like real chat
        pause = random.uniform(0.8, 2.0)  # Quick responses
        time.sleep(pause)
        
        # Get the last agent's message as the prompt for next response
        if conversation_manager.global_history:
            last_message = conversation_manager.global_history[-1]
            last_speaker = last_message['speaker']
            last_content = last_message['content']
            
            # Generate response from different agent(s)
            responses = conversation_manager.generate_responses(last_content, last_speaker)
            
            # Emit each agent response
            for response in responses:
                socketio.emit('new_message', response)
                
                # If multiple responses, tiny pause between them
                if len(responses) > 1:
                    time.sleep(0.3)

@socketio.on('start_auto_conversation')
def handle_auto_conversation(data):
    """Start autonomous conversation between agents"""
    if not conversation_manager.agents:
        emit('error', {'message': 'No agents registered'})
        return
    
    # Generate initial prompt based on topic
    initial_prompt = f"Let's discuss: {conversation_manager.conversation_topic}. Share your initial perspective."
    print(f'🎬 Starting auto-conversation on topic: {conversation_manager.conversation_topic}')
    
    # Add system message to memories
    conversation_manager.add_message_to_all_memories('System', initial_prompt)
    
    # Generate responses
    responses = conversation_manager.generate_responses(initial_prompt, 'System')
    
    # Emit each agent response
    for response in responses:
        socketio.emit('new_message', response)


if __name__ == '__main__':
    print('🚀 Starting Swarms WebSocket Server...')
    print('📡 Server running on http://localhost:5001')
    print('📡 WebSocket endpoint: ws://localhost:5001/socket.io/')
    socketio.run(app, host='127.0.0.1', port=5001, debug=False, allow_unsafe_werkzeug=True)
