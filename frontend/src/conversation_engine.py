from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import os

class Memory:
    def __init__(self):
        self.recent_topics: List[str] = []
        self.preferences: Dict[str, Any] = {}
        self.previous_requests: List[Dict[str, Any]] = []
        self.rejected_suggestions: List[str] = []
        self.successful_suggestions: List[str] = []
        self.shopping_patterns: Dict[str, Dict[str, Any]] = {}
        self.last_interaction: Optional[datetime] = None
        self.current_topic: Optional[str] = None
        self.topic_history: List[Dict[str, str]] = []
        self.topic_switches: int = 0

    def update(self, update_data: Dict[str, Any]) -> None:
        """Update memory with new data"""
        for key, value in update_data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.last_interaction = datetime.now()

    def save(self, file_path: str) -> None:
        """Save memory to file"""
        memory_data = {
            'recent_topics': self.recent_topics,
            'preferences': self.preferences,
            'previous_requests': self.previous_requests,
            'rejected_suggestions': self.rejected_suggestions,
            'successful_suggestions': self.successful_suggestions,
            'shopping_patterns': self.shopping_patterns,
            'last_interaction': self.last_interaction.isoformat() if self.last_interaction else None,
            'current_topic': self.current_topic,
            'topic_history': self.topic_history,
            'topic_switches': self.topic_switches
        }
        with open(file_path, 'w') as f:
            json.dump(memory_data, f)

    @classmethod
    def load(cls, file_path: str) -> 'Memory':
        """Load memory from file"""
        if not os.path.exists(file_path):
            return cls()
        
        with open(file_path, 'r') as f:
            memory_data = json.load(f)
        
        memory = cls()
        for key, value in memory_data.items():
            if key == 'last_interaction' and value:
                value = datetime.fromisoformat(value)
            setattr(memory, key, value)
        return memory

class IntentClassifier:
    def __init__(self):
        self.intent_patterns = {
            'add_to_cart': r'(buy|get|add|cart|shopping|purchase|order)',
            'remove_from_cart': r'(remove|delete|take out|from cart)',
            'check_availability': r'(available|in stock|have|carry|sell|offer)',
            'recipe_help': r'(recipe|cook|make|prepare|dish|meal)',
            'budget_related': r'(budget|price|cost|expensive|cheap|save|money)',
            'preferences': r'(like|prefer|favorite|enjoy|hate|dislike)',
            'help': r'(help|assist|guide|show|explain|how to)'
        }

    def classify(self, text: str) -> Dict[str, Any]:
        """Classify the intent of the input text"""
        import re
        intents = []
        for intent, pattern in self.intent_patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                intents.append(intent)
        
        if not intents:
            return {'intent': 'unknown', 'confidence': 0.0}
        
        return {
            'intent': intents[0],
            'confidence': 1.0 if len(intents) == 1 else 0.7
        }

class ResponseGenerator:
    def __init__(self, memory: Memory):
        self.memory = memory

    def generate_response(self, intent: str, parameters: Dict[str, Any]) -> str:
        """Generate a response based on intent and parameters"""
        if intent == 'add_to_cart':
            items = parameters.get('items', [])
            if not items:
                return "What items would you like to add to your cart?"
            
            item_list = ', '.join([f"{item['quantity']}x {item['name']}" for item in items])
            return f"I've added {item_list} to your cart! 🛒"

        elif intent == 'remove_from_cart':
            items = parameters.get('items', [])
            if not items:
                return "What items would you like to remove from your cart?"
            
            item_list = ', '.join([item['name'] for item in items])
            return f"I've removed {item_list} from your cart! 🗑️"

        elif intent == 'check_availability':
            items = parameters.get('items', [])
            if not items:
                return "What items would you like to check for availability?"
            
            available_items = [item['name'] for item in items if self._check_availability(item['name'])]
            unavailable_items = [item['name'] for item in items if not self._check_availability(item['name'])]
            
            response = []
            if available_items:
                response.append(f"Yes, {', '.join(available_items)} {'is' if len(available_items) == 1 else 'are'} available!")
            if unavailable_items:
                response.append(f"Sorry, {', '.join(unavailable_items)} {'is' if len(unavailable_items) == 1 else 'are'} not available.")
            
            return ' '.join(response)

        elif intent == 'recipe_help':
            meal_type = parameters.get('meal_type')
            if not meal_type:
                return "What recipe would you like help with?"
            
            return f"I can help you with {meal_type}! Would you like the ingredients list? 🍽️"

        elif intent == 'budget_related':
            budget = parameters.get('budget_amount')
            if not budget:
                return "What's your budget for this shopping trip?"
            
            return f"I'll help you stay within your budget of ${budget:.2f}! 💰"

        return "I'm not sure how to help with that. Could you rephrase your request?"

    def _check_availability(self, item_name: str) -> bool:
        """Check if an item is available (to be implemented with actual availability check)"""
        # This should be replaced with actual availability checking logic
        return True

class ConversationEngine:
    def __init__(self, memory_file: str = 'conversation_memory.json'):
        self.memory = Memory.load(memory_file)
        self.intent_classifier = IntentClassifier()
        self.response_generator = ResponseGenerator(self.memory)
        self.memory_file = memory_file

    def process_message(self, message: str) -> str:
        """Process a user message and generate a response"""
        # Classify intent
        intent_result = self.intent_classifier.classify(message)
        
        # Update memory
        self.memory.update({
            'previous_requests': [{
                'message': message,
                'intent': intent_result['intent'],
                'timestamp': datetime.now().isoformat()
            }] + self.memory.previous_requests[:9]
        })
        
        # Generate response
        response = self.response_generator.generate_response(
            intent_result['intent'],
            intent_result.get('parameters', {})
        )
        
        # Save memory
        self.memory.save(self.memory_file)
        
        return response

    def get_context(self) -> Dict[str, Any]:
        """Get current conversation context"""
        return {
            'current_topic': self.memory.current_topic,
            'recent_topics': self.memory.recent_topics,
            'topic_history': self.memory.topic_history,
            'preferences': self.memory.preferences
        }

    def clear_memory(self) -> None:
        """Clear conversation memory"""
        self.memory = Memory()
        self.memory.save(self.memory_file) 