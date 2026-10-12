import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (mountErr) {
    console.error('Fatal mount error in React root:', mountErr);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #020617; color: #f8fafc; font-family: system-ui, sans-serif; text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
        <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">অ্যাপ লোড হতে সমস্যা হয়েছে</div>
        <button onclick="window.location.reload()" style="background-color: #4f46e5; color: #ffffff; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer;">
          আবার চেষ্টা করুন (Reload)
        </button>
      </div>
    `;
  }
}
