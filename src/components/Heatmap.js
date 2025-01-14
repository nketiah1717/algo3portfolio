import React from "react";
import '../styles/Heatmap.css';

const Heatmap = ({ data }) => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Функция для расчета интенсивности цвета
  const calculateColor = (value, maxAbsValue) => {
    const intensity = Math.min(Math.abs(value) / maxAbsValue, 1); // Нормализация значения
    if (value >= 0) {
      // Градиент синего
      return `rgba(51, 102, 153, ${0.3 + intensity * 0.7})`; // От светлого к насыщенному
    } else {
      // Градиент оранжевого
      return `rgba(204, 85, 0, ${0.3 + intensity * 0.7})`;
    }
  };

  // Найти максимальное абсолютное значение для нормализации
  const maxAbsValue = Math.max(
    ...Object.values(data)
      .flatMap((monthlyData) => monthlyData.filter((val) => val !== undefined))
      .map(Math.abs)
  );

  return (
    <div className="heatmap-container">
      {Object.keys(data).map((year) => (
        <div key={year} className="heatmap-year">
          <h4 className="heatmap-year-title">{year}</h4>
          <div className="heatmap-months">
            {months.map((month, index) => {
              const value = data[year][index];
              if (value === undefined) return null; // Пропуск ячеек без данных

              const backgroundColor = calculateColor(value, maxAbsValue);

              return (
                <div
                  key={`${year}-${month}`}
                  className="heatmap-cell"
                  style={{ backgroundColor }}
                  title={`${month} ${year}: ${(value * 100).toFixed(1)}%`}
                >
                  <div className="heatmap-label">{month}</div>
                  <div className="heatmap-value">{(value * 100).toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Heatmap;
