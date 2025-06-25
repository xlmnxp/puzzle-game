import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="mb-4 bg-blue-50 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">كيفية اللعب:</h3>
      <ol className="list-decimal list-inside space-y-2 dark:text-gray-300">
        <li>اسحب وأفلت المكعبات الملونة من أسفل الشاشة إلى اللوحة.</li>
        <li>حاول ملء الصفوف والأعمدة بالكامل لإزالتها وكسب نقاط إضافية.</li>
        <li>استمر في اللعب حتى لا يمكن وضع المزيد من المكعبات على اللوحة.</li>
        <li>حاول تحقيق أعلى نتيجة ممكنة!</li>
      </ol>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">تلميح: فكر استراتيجيًا في مكان وضع المكعبات للحصول على أفضل النتائج!</p>
    </div>
  );
};

export default Instructions;