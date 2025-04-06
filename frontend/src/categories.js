export const categories = {
    Dairy: ['milk', 'eggs', 'cheese', 'yogurt'],
    Produce: ['apples', 'bananas', 'carrots', 'lettuce'],
    Meat: ['chicken breast', 'beef', 'pork', 'fish'],
    Bakery: ['bread', 'bagels', 'muffins', 'cookies'],
    Pantry: ['pasta', 'rice', 'canned beans', 'olive oil']
  };
  
  export const allItems = Object.values(categories).flat();
  
  export const itemToCategory = {};
  for (const [category, items] of Object.entries(categories)) {
    for (const item of items) {
      itemToCategory[item] = category;
    }
  }