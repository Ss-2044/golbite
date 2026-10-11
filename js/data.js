/* GolBite — demo data. All names, scores, prices and partners are fictional sample data. */

const TEAMS = {
  hilal:    { id: 'hilal',    name: { en: 'Al Hilal',    ar: 'الهلال' },  short: 'HIL', color: '#005BAC' },
  nassr:    { id: 'nassr',    name: { en: 'Al Nassr',    ar: 'النصر' },   short: 'NSR', color: '#F2B705' },
  ittihad:  { id: 'ittihad',  name: { en: 'Al Ittihad',  ar: 'الاتحاد' }, short: 'ITT', color: '#E8B400' },
  ahli:     { id: 'ahli',     name: { en: 'Al Ahli',     ar: 'الأهلي' },  short: 'AHL', color: '#008A3E' },
  nights:   { id: 'nights',   name: { en: 'Desert Lights', ar: 'أضواء الصحراء' }, short: 'DLT', color: '#D9467A' },
};

const EVENTS = [
  {
    id: 'e1', type: 'football',
    title: { en: 'Al Hilal vs Al Nassr', ar: 'الهلال ضد النصر' },
    league: { en: 'Saudi Pro League · Riyadh Derby', ar: 'دوري روشن السعودي · ديربي الرياض' },
    home: 'hilal', away: 'nassr',
    venue: { en: 'Kingdom Arena, Riyadh', ar: 'المملكة أرينا، الرياض' },
    time: '21:00',
  },
  {
    id: 'e2', type: 'football',
    title: { en: 'Al Ittihad vs Al Ahli', ar: 'الاتحاد ضد الأهلي' },
    league: { en: 'Saudi Pro League · Jeddah Derby', ar: 'دوري روشن السعودي · ديربي جدة' },
    home: 'ittihad', away: 'ahli',
    venue: { en: 'King Abdullah Sports City (Al-Jawhara), Jeddah', ar: 'مدينة الملك عبدالله الرياضية (الجوهرة)، جدة' },
    time: '21:00',
  },
  {
    id: 'e3', type: 'concert',
    title: { en: 'Desert Lights Live', ar: 'أضواء الصحراء لايف' },
    league: { en: 'Winter Concert Series', ar: 'سلسلة حفلات الشتاء' },
    home: 'nights', away: null,
    venue: { en: 'King Fahd International Stadium, Riyadh', ar: 'استاد الملك فهد الدولي، الرياض' },
    time: '21:30',
  },
];

/* Timeline phases. Football and concert share the same structure with different labels. */
const PHASES = ['arrival', 'prematch', 'kickoff', 'halftime', 'second', 'final'];
const PHASE_LABELS = {
  football: {
    arrival:  { en: 'Arrival',      ar: 'الوصول' },
    prematch: { en: 'Pre-match',    ar: 'قبل المباراة' },
    kickoff:  { en: 'First half',   ar: 'الشوط الأول' },
    halftime: { en: 'Halftime',     ar: 'الاستراحة' },
    second:   { en: 'Second half',  ar: 'الشوط الثاني' },
    final:    { en: 'Final whistle', ar: 'صافرة النهاية' },
  },
  concert: {
    arrival:  { en: 'Doors open',   ar: 'فتح الأبواب' },
    prematch: { en: 'Opening act',  ar: 'الفقرة الافتتاحية' },
    kickoff:  { en: 'Headliner',    ar: 'العرض الرئيسي' },
    halftime: { en: 'Intermission', ar: 'الاستراحة' },
    second:   { en: 'Encore set',   ar: 'فقرة الختام' },
    final:    { en: 'Show end',     ar: 'نهاية الحفل' },
  },
};

const SECTIONS = {
  A: { id: 'A', name: { en: 'Section A · North', ar: 'القسم A · الشمالي' }, angle: 270, rows: 20, seats: 30 },
  B: { id: 'B', name: { en: 'Section B · East',  ar: 'القسم B · الشرقي' },  angle: 0,   rows: 20, seats: 30 },
  C: { id: 'C', name: { en: 'Section C · South', ar: 'القسم C · الجنوبي' }, angle: 90,  rows: 20, seats: 30 },
};

/* Points of interest are placed by angle around the concourse ring (0° = east, 90° = south). */
const GATES = [
  { id: 'G1', name: { en: 'Gate 1 · Main', ar: 'البوابة 1 · الرئيسية' }, angle: 180 },
  { id: 'G2', name: { en: 'Gate 2 · North-East', ar: 'البوابة 2 · الشمال الشرقي' }, angle: 315 },
  { id: 'G3', name: { en: 'Gate 3 · South-East', ar: 'البوابة 3 · الجنوب الشرقي' }, angle: 45 },
];

const PICKUPS = [
  { id: 'P1', name: { en: 'North Pickup', ar: 'استلام الشمال' }, angle: 248, base: 35 },
  { id: 'P2', name: { en: 'East Pickup',  ar: 'استلام الشرق' },  angle: 22,  base: 25 },
  { id: 'P3', name: { en: 'South Pickup', ar: 'استلام الجنوب' }, angle: 112, base: 30 },
];

const VENDORS = [
  { id: 'v1', name: { en: 'Falcon Grill',   ar: 'مشويات الصقر' },  angle: 288, cats: ['burgers', 'fries'],   emoji: '🍔' },
  { id: 'v2', name: { en: 'Golden Fries Co', ar: 'البطاطس الذهبية' }, angle: 340, cats: ['fries', 'snacks'],    emoji: '🍟' },
  { id: 'v3', name: { en: 'Oasis Drinks',   ar: 'مشروبات الواحة' }, angle: 68,  cats: ['drinks', 'snacks'],   emoji: '🥤' },
  { id: 'v4', name: { en: 'Kickoff Kiosk',  ar: 'كشك البداية' },   angle: 205, cats: ['snacks', 'drinks', 'burgers'], emoji: '🌭' },
];

const FACILITIES = [
  { id: 'wc1', kind: 'restroom', angle: 232 }, { id: 'wc2', kind: 'restroom', angle: 30 }, { id: 'wc3', kind: 'restroom', angle: 128 },
  { id: 'fa1', kind: 'firstaid', angle: 160 },  { id: 'fa2', kind: 'firstaid', angle: 300 },
  { id: 'pr1', kind: 'prayer', angle: 142 },    { id: 'pr2', kind: 'prayer', angle: 325 },
  { id: 'in1', kind: 'info', angle: 192 },      { id: 'in2', kind: 'info', angle: 8 },
];

const FACILITY_LABELS = {
  restroom: { en: 'Restrooms', ar: 'دورات المياه', icon: '🚻' },
  firstaid: { en: 'First aid', ar: 'الإسعافات الأولية', icon: '⛑️' },
  prayer:   { en: 'Prayer room', ar: 'مصلى', icon: '🕌' },
  info:     { en: 'Info point', ar: 'نقطة معلومات', icon: 'ℹ️' },
};

const MENU_CATS = [
  { id: 'drinks',  name: { en: 'Drinks',  ar: 'مشروبات' }, emoji: '🥤' },
  { id: 'burgers', name: { en: 'Burgers', ar: 'برجر' },    emoji: '🍔' },
  { id: 'fries',   name: { en: 'Fries',   ar: 'بطاطس' },   emoji: '🍟' },
  { id: 'snacks',  name: { en: 'Snacks',  ar: 'سناكات' },  emoji: '🍿' },
];

const DIETS = [
  { id: 'veg',  name: { en: 'Vegetarian', ar: 'نباتي' } },
  { id: 'gf',   name: { en: 'Gluten-free', ar: 'خالٍ من الغلوتين' } },
  { id: 'df',   name: { en: 'Dairy-free', ar: 'خالٍ من الألبان' } },
  { id: 'spicy', name: { en: 'Spicy', ar: 'حار' } },
];

const ALLERGENS = {
  gluten: { en: 'Gluten', ar: 'غلوتين' }, dairy: { en: 'Dairy', ar: 'ألبان' }, egg: { en: 'Egg', ar: 'بيض' },
  sesame: { en: 'Sesame', ar: 'سمسم' }, nuts: { en: 'Nuts', ar: 'مكسرات' }, soy: { en: 'Soy', ar: 'صويا' },
};

const MENU = [
  // Drinks
  { id: 'd1', cat: 'drinks', emoji: '💧', price: 4,  prep: 1, diet: ['veg', 'gf', 'df'], allergens: [],
    name: { en: 'Still Water', ar: 'مياه معدنية' }, desc: { en: 'Chilled 500 ml bottle.', ar: 'عبوة باردة 500 مل.' },
    ing: { en: 'Mineral water', ar: 'مياه معدنية' } },
  { id: 'd2', cat: 'drinks', emoji: '🥤', price: 8,  prep: 1, diet: ['veg', 'gf', 'df'], allergens: [],
    name: { en: 'Cola', ar: 'كولا' }, desc: { en: 'Ice-cold fountain cola, regular size.', ar: 'كولا باردة، حجم عادي.' },
    ing: { en: 'Carbonated water, sugar, natural flavours', ar: 'مياه غازية، سكر، نكهات طبيعية' } },
  { id: 'd3', cat: 'drinks', emoji: '☕', price: 10, prep: 2, diet: ['veg', 'gf', 'df'], allergens: [],
    name: { en: 'Saudi Coffee', ar: 'قهوة سعودية' }, desc: { en: 'Light-roast qahwa with cardamom and saffron.', ar: 'قهوة شقراء بالهيل والزعفران.' },
    ing: { en: 'Coffee, cardamom, saffron, cloves', ar: 'بن، هيل، زعفران، قرنفل' } },
  { id: 'd4', cat: 'drinks', emoji: '🍋', price: 14, prep: 2, diet: ['veg', 'gf', 'df'], allergens: [],
    name: { en: 'Mint Lemonade', ar: 'ليمون بالنعناع' }, desc: { en: 'Fresh lemon blended with mint and ice.', ar: 'ليمون طازج مع نعناع وثلج.' },
    ing: { en: 'Lemon, mint, sugar, ice', ar: 'ليمون، نعناع، سكر، ثلج' } },
  { id: 'd5', cat: 'drinks', emoji: '🫖', price: 9,  prep: 2, diet: ['veg', 'gf'], allergens: ['dairy'],
    name: { en: 'Karak Tea', ar: 'شاي كرك' }, desc: { en: 'Spiced milk tea, stadium favourite.', ar: 'شاي بالحليب والبهارات، المفضل في المدرجات.' },
    ing: { en: 'Black tea, milk, cardamom, sugar', ar: 'شاي أسود، حليب، هيل، سكر' } },
  // Burgers
  { id: 'b1', cat: 'burgers', emoji: '🍔', price: 32, prep: 6, diet: [], allergens: ['gluten', 'dairy', 'sesame'],
    name: { en: 'Classic Beef Burger', ar: 'برجر لحم كلاسيك' }, desc: { en: 'Grilled beef patty, cheddar, pickles, house sauce.', ar: 'لحم مشوي، شيدر، مخلل، صوص خاص.' },
    ing: { en: 'Beef, brioche bun, cheddar, pickles, lettuce, sauce', ar: 'لحم بقري، خبز بريوش، شيدر، مخلل، خس، صوص' } },
  { id: 'b2', cat: 'burgers', emoji: '🍗', price: 29, prep: 6, diet: ['spicy'], allergens: ['gluten', 'egg'],
    name: { en: 'Crispy Chicken Burger', ar: 'برجر دجاج مقرمش' }, desc: { en: 'Crunchy chicken fillet with spicy mayo.', ar: 'صدر دجاج مقرمش مع مايونيز حار.' },
    ing: { en: 'Chicken, bun, spicy mayo, lettuce', ar: 'دجاج، خبز، مايونيز حار، خس' } },
  { id: 'b3', cat: 'burgers', emoji: '🥩', price: 45, prep: 8, diet: [], allergens: ['gluten', 'dairy', 'sesame', 'egg'],
    name: { en: 'Falcon Double', ar: 'دبل الصقر' }, desc: { en: 'Two smashed patties, double cheese, caramelised onion.', ar: 'قطعتا لحم، جبن مضاعف، بصل مكرمل.' },
    ing: { en: 'Beef ×2, cheddar ×2, onion, bun, sauce', ar: 'لحم ×2، شيدر ×2، بصل، خبز، صوص' } },
  { id: 'b4', cat: 'burgers', emoji: '🥙', price: 28, prep: 5, diet: ['veg'], allergens: ['gluten', 'dairy'],
    name: { en: 'Halloumi Veggie Burger', ar: 'برجر حلومي نباتي' }, desc: { en: 'Grilled halloumi, roasted pepper, rocket.', ar: 'حلومي مشوي، فلفل محمص، جرجير.' },
    ing: { en: 'Halloumi, pepper, rocket, bun', ar: 'حلومي، فلفل، جرجير، خبز' } },
  // Fries
  { id: 'f1', cat: 'fries', emoji: '🍟', price: 12, prep: 3, diet: ['veg', 'gf', 'df'], allergens: [],
    name: { en: 'Classic Fries', ar: 'بطاطس كلاسيك' }, desc: { en: 'Golden, crispy, lightly salted.', ar: 'ذهبية ومقرمشة بملح خفيف.' },
    ing: { en: 'Potatoes, sunflower oil, salt', ar: 'بطاطس، زيت دوار الشمس، ملح' } },
  { id: 'f2', cat: 'fries', emoji: '🧀', price: 18, prep: 4, diet: ['veg'], allergens: ['dairy'],
    name: { en: 'Cheese Fries', ar: 'بطاطس بالجبن' }, desc: { en: 'Fries topped with warm cheese sauce.', ar: 'بطاطس مع صوص جبن ساخن.' },
    ing: { en: 'Potatoes, cheese sauce', ar: 'بطاطس، صوص جبن' } },
  { id: 'f3', cat: 'fries', emoji: '🌶️', price: 15, prep: 3, diet: ['veg', 'gf', 'df', 'spicy'], allergens: [],
    name: { en: 'Spicy Fries', ar: 'بطاطس حارة' }, desc: { en: 'Seasoned with chili and paprika.', ar: 'متبلة بالشطة والبابريكا.' },
    ing: { en: 'Potatoes, chili, paprika, salt', ar: 'بطاطس، شطة، بابريكا، ملح' } },
  { id: 'f4', cat: 'fries', emoji: '🍠', price: 17, prep: 4, diet: ['veg', 'gf', 'df'], allergens: [],
    name: { en: 'Sweet Potato Fries', ar: 'بطاطا حلوة' }, desc: { en: 'Crisp sweet potato with sea salt.', ar: 'بطاطا حلوة مقرمشة بملح البحر.' },
    ing: { en: 'Sweet potato, oil, sea salt', ar: 'بطاطا حلوة، زيت، ملح بحري' } },
  // Snacks
  { id: 's1', cat: 'snacks', emoji: '🧆', price: 16, prep: 3, diet: ['veg', 'df'], allergens: ['gluten'],
    name: { en: 'Samosa Trio', ar: 'سمبوسة ×3' }, desc: { en: 'Vegetable samosas with tamarind dip.', ar: 'سمبوسة خضار مع صوص التمر الهندي.' },
    ing: { en: 'Pastry, potato, peas, spices', ar: 'عجينة، بطاطس، بازلاء، بهارات' } },
  { id: 's2', cat: 'snacks', emoji: '🍿', price: 14, prep: 1, diet: ['veg', 'gf'], allergens: ['dairy'],
    name: { en: 'Butter Popcorn', ar: 'فشار بالزبدة' }, desc: { en: 'Large bucket, freshly popped.', ar: 'علبة كبيرة طازجة.' },
    ing: { en: 'Corn, butter, salt', ar: 'ذرة، زبدة، ملح' } },
  { id: 's3', cat: 'snacks', emoji: '🌮', price: 22, prep: 3, diet: ['veg', 'gf', 'spicy'], allergens: ['dairy'],
    name: { en: 'Loaded Nachos', ar: 'ناتشوز محمّلة' }, desc: { en: 'Tortilla chips, cheese, jalapeños, salsa.', ar: 'رقائق تورتيلا، جبن، هالبينو، صلصة.' },
    ing: { en: 'Corn chips, cheese, jalapeño, salsa', ar: 'رقائق ذرة، جبن، هالبينو، صلصة' } },
  { id: 's4', cat: 'snacks', emoji: '🌴', price: 18, prep: 1, diet: ['veg'], allergens: ['gluten', 'nuts', 'dairy'],
    name: { en: 'Dates & Maamoul', ar: 'تمر ومعمول' }, desc: { en: 'Premium dates with pistachio maamoul.', ar: 'تمر فاخر مع معمول الفستق.' },
    ing: { en: 'Dates, semolina, pistachio, butter', ar: 'تمر، سميد، فستق، زبدة' } },
  { id: 's5', cat: 'snacks', emoji: '🌭', price: 20, prep: 4, diet: [], allergens: ['gluten', 'soy'],
    name: { en: 'Beef Hot Dog', ar: 'هوت دوج لحم' }, desc: { en: 'Grilled beef sausage, mustard, onions.', ar: 'نقانق لحم مشوية، خردل، بصل.' },
    ing: { en: 'Beef sausage, bun, mustard, onion', ar: 'نقانق لحم، خبز، خردل، بصل' } },
];

const COMBO = {
  id: 'combo', items: ['b1', 'f1', 'd2'], price: 45,
  name: { en: 'Snack Combo of the Day', ar: 'كومبو اليوم' },
  desc: { en: 'Classic Beef Burger + Classic Fries + Cola', ar: 'برجر لحم كلاسيك + بطاطس كلاسيك + كولا' },
};

/* Alternatives suggested when an item is sold out. */
const ALTERNATIVES = { b1: 'b3', b2: 'b1', b3: 'b1', b4: 'b2', f1: 'f3', f2: 'f1', f3: 'f1', f4: 'f1', d1: 'd2', d2: 'd4', d3: 'd5', d4: 'd2', d5: 'd3', s1: 's3', s2: 's3', s3: 's2', s4: 's1', s5: 'b1' };

const MERCH = [
  { id: 'm1', emoji: '👕', price: 299, kind: 'jersey', name: { en: 'Home Jersey 26/27', ar: 'قميص الأرض 26/27' }, desc: { en: 'Breathable match fabric with embroidered crest.', ar: 'قماش مباريات بشعار مطرّز.' }, sizes: true },
  { id: 'm2', emoji: '🎽', price: 279, kind: 'jersey', name: { en: 'Away Jersey 26/27', ar: 'قميص الضيف 26/27' }, desc: { en: 'Lightweight away kit in contrast colours.', ar: 'طقم ضيف خفيف بألوان متباينة.' }, sizes: true },
  { id: 'm3', emoji: '🧣', price: 69,  kind: 'scarf',  name: { en: 'Matchday Scarf', ar: 'وشاح المباراة' }, desc: { en: 'Knitted double-sided supporter scarf.', ar: 'وشاح مشجعين محبوك بوجهين.' } },
  { id: 'm4', emoji: '🧢', price: 89,  kind: 'cap',    name: { en: 'Crest Cap', ar: 'قبعة الشعار' }, desc: { en: 'Adjustable cap with raised crest.', ar: 'قبعة قابلة للتعديل بشعار بارز.' } },
  { id: 'm5', emoji: '🚩', price: 49,  kind: 'flag',   name: { en: 'Stand Flag', ar: 'علم المدرج' }, desc: { en: '90 × 60 cm waving flag.', ar: 'علم تشجيع 90 × 60 سم.' } },
  { id: 'm6', emoji: '⚽', price: 59,  kind: 'ball',   name: { en: 'Mini Match Ball', ar: 'كرة مصغّرة' }, desc: { en: 'Size 1 replica ball.', ar: 'كرة طبق الأصل مقاس 1.' } },
  { id: 'm7', emoji: '🧥', price: 199, kind: 'hoodie', name: { en: 'Supporters Hoodie', ar: 'هودي المشجعين' }, desc: { en: 'Heavyweight fleece hoodie.', ar: 'هودي صوف ثقيل.' }, sizes: true },
  { id: 'm8', emoji: '☕', price: 39,  kind: 'mug',    name: { en: 'Crest Mug', ar: 'كوب الشعار' }, desc: { en: 'Ceramic mug, 350 ml.', ar: 'كوب سيراميك 350 مل.' } },
  /* special drops */
  { id: 'x77', emoji: '🔥', price: 149, kind: 'drop', special: 'drop77', name: { en: "77' Limited Scarf", ar: 'وشاح الدقيقة 77 المحدود' }, desc: { en: 'Released only at the 77th minute. 777 pieces.', ar: 'يطرح في الدقيقة 77 فقط. 777 قطعة.' } },
  { id: 'xgold', emoji: '🏅', price: 249, kind: 'tier', special: 'gold', name: { en: 'Gold Member Jacket', ar: 'جاكيت العضوية الذهبية' }, desc: { en: 'Unlocked for Gold tier fans.', ar: 'متاح لمشجعي الفئة الذهبية.' } },
  { id: 'xstad', emoji: '✨', price: 119, kind: 'stadium', special: 'stadium', name: { en: 'Stadium-Only Golden Scarf', ar: 'الوشاح الذهبي الحصري للملعب' }, desc: { en: 'Unlocks when the whole stadium hits the goal.', ar: 'يُفتح عندما يصل الملعب كاملاً للهدف.' } },
  { id: 'xred', emoji: '🟥', price: 99, kind: 'red', special: 'red', name: { en: 'Red Card Tee', ar: 'تيشيرت البطاقة الحمراء' }, desc: { en: 'Revealed after a red card. Today only.', ar: 'يظهر بعد البطاقة الحمراء. اليوم فقط.' } },
  { id: 'xpred', emoji: '🔮', price: 129, kind: 'pred', special: 'prediction', name: { en: 'Oracle Edition Cap', ar: 'قبعة إصدار المتنبئ' }, desc: { en: 'Unlocked by a correct prediction.', ar: 'تُفتح بتوقع صحيح.' } },
  { id: 'xht', emoji: '⏱️', price: 59, kind: 'halftime', special: 'halftime', name: { en: 'Halftime Special Flag + Drink', ar: 'عرض الاستراحة: علم + مشروب' }, desc: { en: 'Halftime-only bundle price.', ar: 'سعر حزمة خاص بالاستراحة.' } },
];

const BUNDLES = [
  { id: 'bd1', items: ['m3', 'combo'], price: 99, name: { en: 'Scarf + Combo', ar: 'وشاح + كومبو' }, emoji: '🧣🍔' },
  { id: 'bd2', items: ['m4', 'd4'],    price: 95, name: { en: 'Cap + Mint Lemonade', ar: 'قبعة + ليمون نعناع' }, emoji: '🧢🍋' },
];

const COLLECTIBLE_SERIES = [
  { id: 'c1', name: { en: 'Opening Night', ar: 'ليلة الافتتاح' }, rarity: 'common', emoji: '🌙' },
  { id: 'c2', name: { en: 'Desert Derby', ar: 'ديربي الصحراء' }, rarity: 'rare', emoji: '🏜️' },
  { id: 'c3', name: { en: 'Golden Goal', ar: 'الهدف الذهبي' }, rarity: 'epic', emoji: '🥇' },
  { id: 'c4', name: { en: 'Falcon Flight', ar: 'تحليق الصقر' }, rarity: 'rare', emoji: '🦅' },
  { id: 'c5', name: { en: 'Floodlights', ar: 'الأضواء الكاشفة' }, rarity: 'common', emoji: '💡' },
  { id: 'c6', name: { en: 'Final Whistle', ar: 'صافرة النهاية' }, rarity: 'common', emoji: '📯' },
  { id: 'c7', name: { en: 'Champions Night', ar: 'ليلة الأبطال' }, rarity: 'legendary', emoji: '🏆' },
];

const BADGES = {
  first:    { emoji: '🎟️', name: { en: 'My First Match', ar: 'مباراتي الأولى' } },
  foodie:   { emoji: '🍔', name: { en: 'Matchday Foodie', ar: 'ذوّاق المباريات' } },
  group:    { emoji: '👥', name: { en: 'Squad Leader', ar: 'قائد المجموعة' } },
  oracle:   { emoji: '🔮', name: { en: 'Oracle', ar: 'المتنبئ' } },
  quiz:     { emoji: '🧠', name: { en: 'Quiz Ace', ar: 'بطل المسابقة' } },
  goal:     { emoji: '⚽', name: { en: 'Goal Witness', ar: 'شاهد الهدف' } },
  collector:{ emoji: '🧣', name: { en: 'Collector', ar: 'جامع المقتنيات' } },
  victory:  { emoji: '🎆', name: { en: 'Victory Night', ar: 'ليلة النصر' } },
  explorer: { emoji: '🧭', name: { en: 'Stadium Explorer', ar: 'مستكشف الملعب' } },
};

const QUIZ = [
  { q: { en: 'How many players does a football team have on the pitch?', ar: 'كم عدد لاعبي فريق كرة القدم في الملعب؟' },
    a: [{ en: '9', ar: '9' }, { en: '11', ar: '11' }, { en: '12', ar: '12' }], c: 1 },
  { q: { en: 'How long is a standard football half?', ar: 'كم مدة الشوط في كرة القدم؟' },
    a: [{ en: '40 min', ar: '40 دقيقة' }, { en: '45 min', ar: '45 دقيقة' }, { en: '50 min', ar: '50 دقيقة' }], c: 1 },
  { q: { en: 'Which card sends a player off?', ar: 'أي بطاقة تعني طرد اللاعب؟' },
    a: [{ en: 'Yellow', ar: 'الصفراء' }, { en: 'Green', ar: 'الخضراء' }, { en: 'Red', ar: 'الحمراء' }], c: 2 },
];

const QUIZ_BOARD = [
  { name: 'Noura S.', pts: 300 }, { name: 'Faisal A.', pts: 270 }, { name: 'Huda K.', pts: 240 }, { name: 'Omar R.', pts: 200 },
];

const SEAT_NEIGHBOURS = ['Sara M.', 'Khalid T.', 'Reem A.', 'Majed H.', 'Lama F.'];

const SPONSORS = ['Oasis Fizz', 'Falcon Telecom', 'Najd Bank', 'Desert Air'];

const OFFER_IMAGES = ['🥤', '🍔', '🍟', '🧣', '⚽', '🎁', '☕', '🍿'];

const DEFAULT_OFFERS = [
  { id: 'of1', title: { en: 'Goal-time Fizz: 2-for-1 drinks', ar: 'مشروبات الهدف: اثنان بسعر واحد' }, sponsor: 'Oasis Fizz', image: '🥤',
    moment: 'goal', sections: ['A', 'B', 'C'], minutes: 5, discount: 50, item: 'd2', active: true, views: 1240, redemptions: 182, orders: 151, tone: 'sponsor' },
  { id: 'of2', title: { en: 'Halftime Burger Rush −20%', ar: 'برجر الاستراحة −20%' }, sponsor: 'Falcon Grill', image: '🍔',
    moment: 'halftime', sections: ['A', 'C'], minutes: 10, discount: 20, item: 'b1', active: true, views: 980, redemptions: 133, orders: 120, tone: 'team' },
  { id: 'of3', title: { en: 'Pre-match Qahwa on us', ar: 'قهوة ما قبل المباراة علينا' }, sponsor: 'Najd Bank', image: '☕',
    moment: 'prematch', sections: ['A', 'B', 'C'], minutes: 15, discount: 100, item: 'd3', active: true, views: 1530, redemptions: 260, orders: 98, tone: 'sponsor' },
];

/* Moments an offer can be scheduled for. */
const OFFER_MOMENTS = [
  { id: 'now',      name: { en: 'Right now', ar: 'الآن' } },
  { id: 'prematch', name: { en: 'Pre-match', ar: 'قبل المباراة' } },
  { id: 'halftime', name: { en: 'Halftime', ar: 'الاستراحة' } },
  { id: 'goal',     name: { en: 'On a goal', ar: 'عند تسجيل هدف' } },
  { id: 'minute',   name: { en: 'Specific minute', ar: 'دقيقة محددة' } },
];
