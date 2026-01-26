import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Datenschutzerklärung / Політика конфіденційності</h1>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100 space-y-6"
        >
          {/* German Version - Datenschutzerklärung */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Datenschutzerklärung (Deutsch)</h2>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-sm text-gray-500">
                Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Allgemeine Hinweise</h3>
                <p className="mb-3">
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                </p>
                <p className="mb-3">
                  <strong>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</strong>
                </p>
                <p className="ml-4 mb-4">
                  Andriy Filipovych<br />
                  Halskestr. 14<br />
                  12167 Berlin<br />
                  E-Mail: <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Datenerfassung auf dieser Website</h3>
                
                <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 Welche Daten werden erfasst?</h4>
                <p className="mb-3">
                  Bei der Registrierung und Nutzung unseres Dienstes erfassen wir folgende Daten:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li>Name und Kontaktinformationen (E-Mail-Adresse)</li>
                  <li>Profilinformationen (Biografie, Wohnbezirk, Profilbild)</li>
                  <li>Nutzungsdaten (Anzeigen, Beiträge, Nachrichten)</li>
                  <li>Technische Daten (IP-Adresse, Browsertyp, Datum und Uhrzeit des Zugriffs)</li>
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 Rechtsgrundlage der Datenverarbeitung</h4>
                <p className="mb-3">
                  Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf Grundlage von:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>DSGVO Art. 6 Abs. 1 lit. a:</strong> Ihre Einwilligung zur Datenverarbeitung</li>
                  <li><strong>DSGVO Art. 6 Abs. 1 lit. b:</strong> Erfüllung eines Vertrags zur Bereitstellung von Dienstleistungen</li>
                  <li><strong>DSGVO Art. 6 Abs. 1 lit. f:</strong> Berechtigtes Interesse zur Gewährleistung der Sicherheit und Funktionalität des Dienstes</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Nutzung von Supabase</h3>
                <p className="mb-3">
                  Unsere Website nutzt <strong>Supabase</strong> als Plattform für Datenspeicherung und Benutzerauthentifizierung. Supabase fungiert als Auftragsverarbeiter gemäß DSGVO.
                </p>
                <p className="mb-3">
                  <strong>Supabase</strong> speichert und verarbeitet Ihre Daten auf Servern, die sich in der Europäischen Union befinden, was die Einhaltung der DSGVO-Anforderungen zur Datenübertragung gewährleistet.
                </p>
                <p className="mb-4">
                  Weitere Informationen zur Datenschutzerklärung von Supabase finden Sie auf deren offiziellen Website: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-azure-blue hover:underline">https://supabase.com/privacy</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Zweck der Datenverarbeitung</h3>
                <p className="mb-3">Ihre personenbezogenen Daten werden für folgende Zwecke verarbeitet:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Bereitstellung und Verbesserung der Funktionalität der Plattform</li>
                  <li>Gewährleistung der Sicherheit und Verhinderung von Missbrauch</li>
                  <li>Kommunikation mit Nutzern bezüglich des Dienstes</li>
                  <li>Einhaltung rechtlicher Verpflichtungen</li>
                  <li>Analyse der Nutzung zur Verbesserung des Dienstes</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Weitergabe von Daten an Dritte</h3>
                <p className="mb-3">
                  Wir geben Ihre Daten nur in folgenden Fällen weiter:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Supabase:</strong> Zur Speicherung und Verarbeitung von Daten (Auftragsverarbeiter)</li>
                  <li><strong>Rechtliche Anforderungen:</strong> Wenn dies gesetzlich vorgeschrieben oder durch Gerichtsbeschluss erforderlich ist</li>
                  <li><strong>Rechtsschutz:</strong> Zum Schutz unserer Rechte und der Sicherheit der Nutzer</li>
                </ul>
                <p className="mt-4">
                  Wir verkaufen oder geben Ihre Daten nicht an Dritte zu Marketingzwecken weiter.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Ihre Rechte (DSGVO)</h3>
                <p className="mb-3">Gemäß DSGVO haben Sie folgende Rechte:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Recht auf Auskunft (Art. 15 DSGVO):</strong> Sie können Informationen über die Verarbeitung Ihrer Daten erhalten</li>
                  <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können unrichtige Daten korrigieren</li>
                  <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen</li>
                  <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Verarbeitung Ihrer Daten einschränken</li>
                  <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können Ihre Daten in einem strukturierten Format erhalten</li>
                  <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen</li>
                  <li><strong>Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie können Ihre Einwilligung jederzeit widerrufen</li>
                </ul>
                <p className="mt-4">
                  Um Ihre Rechte auszuüben, kontaktieren Sie uns bitte unter: <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. Datenspeicherung</h3>
                <p className="mb-3">
                  Wir speichern Ihre personenbezogenen Daten nur so lange, wie es für die in dieser Richtlinie genannten Zwecke erforderlich ist oder gesetzlich vorgeschrieben ist.
                </p>
                <p>
                  Nach der Löschung Ihres Kontos werden Ihre Daten gelöscht oder anonymisiert, es sei denn, es bestehen rechtliche Verpflichtungen zur Aufbewahrung.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. Datensicherheit</h3>
                <p className="mb-3">
                  Wir ergreifen technische und organisatorische Maßnahmen zum Schutz Ihrer personenbezogenen Daten vor unbefugtem Zugriff, Verlust, Zerstörung oder Änderung.
                </p>
                <p>
                  Alle Daten werden über eine verschlüsselte Verbindung (HTTPS) übertragen, und der Zugriff auf Daten ist eingeschränkt und kontrolliert.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">9. Cookies und Tracking-Technologien</h3>
                <p>
                  Unsere Website verwendet notwendige Cookies für die Funktionalität des Dienstes (z.B. zur Speicherung der Benutzersitzung). Wir verwenden keine Cookies für Tracking oder Werbung.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">10. Beschwerderecht</h3>
                <p className="mb-3">
                  Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen die DSGVO verstößt, haben Sie das Recht, eine Beschwerde bei der Aufsichtsbehörde einzureichen:
                </p>
                <p className="ml-4">
                  <strong>Die Bundesbeauftragte für den Datenschutz und die Informationsfreiheit</strong><br />
                  Graurheindorfer Str. 153<br />
                  53117 Bonn<br />
                  Telefon: +49 (0)228-997799-0<br />
                  E-Mail: poststelle@bfdi.bund.de<br />
                  Website: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-azure-blue hover:underline">www.bfdi.bund.de</a>
                </p>
              </section>
            </div>
          </div>

          {/* Ukrainian Version - Політика конфіденційності */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Політика конфіденційності (Українською)</h2>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-sm text-gray-500">
                Останнє оновлення: {new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Загальні положення</h3>
                <p className="mb-3">
                  Ця політика конфіденційності пояснює, як ми збираємо, використовуємо та захищаємо ваші персональні дані відповідно до Загального регламенту ЄС про захист даних (GDPR/DSGVO) та німецького законодавства про захист даних (BDSG).
                </p>
                <p className="mb-3">
                  <strong>Відповідальний за обробку даних на цьому веб-сайті:</strong>
                </p>
                <p className="ml-4 mb-4">
                  Andriy Filipovych<br />
                  Halskestr. 14<br />
                  12167 Berlin<br />
                  E-Mail: <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Збір та обробка даних</h3>
                
                <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 Дані, які ми збираємо</h4>
                <p className="mb-3">
                  При реєстрації та використанні нашого сервісу ми збираємо наступні дані:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li>Ім'я та контактна інформація (електронна пошта)</li>
                  <li>Профільна інформація (біографія, район проживання, фото профілю)</li>
                  <li>Дані про використання сервісу (оголошення, пости, повідомлення)</li>
                  <li>Технічні дані (IP-адреса, тип браузера, дата та час доступу)</li>
                </ul>

                <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 Правова основа обробки</h4>
                <p className="mb-3">
                  Обробка ваших персональних даних здійснюється на основі:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>GDPR Art. 6(1)(a):</strong> Ваша згода на обробку даних</li>
                  <li><strong>GDPR Art. 6(1)(b):</strong> Виконання договору про надання послуг</li>
                  <li><strong>GDPR Art. 6(1)(f):</strong> Законний інтерес для забезпечення безпеки та функціональності сервісу</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Використання сервісів Supabase</h3>
                <p className="mb-3">
                  Наш сайт використовує <strong>Supabase</strong> як платформу для зберігання даних та аутентифікації користувачів. Supabase діє як обробник даних відповідно до GDPR.
                </p>
                <p className="mb-3">
                  <strong>Supabase</strong> зберігає та обробляє ваші дані на серверах, розташованих в Європейському Союзі, що забезпечує відповідність вимогам GDPR щодо передачі даних.
                </p>
                <p className="mb-4">
                  Більше інформації про політику конфіденційності Supabase можна знайти на їх офіційному сайті: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-azure-blue hover:underline">https://supabase.com/privacy</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Мета обробки даних</h3>
                <p className="mb-3">Ваші персональні дані обробляються для наступних цілей:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Надання та покращення функціональності платформи</li>
                  <li>Забезпечення безпеки та запобігання зловживанням</li>
                  <li>Комунікація з користувачами щодо сервісу</li>
                  <li>Дотримання юридичних зобов'язань</li>
                  <li>Аналіз використання для покращення сервісу</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Передача даних третім особам</h3>
                <p className="mb-3">
                  Ми передаємо ваші дані тільки в наступних випадках:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Supabase:</strong> Для зберігання та обробки даних (обробник даних)</li>
                  <li><strong>Юридичні вимоги:</strong> Якщо це вимагається законом або судовим рішенням</li>
                  <li><strong>Захист прав:</strong> Для захисту наших прав та безпеки користувачів</li>
                </ul>
                <p className="mt-4">
                  Ми не продаємо та не передаємо ваші дані третім особам для маркетингових цілей.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Ваші права (GDPR)</h3>
                <p className="mb-3">Відповідно до GDPR, ви маєте наступні права:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Право на доступ (Art. 15 GDPR):</strong> Ви можете отримати інформацію про обробку ваших даних</li>
                  <li><strong>Право на виправлення (Art. 16 GDPR):</strong> Ви можете виправити неточні дані</li>
                  <li><strong>Право на видалення (Art. 17 GDPR):</strong> Ви можете вимагати видалення ваших даних</li>
                  <li><strong>Право на обмеження обробки (Art. 18 GDPR):</strong> Ви можете обмежити обробку ваших даних</li>
                  <li><strong>Право на переносимість даних (Art. 20 GDPR):</strong> Ви можете отримати свої дані в структурованому форматі</li>
                  <li><strong>Право на заперечення (Art. 21 GDPR):</strong> Ви можете заперечити проти обробки даних</li>
                  <li><strong>Право відкликати згоду (Art. 7(3) GDPR):</strong> Ви можете в будь-який час відкликати свою згоду</li>
                </ul>
                <p className="mt-4">
                  Для реалізації ваших прав, будь ласка, зв'яжіться з нами за адресою: <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">7. Зберігання даних</h3>
                <p className="mb-3">
                  Ми зберігаємо ваші персональні дані тільки стільки часу, скільки це необхідно для виконання цілей, зазначених у цій політиці, або стільки, скільки вимагається законом.
                </p>
                <p>
                  Після видалення облікового запису ваші дані будуть видалені або анонімізовані, якщо немає юридичних зобов'язань для їх зберігання.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">8. Безпека даних</h3>
                <p className="mb-3">
                  Ми вживаємо технічних та організаційних заходів для захисту ваших персональних даних від несанкціонованого доступу, втрати, знищення або зміни.
                </p>
                <p>
                  Всі дані передаються через зашифроване з'єднання (HTTPS), а доступ до даних обмежений та контролюється.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">9. Cookies та технології відстеження</h3>
                <p>
                  Наш сайт використовує необхідні cookies для функціональності сервісу (наприклад, для збереження сесії користувача). Ми не використовуємо cookies для відстеження або реклами.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">10. Право на скаргу</h3>
                <p className="mb-3">
                  Якщо ви вважаєте, що обробка ваших персональних даних порушує GDPR, ви маєте право подати скаргу до наглядового органу:
                </p>
                <p className="ml-4">
                  <strong>Die Bundesbeauftragte für den Datenschutz und die Informationsfreiheit</strong><br />
                  Graurheindorfer Str. 153<br />
                  53117 Bonn<br />
                  Телефон: +49 (0)228-997799-0<br />
                  E-Mail: poststelle@bfdi.bund.de<br />
                  Веб-сайт: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="text-azure-blue hover:underline">www.bfdi.bund.de</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">11. Контакти</h3>
                <p className="mb-3">
                  Якщо у вас є питання щодо обробки ваших персональних даних або ви хочете реалізувати свої права, будь ласка, зв'яжіться з нами:
                </p>
                <p className="ml-4">
                  E-Mail: <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a><br />
                  Адреса: Halskestr. 14, 12167 Berlin
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
