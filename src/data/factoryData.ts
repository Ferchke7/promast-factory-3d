export interface FinishPreset {
  id: string;
  name: string;
  code: string;
  hex: string;
  metalness: number;
  roughness: number;
  accentHex: string;
}

export interface StudioHotspot {
  id: string;
  index: string;
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  priceLabel: string;
  serviceValue: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  lookAt: [number, number, number];
}

export interface ServiceCardItem {
  index: string;
  title: string;
  description: string;
  price: string;
  serviceValue: string;
}

export interface ProcessStep {
  index: string;
  title: string;
  description: string;
}

export interface SectionKeyframe {
  id: string;
  label: string;
  cameraPos: [number, number, number];
  target: [number, number, number];
  fov: number;
  liftProgress: number;
  explodeProgress: number;
  laserScan: boolean;
  spindleRpm: number;
}

export const FINISH_PRESETS: FinishPreset[] = [
  {
    id: 'cobalt',
    name: 'Кобальт анодированный',
    code: 'RAL 5002 · STD',
    hex: '#283f78',
    metalness: 0.72,
    roughness: 0.24,
    accentHex: '#ff5500',
  },
  {
    id: 'ceramic',
    name: 'Керамический белый',
    code: 'RAL 9016 · CLEAN',
    hex: '#d9dde3',
    metalness: 0.35,
    roughness: 0.22,
    accentHex: '#ff5500',
  },
  {
    id: 'graphite',
    name: 'Графитовый титан',
    code: 'RAL 7016 · PRO',
    hex: '#484f59',
    metalness: 0.82,
    roughness: 0.28,
    accentHex: '#ff5500',
  },
  {
    id: 'sapphire',
    name: 'Чёрный сапфир',
    code: 'RAL 9005 · DLC',
    hex: '#17191e',
    metalness: 0.84,
    roughness: 0.22,
    accentHex: '#ff5500',
  },
  {
    id: 'olive',
    name: 'Индастриал олива',
    code: 'MIL-STD · HARD',
    hex: '#254233',
    metalness: 0.65,
    roughness: 0.32,
    accentHex: '#ff5500',
  },
  {
    id: 'crimson',
    name: 'Сигнальный бордо',
    code: 'RAL 3005 · TURBO',
    hex: '#691b22',
    metalness: 0.78,
    roughness: 0.2,
    accentHex: '#ff5500',
  },
  {
    id: 'chrome',
    name: 'Шлифованный алюминий',
    code: 'RAW ALU · 7075',
    hex: '#9da5b0',
    metalness: 0.9,
    roughness: 0.18,
    accentHex: '#ff5500',
  },
];

export const STUDIO_HOTSPOTS: StudioHotspot[] = [
  {
    id: 'spindle',
    index: '01',
    badge: 'ШПИНДЕЛЬНЫЙ УЗЕЛ',
    title: 'Шпиндель HSK-A63 · 24 000 об/мин',
    description:
      'Прямой привод с керамическими гибридными подшипниками и активным жидкостным охлаждением до ±0.3 °C.',
    bullets: [
      'Мощность 32 кВт на титане и нержавеющей стали',
      'Подача СОЖ через центр шпинделя до 70 бар',
      'Динамическая балансировка G0.4 без вибраций',
    ],
    priceLabel: 'от 450 000 сум',
    serviceValue: '5-осевая фрезеровка ЧПУ',
    position: [0.15, 2.38, 0.12],
    cameraOffset: [2.5, 2.8, 3.2],
    lookAt: [0.15, 2.1, 0.12],
  },
  {
    id: 'trunnion',
    index: '02',
    badge: 'ГЛОБУСНЫЙ СТОЛ',
    title: '5-осевой поворотный стол ±120°',
    description:
      'Одновременная 5-координатная интерполяция сложных крыльчаток, корпусов редукторов и пресс-форм за один установ.',
    bullets: [
      'Оптические энкодеры Heidenhain 0.0001°',
      'Грузоподъёмность заготовки до 650 кг',
      'Повторяемость позиционирования ±1.5 мкм',
    ],
    priceLabel: 'от 600 000 сум',
    serviceValue: '5-осевая фрезеровка ЧПУ',
    position: [0.15, 1.32, 0.24],
    cameraOffset: [2.7, 2.05, 3.3],
    lookAt: [0.15, 1.35, 0.18],
  },
  {
    id: 'robot',
    index: '03',
    badge: 'РОБОТИЗАЦИЯ 24/7',
    title: '6-осевой робот-манипулятор загрузки',
    description:
      'Промышленный манипулятор с двойным пневмосхватом обслуживает ячейку круглосуточно без ночных простоев.',
    bullets: [
      'Цикл смены паллеты всего 6.4 секунды',
      'Грузоподъёмность руки до 85 кг',
      'Интеграция с буферной кассетой на 48 заготовок',
    ],
    priceLabel: 'Серия от 50 шт',
    serviceValue: 'Токарно-фрезерная серия',
    position: [-2.38, 1.85, 0.72],
    cameraOffset: [-4.6, 2.65, 4.1],
    lookAt: [-2.1, 1.45, 0.72],
  },
  {
    id: 'atc',
    index: '04',
    badge: 'МАГАЗИН ATC',
    title: 'Автосменщик инструмента на 24 оправки',
    description:
      'Сервоприводный двойной кулачок с автоматическим лазерным обмерником вылета и контроля поломки фрезы.',
    bullets: [
      'Смена инструмента «стружка-стружка» 1.9 сек',
      'Лазерная проверка целостности режущей кромки',
      'Быстрый переход от черновой к чистовой за один цикл',
    ],
    priceLabel: 'от 280 000 сум',
    serviceValue: 'Токарно-фрезерная серия',
    position: [1.38, 2.52, -0.35],
    cameraOffset: [3.2, 2.85, 2.7],
    lookAt: [1.0, 2.35, -0.25],
  },
  {
    id: 'laser',
    index: '05',
    badge: 'ОТК И МЕТРОЛОГИЯ',
    title: 'Оптико-лазерный 3D-сканер КИМ',
    description:
      'Бесконтактный контроль геометрии детали на столе станка и в термоконстантной лаборатории качества.',
    bullets: [
      'Карта отклонений CAD-to-Scan с допуском ±1.5 мкм',
      'Спектральный анализ сплава перед запуском',
      'Паспорт качества и протокол ОТК на каждую партию',
    ],
    priceLabel: 'от 350 000 сум',
    serviceValue: 'ОТК и реверс-инжиниринг',
    position: [0.42, 1.62, 0.72],
    cameraOffset: [2.2, 2.15, 3.6],
    lookAt: [0.22, 1.5, 0.25],
  },
  {
    id: 'controller',
    index: '06',
    badge: 'СТОЙКА ЧПУ 4.0',
    title: 'Цифровая панель Siemens & телеметрия',
    description:
      'Прямой импорт STEP / IGES / Parasolid моделей, симуляция траекторий и мониторинг нагрузки осей в реальном времени.',
    bullets: [
      'Адаптивный контроль подачи при скачке нагрузки',
      'Сквозная трассировка серийных номеров деталей',
      'Подключение цеха к ERP-трекингу сроков отгрузки',
    ],
    priceLabel: 'Инжиниринг включён',
    serviceValue: 'Проектирование и CAD/CAM',
    position: [1.92, 1.68, 0.95],
    cameraOffset: [3.65, 2.1, 3.45],
    lookAt: [1.45, 1.6, 0.75],
  },
];

export const SERVICE_CARDS: ServiceCardItem[] = [
  {
    index: '01',
    title: '5-осевая фрезеровка ЧПУ',
    description:
      'Сложные корпусные детали, крыльчатки, кронштейны из алюминия 7075, титана и нержавейки с одного установа.',
    price: 'от 450 000 сум',
    serviceValue: '5-осевая фрезеровка ЧПУ',
  },
  {
    index: '02',
    title: 'Токарно-фрезерная серия',
    description:
      'Валы, штуцеры, фланцы и оси с приводным инструментом и автоматической подачей прутка до Ø65 мм.',
    price: 'от 120 000 сум',
    serviceValue: 'Токарно-фрезерная серия',
  },
  {
    index: '03',
    title: 'Лазерная резка и гибка',
    description:
      'Волоконный лазер 6 кВт для чёрной стали, алюминия и латуни плюс листогиб с ЧПУ до 3000 мм.',
    price: 'от 18 000 сум/м',
    serviceValue: 'Лазерная резка и гибка',
  },
  {
    index: '04',
    title: 'Анодирование и гальваника',
    description:
      'Твёрдое промышленное анодирование, порошковая полимеризация RAL, пассивация и антикоррозийная защита.',
    price: 'от 220 000 сум',
    serviceValue: 'Анодирование и гальваника',
  },
  {
    index: '05',
    title: 'Термообработка и шлифовка',
    description:
      'Вакуумная закалка до 62 HRC, цементация, круглая и плоская шлифовка до шероховатости Ra 0.4.',
    price: 'от 380 000 сум',
    serviceValue: 'Термообработка и шлифовка',
  },
  {
    index: '06',
    title: 'ОТК и реверс-инжиниринг',
    description:
      '3D-сканирование изношенных узлов, выпуск 3D-моделей CAD, полный протокол КИМ по ISO.',
    price: 'от 350 000 сум',
    serviceValue: 'ОТК и реверс-инжиниринг',
  },
];

export const PROCESS_STEPS: ProcessStep[] = [
  {
    index: '01',
    title: 'Чертёж и CAD/CAM расчёт',
    description:
      'Загружаете STEP, DXF, PDF или образец — за 2 часа рассчитываем техпроцесс, материал и точную смету.',
  },
  {
    index: '02',
    title: 'Пилотный образец',
    description:
      'Фрезеруем первую деталь, снимаем карту отклонений на КИМ ±1.5 мкм и утверждаем её с вашим инженером.',
  },
  {
    index: '03',
    title: 'Роботизированная серия 24/7',
    description:
      'Запускаем серийную партию на 5-осевых ячейках с роботом-загрузчиком и контролем инструмента в каждом цикле.',
  },
  {
    index: '04',
    title: 'ОТК, покрытие и отгрузка',
    description:
      'Наносим анодирование или порошковую покраску, маркируем детали лазером и отгружаем с паспортом качества.',
  },
];

export const BOOKING_SERVICES: string[] = [
  '5-осевая фрезеровка ЧПУ',
  'Токарно-фрезерная серия',
  'Лазерная резка и гибка',
  'Анодирование и гальваника',
  'Термообработка и шлифовка',
  'ОТК и реверс-инжиниринг',
  'Проектирование и CAD/CAM',
];

export const SECTION_KEYFRAMES: SectionKeyframe[] = [
  {
    // 01 Hero — machinery slightly right of center, white+orange H1 on left
    id: 'hero',
    label: 'Главная',
    cameraPos: [5.9, 2.4, 6.8],
    target: [-1.05, 1.45, 0.15],
    fov: 35,
    liftProgress: 0,
    explodeProgress: 0,
    laserScan: false,
    spindleRpm: 1,
  },
  {
    // 02 OTK / Metrology — front 3/4 closeup with glowing cyan scan sweep
    id: 'diag',
    label: 'Метрология',
    cameraPos: [3.9, 2.25, 4.9],
    target: [0.05, 1.5, 0.15],
    fov: 31,
    liftProgress: 0.45,
    explodeProgress: 0,
    laserScan: true,
    spindleRpm: 0.4,
  },
  {
    // 03 Kinematics — hood lifted, left camera revealing right overlay text
    id: 'kinematics',
    label: 'Кинематика',
    cameraPos: [-4.6, 2.85, 4.8],
    target: [0.6, 1.55, 0.1],
    fov: 35,
    liftProgress: 1.0,
    explodeProgress: 0.12,
    laserScan: false,
    spindleRpm: 1.6,
  },
  {
    // 04 Robotics — close-up on robot arm & HSK spindle from right-side
    id: 'robotics',
    label: 'Роботизация',
    cameraPos: [4.2, 2.15, 4.5],
    target: [-1.15, 1.55, 0.3],
    fov: 30,
    liftProgress: 0.9,
    explodeProgress: 0,
    laserScan: false,
    spindleRpm: 2.8,
  },
  {
    // 05 Coating — angled left view showing glossy painted enclosure & arm
    id: 'paint',
    label: 'Покрытие',
    cameraPos: [-5.1, 2.2, 5.4],
    target: [0.55, 1.45, 0.1],
    fov: 33,
    liftProgress: 0.15,
    explodeProgress: 0,
    laserScan: false,
    spindleRpm: 0.8,
  },
  {
    // 06 Services & Pricing — high-centered hero overhead angle above cards
    id: 'services',
    label: 'Цены',
    cameraPos: [0.4, 3.05, 7.2],
    target: [-0.25, 1.25, 0],
    fov: 36,
    liftProgress: 0.35,
    explodeProgress: 0,
    laserScan: false,
    spindleRpm: 1.1,
  },
  {
    // 07 Interactive 3D Studio — full free orbit zone
    id: 'studio',
    label: '3D-цех',
    cameraPos: [5.6, 2.7, 6.6],
    target: [-0.35, 1.55, 0.1],
    fov: 35,
    liftProgress: 0.65,
    explodeProgress: 0,
    laserScan: false,
    spindleRpm: 1.4,
  },
  {
    // 08 Process — left side perspective while 4 timeline cards appear right
    id: 'process',
    label: 'Процесс',
    cameraPos: [-4.9, 2.35, 4.6],
    target: [0.85, 1.45, 0.15],
    fov: 34,
    liftProgress: 0.55,
    explodeProgress: 0,
    laserScan: true,
    spindleRpm: 1.2,
  },
  {
    // 09 Booking & Footer — rear 3/4 view matching reference footer
    id: 'booking',
    label: 'Заявка',
    cameraPos: [-3.9, 2.45, -6.1],
    target: [0.65, 1.35, 0.1],
    fov: 33,
    liftProgress: 0.25,
    explodeProgress: 0,
    laserScan: false,
    spindleRpm: 0.7,
  },
];
