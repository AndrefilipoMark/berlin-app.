/* global process */
import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing Supabase credentials in .env');
    throw new Error('Missing Supabase credentials');
  }

  if (!googleApiKey) {
    console.error('CRITICAL: Missing GOOGLE_GENERATIVE_AI_API_KEY (or GOOGLE_API_KEY) in .env');
    // We don't throw here to allow partial functionality, but AI will fail
  }

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BOTS = {
  ANDRIY: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Андрій Ші 🤖',
    keywords: ['машина', 'авто', 'робота', 'дозвіл', 'документи', 'ремонт', 'техніка', 'айті', 'it', 'комп', 'драйвер', 'права', 'квартира', 'житло', 'пиво', 'бар', 'футбол', 'спорт'],
    systemPrompt: `You are Andriy, a 35-year-old Ukrainian guy living in Berlin (Spandau).
    Persona: Logistics worker, car lover, 'bro' style.
    Tone: Casual, direct, slangy ('ти', 'бро').
    Rules:
    1. Act 100% human.
    2. MEMORY: Use CHAT HISTORY. If user just said "Steglitz", remember they are looking for a DENTIST from previous messages!
    3. IF ASKED FOR SERVICES (Doctors, Lawyers, Beauty, etc):
       - YOU MUST SAY: "Подивись у нас на сайті в розділі 'Послуги' (Services). Там є всі контакти і адреси!"
       - You can mention "Dr. Gennady Esterov" as an example if asked for a dentist.
    4. Don't ask too many follow-up questions. If they want a dentist, GIVE THEM THE ANSWER (check 'Services' tab).`
  },
  TANYUSHA: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Танюша Ші 🌸',
    keywords: ['дитина', 'діти', 'лікар', 'школа', 'садок', 'сумно', 'депресія', 'порадьте', 'краса', 'манікюр', 'кафе', 'ресторан', 'їжа', 'ліки', 'привіт всім', 'привіт усім', 'вітаю всіх', 'питання', 'допомога', 'хтось', 'живий', 'ау', 'підкажіть', 'знає', 'стоматолог', 'зуб'],
    systemPrompt: `You are Tanya, a 30-year-old Ukrainian woman living in Berlin.
    Persona: Volunteer coordinator, helpful friend.
    Tone: Friendly, empathetic.
    Rules:
    1. Act 100% human.
    2. MEMORY: Use CHAT HISTORY. If user says "Steglitz", remember they need a DENTIST.
    3. CRITICAL INSTRUCTION: If user asks for doctors, beauty, or restaurants:
       - YOU MUST SAY: "Зайди в розділ 'Послуги' (Services) у нас на сайті! Там зібрані всі перевірені українські майстри та лікарі."
       - You can add: "Наприклад, там є контакти чудових стоматологів."
       - DO NOT just ask "what district?" again and again. Direct them to the website section!`
  }
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, userName, type = 'chat', messageId, replyToAuthor } = request.body;

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
    
    // Greeting detection (Hello everyone)
    // Updated to catch "доброго вечора" (includes 'добр') and generic "хтось є"
    const isGreeting = (lowerMsg.includes('привіт') || lowerMsg.includes('вітаю') || lowerMsg.includes('добр')) && 
                       (lowerMsg.includes('всім') || lowerMsg.includes('усім') || lowerMsg.includes('всіх') || lowerMsg.includes('народ') || lowerMsg.includes('хтось') || lowerMsg.includes('люди'));

    // Bot Selection Logic (MOVED UP)
    // 1. If Replying to a specific bot -> FORCE that bot
    if (replyToAuthor === BOTS.ANDRIY.name) {
       selectedBot = BOTS.ANDRIY;
    } else if (replyToAuthor === BOTS.TANYUSHA.name) {
       selectedBot = BOTS.TANYUSHA;
    }
    // 2. Greetings -> Tanyusha
    else if (isGreeting) {
       selectedBot = BOTS.TANYUSHA;
    }
    // 3. Explicit Mentions (Override keywords)
    else if (lowerMsg.includes('андрій') || lowerMsg.includes('andriy')) {
      selectedBot = BOTS.ANDRIY;
    } else if (lowerMsg.includes('танюша') || lowerMsg.includes('таня') || lowerMsg.includes('tanyusha') || lowerMsg.includes('тання')) {
      selectedBot = BOTS.TANYUSHA;
    }
    // 5. Keywords (if no context)
    else if (isAndriy && !isTanyusha) {
      selectedBot = BOTS.ANDRIY;
    } else if (isTanyusha && !isAndriy) {
      selectedBot = BOTS.TANYUSHA;
    } else if (isAndriy && isTanyusha) {
      selectedBot = Math.random() > 0.5 ? BOTS.ANDRIY : BOTS.TANYUSHA;
    }
    
    // 3. Fetch Chat History for Context (Last 30 messages)
    let historyContext = "";
    let lastBotUserId = null;

    if (type === 'chat') {
      try {
        const { data: history } = await supabase
          .from('messages')
          .select('content, author_name, user_id, created_at')
          .order('created_at', { ascending: false })
          .limit(30);
          
        if (history && history.length > 0) {
           // Find the last bot that spoke (for sticky context)
           for (const msg of history) {
             if (msg.user_id === BOTS.ANDRIY.id) {
               lastBotUserId = BOTS.ANDRIY.id;
               break;
             }
             if (msg.user_id === BOTS.TANYUSHA.id) {
               lastBotUserId = BOTS.TANYUSHA.id;
               break;
             }
           }
           
           // Apply Sticky Context if no bot selected yet
           if (!selectedBot && lastBotUserId && !isGreeting) {
              const isNegative = lowerMsg.includes('не тобі') || lowerMsg.includes('не тебе');
              if (!isNegative) {
                 if (lastBotUserId === BOTS.ANDRIY.id) selectedBot = BOTS.ANDRIY;
                 else if (lastBotUserId === BOTS.TANYUSHA.id) selectedBot = BOTS.TANYUSHA;
              }
           }

           // Reverse to chronological order for the prompt
           historyContext = history.reverse()
             .map(m => {
               const isMe = selectedBot ? m.user_id === selectedBot.id : false;
               return `${isMe ? 'YOU (' + (selectedBot?.name || 'Bot') + ')' : (m.author_name || 'User')}: ${m.content}`;
             })
             .join('\n');
        }
      } catch (err) {
        console.warn('Failed to fetch history:', err);
      }
    }

    if (!selectedBot) {
       // NO RANDOM FALLBACK. Silence is golden.
       return response.status(200).json({ skipped: true });
    }
    
    // Modify system prompt for Tanyusha
    if (selectedBot.id === BOTS.TANYUSHA.id) {
       // No override needed, default prompt is good
    }
    
    // If replying directly to bot, make instructions stricter to ANSWER the question
    let replyInstruction = "";
    if (replyToAuthor === selectedBot.name) {
       replyInstruction = `\nIMPORTANT: The user is REPLYING DIRECTLY TO YOU. You MUST answer their specific question or comment. Do not ignore it.`;
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
    console.log('Generating response for bot:', selectedBot.name);
    
    try {
      // Use gemini-2.0-flash for best performance
      const { text } = await generateText({
        model: google('gemini-2.0-flash', { apiKey: googleApiKey }), 
        system: selectedBot.systemPrompt + contextInstruction + replyInstruction +
                `\n\nCURRENT TIME AND DATE: ${new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Berlin' })} (Berlin Time)\n` +
                `\n\nCHAT HISTORY (Older messages first):\n${historyContext}\n\n` +
                `INSTRUCTION: Analyze the CHAT HISTORY above to understand the context. ` +
                `Reply specifically to the last message from ${userName}. ` +
                `If the user asks a follow-up question (e.g. "how much?", "really?", "and you?"), REFER to the CHAT HISTORY to understand what they are talking about. ` +
                `If the user is asking a general question to everyone ("Hello everyone..."), answer it. ` +
                `If the user is replying to someone else and not you, and your name is not mentioned, you can choose to stay silent (reply with empty string) or give a very short comment if you have strong expertise. ` +
                `But since you were selected by the system, you SHOULD probably reply. Just keep it relevant.`,
        prompt: `User ${userName || 'Friend'} said: "${message}". Reply naturally.`,
      });

      console.log('Response generated successfully:', text ? 'YES' : 'NO');

      // Save response to DB
      if (type === 'chat') {
        const { error } = await supabase.from('messages').insert({
          content: text,
          user_id: selectedBot.id,
          reply_to_id: messageId || null // Link the reply to the user's message
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

    } catch (genError) {
       console.error('Generation Error:', genError);
       
       // Fallback response instead of 500
       let fallbackText = "Вибач, щось пішло не так з моїм з'єднанням. Спробуй пізніше.";

       // DEBUG: Add specific error message to the response if it's an API key issue
       if (genError.message && (genError.message.includes('API key') || genError.message.includes('400') || genError.message.includes('401'))) {
          fallbackText += ` (Debug: ${genError.message})`;
       }
       
       if (type === 'chat') {
          await supabase.from('messages').insert({
            content: fallbackText,
            user_id: selectedBot.id,
            reply_to_id: messageId || null
          });
       }
       
       return response.status(200).json({ 
         success: true, 
         bot: selectedBot.name, 
         reply: fallbackText,
         error: genError.message 
       });
       // return response.status(500).json({ error: 'AI Generation Failed: ' + genError.message });
    }

  } catch (error) {
    console.error('Auto-reply error:', error);
    return response.status(500).json({ error: error.message });
  }
}
