export const categories = {
    Dairy: ['milk', 'eggs', 'cheese', 'yogurt', 'butter', 'cream cheese', 'sour cream', 'heavy cream', 'cottage cheese', 'almond milk'],
    Produce: ['apples', 'bananas', 'carrots', 'lettuce', 'tomatoes', 'potatoes', 'onions', 'broccoli', 'spinach', 'avocado', 'strawberries', 'blueberries', 'oranges', 'lemons'],
    Meat: ['chicken breast', 'beef', 'pork', 'fish', 'ground beef', 'bacon', 'sausage', 'turkey', 'ham', 'salmon', 'shrimp'],
    Bakery: ['bread', 'bagels', 'muffins', 'cookies', 'baguette', 'tortillas', 'croissants', 'cake', 'pie', 'rolls', 'brownies'],
    Pantry: ['pasta', 'rice', 'canned beans', 'olive oil', 'flour', 'sugar', 'coffee', 'tea', 'cereal', 'peanut butter', 'jelly', 'honey', 'canned soup', 'canned tuna'],
    Frozen: ['ice cream', 'frozen pizza', 'frozen vegetables', 'frozen fruit', 'frozen meals', 'frozen waffles', 'frozen burritos'],
    Beverages: ['soda', 'juice', 'water', 'beer', 'wine', 'energy drinks', 'sports drinks', 'coffee beans', 'tea bags'],
    Snacks: ['chips', 'crackers', 'popcorn', 'nuts', 'chocolate', 'candy', 'granola bars', 'pretzels', 'trail mix']
  };
  
  export const allItems = Object.values(categories).flat();
  
  export const itemToCategory = {};
  for (const [category, items] of Object.entries(categories)) {
    for (const item of items) {
      itemToCategory[item] = category;
    }
  }

  // Units for common grocery items
  export const itemUnits = {
    'milk': 'gallon',
    'eggs': 'dozen',
    'cheese': 'lb',
    'yogurt': '32 oz',
    'butter': 'lb',
    'cream cheese': '8 oz',
    'apples': 'lb',
    'bananas': 'lb',
    'potatoes': 'lb',
    'bread': 'loaf',
    'chicken breast': 'lb',
    'beef': 'lb',
    'ground beef': 'lb',
    'pasta': '16 oz',
    'rice': 'lb',
    'olive oil': '16 oz',
    'flour': '5 lb',
    'sugar': '4 lb',
    'coffee': '12 oz',
    'water': 'gallon',
    'juice': '64 oz',
  };