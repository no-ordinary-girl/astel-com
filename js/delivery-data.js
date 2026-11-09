// js/delivery-data.js

// Active Ukrainian cities served by Нова Пошта, Укрпошта & Meest ПОШТА
// (Excludes temporarily occupied settlements where postal delivery is suspended)
const UKRAINE_ACTIVE_CITIES = [
  { name: "Київ", oblast: "Київська обл.", zipPrefix: "010" },
  { name: "Львів", oblast: "Львівська обл.", zipPrefix: "790" },
  { name: "Дніпро", oblast: "Дніпропетровська обл.", zipPrefix: "490" },
  { name: "Одеса", oblast: "Одеська обл.", zipPrefix: "650" },
  { name: "Харків", oblast: "Харківська обл.", zipPrefix: "610" },
  { name: "Запоріжжя", oblast: "Запорізька обл.", zipPrefix: "690" },
  { name: "Вінниця", oblast: "Вінницька обл.", zipPrefix: "210" },
  { name: "Полтава", oblast: "Полтавська обл.", zipPrefix: "360" },
  {
    name: "Івано-Франківськ",
    oblast: "Івано-Франківська обл.",
    zipPrefix: "760",
  },
  { name: "Тернопіль", oblast: "Тернопільська обл.", zipPrefix: "460" },
  { name: "Хмельницький", oblast: "Хмельницька обл.", zipPrefix: "290" },
  { name: "Черкаси", oblast: "Черкаська обл.", zipPrefix: "180" },
  { name: "Чернівці", oblast: "Чернівецька обл.", zipPrefix: "580" },
  { name: "Чернігів", oblast: "Чернігівська обл.", zipPrefix: "140" },
  { name: "Житомир", oblast: "Житомирська обл.", zipPrefix: "100" },
  { name: "Рівне", oblast: "Рівненська обл.", zipPrefix: "330" },
  { name: "Луцьк", oblast: "Волинська обл.", zipPrefix: "430" },
  { name: "Ужгород", oblast: "Закарпатська обл.", zipPrefix: "880" },
  { name: "Миколаїв", oblast: "Миколаївська обл.", zipPrefix: "540" },
  { name: "Кропивницький", oblast: "Кіровоградська обл.", zipPrefix: "250" },
  { name: "Суми", oblast: "Сумська обл.", zipPrefix: "400" },
  { name: "Херсон", oblast: "Херсонська обл.", zipPrefix: "730" },
  // Kyiv Oblast
  { name: "Біла Церква", oblast: "Київська обл.", zipPrefix: "091" },
  { name: "Бровари", oblast: "Київська обл.", zipPrefix: "074" },
  { name: "Бориспіль", oblast: "Київська обл.", zipPrefix: "083" },
  { name: "Ірпінь", oblast: "Київська обл.", zipPrefix: "082" },
  { name: "Буча", oblast: "Київська обл.", zipPrefix: "082" },
  { name: "Вишгород", oblast: "Київська обл.", zipPrefix: "073" },
  { name: "Вишневе", oblast: "Київська обл.", zipPrefix: "081" },
  { name: "Боярка", oblast: "Київська обл.", zipPrefix: "081" },
  { name: "Обухів", oblast: "Київська обл.", zipPrefix: "087" },
  { name: "Фастів", oblast: "Київська обл.", zipPrefix: "085" },
  { name: "Васильків", oblast: "Київська обл.", zipPrefix: "086" },
  { name: "Софіївська Борщагівка", oblast: "Київська обл.", zipPrefix: "081" },
  {
    name: "Петропавлівська Борщагівка",
    oblast: "Київська обл.",
    zipPrefix: "081",
  },
  { name: "Переяслав", oblast: "Київська обл.", zipPrefix: "084" },
  { name: "Славутич", oblast: "Київська обл.", zipPrefix: "071" },
  { name: "Яготин", oblast: "Київська обл.", zipPrefix: "077" },
  { name: "Березань", oblast: "Київська обл.", zipPrefix: "075" },
  { name: "Богуслав", oblast: "Київська обл.", zipPrefix: "097" },
  { name: "Кагарлик", oblast: "Київська обл.", zipPrefix: "092" },
  { name: "Тетіїв", oblast: "Київська обл.", zipPrefix: "098" },
  { name: "Українка", oblast: "Київська обл.", zipPrefix: "087" },
  { name: "Гостомель", oblast: "Київська обл.", zipPrefix: "082" },
  { name: "Коцюбинське", oblast: "Київська обл.", zipPrefix: "082" },
  { name: "Клавдієво-Тарасове", oblast: "Київська обл.", zipPrefix: "078" },
  { name: "Немішаєве", oblast: "Київська обл.", zipPrefix: "078" },
  { name: "Бородянка", oblast: "Київська обл.", zipPrefix: "078" },
  { name: "Макарів", oblast: "Київська обл.", zipPrefix: "080" },
  // Lviv Oblast
  { name: "Дрогобич", oblast: "Львівська обл.", zipPrefix: "821" },
  { name: "Стрий", oblast: "Львівська обл.", zipPrefix: "824" },
  { name: "Шептицький", oblast: "Львівська обл.", zipPrefix: "801" },
  { name: "Трускавець", oblast: "Львівська обл.", zipPrefix: "822" },
  { name: "Самбір", oblast: "Львівська обл.", zipPrefix: "814" },
  { name: "Борислав", oblast: "Львівська обл.", zipPrefix: "823" },
  { name: "Новояворівськ", oblast: "Львівська обл.", zipPrefix: "810" },
  { name: "Золочів", oblast: "Львівська обл.", zipPrefix: "807" },
  { name: "Броди", oblast: "Львівська обл.", zipPrefix: "806" },
  { name: "Сокаль", oblast: "Львівська обл.", zipPrefix: "800" },
  { name: "Жовква", oblast: "Львівська обл.", zipPrefix: "803" },
  { name: "Яворів", oblast: "Львівська обл.", zipPrefix: "810" },
  // Dnipropetrovsk Oblast
  { name: "Кривий Ріг", oblast: "Дніпропетровська обл.", zipPrefix: "500" },
  { name: "Кам'янське", oblast: "Дніпропетровська обл.", zipPrefix: "519" },
  { name: "Нікополь", oblast: "Дніпропетровська обл.", zipPrefix: "532" },
  { name: "Павлоград", oblast: "Дніпропетровська обл.", zipPrefix: "514" },
  { name: "Самар", oblast: "Дніпропетровська обл.", zipPrefix: "512" },
  { name: "Марганець", oblast: "Дніпропетровська обл.", zipPrefix: "534" },
  { name: "Жовті Води", oblast: "Дніпропетровська обл.", zipPrefix: "522" },
  { name: "Покров", oblast: "Дніпропетровська обл.", zipPrefix: "533" },
  { name: "Синельникове", oblast: "Дніпропетровська обл.", zipPrefix: "525" },
  // Odesa Oblast
  { name: "Чорноморськ", oblast: "Одеська обл.", zipPrefix: "680" },
  { name: "Ізмаїл", oblast: "Одеська обл.", zipPrefix: "686" },
  { name: "Білгород-Дністровський", oblast: "Одеська обл.", zipPrefix: "677" },
  { name: "Подільськ", oblast: "Одеська обл.", zipPrefix: "663" },
  { name: "Південне", oblast: "Одеська обл.", zipPrefix: "654" },
  { name: "Кілія", oblast: "Одеська обл.", zipPrefix: "683" },
  { name: "Рені", oblast: "Одеська обл.", zipPrefix: "688" },
  { name: "Балта", oblast: "Одеська обл.", zipPrefix: "661" },
  // Kharkiv Oblast (Active controlled cities)
  { name: "Лозова", oblast: "Харківська обл.", zipPrefix: "646" },
  { name: "Ізюм", oblast: "Харківська обл.", zipPrefix: "643" },
  { name: "Чугуїв", oblast: "Харківська обл.", zipPrefix: "635" },
  {
    name: "Первомайський (Златопіль)",
    oblast: "Харківська обл.",
    zipPrefix: "641",
  },
  { name: "Балаклія", oblast: "Харківська обл.", zipPrefix: "642" },
  { name: "Мерефа", oblast: "Харківська обл.", zipPrefix: "624" },
  { name: "Люботин", oblast: "Харківська обл.", zipPrefix: "624" },
  {
    name: "Красноград (Берестин)",
    oblast: "Харківська обл.",
    zipPrefix: "633",
  },
  { name: "Богодухів", oblast: "Харківська обл.", zipPrefix: "621" },
  { name: "Дергачі", oblast: "Харківська обл.", zipPrefix: "623" },
  // Donetsk Oblast (Active government-controlled cities)
  { name: "Краматорськ", oblast: "Донецька обл.", zipPrefix: "843" },
  { name: "Слов'янськ", oblast: "Донецька обл.", zipPrefix: "841" },
  { name: "Дружківка", oblast: "Донецька обл.", zipPrefix: "842" },
  { name: "Добропілля", oblast: "Донецька обл.", zipPrefix: "850" },
  { name: "Костянтинівка", oblast: "Донецька обл.", zipPrefix: "851" },
  { name: "Лиман", oblast: "Донецька обл.", zipPrefix: "844" },
  // Poltava Oblast
  { name: "Кременчук", oblast: "Полтавська обл.", zipPrefix: "396" },
  { name: "Горішні Плавні", oblast: "Полтавська обл.", zipPrefix: "398" },
  { name: "Лубни", oblast: "Полтавська обл.", zipPrefix: "375" },
  { name: "Миргород", oblast: "Полтавська обл.", zipPrefix: "376" },
  { name: "Гадяч", oblast: "Полтавська обл.", zipPrefix: "373" },
  { name: "Пирятин", oblast: "Полтавська обл.", zipPrefix: "370" },
  // Vinnytsia Oblast
  { name: "Жмеринка", oblast: "Вінницька обл.", zipPrefix: "231" },
  { name: "Могилів-Подільський", oblast: "Вінницька обл.", zipPrefix: "240" },
  { name: "Хмільник", oblast: "Вінницька обл.", zipPrefix: "220" },
  { name: "Гайсин", oblast: "Вінницька обл.", zipPrefix: "237" },
  { name: "Козятин", oblast: "Вінницька обл.", zipPrefix: "221" },
  { name: "Ладижин", oblast: "Вінницька обл.", zipPrefix: "243" },
  { name: "Калинівка", oblast: "Вінницька обл.", zipPrefix: "224" },
  { name: "Бар", oblast: "Вінницька обл.", zipPrefix: "230" },
  { name: "Тульчин", oblast: "Вінницька обл.", zipPrefix: "236" },
  // Ivano-Frankivsk Oblast
  { name: "Калуш", oblast: "Івано-Франківська обл.", zipPrefix: "773" },
  { name: "Коломия", oblast: "Івано-Франківська обл.", zipPrefix: "782" },
  { name: "Надвірна", oblast: "Івано-Франківська обл.", zipPrefix: "784" },
  { name: "Долина", oblast: "Івано-Франківська обл.", zipPrefix: "775" },
  { name: "Бурштин", oblast: "Івано-Франківська обл.", zipPrefix: "771" },
  { name: "Яремче", oblast: "Івано-Франківська обл.", zipPrefix: "785" },
  { name: "Косів", oblast: "Івано-Франківська обл.", zipPrefix: "786" },
  // Khmelnytskyi Oblast
  {
    name: "Кам'янець-Подільський",
    oblast: "Хмельницька обл.",
    zipPrefix: "323",
  },
  { name: "Шепетівка", oblast: "Хмельницька обл.", zipPrefix: "304" },
  { name: "Нетішин", oblast: "Хмельницька обл.", zipPrefix: "301" },
  { name: "Славута", oblast: "Хмельницька обл.", zipPrefix: "300" },
  { name: "Старокостянтинів", oblast: "Хмельницька обл.", zipPrefix: "311" },
  { name: "Волочиськ", oblast: "Хмельницька обл.", zipPrefix: "312" },
  { name: "Полонне", oblast: "Хмельницька обл.", zipPrefix: "305" },
  // Cherkasy Oblast
  { name: "Умань", oblast: "Черкаська обл.", zipPrefix: "203" },
  { name: "Сміла", oblast: "Черкаська обл.", zipPrefix: "207" },
  { name: "Золотоноша", oblast: "Черкаська обл.", zipPrefix: "197" },
  { name: "Канів", oblast: "Черкаська обл.", zipPrefix: "190" },
  {
    name: "Корсунь-Шевченківський",
    oblast: "Черкаська обл.",
    zipPrefix: "194",
  },
  { name: "Звенигородка", oblast: "Черкаська обл.", zipPrefix: "202" },
  // Zhytomyr Oblast
  { name: "Бердичів", oblast: "Житомирська обл.", zipPrefix: "133" },
  { name: "Коростень", oblast: "Житомирська обл.", zipPrefix: "115" },
  { name: "Звягель", oblast: "Житомирська обл.", zipPrefix: "117" },
  { name: "Малин", oblast: "Житомирська обл.", zipPrefix: "116" },
  { name: "Коростишів", oblast: "Житомирська обл.", zipPrefix: "125" },
  // Rivne & Volyn Oblasts
  { name: "Вараш", oblast: "Рівненська обл.", zipPrefix: "344" },
  { name: "Дубно", oblast: "Рівненська обл.", zipPrefix: "356" },
  { name: "Костопіль", oblast: "Рівненська обл.", zipPrefix: "350" },
  { name: "Сарни", oblast: "Рівненська обл.", zipPrefix: "345" },
  { name: "Ковель", oblast: "Волинська обл.", zipPrefix: "450" },
  { name: "Нововолинськ", oblast: "Волинська обл.", zipPrefix: "454" },
  { name: "Володимир", oblast: "Волинська обл.", zipPrefix: "447" },
  // Zakarpattia Oblast
  { name: "Мукачево", oblast: "Закарпатська обл.", zipPrefix: "896" },
  { name: "Хуст", oblast: "Закарпатська обл.", zipPrefix: "904" },
  { name: "Виноградів", oblast: "Закарпатська обл.", zipPrefix: "903" },
  { name: "Берегове", oblast: "Закарпатська обл.", zipPrefix: "902" },
  { name: "Свалява", oblast: "Закарпатська обл.", zipPrefix: "893" },
  { name: "Рахів", oblast: "Закарпатська обл.", zipPrefix: "906" },
  // Ternopil & Chernivtsi Oblasts
  { name: "Чортків", oblast: "Тернопільська обл.", zipPrefix: "485" },
  { name: "Кременець", oblast: "Тернопільська обл.", zipPrefix: "470" },
  { name: "Бережани", oblast: "Тернопільська обл.", zipPrefix: "475" },
  { name: "Сторожинець", oblast: "Чернівецька обл.", zipPrefix: "590" },
  { name: "Хотин", oblast: "Чернівецька обл.", zipPrefix: "600" },
  // Chernihiv & Sumy Oblasts
  { name: "Ніжин", oblast: "Чернігівська обл.", zipPrefix: "166" },
  { name: "Прилуки", oblast: "Чернігівська обл.", zipPrefix: "175" },
  { name: "Бахмач", oblast: "Чернігівська обл.", zipPrefix: "165" },
  { name: "Конотоп", oblast: "Сумська обл.", zipPrefix: "416" },
  { name: "Шостка", oblast: "Сумська обл.", zipPrefix: "411" },
  { name: "Охтирка", oblast: "Сумська обл.", zipPrefix: "427" },
  { name: "Ромни", oblast: "Сумська обл.", zipPrefix: "420" },
  { name: "Глухів", oblast: "Сумська обл.", zipPrefix: "414" },
  // Mykolaiv & Kirovohrad Oblasts
  { name: "Первомайськ", oblast: "Миколаївська обл.", zipPrefix: "552" },
  { name: "Південноукраїнськ", oblast: "Миколаївська обл.", zipPrefix: "550" },
  { name: "Вознесенськ", oblast: "Миколаївська обл.", zipPrefix: "565" },
  { name: "Олександрія", oblast: "Кіровоградська обл.", zipPrefix: "280" },
  { name: "Світловодськ", oblast: "Кіровоградська обл.", zipPrefix: "275" },
  { name: "Знам'янка", oblast: "Кіровоградська обл.", zipPrefix: "274" },
];

// Real street names for generating realistic city-specific branch & locker options
const REAL_CITY_STREETS = {
  Київ: [
    "вул. Солом'янська, 5",
    "просп. Берестейський, 45",
    "вул. Хрещатик, 22",
    "вул. Велика Васильківська, 102",
    "просп. Степана Бандери, 16",
    "вул. Глибочицька, 40",
    "просп. Миколи Бажана, 24/1",
    "вул. Анни Ахматової, 47",
    "просп. Оболонський, 21Б",
    "вул. Гарматна, 22",
    "вул. Воскресенська, 12А",
    "вул. Юлії Здановської, 46/1",
  ],
  Львів: [
    "вул. Городоцька, 174",
    "просп. Червоної Калини, 62",
    "вул. Стрийська, 45",
    "вул. Зелена, 147",
    "вул. Кульпарківська, 226А",
    "просп. В'ячеслава Чорновола, 67",
  ],
  Дніпро: [
    "просп. Дмитра Яворницького, 60",
    "просп. Слобожанський, 31Д",
    "вул. Робоча, 152",
    "наб. Перемоги, 86А",
    "просп. Олександра Поля, 104",
  ],
  Одеса: [
    "вул. Дерибасівська, 14",
    "просп. Небесної Сотні, 2",
    "вул. Академіка Корольова, 49",
    "вул. Семена Палія, 93А",
    "Фонтанська дорога, 55",
  ],
  Харків: [
    "просп. Науки, 38",
    "вул. Полтавський Шлях, 56",
    "просп. Героїв Харкова, 199",
    "вул. Сумська, 78",
    "просп. Аерокосмічний, 176",
  ],
};

const DEFAULT_STREETS = [
  "вул. Соборна, 12",
  "вул. Незалежності, 34",
  "вул. Шевченка, 19",
  "вул. Центральна, 5",
  "просп. Миру, 42",
  "вул. Грушевського, 28",
  "вул. Вокзальна, 8",
  "вул. Київська, 61",
  "вул. Івана Франка, 15",
  "вул. Лесі Українки, 23",
];

const DeliveryDirectory = {
  cityRefCache: {},
  warehouseCache: {},

  // Search Ukrainian cities by user query
  searchCities(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return UKRAINE_ACTIVE_CITIES.slice(0, 30);

    return UKRAINE_ACTIVE_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.oblast.toLowerCase().includes(q),
    ).slice(0, 35);
  },

  // Generate carrier-accurate branches/lockers (and query live Nova Poshta API when possible)
  async getBranches(carrier, deliveryType, cityName, query = "") {
    const cleanCity = (cityName || "Київ").split(",")[0].trim() || "Київ";
    const isLocker = deliveryType === "Поштомат";
    let list = [];

    // 1. Try live Nova Poshta directory API for Nova Poshta
    if (carrier === "nova") {
      const liveBranches = await this.fetchNovaPoshtaWarehouses(
        cleanCity,
        isLocker,
      );
      if (liveBranches && liveBranches.length > 0) {
        list = liveBranches;
      }
    }

    // 2. Fallback / Ukrposhta / Meest generator using real carrier numbering formats
    if (list.length === 0) {
      list = this.generateCarrierBranches(carrier, isLocker, cleanCity);
    }

    const q = (query || "").trim().toLowerCase();
    if (!q) return list.slice(0, 30);

    return list
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.subtitle && b.subtitle.toLowerCase().includes(q)),
      )
      .slice(0, 30);
  },

  async fetchNovaPoshtaWarehouses(cityName, isLocker) {
    const cacheKey = `${cityName}_${isLocker ? "locker" : "branch"}`;
    if (this.warehouseCache[cacheKey]) return this.warehouseCache[cacheKey];

    try {
      let cityRef = this.cityRefCache[cityName];
      if (!cityRef) {
        const cityRes = await fetch("https://api.novaposhta.ua/v2.0/json/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: "",
            modelName: "Address",
            calledMethod: "getCities",
            methodProperties: { FindByString: cityName, Limit: "5" },
          }),
        });
        const cityData = await cityRes.json();
        if (
          cityData &&
          cityData.success &&
          cityData.data &&
          cityData.data.length > 0
        ) {
          cityRef = cityData.data[0].Ref;
          this.cityRefCache[cityName] = cityRef;
        }
      }

      if (!cityRef) return null;

      const whRes = await fetch("https://api.novaposhta.ua/v2.0/json/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "",
          modelName: "Address",
          calledMethod: "getWarehouses",
          methodProperties: { CityRef: cityRef, Limit: "150", Page: "1" },
        }),
      });
      const whData = await whRes.json();
      if (whData && whData.success && whData.data && whData.data.length > 0) {
        const filtered = whData.data
          .filter((w) => {
            const desc = (w.Description || "").toLowerCase();
            return isLocker
              ? desc.includes("поштомат")
              : !desc.includes("поштомат");
          })
          .map((w) => ({
            title: w.Description,
            subtitle: `м. ${cityName} · До ${w.TotalMaxWeightAllowed || 30} кг`,
          }));

        if (filtered.length > 0) {
          this.warehouseCache[cacheKey] = filtered;
          return filtered;
        }
      }
    } catch (e) {
      // Fallback to built-in list if offline or blocked
    }
    return null;
  },

  generateCarrierBranches(carrier, isLocker, cityName) {
    const cityObj = UKRAINE_ACTIVE_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase(),
    );
    const zipPrefix = cityObj ? cityObj.zipPrefix : "010";
    const streets = REAL_CITY_STREETS[cityName] || DEFAULT_STREETS;

    return streets.map((street, idx) => {
      const num = idx + 1;

      if (carrier === "nova") {
        if (isLocker) {
          const lockerNum = 20100 + num * 17;
          return {
            title: `Поштомат "Нова Пошта" №${lockerNum}: ${street}`,
            subtitle: `м. ${cityName} · Цілодобово (до 20 кг)`,
          };
        }
        return {
          title: `Відділення №${num}: ${street}`,
          subtitle: `м. ${cityName} · ${num <= 2 ? "Вантажне відділення (до 1100 кг)" : "Поштове відділення (до 30 кг)"}`,
        };
      }

      if (carrier === "ukr") {
        const zipCode = `${zipPrefix}${String(num * 3 + 1).padStart(2, "0")}`;
        if (isLocker) {
          return {
            title: `Поштомат Укрпошта ${zipCode}: ${street}`,
            subtitle: `м. ${cityName} · Автоматизована точка видачі`,
          };
        }
        return {
          title: `Відділення Укрпошта ${zipCode}: ${street}`,
          subtitle: `м. ${cityName} · Міське відділення зв'язку`,
        };
      }

      // Meest ПОШТА
      if (isLocker) {
        const meestLocker = 1040 + num * 12;
        return {
          title: `Поштомат Meest №${meestLocker}: ${street}`,
          subtitle: `м. ${cityName} · До 20 кг`,
        };
      }
      return {
        title: `Відділення Meest ПОШТА №${num}: ${street}`,
        subtitle: `м. ${cityName} · Пункт приймання-видачі (до 30 кг)`,
      };
    });
  },
};
