# RedVelvet Platform - Руководство по оформлению кнопок

## 📋 Общие принципы

Все кнопки на платформе должны следовать единому стилю и использовать предопределённые CSS-классы.

## 🎨 Стандартные классы кнопок

### Базовый класс
Все кнопки должны иметь базовый класс `.btn`:
```html
<button class="btn">Базовая кнопка</button>
```

### Варианты стилей

#### 1. Primary (Основная) - `.btn-primary`
Используется для главных действий на странице
```html
<button class="btn btn-primary">Сохранить анкету</button>
```
- Цвет фона: `--primary-orange` (#FF6B35)
- Используется для: основные формы, подтверждения

#### 2. Secondary (Второстепенная) - `.btn-secondary`
Используется для важных, но не главных действий
```html
<button class="btn btn-secondary">Привязать криптокошелек</button>
```
- Цвет фона: `--secondary-orange` (#FF8C42)
- Используется для: настройки, дополнительные функции

#### 3. Outline (Контурная) - `.btn-outline`
Используется для менее важных действий
```html
<button class="btn btn-outline">Выход</button>
```
- Прозрачный фон с оранжевой границей
- Используется для: выход, отмена, второстепенные действия

## 📐 Правила размещения

### Группы кнопок

Для группировки кнопок используйте контейнер `.dashboard-actions`:
```html
<div class="dashboard-actions">
    <button class="btn btn-secondary">Привязать криптокошелек</button>
    <button class="btn btn-outline">Выход</button>
</div>
```

### Встроенные стили

⚠️ **ИЗБЕГАЙТЕ** встроенных стилей (inline styles) для кнопок!

**❌ Плохо:**
```html
<button class="btn btn-primary" style="flex: 1; margin-top: 20px;">Кнопка</button>
```

**✅ Хорошо:**
```html
<div class="dashboard-actions">
    <button class="btn btn-primary">Кнопка</button>
</div>
```

## 🎯 Примеры использования

### Личный кабинет клиента
```html
<div class="dashboard-header">
    <h2>Личный кабинет клиента</h2>
    <div class="dashboard-actions">
        <button class="btn btn-secondary" onclick="showWalletModal()">Привязать криптокошелек</button>
        <button class="btn btn-outline" onclick="logout()">Выход</button>
    </div>
</div>
```

### Панель модели
```html
<div class="dashboard-actions">
    <button class="btn btn-secondary" onclick="showWalletModal()">Привязать криптокошелек</button>
    <button class="btn btn-outline" onclick="logout()">Выход</button>
</div>
```

### Формы
```html
<form onsubmit="saveProfile(event)">
    <!-- Поля формы -->
    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">
        Сохранить анкету
    </button>
</form>
```
*Примечание: В формах допускается `width: 100%` для растягивания кнопки на всю ширину*

### Модальные окна
```html
<div class="modal-content">
    <h2>Привязать криптокошелек</h2>
    <form onsubmit="handleWalletLink(event)">
        <!-- Поля формы -->
        <button type="submit" class="btn btn-primary" style="width: 100%;">Привязать</button>
    </form>
</div>
```

### Навигация
```html
<nav>
    <button class="btn btn-secondary" onclick="showRegister()">Регистрация клиента</button>
    <button class="btn btn-outline" onclick="showModelInterface()">Создать анкету модели</button>
</nav>
```

## 🎨 Иерархия кнопок по важности

1. **btn-primary** - Главное действие на странице (только одна!)
2. **btn-secondary** - Важные действия (может быть несколько)
3. **btn-outline** - Второстепенные действия (выход, отмена)

## ⚡ CSS стили кнопок

```css
.btn {
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: none;
    letter-spacing: 0.3px;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary-orange), var(--secondary-orange));
    color: var(--text-white);
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.6);
}

.btn-secondary {
    background: var(--secondary-orange);
    color: var(--text-white);
    box-shadow: 0 4px 15px rgba(255, 140, 66, 0.3);
}

.btn-secondary:hover {
    background: var(--primary-orange);
    transform: translateY(-2px);
}

.btn-outline {
    background: transparent;
    color: var(--primary-orange);
    border: 2px solid var(--primary-orange);
}

.btn-outline:hover {
    background: var(--primary-orange);
    color: var(--text-white);
}

.dashboard-actions {
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
}
```

## 📝 Чек-лист при добавлении новой кнопки

- [ ] Использую класс `.btn` в качестве базового
- [ ] Выбрал подходящий класс стиля (primary/secondary/outline)
- [ ] Избегаю inline-стилей (кроме width: 100% в формах)
- [ ] Если это группа кнопок - использую `.dashboard-actions`
- [ ] Проверил, что кнопка соответствует иерархии важности
- [ ] Убедился, что onclick-функция существует и работает

## 🚫 Что НЕ нужно делать

❌ Использовать inline-стили для позиционирования:
```html
<button class="btn btn-primary" style="flex: 1; margin-top: 20px;">НЕ ДЕЛАЙ ТАК</button>
```

❌ Создавать кастомные стили для кнопок:
```html
<button class="btn custom-orange-button">НЕ ДЕЛАЙ ТАК</button>
```

❌ Смешивать разные стили в одном месте:
```html
<button class="btn btn-primary btn-secondary">НЕ ДЕЛАЙ ТАК</button>
```

## ✅ Что нужно делать

✅ Использовать стандартные классы:
```html
<button class="btn btn-secondary">ПРАВИЛЬНО</button>
```

✅ Группировать кнопки в контейнере:
```html
<div class="dashboard-actions">
    <button class="btn btn-secondary">Кнопка 1</button>
    <button class="btn btn-outline">Кнопка 2</button>
</div>
```

✅ Следовать иерархии важности

---

**Дата создания:** 2025-11-02
**Автор:** RedVelvet Development Team

*Этот документ является обязательным руководством для всех разработчиков платформы RedVelvet*
