import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './BreadyChat.css';
import * as tf from '@tensorflow/tfjs';
import { UniversalSentenceEncoder } from '@tensorflow-models/universal-sentence-encoder';
import OpenAI from 'openai';

function BreadyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Bready, your smart shopping assistant! 🤖 First, could you please share your ZIP code so I can show you available items in your area? 📍", sender: 'bot' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [zipCode, setZipCode] = useState(localStorage.getItem('user_zip_code') || '');
  const [availableItems, setAvailableItems] = useState([]);
  const [budgetMode, setBudgetMode] = useState({
    active: false,
    budget: 0,
    analyzing: false
  });
  const [conversationContext, setConversationContext] = useState({
    lastTopic: null,
    lastItems: [],
    lastMeal: null,
    expectingFollowUp: false,
    suggestedItems: [],
    memory: {
      recentTopics: [],
      preferences: {},
      previousRequests: [],
      rejectedSuggestions: [],
      successfulSuggestions: [],
      shoppingPatterns: {},
      lastInteractionTimestamp: null,
      currentTopic: null,
      topicHistory: [],
      topicSwitches: 0
    }
  });
  const messagesEndRef = useRef(null);
  const [encoder, setEncoder] = useState(null);
  const [intentsEmbeddings, setIntentsEmbeddings] = useState(null);
  const [openai] = useState(() => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key is not set in environment variables');
      return null;
    }
    return new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  });

  // Load messages and shopping history from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem('bready_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('bready_messages', JSON.stringify(messages));
  }, [messages]);

  // Load available items for ZIP code
  useEffect(() => {
    const loadAvailableItems = async () => {
      if (!zipCode) return;
      
      try {
        // Simulate API call - replace with actual endpoint in production
        const mockItems = [
          { item: 'pasta', stores: ['Store A', 'Store B'] },
          { item: 'tomato sauce', stores: ['Store A'] },
          { item: 'bread', stores: ['Store C'] },
          // Add more items as needed
        ];
        setAvailableItems(mockItems);
        localStorage.setItem('user_zip_code', zipCode);
      } catch (error) {
        console.error('Error loading available items:', error);
        setMessages(prev => [...prev, {
          text: "I'm having trouble getting the available items in your area. Please try again later.",
          sender: 'bot',
          className: 'error'
        }]);
      }
    };

    loadAvailableItems();
  }, [zipCode]);

  // Add memory persistence
  useEffect(() => {
    const savedContext = localStorage.getItem('bready_context');
    if (savedContext) {
      setConversationContext(prev => ({
        ...prev,
        memory: {
          ...prev.memory,
          ...JSON.parse(savedContext)
        }
      }));
    }
  }, []);

  // Save context updates
  useEffect(() => {
    localStorage.setItem('bready_context', JSON.stringify(conversationContext.memory));
  }, [conversationContext.memory]);

  const updateMemory = (update) => {
    setConversationContext(prev => ({
      ...prev,
      memory: {
        ...prev.memory,
        ...update,
        lastInteractionTimestamp: new Date().toISOString()
      }
    }));
  };

  const analyzeShoppingPattern = (item) => {
    const { memory } = conversationContext;
    const patterns = memory.shoppingPatterns || {};
    
    if (!patterns[item]) {
      patterns[item] = {
        frequency: 1,
        lastPurchased: new Date().toISOString(),
        timesBought: 1,
        associatedItems: []
      };
    } else {
      patterns[item].frequency++;
      patterns[item].timesBought++;
      patterns[item].lastPurchased = new Date().toISOString();
    }

    updateMemory({ shoppingPatterns: patterns });
  };

  const getContextualResponse = (input, result) => {
    const { memory } = conversationContext;
    const recentTopics = memory.recentTopics || [];
    const now = new Date();
    const lastInteraction = memory.lastInteractionTimestamp ? new Date(memory.lastInteractionTimestamp) : null;
    const timeSinceLastInteraction = lastInteraction ? (now - lastInteraction) / 1000 / 60 : null; // in minutes

    // Add current topic to recent topics
    const currentTopic = result.mealType || (result.items.length > 0 ? 'shopping' : null);
    if (currentTopic) {
      recentTopics.unshift(currentTopic);
      if (recentTopics.length > 5) recentTopics.pop();
      updateMemory({ recentTopics });
    }

    // Generate contextual response
    let response = '';
    
    // If returning after a while
    if (timeSinceLastInteraction > 60) { // More than an hour
      response += "Welcome back! ";
    }

    // If we have shopping patterns
    if (result.items.length > 0) {
      const patterns = memory.shoppingPatterns || {};
      result.items.forEach(item => {
        if (patterns[item.item]) {
          const lastPurchased = new Date(patterns[item.item].lastPurchased);
          const daysSinceLastPurchase = Math.floor((now - lastPurchased) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastPurchase < 7) {
            response += `I notice you bought ${item.item} recently. Make sure you need more! `;
          }
        }
        analyzeShoppingPattern(item.item);
      });
    }

    // Add main response
    if (result.mealType) {
      response += `I've added all the ingredients for ${result.mealType} to your cart! `;
      
      // Check if they've made this meal before
      if (recentTopics.includes(result.mealType)) {
        response += "I remember you enjoy making this! ";
      }
      
      response += "Would you like me to suggest some side dishes that are available in your area? 🍽️";
    } else if (result.items.length > 0) {
      const itemsList = result.items.map(item => 
        `${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.item}`
      ).join(', ');
      
      response += `I've added ${itemsList} to your cart! You now have ${result.updatedCart.length} items total. `;
      
      // Add contextual suggestions based on patterns
      const commonPairings = findCommonPairings(result.items);
      if (commonPairings.length > 0) {
        response += `I notice you often get ${commonPairings.join(', ')} with these items. Would you like me to add those too? `;
      } else {
        response += "Would you like me to suggest any complementary items that are available? 🛒";
      }
    }

    return response;
  };

  const findCommonPairings = (items) => {
    const { shoppingPatterns } = conversationContext.memory;
    const pairings = new Set();
    
    items.forEach(item => {
      if (shoppingPatterns[item.item]?.associatedItems) {
        shoppingPatterns[item.item].associatedItems.forEach(pairing => {
          if (availableItems.some(available => available.item === pairing)) {
            pairings.add(pairing);
          }
        });
      }
    });
    
    return Array.from(pairings).slice(0, 3);
  };

  const filterAvailableItems = (items) => {
    if (!zipCode || !availableItems.length) return [];
    return items.filter(item => 
      availableItems.some(available => 
        available.item.toLowerCase() === item.item.toLowerCase()
      )
    );
  };

  // Add typing simulation utilities
  const calculateTypingDelay = (text) => {
    // Base delay of 500ms
    const baseDelay = 500;
    // Average typing speed (characters per minute)
    const typingSpeed = 400;
    // Calculate delay based on message length (minimum 1 second, maximum 4 seconds)
    const delay = Math.min(Math.max(
      (text.length / (typingSpeed / 60)) * 1000,
      1000
    ), 4000);
    return baseDelay + delay;
  };

  const simulateTyping = async (messageToSend, className = '') => {
    setIsTyping(true);
    
    // Calculate delay based on message length and type
    const delay = calculateTypingDelay(messageToSend);
    
    // Add random variation (±20%) to make it feel more natural
    const variation = delay * 0.2;
    const finalDelay = delay + (Math.random() * variation * 2 - variation);
    
    await new Promise(resolve => setTimeout(resolve, finalDelay));
    
    setMessages(prev => [...prev, {
      text: messageToSend,
      sender: 'bot',
      className
    }]);
    setIsTyping(false);
  };

  // Add semantic understanding utilities
  const intentExamples = {
    add_to_cart: [
      "I need to buy",
      "Add to my cart",
      "Can you add",
      "I want to get",
      "Put in my cart",
      "I'd like to purchase",
      "Get me some",
      "Add some",
      "I need",
      "Could you add"
    ],
    remove_from_cart: [
      "Remove from cart",
      "Take out",
      "Delete from cart",
      "Remove the",
      "I don't want",
      "Take away",
      "Remove",
      "Delete"
    ],
    check_availability: [
      "Do you have",
      "Is there",
      "Check if you have",
      "Available",
      "In stock",
      "Can I get",
      "Do you sell",
      "Looking for"
    ],
    recipe_help: [
      "How do I make",
      "Recipe for",
      "Help me cook",
      "I want to cook",
      "Show me how to make",
      "Cooking instructions",
      "How to prepare"
    ],
    meal_planning: [
      "Plan my meals",
      "What should I cook",
      "Meal ideas",
      "Dinner suggestions",
      "What to make for",
      "Help me plan",
      "Suggest a meal"
    ],
    budget_related: [
      "How much is",
      "Price of",
      "Cost of",
      "Cheaper options",
      "Budget friendly",
      "Save money",
      "Affordable",
      "Within budget"
    ]
  };

  // Initialize the sentence encoder
  useEffect(() => {
    const loadEncoder = async () => {
      try {
        const model = await UniversalSentenceEncoder.load();
        setEncoder(model);
        
        // Pre-compute embeddings for intent examples
        const allExamples = [];
        const intentMapping = [];
        
        Object.entries(intentExamples).forEach(([intent, examples]) => {
          examples.forEach(example => {
            allExamples.push(example);
            intentMapping.push(intent);
          });
        });
        
        const embeddings = await model.embed(allExamples);
        setIntentsEmbeddings({ embeddings, intentMapping });
        
      } catch (error) {
        console.error('Error loading sentence encoder:', error);
      }
    };
    
    loadEncoder();
  }, []);

  const cosineSimilarity = (a, b) => {
    const dotProduct = tf.sum(tf.mul(a, b));
    const normA = tf.sqrt(tf.sum(tf.square(a)));
    const normB = tf.sqrt(tf.sum(tf.square(b)));
    return tf.div(dotProduct, tf.mul(normA, normB));
  };

  const findBestMatch = async (input) => {
    if (!encoder || !intentsEmbeddings) return null;
    
    try {
      const inputEmbedding = await encoder.embed([input]);
      const similarities = tf.tidy(() => {
        const sims = [];
        for (let i = 0; i < intentsEmbeddings.embeddings.shape[0]; i++) {
          const example = tf.slice(intentsEmbeddings.embeddings, [i, 0], [1, -1]);
          const similarity = cosineSimilarity(inputEmbedding, example);
          sims.push(similarity.dataSync()[0]);
        }
        return sims;
      });
      
      const bestMatchIndex = similarities.indexOf(Math.max(...similarities));
      const confidence = similarities[bestMatchIndex];
      
      if (confidence > 0.7) { // Confidence threshold
        return {
          intent: intentsEmbeddings.intentMapping[bestMatchIndex],
          confidence
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in semantic matching:', error);
      return null;
    }
  };

  const preprocessUserInput = async (input) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a shopping assistant that helps clarify user requests. 
            Rewrite the user's input to be clear and structured, while maintaining their original intent.
            Focus on shopping-related terms and quantities.
            Keep the response concise and natural.
            Do not add any explanations or additional text.
            If the input is already clear, return it as is.`
          },
          {
            role: "user",
            content: "umm like i need sum milk n bread"
          },
          {
            role: "assistant",
            content: "I need some milk and bread"
          },
          {
            role: "user",
            content: "gotta get stuff 4 spagetti"
          },
          {
            role: "assistant",
            content: "I need ingredients for spaghetti"
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: 0.3,
        max_tokens: 60
      });

      const clarifiedInput = response.choices[0].message.content.trim();
      return clarifiedInput;
    } catch (error) {
      console.error('Error preprocessing input:', error);
      return input; // Fall back to original input if preprocessing fails
    }
  };

  // Add topic detection patterns
  const topicPatterns = {
    shopping: /(buy|get|add|cart|shopping|purchase|order)/i,
    recipe: /(recipe|cook|make|prepare|dish|meal|dinner|lunch|breakfast)/i,
    budget: /(budget|price|cost|expensive|cheap|save|money|spend)/i,
    availability: /(available|in stock|have|carry|sell|offer)/i,
    preferences: /(like|prefer|favorite|enjoy|hate|dislike)/i,
    help: /(help|assist|guide|show|explain|how to)/i
  };

  const detectTopic = (input) => {
    const topics = [];
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(input)) {
        topics.push(topic);
      }
    }
    return topics.length > 0 ? topics[0] : null;
  };

  const handleTopicSwitch = (newTopic) => {
    const { memory } = conversationContext;
    const currentTopic = memory.currentTopic;

    if (currentTopic && currentTopic !== newTopic) {
      // Update topic history
      const updatedHistory = [
        { topic: newTopic, timestamp: new Date().toISOString() },
        ...memory.topicHistory.slice(0, 4)
      ];

      // Update memory with new topic information
      updateMemory({
        currentTopic: newTopic,
        topicHistory: updatedHistory,
        topicSwitches: memory.topicSwitches + 1
      });

      // Return appropriate transition message
      return `I see we're switching to ${newTopic}. How can I help you with that?`;
    }

    return null;
  };

  // Add OpenAI function definitions for intent classification
  const intentFunctions = [
    {
      name: "classify_intent",
      description: "Classify the user's intent and extract relevant parameters",
      parameters: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            description: "The classified intent of the user's message",
            enum: [
              "add_to_cart",
              "remove_from_cart",
              "check_availability",
              "recipe_help",
              "meal_planning",
              "budget_related",
              "preferences",
              "greeting",
              "farewell",
              "help",
              "clarification"
            ]
          },
          confidence: {
            type: "number",
            description: "Confidence score of the classification (0-1)"
          },
          parameters: {
            type: "object",
            description: "Extracted parameters based on the intent",
            properties: {
              items: {
                type: "array",
                description: "List of items mentioned",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" }
                  }
                }
              },
              meal_type: { type: "string" },
              budget_amount: { type: "number" },
              preference_type: { type: "string" },
              clarification_type: { type: "string" }
            }
          }
        },
        required: ["intent", "confidence"]
      }
    }
  ];

  const classifyIntent = async (input) => {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a shopping assistant that classifies user intents and extracts relevant parameters. Be precise and concise."
          },
          {
            role: "user",
            content: input
          }
        ],
        functions: intentFunctions,
        function_call: { name: "classify_intent" }
      });

      const result = JSON.parse(response.choices[0].message.function_call.arguments);
      return result;
    } catch (error) {
      console.error('Error classifying intent:', error);
      return null;
    }
  };

  // Update handleSubmit to use intent classification
  const handleSubmit = async (e, overrideInput = null) => {
    if (e) e.preventDefault();
    const input = overrideInput || inputMessage;
    if (!input.trim()) return;

    // Show original user message
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    if (!overrideInput) setInputMessage('');
    setIsTyping(true);

    try {
      // Preprocess the input with GPT-4
      const processedInput = await preprocessUserInput(input);
      
      // Classify intent
      const intentResult = await classifyIntent(processedInput);
      
      if (intentResult && intentResult.confidence > 0.7) {
        // Update memory with intent classification
        updateMemory({
          previousRequests: [
            {
              input: processedInput,
              intent: intentResult.intent,
              parameters: intentResult.parameters
            },
            ...(conversationContext.memory.previousRequests || []).slice(0, 8)
          ]
        });

        // Handle based on intent
        switch (intentResult.intent) {
          case 'add_to_cart':
            if (intentResult.parameters?.items) {
              const result = await handleNaturalLanguageRequest(processedInput);
              if (result.error) {
                await simulateTyping(result.error, 'warning');
              } else {
                const contextualResponse = getContextualResponse(processedInput, result);
                await simulateTyping(contextualResponse);
              }
            }
            break;

          case 'remove_from_cart':
            if (intentResult.parameters?.items) {
              const itemsToRemove = intentResult.parameters.items.map(item => item.name);
              const cartItems = JSON.parse(localStorage.getItem('cartItems_v2') || '[]');
              const updatedCart = cartItems.filter(item => 
                !itemsToRemove.some(toRemove => 
                  item.item.toLowerCase().includes(toRemove.toLowerCase())
                )
              );
              localStorage.setItem('cartItems_v2', JSON.stringify(updatedCart));
              await simulateTyping(`I've removed ${itemsToRemove.join(', ')} from your cart! 🗑️`);
            }
            break;

          case 'check_availability':
            if (intentResult.parameters?.items) {
              const itemsToCheck = intentResult.parameters.items.map(item => item.name);
              const available = itemsToCheck.filter(item => 
                availableItems.some(available => 
                  available.item.toLowerCase().includes(item.toLowerCase())
                )
              );
              const unavailable = itemsToCheck.filter(item => !available.includes(item));
              
              let response = '';
              if (available.length > 0) {
                response += `Yes, ${available.join(', ')} ${available.length === 1 ? 'is' : 'are'} available! `;
              }
              if (unavailable.length > 0) {
                response += `Sorry, ${unavailable.join(', ')} ${unavailable.length === 1 ? 'is' : 'are'} not available in your area.`;
              }
              await simulateTyping(response);
            }
            break;

          case 'recipe_help':
            if (intentResult.parameters?.meal_type) {
              const result = await handleRecipeInput(processedInput);
              if (result.success) {
                const contextualResponse = getContextualResponse(processedInput, {
                  items: result.updatedCart,
                  updatedCart: result.updatedCart
                });
                await simulateTyping(contextualResponse, 'recipe');
              } else {
                await simulateTyping(result.message, 'error');
              }
            }
            break;

          case 'budget_related':
            if (intentResult.parameters?.budget_amount) {
              await handleBudgetMode(intentResult.parameters.budget_amount);
            }
            break;

          case 'preferences':
            if (intentResult.parameters?.preference_type) {
              updateMemory({
                preferences: {
                  ...conversationContext.memory.preferences,
                  [intentResult.parameters.preference_type]: true
                }
              });
              await simulateTyping("I'll remember that preference for future suggestions! 😊");
            }
            break;

          default:
            // Fall back to regular response handling
            const conversationalResponse = getSmartResponse(processedInput);
            if (conversationalResponse) {
              await simulateTyping(conversationalResponse);
            }
        }
      } else {
        // Fall back to regular response handling if intent classification fails
        const conversationalResponse = getSmartResponse(processedInput);
        if (conversationalResponse) {
          await simulateTyping(conversationalResponse);
        }
      }
    } catch (error) {
      console.error('Error processing request:', error);
      await simulateTyping(
        "I'm sorry, I had trouble processing that request. Could you try rephrasing it?",
        'error'
      );
    }

    checkSmartReminders();
  };

  const isSimpleClarification = (original, processed) => {
    // Check if the only differences are capitalization, punctuation, or simple word replacements
    const simplify = (text) => text.toLowerCase()
      .replace(/[.,!?]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/wanna|gonna|gotta/g, 'want to')
      .replace(/(\d+)(?:st|nd|rd|th)/g, '$1');
    
    return simplify(original) === simplify(processed);
  };

  // Update handleZipCodeInput to use typing simulation
  const handleZipCodeInput = async (input) => {
    const zipMatch = input.match(/\b\d{5}\b/);
    if (zipMatch) {
      const newZip = zipMatch[0];
      setZipCode(newZip);
      await simulateTyping(
        `Great! I'll show you items available in ${newZip}. What would you like to add to your cart? 🛒`
      );
      return true;
    }
    return false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const optimizeCart = (budget) => {
    const cartItems = JSON.parse(localStorage.getItem('cartItems_v2') || '[]');
    const originalTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (originalTotal <= budget) {
      return {
        success: true,
        message: "Good news! Your cart is already within budget.",
        originalTotal,
        newTotal: originalTotal,
        savings: 0,
        items: cartItems
      };
    }

    // Sort items by priority (essential first) and price efficiency
    const sortedItems = [...cartItems].sort((a, b) => {
      if (a.essential !== b.essential) return b.essential - a.essential;
      return (a.price / a.quantity) - (b.price / b.quantity);
    });

    let optimizedItems = [];
    let currentTotal = 0;

    for (const item of sortedItems) {
      if (currentTotal + (item.price * item.quantity) <= budget) {
        optimizedItems.push(item);
        currentTotal += item.price * item.quantity;
      } else {
        // Try to add partial quantity if possible
        const remainingBudget = budget - currentTotal;
        const possibleQuantity = Math.floor(remainingBudget / item.price);
        if (possibleQuantity > 0) {
          optimizedItems.push({...item, quantity: possibleQuantity});
          currentTotal += item.price * possibleQuantity;
        }
      }
    }

    return {
      success: true,
      message: "I've optimized your cart to fit within your budget.",
      originalTotal,
      newTotal: currentTotal,
      savings: originalTotal - currentTotal,
      items: optimizedItems
    };
  };

  const handleBudgetMode = async (budget) => {
    const result = optimizeCart(budget);
    
    if (result.success) {
      localStorage.setItem('cartItems_v2', JSON.stringify(result.items));
      
      const messageContent = (
        <div className="optimization-result">
          <div className="optimization-stat">
            Original Total: ${result.originalTotal.toFixed(2)}
          </div>
          <div className="optimization-stat">
            New Total: ${result.newTotal.toFixed(2)}
          </div>
          {result.savings > 0 && (
            <div className="optimization-stat savings">
              Savings: ${result.savings.toFixed(2)}
            </div>
          )}
          <div className="budget-options">
            <div className="budget-option" onClick={() => window.location.href = '/cart'}>
              View Optimized Cart →
            </div>
          </div>
        </div>
      );

      await simulateTyping(
        (
          <>
            {result.message}
            {messageContent}
          </>
        ),
        result.savings > 0 ? 'budget-success' : 'budget-mode'
      );
    } else {
      await simulateTyping(
        "I couldn't optimize your cart at this time. Please try again.",
        'budget-warning'
      );
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setMessages(prev => [...prev, {
        text: "Sorry, voice input is not supported in your browser.",
        sender: 'bot'
      }]);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setMessages(prev => [...prev, {
        text: "Listening...",
        sender: 'bot'
      }]);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      handleSubmit(null, transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setMessages(prev => [...prev, {
        text: "Sorry, I couldn't hear you. Please try again.",
        sender: 'bot'
      }]);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const parseRecipe = async (recipeText) => {
    // First extract ingredients
    const ingredients = recipeText.split('\n')
      .filter(line => line.trim() && !line.toLowerCase().includes('instructions'))
      .map(line => {
        const [quantity, ...rest] = line.trim().split(' ');
        return {
          item: rest.join(' '),
          quantity: parseInt(quantity) || 1,
          essential: true
        };
      });

    // Check if all ingredients are available
    const availableIngredients = filterAvailableItems(ingredients);
    
    if (availableIngredients.length < ingredients.length) {
      const unavailableItems = ingredients
        .filter(item => !availableIngredients.some(available => 
          available.item.toLowerCase() === item.item.toLowerCase()
        ))
        .map(item => item.item)
        .join(', ');
      
      throw new Error(`Sorry, but some ingredients aren't available in your area: ${unavailableItems}`);
    }

    return ingredients;
  };

  const handleRecipeInput = async (recipeText) => {
    try {
      const ingredients = await parseRecipe(recipeText);
      const cartItems = JSON.parse(localStorage.getItem('cartItems_v2') || '[]');
      
      // Add new ingredients to cart
      const updatedCart = [...cartItems];
      ingredients.forEach(ingredient => {
        const existingItem = updatedCart.find(item => 
          item.item.toLowerCase() === ingredient.item.toLowerCase()
        );
        if (existingItem) {
          existingItem.quantity += ingredient.quantity;
        } else {
          updatedCart.push(ingredient);
        }
      });

      localStorage.setItem('cartItems_v2', JSON.stringify(updatedCart));
      return { 
        success: true,
        updatedCart,
        message: `I've added all available ingredients to your cart! You now have ${updatedCart.length} items.`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  };

  const handleNaturalLanguageRequest = async (request) => {
    // Check for ZIP code first
    if (!zipCode) {
      if (handleZipCodeInput(request)) {
        return {
          items: [],
          updatedCart: [],
          mealType: null
        };
      }
      setMessages(prev => [...prev, {
        text: "Before we start shopping, could you please provide your ZIP code? This helps me show you what's available in your area! 📍",
        sender: 'bot'
      }]);
      return {
        items: [],
        updatedCart: [],
        mealType: null
      };
    }

    const requestLower = request.toLowerCase();
    let items = [];

    // Check for meal patterns
    const commonMeals = {
      'pasta night': {
        items: [
          { item: 'pasta', quantity: 1 },
          { item: 'tomato sauce', quantity: 1 },
          { item: 'parmesan cheese', quantity: 1 },
          { item: 'ground beef', quantity: 1 },
          { item: 'onion', quantity: 1 },
          { item: 'garlic', quantity: 1 },
          { item: 'olive oil', quantity: 1 },
          { item: 'basil', quantity: 1 }
        ],
        variations: ['pasta dinner', 'spaghetti night', 'italian dinner']
      },
      'taco tuesday': {
        items: [
          { item: 'taco shells', quantity: 1 },
          { item: 'ground beef', quantity: 1 },
          { item: 'lettuce', quantity: 1 },
          { item: 'tomatoes', quantity: 1 },
          { item: 'cheese', quantity: 1 },
          { item: 'sour cream', quantity: 1 },
          { item: 'avocado', quantity: 1 }
        ],
        variations: ['taco night', 'mexican food', 'tacos']
      }
    };

    // Check for meal patterns including variations
    let selectedMeal = null;
    for (const [meal, data] of Object.entries(commonMeals)) {
      if (data.variations.some(v => requestLower.includes(v)) || requestLower.includes(meal)) {
        // Check if ALL items for this meal are available
        const availableItems = filterAvailableItems(data.items);
        if (availableItems.length === data.items.length) {
          items = availableItems;
          selectedMeal = meal;
        } else {
          return {
            items: [],
            updatedCart: [],
            mealType: null,
            error: `Sorry, but not all items for ${meal} are available in your area. Would you like to see what meals I can make with available items?`
          };
        }
        break;
      }
    }

    if (items.length === 0) {
      // Try to extract individual items with quantities
      const words = requestLower.split(/\s+/);
      const quantityWords = {
        'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'few': 3, 'some': 2, 'couple': 2, 'dozen': 12, 'pack': 1, 'bottle': 1
      };
      
      let currentQuantity = 1;
      let currentItem = '';
      let extractedItems = [];

      words.forEach((word, index) => {
        const numericQuantity = parseInt(word);
        if (!isNaN(numericQuantity)) {
          currentQuantity = numericQuantity;
          return;
        }

        if (quantityWords[word]) {
          currentQuantity = quantityWords[word];
          return;
        }

        if (['and', 'with', 'also', 'plus', 'need', 'want', 'get', 'buy'].includes(word)) {
          if (currentItem) {
            extractedItems.push({
              item: currentItem.trim(),
              quantity: currentQuantity
            });
            currentItem = '';
            currentQuantity = 1;
          }
          return;
        }

        currentItem = currentItem ? `${currentItem} ${word}` : word;
      });

      if (currentItem) {
        extractedItems.push({
          item: currentItem.trim(),
          quantity: currentQuantity
        });
      }

      // Filter extracted items based on availability
      items = filterAvailableItems(extractedItems);
      
      if (items.length === 0 && extractedItems.length > 0) {
        return {
          items: [],
          updatedCart: [],
          mealType: null,
          error: `Sorry, but none of the requested items are available in your area. Would you like to see what's available?`
        };
      }
    }

    const cartItems = JSON.parse(localStorage.getItem('cartItems_v2') || '[]');
    const updatedCart = [...cartItems];
    
    items.forEach(item => {
      const existingItem = updatedCart.find(cartItem => 
        cartItem.item.toLowerCase() === item.item.toLowerCase()
      );
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        updatedCart.push(item);
      }
    });

    localStorage.setItem('cartItems_v2', JSON.stringify(updatedCart));
    
    return { 
      items, 
      updatedCart,
      mealType: selectedMeal,
      error: null
    };
  };

  // Update checkSmartReminders to use typing simulation
  const checkSmartReminders = async () => {
    const shoppingHistory = JSON.parse(localStorage.getItem('shopping_history') || '[]');
    const today = new Date().getDay();
    
    const usualItems = shoppingHistory
      .filter(entry => entry.day === today)
      .reduce((acc, entry) => {
        entry.items.forEach(item => {
          const existing = acc.find(i => i.item === item.item);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ ...item, count: 1 });
          }
        });
        return acc;
      }, [])
      .filter(item => item.count > 2);

    if (usualItems.length > 0) {
      const message = `I notice you usually buy ${usualItems.map(i => i.item).join(', ')} on ${
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today]
      }. Would you like me to add these to your list?`;
      
      await simulateTyping(message, 'reminder');
    }
  };

  const getSmartResponse = (input) => {
    const requestLower = input.toLowerCase().trim();
    
    // Check for ambiguous patterns
    const ambiguousPatterns = {
      vagueRequest: /(want|need|get|buy|find|look for|search for|add|put in cart)/i,
      multipleItems: /(and|with|also|plus|or|either|both)/i,
      unclearQuantity: /(some|few|couple|several|a lot|many|bunch)/i,
      unclearItem: /(thing|stuff|items|groceries|food|ingredients|supplies)/i
    };

    // Check if the input is ambiguous
    let isAmbiguous = false;
    let clarificationNeeded = null;

    if (ambiguousPatterns.vagueRequest.test(requestLower) && 
        (ambiguousPatterns.unclearItem.test(requestLower) || 
         ambiguousPatterns.unclearQuantity.test(requestLower))) {
      isAmbiguous = true;
      clarificationNeeded = "Could you tell me specifically what items you're looking for?";
    } else if (ambiguousPatterns.multipleItems.test(requestLower) && 
               !requestLower.includes("recipe") && 
               !requestLower.includes("meal")) {
      isAmbiguous = true;
      clarificationNeeded = "Would you like me to help you with all of these items, or is there one in particular you'd like to focus on?";
    } else if (ambiguousPatterns.unclearQuantity.test(requestLower)) {
      isAmbiguous = true;
      clarificationNeeded = "Could you let me know how many you'd like to get?";
    }

    if (isAmbiguous) {
      return clarificationNeeded;
    }

    // Enhanced intent patterns with concise responses
    const patterns = {
      greeting: /^(hi|hello|hey|howdy|hola|good (morning|afternoon|evening)|sup|yo|hiya|heya|morning|evening|afternoon)( there| friend| bready)?[!.?]?$/i,
      farewell: /^(bye|goodbye|see you|cya|later|good night|catch you later|peace out|bye bye)[!.?]?$/i,
      gratitude: /^(thanks|thank you|thx|ty|appreciate it|awesome|great job|nice one)[!.?]?$/i,
      help: /(how|what) (can|do) you|help me|what.?s possible|what can i do|show me|guide me/i,
      mood: /how are you|how.?s it going|how.?re you|what.?s up|sup|how.?s your day/i,
      affirmative: /^(yes|yeah|yep|sure|okay|ok|yup|absolutely|definitely|for sure)[!.?]?$/i,
      negative: /^(no|nah|nope|not now|maybe later|not really)[!.?]?$/i,
      banter: /^(you.?re (cool|awesome|fun|smart)|i like you|nice|cool|awesome|funny|clever|smart)[!.?]?$/i,
      joke: /(tell|know) (a |any )?joke|make me laugh|be funny|something funny/i,
      weather: /how.?s the weather|nice day|beautiful day|weather/i,
      identity: /who are you|what are you|what.?s your name|tell me about yourself/i,
      age: /how old|your age|when (were you|did you)|birthday/i,
      opinion: /do you like|what do you think|your (opinion|thought)|favorite/i,
      capabilities: /what can you do|your abilities|features|what.?s possible/i,
      chitchat: /let.?s (talk|chat)|small talk|how.?s life|what.?s new/i,
      followUp: /^(what about|how about|and|then|also|what if|could you|would you|tell me more|more|why|when|where)\b/i,
      clarification: /^(what do you mean|could you explain|i don't understand|what's that|which|specify|clarify)/i,
      suggestion: /^(suggest|recommend|what should|what would|any ideas|help me choose|which one)/i
    };

    // Check for exact matches first
    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(requestLower)) {
        switch (intent) {
          case 'greeting':
            const timeOfDay = new Date().getHours();
            return `Hi! Ready to shop? 😊`;

          case 'farewell':
            return "Bye! Happy shopping! 👋";

          case 'gratitude':
            return "You're welcome! 😊";

          case 'mood':
            return "I'm great! How can I help? 😊";

          case 'banter':
            return "Thanks! You're awesome too! 😊";

          case 'joke':
            const jokes = [
              "Why did the cookie go to the doctor? Because it was feeling crumbly! 🍪",
              "What did the grape say when it got stepped on? Nothing, it just let out a little wine! 🍇",
              "Why don't eggs tell jokes? They'd crack up! 🥚",
              "What do you call a fake noodle? An impasta! 🍝",
              "Why did the grocery store close? It ran out of stock! 🏪"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];

          case 'identity':
            return "I'm Bready, your shopping assistant! 😊";

          case 'capabilities':
            return "I help with shopping, meals, and budgets. What would you like to do? 😊";

          case 'chitchat':
            return "I'm here to help with shopping! What do you need? 😊";

          default:
            return null;
        }
      }
    }

    // If no specific pattern is matched, provide a concise response
    return "How can I help with your shopping? 😊";
  };

  const suggestSides = (mainDish) => {
    const suggestions = {
      'pasta': ['garlic bread', 'caesar salad', 'roasted vegetables'],
      'pizza': ['buffalo wings', 'garden salad', 'breadsticks'],
      'tacos': ['mexican rice', 'refried beans', 'corn salad'],
      'burger': ['french fries', 'coleslaw', 'onion rings'],
      'default': ['mixed salad', 'roasted vegetables', 'dinner rolls']
    };
    
    const potentialItems = suggestions[mainDish.toLowerCase()] || suggestions.default;
    return filterAvailableItems(potentialItems.map(item => ({ item, quantity: 1 })))
      .map(item => item.item);
  };

  const suggestComplementaryItems = (items) => {
    const complementary = {
      'bread': ['butter', 'jam', 'cheese'],
      'pasta': ['parmesan', 'olive oil', 'black pepper'],
      'rice': ['soy sauce', 'vegetables', 'eggs'],
      'chicken': ['seasoning', 'lemon', 'herbs'],
      'default': ['salt', 'pepper', 'olive oil']
    };
    
    const suggestions = items.flatMap(item => 
      complementary[item.toLowerCase()] || complementary.default
    );
    
    return filterAvailableItems(suggestions.map(item => ({ item, quantity: 1 })))
      .map(item => item.item)
      .slice(0, 3);
  };

  const suggestBasedOnHistory = () => {
    const history = JSON.parse(localStorage.getItem('shopping_history') || '[]');
    const frequentItems = history.reduce((acc, entry) => {
      entry.items.forEach(item => {
        acc[item.item] = (acc[item.item] || 0) + 1;
      });
      return acc;
    }, {});
    
    const sortedItems = Object.entries(frequentItems)
      .sort(([,a], [,b]) => b - a)
      .map(([item]) => ({ item, quantity: 1 }));
    
    return filterAvailableItems(sortedItems)
      .map(item => item.item)
      .slice(0, 3);
  };

  const BreadyIcon = () => (
    <span className="bready-emoji" role="img" aria-label="Bready">
      🤖
    </span>
  );

  return (
    <div className="bready-chat-container">
      {!isOpen ? (
        <button 
          className="chat-button"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat with Bready"
        >
          <BreadyIcon />
        </button>
      ) : (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <BreadyIcon />
              <span>Chat with Bready</span>
            </div>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          
          <div className="messages-container">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.sender} ${message.className || ''}`}
              >
                {message.sender === 'bot' && <BreadyIcon />}
                <div className="message-content">
                  {message.text}
                  {message.type === 'reminder' && (
                    <div className="reminder-actions">
                      <button onClick={() => {
                        // Add reminder items to cart
                        const items = message.text.match(/buy (.*?) on/)[1].split(', ');
                        handleNaturalLanguageRequest(items.join(' '));
                        setMessages(prev => prev.filter(m => m !== message));
                      }}>
                        Yes, add them
                      </button>
                      <button onClick={() => {
                        setMessages(prev => prev.filter(m => m !== message));
                      }}>
                        No, thanks
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message bot">
                <BreadyIcon />
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSubmit} className="chat-input-container">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
            />
            <button 
              type="button"
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={handleVoiceInput}
              disabled={isListening}
            >
              🎤
            </button>
            <button 
              type="submit" 
              className="send-button"
              disabled={!inputMessage.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default BreadyChat;