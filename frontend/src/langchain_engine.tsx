import OpenAI from 'openai';

interface CartItem {
  name: string;
  quantity: number;
}

interface StoredCartItem {
  item: string;
  quantity: number;
  added: string;
}

type MessageRole = 'system' | 'user' | 'assistant';

interface Message {
  role: MessageRole;
  content: string;
}

export class ShoppingAgent {
  private openai: OpenAI;
  private conversationHistory: Message[];
  private cart: StoredCartItem[];
  private readonly CART_STORAGE_KEY = 'cartItems_v2';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.cart = JSON.parse(localStorage.getItem(this.CART_STORAGE_KEY) || '[]');
    this.conversationHistory = [
      {
        role: 'system',
        content: `You are Bready, a smart and helpful shopping assistant. Your personality traits:
- Warm and friendly
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

Your capabilities:
- Find and compare grocery items
- Generate recipes based on ingredients
- Check store availability and prices
- Help with meal planning
- Provide budget-friendly suggestions
- Answer questions about products
- Add items to cart and manage shopping lists

When a user asks about making a specific dish:
1. List all the necessary ingredients
2. Add the ingredients to their cart
3. Provide step-by-step instructions if requested
4. Suggest where to buy the ingredients
5. Offer variations or alternatives if available

For shopping requests:
1. Parse the items and quantities needed
2. Add them to the cart
3. Confirm what was added
4. Suggest related items if appropriate`
      },
      {
        role: 'assistant',
        content: "Hi! I'm Bready, your smart shopping assistant! 🤖 First, could you please share your ZIP code so I can show you available items in your area? 📍"
      }
    ];
  }

  private addToCart(items: CartItem[]) {
    // Get existing cart items
    const existingCart: StoredCartItem[] = JSON.parse(localStorage.getItem(this.CART_STORAGE_KEY) || '[]');
    
    // Format items for storage
    const formattedItems: StoredCartItem[] = items.map(item => ({
      item: item.name,
      quantity: item.quantity,
      added: new Date().toISOString()
    }));
    
    // Update cart
    const updatedCart = [...existingCart, ...formattedItems];
    localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(updatedCart));
    
    // Update local cart reference
    this.cart = updatedCart;
    
    return `Added to your cart: ${items.map(item => `${item.quantity}x ${item.name}`).join(', ')} 🛒`;
  }

  private extractIngredientsFromText(text: string): CartItem[] {
    const ingredients: CartItem[] = [];
    
    if (text.toLowerCase().includes('pizza')) {
      ingredients.push(
        { name: 'Pizza dough', quantity: 1 },
        { name: 'Tomato sauce', quantity: 1 },
        { name: 'Mozzarella cheese', quantity: 2 },
        { name: 'Pepperoni', quantity: 1 },
        { name: 'Mushrooms', quantity: 1 },
        { name: 'Bell peppers', quantity: 2 },
        { name: 'Olive oil', quantity: 1 },
        { name: 'Italian seasoning', quantity: 1 }
      );
    }
    
    return ingredients;
  }

  async process_message(text: string): Promise<string> {
    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: text
      });

      // Check if this is a shopping request
      const lowerText = text.toLowerCase();
      if (lowerText.includes('add') && lowerText.includes('cart')) {
        const ingredients = this.extractIngredientsFromText(text);
        if (ingredients.length > 0) {
          const response = this.addToCart(ingredients);
          this.conversationHistory.push({
            role: 'assistant',
            content: response
          });
          return response;
        }
      }

      // Check if user is asking about cart
      if (lowerText.includes('cart') && (lowerText.includes('empty') || lowerText.includes('check') || lowerText.includes('what'))) {
        const cartItems: StoredCartItem[] = JSON.parse(localStorage.getItem(this.CART_STORAGE_KEY) || '[]');
        if (cartItems.length === 0) {
          return "Your cart is currently empty. Would you like me to help you add some items? 🛒";
        }
        return `Here's what's in your cart:\n${cartItems.map(item => `- ${item.quantity}x ${item.item}`).join('\n')} 🛒`;
      }

      // Process with OpenAI for other requests
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: this.conversationHistory,
        temperature: 0.7,
        max_tokens: 500
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No response from ChatGPT');
      }

      let responseText = completion.choices[0].message.content;
      
      // Check if the response suggests adding items to cart
      const ingredients = this.extractIngredientsFromText(text);
      if (ingredients.length > 0 && text.toLowerCase().includes('yes')) {
        const cartResponse = this.addToCart(ingredients);
        responseText = `${responseText}\n\n${cartResponse}`;
      }

      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseText
      });

      return responseText;
    } catch (error) {
      console.error('Error processing message:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          return "I'm having trouble connecting to the chat service. Please check if your API key is correct.";
        }
        console.error('Error details:', error.message);
      }
      return "I'm sorry, I encountered an error. Please try again.";
    }
  }
} 