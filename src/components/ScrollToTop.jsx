import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Компонент для автоматичного прокручування сторінки вгору при зміні маршруту
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Невелика затримка для того, щоб анімація переходу встигла початися
    const timer = setTimeout(() => {
      // Прокручуємо сторінку вгору при зміні маршруту
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Миттєво, без анімації
      });
      
      // Також прокручуємо основний контейнер, якщо він є
      const mainContainer = document.querySelector('.min-h-screen');
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
      
      // Для сторінки чату - прокручуємо контейнер повідомлень
      if (pathname.startsWith('/chat')) {
        // Шукаємо контейнер повідомлень за класом
        const messagesContainer = document.querySelector('.overflow-y-auto');
        if (messagesContainer && messagesContainer.scrollTop !== undefined) {
          messagesContainer.scrollTop = 0;
        }
        
        // Також прокручуємо window для чату
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
