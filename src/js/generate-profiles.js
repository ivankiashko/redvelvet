// Генератор тестовых анкет для RedVelvet Platform

// Данные для генерации
const NAMES = [
    'Алиса', 'Вика', 'Даша', 'Катя', 'Лена', 'Маша', 'Настя', 'Оля', 'Полина', 'Рита',
    'Света', 'Таня', 'Юля', 'Анна', 'Вера', 'Диана', 'Ева', 'Жанна', 'Злата', 'Инна',
    'Кира', 'Лиза', 'Милана', 'Надя', 'Олеся', 'Полина', 'Регина', 'София', 'Тамара', 'Ульяна'
];

const CITIES = ['moscow', 'spb', 'krasnodar', 'sochi', 'ekaterinburg', 'kazan'];

const EYE_COLORS = ['Карие', 'Зеленые', 'Голубые', 'Серые'];
const HAIR_COLORS = ['Блондинка', 'Брюнетка', 'Шатенка', 'Рыжая'];
const NATIONALITIES = ['Славянка', 'Азиатка', 'Латиноамериканка', 'Смешанная'];
const BODY_TYPES = ['Стройная', 'Спортивная', 'Аппетитная', 'Модельная'];
const BUST_SIZES = ['1', '2', '3', '4', '5', '6+'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L'];

const SERVICES = [
    'Классический секс',
    'Секс в презервативе',
    'Минет без презерватива',
    'Минет глубокий',
    'Окончание в рот',
    'Куннилингус',
    'Анальный секс',
    'Эротический массаж',
    'Расслабляющий массаж',
    'Лесби-шоу',
    'Групповой секс',
    'ЖМЖ',
    'БДСМ',
    'Доминация',
    'Страпон',
    'Стриптиз',
    'Эскорт',
    'VIP сопровождение',
    'Выезд в отель',
    'Выезд на дом',
    'Услуги для пар'
];

const DESCRIPTIONS = [
    'Привет! Я обожаю общение с интересными людьми и создание незабываемой атмосферы.',
    'Добрый день! Предлагаю приятно провести время в моей компании.',
    'Здравствуйте! Люблю комфорт и создаю уютную обстановку для каждой встречи.',
    'Приветствую! Очень внимательна к деталям и пожеланиям.',
    'Привет! Ценю искренность и взаимное уважение.',
    'Здравствуй! Я за яркие эмоции и незабываемые впечатления.',
    'Добрый день! Обожаю путешествия и новые знакомства.',
    'Приветствую! Деликатная, внимательная, с отличным чувством юмора.',
    'Привет! Предпочитаю качество количеству.',
    'Здравствуйте! Интеллигентная, образованная, всегда на позитиве.'
];

// Генератор placeholder изображений
function generatePlaceholderImage(name, index) {
    const colors = [
        '#FF6B35', '#FF8C42', '#FFA07A', '#FF69B4', '#9370DB',
        '#4169E1', '#20B2AA', '#3CB371', '#FFD700', '#FF6347'
    ];
    const color = colors[index % colors.length];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500">
        <defs>
            <linearGradient id="grad${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect fill="url(#grad${index})" width="400" height="500"/>
        <text fill="#ffffff" x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" font-weight="bold">${name}</text>
    </svg>`;

    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Генератор случайного номера телефона
function generatePhoneNumber() {
    const codes = ['901', '902', '903', '904', '905', '906', '909', '910', '911', '912', '913', '914', '915', '916', '917', '918', '919', '920'];
    const code = codes[Math.floor(Math.random() * codes.length)];
    const num1 = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    const num2 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    const num3 = String(Math.floor(Math.random() * 100)).padStart(2, '0');
    return `+7 (${code}) ${num1}-${num2}-${num3}`;
}

// Функция получения случайного элемента из массива
function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Функция получения случайного числа в диапазоне
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Функция получения случайных элементов из массива
function randomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Генератор одной анкеты
function generateProfile(index) {
    const name = randomItem(NAMES);
    const age = randomInt(18, 35);
    const height = randomInt(155, 180);
    const weight = randomInt(45, 65);
    const price = randomInt(3000, 25000);
    const services = randomItems(SERVICES, randomInt(3, 8));

    // Генерируем 3 изображения
    const images = [
        { type: 'image/svg+xml', data: generatePlaceholderImage(name, index * 3), name: `${name}_1.svg` },
        { type: 'image/svg+xml', data: generatePlaceholderImage(name, index * 3 + 1), name: `${name}_2.svg` },
        { type: 'image/svg+xml', data: generatePlaceholderImage(name, index * 3 + 2), name: `${name}_3.svg` }
    ];

    return {
        id: Date.now() + index,
        name: name,
        age: age,
        city: randomItem(CITIES),
        height: height,
        weight: weight,
        bustSize: randomItem(BUST_SIZES),
        eyeColor: randomItem(EYE_COLORS),
        hairColor: randomItem(HAIR_COLORS),
        nationality: randomItem(NATIONALITIES),
        bodyType: randomItem(BODY_TYPES),
        clothingSize: randomItem(CLOTHING_SIZES),
        description: randomItem(DESCRIPTIONS),
        services: services,
        price: price,
        phone: generatePhoneNumber(),
        images: images,
        videos: [],
        rating: Math.random() * 5,
        reviewCount: randomInt(0, 50),
        views: randomInt(0, 1000),
        verified: Math.random() > 0.5,
        createdAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000).toISOString()
    };
}

// Основная функция генерации профилей
function generateProfiles(count = 20) {
    const profiles = [];

    for (let i = 0; i < count; i++) {
        profiles.push(generateProfile(i));
    }

    return profiles;
}

// Функция для добавления сгенерированных профилей в AppState
function addGeneratedProfilesToApp(count = 20) {
    if (typeof AppState === 'undefined') {
        console.error('AppState не определен. Убедитесь, что app.js загружен.');
        return;
    }

    const newProfiles = generateProfiles(count);

    // Добавляем новые профили к существующим
    AppState.profiles.push(...newProfiles);

    // Сохраняем в localStorage
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    } else {
        localStorage.setItem('redvelvet_profiles', JSON.stringify(AppState.profiles));
    }

    // Обновляем фильтры услуг
    if (typeof updateServiceFilter === 'function') {
        updateServiceFilter();
    }

    // Перерисовываем профили
    if (typeof renderHomeProfiles === 'function') {
        renderHomeProfiles();
    }
    if (typeof renderProfiles === 'function') {
        renderProfiles();
    }

    console.log(`✅ Успешно добавлено ${count} анкет!`);

    if (typeof showToast === 'function') {
        showToast(`Успешно добавлено ${count} тестовых анкет с фото и телефонами!`, 'success', 5000);
    }

    return newProfiles;
}

// Функция для очистки всех профилей
function clearAllProfiles() {
    if (typeof AppState === 'undefined') {
        console.error('AppState не определен.');
        return;
    }

    AppState.profiles = [];
    AppState.reviews = {};

    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    } else {
        localStorage.setItem('redvelvet_profiles', JSON.stringify([]));
        localStorage.setItem('redvelvet_reviews', JSON.stringify({}));
    }

    if (typeof renderHomeProfiles === 'function') {
        renderHomeProfiles();
    }
    if (typeof renderProfiles === 'function') {
        renderProfiles();
    }

    console.log('✅ Все анкеты удалены');

    if (typeof showToast === 'function') {
        showToast('Все анкеты удалены', 'info', 3000);
    }
}

// Экспортируем функции для использования в консоли
if (typeof window !== 'undefined') {
    window.generateProfiles = generateProfiles;
    window.addGeneratedProfilesToApp = addGeneratedProfilesToApp;
    window.clearAllProfiles = clearAllProfiles;

    console.log('%c🎉 Генератор анкет загружен!', 'color: #FF6B35; font-size: 16px; font-weight: bold;');
    console.log('%cИспользуйте:', 'color: #FF8C42; font-size: 14px;');
    console.log('%c  addGeneratedProfilesToApp(20) - Добавить 20 анкет', 'color: #FFA07A; font-size: 12px;');
    console.log('%c  clearAllProfiles() - Очистить все анкеты', 'color: #FFA07A; font-size: 12px;');
}
