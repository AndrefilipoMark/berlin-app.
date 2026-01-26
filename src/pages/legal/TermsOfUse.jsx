import { motion } from 'framer-motion';
import { ArrowLeft, FileCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function TermsOfUse() {
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
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileCheck size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Nutzungsbedingungen / Умови використання</h1>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100"
        >
          {/* German Version */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Nutzungsbedingungen (Deutsch)</h2>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-sm text-gray-500">
                Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Verantwortlichkeit der Nutzer für ihre Inhalte</h3>
                <p className="mb-3">
                  Als Nutzer dieser Plattform sind Sie allein verantwortlich für alle Inhalte, die Sie erstellen, hochladen, veröffentlichen oder auf andere Weise zur Verfügung stellen. Dies umfasst:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li>Beiträge im Forum</li>
                  <li>Anzeigen (Stellenangebote, Wohnungen, Dienstleistungen)</li>
                  <li>Kommentare und Antworten</li>
                  <li>Nachrichten und Kommunikation mit anderen Nutzern</li>
                  <li>Profilinformationen</li>
                </ul>
                <p className="mb-3">
                  Sie garantieren, dass alle von Ihnen bereitgestellten Inhalte:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Rechtskonform sind und keine Gesetze verletzen</li>
                  <li>Keine Rechte Dritter verletzen (Urheberrechte, Persönlichkeitsrechte, etc.)</li>
                  <li>Wahrheitsgemäß und nicht irreführend sind</li>
                  <li>Keine diskriminierenden, beleidigenden oder illegalen Inhalte enthalten</li>
                </ul>
                <p className="mt-4">
                  <strong>Verantwortlich:</strong> Andriy Filipovych, Halskestr. 14, 12167 Berlin
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Moderation und Inhaltskontrolle</h3>
                <p className="mb-3">
                  Wir behalten uns das Recht vor, alle Inhalte zu überprüfen, zu moderieren und bei Bedarf zu entfernen. Inhalte, die gegen deutsches oder ukrainisches Recht verstoßen, werden <strong>ohne Vorwarnung sofort gelöscht</strong>.
                </p>
                <p className="mb-3">
                  Zu den verbotenen Inhalten gehören insbesondere:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li><strong>Hassrede und Diskriminierung:</strong> Inhalte, die zu Hass, Gewalt oder Diskriminierung aufgrund von Rasse, Ethnie, Religion, Geschlecht, sexueller Orientierung oder anderen Merkmalen aufrufen</li>
                  <li><strong>Illegale Dienstleistungen:</strong> Angebote für illegale Aktivitäten, Waren oder Dienstleistungen</li>
                  <li><strong>Betrug und Täuschung:</strong> Falsche Informationen, Betrugsversuche oder irreführende Angebote</li>
                  <li><strong>Persönlichkeitsrechtsverletzungen:</strong> Verleumdung, Beleidigung oder Verletzung der Privatsphäre Dritter</li>
                  <li><strong>Urheberrechtsverletzungen:</strong> Unbefugte Verwendung geschützter Inhalte</li>
                  <li><strong>Spam und Werbung:</strong> Unerwünschte kommerzielle Nachrichten oder Spam</li>
                </ul>
                <p className="mb-3">
                  Bei wiederholten Verstößen behalten wir uns vor, Nutzerkonten ohne Vorwarnung zu sperren oder zu löschen.
                </p>
                <p>
                  <strong>Kontakt für Beschwerden:</strong> <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Haftungsausschluss für Dienstleistungen Dritter</h3>
                <p className="mb-3">
                  Diese Plattform dient als Vermittlungs- und Informationsplattform. Wir übernehmen <strong>keine Verantwortung</strong> für:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li><strong>Qualität der Dienstleistungen:</strong> Wir garantieren nicht die Qualität, Zuverlässigkeit oder Sicherheit von Dienstleistungen, die von Dritten in unserem Katalog angeboten werden</li>
                  <li><strong>Geschäftstransaktionen:</strong> Wir sind nicht an Geschäftstransaktionen zwischen Nutzern beteiligt und übernehmen keine Haftung für Verträge, Vereinbarungen oder Transaktionen zwischen Nutzern</li>
                  <li><strong>Wohnungsangebote:</strong> Wir überprüfen nicht die Richtigkeit von Wohnungsangeboten oder die Seriosität der Anbieter</li>
                  <li><strong>Stellenangebote:</strong> Wir übernehmen keine Verantwortung für die Richtigkeit von Stellenausschreibungen oder die Seriosität der Arbeitgeber</li>
                  <li><strong>Schäden:</strong> Wir haften nicht für Schäden, die durch die Nutzung von auf unserer Plattform beworbenen Dienstleistungen entstehen</li>
                </ul>
                <p className="mb-3">
                  <strong>Wichtig:</strong> Bitte prüfen Sie immer sorgfältig die Seriosität von Anbietern und schließen Sie Vereinbarungen auf eigene Verantwortung ab. Bei Zweifeln kontaktieren Sie uns bitte.
                </p>
                <p>
                  <strong>Verantwortlich:</strong> Andriy Filipovych, Halskestr. 14, 12167 Berlin, <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Nutzungsrechte und Lizenz</h3>
                <p className="mb-3">
                  Durch das Hochladen von Inhalten gewähren Sie uns eine nicht-exklusive, weltweite, gebührenfreie Lizenz zur Nutzung, Vervielfältigung, Bearbeitung und Verbreitung Ihrer Inhalte im Rahmen der Plattform.
                </p>
                <p>
                  Sie behalten alle Rechte an Ihren Inhalten und können diese jederzeit löschen.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Datenschutz</h3>
                <p>
                  Informationen zum Datenschutz finden Sie in unserer <Link to="/privacy" className="text-azure-blue hover:underline">Datenschutzerklärung</Link>.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Änderungen der Nutzungsbedingungen</h3>
                <p>
                  Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu ändern. Änderungen werden auf dieser Seite veröffentlicht. Die fortgesetzte Nutzung der Plattform nach Veröffentlichung von Änderungen gilt als Zustimmung zu den geänderten Bedingungen.
                </p>
              </section>
            </div>
          </div>

          {/* Ukrainian Version */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Умови використання (Українською)</h2>
            
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p className="text-sm text-gray-500">
                Останнє оновлення: {new Date().toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">1. Відповідальність користувачів за свої слова та контент</h3>
                <p className="mb-3">
                  Як користувач цієї платформи, ви несете повну відповідальність за весь контент, який ви створюєте, завантажуєте, публікуєте або надаєте іншим способом. Це включає:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li>Пости на форумі</li>
                  <li>Оголошення (вакансії, житло, послуги)</li>
                  <li>Коментарі та відповіді</li>
                  <li>Повідомлення та спілкування з іншими користувачами</li>
                  <li>Інформацію профілю</li>
                </ul>
                <p className="mb-3">
                  Ви гарантуєте, що весь наданий вами контент:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Відповідає законодавству та не порушує закони</li>
                  <li>Не порушує права третіх осіб (авторські права, права на зображення тощо)</li>
                  <li>Є правдивим та не вводить в оману</li>
                  <li>Не містить дискримінаційного, образливого або незаконного контенту</li>
                </ul>
                <p className="mt-4">
                  <strong>Відповідальний:</strong> Andriy Filipovych, Halskestr. 14, 12167 Berlin
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">2. Модерація</h3>
                <p className="mb-3">
                  Ми залишаємо за собою право перевіряти, модерувати та за потреби видаляти будь-який контент. Контент, який порушує законодавство Німеччини або України, буде <strong>видалено без попередження</strong>.
                </p>
                <p className="mb-3">
                  До забороненого контенту зокрема належать:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li><strong>Мова ворожнечі та дискримінація:</strong> Контент, який закликає до ненависті, насильства або дискримінації за расою, етнічною приналежністю, релігією, статтю, сексуальною орієнтацією або іншими ознаками</li>
                  <li><strong>Незаконні послуги:</strong> Пропозиції незаконних діяльностей, товарів або послуг</li>
                  <li><strong>Шахрайство та обман:</strong> Неправдива інформація, спроби шахрайства або оманливі пропозиції</li>
                  <li><strong>Порушення прав особистості:</strong> Наклеп, образа або порушення приватності третіх осіб</li>
                  <li><strong>Порушення авторських прав:</strong> Несанкціоноване використання захищеного контенту</li>
                  <li><strong>Спам та реклама:</strong> Небажані комерційні повідомлення або спам</li>
                </ul>
                <p className="mb-3">
                  При повторних порушеннях ми залишаємо за собою право заблокувати або видалити облікові записи користувачів без попередження.
                </p>
                <p>
                  <strong>Контакт для скарг:</strong> <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">3. Відмова від відповідальності за якість послуг, наданих третіми особами в каталозі</h3>
                <p className="mb-3">
                  Ця платформа служить як посередницька та інформаційна платформа. Ми <strong>не несемо відповідальності</strong> за:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2 mb-4">
                  <li><strong>Якість послуг:</strong> Ми не гарантуємо якість, надійність або безпеку послуг, які пропонуються третіми особами в нашому каталозі</li>
                  <li><strong>Бізнес-транзакції:</strong> Ми не беремо участі в бізнес-транзакціях між користувачами та не несемо відповідальності за договори, угоди або транзакції між користувачами</li>
                  <li><strong>Пропозиції житла:</strong> Ми не перевіряємо правильність пропозицій житла або серйозність пропонуючих</li>
                  <li><strong>Вакансії:</strong> Ми не несемо відповідальності за правильність оголошень про роботу або серйозність роботодавців</li>
                  <li><strong>Збитки:</strong> Ми не несемо відповідальності за збитки, що виникають внаслідок використання послуг, рекламованих на нашій платформі</li>
                </ul>
                <p className="mb-3">
                  <strong>Важливо:</strong> Будь ласка, завжди ретельно перевіряйте серйозність пропонуючих та укладайте угоди на власний ризик. У разі сумнівів, будь ласка, зв'яжіться з нами.
                </p>
                <p>
                  <strong>Відповідальний:</strong> Andriy Filipovych, Halskestr. 14, 12167 Berlin, <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">4. Права використання та ліцензія</h3>
                <p className="mb-3">
                  Завантажуючи контент, ви надаєте нам невиключну, всесвітню, безкоштовну ліцензію на використання, відтворення, редагування та поширення вашого контенту в рамках платформи.
                </p>
                <p>
                  Ви зберігаєте всі права на свій контент і можете видалити його в будь-який час.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">5. Захист даних</h3>
                <p>
                  Інформацію про захист даних можна знайти в нашій <Link to="/privacy" className="text-azure-blue hover:underline">Політиці конфіденційності</Link>.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">6. Зміни умов використання</h3>
                <p>
                  Ми залишаємо за собою право змінювати ці умови використання в будь-який час. Зміни будуть опубліковані на цій сторінці. Продовження використання платформи після публікації змін вважається згодою з оновленими умовами.
                </p>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
