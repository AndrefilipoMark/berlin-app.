import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Impressum() {
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
            <div className="w-12 h-12 bg-gradient-to-br from-azure-blue to-blue-600 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100"
        >
          {/* German Version - Official (Legal Requirement) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Impressum (Deutsch)</h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Angaben gemäß § 5 TMG:</h3>
                <p>
                  <span className="font-semibold">Name:</span> Andriy Filipovych<br />
                  <span className="font-semibold">Adresse:</span> Halskestr. 14<br />
                  <span className="font-semibold">PLZ, Ort:</span> 12167 Berlin
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Kontakt:</h3>
                <p>
                  <span className="font-semibold">E-Mail:</span> <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h3>
                <p>
                  Andriy Filipovych<br />
                  Halskestr. 14<br />
                  12167 Berlin
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Haftungsausschluss:</h3>
                
                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Haftung für Inhalte</h4>
                <p className="mb-3">
                  Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                </p>

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Haftung für nutzergenerierte Inhalte</h4>
                <p className="mb-3">
                  Als Betreiber dieser Website übernehmen wir keine Verantwortung für Inhalte, die von Nutzern erstellt wurden (z.B. Beiträge im Forum, Anzeigen, Kommentare). Wir sind nicht verpflichtet, hochgeladene Informationen ständig zu überwachen. Sollten wir jedoch auf Rechtsverstöße aufmerksam werden, werden wir derartige Inhalte umgehend entfernen.
                </p>

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Haftung für Links</h4>
                <p className="mb-3">
                  Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Urheberrecht</h4>
                <p>
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </div>
            </div>
          </div>

          {/* Ukrainian Version - Translation */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Відомості про видавця (Українською)</h2>
            
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Відомості згідно з § 5 TMG:</h3>
                <p>
                  <span className="font-semibold">Ім'я:</span> Andriy Filipovych<br />
                  <span className="font-semibold">Адреса:</span> Halskestr. 14<br />
                  <span className="font-semibold">Поштовий індекс, місто:</span> 12167 Berlin
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Контакти:</h3>
                <p>
                  <span className="font-semibold">Електронна пошта:</span> <a href="mailto:andrefilipoua@gmail.com" className="text-azure-blue hover:underline">andrefilipoua@gmail.com</a>
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Відповідальний за контент згідно з § 55 Abs. 2 RStV:</h3>
                <p>
                  Andriy Filipovych<br />
                  Halskestr. 14<br />
                  12167 Berlin
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Відмова від відповідальності:</h3>
                
                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Відповідальність за контент</h4>
                <p className="mb-3">
                  Контент наших сторінок був створений з найбільшою ретельністю. Однак ми не можемо гарантувати правильність, повноту та актуальність контенту. Як постачальник послуг, ми відповідаємо за власний контент на цих сторінках відповідно до загальних законів.
                </p>

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Відповідальність за контент користувачів</h4>
                <p className="mb-3">
                  Як власник сайту, ми не несемо відповідальності за контент, створений користувачами (пости на форумі, оголошення, коментарі). Ми не зобов'язані постійно моніторити завантажену інформацію, але у разі виявлення порушень закону такий контент буде негайно видалено.
                </p>

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Відповідальність за посилання</h4>
                <p className="mb-3">
                  Наша пропозиція містить посилання на зовнішні веб-сайти третіх осіб, на вміст яких ми не маємо впливу. Тому ми не можемо гарантувати цей сторонній контент. За вміст пов'язаних сторінок завжди відповідає відповідний постачальник або оператор сторінок.
                </p>

                <h4 className="font-semibold text-gray-800 mt-3 mb-2">Авторське право</h4>
                <p>
                  Контент та роботи, створені операторами сторінок на цих сторінках, підлягають німецькому авторському праву. Відтворення, обробка, поширення та будь-який вид використання за межами авторського права потребують письмової згоди відповідного автора або творця.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
