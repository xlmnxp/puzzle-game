import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="mb-4 game-panel text-right">
      <h3 className="text-lg font-bold mb-2 text-yellow-600">كيفية اللعب:</h3>
      <ol className="list-decimal list-inside space-y-2 text-slate-800 font-medium">
        <li>اسحب وأفلت المكعبات الملونة من أسفل الشاشة إلى اللوحة.</li>
        <li>حاول ملء الصفوف والأعمدة بالكامل لإزالتها وكسب نقاط إضافية.</li>
        <li>استمر في اللعب حتى لا يمكن وضع المزيد من المكعبات على اللوحة.</li>
        <li>حاول تحقيق أعلى نتيجة ممكنة!</li>
      </ol>
      <p className="mt-3 text-sm text-blue-900 bg-blue-50/50 p-2 rounded border border-blue-500/30">
        💡 تلميح: فكر استراتيجيًا في مكان وضع المكعبات للحصول على أفضل النتائج!
      </p>
    </div>
  );
};

export default Instructions;