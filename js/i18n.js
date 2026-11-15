/* ===========================
   ASTEL-COM LOCALIZATION ENGINE (UA <-> EN) — 100% COMPLETE
   =========================== */
const I18nManager = (function () {
  const LANG_KEY = "astelkom_lang";

  // Collapses inline spaces, normalizes apostrophes and Cyrillic "СОМ" -> Latin "COM"
  const norm = (s) =>
    String(s || "")
      .replace(/\s+/g, " ")
      .replace(/[’‘`]/g, "'")
      .replace(/СОМ/g, "COM")
      .trim();

  // 1. Complete Text Dictionary (All HTML pages + all 15 products from products-data.js)
  const RAW_TEXT_MAP = {
    // --- Page Titles ---
    "АСТЕЛ-КОМ": "ASTEL-COM",
    "Про нас - АСТЕЛ-КОМ": "About Us - ASTEL-COM",
    "Товари та послуги - АСТЕЛ-КОМ": "Products & Services - ASTEL-COM",
    "Товар - АСТЕЛ-КОМ": "Product - ASTEL-COM",
    "Завантаження - АСТЕЛ-КОМ": "Downloads - ASTEL-COM",
    "Документація - АСТЕЛ-КОМ": "Documentation - ASTEL-COM",
    "Кошик та оформлення замовлення - АСТЕЛ-КОМ": "Cart & Checkout - ASTEL-COM",
    "Статус замовлення - АСТЕЛ-КОМ": "Order Status - ASTEL-COM",
    "Вхід в особистий кабінет - АСТЕЛ-КОМ": "Sign In - ASTEL-COM",
    "Особистий кабінет - АСТЕЛ-КОМ": "My Account - ASTEL-COM",

    // --- Header & Footer ---
    ГОЛОВНА: "HOME",
    "ПРО НАС": "ABOUT US",
    ТОВАРИ: "PRODUCTS",
    ЗАВАНТАЖЕННЯ: "DOWNLOADS",
    ДОКУМЕНТАЦІЯ: "DOCUMENTATION",
    КОНТАКТИ: "CONTACTS",
    БІЛЬШЕ: "MORE",
    'Компанія ТОВ "АСТЕЛ-КОМ"': "ASTEL-COM LLC",
    "Сергій +380504443355": "Serhii +380504443355",
    "вул. Солом'янська, 5, Київ, Україна": "5 Solomianska St, Kyiv, Ukraine",
    "Карта проїзду": "Location Map",
    Кошик: "Cart",
    Кабінет: "Account",
    "Особистий кабінет": "My Account",
    "Повернутися нагору": "Back to top",

    // --- Home Page (index.html) ---
    "Надійне телекомунікаційне обладнання для бізнесу. Технології майбутнього створені в Україні.":
      "Reliable telecommunication equipment for business. Future technologies engineered in Ukraine.",
    "ПЕРЕГЛЯНУТИ КАТАЛОГ": "BROWSE CATALOG",
    "GSM/LTE-МОДЕМИ": "GSM/LTE MODEMS",
    "NBIoT-МОДЕМИ": "NBIoT MODEMS",
    "GSM/LTE-модеми": "GSM/LTE Modems",
    "NBIoT-модеми": "NBIoT Modems",
    АНТЕНИ: "ANTENNAS",
    Антени: "Antennas",
    "Аксесуари для банківських терміналів": "Accessories for Bank Terminals",
    "Кабелі низьковольтного живлення": "Low-Voltage Power Cables",
    Попередня: "Previous",
    Наступна: "Next",
    "COM-900/485.": "COM-900/485.",
    "Це ультракомпактний, економічний, дводіапазонний інтелектуальний промисловий GSM/GPRS/LTE модем (термінал).":
      "An ultra-compact, cost-effective, dual-band intelligent industrial GSM/GPRS/LTE modem (terminal).",
    "Надійна передача.": "Reliable transmission.",
    "Модем оснащений двома незалежними портами RS232, двома незалежними портами RS485 та двома слотами для SIM-карт, що робить його унікальним пристроєм для М2М додатків.":
      "Equipped with two independent RS232 ports, two independent RS485 ports, and dual SIM card slots, making it a unique device for M2M applications.",
    "Економічність.": "Cost-efficiency.",
    "Відмінна альтернатива існуючим імпортним моделям з послідовним портом завдяки низькій ціні, якісній технічній підтримці та розширеній гарантії.":
      "An excellent alternative to imported serial-port models thanks to its competitive price, responsive technical support, and extended warranty.",
    "Компактність.": "Compactness.",
    "Модем виконаний у міцному металевому корпусі з розмірами всього 63х15х60мм, що дозволяє застосовувати його у найжорсткіших умовах експлуатації.":
      "Housed in a rugged metal enclosure measuring just 63×15×60 mm, built to perform in the harshest industrial environments.",
    "Інтелектуальність.": "Smart architecture.",
    "Створений на базі радіомодуля А7672Е компанії SIMCOM. Містить внутрішній потужний процесор, для якого існує безліч стандартних та кастомізованих додатків («прошивок»).":
      "Built on the SIMCOM A7672E radio module with a powerful internal processor supporting a wide range of standard and custom firmware applications.",
    "Промисловість.": "Industrial readiness.",
    "Наявність двох СОМ-портів, двох портів RS485 та оригінального ПЗ дозволяє успішно підключати модем до різних типів приладів обліку електроенергії, тепла, води та газу.":
      "Dual COM ports, dual RS485 ports, and proprietary firmware enable seamless connection to electricity, heat, water, and gas meters.",
    "Безперебійність.": "Uninterrupted operation.",
    "Оригінальне програмне забезпечення підтримує роботу з двома SIM-картами. Зовнішній контролер (супервізор) постійно моніторить радіомодуль і миттєво перезавантажує його при «зависанні».":
      "Proprietary firmware supports dual SIM operation while an external hardware watchdog supervisor monitors the radio module and reboots it instantly if a freeze occurs.",
    "Українська якість.": "Ukrainian quality.",
    "При виробництві ми максимально використовуємо вітчизняні компоненти. Корпус, кріплення, друкована плата та оригінальне ПЗ — це результат досвіду українських інженерів.":
      "We maximize the use of domestic components in production. The enclosure, mounts, PCB, and proprietary firmware are crafted by Ukrainian engineers.",
    "СФЕРИ ЗАСТОСУВАННЯ": "APPLICATION AREAS",
    Енергетика: "Energy Sector",
    "Збір даних з лічильників електроенергії та підстанцій":
      "Data collection from electricity meters and substations",
    Водопостачання: "Water Supply",
    "Моніторинг витрати води та стану мереж":
      "Monitoring water consumption and pipeline network status",
    Теплопостачання: "District Heating",
    "Облік тепла та контроль теплових пунктів":
      "Heat metering and thermal substation monitoring",
    "Передача даних з обладнання та датчиків":
      "Telemetry and data transmission from industrial sensors and equipment",
    "На ринку з 2005 року": "On the market since 2005",
    "Ми — технічна компанія з Києва. Наші ключові напрямки діяльності:":
      "We are an engineering company based in Kyiv. Our core areas of expertise:",
    "Розробка і виробництво GPRS/LTE-модемів, аксесуарів, охоронних приладів та модулів.":
      "Design and manufacturing of GPRS/LTE modems, accessories, security devices, and telemetry modules.",
    "Гуртова торгівля аксесуарами та комплектуючими для банківських терміналів.":
      "Wholesale supply of accessories and components for banking POS terminals.",
    "Перевірено на собі": "Tested In-House",
    "Ми дійсно пропонуємо лише те, що випробували на своїх машинах, у своїх офісах та будинках.":
      "We only offer equipment that we have thoroughly tested in our own vehicles, offices, and facilities.",
    "Клієнт має рацію": "Customer First",
    "Для нас клієнт завжди має рацію. Ваша довіра та комфорт — наш головний пріоритет.":
      "For us, the customer always comes first. Your trust and convenience are our top priorities.",
    "Реальна користь": "Real Value",
    "Наша мета — не просто продати товар чи послугу, а знайти найкраще рішення для реальних потреб клієнта.":
      "Our goal is not just to sell a product, but to engineer the best solution for your real-world technical needs.",
    "Постійний розвиток": "Continuous Innovation",
    "Постійно розвиваємось, щоб пропонувати вам ще вищу якість.":
      "We continuously evolve and upgrade our hardware to deliver even higher reliability.",
    "НАМ ДОВІРЯЮТЬ": "TRUSTED BY",
    "Співпраця з лідерами в галузі - підтвердження нашої надійності та якості обладнання і сервісу.":
      "Long-term partnerships with industry leaders confirm the reliability and quality of our hardware and service.",

    // --- About Us Page (about_us.html) ---
    "АСТЕЛ-КОМ - українська компанія, що спеціалізується на постачанні телекомунікаційного обладнання для бізнесу. Ми допомагаємо нашим клієнтам залишатися на зв'язку, автоматизувати процеси та впевнено розвиватися.":
      "ASTEL-COM is a Ukrainian company specializing in supplying telecommunication equipment for business. We help our clients stay connected, automate processes, and grow with confidence.",
    "ІСТОРІЯ КОМПАНІЇ": "COMPANY HISTORY",
    "2005 рік": "2005",
    "Заснування компанії, початок продажу банківського і телеком обладнання.":
      "Company founded; started supplying banking POS and telecommunication hardware.",
    "2009 рік": "2009",
    "Розширення асортименту.": "Product lineup expansion.",
    "2018-2021 рік": "2018–2021",
    "Початок продажу модемів для обліку електроенергії сонячних систем.":
      "Launched specialized modems for solar power plant electricity metering.",
    "2023 рік": "2023",
    "Впровадження нової технології живлення від батареї в NBIoT модемах.":
      "Introduced ultra-low-power battery technology in NBIoT modems.",
    "2024 рік": "2024",
    "Вихід на ринок LTE 4g модемів.":
      "Entered the industrial LTE 4G modem market.",
    "2026 рік": "2026",
    "Розвиток нових технологій.":
      "Development of next-generation telemetry solutions.",
    "РОКІВ НА РИНКУ": "YEARS ON THE MARKET",
    "ЗАДОВОЛЕНИХ КЛІЄНТІВ": "SATISFIED CLIENTS",
    "ВСЯ УКРАЇНА": "ALL UKRAINE",
    "ГЕОГРАФІЯ ПОСТАВОК": "DELIVERY COVERAGE",
    "ЧОМУ ОБИРАЮТЬ НАС": "WHY CHOOSE US",
    НАДІЙНІСТЬ: "RELIABILITY",
    "Постачаємо перевірене обладнання, що відповідає сучасним стандартам.":
      "We supply field-proven equipment that meets modern industrial standards.",
    ПРОФЕСІОНАЛІЗМ: "PROFESSIONALISM",
    "Глибока експертиза та досвід нашої команди дозволяють знаходити оптимальні рішення для будь-яких задач.":
      "Our team's deep engineering expertise allows us to find optimal solutions for any telemetry task.",
    ПІДТРИМКА: "SUPPORT",
    "Супроводжуємо клієнтів на всіх етапах: від підбору обладнання до впровадження та сервісного обслуговування.":
      "We support clients at every stage: from hardware selection to deployment and after-sales service.",
    РОЗВИТОК: "INNOVATION",
    "Постійно слідкуємо за новими технологіями та пропонуємо актуальні рішення для вашого бізнесу.":
      "We constantly track emerging technologies to offer up-to-date solutions for your business.",

    // --- Catalog & Product UI (products.html & product.html) ---
    "Фільтри та Категорії": "Filters & Categories",
    КАТЕГОРІЇ: "CATEGORIES",
    "УСІ ТОВАРИ": "ALL PRODUCTS",
    ФІЛЬТРИ: "FILTERS",
    Ціна: "Price",
    "В наявності": "In stock",
    Так: "Yes",
    Ні: "No",
    "Товарів не знайдено": "No products found",
    "/ шт": "/ pc",
    "/ шт.": "/ pc",
    "В наявності | Тільки оптом": "In stock | Wholesale only",
    "В наявності | Оптом і в роздріб": "In stock | Wholesale & Retail",
    "Немає в наявності | Оптом і в роздріб":
      "Out of stock | Wholesale & Retail",
    "Немає в наявності | Тільки оптом": "Out of stock | Wholesale only",
    "Тільки оптом": "Wholesale only",
    "Оптом і в роздріб": "Wholesale & Retail",
    "Немає в наявності": "Out of stock",
    "Ціна без ПДВ": "Price excl. VAT",
    "Ціна вказана без ПДВ": "Price excl. VAT",
    Головна: "Home",
    Товари: "Products",
    "Товар не знайдено": "Product not found",
    "Перевірте посилання або поверніться до каталогу товарів.":
      "Please check the link or return to the product catalog.",
    "До каталогу": "To Catalog",
    "Показати оптові ціни": "Show wholesale prices",
    "Приховати оптові ціни": "Hide wholesale prices",
    "Для уточнення індивідуальних оптових цін залежно від обсягу партії зв'яжіться з відділом продажу:":
      "For custom wholesale pricing based on order volume, please contact our sales department:",
    або: "or",
    "Додати в кошик": "Add to Cart",
    Опис: "Description",
    "Технічні характеристики": "Technical Specifications",
    "Основні характеристики": "General Specifications",
    "Специфікації та документація": "Specifications & Documentation",
    "Мінімальне замовлення — 10 шт.": "Minimum order — 10 pcs.",

    // --- All 15 Product Titles ---
    "Універсальний GSM/GPRS-модем COM-900/485":
      "Universal GSM/GPRS Modem COM-900/485",
    "GSM/LTE-модем COM-900-ITR-4G для роботи з лічильниками ITRON (ACTARIS)":
      "GSM/LTE Modem COM-900-ITR-4G for ITRON (ACTARIS) Meters",
    "GSM/LTE-модем COM-900-PSG-4G (для лічильників GAMA)":
      "GSM/LTE Modem COM-900-PSG-4G (for GAMA Meters)",
    "GSM/GPRS-модем COM-900-ITR rev.B для роботи з лічильниками ITRON (ACTARIS)":
      "GSM/GPRS Modem COM-900-ITR rev.B for ITRON (ACTARIS) Meters",
    "NBIoT-модем COM-900-NBI-int для роботи з теплолічильниками":
      "Internal NBIoT Modem COM-900-NBI-int for Heat Meters",
    "Зовнішній NBIoT-модем COM-900-NBI-ext з COM-портом":
      "External NBIoT Modem COM-900-NBI-ext with COM Port",
    "USB-кабель 3 м для PoS-терміналу Ingenico iCT220":
      "USB Cable 3m for Ingenico iCT220 POS Terminal",
    "Акумуляторна батарея для PoS-терміналу Ingenico iWL220, iWL250":
      "Rechargeable Battery for Ingenico iWL220, iWL250 POS Terminal",
    "Акумуляторна батарея для PoS-терміналу Ingenico Move 2500":
      "Rechargeable Battery for Ingenico Move 2500 POS Terminal",
    "Кабель для пінпада до PoS-терміналу Ingenico iCT220":
      "Pinpad Cable for Ingenico iCT220 POS Terminal",
    "GSM-антена 3dBi на магнітній основі з кабелем 3 метри і роз'ємом SMA":
      "GSM Antenna 3dBi Magnetic Base with 3m Cable & SMA Connector",
    "GSM-антена 3.5dBi на магнітній основі з кабелем 3 метри та кутовим роз'ємом SMA":
      "GSM Antenna 3.5dBi Magnetic Base with 3m Cable & Angled SMA Connector",
    "Кабель низьковольтного живлення кутовий 2,1х5,5 мм":
      "Low-Voltage DC Power Cable Angled 2.1×5.5 mm",
    "Кабель низьковольтного живлення кутовий 1,4х3,4 мм":
      "Low-Voltage DC Power Cable Angled 1.4×3.4 mm",
    "Кабель низьковольтного живлення прямий 2,1х5,5мм з феритовим фільтром":
      "Low-Voltage DC Power Cable Straight 2.1×5.5 mm with Ferrite Filter",

    // --- All Product Descriptions from products-data.js ---
    // 1. com-900-485
    "Компанія ТОВ «Астел-ком» пропонує GPRS/LTE-модем власної розробки та виробництва COM-900-485-4G.":
      "ASTEL-COM LLC offers its proprietary in-house engineered and manufactured GPRS/LTE modem COM-900-485-4G.",
    "COM-900/485 ― це ультракомпактний, економічний, дводіапазонний інтелектуальний промисловий GSM/GPRS/LTE модем (термінал). Модем COM-900-485-4G оснащений двома незалежними портами RS232, двома незалежними портами RS485 та двома слотами для SIM-карт, що робить його унікальним пристроєм для М2М додатків, де потрібна надійна бездротова передача даних.":
      "COM-900/485 is an ultra-compact, cost-effective, dual-band intelligent industrial GSM/GPRS/LTE modem (terminal). Equipped with two independent RS232 ports, two independent RS485 ports, and dual SIM card slots, it is a unique solution for M2M applications requiring reliable wireless data transmission.",
    "Ультракомпактність — модем COM-900-485-4G виконаний у міцному металевому корпусі з розмірами всього 63×15×60 мм, що дозволяє застосовувати даний модем у жорстких умовах експлуатації.":
      "Ultra-compact design — the COM-900-485-4G modem is housed in a rugged metal enclosure measuring just 63×15×60 mm, enabling operation in harsh industrial environments.",
    "Економічність ― модем COM-900-485-4G є відмінною альтернативою існуючим імпортним моделям з послідовним портом, завдяки низькій ціні, технічній підтримці та розширеній гарантії.":
      "Cost-effectiveness — the COM-900-485-4G modem is an excellent alternative to imported serial-port models thanks to its competitive price, technical support, and extended warranty.",
    "Інтелектуальність — модем створений на базі радіомодуля А7672Е компанії SIMCOM, що містить внутрішній потужний процесор, для якого існує безліч стандартних та кастомізованих додатків («прошивок»). Величезний досвід у розробці програмного забезпечення (ПЗ) для GPRS-модемів дозволяє розробникам COM-900-485-4G створювати «прошивки» для роботи модему практично в будь-яких застосуваннях: АСКОЕ, промислова телеметрія, лічильники газу, тепла, води тощо, торговельні та платіжні термінали.":
      "Smart architecture — built around the SIMCOM A7672E radio module featuring a powerful internal processor that supports both standard and custom firmware applications. Our extensive firmware engineering experience allows COM-900-485-4G to operate across virtually any domain: AMR/AMI energy metering, industrial telemetry, gas/heat/water meters, and vending or payment terminals.",
    "Промисловість — наявність двох COM-портів, двох портів RS485 та оригінального ПЗ дозволяє успішно підключати модем COM-900-485-4G до різних типів приладів обліку електроенергії, тепла, води та газу.":
      "Industrial versatility — two COM ports, two RS485 ports, and proprietary firmware allow seamless connection of the COM-900-485-4G modem to various electricity, heat, water, and gas meters.",
    "Оригінальне базове програмне забезпечення модему COM-900/485 забезпечує підтримку безперервної роботи з двома SIM-картами. Зовнішній контролер (супервізор) на платі модему постійно моніторить працездатність радіомодуля і, у разі його «зависання», перезавантажує його. Можна сказати, що COM-900/485 — це модем, який ніколи не зависає.":
      "Proprietary base firmware ensures uninterrupted dual-SIM operation. An external hardware watchdog supervisor on the PCB continuously monitors the radio module and automatically reboots it in the event of a freeze — making the COM-900/485 virtually hang-proof.",
    "При виробництві модему COM-900-485-4G ми прагнемо максимально використовувати вітчизняні компоненти та комплектуючі: друкована плата, корпус, кріплення та серце модему ― оригінальне програмне забезпечення українських інженерів.":
      "In manufacturing the COM-900-485-4G, we maximize the use of Ukrainian-made components: the PCB, enclosure, mounting hardware, and the heart of the modem — proprietary firmware developed by Ukrainian engineers.",

    // 2. com-900-itr-4g
    "Модем COM-900-ITR-4G — модем нового покоління. Він працює в діапазонах 2G (GPRS) і 4G (LTE), а також підтримує передачу даних CSD. Призначений для використання в автоматизованих системах дистанційного зчитування даних із використанням мережі GSM.":
      "The COM-900-ITR-4G is a next-generation industrial modem operating across 2G (GPRS) and 4G (LTE) bands with CSD data support, designed for automated remote meter reading (AMR/AMI) over cellular networks.",
    "Модем застосовується для передачі показань лічильників електроенергії, тепла, газу, води тощо. Зокрема, модем адаптований для передачі показань від лічильників електроенергії ITRON (ACTARIS) і живиться за інтерфейсним кабелем безпосередньо від лічильника.":
      "Used for transmitting readings from electricity, heat, gas, and water meters. Specifically tailored for ITRON (ACTARIS) electricity meters, receiving power directly from the meter via the interface cable.",
    "У модемі реалізовані контролі живучості: апаратний та програмний при проблемах із GSM та GPRS/LTE з'єднанням, програмний — при проблемах з TCP-з'єднанням.":
      "Built-in reliability watchdogs include both hardware and software recovery for GSM and GPRS/LTE link issues, plus software recovery for TCP connection drops.",
    "Конструктивно модем виконаний у компактному міцному металевому корпусі. Підключається до лічильника за інтерфейсом RS-485. Порт USB використовується для програмування та конфігурації. Модем також може живитися від зовнішнього блока живлення 6…28 VDC (є захист від переполюсування живлення).":
      "Housed in a compact, rugged metal enclosure. Connects to the meter via RS-485, with a USB port for programming and configuration. Can also be powered by an external 6–28 VDC supply (with reverse-polarity protection).",
    "Для надійного забезпечення каналу зв'язку можлива робота модему із двома SIM-картами різних операторів з автоматичним перемиканням між ними.":
      "Supports dual SIM cards from different mobile operators with automatic failover switching to guarantee link redundancy.",
    "Підтримується дистанційне програмування (по мережі GPRS/LTE або через SMS), віддалене оновлення прошивки та система автоматичного перезапуску «WatchDog» (при зависанні або за розкладом).":
      "Supports remote configuration (over GPRS/LTE or via SMS), over-the-air firmware updates, and an automatic «WatchDog» reboot system (on freeze or by schedule).",

    // 3. com-900-psg-4g
    "Модем COM-900-PSG-4G працює в діапазонах 2G (GPRS) і 4G (LTE), а також підтримує передачу даних CSD. Призначений для використання в автоматизованих системах дистанційного зчитування даних із використанням мережі GSM/LTE.":
      "The COM-900-PSG-4G modem operates in 2G (GPRS) and 4G (LTE) bands with CSD data support, engineered for automated remote meter reading (AMR/AMI) over GSM/LTE networks.",
    "Зокрема, модем адаптований для передачі показань від лічильників електроенергії GAMA (ELGAMA). Підключається до RS-485 порту лічильника простим дводротовим кабелем. Містить вбудований блок живлення від мережі 220 В. Конструкція корпусу дозволяє легко кріпити його під клемною кришкою лічильника GAMA.":
      "Specially adapted for GAMA (ELGAMA) electricity meters. Connects to the meter's RS-485 port via a simple two-wire cable, includes an integrated 220V AC power supply, and fits neatly under the GAMA meter terminal cover.",
    "У модемі реалізовані апаратний та програмний контролі живучості при проблемах із GSM, GPRS/LTE та TCP-з'єднанням.":
      "Features hardware and software watchdog recovery for GSM, GPRS/LTE, and TCP connectivity issues.",
    "Конструктивно модем виконано у компактному міцному пластиковому корпусі. Порт USB використовується для програмування та конфігурації.":
      "Housed in a compact, durable plastic enclosure with a USB port for local programming and configuration.",
    "Можлива робота з 2-ма SIM-картками різних операторів з автоматичним перемиканням між ними, а також дистанційне програмування та оновлення прошивки по мережі GPRS/LTE або через SMS.":
      "Supports dual SIM cards from different carriers with automatic failover, as well as remote configuration and firmware updates over GPRS/LTE or SMS.",

    // 4. com-900-itr-rev-b
    "Модем COM-900-ITR rev.B призначений для використання в автоматизованих системах дистанційного зчитування даних з використанням мережі GSM. Адаптований для передачі показань від лічильників електроенергії ITRON (ACTARIS).":
      "The COM-900-ITR rev.B modem is designed for automated remote data reading systems over GSM networks, specifically adapted for ITRON (ACTARIS) electricity meters.",
    "Підключається до RS-485 порту лічильника простим кабелем типу «патч-корд», яким також отримує живлення від лічильника. Містить Li-ion акумулятор для буферизації живлення та передачі повідомлення при зникненні змінної напруги. Оснащений світлодіодом індикації якості сигналу. Конструкція корпусу дозволяє легко кріпити модем на клемній кришці лічильника.":
      "Connects to the meter's RS-485 port via a standard patch cord that also supplies power from the meter. Includes a built-in Li-ion backup battery to buffer power and transmit power-outage alerts, plus a signal-quality LED indicator. Easily mounts onto the meter's terminal cover.",
    "Реалізовані апаратний та програмний контролі живучості при проблемах із GSM/GPRS та TCP-з'єднанням.":
      "Includes hardware and software watchdog protection for GSM/GPRS and TCP connection stability.",
    "Виконаний у компактному міцному пластиковому корпусі. Підтримує роботу з 2-ма SIM-картками різних операторів з автоматичним перемиканням, а також дистанційне програмування та оновлення прошивки по GPRS або SMS.":
      "Built in a durable compact plastic housing. Supports 2 SIM cards with automatic carrier switching, plus remote configuration and firmware updates via GPRS or SMS.",

    // 5. com-900-nbi-int
    "NBIoT-модем COM-900-NBI-int призначений для використання в автоматизованих системах дистанційного зчитування даних із використанням стільникової мережі NBIoT. Завдяки оригінальному дизайну (технологія OpenCPU, відсутність зовнішнього процесора, використання суперконденсатора) модем має екстремально низьке споживання і здатний працювати автономно до декількох років без заміни батареї.":
      "The COM-900-NBI-int NBIoT modem is designed for automated remote meter reading (AMR/AMI) systems over cellular NBIoT networks. Thanks to its proprietary OpenCPU architecture (eliminating the need for an external MCU and utilizing a supercapacitor), the modem achieves ultra-low power consumption and operates autonomously for several years without battery replacement.",
    "Виробляється в безкорпусному виконанні («int» — internal) для встановлення всередині теплових лічильників як вбудований модуль зв'язку. Адаптований для роботи з лічильниками тепла Multical 66, Multical 601/602, Multical 603, SKS-3, Ultraheat T550/UH50, Ultraheat TB-07-K7. У лічильники Multical 66 та 601/602 встановлюється як штатний модуль «низа» разом із батареєю розміру 14500 без додаткових перетворювачів інтерфейсу.":
      "Manufactured in an open-frame («int» — internal) form factor for installation directly inside heat meters as an embedded communication module. Adapted for Multical 66, Multical 601/602, Multical 603, SKS-3, Ultraheat T550/UH50, and Ultraheat TB-07-K7 heat meters. Installs into Multical 66 and 601/602 as a native base module alongside a 14500-size battery without extra interface converters.",
    "Модем періодично за розкладом ініціює з'єднання з центром збору даних (клієнтський режим, підтримується ПЗ «ЕнергоЦентр»), передає інформацію та переходить у режим сну. Також може конфігуруватися в класичному серверному режимі із зовнішнім блоком живлення.":
      "The modem periodically initiates scheduled connections to the data collection center (client mode, compatible with «EnergoCenter» software), transmits telemetry data, and enters deep sleep mode. It can also be configured in classic server mode when powered by an external power supply.",
    "Ультракомпактне виконання, надмале споживання й розширений температурний діапазон (-40°C...+85°C) дозволяють широко використовувати його в рішеннях IoT, системах безпеки, екологічного моніторингу та розумних паркувальних системах.":
      "Its ultra-compact footprint, micro-power draw, and extended operating temperature range (-40°C to +85°C) make it ideal for IoT deployments, security systems, environmental monitoring, and smart parking infrastructure.",

    // 6. com-900-nbi-ext
    "NBIoT-модем COM-900-NBI-ext призначений для використання в автоматизованих системах дистанційного зчитування даних у стільниковій мережі NBIoT. Завдяки технології OpenCPU та використанню суперконденсатора має наднизьке енергоспоживання і здатний працювати автономно декілька років без заміни батареї.":
      "The COM-900-NBI-ext NBIoT modem is designed for automated remote meter reading over cellular NBIoT networks. Featuring OpenCPU technology and a supercapacitor buffer, it delivers ultra-low power consumption for multi-year autonomous battery operation.",
    "Виробляється у зовнішньому виконанні («ext» — external): має міцний пластиковий корпус, інтерфейс RS-232 та автономне джерело живлення. Ефективно використовується як комунікаційний модуль для лічильників тепла (зокрема серії СВТУ), оскільки інтерфейс RS-232 містить лінію живлення +5 В для зовнішніх пристроїв.":
      "Manufactured in an external («ext») rugged plastic enclosure with an RS-232 interface and self-contained battery power. Ideal as a communication module for heat meters (including SVTU series), providing a +5V power line over the RS-232 interface for external devices.",
    "Модем періодично за розкладом ініціює з'єднання з центром збору даних (ПЗ «ЕнергоЦентр»), передає дані лічильника та «засинає» до наступного сеансу. Також може працювати в класичному серверному режимі АСКОЕ із зовнішнім блоком живлення.":
      "The modem connects on a schedule to the data collection center («EnergoCenter» software), transmits meter readings, and enters deep sleep until the next session. Can also operate in classic AMR server mode with an external power supply.",

    // 7 & 8. Antennas
    "Зовнішня герметична всеспрямована антена, яка працює на частотах 900/1800 МГц (у діапазонах 2G/4G).":
      "External weatherproof omnidirectional antenna operating across 900/1800 MHz bands (2G/4G).",
    "Характеризується високою механічною міцністю та зручним кріпленням за допомогою магнітної основи. Коефіцієнт підсилення — до 2–3 dBi, ступінь захисту — не гірший за IP54. Довжина кабелю становить 3 метри, прямий роз'єм SMA.":
      "Features high mechanical durability and convenient magnetic-base mounting. Gain up to 2–3 dBi, ingress protection rated at IP54 or better. Includes a 3-meter cable with a straight SMA connector.",
    "Характеризується високою механічною міцністю, зручним кріпленням за допомогою магнітної основи та практичним кутовим роз'ємом SMA. Коефіцієнт підсилення — до 3.5–5 dBi, ступінь захисту — не гірший за IP54. Довжина кабелю — 3 метри.":
      "Features high mechanical durability, magnetic-base mounting, and a practical right-angle SMA connector. Gain up to 3.5–5 dBi, ingress protection rated at IP54 or better, with a 3-meter cable.",

    // 9–12. POS Accessories
    "Спеціалізований інтерфейсний кабель для під'єднання банківського PoS-терміналу Ingenico iCT220 через інтерфейс USB. Довжина кабелю становить 3 метри.":
      "Dedicated USB interface cable for connecting an Ingenico iCT220 banking POS terminal. Cable length: 3 meters.",
    "Надійна акумуляторна батарея для мобільних банківських PoS-терміналів серії Ingenico iWL220, iWL250, iWL220 GPRS, iWL250 Bluetooth та iWL250 GPRS.":
      "Reliable rechargeable battery for Ingenico mobile banking POS terminals: iWL220, iWL250, iWL220 GPRS, iWL250 Bluetooth, and iWL250 GPRS.",
    "Акумуляторна батарея для мобільного банківського PoS-терміналу Ingenico Move 2500. Забезпечує тривалу автономну роботу терміналу.":
      "Rechargeable battery for the Ingenico Move 2500 mobile banking POS terminal, providing long-lasting autonomous operation.",
    "Кабель для підключення зовнішнього пінпада типу iPP2xx до PoS-терміналу Ingenico iCT220 по інтерфейсу USB.":
      "Interface cable for connecting an external iPP2xx series pinpad to an Ingenico iCT220 POS terminal via USB.",
    "Кабель м'який, еластичний, міцний і стійкий до інтенсивної експлуатації. Провідники виконані з чистої міді перерізом 22AWG. На терміналі вставляється в роз'єм USB HOST, на пінпаді — у гніздо типу RJ45.":
      "Soft, flexible, durable cable built for heavy daily use with 22AWG pure copper conductors. Connects to the USB HOST port on the terminal and the RJ45 port on the pinpad.",

    // 13–15. DC Power Cables
    "Високоякісний кабель низьковольтного живлення (DC-кабель) з гнучким введенням і кутовим роз'ємом 2,1×5,5 мм.":
      "High-quality low-voltage DC power cable with strain relief and an angled 2.1×5.5 mm barrel connector.",
    "Провід коаксіального типу, дуже міцний та зносостійкий, розрахований на струм до 4 А, кінці дроту облуджені. Довжина кабелю — 1,5 м, довжина контактної частини — 10 мм. Широко використовується в джерелах живлення для світлодіодних (LED) освітлювальних пристроїв, систем охорони та телекомунікаційного обладнання.":
      "Heavy-duty coaxial wire rated up to 4 A with pre-tinned leads. Cable length: 1.5 m; plug tip length: 10 mm. Widely used in power supplies for LED lighting, security systems, and telecom hardware.",
    "Високоякісний кабель низьковольтного живлення (DC-кабель) з гнучким введенням і кутовим роз'ємом 1,4×3,4 мм.":
      "High-quality low-voltage DC power cable with strain relief and an angled 1.4×3.4 mm connector.",
    "Провід планарного типу з чистої міді (переріз 18AWG), дуже міцний, розрахований на струм до 4 А, кінці дроту облуджені. Довжина кабелю — 1,8 м, довжина контактної частини — 9 мм. Використовується в джерелах живлення для автомобільних пристроїв (відеореєстратори, радар-детектори) та зв'язкового обладнання.":
      "Planar 18AWG pure copper wire rated up to 4 A with pre-tinned leads. Cable length: 1.8 m; plug tip length: 9 mm. Ideal for automotive electronics (dashcams, radar detectors) and communication equipment.",
    "Високоякісний кабель низьковольтного живлення (DC-кабель) з феритовим фільтром для захисту від високочастотних завад, гнучким введенням і прямим роз'ємом 2,1×5,5 мм.":
      "High-quality low-voltage DC power cable featuring a ferrite EMI filter, flexible strain relief, and a straight 2.1×5.5 mm connector.",
    "Провід коаксіального типу, міцний і зносостійкий, розрахований на струм до 3 А, кінці дроту облуджені. Довжина кабелю — 1,0 м, довжина контактної частини — 9 мм. Широко застосовується в джерелах живлення для LED-освітлення, систем охорони та модемів.":
      "Durable coaxial wire rated up to 3 A with pre-tinned leads. Cable length: 1.0 m; plug tip length: 9 mm. Widely used in power supplies for LED lighting, security systems, and modems.",

    // --- All Spec Table Labels & Values from products-data.js ---
    "Стандарт зв'язку": "Communication Standard",
    "Частотний діапазон, МГц": "Frequency Bands, MHz",
    "Частотний діапазон": "Frequency Bands",
    "Технологія передачі даних": "Data Transmission Technology",
    "Передача даних": "Data Transmission",
    "Передавання даних": "Data Transfer Rate",
    "Джерело живлення, В": "Power Supply, V",
    "Діапазон живлення, В": "Supply Voltage Range, V",
    "Живлення (зовнішнє джерело), В": "External Power Supply, V",
    "Джерело живлення": "Power Source",
    "Струм живлення": "Current Consumption",
    "Струм споживання": "Current Consumption",
    "Струм споживання (від 3.3 VDC)": "Current Consumption (at 3.3 VDC)",
    "Потужність при передачі": "Transmit Power",
    "Потужність під час передавання": "Transmit Power",
    "Наявність індикації": "LED Indicators",
    "Інтерфейсний модуль": "Interface Module",
    "Кількість слотів для SIM-карти": "SIM Card Slots",
    "Кількість SIM-карт": "SIM Card Slots",
    "Типи підтримуваних SIM-карт": "Supported SIM Card Voltage",
    "Тип слота та SIM-картки": "SIM Slot & Card Type",
    "Програмні модулі та протоколи": "Protocols & Software Features",
    "Робоча температура": "Operating Temperature",
    "Діапазон робочих температур": "Operating Temperature Range",
    "Габаритні розміри": "Dimensions",
    "Габаритні розміри, мм": "Dimensions, mm",
    "Розміри, мм": "Dimensions, mm",
    Вага: "Weight",
    "Вага, г": "Weight, g",
    "Вага без антени, г": "Weight (excl. antenna), g",
    "Вага без антени і БЖ, г": "Weight (excl. antenna & PSU), g",
    Виробник: "Manufacturer",
    "Астел-Ком": "ASTEL-COM",
    "Країна виробництва": "Country of Origin",
    "Країна виробник": "Country of Origin",
    Україна: "Ukraine",
    Тип: "Type",
    "Форм-фактор": "Form Factor",
    Внутрішній: "Internal",
    "Внутрішній (бескорпусний)": "Internal (open-frame / PCB)",
    "Внутрішній (безкорпусний)": "Internal (open-frame / PCB)",
    "Зовнішній (у корпусі)": "External (enclosed)",
    Стандарт: "Standard",
    Інтерфейси: "Interfaces",
    Інтерфейс: "Interface",
    "Тип інтерфейсу": "Interface Type",
    "Швидкість обміну через UART": "UART Baud Rate",
    "Швидкість обміну RS-232": "RS-232 Baud Rate",
    "Швидкість обміну через USB": "USB Data Rate",
    "USB-порт": "USB Port",
    "Вихід під зовнішню антену": "External Antenna Connector",
    "Слот для карт пам'яті microSD": "microSD Card Slot",
    Стан: "Condition",
    Новий: "New",
    "Робочі частоти, МГц": "Operating Frequencies, MHz",
    "Коефіцієнт підсилення": "Antenna Gain",
    "Тип кріплення": "Mounting Type",
    "Магнітна основа": "Magnetic base",
    "Довжина кабелю": "Cable Length",
    "Тип роз'єму": "Connector Type",
    "SMA (прямий)": "SMA (straight)",
    "SMA (кутовий)": "SMA (right-angle)",
    "Ступінь захисту": "Ingress Protection",
    "Ширина променя": "Radiation Pattern",
    Всеспрямована: "Omnidirectional",
    Сумісність: "Compatibility",
    Призначення: "Application",
    "PoS-термінали": "POS terminals",
    "PoS-термінали Ingenico": "Ingenico POS terminals",
    "Підключення пінпада": "Pinpad connection",
    "Номінальна напруга": "Nominal Voltage",
    Ємність: "Capacity",
    Енергоємність: "Energy Capacity",
    "Роз'єми": "Connectors",
    "Матеріал провідників": "Conductor Material",
    "Розмір роз'єму": "Connector Size",
    "Тип проводу": "Wire Type",
    "Максимальний струм": "Max Current",
    "Довжина контактної частини": "Plug Tip Length",
    Особливість: "Feature",
    "З феритовим фільтром": "With ferrite EMI filter",
    "DC-кабель живлення": "DC power cable",

    // --- Exact Spec Table Values from products-data.js ---
    "У режимі передачі даних не більше 200 мА (живлення 12 В)":
      "Max 200 mA in data transmission mode (at 12V supply)",
    "У режимі передачі даних не більше 10 мА (живлення 220 VAC)":
      "Max 10 mA in data transmission mode (at 220 VAC supply)",
    "Світлова індикація: живлення, передачі даних, реєстрації у мережі 2G/4G, рівня покриття мережі":
      "LED indicators: power supply, data transmission, 2G/4G network registration, signal strength",
    "Світлова індикація роботи комунікаційного модуля та передачі даних":
      "LED indicators for communication module status and data transmission",
    "Інтерфейс RS485 — 1 шт.": "RS485 interface — 1 pc",
    "Інтерфейс USB — 1 шт.": "USB interface — 1 pc",
    "Вбудований SIM-рідер — 1 шт.": "Built-in SIM reader — 1 pc",
    "Роз'єм для антени SMA-f — 1 шт.": "SMA-f antenna connector — 1 pc",
    "Один — за замовчуванням, два — опція":
      "1 slot (default), 2 slots (optional)",
    "1,8 В; 3,0 В": "1.8 V; 3.0 V",
    "Встановлення пріоритетного номера; Локальне та дистанційне програмування; Підтримка TCP/IP та статичних IP-адрес; Стандартні AT-команди (GSM07.05 і 07.07); APN з авторизацією; Автоматичне перезавантаження та вхід в мережу; Автоматичне управління якістю сеансу зв'язку":
      "Priority number setup; Local & remote configuration; TCP/IP and static IP support; Standard AT commands (GSM 07.05 & 07.07); Authenticated APN; Automatic reboot & network reconnection; Automatic link-quality management",
    "Встановлення пріоритетного номера; Локальне та дистанційне програмування; Підтримка TCP/IP та статичних IP-адрес; Стандартні AT-команди (GSM07.05 і 07.07); APN з авторизацією; Автоматичне перезавантаження (WatchDog) та вхід в мережу":
      "Priority number setup; Local & remote configuration; TCP/IP and static IP support; Standard AT commands (GSM 07.05 & 07.07); Authenticated APN; Automatic WatchDog reboot & network reconnection",
    "Встановлення пріоритетного номера; Локальне та дистанційне програмування; Підтримка TCP/IP та статичних IP-адрес; Стандартні AT-команди (GSM07.05 і 07.07); APN з авторизацією; Автоматичне перезавантаження та вхід в мережу":
      "Priority number setup; Local & remote configuration; TCP/IP and static IP support; Standard AT commands (GSM 07.05 & 07.07); Authenticated APN; Automatic reboot & network reconnection",
    "85 × 90 × 15 (корпус 63 × 15 × 60)":
      "85 × 90 × 15 (enclosure 63 × 15 × 60)",
    "не більше 100": "max 100",
    "не більше 60": "max 60",
    "не більше 130": "max 130",
    "RS232 (2 шт.), RS485, USB (1 шт.)": "RS232 (2 pcs), RS485, USB (1 pc)",
    "RS232 (2 шт.), RS485, USB": "RS232 (2 pcs), RS485, USB",
    "RS485, USB (1 шт.)": "RS485, USB (1 pc)",
    "2 шт.": "2 pcs",
    "Так (1 шт.)": "Yes (1 pc)",
    "1 шт. (NanoSIM)": "1 pc (NanoSIM)",
    "GPRS клас 12, SMS, USSD, CSD, FAX": "GPRS Class 12, SMS, USSD, CSD, FAX",
    "70 мА (12 В) / 35 мА (24 В)": "70 mA (at 12V) / 35 mA (at 24V)",
    "DL — 25.5 кбіт/с, UL — 62.5 кбіт/с": "DL — 25.5 kbps, UL — 62.5 kbps",
    "Батарея SAFT LS14500 STD, AA, 3.6V, LiSOCl2 2600 мА·год":
      "SAFT LS14500 STD Battery, AA, 3.6V, Li-SOCl2 2600 mAh",
    "Передавання даних (Single Tone): не більше 344 мА":
      "Data transmission (Single Tone): max 344 mA",
    "Режим Deep Sleep: не більше 3.5 мкА": "Deep Sleep mode: max 3.5 µA",
    "UART (2 шт.), USB 1.1 (1 шт.), USIM (1 шт.)":
      "UART (2 pcs), USB 1.1 (1 pc), USIM (1 pc)",
    "RS-232 з лінією живлення +5 В (1 шт.), USB 1.1 (1 шт.), USIM (1 шт.)":
      "RS-232 with +5V power line (1 pc), USB 1.1 (1 pc), USIM (1 pc)",
    "від 75 біт/сек до 921600 біт/сек": "from 75 bps to 921600 bps",
    "до 12 Мбіт/сек (для програмування)": "up to 12 Mbps (for programming)",
    "NanoSIM (1,8 В)": "NanoSIM (1.8 V)",
    "Батарея ER26500 (Li-SOCl₂, 3.6 В, 6000 мА·год)":
      "ER26500 Battery (Li-SOCl₂, 3.6 V, 6000 mAh)",
    "Стандартний струм розряду: 10 мА": "Standard discharge current: 10 mA",
    "Тривалий (макс.): 1000 мА, Імпульсний (макс.): 2000 мА":
      "Continuous (max): 1000 mA, Pulse (max): 2000 mA",
    "Температура батареї: -55...+85°C":
      "Battery temperature range: -55...+85°C",
    "3 м": "3 m",
    "1,5 м": "1.5 m",
    "1,8 м": "1.8 m",
    "1,0 м": "1.0 m",
    "10 мм": "10 mm",
    "9 мм": "9 mm",
    "до 4 А": "up to 4 A",
    "до 3 А": "up to 3 A",
    "3,6 В": "3.6 V",
    "2.2 А·год (2200 мА·год)": "2.2 Ah (2200 mAh)",
    "2200 мА·год (2.2 А·год)": "2200 mAh (2.2 Ah)",
    "7.4 Вт·год": "7.4 Wh",
    "Термінал Ingenico iCT220 + пінпад серії iPP2xx":
      "Ingenico iCT220 terminal + iPP2xx series pinpad",
    "USB HOST (термінал) → RJ45 (пінпад)":
      "USB HOST (terminal) → RJ45 (pinpad)",
    "Мідь, 22AWG": "Copper, 22AWG",
    "2,1 × 5,5 мм (кутовий)": "2.1 × 5.5 mm (angled)",
    "1,4 × 3,4 мм (кутовий)": "1.4 × 3.4 mm (angled)",
    "2,1 × 5,5 мм (прямий)": "2.1 × 5.5 mm (straight)",
    "Коаксіальний, облуджені кінці": "Coaxial, pre-tinned leads",
    "Планарний, чиста мідь 18AWG, облуджені кінці":
      "Planar, 18AWG pure copper, pre-tinned leads",

    // --- Downloads & Docs Pages (downloads.html, docs.html) ---
    "Програмне забезпечення": "Software & Drivers",
    Драйвери: "Drivers",
    "Офіційні драйвери для підключення GSM/GPRS, LTE та NBIoT-модемів АСТЕЛ-КОМ до комп'ютера через інтерфейс USB для конфігурації та програмування.":
      "Official drivers for connecting ASTEL-COM GSM/GPRS, LTE, and NBIoT modems to a PC via USB for configuration and firmware programming.",
    "USB Драйвер": "USB Driver",
    "Базовий пакет драйверів": "Base Driver Package",
    "ZIP-архів": "ZIP Archive",
    "USB-драйвер для модемів COM-900 (4G / LTE)":
      "USB Driver for COM-900 Series Modems (4G / LTE)",
    "Цифрово підписаний драйвер віртуального COM-порту для підключення, діагностики та конфігурації модемів серії COM-900-485-4G, COM-900-ITR-4G та COM-900-PSG-4G у середовищі ОС Windows.":
      "Digitally signed virtual COM port driver for connecting, diagnosing, and configuring COM-900-485-4G, COM-900-ITR-4G, and COM-900-PSG-4G modems in Windows OS.",
    "Універсальний пакет драйверів COM-900 (Drv)":
      "Universal COM-900 Driver Package (Drv)",
    "Комплект драйверів для підключення промислових модемів лінійки COM-900 до ПК через USB-кабель для локального налаштування параметрів та оновлення вбудованого ПЗ.":
      "Driver suite for connecting COM-900 industrial modems to a PC via USB cable for local parameter configuration and firmware updates.",
    "Завантажити драйвер": "Download Driver",
    "Шукаєте технічні паспорти або керівництва з монтажу та експлуатації модемів у форматі PDF?":
      "Looking for technical datasheets or installation and operation manuals in PDF format?",
    "ПЕРЕЙТИ ДО ДОКУМЕНТАЦІЇ": "GO TO DOCUMENTATION",
    "Технічна база": "Technical Library",
    "Оберіть пристрій зі списку нижче, щоб завантажити керівництва з монтажу та експлуатації, технічні паспорти та драйвери.":
      "Select a device below to download installation and operation manuals, technical datasheets, and drivers.",
    "Перейти на сторінку товару": "View Product Page",

    // --- Cart & Checkout (cart.html & order-status.html) ---
    "Оформлення замовлення": "Checkout",
    "Новий покупець": "New Customer",
    "Я постійний клієнт": "Returning Customer",
    "Особисті дані": "Personal Details",
    "Ваше ім'я": "First Name",
    "Ваше прізвище": "Last Name",
    Телефон: "Phone",
    Місто: "City",
    "Будь ласка, введіть ваше ім'я (мінімум 2 літери).":
      "Please enter your first name (at least 2 letters).",
    "Будь ласка, введіть ваше прізвище (мінімум 2 літери).":
      "Please enter your last name (at least 2 letters).",
    "Невірний формат телефону (наприклад: +380501234567).":
      "Invalid phone format (e.g., +380501234567).",
    "Будь ласка, введіть коректну адресу E-mail.":
      "Please enter a valid E-mail address.",
    "Будь ласка, вкажіть місто доставки зі списку доступних населених пунктів.":
      "Please select a delivery city from the available locations.",
    "Вкажіть номер відділення або поштомату Нової Пошти.":
      "Please enter the Nova Poshta branch or locker number.",
    "Вкажіть індекс або номер відділення Укрпошти.":
      "Please enter the Ukrposhta postal code or branch number.",
    "Вкажіть номер відділення або поштомату Meest ПОШТА.":
      "Please enter the Meest POSHTA branch or locker number.",
    "Інформація про доставку": "Delivery Information",
    "Варіанти доставки": "Delivery Options",
    "Нова Пошта (відділення або поштомат)": "Nova Poshta (branch or locker)",
    "Укрпошта (відділення або поштомат)": "Ukrposhta (branch or locker)",
    "Meest ПОШТА (відділення або поштомат)": "Meest POSHTA (branch or locker)",
    "Нова Пошта": "Nova Poshta",
    Укрпошта: "Ukrposhta",
    "Meest ПОШТА": "Meest POSHTA",
    Відділення: "Branch",
    Поштомат: "Parcel Locker",
    "Варіанти оплати": "Payment Options",
    "Готівка (при отриманні)": "Cash on delivery",
    Готівка: "Cash on delivery",
    "Оплата банківською картою (Visa / Mastercard)":
      "Bank Card (Visa / Mastercard)",
    "Оплата банківською картою": "Bank Card",
    "Підтвердити замовлення": "Confirm Order",
    "Зберегти зміни у замовленні": "Save Order Changes",
    "Ваше замовлення": "Your Order",
    "Ваш кошик порожній.": "Your cart is empty.",
    "Перейти до каталогу": "Browse Catalog",
    Видалити: "Remove",
    "Сума замовлення:": "Subtotal:",
    "Доставка (": "Delivery (",
    безкоштовно: "free",
    "Разом:": "Total:",
    "Логін / E-mail": "Login / E-mail",
    Пароль: "Password",
    "Будь ласка, введіть коректний логін або E-mail.":
      "Please enter a valid login or E-mail.",
    "Будь ласка, введіть ваш пароль (мінімум 6 символів).":
      "Please enter your password (at least 6 characters).",
    "Забули пароль?": "Forgot password?",
    'Перейти у "Новий покупець"': 'Switch to "New Customer"',
    "Увійти та продовжити": "Sign In & Continue",
    // --- Split Text Nodes around <strong> tags in cart.html, product.html & order-status.html ---
    "Якщо ви зареєстрований клієнт, введіть ваш логін/email та пароль, якщо ви ще не є нашим клієнтом, то перейдіть у розділ":
      "If you are a registered customer, please enter your login/email and password. If you are new here, switch to the",
    '"Новий покупець"': '"New Customer"',
    "і заповніть поля потрібною інформацією.":
      "tab and fill in the required information.",
    "Підтвердження відправлено на": "Confirmation has been sent to",
    ". Наш менеджер зв'яжеться з вами найближчим часом.":
      ". Our manager will contact you shortly.",
    "Обліковий запис": "Account",
    "успішно авторизовано. Ваші контактні дані підвантажено у форму замовлення.":
      "authorized successfully. Your contact details have been loaded into the checkout form.",
    "Інструкції для відновлення пароля надіслано на":
      "Password recovery instructions have been sent to",
    "Посилання для скидання пароля надіслано на ваш E-mail:":
      "Password reset link has been sent to your E-mail:",
    "Населений пункт не знайдено або доставка тимчасово недоступна":
      "Location not found or delivery is temporarily unavailable",
    "Відділень за цим запитом не знайдено": "No branches found for this query",
    "● Авторизований постійний клієнт": "● Authorized Returning Customer",
    "Ваші особисті дані та параметри доставки підвантажено автоматично.":
      "Your personal details and delivery preferences have been auto-filled.",
    "Активне замовлення не знайдено": "No active order found",
    "Ви ще не оформили замовлення або перейшли за застарілим посиланням.":
      "You haven't placed an order yet or followed an expired link.",
    "Прийнято (доступне редагування)": "Accepted (editable)",
    "Прийнято (редагування)": "Accepted (editable)",
    "Передано в обробку": "In Processing",
    Виконано: "Completed",
    "Час для внесення змін у замовлення або кошик:":
      "Time remaining to edit your order or cart:",
    "Замовлення передано в обробку менеджеру. Редагування завершено.":
      "Order has been sent to our manager for processing. Editing is now closed.",
    Отримувач: "Recipient",
    "Сума та спосіб оплати": "Amount & Payment Method",
    Доставка: "Delivery",
    "Доставка:": "Delivery:",
    "Оплата:": "Payment:",
    "ТТН:": "Tracking #:",
    "Склад замовлення": "Order Items",
    "Редагувати дані або товари": "Edit Details or Items",
    "Все вірно, передати в роботу зараз": "Everything is correct, process now",
    "Повернутися до каталогу": "Return to Catalog",

    // --- Login & Account Pages (login.html & account.html) ---
    "Керуйте вашими замовленнями, історією покупок та збереженими адресами доставки в один клік.":
      "Manage your orders, purchase history, and saved delivery addresses in one click.",
    Вхід: "Sign In",
    Реєстрація: "Register",
    "Продовжити через Google": "Continue with Google",
    "або через E-mail": "or via E-mail",
    "Ім'я": "First Name",
    Прізвище: "Last Name",
    "Особистий E-mail": "Personal E-mail",
    "Поточний пароль": "Current Password",
    "Новий пароль": "New Password",
    "Населений пункт": "City / Town",
    "Номер відділення / поштомату або адреса":
      "Branch / Locker Number or Address",
    "Запам'ятати мене": "Remember me",
    "Увійти в кабінет": "Sign In",
    "Створити обліковий запис": "Create Account",
    "Введіть коректну адресу електронної пошти.":
      "Please enter a valid email address.",
    "Введіть коректну адресу E-mail.": "Please enter a valid email address.",
    "Пароль має містити щонайменше 12 символів.":
      "Password must be at least 12 characters long.",
    "Введіть ваше ім'я (мінімум 2 літери).":
      "Please enter your first name (at least 2 letters).",
    "Введіть ваше прізвище (мінімум 2 літери).":
      "Please enter your last name (at least 2 letters).",
    "Введіть номер телефону.": "Please enter your phone number.",
    "● Авторизовано": "● Authorized",
    "Ім'я Прізвище": "First Last Name",
    "Швидке замовлення": "Quick Reorder",
    "Повторити останнє замовлення": "Repeat Last Order",
    "Скопіюйте всі позиції та кількості з вашого попереднього замовлення одразу в кошик.":
      "Copy all items and quantities from your previous order directly into your cart.",
    "Скопіювати останнє замовлення": "Copy Last Order",
    "Мої замовлення": "My Orders",
    "Моя адреса доставки": "My Delivery Address",
    "Налаштування та безпека": "Settings & Security",
    "Вийти з акаунту": "Log Out",
    "Консультація та підтримка": "Support & Consultation",
    Сергій: "Serhii",
    "Сергій (Відділ продажу)": "Serhii (Sales Department)",
    "Історія та статуси замовлень": "Order History & Statuses",
    "Сума без ПДВ:": "Total excl. VAT:",
    "Статус / Таймер": "Status / Timer",
    "Повторити замовлення": "Repeat Order",
    "Скопіювати в кошик": "Copy to Cart",
    "Додано в кошик ✓": "Added to Cart ✓",
    "Основна адреса доставки": "Primary Delivery Address",
    "Поточна збережена адреса (за замовчуванням для кошика)":
      "Current saved address (default for checkout)",
    "Служба доставки": "Delivery Carrier",
    "Тип точки видачі": "Pickup Point Type",
    "Зберегти адресу": "Save Address",
    "Основну адресу доставки успішно збережено!":
      "Primary delivery address saved successfully!",
    "Особисті дані отримувача": "Recipient Personal Details",
    "Оновити профіль": "Update Profile",
    "Особисті дані успішно оновлено.": "Personal details updated successfully.",
    "Зміна та скидання пароля": "Change or Reset Password",
    "Забули поточний пароль?": "Forgot current password?",
    "Введіть поточний пароль.": "Please enter your current password.",
    "Новий пароль має містити щонайменше 12 символів.":
      "New password must be at least 12 characters long.",
    "Змінити пароль": "Change Password",
    "Ваш пароль успішно змінено.":
      "Your password has been changed successfully.",
    Оформити: "Checkout",
  };

  const TEXT_MAP = {};
  Object.keys(RAW_TEXT_MAP).forEach((k) => {
    TEXT_MAP[norm(k)] = RAW_TEXT_MAP[k];
  });

  // 2. Placeholders & Aria-Labels Map
  const ATTR_MAP = {
    "Введіть ваше ім'я": "Enter your first name",
    "Введіть ваше прізвище": "Enter your last name",
    "Почніть вводити назву міста (наприклад: Київ)":
      "Start typing city name (e.g., Kyiv)",
    "Наприклад: Київ": "e.g., Kyiv",
    "Оберіть зі списку або введіть номер відділення / адресу*":
      "Select from list or enter branch number / address*",
    "Оберіть зі списку або введіть індекс / адресу відділення*":
      "Select from list or enter postal code / branch address*",
    "Оберіть зі списку або введіть номер відділення / поштомату Meest*":
      "Select from list or enter Meest branch / locker number*",
    "Оберіть зі списку або введіть номер відділення":
      "Select from list or enter branch number",
    "Введіть ваш E-mail": "Enter your E-mail",
    "Введіть ваш пароль": "Enter your password",
    "Мінімум 12 символів": "Minimum 12 characters",
    "Додати в кошик": "Add to cart",
    Зменшити: "Decrease",
    Збільшити: "Increase",
    Кількість: "Quantity",
    Закрити: "Close",
    "Попереднє фото": "Previous photo",
    "Наступне фото": "Next photo",
  };

  // 3. Elements with <br> tags
  const HTML_SELECTOR_MAP = [
    {
      selector: ".hero__title",
      en: "EQUIPMENT & SOLUTIONS<br />BY ASTEL-COM",
    },
    {
      selector: ".about-hero__title",
      en: "ABOUT<br />THE COMPANY",
    },
    {
      selector: '.card[href*="category=pos"] .card__title',
      replaceText: ["АКСЕСУАРИ ДЛЯ", "БАНКІВСЬКИХ ТЕРМІНАЛІВ"],
      withText: ["ACCESSORIES FOR", "BANK TERMINALS"],
    },
    {
      selector: '.card[href*="category=cables"] .card__title',
      replaceText: ["КАБЕЛІ НИЗКОВОЛЬТНОГО", "ЖИВЛЕННЯ"],
      withText: ["LOW-VOLTAGE", "POWER CABLES"],
    },
    {
      selector: ".app-card:nth-child(4) .app-card__title",
      en: "Industrial<br />Automation",
    },
    {
      selector: '.sidebar__link[data-target="pos"] span:first-child',
      en: "ACCESSORIES FOR<br />BANK TERMINALS",
    },
    {
      selector: '.sidebar__link[data-target="cables"] span:first-child',
      en: "LOW-VOLTAGE<br />POWER CABLES",
    },
  ];

  // Ukrainian month names for order history dates
  const UA_MONTHS = {
    січня: "January",
    лютого: "February",
    березня: "March",
    квітня: "April",
    травня: "May",
    червня: "June",
    липня: "July",
    серпня: "August",
    вересня: "September",
    жовтня: "October",
    листопада: "November",
    грудня: "December",
  };

  // 4. Pattern-based dynamic strings
  const PATTERN_RULES = [
    { regex: /^1\s+товар$/, replace: "1 product" },
    { regex: /^(\d+)\s+товар(ів|и)$/, replace: "$1 products" },
    { regex: /^1\s+замовлення$/, replace: "1 order" },
    { regex: /^(\d+)\s+замовлень$/, replace: "$1 orders" },
    { regex: /^1\s+файли?$/, replace: "1 file" },
    { regex: /^(\d+)\s+файл(ів|и)$/, replace: "$1 files" },
    { regex: /^від\s+([\d\s]+₴)$/, replace: "from $1" },
    {
      regex: /^Мін\.\s*замовлення:\s*(\d+)\s*шт\.$/,
      replace: "Min. order: $1 pcs.",
    },
    {
      regex: /^Мінімальне замовлення\s*—\s*(\d+)\s*шт\.$/,
      replace: "Minimum order — $1 pcs.",
    },
    { regex: /^Замовлення\s+#(.+)$/, replace: "Order #$1" },
    {
      regex: /^від\s+(\d{1,2})\s+([а-яіїєґ]+)\s+(\d{4})\s*р\.?$/i,
      replace: (_, day, monthUkr, year) => {
        const m = UA_MONTHS[monthUkr.toLowerCase()] || monthUkr;
        return `from ${m} ${day}, ${year}`;
      },
    },
    {
      regex: /^Повторити замовлення\s+#([^\s]+)\s+\((.+)\)$/,
      replace: "Repeat Order #$1 ($2)",
    },
    {
      regex:
        /^У замовленні\s+(\d+)\s+поз\.\s+—\s+натисніть, щоб миттєво скопіювати всі товари в кошик\.$/,
      replace: "$1 items in order — click to copy all items to your cart.",
    },
    { regex: /^(\d+)\s*шт\.\s*×\s*(.+)$/, replace: "$1 pcs × $2" },
    {
      regex: /^Додано в кошик:\s*(.+)\s*\(\+(\d+)\s*шт\.\)$/,
      replace: "Added to cart: $1 (+$2 pcs)",
    },
    { regex: /^●\s*Авторизовано\s*\((.+)\)$/, replace: "● Authorized ($1)" },
    {
      regex: /^Дякуємо за замовлення,\s*(.+)$/,
      replace: "Thank you for your order, $1",
    },
    { regex: /^Фото\s+(\d+)$/, replace: "Photo $1" },
    // PDF & Document Titles (Matches "Паспорт модему", "Паспорт NBIoT-модему", "Паспорт COM-900-ITR...", etc.)
    {
      regex: /^Керівництво з монтажу та експлуатації\s+(?:модему\s+)?(.+)$/i,
      replace: "Installation & Operation Manual — $1",
    },
    {
      regex: /^Паспорт\s+(?:(?:NBIoT-)?модему[_\s]*)?(.+)$/i,
      replace: "Technical Datasheet (Passport) — $1",
    },
    {
      regex:
        /^Незабаром буде доступне керівництво з монтажу та експлуатації\s+(?:модему\s+)?(.+)$/i,
      replace: "Installation & Operation Manual coming soon — $1",
    },
    {
      regex: /^(.+)\s+—\s+АСТЕЛ-КОМ$/,
      replace: (_, title) => `${TEXT_MAP[norm(title)] || title} — ASTEL-COM`,
    },
  ];

  // 5. Fallback Substring Replacer for Delivery Addresses & Any Remaining Compound Values
  const SUBSTRING_REPLACEMENTS = [
    ["м. Київ", "Kyiv"],
    ["Нова Пошта", "Nova Poshta"],
    ["Укрпошта", "Ukrposhta"],
    ["Відділення №", "Branch #"],
    ["Поштомат №", "Parcel Locker #"],
    ["вул. Машинобудівна", "Mashynobudivna St"],
    ["вул. Пирогівський шлях", "Pyrohivskyi Shliakh St"],
    ["не більше", "max"],
    ["шт.", "pcs"],
    ["1,8 В", "1.8 V"],
    ["3,0 В", "3.0 V"],
  ];

  function translateSingleChunk(chunk) {
    if (!chunk) return chunk;
    const key = norm(chunk);
    if (!key) return chunk;

    const lead = chunk.match(/^\s*/)[0];
    const trail = chunk.match(/\s*$/)[0];

    if (TEXT_MAP[key]) {
      return lead + TEXT_MAP[key] + trail;
    }

    for (const rule of PATTERN_RULES) {
      if (rule.regex.test(key)) {
        return lead + key.replace(rule.regex, rule.replace) + trail;
      }
    }

    if (/[а-яіїєґА-ЯІЇЄҐ]/.test(chunk)) {
      let out = chunk;
      for (const [uk, en] of SUBSTRING_REPLACEMENTS) {
        if (out.includes(uk)) {
          out = out.split(uk).join(en);
        }
      }
      return out;
    }

    return chunk;
  }

  function translateNodeString(rawStr, preserveNewlines) {
    if (!rawStr) return rawStr;
    // Try matching the entire string first (handles formatted HTML paragraphs)
    const fullKey = norm(rawStr);
    if (TEXT_MAP[fullKey]) {
      const lead = rawStr.match(/^\s*/)[0];
      const trail = rawStr.match(/\s*$/)[0];
      return lead + TEXT_MAP[fullKey] + trail;
    }

    // For multi-line spec table cells (<td> with \n), translate each line individually to preserve \n
    if (preserveNewlines && rawStr.includes("\n")) {
      return rawStr
        .split("\n")
        .map((line) => translateSingleChunk(line))
        .join("\n");
    }

    return translateSingleChunk(rawStr);
  }

  const originalNodeText = new WeakMap();
  const originalElementHtml = new WeakMap();
  const originalAttrs = new WeakMap();
  let observer = null;

  function getLang() {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "uk";
  }

  function translateTextNodes(root, lang) {
    if (!root) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
      false,
    );

    let node;
    while ((node = walker.nextNode())) {
      if (!originalNodeText.has(node)) {
        originalNodeText.set(node, node.nodeValue);
      }
      const baseUkr = originalNodeText.get(node);
      const isSpecCell =
        node.parentElement && node.parentElement.tagName === "TD";
      const targetVal =
        lang === "en" ? translateNodeString(baseUkr, isSpecCell) : baseUkr;
      if (node.nodeValue !== targetVal) {
        node.nodeValue = targetVal;
      }
    }
  }

  function translateAttributes(root, lang) {
    if (!root || !root.querySelectorAll) return;
    const elements = root.querySelectorAll(
      "[placeholder], [aria-label], [title], [alt]",
    );

    elements.forEach((el) => {
      if (!originalAttrs.has(el)) {
        originalAttrs.set(el, {
          placeholder: el.getAttribute("placeholder"),
          "aria-label": el.getAttribute("aria-label"),
          title: el.getAttribute("title"),
          alt: el.getAttribute("alt"),
        });
      }
      const saved = originalAttrs.get(el);

      ["placeholder", "aria-label", "title", "alt"].forEach((attr) => {
        const baseVal = saved[attr];
        if (!baseVal) return;
        const cleanKey = norm(baseVal);

        if (lang === "en") {
          const mapped =
            ATTR_MAP[cleanKey] ||
            TEXT_MAP[cleanKey] ||
            translateSingleChunk(cleanKey);
          if (el.getAttribute(attr) !== mapped) {
            el.setAttribute(attr, mapped);
          }
        } else {
          if (el.getAttribute(attr) !== baseVal) {
            el.setAttribute(attr, baseVal);
          }
        }
      });
    });
  }

  function translateSpecialHtmlBlocks(lang) {
    HTML_SELECTOR_MAP.forEach((item) => {
      document.querySelectorAll(item.selector).forEach((el) => {
        if (!originalElementHtml.has(el)) {
          originalElementHtml.set(el, el.innerHTML);
        }
        const baseHtml = originalElementHtml.get(el);

        let targetHtml = baseHtml;
        if (lang === "en") {
          if (item.en) {
            targetHtml = item.en;
          } else if (item.replaceText && item.withText) {
            item.replaceText.forEach((ukPart, idx) => {
              targetHtml = targetHtml.replace(ukPart, item.withText[idx]);
            });
          }
        }
        if (el.innerHTML !== targetHtml) {
          el.innerHTML = targetHtml;
        }
      });
    });
  }

  function updateHeaderLangUI(lang) {
    const label = lang === "en" ? "EN" : "UA";
    document.documentElement.lang = lang === "en" ? "en" : "uk";

    document.querySelectorAll(".header__lang-trigger").forEach((trigger) => {
      const firstNode = Array.from(trigger.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim().length > 0,
      );
      if (firstNode) {
        const nextText = ` ${label} `;
        if (firstNode.nodeValue !== nextText) {
          firstNode.nodeValue = nextText;
        }
      }
    });

    document.querySelectorAll(".header__lang-link").forEach((link) => {
      const code = link.textContent.trim().toLowerCase();
      const isCurrent =
        (code === "en" && lang === "en") || (code === "ua" && lang === "uk");
      link.style.fontWeight = isCurrent ? "700" : "400";
    });
  }

  function applyLanguage(lang) {
    if (observer) observer.disconnect();

    try {
      updateHeaderLangUI(lang);

      if (!document._origTitle) {
        document._origTitle = document.title;
      }
      document.title =
        lang === "en"
          ? translateSingleChunk(document._origTitle)
          : document._origTitle;

      translateSpecialHtmlBlocks(lang);
      translateTextNodes(document.body, lang);
      translateAttributes(document.body, lang);
    } finally {
      if (observer && document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  }

  function setLang(langCode) {
    const normalized =
      langCode && langCode.toLowerCase() === "en" ? "en" : "uk";
    localStorage.setItem(LANG_KEY, normalized);
    applyLanguage(normalized);
  }

  function bindHeaderLangSwitcher() {
    document.querySelectorAll(".header__lang").forEach((langWrap) => {
      const trigger = langWrap.querySelector(".header__lang-trigger");
      if (trigger && !trigger._i18nBound) {
        trigger._i18nBound = true;
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          langWrap.classList.toggle("is-open");
        });
      }

      langWrap.querySelectorAll(".header__lang-link").forEach((link) => {
        if (link._i18nBound) return;
        link._i18nBound = true;
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const chosen = link.textContent.trim().toUpperCase();
          langWrap.classList.remove("is-open");
          setLang(chosen === "EN" ? "en" : "uk");
        });
      });
    });

    if (!document._i18nDocClickBound) {
      document._i18nDocClickBound = true;
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".header__lang")) {
          document
            .querySelectorAll(".header__lang.is-open")
            .forEach((el) => el.classList.remove("is-open"));
        }
      });
    }
  }

  function initI18n() {
    bindHeaderLangSwitcher();
    applyLanguage(getLang());

    if (!observer) {
      observer = new MutationObserver((mutations) => {
        if (getLang() !== "en") return;
        observer.disconnect();
        try {
          mutations.forEach((m) => {
            m.addedNodes.forEach((added) => {
              if (added.nodeType === Node.ELEMENT_NODE) {
                translateTextNodes(added, "en");
                translateAttributes(added, "en");
              } else if (
                added.nodeType === Node.TEXT_NODE &&
                added.parentElement
              ) {
                translateTextNodes(added.parentElement, "en");
              }
            });
          });
        } finally {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initI18n);
  } else {
    initI18n();
  }

  return {
    getLang,
    setLang,
    applyLanguage,
  };
})();
