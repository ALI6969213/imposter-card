// Dynamic Prompt Generator - Creates spicy/edgy questions with variety
// Questions are suggestive but not explicit NSFW

class PromptGenerator {
  constructor() {
    // Templates for majority prompts (the "normal" question)
    this.majorityTemplates = [
      // Age/Number based
      { q: "How old were you when you had your first kiss?", pair: "How old were you when you started high school?" },
      { q: "How many people have you dated?", pair: "How many best friends have you had?" },
      { q: "How old was the oldest person you've been attracted to?", pair: "How old was the oldest teacher you've had?" },
      { q: "What's the longest you've gone without showering?", pair: "What's the longest you've gone without your phone?" },
      { q: "How many times have you been rejected?", pair: "How many times have you failed a test?" },
      { q: "What's your body count... of energy drinks in one day?", pair: "What's your record for hours slept in one day?" },
      
      // Secrets/Confessions
      { q: "What's the most embarrassing thing in your search history?", pair: "What's the most boring thing in your search history?" },
      { q: "What's something you've done that would disappoint your parents?", pair: "What's something you've done that made your parents proud?" },
      { q: "What's the biggest lie you've told a partner?", pair: "What's the biggest lie you've told at work?" },
      { q: "What's your most toxic trait in relationships?", pair: "What's your most annoying habit at home?" },
      { q: "What would ruin your reputation if it got out?", pair: "What would surprise people to learn about you?" },
      { q: "What's the worst thing you've done while drunk?", pair: "What's the funniest thing you've done while tired?" },
      
      // Relationships/Dating
      { q: "What's your biggest red flag?", pair: "What's your biggest pet peeve?" },
      { q: "Describe your type without saying their name", pair: "Describe your dream vacation without saying where" },
      { q: "What's the craziest thing you've done to impress someone?", pair: "What's the craziest thing you've done on a dare?" },
      { q: "What's your most unhinged dating app bio idea?", pair: "What's your most creative excuse for being late?" },
      { q: "What's the fastest you've fallen for someone?", pair: "What's the fastest you've finished a Netflix series?" },
      { q: "How far would you travel for a hookup?", pair: "How far would you travel for good food?" },
      
      // Would you rather / Hypotheticals
      { q: "What would you do for a million dollars that others wouldn't?", pair: "What would you never do even for a million dollars?" },
      { q: "What's your price to kiss a stranger?", pair: "What's your price to eat something gross?" },
      { q: "What celebrity would you risk it all for?", pair: "What celebrity would you want as a mentor?" },
      { q: "What's your most controversial bedroom opinion?", pair: "What's your most controversial food opinion?" },
      
      // Embarrassing/Cringe
      { q: "What's the most embarrassing thing you've been caught doing?", pair: "What's the most embarrassing autocorrect you've sent?" },
      { q: "What's your cringiest flirting attempt?", pair: "What's your cringiest childhood memory?" },
      { q: "What nickname would your ex give you?", pair: "What nickname would your coworkers give you?" },
      { q: "What's the weirdest thing you find attractive?", pair: "What's the weirdest thing you're scared of?" },
      { q: "What's something you pretend to like to seem cool?", pair: "What's something everyone likes but you don't?" },
      
      // Dark humor / Edgy
      { q: "What's the worst text you've sent to the wrong person?", pair: "What's the most boring text in your recent chats?" },
      { q: "What illegal thing do you do regularly?", pair: "What unhealthy thing do you do regularly?" },
      { q: "What have you stolen?", pair: "What have you accidentally broken?" },
      { q: "What's the meanest thing you've thought about someone here?", pair: "What's the nicest thing you've thought about someone here?" },
      { q: "What's your villain origin story?", pair: "What's your superhero origin story?" },
      
      // Personal/Vulnerable
      { q: "What insecurity keeps you up at night?", pair: "What random thought keeps you up at night?" },
      { q: "What's your most irrational jealousy?", pair: "What's your most irrational fear?" },
      { q: "What do you judge others for but do yourself?", pair: "What do you wish you were better at?" },
      { q: "What's the pettiest reason you've rejected someone?", pair: "What's the pettiest argument you've been in?" },
      { q: "What's your 3am confession?", pair: "What's your 3am snack?" },
    ];

    // Additional variety through modifiers
    this.subjects = [
      "your crush", "your ex", "a stranger", "your best friend",
      "someone at this party", "your celebrity crush", "a coworker"
    ];

    this.timeframes = [
      "this week", "this month", "this year", "in high school",
      "in college", "last night", "at 3am", "on a first date"
    ];

    this.locations = [
      "at school", "at work", "at a party", "in public",
      "at home", "in a car", "at the gym", "at a wedding"
    ];

    // Track used prompts to avoid repeats
    this.usedPrompts = new Set();
  }

  // Generate a fresh prompt pair
  generate(category = 'random') {
    // Get available templates
    let availableTemplates = this.majorityTemplates.filter(
      t => !this.usedPrompts.has(t.q)
    );

    // Reset if we've used too many
    if (availableTemplates.length < 5) {
      this.usedPrompts.clear();
      availableTemplates = this.majorityTemplates;
    }

    // Pick a random template
    const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    this.usedPrompts.add(template.q);

    // Optionally add variety with modifiers (30% chance)
    let majorityPrompt = template.q;
    let imposterPrompt = template.pair;

    if (Math.random() < 0.3 && this.canModify(majorityPrompt)) {
      const modifier = this.getRandomModifier();
      majorityPrompt = this.applyModifier(majorityPrompt, modifier);
      imposterPrompt = this.applyModifier(imposterPrompt, modifier);
    }

    return {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: 'generated',
      majority: majorityPrompt,
      imposter: imposterPrompt,
    };
  }

  // Check if prompt can be modified
  canModify(prompt) {
    return prompt.includes('someone') || 
           prompt.includes('person') || 
           !prompt.includes('you');
  }

  // Get random modifier
  getRandomModifier() {
    const types = ['subject', 'timeframe', 'location'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch (type) {
      case 'subject':
        return { type, value: this.subjects[Math.floor(Math.random() * this.subjects.length)] };
      case 'timeframe':
        return { type, value: this.timeframes[Math.floor(Math.random() * this.timeframes.length)] };
      case 'location':
        return { type, value: this.locations[Math.floor(Math.random() * this.locations.length)] };
    }
  }

  // Apply modifier to prompt
  applyModifier(prompt, modifier) {
    if (modifier.type === 'timeframe' && !prompt.includes('when')) {
      return `${prompt.replace('?', '')} ${modifier.value}?`;
    }
    if (modifier.type === 'location' && !prompt.includes('where')) {
      return `${prompt.replace('?', '')} ${modifier.value}?`;
    }
    return prompt;
  }

  // Generate multiple unique prompts
  generateBatch(count = 10) {
    const prompts = [];
    for (let i = 0; i < count; i++) {
      prompts.push(this.generate());
    }
    return prompts;
  }

  // Get template count for variety indication
  getVarietyCount() {
    return this.majorityTemplates.length;
  }
}

module.exports = PromptGenerator;
