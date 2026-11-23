const PRODUCTS_DATA = {
  "com-900-485": {
    id: "com-900-485",
    category: "gsm",
    categoryName: "GSM/LTE-модеми",
    title: "Універсальний GSM/GPRS-модем СОМ-900/485",
    price: "4 300 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_СОМ-900-485.png",
    images: [
      "assets/images/items/СОМ-900-485.png",
      "assets/images/items/СОМ-900-485(2).png",
    ],
    description: [
      "Компанія ТОВ «Астел-ком» пропонує GPRS/LTE-модем власної розробки та виробництва СОМ-900-485-4G.",
      "COM-900/485 ― це ультракомпактний, економічний, дводіапазонний інтелектуальний промисловий GSM/GPRS/LTE модем (термінал). Модем СОМ-900-485-4G оснащений двома незалежними портами RS232, двома незалежними портами RS485 та двома слотами для SIM-карт, що робить його унікальним пристроєм для М2М додатків, де потрібна надійна бездротова передача даних.",
      "Ультракомпактність — модем СОМ-900-485-4G виконаний у міцному металевому корпусі з розмірами всього 63×15×60 мм, що дозволяє застосовувати даний модем у жорстких умовах експлуатації.",
      "Економічність ― модем СОМ-900-485-4G є відмінною альтернативою існуючим імпортним моделям з послідовним портом, завдяки низькій ціні, технічній підтримці та розширеній гарантії.",
      "Інтелектуальність — модем створений на базі радіомодуля А7672Е компанії SIMCOM, що містить внутрішній потужний процесор, для якого існує безліч стандартних та кастомізованих додатків («прошивок»). Величезний досвід у розробці програмного забезпечення (ПЗ) для GPRS-модемів дозволяє розробникам СОМ-900-485-4G створювати «прошивки» для роботи модему практично в будь-яких застосуваннях: АСКОЕ, промислова телеметрія, лічильники газу, тепла, води тощо, торговельні та платіжні термінали.",
      "Промисловість — наявність двох СОМ-портів, двох портів RS485 та оригінального ПЗ дозволяє успішно підключати модем СОМ-900-485-4G до різних типів приладів обліку електроенергії, тепла, води та газу.",
      "Оригінальне базове програмне забезпечення модему СОМ-900/485 забезпечує підтримку безперервної роботи з двома SIM-картами. Зовнішній контролер (супервізор) на платі модему постійно моніторить працездатність радіомодуля і, у разі його «зависання», перезавантажує його. Можна сказати, що СОМ-900/485 — це модем, який ніколи не зависає.",
      "При виробництві модему СОМ-900-485-4G ми прагнемо максимально використовувати вітчизняні компоненти та комплектуючі: друкована плата, корпус, кріплення та серце модему ― оригінальне програмне забезпечення українських інженерів.",
    ],
    techSpecs: [
      { label: "Стандарт зв’язку", value: "GSM, LTE-TDD, LTE-FDD" },
      {
        label: "Частотний діапазон, МГц",
        value:
          "GSM 900/1800, LTE900 (B8), LTE1800 (B3), LTE2100 (B1), LTE2600 (B7)",
      },
      { label: "Технологія передачі даних", value: "GPRS, SMS, CSD, LTE" },
      { label: "Джерело живлення, В", value: "6…28 VDC" },
      {
        label: "Струм живлення",
        value: "У режимі передачі даних не більше 200 мА (живлення 12 В)",
      },
      {
        label: "Потужність при передачі",
        value:
          "GSM850/900: 4 (33dBm±2dB)\nDCS1800/PCS1900: 1 (30dBm±2dB)\nEDGE GSM850/900: E2 (27dBm±3dB)\nEDGE DCS1800/PCS1900: E1 (26dBm+3dB/-4dB)\nLTE: 3 (23dBm±2.7dB)",
      },
      {
        label: "Наявність індикації",
        value:
          "Світлова індикація: живлення, передачі даних, реєстрації у мережі 2G/4G, рівня покриття мережі",
      },
      {
        label: "Інтерфейсний модуль",
        value:
          "Інтерфейс RS485 — 1 шт.\nІнтерфейс USB — 1 шт.\nВбудований SIM-рідер — 1 шт.\nРоз’єм для антени SMA-f — 1 шт.",
      },
      {
        label: "Кількість слотів для SIM-карти",
        value: "Один — за замовчуванням, два — опція",
      },
      { label: "Типи підтримуваних SIM-карт", value: "1,8 В; 3,0 В" },
      {
        label: "Програмні модулі та протоколи",
        value:
          "Встановлення пріоритетного номера; Локальне та дистанційне програмування; Підтримка TCP/IP та статичних IP-адрес; Стандартні AT-команди (GSM07.05 і 07.07); APN з авторизацією; Автоматичне перезавантаження та вхід в мережу; Автоматичне управління якістю сеансу зв'язку",
      },
      { label: "Робоча температура", value: "-10°C...+40°C" },
      {
        label: "Габаритні розміри, мм",
        value: "85 × 90 × 15 (корпус 63 × 15 × 60)",
      },
      { label: "Вага без антени і БЖ, г", value: "не більше 100" },
    ],
    generalSpecs: [
      { label: "Виробник", value: "Астел-Ком" },
      { label: "Країна виробник", value: "Україна" },
      { label: "Тип", value: "GSM / 3G / 4G" },
      { label: "Форм-фактор", value: "Внутрішній" },
      { label: "Стандарт", value: "LTE, GPRS, EDGE" },
      { label: "Інтерфейси", value: "RS232 (2 шт.), RS485, USB (1 шт.)" },
      { label: "Кількість SIM-карт", value: "2 шт." },
      { label: "Вихід під зовнішню антену", value: "Так" },
      { label: "Слот для карт пам'яті microSD", value: "Ні" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [
      {
        title:
          "Керівництво з монтажу та експлуатації модему СОМ-900-485-4G.pdf",
        titleEn: "Installation & Operation Manual — COM-900/485 (Ukrainian PDF)",
        url: "assets/downloads/kerivnitstvo_z_montazhu_t__modemu_som_900_485_4g.pdf",
        download: "Керівництво_СОМ-900-485-4G.pdf",
      },
      {
        title: "Паспорт модему СОМ-900-485-4G_new.pdf",
        titleEn: "Technical Datasheet — COM-900/485 (Ukrainian PDF)",
        url: "assets/downloads/pasport_modemu_som_900_485_4g_new.pdf",
        download: "Паспорт_СОМ-900-485-4G.pdf",
      },
    ],
  },

  "com-900-itr-4g": {
    id: "com-900-itr-4g",
    category: "gsm",
    categoryName: "GSM/LTE-модеми",
    title:
      "GSM/LTE-модем СОМ-900-ITR-4G для роботи з лічильниками ITRON (ACTARIS)",
    price: "4 300 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_СОМ-900-ITR-4G.png",
    images: [
      "assets/images/items/СОМ-900-ITR-4G.png",
      "assets/images/items/СОМ-900-ITR-4G(2).png",
    ],
    description: [
      "Модем COM-900-ITR-4G — модем нового покоління. Він працює в діапазонах 2G (GPRS) і 4G (LTE), а також підтримує передачу даних CSD. Призначений для використання в автоматизованих системах дистанційного зчитування даних із використанням мережі GSM.",
      "Модем застосовується для передачі показань лічильників електроенергії, тепла, газу, води тощо. Зокрема, модем адаптований для передачі показань від лічильників електроенергії ITRON (ACTARIS) і живиться за інтерфейсним кабелем безпосередньо від лічильника.",
      "У модемі реалізовані контролі живучості: апаратний та програмний при проблемах із GSM та GPRS/LTE з'єднанням, програмний — при проблемах з TCP-з'єднанням.",
      "Конструктивно модем виконаний у компактному міцному металевому корпусі. Підключається до лічильника за інтерфейсом RS-485. Порт USB використовується для програмування та конфігурації. Модем також може живитися від зовнішнього блока живлення 6…28 VDC (є захист від переполюсування живлення).",
      "Для надійного забезпечення каналу зв'язку можлива робота модему із двома SIM-картами різних операторів з автоматичним перемиканням між ними.",
      "Підтримується дистанційне програмування (по мережі GPRS/LTE або через SMS), віддалене оновлення прошивки та система автоматичного перезапуску «WatchDog» (при зависанні або за розкладом).",
    ],
    techSpecs: [
      { label: "Стандарт зв’язку", value: "GSM, LTE-TDD, LTE-FDD" },
      {
        label: "Частотний діапазон, МГц",
        value:
          "GSM 900/1800, LTE900 (B8), LTE1800 (B3), LTE2100 (B1), LTE2600 (B7)",
      },
      { label: "Технологія передачі даних", value: "GPRS, SMS, CSD, LTE" },
      { label: "Джерело живлення, В", value: "6…28 VDC" },
      {
        label: "Струм живлення",
        value: "У режимі передачі даних не більше 200 мА (живлення 12 В)",
      },
      {
        label: "Потужність при передачі",
        value:
          "GSM850/900: 4 (33dBm±2dB)\nDCS1800/PCS1900: 1 (30dBm±2dB)\nEDGE GSM850/900: E2 (27dBm±3dB)\nEDGE DCS1800/PCS1900: E1 (26dBm+3dB/-4dB)\nLTE: 3 (23dBm±2.7dB)",
      },
      {
        label: "Наявність індикації",
        value:
          "Світлова індикація: живлення, передачі даних, реєстрації у мережі 2G/4G, рівня покриття мережі",
      },
      {
        label: "Інтерфейсний модуль",
        value:
          "Інтерфейс RS485 — 1 шт.\nІнтерфейс USB — 1 шт.\nВбудований SIM-рідер — 1 шт.\nРоз’єм для антени SMA-f — 1 шт.",
      },
      {
        label: "Кількість слотів для SIM-карти",
        value: "Один — за замовчуванням, два — опція",
      },
      { label: "Типи підтримуваних SIM-карт", value: "1,8 В; 3,0 В" },
      {
        label: "Програмні модулі та протоколи",
        value:
          "Встановлення пріоритетного номера; Локальне та дистанційне програмування; Підтримка TCP/IP та статичних IP-адрес; Стандартні AT-команди (GSM07.05 і 07.07); APN з авторизацією; Автоматичне перезавантаження (WatchDog) та вхід в мережу",
      },
      { label: "Робоча температура", value: "-10°C...+40°C" },
      { label: "Габаритні розміри, мм", value: "85 × 90 × 15" },
      { label: "Вага без антени і БЖ, г", value: "не більше 100" },
    ],
    generalSpecs: [
      { label: "Виробник", value: "Астел-Ком" },
      { label: "Країна виробник", value: "Україна" },
      { label: "Тип", value: "3G/4G" },
      { label: "Форм-фактор", value: "Внутрішній" },
      { label: "Стандарт", value: "LTE, GPRS, EDGE" },
      { label: "Інтерфейси", value: "RS485, USB (1 шт.)" },
      { label: "Вихід під зовнішню антену", value: "Так" },
      { label: "Слот для карт пам'яті microSD", value: "Ні" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [
      // {
      //   title: "Драйвер для підключення модему до комп'ютера (Google Drive)",
      //   url: "https://drive.google.com/drive/folders/1q9sgd73QvcjcMYumlP0hoZdJ9QtkWSIF?usp=drive_link",
      // },
      {
        title:
          "Незабаром буде доступне керівництво з монтажу та експлуатації модему СОМ-900-ITR-4G.pdf",
        titleEn: "Installation & Operation Manual — COM-900-ITR-4G (coming soon)",
        url: "#",
        download: "Керівництво_СОМ-900-ITR-4G.pdf",
      },
    ],
  },

  "com-900-psg-4g": {
    id: "com-900-psg-4g",
    category: "gsm",
    categoryName: "GSM/LTE-модеми",
    title: "GSM/LTE-модем СОМ-900-PSG-4G (для лічильників GAMA)",
    price: "від 4 300 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_СОМ-900-PSG-4G.png",
    images: [
      "assets/images/items/СОМ-900-PSG-4G.png",
      "assets/images/items/СОМ-900-PSG-4G(2).png",
      "assets/images/items/СОМ-900-PSG-4G(3).png",
    ],
    description: [
      "Модем COM-900-PSG-4G працює в діапазонах 2G (GPRS) і 4G (LTE), а також підтримує передачу даних CSD. Призначений для використання в автоматизованих системах дистанційного зчитування даних із використанням мережі GSM/LTE.",
      "Зокрема, модем адаптований для передачі показань від лічильників електроенергії GAMA (ELGAMA). Підключається до RS-485 порту лічильника простим дводротовим кабелем. Містить вбудований блок живлення від мережі 220 В. Конструкція корпусу дозволяє легко кріпити його під клемною кришкою лічильника GAMA.",
      "У модемі реалізовані апаратний та програмний контролі живучості при проблемах із GSM, GPRS/LTE та TCP-з'єднанням.",
      "Конструктивно модем виконано у компактному міцному пластиковому корпусі. Порт USB використовується для програмування та конфігурації.",
      "Можлива робота з 2-ма SIM-картками різних операторів з автоматичним перемиканням між ними, а також дистанційне програмування та оновлення прошивки по мережі GPRS/LTE або через SMS.",
    ],
    techSpecs: [
      { label: "Стандарт зв’язку", value: "GSM, LTE-TDD, LTE-FDD" },
      {
        label: "Частотний діапазон, МГц",
        value:
          "GSM 900/1800, LTE900 (B8), LTE1800 (B3), LTE2100 (B1), LTE2600 (B7)",
      },
      { label: "Технологія передачі даних", value: "GPRS, SMS, CSD, LTE" },
      { label: "Джерело живлення, В", value: "85…305 VAC; 120…430 VDC" },
      {
        label: "Струм живлення",
        value: "У режимі передачі даних не більше 10 мА (живлення 220 VAC)",
      },
      {
        label: "Потужність при передачі",
        value:
          "GSM850/900: 4 (33dBm±2dB)\nDCS1800/PCS1900: 1 (30dBm±2dB)\nEDGE GSM850/900: E2 (27dBm±3dB)\nEDGE DCS1800/PCS1900: E1 (26dBm+3dB/-4dB)\nLTE: 3 (23dBm±2.7dB)",
      },
      {
        label: "Наявність індикації",
        value:
          "Світлова індикація роботи комунікаційного модуля та передачі даних",
      },
      {
        label: "Інтерфейсний модуль",
        value:
          "Інтерфейс RS485 — 1 шт.\nІнтерфейс USB — 1 шт.\nВбудований SIM-рідер — 1 шт.\nРоз’єм для антени SMA-f — 1 шт.",
      },
      {
        label: "Кількість слотів для SIM-карти",
        value: "Один — за замовчуванням, два — опція",
      },
      { label: "Типи підтримуваних SIM-карт", value: "1,8 В; 3,0 В" },
      {
        label: "Програмні модулі та протоколи",
        value:
          "Встановлення пріоритетного номера; Локальне та дистанційне програмування; Підтримка TCP/IP та статичних IP-адрес; Стандартні AT-команди (GSM07.05 і 07.07); APN з авторизацією; Автоматичне перезавантаження та вхід в мережу",
      },
      { label: "Робоча температура", value: "-10°C...+40°C" },
      { label: "Габаритні розміри, мм", value: "105 × 63 × 30" },
      { label: "Вага без антени і БЖ, г", value: "не більше 100" },
    ],
    generalSpecs: [
      { label: "Виробник", value: "Астел-Ком" },
      { label: "Країна виробник", value: "Україна" },
      { label: "Тип", value: "3G/4G" },
      { label: "Форм-фактор", value: "Внутрішній" },
      { label: "Стандарт", value: "LTE, GPRS, EDGE" },
      { label: "USB-порт", value: "Так (1 шт.)" },
      { label: "Вихід під зовнішню антену", value: "Так" },
      { label: "Слот для карт пам'яті microSD", value: "Ні" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [
      {
        title:
          "Керівництво з монтажу та експлуатації модему СОМ-900-PSG-4G.pdf",
        titleEn: "Installation & Operation Manual — COM-900-PSG-4G (Ukrainian PDF)",
        url: "assets/downloads/kerivnitstvo_z_montazhu_t__modemu_som_900_psg_4g.pdf",
        download: "Керівництво_СОМ-900-PSG-4G.pdf",
      },
      // {
      //   title: "Драйвер для підключення модему до комп'ютера (Google Drive)",
      //   url: "https://drive.google.com/drive/folders/1q9sgd73QvcjcMYumlP0hoZdJ9QtkWSIF?usp=sharing",
      // },
    ],
  },

  "com-900-itr-rev-b": {
    id: "com-900-itr-rev-b",
    category: "gsm",
    categoryName: "GSM/LTE-модеми",
    title:
      "GSM/GPRS-модем СОМ-900-ITR rev.B для роботи з лічильниками ITRON (ACTARIS)",
    price: "4 900 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: false,
    stockText: "Немає в наявності",
    saleTerms: "Оптом і в роздріб",
    saleTermsCode: "retail",
    minOrderQty: 1,
    minOrder: "",
    image: "assets/images/items/mini_СОМ-900-ITR-rev-B.png",
    images: [
      "assets/images/items/СОМ-900-ITR-rev-B.png",
      "assets/images/items/СОМ-900-ITR-rev-B(2).png",
    ],
    description: [
      "Модем COM-900-ITR rev.B призначений для використання в автоматизованих системах дистанційного зчитування даних з використанням мережі GSM. Адаптований для передачі показань від лічильників електроенергії ITRON (ACTARIS).",
      "Підключається до RS-485 порту лічильника простим кабелем типу «патч-корд», яким також отримує живлення від лічильника. Містить Li-ion акумулятор для буферизації живлення та передачі повідомлення при зникненні змінної напруги. Оснащений світлодіодом індикації якості сигналу. Конструкція корпусу дозволяє легко кріпити модем на клемній кришці лічильника.",
      "Реалізовані апаратний та програмний контролі живучості при проблемах із GSM/GPRS та TCP-з'єднанням.",
      "Виконаний у компактному міцному пластиковому корпусі. Підтримує роботу з 2-ма SIM-картками різних операторів з автоматичним перемиканням, а також дистанційне програмування та оновлення прошивки по GPRS або SMS.",
    ],
    techSpecs: [
      { label: "Частотний діапазон, МГц", value: "GSM 900/1800" },
      { label: "Передача даних", value: "GPRS клас 12, SMS, USSD, CSD, FAX" },
      { label: "Діапазон живлення, В", value: "6…28" },
      { label: "Інтерфейси", value: "SIM, USB, RS-485" },
      { label: "Струм споживання", value: "70 мА (12 В) / 35 мА (24 В)" },
      { label: "Діапазон робочих температур", value: "-40°C...+85°C" },
      { label: "Розміри, мм", value: "63 × 34 × 95" },
      { label: "Вага, г", value: "120" },
    ],
    generalSpecs: [
      { label: "Виробник", value: "Астел-Ком" },
      { label: "Країна виробник", value: "Україна" },
      { label: "Тип", value: "GSM" },
      { label: "Форм-фактор", value: "Внутрішній" },
      { label: "Кількість SIM-карт", value: "2 шт." },
      { label: "Інтерфейси", value: "RS232 (2 шт.), RS485, USB" },
    ],
    docs: [
      {
        title:
          "Керівництво з монтажу та експлуатації модему COM-900-ITR-rev.B_укр.pdf",
        titleEn: "Installation & Operation Manual — COM-900-ITR rev.B (Ukrainian PDF)",
        url: "assets/downloads/kerivnitstvo_z_montazhu_t__com_900_itr_rev.b_ukr.pdf",
        download: "Керівництво_COM-900-ITR-rev.B_укр.pdf",
      },
      {
        title: "Паспорт COM-900-ITR rev.B_укр.pdf",
        titleEn: "Technical Datasheet — COM-900-ITR rev.B (Ukrainian PDF)",
        url: "assets/downloads/pasport_com_900_itr_rev.b_ukr.pdf",
        download: "Паспорт_COM-900-ITR-rev.B_укр.pdf",
      },
      // {
      //   title: "Драйвер для підключення модему до комп'ютера (Google Drive)",
      //   url: "https://drive.google.com/file/d/1JBDeT-JS19cQ2wMgbSH9fdD4cftc-B6T/view?usp=sharing",
      // },
    ],
  },

  "com-900-nbi-int": {
    id: "com-900-nbi-int",
    category: "nbiot",
    categoryName: "NBIoT-модеми",
    title: "NBIoT-модем СОМ-900-NBI-int для роботи з теплолічильниками",
    price: "8 064 ₴",
    vatNote: "Ціна вказана без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_СОМ-900-NBI-int.png",
    images: ["assets/images/items/СОМ-900-NBI-int.png"],
    description: [
      "NBIoT-модем COM-900-NBI-int призначений для використання в автоматизованих системах дистанційного зчитування даних із використанням стільникової мережі NBIoT. Завдяки оригінальному дизайну (технологія OpenCPU, відсутність зовнішнього процесора, використання суперконденсатора) модем має екстремально низьке споживання і здатний працювати автономно до декількох років без заміни батареї.",
      "Виробляється в безкорпусному виконанні («int» — internal) для встановлення всередині теплових лічильників як вбудований модуль зв'язку. Адаптований для роботи з лічильниками тепла Multical 66, Multical 601/602, Multical 603, SKS-3, Ultraheat T550/UH50, Ultraheat TB-07-K7. У лічильники Multical 66 та 601/602 встановлюється як штатний модуль «низа» разом із батареєю розміру 14500 без додаткових перетворювачів інтерфейсу.",
      "Модем періодично за розкладом ініціює з'єднання з центром збору даних (клієнтський режим, підтримується ПЗ «ЕнергоЦентр»), передає інформацію та переходить у режим сну. Також може конфігуруватися в класичному серверному режимі із зовнішнім блоком живлення.",
      "Ультракомпактне виконання, надмале споживання й розширений температурний діапазон (-40°C...+85°C) дозволяють широко використовувати його в рішеннях IoT, системах безпеки, екологічного моніторингу та розумних паркувальних системах.",
    ],
    techSpecs: [
      {
        label: "Частотний діапазон",
        value:
          "LTE Cat NB1: B1/B2/B3/B4/B5/B8/B12/B13/B17/B18/B19/B20/B25/B26*/B28/B66",
      },
      {
        label: "Передавання даних",
        value: "DL — 25.5 кбіт/с, UL — 62.5 кбіт/с",
      },
      { label: "Живлення (зовнішнє джерело), В", value: "2.10…3.63" },
      {
        label: "Джерело живлення",
        value: "Батарея SAFT LS14500 STD, AA, 3.6V, LiSOCl2 2600 мА·год",
      },
      {
        label: "Струм споживання (від 3.3 VDC)",
        value:
          "Передавання даних (Single Tone): не більше 344 мА\nРежим Deep Sleep: не більше 3.5 мкА",
      },
      { label: "Потужність під час передавання", value: "23dBm±2dB" },
      {
        label: "Тип інтерфейсу",
        value: "UART (2 шт.), USB 1.1 (1 шт.), USIM (1 шт.)",
      },
      {
        label: "Швидкість обміну через UART",
        value: "від 75 біт/сек до 921600 біт/сек",
      },
      {
        label: "Швидкість обміну через USB",
        value: "до 12 Мбіт/сек (для програмування)",
      },
      { label: "Тип слота та SIM-картки", value: "NanoSIM (1,8 В)" },
      {
        label: "Програмні модулі та протоколи",
        value:
          "UDP / TCP / LwM2M / MQTT / DTLS / SNTP / CoAP* / PPP* / TLS* / HTTP* / HTTPS*",
      },
      { label: "Діапазон робочих температур", value: "-40°C...+85°C" },
      { label: "Розміри, мм", value: "44 × 20 × 43" },
      { label: "Вага, г", value: "не більше 60" },
    ],
    generalSpecs: [
      { label: "Виробник", value: "Астел-Ком" },
      { label: "Країна виробник", value: "Україна" },
      { label: "Форм-фактор", value: "Внутрішній (бескорпусний)" },
      { label: "Кількість SIM-карт", value: "1 шт. (NanoSIM)" },
      { label: "Вихід під зовнішню антену", value: "Так" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [
      {
        title: "Паспорт NBIoT-модему_укр.pdf",
        titleEn: "Technical Datasheet — COM-900-NBI-int (Ukrainian PDF)",
        url: "assets/downloads/pasport_nbiot_modemu_ukr.pdf",
        download: "Паспорт_NBIoT-модему_укр.pdf",
      },
    ],
  },

  "com-900-nbi-ext": {
    id: "com-900-nbi-ext",
    category: "nbiot",
    categoryName: "NBIoT-модеми",
    title: "Зовнішній NBIoT-модем СОМ-900-NBI-ext з COM-портом",
    price: "9 360 ₴",
    vatNote: "Ціна вказана без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_СОМ-900-NBI-ext.png",
    images: [
      "assets/images/items/СОМ-900-NBI-ext.png",
      "assets/images/items/СОМ-900-NBI-ext(2).png",
      "assets/images/items/СОМ-900-NBI-ext(3).png",
    ],
    description: [
      "NBIoT-модем COM-900-NBI-ext призначений для використання в автоматизованих системах дистанційного зчитування даних у стільниковій мережі NBIoT. Завдяки технології OpenCPU та використанню суперконденсатора має наднизьке енергоспоживання і здатний працювати автономно декілька років без заміни батареї.",
      "Виробляється у зовнішньому виконанні («ext» — external): має міцний пластиковий корпус, інтерфейс RS-232 та автономне джерело живлення. Ефективно використовується як комунікаційний модуль для лічильників тепла (зокрема серії СВТУ), оскільки інтерфейс RS-232 містить лінію живлення +5 В для зовнішніх пристроїв.",
      "Модем періодично за розкладом ініціює з'єднання з центром збору даних (ПЗ «ЕнергоЦентр»), передає дані лічильника та «засинає» до наступного сеансу. Також може працювати в класичному серверному режимі АСКОЕ із зовнішнім блоком живлення.",
    ],
    techSpecs: [
      {
        label: "Частотний діапазон",
        value:
          "LTE Cat NB1: B1/B2/B3/B4/B5/B8/B12/B13/B17/B18/B19/B20/B25/B26*/B28/B66",
      },
      {
        label: "Передавання даних",
        value: "DL — 25.5 кбіт/с, UL — 62.5 кбіт/с",
      },
      { label: "Живлення (зовнішнє джерело), В", value: "2.10…3.63" },
      {
        label: "Джерело живлення",
        value:
          "Батарея ER26500 (Li-SOCl₂, 3.6 В, 6000 мА·год)\nСтандартний струм розряду: 10 мА\nТривалий (макс.): 1000 мА, Імпульсний (макс.): 2000 мА\nТемпература батареї: -55...+85°C",
      },
      {
        label: "Струм споживання (від 3.3 VDC)",
        value:
          "Передавання даних (Single Tone): не більше 344 мА\nРежим Deep Sleep: не більше 3.5 мкА",
      },
      { label: "Потужність під час передавання", value: "23dBm±2dB" },
      {
        label: "Тип інтерфейсу",
        value:
          "RS-232 з лінією живлення +5 В (1 шт.), USB 1.1 (1 шт.), USIM (1 шт.)",
      },
      {
        label: "Швидкість обміну RS-232",
        value: "від 75 біт/сек до 921600 біт/сек",
      },
      {
        label: "Швидкість обміну через USB",
        value: "до 12 Мбіт/сек (для програмування)",
      },
      { label: "Тип слота та SIM-картки", value: "NanoSIM (1,8 В)" },
      {
        label: "Програмні модулі та протоколи",
        value:
          "UDP / TCP / LwM2M / MQTT / DTLS / SNTP / CoAP* / PPP* / TLS* / HTTP* / HTTPS*",
      },
      { label: "Діапазон робочих температур", value: "-40°C...+85°C" },
      { label: "Розміри, мм", value: "98 × 64 × 33" },
      { label: "Вага без антени, г", value: "не більше 130" },
    ],
    generalSpecs: [
      { label: "Виробник", value: "Астел-Ком" },
      { label: "Країна виробник", value: "Україна" },
      { label: "Форм-фактор", value: "Зовнішній (у корпусі)" },
      { label: "Кількість SIM-карт", value: "1 шт. (NanoSIM)" },
      { label: "Вихід під зовнішню антену", value: "Так" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [
      {
        title: "Паспорт NBIoT-модему COM-900-NBI-ext.pdf",
        titleEn: "Technical Datasheet — COM-900-NBI-ext (Ukrainian PDF)",
        url: "assets/downloads/pasport_nbiot_modemu_com_900_nbi_ext.pdf",
        download: "Паспорт_NBIoT-модему_COM-900-NBI-ext.pdf",
      },
    ],
  },

  "gsm-antenna-3dbi": {
    id: "gsm-antenna-3dbi",
    category: "antenna",
    categoryName: "Антени",
    title:
      "GSM-антена 3dBi на магнітній основі з кабелем 3 метри і роз'ємом SMA",
    price: "120 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_GSM-antenna-3dBi-SMA.png",
    images: ["assets/images/items/GSM-antenna-3dBi-SMA.png"],
    description: [
      "Зовнішня герметична всеспрямована антена, яка працює на частотах 900/1800 МГц (у діапазонах 2G/4G).",
      "Характеризується високою механічною міцністю та зручним кріпленням за допомогою магнітної основи. Коефіцієнт підсилення — до 2–3 dBi, ступінь захисту — не гірший за IP54. Довжина кабелю становить 3 метри, прямий роз'єм SMA.",
    ],
    techSpecs: [
      { label: "Робочі частоти, МГц", value: "900 / 1800 (2G / 4G)" },
      { label: "Коефіцієнт підсилення", value: "2–3 dBi" },
      { label: "Тип кріплення", value: "Магнітна основа" },
      { label: "Довжина кабелю", value: "3 м" },
      { label: "Тип роз'єму", value: "SMA (прямий)" },
      { label: "Ступінь захисту", value: "IP54" },
    ],
    generalSpecs: [
      { label: "Ширина променя", value: "Всеспрямована" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "gsm-antenna-3-5dbi": {
    id: "gsm-antenna-3-5dbi",
    category: "antenna",
    categoryName: "Антени",
    title:
      "GSM-антена 3.5dBi на магнітній основі з кабелем 3 метри та кутовим роз'ємом SMA",
    price: "150 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_GSM-antenna-3.5dBi-SMA.png",
    images: ["assets/images/items/GSM-antenna-3.5dBi-SMA.png"],
    description: [
      "Зовнішня герметична всеспрямована антена, яка працює на частотах 900/1800 МГц (у діапазонах 2G/4G).",
      "Характеризується високою механічною міцністю, зручним кріпленням за допомогою магнітної основи та практичним кутовим роз'ємом SMA. Коефіцієнт підсилення — до 3.5–5 dBi, ступінь захисту — не гірший за IP54. Довжина кабелю — 3 метри.",
    ],
    techSpecs: [
      { label: "Робочі частоти, МГц", value: "900 / 1800 (2G / 4G)" },
      { label: "Коефіцієнт підсилення", value: "3.5–5 dBi" },
      { label: "Тип кріплення", value: "Магнітна основа" },
      { label: "Довжина кабелю", value: "3 м" },
      { label: "Тип роз'єму", value: "SMA (кутовий)" },
      { label: "Ступінь захисту", value: "IP54" },
    ],
    generalSpecs: [
      { label: "Ширина променя", value: "Всеспрямована" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "usb-pos-ict220": {
    id: "usb-pos-ict220",
    category: "pos",
    categoryName: "Аксесуари для банківських терміналів",
    title: "USB-кабель 3 м для PoS-терміналу Ingenico iCT220",
    price: "220 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_usb-pos-terminal.png",
    images: ["assets/images/items/usb-pos-terminal.png"],
    description: [
      "Спеціалізований інтерфейсний кабель для під'єднання банківського PoS-терміналу Ingenico iCT220 через інтерфейс USB. Довжина кабелю становить 3 метри.",
    ],
    techSpecs: [
      { label: "Сумісність", value: "Ingenico iCT220" },
      { label: "Інтерфейс", value: "USB" },
      { label: "Довжина кабелю", value: "3 м" },
    ],
    generalSpecs: [
      { label: "Призначення", value: "PoS-термінали" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "battery-iwl220": {
    id: "battery-iwl220",
    category: "pos",
    categoryName: "Аксесуари для банківських терміналів",
    title: "Акумуляторна батарея для PoS-терміналу Ingenico iWL220, iWL250",
    price: "1 160 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Оптом і в роздріб",
    saleTermsCode: "retail",
    minOrderQty: 1,
    minOrder: "",
    image: "assets/images/items/mini_battery-PoS-Ingenico-Move-2500.png",
    images: ["assets/images/items/battery-PoS-Ingenico-Move-2500.png"],
    description: [
      "Надійна акумуляторна батарея для мобільних банківських PoS-терміналів серії Ingenico iWL220, iWL250, iWL220 GPRS, iWL250 Bluetooth та iWL250 GPRS.",
    ],
    techSpecs: [
      {
        label: "Сумісність",
        value: "Ingenico iWL220, iWL250 (GPRS / Bluetooth)",
      },
      { label: "Номінальна напруга", value: "3,6 В" },
      { label: "Ємність", value: "2.2 А·год (2200 мА·год)" },
      { label: "Енергоємність", value: "7.4 Вт·год" },
    ],
    generalSpecs: [
      { label: "Призначення", value: "PoS-термінали Ingenico" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "battery-move-2500": {
    id: "battery-move-2500",
    category: "pos",
    categoryName: "Аксесуари для банківських терміналів",
    title: "Акумуляторна батарея для PoS-терміналу Ingenico Move 2500",
    price: "1 160 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: true,
    stockText: "В наявності",
    saleTerms: "Оптом і в роздріб",
    saleTermsCode: "retail",
    minOrderQty: 1,
    minOrder: "",
    image: "assets/images/items/mini_battery-PoS-Ingenico-Move-2500.png",
    images: ["assets/images/items/battery-PoS-Ingenico-Move-2500.png"],
    description: [
      "Акумуляторна батарея для мобільного банківського PoS-терміналу Ingenico Move 2500. Забезпечує тривалу автономну роботу терміналу.",
    ],
    techSpecs: [
      { label: "Сумісність", value: "Ingenico Move 2500" },
      { label: "Номінальна напруга", value: "3,6 В" },
      { label: "Ємність", value: "2200 мА·год (2.2 А·год)" },
      { label: "Енергоємність", value: "7.4 Вт·год" },
    ],
    generalSpecs: [
      { label: "Призначення", value: "PoS-термінали Ingenico" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "cable-pinpad-ict220": {
    id: "cable-pinpad-ict220",
    category: "pos",
    categoryName: "Аксесуари для банківських терміналів",
    title: "Кабель для пінпада до PoS-терміналу Ingenico iCT220",
    price: "260 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: false,
    stockText: "Немає в наявності",
    saleTerms: "Тільки оптом",
    saleTermsCode: "wholesale",
    minOrderQty: 10,
    minOrder: "Мінімальне замовлення — 10 шт.",
    image: "assets/images/items/mini_cable-PoS-Ingenico-iCT220.png",
    images: ["assets/images/items/cable-PoS-Ingenico-iCT220.png"],
    description: [
      "Кабель для підключення зовнішнього пінпада типу iPP2xx до PoS-терміналу Ingenico iCT220 по інтерфейсу USB.",
      "Кабель м'який, еластичний, міцний і стійкий до інтенсивної експлуатації. Провідники виконані з чистої міді перерізом 22AWG. На терміналі вставляється в роз'єм USB HOST, на пінпаді — у гніздо типу RJ45.",
    ],
    techSpecs: [
      {
        label: "Сумісність",
        value: "Термінал Ingenico iCT220 + пінпад серії iPP2xx",
      },
      { label: "Роз'єми", value: "USB HOST (термінал) → RJ45 (пінпад)" },
      { label: "Матеріал провідників", value: "Мідь, 22AWG" },
    ],
    generalSpecs: [
      { label: "Призначення", value: "Підключення пінпада" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "cable-dc-2-1x5-5-angled": {
    id: "cable-dc-2-1x5-5-angled",
    category: "cables",
    categoryName: "Кабелі низьковольтного живлення",
    title: "Кабель низьковольтного живлення кутовий 2,1х5,5 мм",
    price: "50 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: false,
    stockText: "Немає в наявності",
    saleTerms: "Оптом і в роздріб",
    saleTermsCode: "retail",
    minOrderQty: 1,
    minOrder: "",
    image: "assets/images/items/mini_cable-2,1х5,5.png",
    images: ["assets/images/items/cable-2,1х5,5.png"],
    description: [
      "Високоякісний кабель низьковольтного живлення (DC-кабель) з гнучким введенням і кутовим роз'ємом 2,1×5,5 мм.",
      "Провід коаксіального типу, дуже міцний та зносостійкий, розрахований на струм до 4 А, кінці дроту облуджені. Довжина кабелю — 1,5 м, довжина контактної частини — 10 мм. Широко використовується в джерелах живлення для світлодіодних (LED) освітлювальних пристроїв, систем охорони та телекомунікаційного обладнання.",
    ],
    techSpecs: [
      { label: "Розмір роз'єму", value: "2,1 × 5,5 мм (кутовий)" },
      { label: "Тип проводу", value: "Коаксіальний, облуджені кінці" },
      { label: "Максимальний струм", value: "до 4 А" },
      { label: "Довжина кабелю", value: "1,5 м" },
      { label: "Довжина контактної частини", value: "10 мм" },
    ],
    generalSpecs: [
      { label: "Тип", value: "DC-кабель живлення" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "cable-dc-1-4x3-4-angled": {
    id: "cable-dc-1-4x3-4-angled",
    category: "cables",
    categoryName: "Кабелі низьковольтного живлення",
    title: "Кабель низьковольтного живлення кутовий 1,4х3,4 мм",
    price: "50 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: false,
    stockText: "Немає в наявності",
    saleTerms: "Оптом і в роздріб",
    saleTermsCode: "retail",
    minOrderQty: 1,
    minOrder: "",
    image: "assets/images/items/mini_cable-1,4х3,4.png",
    images: ["assets/images/items/cable-1,4х3,4.png"],
    description: [
      "Високоякісний кабель низьковольтного живлення (DC-кабель) з гнучким введенням і кутовим роз'ємом 1,4×3,4 мм.",
      "Провід планарного типу з чистої міді (переріз 18AWG), дуже міцний, розрахований на струм до 4 А, кінці дроту облуджені. Довжина кабелю — 1,8 м, довжина контактної частини — 9 мм. Використовується в джерелах живлення для автомобільних пристроїв (відеореєстратори, радар-детектори) та зв'язкового обладнання.",
    ],
    techSpecs: [
      { label: "Розмір роз'єму", value: "1,4 × 3,4 мм (кутовий)" },
      {
        label: "Тип проводу",
        value: "Планарний, чиста мідь 18AWG, облуджені кінці",
      },
      { label: "Максимальний струм", value: "до 4 А" },
      { label: "Довжина кабелю", value: "1,8 м" },
      { label: "Довжина контактної частини", value: "9 мм" },
    ],
    generalSpecs: [
      { label: "Тип", value: "DC-кабель живлення" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },

  "cable-dc-2-1x5-5-straight-filter": {
    id: "cable-dc-2-1x5-5-straight-filter",
    category: "cables",
    categoryName: "Кабелі низьковольтного живлення",
    title:
      "Кабель низьковольтного живлення прямий 2,1х5,5мм з феритовим фільтром",
    price: "40 ₴",
    vatNote: "Ціна без ПДВ",
    inStock: false,
    stockText: "Немає в наявності",
    saleTerms: "Оптом і в роздріб",
    saleTermsCode: "retail",
    minOrderQty: 1,
    minOrder: "",
    image: "assets/images/items/mini_cable-2,1х5,5-with-filter.png",
    images: ["assets/images/items/cable-2,1х5,5-with-filter.png"],
    description: [
      "Високоякісний кабель низьковольтного живлення (DC-кабель) з феритовим фільтром для захисту від високочастотних завад, гнучким введенням і прямим роз'ємом 2,1×5,5 мм.",
      "Провід коаксіального типу, міцний і зносостійкий, розрахований на струм до 3 А, кінці дроту облуджені. Довжина кабелю — 1,0 м, довжина контактної частини — 9 мм. Широко застосовується в джерелах живлення для LED-освітлення, систем охорони та модемів.",
    ],
    techSpecs: [
      { label: "Розмір роз'єму", value: "2,1 × 5,5 мм (прямий)" },
      { label: "Особливість", value: "З феритовим фільтром" },
      { label: "Тип проводу", value: "Коаксіальний, облуджені кінці" },
      { label: "Максимальний струм", value: "до 3 А" },
      { label: "Довжина кабелю", value: "1,0 м" },
      { label: "Довжина контактної частини", value: "9 мм" },
    ],
    generalSpecs: [
      { label: "Тип", value: "DC-кабель живлення" },
      { label: "Стан", value: "Новий" },
    ],
    docs: [],
  },
};


// Browser-local catalog data layer. Replace with server-owned data before launch.
const CatalogManager = (() => {
  const STORAGE_KEY = 'astelkom_catalog_overrides';
  const CUSTOM_KEY = 'astelkom_catalog_custom_products';
  const DELETED_KEY = 'astelkom_catalog_deleted_products';
  const CATEGORY_KEY = 'astelkom_catalog_categories';
  const REMOVED_CATEGORIES_KEY = 'astelkom_catalog_removed_categories';
  const DEFAULT_CATEGORIES = Object.freeze({
    gsm: 'GSM/LTE-модеми', nbiot: 'NBIoT-модеми',
    pos: 'Аксесуари для банківських терміналів',
    antenna: 'Антени', cables: 'Кабелі низьковольтного живлення',
  });
  // Keep a stable object reference so existing catalog/admin modules see changes.
  const CATEGORIES = {...DEFAULT_CATEGORIES};
  const CATEGORY_EN = {gsm:'GSM/LTE Modems', nbiot:'NBIoT Modems',
    pos:'Accessories for Banking Terminals',antenna:'Antennas',cables:'Low-Voltage Power Cables'};
  const SALE_TERMS = Object.freeze({wholesale: 'Тільки оптом', retail: 'Оптом і в роздріб'});
  const base = Object.fromEntries(Object.entries(PRODUCTS_DATA).map(([id,p]) => [id, JSON.parse(JSON.stringify(p))]));
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  function validPrice(value) {
    const s=String(value).trim();
    return /^[1-9]\d{0,7}$/.test(s) && Number(s)<=99999999 ? Number(s) : null;
  }
  function validImageSource(src) {
    return typeof src === 'string' && src.length <= 400000 && (
      (/^assets\/images\/[\p{L}\p{N} _.,()\-\/]+\.(?:png|webp|jpe?g|svg)$/u.test(src) && !src.includes('..')) ||
      /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(src)
    );
  }
  function readStore(key, fallback) {
    try { const value=JSON.parse(localStorage.getItem(key)||'null'); return value && typeof value==='object' && !Array.isArray(value) ? value : fallback; }
    catch { return fallback; }
  }
  function readOverrides(){return readStore(STORAGE_KEY,{});}
  function readCustom(){return readStore(CUSTOM_KEY,{});}
  function readDeleted(){return readStore(DELETED_KEY,{});}
  function readCategories(){return readStore(CATEGORY_KEY,{});}
  function readRemovedCategories(){return readStore(REMOVED_CATEGORIES_KEY,{});}
  // Homepage category links are hard-coded, so the five built-in categories must
  // always exist, including in browsers with legacy removal markers in storage.
  const isFixedCategory = (code) => own(DEFAULT_CATEGORIES, code);
  function rebuildCategories(){
    for(const key of Object.keys(CATEGORIES)) delete CATEGORIES[key];
    Object.assign(CATEGORIES, DEFAULT_CATEGORIES);
    for(const [key,entry] of Object.entries(readCategories())) {
      if(/^cat-[a-z0-9-]{3,75}$/.test(key) && entry &&
         typeof entry.uk==='string' && entry.uk.trim().length>=2 && entry.uk.length<=80)
        CATEGORIES[key]=entry.uk.trim();
    }
  }
  function getCategoryName(code,english=false){
    if(!english) return CATEGORIES[code] || '';
    return readCategories()[code]?.en?.trim() || CATEGORY_EN[code] || CATEGORIES[code] || '';
  }
  function addCategory(uk,en=''){
    uk=String(uk||'').trim();en=String(en||'').trim();
    if(uk.length<2 || uk.length>80 || en.length<2 || en.length>80) throw new Error('Назви категорії українською та англійською: 2–80 символів');
    if(Object.values(CATEGORIES).some(name=>name.toLocaleLowerCase('uk')===uk.toLocaleLowerCase('uk')))
      throw new Error('Така категорія вже існує');
    const entries=readCategories();
    let key;
    do { key='cat-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7); }
    while(CATEGORIES[key] || entries[key]);
    entries[key]={uk,en};
    localStorage.setItem(CATEGORY_KEY,JSON.stringify(entries));
    rebuildCategories();notify('categories');return key;
  }
  function deleteCategory(code){
    if(isFixedCategory(code))
      throw new Error('Базову категорію не можна видалити: вона використовується на головній сторінці.');
    if(!CATEGORIES[code]) throw new Error('Категорію не знайдено');
    if(Object.values(PRODUCTS_DATA).some(p=>p.category===code))
      throw new Error('Категорію використовують товари. Спочатку перенесіть їх до іншої категорії і натисніть «Оновити».');
    const custom=readCategories();
    if(!own(custom,code)) throw new Error('Можна видаляти лише створені вручну категорії.');
    delete custom[code];
    localStorage.setItem(CATEGORY_KEY,JSON.stringify(custom));
    rebuildCategories();notify('categories');return true;
  }
  function validPdfSource(src) {
    return typeof src === 'string' && (src==='#' || /^idb-pdf:[a-zA-Z0-9-]{8,100}$/.test(src) ||
      /^data:application\/pdf;base64,[A-Za-z0-9+/]+={0,2}$/.test(src) ||
      (/^assets\/downloads\/[\p{L}\p{N}_.() -]+\.pdf$/u.test(src)) ||
      /^https:\/\/drive\.google\.com\/(?:file\/d\/|drive\/folders\/)[a-zA-Z0-9_-]+(?:[/?][a-zA-Z0-9_?=&.-]*)?$/.test(src));
  }
  function validDoc(doc) {
    return doc && typeof doc === 'object' &&
      typeof doc.title === 'string' && !!doc.title.trim() && doc.title.length <= 200 &&
      (typeof doc.titleEn === 'undefined' || (typeof doc.titleEn === 'string' && doc.titleEn.length <= 200)) &&
      validPdfSource(doc.url) && (doc.download===undefined || (typeof doc.download === 'string' &&
      doc.download.length <= 160 && !/[\\/\x00-\x1f]/.test(doc.download) &&
      /\.pdf$/i.test(doc.download)));
  }
  const SPEC_TYPES = Object.freeze(['tech', 'general', 'custom']);
  function validSpecSections(sections) {
    return Array.isArray(sections) && sections.length <= 8 && sections.every(section =>
      section && SPEC_TYPES.includes(section.type) &&
      (section.type!=='custom' || (typeof section.title==='string' && section.title.trim().length>=2 && section.title.length<=120 &&
        (section.titleEn===undefined || (typeof section.titleEn==='string' && section.titleEn.length<=120)))) &&
      Array.isArray(section.rows) &&
      section.rows.length >= 1 && section.rows.length <= 25 && section.rows.every(row =>
        row && typeof row.label === 'string' && !!row.label.trim() && row.label.length <= 160 &&
        typeof row.value === 'string' && !!row.value.trim() && row.value.length <= 2000 &&
        (row.labelEn===undefined || (typeof row.labelEn==='string' && row.labelEn.length<=160)) &&
        (row.valueEn===undefined || (typeof row.valueEn==='string' && row.valueEn.length<=2000))));
  }
  function validDocs(docs) {
    return Array.isArray(docs) && docs.length <= 8 && docs.every(validDoc);
  }
  function notify(id) {
    if(typeof window!=='undefined' && typeof window.dispatchEvent==='function')
      window.dispatchEvent(new CustomEvent('astel:catalog-updated',{detail:{id}}));
  }
  function decorate(p) {
    const amount=validPrice(p.numericPrice ?? String(p.price).replace(/[^\d]/g,'')) ?? 1;
    p.numericPrice=amount; p.price=amount.toLocaleString('uk-UA')+' ₴';
    p.isVisible = p.isVisible !== false;
    p.stockText=p.inStock ? 'В наявності' : 'Немає в наявності';
    p.categoryName=getCategoryName(p.category) || 'Категорія';
    p.saleTerms=SALE_TERMS[p.saleTermsCode] || SALE_TERMS.wholesale;
    p.minOrderQty=p.saleTermsCode==='retail' ? 1 : 10;
    p.minOrder=p.minOrderQty===1 ? '' : 'Мінімальне замовлення — 10 шт.';
    if(!Array.isArray(p.images)) p.images=[];
    p.images=p.images.filter(validImageSource).slice(0,12);
    if(p.images.length) p.image=p.images[0];
    else if(!validImageSource(p.image)) p.image='assets/images/logo-main.svg';
    return p;
  }
  function applyOverrides() {
    rebuildCategories();
    for(const id of Object.keys(PRODUCTS_DATA)) delete PRODUCTS_DATA[id];
    for(const [id,p] of Object.entries(base)) PRODUCTS_DATA[id]=decorate(JSON.parse(JSON.stringify(p)));
    const deleted=readDeleted();
    for(const [id,p] of Object.entries(readCustom())) {
      if(deleted[id] || own(base,id) || !p || typeof p!=='object') continue;
      if(!/^[a-z0-9-]{3,70}$/.test(id) || validPrice(p.numericPrice)==null || !CATEGORIES[p.category]) continue;
      PRODUCTS_DATA[id]=decorate({ ...p, id, title:String(p.title||'').slice(0,200),
        titleEn:String(p.titleEn||'').slice(0,200),
        description:Array.isArray(p.description) ? p.description.slice(0,20) : [],
        descriptionEn:Array.isArray(p.descriptionEn) ? p.descriptionEn.slice(0,20) : [],
        techSpecs:[], generalSpecs:[],
        specSections:validSpecSections(p.specSections) ? JSON.parse(JSON.stringify(p.specSections)) : [],
        docs:validDocs(p.docs) ? JSON.parse(JSON.stringify(p.docs)) : [] });
    }
    for(const id of Object.keys(deleted)) if(deleted[id]) delete PRODUCTS_DATA[id];
    for(const [id,ov] of Object.entries(readOverrides())) {
      const p=PRODUCTS_DATA[id]; if(!p || !ov || typeof ov!=='object') continue;
      if(typeof ov.title==='string' && ov.title.trim().length>=3 && ov.title.length<=200) p.title=ov.title.trim();
      if(typeof ov.titleEn==='string' && ov.titleEn.trim().length>=3 && ov.titleEn.length<=200 &&
         !/[А-Яа-яІіЇїЄєҐґ]/.test(ov.titleEn)) p.titleEn=ov.titleEn.trim();
      if(validPrice(ov.price)!==null) p.numericPrice=Number(ov.price);
      if(typeof ov.inStock==='boolean') p.inStock=ov.inStock;
      if(typeof ov.isVisible==='boolean') p.isVisible=ov.isVisible;
      if(CATEGORIES[ov.category]) p.category=ov.category;
      if(SALE_TERMS[ov.saleTermsCode]) p.saleTermsCode=ov.saleTermsCode;
      if(Array.isArray(ov.images) && ov.images.length<=12 && ov.images.every(validImageSource)) p.images=[...ov.images];
      if(Array.isArray(ov.description) && ov.description.every(x=>typeof x==='string')) p.description=[...ov.description];
      if(Array.isArray(ov.descriptionEn) && ov.descriptionEn.every(x=>typeof x==='string')) p.descriptionEn=[...ov.descriptionEn];
      if(Array.isArray(ov.techSpecs) && ov.techSpecs.every(r=>r&&typeof r.label==='string'&&typeof r.value==='string'))p.techSpecs=ov.techSpecs;
      if(Array.isArray(ov.generalSpecs) && ov.generalSpecs.every(r=>r&&typeof r.label==='string'&&typeof r.value==='string'))p.generalSpecs=ov.generalSpecs;
      if(validSpecSections(ov.specSections))p.specSections=ov.specSections;
      if(validDocs(ov.docs))p.docs=ov.docs;
      decorate(p);
    }
    return PRODUCTS_DATA;
  }
  function getOriginalPrice(id){ return base[id] ? validPrice(String(base[id].price).replace(/[^\d]/g,'')) : null; }
  function updateProduct(id,patch) {
    if(!own(PRODUCTS_DATA,id)) throw new Error('Невідомий товар');
    if(own(patch,'title') && (typeof patch.title!=='string' || patch.title.trim().length<3 || patch.title.length>200))
      throw new Error('Назва товару українською: від 3 до 200 символів');
    if(own(patch,'titleEn') && (typeof patch.titleEn!=='string' || patch.titleEn.trim().length<3 || patch.titleEn.length>200 || /[А-Яа-яІіЇїЄєҐґ]/.test(patch.titleEn)))
      throw new Error('Введіть назву товару англійською (3–200 символів)');
    if(own(patch,'price') && validPrice(patch.price)===null) throw new Error('Вкажіть цілу ціну від 1 до 99 999 999 грн');
    if(own(patch,'inStock') && typeof patch.inStock!=='boolean') throw new Error('Невірне значення наявності');
    if(own(patch,'isVisible') && typeof patch.isVisible!=='boolean') throw new Error('Невірне значення видимості товару');
    if(own(patch,'category') && !CATEGORIES[patch.category]) throw new Error('Невірна категорія');
    if(own(patch,'saleTermsCode') && !SALE_TERMS[patch.saleTermsCode]) throw new Error('Невірні умови продажу');
    if(own(patch,'images') && (!Array.isArray(patch.images) || !patch.images.length || patch.images.length>12 || !patch.images.every(validImageSource)))
      throw new Error('Підтримуються до 12 зображень PNG, JPG, WebP');
    if(own(patch,'specSections')&&!validSpecSections(patch.specSections))throw new Error('Некоректні таблиці характеристик');
    if(own(patch,'docs')&&!validDocs(patch.docs))throw new Error('Некоректні PDF-документи');
    for(const field of ['description','descriptionEn'])if(own(patch,field)&&(!Array.isArray(patch[field])||patch[field].length>20||patch[field].some(x=>typeof x!=='string')))throw new Error('Некоректний опис');
    const overrides=readOverrides(); overrides[id]={...(overrides[id]||{}),...patch};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(overrides));
    applyOverrides();notify(id);return PRODUCTS_DATA[id];
  }
  function addProduct(payload) {
    const title=String(payload.title||'').trim();
    const titleEn=String(payload.titleEn||'').trim();
    const id=String(payload.id||'').trim().toLowerCase();
    if(!/^[a-z0-9-]{3,70}$/.test(id) || own(PRODUCTS_DATA,id) || own(base,id)) throw new Error('Унікальний ID: 3–70 латинських літер, цифр або дефісів');
    if(title.length<3 || title.length>200) throw new Error('Назва товару: від 3 до 200 символів');
    if(titleEn.length<3 || titleEn.length>200) throw new Error('Англійська назва обов’язкова (від 3 до 200 символів)');
    if(validPrice(payload.price)===null) throw new Error('Некоректна ціна');
    if(!CATEGORIES[payload.category] || !SALE_TERMS[payload.saleTermsCode]) throw new Error('Оберіть категорію та умови продажу');
    const images=Array.isArray(payload.images) ? payload.images : [];
    if(!images.length || images.length>12 || !images.every(validImageSource)) throw new Error('Додайте принаймні одне коректне фото');
    const p={id,title,titleEn,category:payload.category,saleTermsCode:payload.saleTermsCode,
      numericPrice:Number(payload.price),inStock:payload.inStock===true,isVisible:true,
      image:images[0], images:[...images],
      description:[String(payload.description||'').trim()].filter(Boolean),
      descriptionEn:[String(payload.descriptionEn||'').trim()].filter(Boolean),
      techSpecs:[],generalSpecs:[],
      specSections:payload.specSections ?? [], docs:payload.docs ?? [], vatNote:'Ціна без ПДВ'};
    if(!validSpecSections(p.specSections)) throw new Error('Некоректні таблиці характеристик');
    if(!validDocs(p.docs)) throw new Error('Некоректні PDF-документи');
    const custom=readCustom(); custom[id]=p;
    localStorage.setItem(CUSTOM_KEY,JSON.stringify(custom));
    applyOverrides();notify(id);return PRODUCTS_DATA[id];
  }
  function deleteProduct(id) {
    if(!own(PRODUCTS_DATA,id)) throw new Error('Невідомий товар');
    const custom=readCustom(), overrides=readOverrides(), deleted=readDeleted();
    if(own(custom,id)) delete custom[id];
    else deleted[id]=true; // Keep a tombstone for built-in products after reload.
    delete overrides[id];
    localStorage.setItem(CUSTOM_KEY,JSON.stringify(custom));
    localStorage.setItem(STORAGE_KEY,JSON.stringify(overrides));
    localStorage.setItem(DELETED_KEY,JSON.stringify(deleted));
    applyOverrides();notify(id);
    return true;
  }
  function syncProductCards(root=document) {
    // Catalog cards are rendered by js/products-catalog.js from this data source.
    root.querySelectorAll('.product-card[data-product-id]').forEach(card => {
      const p=PRODUCTS_DATA[card.dataset.productId];
      if(p && p.isVisible !== false) {card.dataset.price=p.numericPrice;card.dataset.instock=String(p.inStock);card.dataset.category=p.category;}
      else card.remove();
    });
  }
  applyOverrides();
  if(typeof window!=='undefined') window.addEventListener('storage',(e)=>{
    if([STORAGE_KEY,CUSTOM_KEY,DELETED_KEY,CATEGORY_KEY,REMOVED_CATEGORIES_KEY].includes(e.key)){applyOverrides();notify('all');}
  });
  return Object.freeze({STORAGE_KEY,CUSTOM_KEY,DELETED_KEY,CATEGORY_KEY,REMOVED_CATEGORIES_KEY,
    CATEGORIES,SALE_TERMS,isFixedCategory,getCategoryName,addCategory,deleteCategory,readCategories,readRemovedCategories,validPrice,validImageSource,
    validPdfSource,validSpecSections,validDocs,readOverrides,readCustom,readDeleted,
    getOriginalPrice,applyOverrides,updateProduct,addProduct,deleteProduct,syncProductCards,
    getStorefrontProduct:(id) => PRODUCTS_DATA[id]?.isVisible === false ? null : (PRODUCTS_DATA[id] || null),
    getStorefrontProducts:() => Object.values(PRODUCTS_DATA).filter(p => p.isVisible !== false)});
})();
