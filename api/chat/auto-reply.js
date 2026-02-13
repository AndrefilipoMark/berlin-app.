import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BOTS = {
  ANDRIY: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Андрій Ші 🤖',
    keywords: ['машина', 'авто', 'робота', 'дозвіл', 'документи', 'ремонт', 'техніка', 'айті', 'it', 'комп', 'драйвер', 'права', 'квартира', 'житло'],
    systemPrompt: `You are Andriy AI (Андрій Ші), a knowledgeable Ukrainian 'bro' living in Berlin. 
    Tone: Casual, direct, uses 'ти', 'бро', 'окей', 'без питань', 'слухай'. 
    Expertise: Cars, legal documents, bureaucracy, work search, flat hunting, tech. 
    Style: Keep it short (1-3 sentences for chat), helpful, sometimes uses light humor. 
    Language: High-quality, natural Ukrainian.
    Context: You are replying to a user in a community chat for Ukrainians in Berlin.`
  },
  TANYUSHA: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Танюша Ші 🌸',
    keywords: ['дитина', 'діти', 'лікар', 'школа', 'садок', 'сумно', 'депресія', 'порадьте', 'краса', 'манікюр', 'кафе', 'ресторан', 'їжа', 'ліки'],
    systemPrompt: `You are Tanyusha AI (Танюша Ші), a caring, empathetic 'big sister' figure living in Berlin. 
    Tone: Very warm, polite, uses 'сонечко', 'люба/любий', 'все буде добре', 'не хвилюйся'. 
    Expertise: Medicine, kids, schools, kindergartens, beauty, mental support, cafes/food, family. 
    Style: Uses many warm emojis (🌸🧸☕💛💙), very supportive and detailed. 
    Language: High-quality, natural Ukrainian.
    Context: You are replying to a user in a community chat for Ukrainians in Berlin.`
  }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, userName, type = 'chat' } = request.body;

    if (!message || !userId) {
      return response.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the sender is a bot (prevent loops)
    if (userId === BOTS.ANDRIY.id || userId === BOTS.TANYUSHA.id) {
      return response.status(200).json({ skipped: true });
    }

    const lowerMsg = message.toLowerCase();
    let selectedBot = null;

    // Keyword detection
    const isAndriy = BOTS.ANDRIY.keywords.some(k => lowerMsg.includes(k));
    const isTanyusha = BOTS.TANYUSHA.keywords.some(k => lowerMsg.includes(k));

    if (isAndriy && !isTanyusha) {
      selectedBot = BOTS.ANDRIY;
    } else if (isTanyusha && !isAndriy) {
      selectedBot = BOTS.TANYUSHA;
    } else if (isAndriy && isTanyusha) {
      // Conflict: Pick random
      selectedBot = Math.random() > 0.5 ? BOTS.ANDRIY : BOTS.TANYUSHA;
    } else {
      // Default: Pick based on context or random
      // Let's analyze the context a bit more or just random
      // If the message is "Андрій Ші" -> force Andriy
      if (lowerMsg.includes('андрій') || lowerMsg.includes('andriy')) {
        selectedBot = BOTS.ANDRIY;
      } else if (lowerMsg.includes('танюша') || lowerMsg.includes('таня') || lowerMsg.includes('tanyusha')) {
        selectedBot = BOTS.TANYUSHA;
      } else {
         selectedBot = Math.random() > 0.5 ? BOTS.ANDRIY : BOTS.TANYUSHA;
      }
    }
    
    // Modify system prompt for Tanyusha to be less "maternal" and more "friendly support"
    if (selectedBot.id === BOTS.TANYUSHA.id) {
       selectedBot.systemPrompt = `You are Tanyusha AI (Танюша Ші), a friendly and supportive community member living in Berlin. 
       Tone: Warm, polite, but NOT overly motherly. Use 'друже', 'привіт', 'рада допомогти'. Avoid excessive 'сонечко', 'любий', 'не хвилюйся'.
       Expertise: Medicine, kids, schools, kindergartens, beauty, mental support, cafes/food, family. 
       Style: Use 1-2 warm emojis max (🌸, ✨, 😊). Be concise and helpful. Don't be too emotional.
       Language: High-quality, natural Ukrainian.
       Context: You are replying to a user in a community chat for Ukrainians in Berlin.`;
    }

    // 2. Add extra instructions for Forum context
    let contextInstruction = '';
    if (type === 'forum_reply') {
      contextInstruction = ` IMPORTANT: You are replying in a public forum thread. 
      - Provide the answer/advice PUBLICLY right here.
      - Do NOT offer to send private messages (DM/PM). 
      - Do NOT ask the user to contact you privately.
      - If recommending a doctor/service, invent a realistic plausible recommendation in Berlin (e.g. "Praxis am Alex", "Dr. Müller in Mitte") or general advice.`;
    }

    // Generate response
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      system: selectedBot.systemPrompt + contextInstruction,
      prompt: `User ${userName || 'Friend'} said: "${message}". Reply naturally.`,
    });

    // Save response to DB
    if (type === 'chat') {
      const { error } = await supabase.from('messages').insert({
        content: text,
        user_id: selectedBot.id,
      });
      if (error) throw error;
    } else if (type === 'forum_reply') {
       // Save forum reply
       const { postId } = request.body;
       if (postId) {
          const { error } = await supabase.from('forum_replies').insert({
            post_id: postId,
            content: text,
            user_id: selectedBot.id,
            author_name: selectedBot.name
          });
          if (error) throw error;
       }
    }

    return response.status(200).json({ 
      success: true, 
      bot: selectedBot.name, 
      reply: text 
    });

  } catch (error) {
    console.error('Auto-reply error:', error);
    return response.status(500).json({ error: error.message });
  }
}
