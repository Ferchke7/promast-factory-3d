import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Eye,
  Layers,
  Lightbulb,
  RotateCw,
  Wrench,
  X,
} from 'lucide-react';
import {
  FactoryCanvas,
  StudioControlsState,
  TelemetryData,
} from './components/FactoryCanvas';
import {
  BOOKING_SERVICES,
  FINISH_PRESETS,
  PROCESS_STEPS,
  SECTION_KEYFRAMES,
  SERVICE_CARDS,
  STUDIO_HOTSPOTS,
} from './data/factoryData';

export const App: React.FC = () => {
  const [sceneReady, setSceneReady] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>('spindle');
  const [zoomSignal, setZoomSignal] = useState<{ delta: number; seq: number } | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    camDeg: 218,
    fov: 34,
    liftMeters: 0,
    fps: 60,
  });

  const [studioControls, setStudioControls] = useState<StudioControlsState>({
    liftOpen: true,
    exploded: false,
    xray: false,
    lightsOn: true,
    autoRotate: false,
    finish: FINISH_PRESETS[0],
  });

  // Booking form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [materialBatch, setMaterialBatch] = useState('');
  const [selectedService, setSelectedService] = useState(BOOKING_SERVICES[0]);
  const [targetDate, setTargetDate] = useState('');
  const [submittedRefCode, setSubmittedRefCode] = useState<string | null>(null);

  const handleReady = useCallback(() => {
    setSceneReady(true);
  }, []);

  const handleTelemetry = useCallback((next: TelemetryData) => {
    setTelemetry(next);
  }, []);

  // Track continuous normalized section progress 0 .. SECTION_KEYFRAMES.length - 1
  useEffect(() => {
    const computeProgress = () => {
      const elements = SECTION_KEYFRAMES.map((k) => document.getElementById(k.id)).filter(
        (el): el is HTMLElement => el !== null
      );
      if (elements.length === 0) return;

      const viewMid = window.scrollY + window.innerHeight * 0.45;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (viewMid <= bottom || i === elements.length - 1) {
          const span = Math.max(1, el.offsetHeight);
          const localAlpha = Math.max(0, Math.min(1, (viewMid - top) / span));
          const progress = Math.min(elements.length - 1, i + localAlpha * 0.85);
          setScrollProgress(progress);
          return;
        }
      }
    };

    computeProgress();
    window.addEventListener('scroll', computeProgress, { passive: true });
    window.addEventListener('resize', computeProgress);
    return () => {
      window.removeEventListener('scroll', computeProgress);
      window.removeEventListener('resize', computeProgress);
    };
  }, []);

  const activeSectionIdx = useMemo(() => {
    return Math.min(
      SECTION_KEYFRAMES.length - 1,
      Math.max(0, Math.round(scrollProgress))
    );
  }, [scrollProgress]);

  const isStudioActive = SECTION_KEYFRAMES[activeSectionIdx]?.id === 'studio';

  // Scan progress percentage for section 02 (#diag)
  const scanPercent = useMemo(() => {
    const dist = Math.max(0, Math.min(1, scrollProgress - 0.55));
    return Math.round(dist * 100);
  }, [scrollProgress]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const jumpToOrderWithService = (serviceName: string) => {
    setSelectedService(serviceName);
    scrollToSection('booking');
  };

  const activeHotspot = useMemo(
    () => STUDIO_HOTSPOTS.find((h) => h.id === activeHotspotId) ?? null,
    [activeHotspotId]
  );

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    const code = `PM-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRefCode(code);
  };

  return (
    <>
      {/* Initial Black WebGL Preloader */}
      <div className={`preloader ${sceneReady ? 'is-hidden' : ''}`}>
        <div className="preloader-brand">PROMAST</div>
        <div className="preloader-bar">
          <div className="preloader-bar-fill" />
        </div>
        <div className="preloader-sub">ЗАПУСКАЕМ СТАНКИ · WEBGL · PBR · ЧПУ 4.0</div>
      </div>

      {/* Persistent Fixed Interactive Three.js Viewport */}
      <FactoryCanvas
        scrollProgress={scrollProgress}
        studioActive={isStudioActive}
        studioControls={studioControls}
        activeHotspotId={activeHotspotId}
        zoomSignal={zoomSignal}
        resetSignal={resetSignal}
        onSelectHotspot={(id) => setActiveHotspotId(id)}
        onTelemetry={handleTelemetry}
        onReady={handleReady}
      />

      {/* Fixed Top Navigation */}
      <header className="top-header">
        <a
          href="#hero"
          className="brand-mark"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('hero');
          }}
        >
          <span className="brand-dot" />
          PROMAST
        </a>

        <nav className="top-nav" aria-label="Навигация по разделам">
          <a
            href="#diag"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('diag');
            }}
          >
            ОТК и сканер
          </a>
          <a
            href="#robotics"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('robotics');
            }}
          >
            Роботизация
          </a>
          <a
            href="#paint"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('paint');
            }}
          >
            Покрытие
          </a>
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('services');
            }}
          >
            Цены
          </a>
          <a
            href="#studio"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('studio');
            }}
          >
            3D-цех
          </a>
        </nav>

        <div className="header-right">
          <a href="tel:+998900007777" className="header-phone">
            +998 90 000 77 77
          </a>
          <button
            type="button"
            className="btn-orange is-compact"
            onClick={() => scrollToSection('booking')}
          >
            Рассчитать КП
          </button>
        </div>
      </header>

      {/* Bottom-Left Live WebGL Telemetry HUD */}
      <div className="hud-telemetry" aria-hidden="true">
        <span>
          CAM <strong>{telemetry.camDeg}°</strong>
        </span>
        <span>
          FOV <strong>{telemetry.fov}</strong>
        </span>
        <span>
          LIFT <strong>{telemetry.liftMeters.toFixed(2)}м</strong>
        </span>
        <span>
          FPS <strong>{telemetry.fps}</strong>
        </span>
      </div>

      {/* Right Edge Vertical Scroll Rail */}
      <aside className="scroll-rail" aria-label="Разделы сайта">
        {SECTION_KEYFRAMES.map((kf, idx) => (
          <button
            key={kf.id}
            type="button"
            className={`rail-item ${activeSectionIdx === idx ? 'is-active' : ''}`}
            onClick={() => scrollToSection(kf.id)}
            title={kf.label}
          >
            <span>0{idx + 1}</span>
            <span className="rail-tick" />
          </button>
        ))}
      </aside>

      {/* 9-Section Dark Studio Scrollytelling Narrative */}
      <main className="story-sections">
        {/* 01 HERO */}
        <section id="hero" className="story-section align-left">
          <h1 className="hero-h1">
            Создаём детали
            <br />
            с точностью
            <br />
            <span className="accent-word">микрона.</span>
          </h1>
          <p className="lead-copy">
            Контрактное производство на 5-осевых ЧПУ-центрах, роботизированная металлообработка
            и серийный выпуск под ключ в Ташкенте. Каждая деталь, каждый допуск. Под контролем.
          </p>
          <div className="hero-ctas interactive-panel">
            <button
              type="button"
              className="btn-orange"
              onClick={() => scrollToSection('booking')}
            >
              Заказать расчёт КП <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-glass"
              onClick={() => scrollToSection('studio')}
            >
              Открыть 3D-цех
            </button>
          </div>

          <div className="hero-footer-bar">
            <div />
            <div className="scroll-cue">
              <span>ЛИСТАЙТЕ</span>
              <span className="scroll-cue-line" />
            </div>
            <div className="kpi-row">
              <div>
                <div className="kpi-val">12</div>
                <div className="kpi-lbl">лет в серии</div>
              </div>
              <div>
                <div className="kpi-val">180 000+</div>
                <div className="kpi-lbl">деталей выпущено</div>
              </div>
              <div>
                <div className="kpi-val">ISO 9001</div>
                <div className="kpi-lbl">контроль отк</div>
              </div>
            </div>
          </div>
        </section>

        {/* 02 DIAGNOSTICS & LASER METROLOGY */}
        <section id="diag" className="story-section is-tall align-left">
          <div className="glass-panel">
            <div className="section-tag">
              <span className="section-num-pill">02</span> ОТК И МЕТРОЛОГИЯ
            </div>
            <h2 className="section-h2">
              Видим металл <span className="accent-word">насквозь</span>
            </h2>
            <p className="lead-copy">
              Лазерный 3D-сканер КИМ и встроенные обмерники шпинделя сравнивают готовую деталь с
              эталонной CAD-моделью прямо на поворотном столе. Ни одного скрытого брака в партии.
            </p>
            <div className="metrics-strip">
              <div className="metric-box">
                <div className="metric-box-val">±1.5 мкм</div>
                <div className="metric-box-lbl">точность КИМ-сканера</div>
              </div>
              <div className="metric-box">
                <div className="metric-box-val">3 200+</div>
                <div className="metric-box-lbl">контрольных точек</div>
              </div>
              <div className="metric-box">
                <div className="metric-box-val">100%</div>
                <div className="metric-box-lbl">паспорт на партию</div>
              </div>
            </div>
            <div className="scan-widget">
              <div className="scan-row">
                <span>ЛАЗЕРНОЕ СКАНИРОВАНИЕ</span>
                <span>{scanPercent}%</span>
              </div>
              <div className="scan-track">
                <div className="scan-fill" style={{ width: `${scanPercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        {/* 03 KINEMATICS & RIGIDITY */}
        <section id="kinematics" className="story-section is-tall align-right">
          <div className="glass-panel">
            <div className="section-tag">
              <span className="section-num-pill">03</span> КИНЕМАТИКА И СТАНИНА
            </div>
            <h2 className="section-h2">
              Двенадцать тонн <span className="accent-word">жёсткости</span>
            </h2>
            <p className="lead-copy">
              Открываем термозащитный кожух станка: литая чугунная станина гасит резонанс при
              силовой обработке титана и жаропрочных сталей.
            </p>
            <ul className="check-list">
              <li>
                <Check size={17} className="check-icon" />
                <span>5-осевой глобусный стол с энкодерами 0.0001° без люфта</span>
              </li>
              <li>
                <Check size={17} className="check-icon" />
                <span>Роликовые направляющие и ШВП класса точности C3 с преднатягом</span>
              </li>
              <li>
                <Check size={17} className="check-icon" />
                <span>Активная термостабилизация узлов и шпинделя до ±0.3 °C</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 04 ROBOTICS & SPINDLE */}
        <section id="robotics" className="story-section is-tall align-left">
          <div className="glass-panel">
            <div className="section-tag">
              <span className="section-num-pill">04</span> РОБОТИЗАЦИЯ И ШПИНДЕЛЬ
            </div>
            <h2 className="section-h2">
              Работаем <span className="accent-word">до микрона</span>
            </h2>
            <p className="lead-copy">
              6-осевой робот-манипулятор загружает заготовки круглосуточно, пока шпиндель HSK-A63
              выдерживает стабильный съём металла без перерыва на смены.
            </p>
            <div className="metrics-strip">
              <div className="metric-box">
                <div className="metric-box-val">24 000</div>
                <div className="metric-box-lbl">об/мин шпиндель HSK</div>
              </div>
              <div className="metric-box">
                <div className="metric-box-val">6.4 сек</div>
                <div className="metric-box-lbl">перезагрузка роботом</div>
              </div>
              <div className="metric-box">
                <div className="metric-box-val">24/7</div>
                <div className="metric-box-lbl">серия без простоя</div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 COATING & FINISHING */}
        <section id="paint" className="story-section is-tall align-right">
          <div className="glass-panel">
            <div className="section-tag">
              <span className="section-num-pill">05</span> ПОКРЫТИЕ И ЗАЩИТА
            </div>
            <h2 className="section-h2">
              Финиш, который <span className="accent-word">держит ресурс</span>
            </h2>
            <p className="lead-copy">
              Собственная линия промышленного анодирования, гальваники и порошковой окраски по
              каталогу RAL. Выберите покрытие прямо сейчас и посмотрите в 3D:
            </p>
            <div className="swatch-row" style={{ marginTop: 22 }}>
              {FINISH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`swatch-btn ${
                    studioControls.finish.id === preset.id ? 'is-active' : ''
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  onClick={() => setStudioControls((prev) => ({ ...prev, finish: preset }))}
                  aria-label={preset.name}
                  title={`${preset.name} (${preset.code})`}
                />
              ))}
            </div>
            <div className="swatch-caption">
              {studioControls.finish.name} · <span style={{ color: 'var(--muted)' }}>{studioControls.finish.code}</span>
            </div>
          </div>
        </section>

        {/* 06 SERVICES & PRICING */}
        <section id="services" className="story-section services-section align-center">
          <div>
            <div className="section-tag" style={{ justifyContent: 'center' }}>
              <span className="section-num-pill">06</span> УСЛУГИ И СТОИМОСТЬ
            </div>
            <h2 className="section-h2" style={{ margin: '0 auto' }}>
              Прозрачно. <span className="accent-word">По чертежу.</span>
            </h2>
          </div>

          <div className="services-grid">
            {SERVICE_CARDS.map((card) => (
              <button
                key={card.index}
                type="button"
                className="service-card"
                onClick={() => jumpToOrderWithService(card.serviceValue)}
              >
                <div>
                  <div className="service-num">{card.index}</div>
                  <div className="service-title">{card.title}</div>
                  <div className="service-desc">{card.description}</div>
                </div>
                <div className="service-price">{card.price}</div>
              </button>
            ))}
          </div>
        </section>

        {/* 07 INTERACTIVE 3D WORKSHOP STUDIO */}
        <section id="studio" className="story-section studio-section">
          <div className="studio-top">
            <div>
              <div className="section-tag">
                <span className="section-num-pill">07</span> 3D-ЦЕХ
              </div>
              <h2 className="section-h2">
                Осмотрите <span className="accent-word">сами</span>
              </h2>
              <div className="studio-hints">
                <span className="key-badge">ЛКМ</span> вращать ·{' '}
                <span className="key-badge">ПКМ</span> сдвиг ·{' '}
                <span className="key-badge">+ / −</span> масштаб · нажмите на точку
              </div>
            </div>

            {activeHotspot && (
              <div className="hotspot-card" role="dialog" aria-label={activeHotspot.title}>
                <div className="hotspot-card-head">
                  <div className="section-tag" style={{ marginBottom: 0 }}>
                    <span className="section-num-pill">{activeHotspot.index}</span>
                    {activeHotspot.badge}
                  </div>
                  <button
                    type="button"
                    className="hotspot-close"
                    onClick={() => setActiveHotspotId(null)}
                    aria-label="Закрыть карточку узла"
                  >
                    <X size={14} />
                  </button>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.25 }}>
                  {activeHotspot.title}
                </h3>
                <p
                  style={{
                    marginTop: 10,
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                    color: 'var(--muted)',
                  }}
                >
                  {activeHotspot.description}
                </p>
                <ul className="check-list" style={{ marginTop: 16 }}>
                  {activeHotspot.bullets.map((b) => (
                    <li key={b} style={{ fontSize: '0.82rem' }}>
                      <Check size={15} className="check-icon" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="hotspot-card-foot">
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                    }}
                  >
                    {activeHotspot.priceLabel}
                  </div>
                  <button
                    type="button"
                    className="btn-orange is-compact"
                    onClick={() => jumpToOrderWithService(activeHotspot.serviceValue)}
                  >
                    Заказать
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="studio-dock" aria-label="Управление 3D-цехом">
            <button
              type="button"
              className={`dock-btn ${studioControls.liftOpen ? 'is-active' : ''}`}
              onClick={() =>
                setStudioControls((p) => ({ ...p, liftOpen: !p.liftOpen }))
              }
            >
              <Layers size={14} /> Кожух / Двери
            </button>
            <button
              type="button"
              className={`dock-btn ${studioControls.exploded ? 'is-active' : ''}`}
              onClick={() =>
                setStudioControls((p) => ({ ...p, exploded: !p.exploded }))
              }
            >
              <Wrench size={14} /> Разборка
            </button>
            <button
              type="button"
              className={`dock-btn ${studioControls.xray ? 'is-active' : ''}`}
              onClick={() => setStudioControls((p) => ({ ...p, xray: !p.xray }))}
            >
              <Eye size={14} /> Рентген
            </button>
            <button
              type="button"
              className={`dock-btn ${studioControls.lightsOn ? 'is-active' : ''}`}
              onClick={() =>
                setStudioControls((p) => ({ ...p, lightsOn: !p.lightsOn }))
              }
            >
              <Lightbulb size={14} /> Свет и лазер
            </button>
            <button
              type="button"
              className={`dock-btn ${studioControls.autoRotate ? 'is-active' : ''}`}
              onClick={() =>
                setStudioControls((p) => ({ ...p, autoRotate: !p.autoRotate }))
              }
            >
              <RotateCw size={14} /> Обзор 360°
            </button>

            <span className="dock-divider" />

            <div className="swatch-row" style={{ gap: 7 }}>
              {FINISH_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`swatch-btn ${
                    studioControls.finish.id === preset.id ? 'is-active' : ''
                  }`}
                  style={{ width: 24, height: 24, backgroundColor: preset.hex }}
                  onClick={() => setStudioControls((p) => ({ ...p, finish: preset }))}
                  aria-label={preset.name}
                  title={preset.name}
                />
              ))}
            </div>

            <span className="dock-divider" />

            <button
              type="button"
              className="dock-icon-btn"
              onClick={() => setZoomSignal((prev) => ({ delta: -0.9, seq: (prev?.seq ?? 0) + 1 }))}
              aria-label="Приблизить камеру"
            >
              +
            </button>
            <button
              type="button"
              className="dock-icon-btn"
              onClick={() => setZoomSignal((prev) => ({ delta: 0.9, seq: (prev?.seq ?? 0) + 1 }))}
              aria-label="Отдалить камеру"
            >
              −
            </button>
            <button
              type="button"
              className="dock-btn"
              onClick={() => {
                setStudioControls({
                  liftOpen: true,
                  exploded: false,
                  xray: false,
                  lightsOn: true,
                  autoRotate: false,
                  finish: FINISH_PRESETS[0],
                });
                setActiveHotspotId('spindle');
                setResetSignal((n) => n + 1);
              }}
            >
              Сбросить вид
            </button>
          </div>
        </section>

        {/* 08 PROCESS WORKFLOW */}
        <section id="process" className="story-section is-tall align-right">
          <div className="glass-panel">
            <div className="section-tag">
              <span className="section-num-pill">08</span> КАК МЫ РАБОТАЕМ
            </div>
            <h2 className="section-h2">
              Четыре этапа <span className="accent-word">без срывов</span>
            </h2>
            <p className="lead-copy">
              От вашего чертежа до приёмки готовой партии на складе — прозрачные сроки и
              фиксированная цена до запуска шпинделя.
            </p>
            <div className="process-list">
              {PROCESS_STEPS.map((step) => (
                <div key={step.index} className="process-step">
                  <div className="process-num">{step.index}</div>
                  <div>
                    <div className="process-title">{step.title}</div>
                    <div className="process-desc">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 09 BOOKING / RFQ & FOOTER */}
        <section id="booking" className="story-section" style={{ justifyContent: 'space-between' }}>
          <div className="booking-grid" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <div className="interactive-panel">
              <div className="section-tag">
                <span className="section-num-pill">09</span> ЗАЯВКА НА РАСЧЁТ
              </div>
              <h2 className="section-h2">
                Готовы <span className="accent-word">к серии?</span>
              </h2>
              <p className="lead-copy">
                Оставьте заявку и техпараметры — ведущий технолог свяжется в течение 15 минут,
                проверит модель и назовёт точную стоимость партии.
              </p>
              <div className="contact-rows">
                <div className="contact-row">
                  <span className="contact-lbl">АДРЕС</span>
                  <span>Ташкент, ул. Саноат, 14 (Яшнабадский технопарк)</span>
                </div>
                <div className="contact-row">
                  <span className="contact-lbl">ЦЕХ</span>
                  <span>Пн–Сб 08:00 – 20:00 · Роботы 24/7</span>
                </div>
                <div className="contact-row">
                  <span className="contact-lbl">ТЕЛЕФОН</span>
                  <a href="tel:+998900007777">+998 90 000 77 77</a>
                </div>
              </div>
            </div>

            <form className="booking-form" onSubmit={handleSubmitOrder}>
              <div className="form-row-2">
                <label className="field-wrap">
                  <span className="field-label">Имя / компания</span>
                  <input
                    type="text"
                    required
                    className="field-input"
                    placeholder="Александр · ООО Техно"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </label>
                <label className="field-wrap">
                  <span className="field-label">Телефон</span>
                  <input
                    type="tel"
                    required
                    className="field-input"
                    placeholder="+998 90 123 45 67"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </label>
              </div>

              <label className="field-wrap">
                <span className="field-label">Материал и тираж</span>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Напр.: Д16Т / 7075, партия 250 шт"
                  value={materialBatch}
                  onChange={(e) => setMaterialBatch(e.target.value)}
                />
              </label>

              <label className="field-wrap">
                <span className="field-label">Вид производства</span>
                <select
                  className="field-input"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  {BOOKING_SERVICES.map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-wrap">
                <span className="field-label">Желаемый срок отгрузки</span>
                <input
                  type="date"
                  className="field-input"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </label>

              {submittedRefCode ? (
                <div className="submit-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <CheckCircle2 size={18} /> Заявка {submittedRefCode} принята в техбюро
                  </div>
                  <div style={{ marginTop: 4, opacity: 0.9 }}>
                    Инженер рассчитает «{selectedService}» и перезвонит на {contactPhone}.
                  </div>
                </div>
              ) : (
                <button type="submit" className="btn-orange" style={{ width: '100%', marginTop: 4 }}>
                  Отправить заявку <ArrowRight size={16} />
                </button>
              )}

              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'center' }}>
                Нажимая кнопку, вы соглашаетесь на обработку контактных данных и NDA по чертежам.
              </div>
            </form>
          </div>

          <footer className="site-footer">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="brand-mark" style={{ fontSize: '1rem' }}>
                PROMAST
              </span>
              <span>© 2026 PROMAST · ЗАВОД ЧПУ И МЕТАЛЛООБРАБОТКИ · ТАШКЕНТ · ДЕМО-ПРОЕКТ</span>
            </div>
            <div>WEBGL 3D-СЦЕНА · ПРОЦЕДУРНЫЙ ЧПУ-ЦЕНТР И РОБОТ-МАНИПУЛЯТОР</div>
            <button
              type="button"
              className="dock-btn"
              onClick={() => scrollToSection('hero')}
              style={{ borderColor: 'rgba(255,255,255,0.14)' }}
            >
              НАВЕРХ <ArrowUp size={13} />
            </button>
          </footer>
        </section>
      </main>
    </>
  );
};
