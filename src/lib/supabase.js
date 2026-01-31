import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Перевірка наявності credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE CONFIG ERROR:');
  console.error('supabaseUrl:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.error('supabaseAnonKey:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
  throw new Error('Supabase URL or Anon Key is missing. Check your .env file.');
}

console.log('✅ Supabase client initializing...');
console.log('URL:', supabaseUrl);

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('✅ Supabase client created successfully');

// Helper functions for common operations

/**
 * Статистика по районах: учасники (профілі з district) + детальна статистика (вакансії, житло, послуги).
 * Повертає всі 12 районів Берліна з детальною статистикою.
 */
export const getDistrictsStats = async () => {
  try {
    // Всі 12 районів Берліна
    const allDistricts = [
      'Mitte',
      'Friedrichshain-Kreuzberg',
      'Pankow',
      'Charlottenburg-Wilmersdorf',
      'Spandau',
      'Steglitz-Zehlendorf',
      'Tempelhof-Schöneberg',
      'Neukölln',
      'Treptow-Köpenick',
      'Marzahn-Hellersdorf',
      'Lichtenberg',
      'Reinickendorf'
    ];
    
    // Використовуємо окремі запити з обробкою помилок
    let profiles = [];
    let jobs = [];
    let housing = [];
    let services = [];
    
    try {
      const profilesRes = await supabase.from('profiles').select('district');
      if (!profilesRes.error && profilesRes.data) {
        profiles = profilesRes.data ?? [];
      } else if (profilesRes.error) {
        console.warn('Error loading profiles for districts:', profilesRes.error);
      }
    } catch (e) {
      console.warn('Exception loading profiles for districts:', e);
    }
    
    try {
      // Тепер використовуємо district (якщо є) або location як fallback
      const jobsRes = await supabase.from('jobs').select('location, district');
      if (!jobsRes.error && jobsRes.data) {
        jobs = jobsRes.data ?? [];
      } else if (jobsRes.error) {
        console.warn('Error loading jobs for districts:', jobsRes.error);
      }
    } catch (e) {
      console.warn('Exception loading jobs for districts:', e);
    }
    
    try {
      const housingRes = await supabase.from('housing').select('district');
      if (!housingRes.error && housingRes.data) {
        housing = housingRes.data ?? [];
      } else if (housingRes.error) {
        console.warn('Error loading housing for districts:', housingRes.error);
      }
    } catch (e) {
      console.warn('Exception loading housing for districts:', e);
    }
    
    try {
      const servicesRes = await supabase.from('services').select('district');
      if (!servicesRes.error && servicesRes.data) {
        services = servicesRes.data ?? [];
      } else if (servicesRes.error) {
        console.warn('Error loading services for districts:', servicesRes.error);
      }
    } catch (e) {
      console.warn('Exception loading services for districts:', e);
    }
    
    const membersMap = {};
    const jobsMap = {};
    const housingMap = {};
    const servicesMap = {};
    
    const norm = (s) => (s && String(s).trim()) || '';
    
    // Підраховуємо учасників
    profiles.forEach((p) => {
      const d = norm(p.district);
      if (d) membersMap[d] = (membersMap[d] || 0) + 1;
    });
    
    // Підраховуємо вакансії (використовуємо district, якщо є, інакше location як fallback)
    jobs.forEach((j) => {
      const district = norm(j.district);
      const location = norm(j.location);
      
      // Пріоритет: district > location
      const districtName = district || location;
      
      if (districtName) {
        // Якщо є district - використовуємо його напряму
        if (district && allDistricts.includes(district)) {
          jobsMap[district] = (jobsMap[district] || 0) + 1;
        } else {
          // Інакше намагаємося знайти відповідність в location
          const districtMatch = allDistricts.find(dist => {
            const nameLower = districtName.toLowerCase();
            const distLower = dist.toLowerCase();
            // Перевіряємо точну відповідність або чи location містить назву району
            return nameLower === distLower || 
                   nameLower.includes(distLower) || 
                   distLower.includes(nameLower) ||
                   // Також перевіряємо скорочені назви
                   (dist === 'Friedrichshain-Kreuzberg' && (nameLower.includes('friedrichshain') || nameLower.includes('kreuzberg'))) ||
                   (dist === 'Charlottenburg-Wilmersdorf' && (nameLower.includes('charlottenburg') || nameLower.includes('wilmersdorf'))) ||
                   (dist === 'Steglitz-Zehlendorf' && (nameLower.includes('steglitz') || nameLower.includes('zehlendorf'))) ||
                   (dist === 'Tempelhof-Schöneberg' && (nameLower.includes('tempelhof') || nameLower.includes('schöneberg'))) ||
                   (dist === 'Treptow-Köpenick' && (nameLower.includes('treptow') || nameLower.includes('köpenick'))) ||
                   (dist === 'Marzahn-Hellersdorf' && (nameLower.includes('marzahn') || nameLower.includes('hellersdorf')));
          });
          if (districtMatch) {
            jobsMap[districtMatch] = (jobsMap[districtMatch] || 0) + 1;
          }
        }
      }
    });
    
    // Підраховуємо житло
    housing.forEach((h) => {
      const d = norm(h.district);
      if (d) {
        const districtMatch = allDistricts.find(dist => 
          d.toLowerCase().includes(dist.toLowerCase()) || 
          dist.toLowerCase().includes(d.toLowerCase())
        );
        if (districtMatch) {
          housingMap[districtMatch] = (housingMap[districtMatch] || 0) + 1;
        } else if (allDistricts.includes(d)) {
          housingMap[d] = (housingMap[d] || 0) + 1;
        }
      }
    });
    
    // Підраховуємо послуги
    services.forEach((s) => {
      const d = norm(s.district);
      if (d) {
        const districtMatch = allDistricts.find(dist => 
          d.toLowerCase().includes(dist.toLowerCase()) || 
          dist.toLowerCase().includes(d.toLowerCase())
        );
        if (districtMatch) {
          servicesMap[districtMatch] = (servicesMap[districtMatch] || 0) + 1;
        } else if (allDistricts.includes(d)) {
          servicesMap[d] = (servicesMap[d] || 0) + 1;
        }
      }
    });
    
    // Створюємо результат для всіх 12 районів
    return allDistricts.map((name) => ({
      name,
      members: membersMap[name] || 0,
      jobs: jobsMap[name] || 0,
      housing: housingMap[name] || 0,
      services: servicesMap[name] || 0,
    }));
  } catch (e) {
    console.warn('getDistrictsStats error:', e);
    return [];
  }
};

const ensureProfileLocks = new Set();

/** Створити або оновити профіль (insert, при дублікаті — update). Уникає 400 при upsert. */
export const ensureProfile = async (payload) => {
  const { id, email, full_name, gender } = payload;
  if (!id) return { ok: false, error: new Error('ensureProfile: id required') };
  while (ensureProfileLocks.has(id)) {
    await new Promise((r) => setTimeout(r, 200));
  }
  ensureProfileLocks.add(id);
  try {
    const row = {
      id,
      email: email ?? null,
      full_name: (full_name && String(full_name).trim()) ? String(full_name).trim() : 'Користувач',
      gender: gender != null && String(gender).trim() !== '' ? String(gender).trim() : null,
    };
    const { error: insertErr } = await supabase.from('profiles').insert([row]);
    if (!insertErr) return { ok: true };
    if (insertErr?.code === '23505' || /unique|duplicate|conflict|23505/i.test(String(insertErr?.message || ''))) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ email: row.email, full_name: row.full_name, gender: row.gender })
        .eq('id', id);
      if (!updateErr) return { ok: true };
      console.warn('ensureProfile update failed:', updateErr?.message || updateErr);
      return { ok: false, error: updateErr };
    }
    console.warn('ensureProfile insert failed:', insertErr?.message, insertErr?.code, insertErr?.details);
    return { ok: false, error: insertErr };
  } finally {
    ensureProfileLocks.delete(id);
  }
};

/** Повертає Map<userId, { full_name, avatar_url }> для масиву user_id. Використовувати для відображення імен та аватарів авторов. */
export const getProfilesByIds = async (userIds) => {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return new Map();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids);
    if (error) {
      console.warn('getProfilesByIds error:', error);
      return new Map();
    }
    const map = new Map();
    (data ?? []).forEach((p) => map.set(p.id, { full_name: p.full_name || null, avatar_url: p.avatar_url || null }));
    return map;
  } catch (e) {
    console.warn('getProfilesByIds exception:', e);
    return new Map();
  }
};

// Jobs — при помилці повертаємо []
export const getJobs = async () => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('getJobs error:', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('getJobs exception:', e);
    return [];
  }
};

export const getJobById = async (id) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createJob = async (jobData) => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateJob = async (id, jobData) => {
  console.log('[updateJob] Оновлення вакансії:', { id, jobData });
  
  // Спочатку виконуємо UPDATE
  const { error: updateError } = await supabase
    .from('jobs')
    .update(jobData)
    .eq('id', id);
  
  if (updateError) {
    console.error('[updateJob] Помилка при оновленні:', updateError);
    throw updateError;
  }
  
  console.log('[updateJob] UPDATE виконано успішно');
  
  // Потім отримуємо оновлені дані окремим запитом
  const { data, error: selectError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (selectError) {
    console.warn('[updateJob] Не вдалося отримати оновлені дані:', selectError);
    // Все одно вважаємо оновлення успішним, якщо UPDATE пройшов
    return { id, ...jobData };
  }
  
  console.log('[updateJob] Оновлені дані отримано:', data);
  return data;
};

export const deleteJob = async (id) => {
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Housing — при помилці повертаємо []
export const getHousing = async () => {
  try {
    const { data, error } = await supabase
      .from('housing')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('getHousing error:', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('getHousing exception:', e);
    return [];
  }
};

export const getHousingById = async (id) => {
  const { data, error } = await supabase
    .from('housing')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createHousing = async (housingData) => {
  const { data, error } = await supabase
    .from('housing')
    .insert([housingData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateHousing = async (id, housingData) => {
  console.log('[updateHousing] Оновлення житла:', { id, housingData });
  console.log('[updateHousing] Повний об\'єкт housingData для оновлення:', JSON.stringify(housingData, null, 2));
  
  // Використовуємо .select() одразу після .update() щоб отримати оновлені дані
  const { data, error: updateError } = await supabase
    .from('housing')
    .update(housingData)
    .eq('id', id)
    .select()
    .single();
  
  if (updateError) {
    console.error('[updateHousing] Помилка при оновленні:', updateError);
    console.error('[updateHousing] Деталі помилки:', JSON.stringify(updateError, null, 2));
    throw updateError;
  }
  
  if (!data) {
    console.warn('[updateHousing] UPDATE виконано, але дані не повернуто. Завантажуємо окремо...');
    // Якщо дані не повернуто, завантажуємо окремо
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: fetchedData, error: selectError } = await supabase
      .from('housing')
      .select('*')
      .eq('id', id)
      .single();
    
    if (selectError) {
      console.warn('[updateHousing] Не вдалося отримати оновлені дані:', selectError);
      return { id, ...housingData };
    }
    
    console.log('[updateHousing] Оновлені дані отримано після завантаження:', fetchedData);
    return fetchedData;
  }
  
  console.log('[updateHousing] UPDATE виконано успішно, отримано дані:', data);
  return data;
};

export const deleteHousing = async (id) => {
  const { error } = await supabase
    .from('housing')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

const HOUSING_PHOTOS_BUCKET = 'housing-photos';

/** Завантажити фото житла в Storage. Повертає публічний URL. */
export const uploadHousingPhoto = async (file, housingId, userId) => {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userId}/${housingId}/${unique}.${ext}`;

  const { error } = await supabase.storage
    .from(HOUSING_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(HOUSING_PHOTOS_BUCKET)
    .getPublicUrl(path);

  return publicUrl;
};

/** Видалити фото з Storage за публічним URL. */
export const deleteHousingPhotoFromStorage = async (publicUrl) => {
  if (!publicUrl || typeof publicUrl !== 'string') return;
  const marker = `/${HOUSING_PHOTOS_BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return;
  const path = publicUrl.slice(i + marker.length);
  await supabase.storage.from(HOUSING_PHOTOS_BUCKET).remove([path]);
};

// Services — при помилці повертаємо []
export const getServices = async () => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('getServices error:', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('getServices exception:', e);
    return [];
  }
};

export const createService = async (serviceData) => {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getServiceById = async (id) => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateService = async (id, serviceData) => {
  console.log('[updateService] Оновлення сервісу:', { id, serviceData });
  
  const { data, error: updateError } = await supabase
    .from('services')
    .update(serviceData)
    .eq('id', id)
    .select()
    .single();
  
  if (updateError) {
    console.error('[updateService] Помилка при оновленні:', updateError);
    throw updateError;
  }
  
  if (!data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: fetchedData, error: selectError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (selectError) {
      console.warn('[updateService] Не вдалося отримати оновлені дані:', selectError);
      return { id, ...serviceData };
    }
    
    return fetchedData;
  }
  
  console.log('[updateService] Оновлені дані отримано:', data);
  return data;
};

export const deleteService = async (id) => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Forum Posts — при помилці повертаємо []; спочатку select *, join може падати через RLS
export const getForumPosts = async () => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('getForumPosts error:', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('getForumPosts exception:', e);
    return [];
  }
};

export const getForumPostById = async (id) => {
  const { data, error } = await supabase
    .from('forum_posts')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const createForumPost = async (postData) => {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert([postData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Forum Replies — при помилці повертаємо []
export const getForumReplies = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('getForumReplies error:', error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('getForumReplies exception:', e);
    return [];
  }
};

export const createForumReply = async (replyData) => {
  const { data, error } = await supabase
    .from('forum_replies')
    .insert([replyData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

/** Повертає множину post_id, які поточний user вже лайкнув. */
export const getForumPostLikesForUser = async (userId) => {
  if (!userId) return new Set();
  try {
    const { data, error } = await supabase
      .from('forum_post_likes')
      .select('post_id')
      .eq('user_id', userId);
    if (error) return new Set();
    return new Set((data ?? []).map((r) => r.post_id));
  } catch {
    return new Set();
  }
};

/** Повертає множину reply_id, які поточний user вже лайкнув. */
export const getForumReplyLikesForUser = async (userId) => {
  if (!userId) return new Set();
  try {
    const { data, error } = await supabase
      .from('forum_reply_likes')
      .select('reply_id')
      .eq('user_id', userId);
    if (error) return new Set();
    return new Set((data ?? []).map((r) => r.reply_id));
  } catch {
    return new Set();
  }
};

/** Тогл лайку поста. user_id — поточний user. Повертає { liked: boolean }. */
export const toggleForumPostLike = async (postId, userId) => {
  if (!userId) throw new Error('Потрібна авторизація');
  const { data: existing } = await supabase
    .from('forum_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    const { error: delErr } = await supabase.from('forum_post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    if (delErr) throw delErr;
    return { liked: false };
  }
  const { error: insErr } = await supabase.from('forum_post_likes').insert([{ post_id: postId, user_id: userId }]).select('id');
  if (insErr) throw insErr;
  return { liked: true };
};

/** Тогл лайку коментаря. */
export const toggleForumReplyLike = async (replyId, userId) => {
  if (!userId) throw new Error('Потрібна авторизація');
  const { data: existing } = await supabase
    .from('forum_reply_likes')
    .select('id')
    .eq('reply_id', replyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    const { error: delErr } = await supabase.from('forum_reply_likes').delete().eq('reply_id', replyId).eq('user_id', userId);
    if (delErr) throw delErr;
    return { liked: false };
  }
  const { error: insErr } = await supabase.from('forum_reply_likes').insert([{ reply_id: replyId, user_id: userId }]).select('id');
  if (insErr) throw insErr;
  return { liked: true };
};

export const deleteForumPost = async (id) => {
  const { error } = await supabase.from('forum_posts').delete().eq('id', id);
  if (error) throw error;
};

export const deleteForumReply = async (id) => {
  const { error } = await supabase.from('forum_replies').delete().eq('id', id);
  if (error) throw error;
};

export const updateForumPost = async (id, data) => {
  const { data: out, error } = await supabase.from('forum_posts').update(data).eq('id', id).select().single();
  if (error) throw error;
  return out;
};

/** Активність користувача: пости, коментарі, лайки, вакансії, житло, послуги */
export const getActivityByUser = async (userId) => {
  if (!userId) return { posts: [], replies: [], jobs: [], housing: [], services: [], likesReceived: 0 };
  try {
    const [postsRes, repliesRes, jobsRes, housingRes, servicesRes] = await Promise.all([
      supabase.from('forum_posts').select('id, title, created_at, likes_count').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('forum_replies').select('id, content, post_id, created_at, likes_count').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('jobs').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('housing').select('id, title, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('services').select('id, name, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    const posts = (postsRes.data ?? []).map((p) => ({ ...p, type: 'post' }));
    const replies = (repliesRes.data ?? []).map((r) => ({ ...r, type: 'reply' }));
    const jobs = (jobsRes.data ?? []).map((j) => ({ ...j, type: 'job' }));
    const housing = (housingRes.data ?? []).map((h) => ({ ...h, type: 'housing' }));
    const services = (servicesRes.data ?? []).map((s) => ({ ...s, type: 'service' }));
    const likesReceived =
      posts.reduce((acc, p) => acc + (Number(p.likes_count) || 0), 0) +
      replies.reduce((acc, r) => acc + (Number(r.likes_count) || 0), 0);
    return { posts, replies, jobs, housing, services, likesReceived };
  } catch (e) {
    console.warn('getActivityByUser error:', e);
    return { posts: [], replies: [], jobs: [], housing: [], services: [], likesReceived: 0 };
  }
};

// Chat Messages — при помилці повертаємо []; тільки select * без join
export const getMessages = async (limit = 100) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .gt('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('getMessages error:', error);
      return [];
    }
    return (data || []).reverse();
  } catch (e) {
    console.warn('getMessages exception:', e);
    return [];
  }
};

export const sendMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteMessage = async (messageId) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);
  
  if (error) throw error;
};

// Filtered queries
export const getJobsByFilter = async (filters = {}) => {
  let query = supabase
    .from('jobs')
    .select('*');
  
  if (filters.employment_type) {
    query = query.eq('employment_type', filters.employment_type);
  }
  
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getHousingByFilter = async (filters = {}) => {
  let query = supabase
    .from('housing')
    .select('*');
  
  if (filters.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters.district) {
    query = query.eq('district', filters.district);
  }
  
  if (filters.max_price) {
    query = query.lte('price', filters.max_price);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

/** Оновлює last_seen поточного користувача (heartbeat для онлайну). */
export const updateLastSeen = async (userId) => {
  if (!userId) return;
  try {
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);
  } catch (e) {
    console.warn('updateLastSeen error:', e);
  }
};

// User Statistics
export const getUserStats = async () => {
  try {
    const { count: totalUsers, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) console.warn('getUserStats count error:', countError);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    let onlineUsers = 0;

    const { count: onlineCount, error: onlineError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('last_seen', 'is', null)
      .gte('last_seen', fiveMinutesAgo);

    if (!onlineError) {
      onlineUsers = onlineCount ?? 0;
    } else {
      console.warn('getUserStats online (last_seen) error:', onlineError);
    }

    return {
      totalUsers: totalUsers ?? 0,
      onlineUsers,
      error: countError ?? onlineError,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { totalUsers: 0, onlineUsers: 0, error };
  }
};

export const getServicesByFilter = async (filters = {}) => {
  let query = supabase
    .from('services')
    .select('*');
  
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters.language) {
    query = query.contains('languages', [filters.language]);
  }
  
  query = query.order('created_at', { ascending: false });
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// =====================================================
// FRIENDS FUNCTIONS
// =====================================================

/** Отримати всіх друзів користувача (прийняті запити) */
export const getFriends = async (userId) => {
  try {
    console.log('🔍 Getting friends for user:', userId);
    
    // Спочатку отримуємо записи без join'ів (щоб уникнути проблем з RLS)
    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (friendsError) {
      console.error('❌ Error fetching friends:', friendsError);
      throw friendsError;
    }
    
    console.log('📋 Raw friends data (without joins):', friendsData);
    
    if (!friendsData || friendsData.length === 0) {
      console.log('⚠️ No friends found');
      return [];
    }
    
    // Отримуємо унікальні ID профілів
    const profileIds = new Set();
    friendsData.forEach(friend => {
      if (friend.user_id === userId) {
        if (friend.friend_id) profileIds.add(friend.friend_id);
      } else {
        if (friend.user_id) profileIds.add(friend.user_id);
      }
    });
    
    console.log('👥 Profile IDs to fetch:', Array.from(profileIds));
    
    // Отримуємо профілі окремо (тільки якщо є ID)
    let profiles = [];
    if (profileIds.size > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, district, gender')
        .in('id', Array.from(profileIds));
      
      if (profilesError) {
        console.error('❌ Error fetching profiles:', profilesError);
        // Продовжуємо навіть якщо профілі не завантажилися
      } else {
        profiles = profilesData || [];
      }
    }
    
    console.log('📋 Profiles data:', profiles);
    
    // Створюємо мапу профілів
    const profilesMap = new Map();
    if (profiles) {
      profiles.forEach(p => profilesMap.set(p.id, p));
    }
    
    // Перетворюємо дані: для кожного запису визначаємо, хто є другом
    const friends = friendsData.map(friend => {
      const friendId = friend.user_id === userId ? friend.friend_id : friend.user_id;
      const friendProfile = profilesMap.get(friendId) || {
        id: friendId,
        full_name: 'Користувач',
        avatar_url: null,
        district: null,
        gender: null
      };
      
      return {
        ...friend,
        friend_profile: friendProfile
      };
    }).filter(f => f.friend_profile && f.friend_profile.id); // Фільтруємо тільки валідні профілі
    
    console.log('✅ Processed friends:', friends);
    console.log('✅ Friend IDs:', friends.map(f => f.friend_profile.id));
    
    return friends;
  } catch (e) {
    console.error('❌ getFriends error:', e);
    return [];
  }
};

/** Отримати запити на дружбу (pending) */
export const getFriendRequests = async (userId) => {
  try {
    console.log('🔍 Getting friend requests for user:', userId);
    
    // Спочатку отримуємо записи без join'ів (щоб уникнути помилок PGRST200)
    const { data: requestsData, error: requestsError } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      console.error('❌ Error fetching friend requests:', requestsError);
      throw requestsError;
    }
    
    console.log('📋 Raw friend requests data (without joins):', requestsData);
    
    if (!requestsData || requestsData.length === 0) {
      console.log('⚠️ No friend requests found');
      return [];
    }
    
    // Отримуємо унікальні ID профілів відправників
    const senderIds = new Set(
      requestsData
        .map(r => r.user_id)
        .filter(id => id !== null && id !== undefined)
    );
    
    console.log('👥 Sender IDs to fetch:', Array.from(senderIds));
    
    // Отримуємо профілі окремо
    let profiles = [];
    if (senderIds.size > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, district, gender')
        .in('id', Array.from(senderIds));
      
      if (profilesError) {
        console.error('❌ Error fetching sender profiles:', profilesError);
        // Продовжуємо навіть якщо профілі не завантажилися
      } else {
        profiles = profilesData || [];
      }
    }
    
    console.log('📋 Sender profiles data:', profiles);
    
    // Створюємо мапу профілів
    const profilesMap = new Map();
    if (profiles) {
      profiles.forEach(p => profilesMap.set(p.id, p));
    }
    
    // Об'єднуємо дані
    const result = requestsData.map(request => {
      const senderProfile = profilesMap.get(request.user_id) || {
        id: request.user_id,
        full_name: 'Користувач',
        avatar_url: null,
        district: null,
        gender: null
      };
      
      return {
        ...request,
        user: senderProfile
      };
    });
    
    console.log('✅ Friend requests loaded:', result.length);
    return result;
  } catch (e) {
    console.warn('⚠️ getFriendRequests error:', e);
    return [];
  }
};

/** Перевірити статус дружби між двома користувачами */
export const getFriendshipStatus = async (userId, friendId) => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .maybeSingle();
    
    if (error) throw error;
    return data || null;
  } catch (e) {
    console.warn('getFriendshipStatus error:', e);
    return null;
  }
};

/** Відправити запит на дружбу */
export const sendFriendRequest = async (userId, friendId) => {
  try {
    console.log('📤 Sending friend request from', userId, 'to', friendId);
    
    // Перевіряємо, чи не існує вже активний запит
    const existing = await getFriendshipStatus(userId, friendId);
    if (existing) {
      // Якщо запит вже прийнятий - не можна відправити знову
      if (existing.status === 'accepted') {
        throw new Error('Цей користувач вже є вашим другом');
      }
      // Якщо запит вже відправлений і очікує підтвердження - не можна відправити знову
      if (existing.status === 'pending' && existing.user_id === userId) {
        throw new Error('Запит на дружбу вже відправлено');
      }
      // Якщо запит був відхилений або видалений - можна створити новий
      // Видаляємо старий запис
      if (existing.status === 'rejected' || existing.status === 'pending') {
        await supabase
          .from('friends')
          .delete()
          .eq('id', existing.id);
        console.log('🗑️ Deleted old friend request, creating new one');
      }
    }
    
    // Створюємо запит на дружбу
    const { data, error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Отримуємо профіль відправника для системного повідомлення
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    const senderName = senderProfile?.full_name || 'Користувач';
    
    // Створюємо системне повідомлення про запит на дружбу
    await supabase
      .from('private_messages')
      .insert({
        sender_id: userId,
        receiver_id: friendId,
        message: `${senderName} хоче додати вас у друзі. Ви підтверджуєте?`,
        message_type: 'friend_request',
        metadata: {
          friend_request_id: data.id,
          action: 'friend_request'
        }
      });
    
    return data;
  } catch (e) {
    console.error('sendFriendRequest error:', e);
    throw e;
  }
};

/** Прийняти запит на дружбу */
export const acceptFriendRequest = async (requestId) => {
  try {
    console.log('🔄 Accepting friend request:', requestId);
    
    // Отримуємо інформацію про запит (maybeSingle — щоб не 406 при 0 rows)
    const { data: request, error: requestError } = await supabase
      .from('friends')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();
    
    if (requestError) {
      console.error('❌ Error fetching friend request:', requestError);
      throw requestError;
    }
    
    if (!request) {
      throw new Error('Запит на дружбу вже оброблено або не знайдено');
    }
    
    console.log('📋 Friend request data:', request);
    
    // Оновлюємо статус запиту
    const { data, error } = await supabase
      .from('friends')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select();
    
    if (error) {
      console.error('❌ Error updating friend request:', error);
      throw error;
    }
    
    const updated = Array.isArray(data) ? data[0] : data;
    console.log('✅ Friend request updated:', updated);
    
    if (!updated || updated.status !== 'accepted') {
      console.error('❌ Friend request status not updated correctly:', data);
      throw new Error('Не вдалося оновити статус запиту на дружбу');
    }
    
    // Отримуємо профіль того, хто прийняв запит
    const { data: accepterProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', request.friend_id)
      .single();
    
    const accepterName = accepterProfile?.full_name || 'Користувач';
    
    // Позначаємо всі системні повідомлення про цей запит як прочитані
    // Спочатку отримуємо всі непрочитані системні повідомлення
    const { data: allSystemMessages } = await supabase
      .from('private_messages')
      .select('id, metadata')
      .eq('message_type', 'friend_request')
      .eq('read', false);
    
    // Фільтруємо по friend_request_id вручну (бо JSONB фільтри можуть не працювати)
    const systemMessages = (allSystemMessages || []).filter(msg => 
      msg.metadata?.friend_request_id === requestId || 
      msg.metadata?.friend_request_id === String(requestId)
    );
    
    if (systemMessages && systemMessages.length > 0) {
      await Promise.all(
        systemMessages.map(msg => 
          supabase
            .from('private_messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', msg.id)
        )
      );
      console.log('✅ Marked system messages as read:', systemMessages.length);
    }
    
    // Створюємо системне повідомлення про прийняття запиту
    const { error: messageError } = await supabase
      .from('private_messages')
      .insert({
        sender_id: request.friend_id,
        receiver_id: request.user_id,
        message: `${accepterName} прийняв(ла) ваш запит на дружбу!`,
        message_type: 'friend_request_accepted',
        metadata: {
          friend_request_id: requestId,
          action: 'friend_request_accepted'
        }
      });
    
    if (messageError) {
      console.warn('⚠️ Error creating acceptance message:', messageError);
      // Не кидаємо помилку, бо основна операція виконана
    }
    
    return updated;
  } catch (e) {
    console.error('❌ acceptFriendRequest error:', e);
    throw e;
  }
};

/** Відхилити запит на дружбу */
export const rejectFriendRequest = async (requestId) => {
  try {
    console.log('🔄 Rejecting friend request:', requestId);
    
    // Позначаємо всі системні повідомлення про цей запит як прочитані
    // Спочатку отримуємо всі непрочитані системні повідомлення
    const { data: allSystemMessages } = await supabase
      .from('private_messages')
      .select('id, metadata')
      .eq('message_type', 'friend_request')
      .eq('read', false);
    
    // Фільтруємо по friend_request_id вручну
    const systemMessages = (allSystemMessages || []).filter(msg => 
      msg.metadata?.friend_request_id === requestId || 
      msg.metadata?.friend_request_id === String(requestId)
    );
    
    if (systemMessages && systemMessages.length > 0) {
      await Promise.all(
        systemMessages.map(msg => 
          supabase
            .from('private_messages')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', msg.id)
        )
      );
      console.log('✅ Marked system messages as read:', systemMessages.length);
    }
    
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);
    
    if (error) {
      console.error('❌ Error deleting friend request:', error);
      throw error;
    }
    
    console.log('✅ Friend request rejected');
  } catch (e) {
    console.error('❌ rejectFriendRequest error:', e);
    throw e;
  }
};

/** Видалити друга */
export const removeFriend = async (userId, friendId) => {
  try {
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    
    if (error) throw error;
  } catch (e) {
    console.error('removeFriend error:', e);
    throw e;
  }
};

// =====================================================
// PRIVATE MESSAGES FUNCTIONS
// =====================================================

/** Отримати список розмов (контактів) для користувача */
export const getConversations = async (userId) => {
  try {
    // Отримуємо всіх друзів
    const friends = await getFriends(userId);
    const friendIds = friends.map(f => f.friend_profile.id);
    
    if (friendIds.length === 0) return [];
    
    // Отримуємо останнє повідомлення з кожної розмови
    // Використовуємо окремі запити для sender та receiver
    const { data: sentData } = await supabase
      .from('private_messages')
      .select('*')
      .eq('sender_id', userId)
      .in('receiver_id', friendIds)
      .order('created_at', { ascending: false });
    
    const { data: receivedData } = await supabase
      .from('private_messages')
      .select('*')
      .eq('receiver_id', userId)
      .in('sender_id', friendIds)
      .order('created_at', { ascending: false });
    
    // Об'єднуємо та групуємо по розмовам
    const allMessages = [...(sentData || []), ...(receivedData || [])];
    const conversationsMap = new Map();
    
    allMessages.forEach(msg => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user_id: otherUserId,
          last_message: msg,
          unread_count: 0
        });
      } else {
        // Оновлюємо останнє повідомлення, якщо це новіше
        const existing = conversationsMap.get(otherUserId);
        if (new Date(msg.created_at) > new Date(existing.last_message.created_at)) {
          existing.last_message = msg;
        }
      }
    });
    
    // Підраховуємо непрочитані
    if (receivedData) {
      receivedData.forEach(msg => {
        if (!msg.read) {
          const conv = conversationsMap.get(msg.sender_id);
          if (conv) conv.unread_count++;
        }
      });
    }
    
    return Array.from(conversationsMap.values());
  } catch (e) {
    console.warn('getConversations error:', e);
    return [];
  }
};

/** Отримати повідомлення з конкретним користувачем */
export const getPrivateMessages = async (userId, otherUserId) => {
  try {
    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('getPrivateMessages error:', e);
    return [];
  }
};

/** Відправити приватне повідомлення */
export const sendPrivateMessage = async (senderId, receiverId, message) => {
  try {
    // Перевіряємо, чи не заблокований відправник або отримувач
    const senderBlocked = await isUserBlocked(receiverId, senderId);
    const receiverBlocked = await isUserBlocked(senderId, receiverId);
    
    if (senderBlocked) {
      throw new Error('Ви заблоковані цим користувачем');
    }
    if (receiverBlocked) {
      throw new Error('Цей користувач заблокований вами');
    }
    
    // Дозволяємо відправку повідомлень навіть не друзям
    const { data, error } = await supabase
      .from('private_messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message: message
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('sendPrivateMessage error:', e);
    throw e;
  }
};

/** Відмітити повідомлення як прочитане */
export const markMessageAsRead = async (messageId) => {
  try {
    const { error } = await supabase
      .from('private_messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', messageId);
    
    if (error) throw error;
  } catch (e) {
    console.error('markMessageAsRead error:', e);
    throw e;
  }
};

/** Видалити приватне повідомлення */
export const deletePrivateMessage = async (messageId) => {
  try {
    const { error } = await supabase
      .from('private_messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
  } catch (e) {
    console.error('deletePrivateMessage error:', e);
    throw e;
  }
};

/** Отримати кількість непрочитаних повідомлень для користувача */
export const getUnreadMessagesCount = async (userId) => {
  try {
    if (!userId) return 0;
    
    // Отримуємо список заблокованих користувачів
    const blockedUsers = await getBlockedUsers(userId);
    const blockedIds = new Set(blockedUsers.map(b => b.blocked_user_id));
    
    // Отримуємо всі непрочитані повідомлення
    const { data, error } = await supabase
      .from('private_messages')
      .select('id, sender_id')
      .eq('receiver_id', userId)
      .eq('read', false);
    
    if (error) {
      console.warn('getUnreadMessagesCount error:', error);
      return 0;
    }
    
    // Фільтруємо повідомлення від заблокованих користувачів
    const unreadCount = (data || []).filter(msg => !blockedIds.has(msg.sender_id)).length;
    
    return unreadCount;
  } catch (e) {
    console.warn('getUnreadMessagesCount exception:', e);
    return 0;
  }
};

// =====================================================
// BLOCKED USERS FUNCTIONS (Чорний список)
// =====================================================

/** Отримати список заблокованих користувачів */
export const getBlockedUsers = async (userId) => {
  try {
    console.log('🔍 Getting blocked users for user:', userId);
    
    // Спочатку отримуємо записи без join'ів (щоб уникнути помилок PGRST200)
    const { data: blockedData, error: blockedError } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', userId);
    
    if (blockedError) {
      console.error('❌ Error fetching blocked users:', blockedError);
      throw blockedError;
    }
    
    if (!blockedData || blockedData.length === 0) {
      console.log('📋 No blocked users found');
      return [];
    }
    
    // Отримуємо ID заблокованих користувачів
    const blockedIds = blockedData.map(b => b.blocked_user_id).filter(id => id);
    
    if (blockedIds.length === 0) {
      return blockedData;
    }
    
    // Отримуємо профілі окремо
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, district, gender')
      .in('id', blockedIds);
    
    if (profilesError) {
      console.error('❌ Error fetching blocked user profiles:', profilesError);
      // Продовжуємо навіть якщо профілі не завантажилися
    }
    
    // Створюємо мапу профілів
    const profilesMap = new Map();
    if (profiles) {
      profiles.forEach(p => profilesMap.set(p.id, p));
    }
    
    // Об'єднуємо дані
    const result = blockedData.map(blocked => {
      const blockedProfile = profilesMap.get(blocked.blocked_user_id) || {
        id: blocked.blocked_user_id,
        full_name: 'Користувач',
        avatar_url: null,
        district: null,
        gender: null
      };
      
      return {
        ...blocked,
        blocked_user: blockedProfile
      };
    });
    
    console.log('✅ Blocked users loaded:', result.length);
    return result;
  } catch (e) {
    console.warn('⚠️ getBlockedUsers error:', e);
    return [];
  }
};

/** Перевірити, чи заблокований користувач */
export const isUserBlocked = async (userId, otherUserId) => {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', userId)
      .eq('blocked_user_id', otherUserId)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  } catch (e) {
    console.warn('isUserBlocked error:', e);
    return false;
  }
};

/** Заблокувати користувача */
export const blockUser = async (userId, blockedUserId) => {
  try {
    // Перевіряємо, чи не заблокований вже
    const alreadyBlocked = await isUserBlocked(userId, blockedUserId);
    if (alreadyBlocked) {
      throw new Error('Користувач вже заблокований');
    }
    
    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: userId,
        blocked_user_id: blockedUserId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('blockUser error:', e);
    throw e;
  }
};

/** Розблокувати користувача */
export const unblockUser = async (userId, blockedUserId) => {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);
    
    if (error) throw error;
  } catch (e) {
    console.error('unblockUser error:', e);
    throw e;
  }
};
