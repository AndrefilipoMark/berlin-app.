import { motion } from 'framer-motion';
import { X, Briefcase, Home, Stethoscope, MessageCircle, Building2, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, createJob, createHousing, createService, createForumPost } from '../lib/supabase';
import { emitEvent, Events } from '../lib/events';
import { BERLIN_DISTRICTS } from '../lib/constants';

function formatSupabaseError(err) {
  if (!err) return 'Невідома помилка';
  const parts = [err?.message, err?.details, err?.hint].filter(Boolean);
  return parts.length ? parts.join(' | ') : String(err);
}

// Job Form Modal
export function JobFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    category: 'IT',
    description: '',
    salary_min: '',
    salary_max: '',
    location: '',
    district: '',
    employment_type: 'full-time',
    languages: [],
    requirements: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.company || !formData.location || !formData.description) {
      alert('Будь ласка, заповніть усі обов’язкові поля (*)');
      return;
    }

    try {
      setSubmitting(true);
      if (!user?.id) {
        alert('Потрібна авторизація');
        return;
      }

      const jobData = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        category: formData.category || null,
        description: formData.description.trim(),
        salary_min: formData.salary_min ? parseInt(formData.salary_min, 10) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max, 10) : null,
        location: formData.location.trim(),
        district: formData.district || null,
        employment_type: formData.employment_type || 'full-time',
        languages: Array.isArray(formData.languages) ? formData.languages : [],
        requirements: formData.requirements?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        website: formData.website?.trim() || null,
        user_id: user.id,
      };
      console.log('[Jobs] Відправка в Supabase...', { title: jobData.title, user_id: jobData.user_id });
      await createJob(jobData);
      console.log('[Jobs] Успішно збережено.');
      emitEvent(Events.JOB_ADDED);
      alert('Вакансію успішно додано!');
      onClose();
    } catch (error) {
      console.log('Помилка Supabase:', error);
      console.error('Error creating job:', error);
      alert(`Помилка при додаванні вакансії:\n\n${formatSupabaseError(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalContainer
      title="Додати вакансію"
      icon={Briefcase}
      iconColor="from-azure-blue to-blue-600"
      onClose={onClose}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <Input
          label="Назва вакансії *"
          placeholder="Frontend Developer"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        
        <Input
          label="Компанія *"
          placeholder="Tech Berlin GmbH"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
        />

        <Select
          label="Категорія *"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'IT', label: 'IT' },
            { value: 'Будівництво', label: 'Будівництво' },
            { value: 'Гастрономія', label: 'Гастрономія' },
            { value: 'Логістика', label: 'Логістика' },
            { value: 'Послуги', label: 'Послуги' },
            { value: 'Медицина', label: 'Медицина' },
            { value: 'Інше', label: 'Інше' },
          ]}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Зарплата від (€)"
            type="number"
            placeholder="3000"
            value={formData.salary_min}
            onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
          />
          <Input
            label="Зарплата до (€)"
            type="number"
            placeholder="4500"
            value={formData.salary_max}
            onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
          />
        </div>

        <Input
          label="Адреса *"
          placeholder="Mitte, Berlin"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />

        <Select
          label="Район"
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          options={[
            { value: '', label: 'Оберіть район' },
            ...BERLIN_DISTRICTS.map((d) => ({ value: d, label: d })),
          ]}
        />

        <Select
          label="Тип зайнятості *"
          value={formData.employment_type}
          onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
          options={[
            { value: 'full-time', label: 'Повна зайнятість (Vollzeit)' },
            { value: 'part-time', label: 'Часткова зайнятість (Teilzeit)' },
            { value: 'contract', label: 'Контракт (Vertrag)' },
            { value: 'internship', label: 'Стажування (Praktikum)' },
            { value: 'minijob', label: 'Мініджоб (Minijob)' },
          ]}
        />

        <Textarea
          label="Опис вакансії *"
          placeholder="Детальний опис вакансії..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />

        <Textarea
          label="Вимоги"
          placeholder="Список вимог до кандидата..."
          value={formData.requirements}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
          rows={3}
        />

        <LanguageSelector
          selected={formData.languages}
          onChange={(langs) => setFormData({ ...formData, languages: langs })}
        />

        <Input
          label="Email для контакту"
          type="email"
          placeholder="hr@company.com"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
        />

        <Input
          label="Телефон для контакту"
          type="tel"
          placeholder="+49 30 123 4567"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
        />

        <Input
          label="Веб-сайт"
          type="url"
          placeholder="https://company.com"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <FormActions onCancel={onClose} onSubmit={handleSubmit} submitting={submitting} />
    </FormModalContainer>
  );
}

// Housing Form Modal
export function HousingFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'apartment',
    description: '',
    price: '',
    size: '',
    rooms: '',
    address: '',
    district: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.address || !formData.description || !formData.contact_phone) {
      alert('Будь ласка, заповніть усі обов’язкові поля (*)');
      return;
    }

    try {
      setSubmitting(true);

      const housingData = {
        title: formData.title.trim(),
        type: formData.type || 'apartment',
        description: formData.description.trim(),
        price: parseInt(formData.price, 10) || 0,
        size: formData.size ? parseInt(formData.size, 10) : null,
        rooms: formData.rooms ? parseInt(formData.rooms, 10) : null,
        address: formData.address.trim(),
        district: formData.district || null,
        contact_name: formData.contact_name?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        website: formData.website?.trim() || null,
        user_id: user?.id || null,
      };
      console.log('[Housing] Відправка в Supabase...', { title: housingData.title, user_id: housingData.user_id });
      await createHousing(housingData);
      console.log('[Housing] Успішно збережено.');
      emitEvent(Events.HOUSING_ADDED);
      alert('Оголошення про житло успішно додано!');
      onClose();
    } catch (error) {
      console.log('Помилка Supabase:', error);
      console.error('Error creating housing:', error);
      alert(`Помилка при додаванні житла:\n\n${formatSupabaseError(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalContainer
      title="Опублікувати житло"
      icon={Home}
      iconColor="from-vibrant-yellow to-orange-400"
      onClose={onClose}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <Input
          label="Заголовок *"
          placeholder="2-кімнатна квартира біля метро"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <Select
          label="Тип житла *"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          options={[
            { value: 'apartment', label: 'Квартира' },
            { value: 'room', label: 'Кімната' },
            { value: 'studio', label: 'Студія' },
            { value: 'house', label: 'Будинок' },
          ]}
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Ціна (€) *"
            type="number"
            placeholder="950"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
          <Input
            label="Площа (м²)"
            type="number"
            placeholder="65"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          />
          <Input
            label="Кімнат"
            type="number"
            placeholder="2"
            value={formData.rooms}
            onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
          />
        </div>

        <Input
          label="Адреса *"
          placeholder="Warschauer Str. 23"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <Select
          label="Район"
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          options={[
            { value: '', label: 'Оберіть район' },
            ...BERLIN_DISTRICTS.map((d) => ({ value: d, label: d })),
          ]}
        />

        <Textarea
          label="Опис *"
          placeholder="Детальний опис житла..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />

        <Input
          label="Ваше ім'я"
          placeholder="Олена"
          value={formData.contact_name}
          onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
        />

        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
        />

        <Input
          label="Телефон *"
          type="tel"
          placeholder="+49 176 123 4567"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
        />

        <Input
          label="Веб-сайт"
          type="url"
          placeholder="https://example.com"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <FormActions onCancel={onClose} onSubmit={handleSubmit} submitting={submitting} />
    </FormModalContainer>
  );
}

// Service Form Modal (already exists in FAB, but moved here)
export function ServiceFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'medical',
    description: '',
    address: '',
    district: '',
    phone: '',
    email: '',
    website: '',
    languages: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
          .then(({ data }) => setProfile(data));
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.address) {
      alert('Будь ласка, заповніть усі обов’язкові поля (*)');
      return;
    }

    try {
      setSubmitting(true);

      const serviceData = {
        name: formData.name.trim(),
        profession: null, // Професія більше не використовується
        category: formData.category || 'medical',
        description: formData.description?.trim() || null,
        address: formData.address.trim(),
        district: formData.district || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        languages: Array.isArray(formData.languages) ? formData.languages : [],
        user_id: user?.id || null,
      };
      console.log('[Services] Відправка в Supabase...', { name: serviceData.name, user_id: serviceData.user_id });
      await createService(serviceData);
      console.log('[Services] Успішно збережено.');
      emitEvent(Events.SERVICE_ADDED);
      alert('Сервіс успішно додано!');
      onClose();
    } catch (error) {
      console.log('Помилка Supabase:', error);
      console.error('Error creating service:', error);
      alert(`Помилка при додаванні сервісу:\n\n${formatSupabaseError(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalContainer
      title="Додати сервіс"
      icon={Sparkles}
      iconColor="from-teal-500 to-teal-600"
      onClose={onClose}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <Input
          label="Назва *"
          placeholder="Dr. Schmidt, Ресторан, Салон краси..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <Select
          label="Категорія *"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'medical', label: 'Медицина' },
            { value: 'food', label: 'Гастрономія' },
            { value: 'beauty', label: 'Beauty' },
            { value: 'legal', label: 'Юристи' },
            { value: 'translations', label: 'Переклади' },
            { value: 'other', label: 'Інше' },
          ]}
        />

        <Input
          label="Адреса *"
          placeholder="Kastanienallee 12"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <Select
          label="Район"
          value={formData.district}
          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
          options={[
            { value: '', label: 'Оберіть район' },
            ...BERLIN_DISTRICTS.map((d) => ({ value: d, label: d })),
          ]}
        />

        <Textarea
          label="Опис"
          placeholder="Додаткова інформація..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        <LanguageSelector
          selected={formData.languages}
          onChange={(langs) => setFormData({ ...formData, languages: langs })}
        />

        <Input
          label="Телефон"
          type="tel"
          placeholder="+49 30 123 4567"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <Input
          label="Email"
          type="email"
          placeholder="info@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />

        <Input
          label="Веб-сайт"
          type="url"
          placeholder="https://example.com"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <FormActions onCancel={onClose} onSubmit={handleSubmit} submitting={submitting} />
    </FormModalContainer>
  );
}

// Forum Post Form Modal
export function ForumPostFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: '',
    category: 'question',
  });
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });
  }, []);

  const loadProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setProfile(data);
        setFormData(prev => ({
          ...prev,
          author_name: data.full_name || 'Користувач'
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      alert('Будь ласка, заповніть заголовок та питання (*)');
      return;
    }
    if (!user?.id) {
      alert('Потрібна авторизація');
      return;
    }
    try {
      setSubmitting(true);
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        author_name: (profile?.full_name || formData.author_name || 'Користувач').trim(),
        category: formData.category || 'question',
        user_id: user.id,
      };
      console.log('[Forum] Відправка в Supabase...', { title: postData.title });
      await createForumPost(postData);
      console.log('[Forum] Успішно збережено.');
      emitEvent(Events.FORUM_POST_ADDED);
      alert('Пост успішно опубліковано!');
      onClose();
    } catch (error) {
      console.log('Помилка Supabase:', error);
      console.error('Error creating forum post:', error);
      alert(`Помилка при публікації поста:\n\n${formatSupabaseError(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModalContainer
      title="Запитати громаду"
      icon={MessageCircle}
      iconColor="from-green-500 to-emerald-600"
      onClose={onClose}
    >
      <div className="space-y-4">
        <Input
          label="Ваше ім'я *"
          placeholder="Олена"
          value={formData.author_name}
          onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
        />

        <Input
          label="Заголовок *"
          placeholder="Хто знає гарного стоматолога?"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <Textarea
          label="Ваше питання *"
          placeholder="Опишіть детальніше..."
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={5}
        />

        <Select
          label="Категорія"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: 'question', label: 'Питання' },
            { value: 'discussion', label: 'Обговорення' },
            { value: 'announcement', label: 'Оголошення' },
          ]}
        />
      </div>

      <FormActions onCancel={onClose} onSubmit={handleSubmit} submitting={submitting} />
    </FormModalContainer>
  );
}

// Reusable Components
function FormModalContainer({ title, icon: Icon, iconColor, onClose, children }) {
  return (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${iconColor} rounded-2xl flex items-center justify-center`}>
            <Icon size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {children}
    </motion.div>
  );
}

function Input({ label, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
      />
    </div>
  );
}

function Textarea({ label, placeholder, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all resize-none"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-azure-blue focus:border-azure-blue transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LanguageSelector({ selected, onChange }) {
  const languages = ['UA', 'RU', 'DE', 'EN'];
  
  return (
    <div>
      <label className="block text-sm font-bold text-gray-900 mb-2">Мови *</label>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => {
              const newLangs = selected.includes(lang)
                ? selected.filter(l => l !== lang)
                : [...selected, lang];
              onChange(newLangs);
            }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              selected.includes(lang)
                ? 'bg-azure-blue text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormActions({ onCancel, onSubmit, submitting }) {
  return (
    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
      <button
        onClick={onCancel}
        disabled={submitting}
        className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        Скасувати
      </button>
      <button
        onClick={onSubmit}
        disabled={submitting}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-azure-blue to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
      >
        {submitting ? 'Збереження...' : 'Додати'}
      </button>
    </div>
  );
}
