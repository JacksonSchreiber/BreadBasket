from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json
import os
import time
import sqlite3
import logging
import requests
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.agents import Tool, AgentExecutor, LLMSingleActionAgent
from langchain.schema import AgentAction, AgentFinish
from langchain.memory import ConversationBufferMemory
from langchain.tools import BaseTool
import speech_recognition as sr
from gtts import gTTS
import numpy as np
from pocketsphinx import LiveSpeech
import tempfile
import openai
from collections import defaultdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('conversation_logs.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('ShoppingAssistant')

class ShoppingMemory(ConversationBufferMemory):
    def __init__(self, memory_file: str = 'conversation_memory.json', db_file: str = 'conversation_history.db'):
        super().__init__()
        self.memory_file = memory_file
        self.db_file = db_file
        self._init_db()
        self.load_memory()
        
        # Initialize short-term memory
        self.short_term_memory = {
            'interactions': [],  # Last 5 user interactions
            'timestamps': [],    # Timestamps of interactions
            'intents': [],       # Detected intents
            'tools_used': []     # Tools used in each interaction
        }
        self.max_short_term_memory = 5  # Maximum number of interactions to remember
        
        # Initialize long-term memory
        self.long_term_memory = {
            'preferences': {
                'dietary_restrictions': [],  # e.g., ['vegetarian', 'gluten-free']
                'allergies': [],            # e.g., ['nuts', 'dairy']
                'favorite_cuisines': [],    # e.g., ['italian', 'mexican']
                'budget_range': None,       # e.g., 'low', 'medium', 'high'
                'shopping_frequency': None, # e.g., 'weekly', 'bi-weekly'
                'store_preferences': [],    # e.g., ['whole foods', 'trader joes']
                'favorite_items': {},       # e.g., {'category': ['item1', 'item2']}
                'disliked_items': [],       # Items the user doesn't like
                'cooking_skill_level': None # e.g., 'beginner', 'intermediate', 'advanced'
            },
            'shopping_history': {
                'frequent_items': {},       # Items frequently purchased
                'purchase_patterns': {},    # Patterns in shopping behavior
                'budget_tracking': [],      # Historical budget data
                'last_shopping_date': None  # Last shopping date
            },
            'interaction_history': {
                'total_interactions': 0,
                'common_requests': {},      # Frequently asked questions/tasks
                'satisfaction_ratings': [], # User satisfaction ratings
                'feedback_history': []      # User feedback
            }
        }

    def _init_db(self) -> None:
        """Initialize SQLite database with required tables"""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            
            # Create conversations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_input TEXT NOT NULL,
                    assistant_response TEXT NOT NULL,
                    intent TEXT,
                    confidence REAL,
                    tools_used TEXT,
                    context TEXT
                )
            ''')
            
            # Create preferences table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS preferences (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    preference_type TEXT NOT NULL,
                    value TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            ''')
            
            # Create shopping history table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS shopping_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    item TEXT NOT NULL,
                    category TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            ''')
            
            conn.commit()

    def load_memory(self) -> None:
        """Load memory from file and database"""
        # Load JSON memory file
        if os.path.exists(self.memory_file):
            with open(self.memory_file, 'r') as f:
                memory_data = json.load(f)
                self.chat_memory.messages = memory_data.get('messages', [])
                self.shopping_patterns = memory_data.get('shopping_patterns', {})
                self.preferences = memory_data.get('preferences', {})
                self.topic_history = memory_data.get('topic_history', [])
                self.short_term_memory = memory_data.get('short_term_memory', {
                    'interactions': [],
                    'timestamps': [],
                    'intents': [],
                    'tools_used': []
                })
                self.long_term_memory = memory_data.get('long_term_memory', self.long_term_memory)
        
        # Load preferences from database
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            
            # Load preferences
            cursor.execute('SELECT preference_type, value FROM preferences')
            for pref_type, value in cursor.fetchall():
                if pref_type in self.long_term_memory['preferences']:
                    if isinstance(self.long_term_memory['preferences'][pref_type], list):
                        if value not in self.long_term_memory['preferences'][pref_type]:
                            self.long_term_memory['preferences'][pref_type].append(value)
                    else:
                        self.long_term_memory['preferences'][pref_type] = value
            
            # Load shopping history
            cursor.execute('SELECT item, category FROM shopping_history')
            for item, category in cursor.fetchall():
                if category not in self.long_term_memory['shopping_history']['frequent_items']:
                    self.long_term_memory['shopping_history']['frequent_items'][category] = []
                if item not in self.long_term_memory['shopping_history']['frequent_items'][category]:
                    self.long_term_memory['shopping_history']['frequent_items'][category].append(item)

    def save_memory(self) -> None:
        """Save memory to file and database"""
        # Save to JSON file
        memory_data = {
            'messages': self.chat_memory.messages,
            'shopping_patterns': self.shopping_patterns,
            'preferences': self.preferences,
            'topic_history': self.topic_history,
            'short_term_memory': self.short_term_memory,
            'long_term_memory': self.long_term_memory
        }
        with open(self.memory_file, 'w') as f:
            json.dump(memory_data, f)
        
        # Save to database
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            
            # Save preferences
            for pref_type, value in self.long_term_memory['preferences'].items():
                if isinstance(value, list):
                    for v in value:
                        cursor.execute(
                            'INSERT INTO preferences (preference_type, value, timestamp) VALUES (?, ?, ?)',
                            (pref_type, v, datetime.now().isoformat())
                        )
                else:
                    cursor.execute(
                        'INSERT INTO preferences (preference_type, value, timestamp) VALUES (?, ?, ?)',
                        (pref_type, str(value), datetime.now().isoformat())
                    )
            
            # Save shopping history
            for category, items in self.long_term_memory['shopping_history']['frequent_items'].items():
                for item in items:
                    cursor.execute(
                        'INSERT INTO shopping_history (item, category, timestamp) VALUES (?, ?, ?)',
                        (item, category, datetime.now().isoformat())
                    )
            
            conn.commit()

    def log_conversation(self, 
                        user_input: str, 
                        assistant_response: str, 
                        intent: Optional[str] = None,
                        confidence: Optional[float] = None,
                        tools_used: Optional[List[str]] = None,
                        context: Optional[Dict[str, Any]] = None) -> None:
        """Log a conversation to the database"""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute(
                '''INSERT INTO conversations 
                   (timestamp, user_input, assistant_response, intent, confidence, tools_used, context)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (
                    datetime.now().isoformat(),
                    user_input,
                    assistant_response,
                    intent,
                    confidence,
                    json.dumps(tools_used) if tools_used else None,
                    json.dumps(context) if context else None
                )
            )
            conn.commit()

    def get_conversation_history(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get conversation history from the database"""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            query = 'SELECT * FROM conversations ORDER BY timestamp DESC'
            if limit:
                query += f' LIMIT {limit}'
            cursor.execute(query)
            
            conversations = []
            for row in cursor.fetchall():
                conversations.append({
                    'id': row[0],
                    'timestamp': row[1],
                    'user_input': row[2],
                    'assistant_response': row[3],
                    'intent': row[4],
                    'confidence': row[5],
                    'tools_used': json.loads(row[6]) if row[6] else None,
                    'context': json.loads(row[7]) if row[7] else None
                })
            return conversations

    def clear_conversation_history(self) -> None:
        """Clear all conversation history from the database"""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM conversations')
            conn.commit()

    def get_preferences_history(self) -> List[Dict[str, Any]]:
        """Get history of preference changes"""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM preferences ORDER BY timestamp DESC')
            
            preferences = []
            for row in cursor.fetchall():
                preferences.append({
                    'id': row[0],
                    'preference_type': row[1],
                    'value': row[2],
                    'timestamp': row[3]
                })
            return preferences

    def get_shopping_history(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get shopping history, optionally filtered by category"""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            query = 'SELECT * FROM shopping_history'
            params = []
            
            if category:
                query += ' WHERE category = ?'
                params.append(category)
            
            query += ' ORDER BY timestamp DESC'
            cursor.execute(query, params)
            
            history = []
            for row in cursor.fetchall():
                history.append({
                    'id': row[0],
                    'item': row[1],
                    'category': row[2],
                    'timestamp': row[3]
                })
            return history

    def update_short_term_memory(self, 
                               user_input: str, 
                               assistant_response: str, 
                               intent: Optional[str] = None,
                               tools_used: Optional[List[str]] = None) -> None:
        """Update short-term memory with the latest interaction"""
        timestamp = datetime.now().isoformat()
        
        # Add new interaction
        self.short_term_memory['interactions'].append({
            'user': user_input,
            'assistant': assistant_response
        })
        self.short_term_memory['timestamps'].append(timestamp)
        self.short_term_memory['intents'].append(intent)
        self.short_term_memory['tools_used'].append(tools_used or [])
        
        # Keep only the last N interactions
        for key in self.short_term_memory:
            if len(self.short_term_memory[key]) > self.max_short_term_memory:
                self.short_term_memory[key] = self.short_term_memory[key][-self.max_short_term_memory:]
        
        self.save_memory()

    def get_short_term_memory(self) -> Dict[str, Any]:
        """Get the current short-term memory"""
        return {
            'interactions': self.short_term_memory['interactions'],
            'timestamps': self.short_term_memory['timestamps'],
            'intents': self.short_term_memory['intents'],
            'tools_used': self.short_term_memory['tools_used']
        }

    def clear_short_term_memory(self) -> None:
        """Clear short-term memory"""
        self.short_term_memory = {
            'interactions': [],
            'timestamps': [],
            'intents': [],
            'tools_used': []
        }
        self.save_memory()

    def get_recent_context(self) -> str:
        """Get a formatted string of recent interactions for context"""
        if not self.short_term_memory['interactions']:
            return "No recent interactions."
        
        context = []
        for i, (interaction, timestamp, intent, tools) in enumerate(zip(
            self.short_term_memory['interactions'],
            self.short_term_memory['timestamps'],
            self.short_term_memory['intents'],
            self.short_term_memory['tools_used']
        )):
            context.append(f"Interaction {i+1} ({timestamp}):")
            context.append(f"User: {interaction['user']}")
            context.append(f"Assistant: {interaction['assistant']}")
            if intent:
                context.append(f"Intent: {intent}")
            if tools:
                context.append(f"Tools used: {', '.join(tools)}")
            context.append("---")
        
        return "\n".join(context)

    def update_long_term_memory(self, category: str, key: str, value: Any) -> None:
        """Update long-term memory with new information"""
        if category in self.long_term_memory:
            if isinstance(self.long_term_memory[category], dict):
                self.long_term_memory[category][key] = value
            elif isinstance(self.long_term_memory[category], list):
                if value not in self.long_term_memory[category]:
                    self.long_term_memory[category].append(value)
        self.save_memory()

    def get_long_term_memory(self, category: Optional[str] = None) -> Dict[str, Any]:
        """Get long-term memory, optionally filtered by category"""
        if category:
            return self.long_term_memory.get(category, {})
        return self.long_term_memory

    def update_preferences(self, preference_type: str, value: Any) -> None:
        """Update user preferences in long-term memory"""
        if preference_type in self.long_term_memory['preferences']:
            if isinstance(self.long_term_memory['preferences'][preference_type], list):
                if value not in self.long_term_memory['preferences'][preference_type]:
                    self.long_term_memory['preferences'][preference_type].append(value)
            else:
                self.long_term_memory['preferences'][preference_type] = value
        self.save_memory()

    def update_shopping_history(self, item: str, category: str) -> None:
        """Update shopping history with new item"""
        if category not in self.long_term_memory['shopping_history']['frequent_items']:
            self.long_term_memory['shopping_history']['frequent_items'][category] = []
        
        if item not in self.long_term_memory['shopping_history']['frequent_items'][category]:
            self.long_term_memory['shopping_history']['frequent_items'][category].append(item)
        
        # Update last shopping date
        self.long_term_memory['shopping_history']['last_shopping_date'] = datetime.now().isoformat()
        self.save_memory()

    def update_interaction_history(self, request_type: str, satisfaction: Optional[int] = None, feedback: Optional[str] = None) -> None:
        """Update interaction history with new request and optional feedback"""
        self.long_term_memory['interaction_history']['total_interactions'] += 1
        
        # Update common requests
        if request_type not in self.long_term_memory['interaction_history']['common_requests']:
            self.long_term_memory['interaction_history']['common_requests'][request_type] = 0
        self.long_term_memory['interaction_history']['common_requests'][request_type] += 1
        
        # Add satisfaction rating if provided
        if satisfaction is not None:
            self.long_term_memory['interaction_history']['satisfaction_ratings'].append(satisfaction)
        
        # Add feedback if provided
        if feedback:
            self.long_term_memory['interaction_history']['feedback_history'].append({
                'timestamp': datetime.now().isoformat(),
                'feedback': feedback
            })
        
        self.save_memory()

    def get_preferences_summary(self) -> str:
        """Get a formatted summary of user preferences"""
        preferences = self.long_term_memory['preferences']
        summary = []
        
        if preferences['dietary_restrictions']:
            summary.append(f"Dietary restrictions: {', '.join(preferences['dietary_restrictions'])}")
        if preferences['allergies']:
            summary.append(f"Allergies: {', '.join(preferences['allergies'])}")
        if preferences['favorite_cuisines']:
            summary.append(f"Favorite cuisines: {', '.join(preferences['favorite_cuisines'])}")
        if preferences['budget_range']:
            summary.append(f"Budget range: {preferences['budget_range']}")
        if preferences['shopping_frequency']:
            summary.append(f"Shopping frequency: {preferences['shopping_frequency']}")
        if preferences['store_preferences']:
            summary.append(f"Preferred stores: {', '.join(preferences['store_preferences'])}")
        if preferences['cooking_skill_level']:
            summary.append(f"Cooking skill level: {preferences['cooking_skill_level']}")
        
        return "\n".join(summary) if summary else "No preferences set yet."

class ShoppingTools:
    def __init__(self, memory: ShoppingMemory):
        self.memory = memory
        self.tools = [
            Tool(
                name="add_to_cart",
                func=self.add_to_cart,
                description="Add items to the shopping cart. Input should be a JSON string with items and quantities."
            ),
            Tool(
                name="remove_from_cart",
                func=self.remove_from_cart,
                description="Remove items from the shopping cart. Input should be a JSON string with item names."
            ),
            Tool(
                name="check_availability",
                func=self.check_availability,
                description="Check if items are available. Input should be a JSON string with item names."
            ),
            Tool(
                name="get_recipe",
                func=self.get_recipe,
                description="Get recipe information. Input should be a JSON string with meal type."
            ),
            Tool(
                name="check_budget",
                func=self.check_budget,
                description="Check budget constraints. Input should be a JSON string with budget amount."
            )
        ]

    def add_to_cart(self, input_str: str) -> str:
        """Add items to cart"""
        try:
            items = json.loads(input_str)
            # Implementation for adding to cart
            return f"Added {len(items)} items to cart"
        except Exception as e:
            return f"Error adding to cart: {str(e)}"

    def remove_from_cart(self, input_str: str) -> str:
        """Remove items from cart"""
        try:
            items = json.loads(input_str)
            # Implementation for removing from cart
            return f"Removed {len(items)} items from cart"
        except Exception as e:
            return f"Error removing from cart: {str(e)}"

    def check_availability(self, input_str: str) -> str:
        """Check item availability"""
        try:
            items = json.loads(input_str)
            # Implementation for checking availability
            return f"Checked availability for {len(items)} items"
        except Exception as e:
            return f"Error checking availability: {str(e)}"

    def get_recipe(self, input_str: str) -> str:
        """Get recipe information"""
        try:
            recipe = json.loads(input_str)
            # Implementation for getting recipe
            return f"Retrieved recipe for {recipe['meal_type']}"
        except Exception as e:
            return f"Error getting recipe: {str(e)}"

    def check_budget(self, input_str: str) -> str:
        """Check budget constraints"""
        try:
            budget = json.loads(input_str)
            # Implementation for checking budget
            return f"Checked budget of ${budget['amount']}"
        except Exception as e:
            return f"Error checking budget: {str(e)}"

class PersonaPromptTemplate:
    def __init__(self):
        self.user_persona = """
        You are a helpful shopping assistant named Bready. Your personality traits are:
        - Friendly and approachable
        - Knowledgeable about groceries and recipes
        - Proactive in suggesting items and meal ideas
        - Mindful of budgets and preferences
        - Patient and understanding
        - Empathetic to shopping needs
        
        Your communication style:
        - Use emojis sparingly to add warmth
        - Keep responses concise but informative
        - Ask clarifying questions when needed
        - Provide clear, actionable suggestions
        - Maintain a helpful but professional tone
        """

        self.assistant_persona = """
        You are interacting with a user who:
        - May be new to shopping or experienced
        - Has specific dietary preferences or restrictions
        - Might be budget-conscious
        - Could be planning meals or just getting essentials
        - May need help with recipes or meal planning
        """

        self.system_prompt = """
        You are Bready, a friendly and knowledgeable shopping assistant. Your primary goal is to help users with their shopping needs while maintaining a warm and helpful demeanor.

        Core Personality Traits:
        1. Empathetic and Understanding
           - Acknowledge user concerns and preferences
           - Show genuine interest in their needs
           - Be patient with questions and clarifications

        2. Proactive and Helpful
           - Anticipate potential needs based on context
           - Suggest relevant items or alternatives
           - Offer helpful tips and advice when appropriate

        3. Knowledgeable and Reliable
           - Provide accurate information about products
           - Share relevant nutritional information
           - Offer cooking and storage tips when relevant

        4. Budget-Conscious
           - Consider price points in suggestions
           - Recommend cost-effective alternatives
           - Help users stay within their budget

        Communication Guidelines:
        1. Tone and Style
           - Use a friendly but professional tone
           - Adapt language to user's level of expertise
           - Be clear and concise in explanations
           - Use emojis sparingly to add warmth

        2. Response Structure
           - Start with a brief acknowledgment
           - Provide the main information or answer
           - Include relevant suggestions or follow-ups
           - End with an open-ended question when appropriate

        3. Error Handling
           - Acknowledge mistakes gracefully
           - Provide clear explanations for errors
           - Offer alternative solutions
           - Maintain a positive tone even when correcting

        4. Personalization
           - Remember user preferences and restrictions
           - Reference past interactions when relevant
           - Adapt suggestions based on user history
           - Consider dietary needs and allergies

        Task-Specific Guidelines:
        1. Shopping Assistance
           - Help find specific items
           - Suggest alternatives when items are unavailable
           - Provide price comparisons
           - Consider store locations and availability

        2. Recipe Suggestions
           - Consider available ingredients
           - Account for dietary restrictions
           - Suggest appropriate portion sizes
           - Include preparation tips

        3. Budget Planning
           - Help create shopping lists within budget
           - Suggest cost-effective alternatives
           - Consider seasonal pricing
           - Recommend bulk purchases when appropriate

        4. Inventory Management
           - Track items in stock
           - Suggest restocking when needed
           - Consider expiration dates
           - Help organize shopping lists

        Remember to:
        - Always maintain a helpful and positive attitude
        - Be proactive in offering assistance
        - Consider the user's context and history
        - Provide clear and actionable information
        - Use appropriate tools for each task
        - Keep track of shopping patterns and preferences
        """

        # Define communication styles
        self.communication_styles = {
            'formal': {
                'greetings': ['Greetings', 'Hello', 'Good day'],
                'farewells': ['Thank you for your time', 'Have a pleasant day', 'Best regards'],
                'acknowledgments': ['I understand', 'I comprehend', 'I acknowledge'],
                'suggestions': ['I would recommend', 'Might I suggest', 'I propose'],
                'questions': ['May I inquire', 'Would you be interested in', 'Could you please clarify'],
                'emojis': False,
                'contractions': False
            },
            'casual': {
                'greetings': ['Hey there', 'Hi', 'Hello'],
                'farewells': ['Thanks', 'Take care', 'See you later'],
                'acknowledgments': ['Got it', 'I see', 'Cool'],
                'suggestions': ['How about', 'You might like', 'Check this out'],
                'questions': ['Want to know', 'How about', 'What do you think about'],
                'emojis': True,
                'contractions': True
            }
        }
        
        self.current_style = 'casual'  # Default style

    def set_communication_style(self, style: str) -> None:
        """Set the communication style (formal or casual)"""
        if style.lower() in self.communication_styles:
            self.current_style = style.lower()
        else:
            logger.warning(f"Invalid communication style: {style}. Using default style.")

    def get_style_guidelines(self) -> str:
        """Get guidelines for the current communication style"""
        style = self.communication_styles[self.current_style]
        guidelines = [
            f"Communication Style: {self.current_style.title()}",
            f"Use {'emojis' if style['emojis'] else 'no emojis'}",
            f"Use {'contractions' if style['contractions'] else 'no contractions'}",
            f"Greetings: {', '.join(style['greetings'])}",
            f"Farewells: {', '.join(style['farewells'])}",
            f"Acknowledgments: {', '.join(style['acknowledgments'])}",
            f"Suggestions: {', '.join(style['suggestions'])}",
            f"Questions: {', '.join(style['questions'])}"
        ]
        return "\n".join(guidelines)

    def get_prompt_template(self) -> PromptTemplate:
        return PromptTemplate(
            input_variables=["input", "chat_history", "agent_scratchpad", "tools", "tool_names"],
            template="""
            {system_prompt}
            
            Communication Style Guidelines:
            {style_guidelines}
            
            Previous conversation:
            {chat_history}
            
            Current input: {input}
            
            Available tools:
            {tools}
            
            Use the following format:
            Question: the input question you must answer
            Thought: you should always think about what to do
            Action: the action to take, should be one of [{tool_names}]
            Action Input: the input to the action
            Observation: the result of the action
            Thought: what you learned from the observation
            Answer: the final answer to the original input question
            
            Begin!
            
            Question: {input}
            {agent_scratchpad}
            """
        )

class ConversationLogger:
    def __init__(self, log_file: str = 'conversation_logs.json'):
        self.log_file = log_file
        self.conversations = []
        self.load_logs()

    def load_logs(self) -> None:
        """Load existing conversation logs"""
        if os.path.exists(self.log_file):
            try:
                with open(self.log_file, 'r') as f:
                    self.conversations = json.load(f)
            except json.JSONDecodeError:
                logger.warning("Failed to load conversation logs, starting fresh")
                self.conversations = []

    def save_logs(self) -> None:
        """Save conversation logs"""
        try:
            with open(self.log_file, 'w') as f:
                json.dump(self.conversations, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save conversation logs: {str(e)}")

    def log_interaction(self, 
                       user_input: str, 
                       assistant_response: str, 
                       intent: Optional[str] = None,
                       confidence: Optional[float] = None,
                       tools_used: Optional[List[str]] = None,
                       context: Optional[Dict[str, Any]] = None) -> None:
        """Log a single interaction"""
        interaction = {
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'assistant_response': assistant_response,
            'intent': intent,
            'confidence': confidence,
            'tools_used': tools_used or [],
            'context': context or {},
            'metadata': {
                'success': True,
                'error': None
            }
        }
        
        self.conversations.append(interaction)
        self.save_logs()
        
        # Log to file and console
        logger.info(f"User: {user_input}")
        logger.info(f"Assistant: {assistant_response}")
        if intent:
            logger.info(f"Intent: {intent} (confidence: {confidence})")
        if tools_used:
            logger.info(f"Tools used: {', '.join(tools_used)}")

    def log_error(self, 
                 user_input: str, 
                 error: Exception, 
                 context: Optional[Dict[str, Any]] = None) -> None:
        """Log an error during interaction"""
        interaction = {
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'assistant_response': None,
            'metadata': {
                'success': False,
                'error': str(error)
            },
            'context': context or {}
        }
        
        self.conversations.append(interaction)
        self.save_logs()
        
        logger.error(f"Error processing input: {user_input}")
        logger.error(f"Error details: {str(error)}")

    def get_conversation_stats(self) -> Dict[str, Any]:
        """Get statistics about conversations"""
        stats = {
            'total_interactions': len(self.conversations),
            'successful_interactions': sum(1 for c in self.conversations if c['metadata']['success']),
            'failed_interactions': sum(1 for c in self.conversations if not c['metadata']['success']),
            'intent_distribution': {},
            'tool_usage': {},
            'average_confidence': 0.0
        }
        
        confidences = []
        for conv in self.conversations:
            if conv.get('intent'):
                stats['intent_distribution'][conv['intent']] = stats['intent_distribution'].get(conv['intent'], 0) + 1
            if conv.get('confidence'):
                confidences.append(conv['confidence'])
            for tool in conv.get('tools_used', []):
                stats['tool_usage'][tool] = stats['tool_usage'].get(tool, 0) + 1
        
        if confidences:
            stats['average_confidence'] = sum(confidences) / len(confidences)
        
        return stats

class ShoppingAgent:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self._init_db()
        self._init_cache()
        self._init_rate_limiter()
        self._init_model_config()
        self._init_location_settings()
        self._init_notification_settings()
        self._init_content_moderation()
        self._init_ab_testing()
        
        # Initialize speech recognition without PyAudio
        self.recognizer = sr.Recognizer()
        self.speech = LiveSpeech(lm=False, keyphrase='hey shopping assistant', kws_threshold=1e-20)
        
    def text_to_speech(self, text: str) -> None:
        """Convert text to speech using gTTS"""
        try:
            tts = gTTS(text=text, lang='en')
            temp_file = "temp_speech.mp3"
            tts.save(temp_file)
            # Here you would implement your preferred way to play the audio file
            # For example, using the system's default media player
            # For now, we'll just save the file
            logging.info(f"Speech saved to {temp_file}")
        except Exception as e:
            logging.error(f"Error in text_to_speech: {str(e)}")
            
    def listen_for_command(self) -> str:
        """Listen for voice commands using speech recognition"""
        try:
            # Use the default microphone without PyAudio
            with sr.Microphone() as source:
                print("Listening...")
                audio = self.recognizer.listen(source)
                text = self.recognizer.recognize_google(audio)
                return text
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            return f"Could not request results; {str(e)}"
        except Exception as e:
            logging.error(f"Error in listen_for_command: {str(e)}")
            return "Error processing audio"

    # ... rest of the existing methods ...