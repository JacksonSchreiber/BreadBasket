import unittest
import json
import os
import tempfile
from datetime import datetime
from unittest.mock import MagicMock, patch
from langchain_engine import ShoppingMemory, ShoppingTools, PersonaPromptTemplate, ShoppingAgent

class TestShoppingMemory(unittest.TestCase):
    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False)
        self.memory = ShoppingMemory(self.temp_file.name)

    def tearDown(self):
        self.temp_file.close()
        os.unlink(self.temp_file.name)

    def test_initialization(self):
        """Test memory initialization"""
        self.assertEqual(self.memory.chat_memory.messages, [])
        self.assertEqual(self.memory.shopping_patterns, {})
        self.assertEqual(self.memory.preferences, {})
        self.assertEqual(self.memory.topic_history, [])

    def test_save_and_load_memory(self):
        """Test memory persistence"""
        # Add some test data
        self.memory.chat_memory.messages = ["test message"]
        self.memory.shopping_patterns = {"bread": {"frequency": 1}}
        self.memory.preferences = {"vegetarian": True}
        self.memory.topic_history = [{"topic": "shopping", "timestamp": "2024-01-01"}]
        
        # Save memory
        self.memory.save_memory()
        
        # Create new memory instance and load
        new_memory = ShoppingMemory(self.temp_file.name)
        new_memory.load_memory()
        
        # Verify data was saved and loaded correctly
        self.assertEqual(new_memory.chat_memory.messages, ["test message"])
        self.assertEqual(new_memory.shopping_patterns, {"bread": {"frequency": 1}})
        self.assertEqual(new_memory.preferences, {"vegetarian": True})
        self.assertEqual(new_memory.topic_history, [{"topic": "shopping", "timestamp": "2024-01-01"}])

class TestShoppingTools(unittest.TestCase):
    def setUp(self):
        self.memory = MagicMock()
        self.tools = ShoppingTools(self.memory)

    def test_tool_initialization(self):
        """Test tool initialization"""
        tool_names = [tool.name for tool in self.tools.tools]
        expected_tools = [
            "add_to_cart",
            "remove_from_cart",
            "check_availability",
            "get_recipe",
            "check_budget"
        ]
        self.assertEqual(set(tool_names), set(expected_tools))

    def test_add_to_cart(self):
        """Test add to cart functionality"""
        test_items = json.dumps([{"name": "bread", "quantity": 2}])
        response = self.tools.add_to_cart(test_items)
        self.assertIn("Added", response)
        self.assertIn("items to cart", response)

    def test_remove_from_cart(self):
        """Test remove from cart functionality"""
        test_items = json.dumps([{"name": "bread"}])
        response = self.tools.remove_from_cart(test_items)
        self.assertIn("Removed", response)
        self.assertIn("items from cart", response)

    def test_check_availability(self):
        """Test availability check functionality"""
        test_items = json.dumps([{"name": "bread"}])
        response = self.tools.check_availability(test_items)
        self.assertIn("Checked availability", response)

class TestPersonaPromptTemplate(unittest.TestCase):
    def setUp(self):
        self.template = PersonaPromptTemplate()

    def test_prompt_initialization(self):
        """Test prompt template initialization"""
        self.assertIsNotNone(self.template.user_persona)
        self.assertIsNotNone(self.template.assistant_persona)
        self.assertIsNotNone(self.template.system_prompt)

    def test_get_prompt_template(self):
        """Test prompt template generation"""
        template = self.template.get_prompt_template()
        self.assertIsNotNone(template)
        self.assertEqual(
            set(template.input_variables),
            {"input", "chat_history", "agent_scratchpad", "tools", "tool_names"}
        )

class TestShoppingAgent(unittest.TestCase):
    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False)
        self.agent = ShoppingAgent(self.temp_file.name)

    def tearDown(self):
        self.temp_file.close()
        os.unlink(self.temp_file.name)

    @patch('langchain_engine.ChatOpenAI')
    def test_agent_initialization(self, mock_chat):
        """Test agent initialization"""
        self.assertIsNotNone(self.agent.memory)
        self.assertIsNotNone(self.agent.tools)
        self.assertIsNotNone(self.agent.persona_template)
        self.assertIsNotNone(self.agent.llm)
        self.assertIsNotNone(self.agent.agent)
        self.assertIsNotNone(self.agent.agent_executor)

    @patch('langchain_engine.AgentExecutor.run')
    def test_process_message(self, mock_run):
        """Test message processing"""
        mock_run.return_value = "Test response"
        response = self.agent.process_message("Hello")
        self.assertEqual(response, "Test response")
        mock_run.assert_called_once()

    def test_get_context(self):
        """Test context retrieval"""
        context = self.agent.get_context()
        self.assertIn('messages', context)
        self.assertIn('shopping_patterns', context)
        self.assertIn('preferences', context)
        self.assertIn('topic_history', context)
        self.assertIn('user_persona', context)
        self.assertIn('assistant_persona', context)

    def test_update_persona(self):
        """Test persona updates"""
        new_user_persona = "New user persona"
        new_assistant_persona = "New assistant persona"
        
        self.agent.update_persona(new_user_persona, new_assistant_persona)
        
        self.assertEqual(self.agent.persona_template.user_persona, new_user_persona)
        self.assertEqual(self.agent.persona_template.assistant_persona, new_assistant_persona)

    def test_clear_memory(self):
        """Test memory clearing"""
        # Add some test data
        self.agent.memory.chat_memory.messages = ["test message"]
        self.agent.memory.shopping_patterns = {"bread": {"frequency": 1}}
        
        # Clear memory
        self.agent.clear_memory()
        
        # Verify memory was cleared
        self.assertEqual(self.agent.memory.chat_memory.messages, [])
        self.assertEqual(self.agent.memory.shopping_patterns, {})

class TestConversationFlow(unittest.TestCase):
    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False)
        self.agent = ShoppingAgent(self.temp_file.name)

    def tearDown(self):
        self.temp_file.close()
        os.unlink(self.temp_file.name)

    @patch('langchain_engine.AgentExecutor.run')
    def test_shopping_flow(self, mock_run):
        """Test complete shopping conversation flow"""
        # Test adding items
        mock_run.return_value = "Added 2 loaves of bread to your cart! 🛒"
        response = self.agent.process_message("Add 2 loaves of bread to my cart")
        self.assertIn("Added", response)
        self.assertIn("bread", response)

        # Test checking availability
        mock_run.return_value = "Yes, milk is available! Would you like me to add it to your cart?"
        response = self.agent.process_message("Do you have milk in stock?")
        self.assertIn("available", response.lower())

        # Test recipe help
        mock_run.return_value = "I can help you make a sandwich! Here are the ingredients..."
        response = self.agent.process_message("How do I make a sandwich?")
        self.assertIn("help", response.lower())
        self.assertIn("ingredients", response.lower())

        # Test budget check
        mock_run.return_value = "Your current cart total is $15. Would you like me to suggest some budget-friendly alternatives?"
        response = self.agent.process_message("What's my current total?")
        self.assertIn("total", response.lower())
        self.assertIn("$", response)

if __name__ == '__main__':
    unittest.main() 