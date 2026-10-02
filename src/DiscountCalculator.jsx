import { useState } from "react";
import "./DiscountCalculator.css";

// Справочник категорий: ключ — id, значение — { label, discount }
// discount хранится в процентах (число)
const CATEGORIES = [
  { id: "electronics", label: "Электроника", discount: 5 },
  { id: "clothing",    label: "Одежда",      discount: 15 },
  { id: "groceries",   label: "Продукты",    discount: 10 },
  { id: "books",       label: "Книги",       discount: 20 },
  { id: "other",       label: "Другое",      discount: 0 },
];

// Ставка НДС в долях (22%)
const VAT_RATE = 0.22;

function DiscountCalculator() {
  // --- Состояние ---
  const [items, setItems] = useState([
    { id: Date.now(), price: "", category: "electronics" }
  ]);
  const [promoCode, setPromoCode] = useState("");
  // Признак того, что пользователь нажал «Рассчитать»
  // До первого нажатия результаты не показываем
  const [calculated, setCalculated] = useState(false);
  // Сообщение об ошибке валидации цены
  const [error, setError] = useState("");

  // --- Обработчики событий ---
  // Изменение цены: разрешаем только цифры и точку
  function handlePriceChange(id, value) {
    // Разрешаем пустую строку (чтобы пользователь мог стереть поле)
    // и числа с одной точкой
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setItems(items.map(item => item.id === id ? { ...item, price: value } : item));
      setError("");         // Сбрасываем ошибку при вводе
      setCalculated(false); // Пересчёт нужен заново
    }
  }

  // Изменение категории
  function handleCategoryChange(id, catId) {
    setItems(items.map(item => item.id === id ? { ...item, category: catId } : item));
    setCalculated(false); // Категория изменилась — результаты устарели
  }

  function handlePromoChange(e) {
    setPromoCode(e.target.value);
    setCalculated(false);
  }

  function handleAddItem() {
    setItems([...items, { id: Date.now(), price: "", category: "electronics" }]);
    setCalculated(false);
  }

  function handleRemoveItem(id) {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
      setCalculated(false);
    }
  }

  // Нажатие кнопки «Рассчитать»
  function handleCalculate() {
    for (let item of items) {
      // Валидация: пустое поле
      if (!item.price.trim()) {
        setError("Введите цену товара");
        setCalculated(false);
        return;
      }
      const numPrice = parseFloat(item.price);
      // Валидация: не число или отрицательное
      if (isNaN(numPrice) || numPrice <= 0) {
        setError("Цена должна быть положительным числом");
        setCalculated(false);
        return;
      }
    }
    // Валидация прошла — показываем результаты
    setError("");
    setCalculated(true);
  }

  // Сброс формы
  function handleReset() {
    setItems([{ id: Date.now(), price: "", category: "electronics" }]);
    setPromoCode("");
    setCalculated(false);
    setError("");
  }

  // --- Вычисления ---
  const isPromoValid = promoCode.trim() === "WELCOME10";
  const promoDiscount = isPromoValid ? 10 : 0;

  const calculatedItems = items.map(item => {
    const selectedCategory = CATEGORIES.find((c) => c.id === item.category);
    const numPrice = parseFloat(item.price) || 0;
    const categoryDiscountPercent = selectedCategory ? selectedCategory.discount : 0;
    const discountPercent = categoryDiscountPercent + promoDiscount;
    const discountAmount = calculated ? numPrice * (discountPercent / 100) : 0;
    const priceAfterDiscount = calculated ? numPrice - discountAmount : 0;
    const vatAmount = calculated ? priceAfterDiscount * VAT_RATE : 0;
    const total = calculated ? priceAfterDiscount + vatAmount : 0;

    return {
      numPrice,
      discountAmount,
      vatAmount,
      total
    };
  });

  const totalInitialPrice = calculatedItems.reduce((sum, item) => sum + item.numPrice, 0);
  const totalDiscountAmount = calculatedItems.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalVatAmount = calculatedItems.reduce((sum, item) => sum + item.vatAmount, 0);
  const finalTotal = calculatedItems.reduce((sum, item) => sum + item.total, 0);

  // Вспомогательная функция: форматирование в рублях
  function formatRub(value) {
    return value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // --- Разметка ---
  return (
    <div className="calculator-wrapper">
      <h2 className="calculator-title">Калькулятор скидок</h2>

      {items.map((item, index) => (
        <div key={item.id} className="item-row" style={{ borderBottom: "1px dashed #e5e7eb", paddingBottom: "16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="field__label">Товар №{index + 1}</span>
            {items.length > 1 && (
              <button type="button" onClick={() => handleRemoveItem(item.id)} className="btn-remove" style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
                Удалить
              </button>
            )}
          </div>

        {/* Поле ввода цены */}
          <div className="field">
            <label htmlFor={`price-${item.id}`} className="field__label">
              Цена товара (₽)
            </label>
            <input
              id={`price-${item.id}`}
              type="text"
              className={`field__input ${error && !item.price.trim() ? "field__input--error" : ""}`}
              value={item.price}
              onChange={(e) => handlePriceChange(item.id, e.target.value)}
              placeholder="Например: 1000"
              inputMode="decimal"
            />
          </div>


          {/* Выбор категории */}
          <div className="field">
            <label htmlFor={`category-${item.id}`} className="field__label">
              Категория товара
            </label>
            <select
              id={`category-${item.id}`}
              className="field__input field__select"
              value={item.category}
              onChange={(e) => handleCategoryChange(item.id, e.target.value)}
            >
              {/* Генерируем <option> из справочника категорий */}
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} — скидка {cat.discount}%
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {/* Показываем ошибку, если она есть */}
      {error && <div className="field__error" style={{ marginBottom: "16px" }}>{error}</div>}

      <button type="button" onClick={handleAddItem} className="btn btn--secondary" style={{ width: "100%", marginBottom: "16px" }}>
        + Добавить товар
      </button>

      <div className="field">
        <label htmlFor="promoCode" className="field__label">
          Промокод
        </label>
        <input
          id="promoCode"
          type="text"
          className="field__input"
          value={promoCode}
          onChange={handlePromoChange}
          placeholder="Введите промокод"
        />
      </div>

      {/* Кнопки */}
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={handleCalculate}>
          Рассчитать
        </button>
        <button type="button" className="btn btn--secondary" onClick={handleReset}>
          Сбросить
        </button>
      </div>

      {/* Результаты — показываем только после расчёта */}
      {calculated && !error && (
        <div className="results">
          <h3 className="results__title">Результат расчёта</h3>
          <table className="results__table">
            <tbody>
              <tr>
                <td>Исходная цена</td>
                <td className="results__value">{formatRub(totalInitialPrice)} ₽</td>
              </tr>
              <tr>
                <td>Скидка</td>
                <td className="results__value results__value--discount">
                  −{formatRub(totalDiscountAmount)} ₽
                </td>
              </tr>
              <tr>
                <td>НДС (22%)</td>
                <td className="results__value">+{formatRub(totalVatAmount)} ₽</td>
              </tr>
              <tr className="results__row--total">
                <td>Итого к оплате</td>
                <td className="results__value">{formatRub(finalTotal)} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DiscountCalculator;
