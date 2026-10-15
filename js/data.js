// Selligine POS Demo Initial Seed Data
// Pre-seeded with 40 Provision Store Products, 6 Staff Accounts, 14-Day Sales History, and Customers

const INITIAL_STAFF = [
  {
    id: "staff_1",
    name: "Kwame Asante",
    role: "Business Owner",
    roleKey: "owner",
    avatar: "KA",
    color: "#2563eb",
    icon: "star",
    pin: "1234",
    email: "kwame@selligine.store",
    phone: "+233 24 123 4567",
    desc: "Full access — all settings, staff, reports, POS"
  },
  {
    id: "staff_2",
    name: "Akosua Mensah",
    role: "General Manager",
    roleKey: "manager",
    avatar: "AM",
    color: "#0284c7",
    icon: "users",
    pin: "2345",
    email: "akosua@selligine.store",
    phone: "+233 20 987 6543",
    desc: "Staff, inventory, reports — no billing/settings"
  },
  {
    id: "staff_3",
    name: "Kojo Frimpong",
    role: "Cashier",
    roleKey: "cashier",
    avatar: "KF",
    color: "#059669",
    icon: "monitor",
    pin: "3456",
    email: "kojo@selligine.store",
    phone: "+233 55 456 7890",
    desc: "POS terminal, sales, customer lookup"
  },
  {
    id: "staff_4",
    name: "Abena Ofori",
    role: "Cashier",
    roleKey: "cashier",
    avatar: "AO",
    color: "#0d9488",
    icon: "monitor",
    pin: "4567",
    email: "abena@selligine.store",
    phone: "+233 27 654 3210",
    desc: "POS terminal, sales, customer lookup"
  },
  {
    id: "staff_5",
    name: "Ama Boateng",
    role: "Inventory Manager",
    roleKey: "inventory",
    avatar: "AB",
    color: "#d97706",
    icon: "box",
    pin: "5678",
    email: "ama@selligine.store",
    phone: "+233 24 888 9999",
    desc: "Products, stock levels, adjustments"
  },
  {
    id: "staff_6",
    name: "Yaw Darkwa",
    role: "Accountant",
    roleKey: "accountant",
    avatar: "YD",
    color: "#7c3aed",
    icon: "bar-chart",
    pin: "6789",
    email: "yaw@selligine.store",
    phone: "+233 50 111 2222",
    desc: "Sales reports, reconciliation, audit log"
  }
];

const INITIAL_STORE_SETTINGS = {
  storeName: "Selligine Provision & Mart",
  tagline: "Quality Provisions & Household Needs",
  address: "Plot 14 Osu Oxford Street, Accra, Ghana",
  phone: "+233 24 123 4567",
  email: "contact@selligine.store",
  taxRate: 3.5, // 3.5% Flat VAT rate standard
  taxName: "VAT/NHIL/GETFund",
  currency: "GH₵",
  currencyCode: "GHS",
  receiptFooter: "Thank you for shopping with Selligine! Goods sold are exchangeable within 48hrs with receipt.",
  lowStockThreshold: 10,
  allowNegativeStock: false
};

const INITIAL_CATEGORIES = [
  "All",
  "Beverages",
  "Grains & Staples",
  "Dairy & Breakfast",
  "Snacks & Biscuits",
  "Canned Foods",
  "Toiletries & Hygiene",
  "Cleaning & Laundry"
];

// 40 populated realistic retail provision items
const INITIAL_PRODUCTS = [
  // Beverages
  {
    id: "prod_01",
    name: "Milo 400g Tin",
    sku: "BVG-MILO-400",
    barcode: "6001001001",
    category: "Dairy & Breakfast",
    costPrice: 42.00,
    price: 52.00,
    stock: 28,
    unit: "tin",
    image: "☕",
    reorderLevel: 8
  },
  {
    id: "prod_02",
    name: "Ideal Milk 160g Tin",
    sku: "BVG-IDL-160",
    barcode: "6001001002",
    category: "Dairy & Breakfast",
    costPrice: 7.20,
    price: 9.50,
    stock: 75,
    unit: "can",
    image: "🥛",
    reorderLevel: 20
  },
  {
    id: "prod_03",
    name: "Carnation Evaporated Milk 160g",
    sku: "BVG-CRN-160",
    barcode: "6001001003",
    category: "Dairy & Breakfast",
    costPrice: 6.80,
    price: 8.50,
    stock: 42,
    unit: "can",
    image: "🥛",
    reorderLevel: 15
  },
  {
    id: "prod_04",
    name: "Lipton Yellow Label 50 Tea Bags",
    sku: "BVG-LIP-50",
    barcode: "6001001004",
    category: "Dairy & Breakfast",
    costPrice: 22.00,
    price: 28.00,
    stock: 35,
    unit: "box",
    image: "🍵",
    reorderLevel: 10
  },
  {
    id: "prod_05",
    name: "Nescafé Classic Jar 100g",
    sku: "BVG-NES-100",
    barcode: "6001001005",
    category: "Dairy & Breakfast",
    costPrice: 38.00,
    price: 48.00,
    stock: 19,
    unit: "jar",
    image: "☕",
    reorderLevel: 6
  },
  {
    id: "prod_06",
    name: "St. Louis Sugar Cubes 500g",
    sku: "STP-SUG-500",
    barcode: "6001001006",
    category: "Dairy & Breakfast",
    costPrice: 15.50,
    price: 20.00,
    stock: 45,
    unit: "box",
    image: "🧊",
    reorderLevel: 12
  },
  {
    id: "prod_07",
    name: "Quaker Oats 500g",
    sku: "BRK-OAT-500",
    barcode: "6001001007",
    category: "Dairy & Breakfast",
    costPrice: 26.00,
    price: 33.00,
    stock: 18,
    unit: "tin",
    image: "🥣",
    reorderLevel: 8
  },
  {
    id: "prod_08",
    name: "Blue Band Margarine 450g",
    sku: "BRK-BLB-450",
    barcode: "6001001008",
    category: "Dairy & Breakfast",
    costPrice: 24.00,
    price: 30.00,
    stock: 22,
    unit: "tub",
    image: "🧈",
    reorderLevel: 10
  },

  // Beverages (Cold)
  {
    id: "prod_09",
    name: "Voltic Natural Spring Water 1.5L",
    sku: "BVG-VOL-1.5",
    barcode: "6001001009",
    category: "Beverages",
    costPrice: 4.50,
    price: 6.50,
    stock: 64,
    unit: "bottle",
    image: "💧",
    reorderLevel: 24
  },
  {
    id: "prod_10",
    name: "Voltic Natural Spring Water 750ml",
    sku: "BVG-VOL-750",
    barcode: "6001001010",
    category: "Beverages",
    costPrice: 2.80,
    price: 4.00,
    stock: 80,
    unit: "bottle",
    image: "💧",
    reorderLevel: 30
  },
  {
    id: "prod_11",
    name: "Coca-Cola 330ml Can",
    sku: "BVG-COKE-330",
    barcode: "6001001011",
    category: "Beverages",
    costPrice: 6.00,
    price: 8.00,
    stock: 48,
    unit: "can",
    image: "🥤",
    reorderLevel: 15
  },
  {
    id: "prod_12",
    name: "Maltina Classic 330ml Can",
    sku: "BVG-MLT-330",
    barcode: "6001001012",
    category: "Beverages",
    costPrice: 6.50,
    price: 9.00,
    stock: 36,
    unit: "can",
    image: "🍺",
    reorderLevel: 12
  },
  {
    id: "prod_13",
    name: "Alvaro Pear Sparkling Drink 330ml",
    sku: "BVG-ALV-330",
    barcode: "6001001013",
    category: "Beverages",
    costPrice: 5.50,
    price: 7.50,
    stock: 30,
    unit: "bottle",
    image: "🍐",
    reorderLevel: 10
  },
  {
    id: "prod_14",
    name: "Pure Heaven Red Grape Juice 1L",
    sku: "BVG-PH-1L",
    barcode: "6001001014",
    category: "Beverages",
    costPrice: 19.00,
    price: 25.00,
    stock: 14,
    unit: "carton",
    image: "🧃",
    reorderLevel: 6
  },
  {
    id: "prod_15",
    name: "Lucozade Boost Energy Drink 500ml",
    sku: "BVG-LUC-500",
    barcode: "6001001015",
    category: "Beverages",
    costPrice: 12.00,
    price: 16.00,
    stock: 25,
    unit: "bottle",
    image: "⚡",
    reorderLevel: 8
  },

  // Grains & Staples
  {
    id: "prod_16",
    name: "Royal Aroma Perfumed Jasmine Rice 5kg",
    sku: "STP-RCM-5KG",
    barcode: "6001001016",
    category: "Grains & Staples",
    costPrice: 110.00,
    price: 135.00,
    stock: 15,
    unit: "bag",
    image: "🍚",
    reorderLevel: 5
  },
  {
    id: "prod_17",
    name: "Gino Perfumed Rice 5kg",
    sku: "STP-GIN-5KG",
    barcode: "6001001017",
    category: "Grains & Staples",
    costPrice: 105.00,
    price: 128.00,
    stock: 12,
    unit: "bag",
    image: "🍚",
    reorderLevel: 4
  },
  {
    id: "prod_18",
    name: "Frytol Pure Vegetable Cooking Oil 1L",
    sku: "STP-FRY-1L",
    barcode: "6001001018",
    category: "Grains & Staples",
    costPrice: 34.00,
    price: 42.00,
    stock: 22,
    unit: "bottle",
    image: "🌻",
    reorderLevel: 8
  },
  {
    id: "prod_19",
    name: "Frytol Cooking Oil 2L Jug",
    sku: "STP-FRY-2L",
    barcode: "6001001019",
    category: "Grains & Staples",
    costPrice: 65.00,
    price: 78.00,
    stock: 9, // Low stock example
    unit: "jug",
    image: "🌻",
    reorderLevel: 10
  },
  {
    id: "prod_20",
    name: "Gino Concentrated Tomato Paste 70g Sachet",
    sku: "STP-GTP-70",
    barcode: "6001001020",
    category: "Grains & Staples",
    costPrice: 3.20,
    price: 4.50,
    stock: 120,
    unit: "sachet",
    image: "🍅",
    reorderLevel: 40
  },
  {
    id: "prod_21",
    name: "Pomo Tomato Mix 400g Tin",
    sku: "STP-POM-400",
    barcode: "6001001021",
    category: "Grains & Staples",
    costPrice: 14.50,
    price: 18.50,
    stock: 32,
    unit: "can",
    image: "🥫",
    reorderLevel: 10
  },
  {
    id: "prod_22",
    name: "Delicious Spaghetti Pasta 500g",
    sku: "STP-SPG-500",
    barcode: "6001001022",
    category: "Grains & Staples",
    costPrice: 8.00,
    price: 11.00,
    stock: 58,
    unit: "pack",
    image: "🍝",
    reorderLevel: 20
  },
  {
    id: "prod_23",
    name: "Annapurna Iodized Salt 1kg",
    sku: "STP-SLT-1KG",
    barcode: "6001001023",
    category: "Grains & Staples",
    costPrice: 6.00,
    price: 8.50,
    stock: 40,
    unit: "pack",
    image: "🧂",
    reorderLevel: 15
  },
  {
    id: "prod_24",
    name: "Ijebu Crispy Gari 1kg Pack",
    sku: "STP-GAR-1KG",
    barcode: "6001001024",
    category: "Grains & Staples",
    costPrice: 12.00,
    price: 16.00,
    stock: 24,
    unit: "pack",
    image: "🌾",
    reorderLevel: 8
  },

  // Canned Foods
  {
    id: "prod_25",
    name: "Titus Sardines in Vegetable Oil 125g",
    sku: "CAN-TIT-125",
    barcode: "6001001025",
    category: "Canned Foods",
    costPrice: 9.00,
    price: 12.50,
    stock: 60,
    unit: "can",
    image: "🐟",
    reorderLevel: 20
  },
  {
    id: "prod_26",
    name: "Geisha Mackerel in Tomato Sauce 425g",
    sku: "CAN-GSH-425",
    barcode: "6001001026",
    category: "Canned Foods",
    costPrice: 17.50,
    price: 22.00,
    stock: 28,
    unit: "can",
    image: "🐟",
    reorderLevel: 10
  },
  {
    id: "prod_27",
    name: "Exeter Corned Beef 340g",
    sku: "CAN-EXT-340",
    barcode: "6001001027",
    category: "Canned Foods",
    costPrice: 38.00,
    price: 46.00,
    stock: 16,
    unit: "can",
    image: "🥩",
    reorderLevel: 6
  },
  {
    id: "prod_28",
    name: "Heinz Baked Beans in Tomato Sauce 415g",
    sku: "CAN-HNZ-415",
    barcode: "6001001028",
    category: "Canned Foods",
    costPrice: 16.00,
    price: 21.00,
    stock: 20,
    unit: "can",
    image: "🥫",
    reorderLevel: 8
  },

  // Snacks & Biscuits
  {
    id: "prod_29",
    name: "McVities Digestive Biscuits 250g",
    sku: "SNK-MCV-250",
    barcode: "6001001029",
    category: "Snacks & Biscuits",
    costPrice: 15.00,
    price: 19.50,
    stock: 34,
    unit: "pack",
    image: "🍪",
    reorderLevel: 10
  },
  {
    id: "prod_30",
    name: "Beloxxi Cream Crackers 3-in-1 Pack",
    sku: "SNK-BLX-3PK",
    barcode: "6001001030",
    category: "Snacks & Biscuits",
    costPrice: 6.50,
    price: 9.00,
    stock: 45,
    unit: "pack",
    image: "🍘",
    reorderLevel: 15
  },
  {
    id: "prod_31",
    name: "Pringles Sour Cream & Onion 165g",
    sku: "SNK-PRG-165",
    barcode: "6001001031",
    category: "Snacks & Biscuits",
    costPrice: 24.00,
    price: 32.00,
    stock: 14,
    unit: "tube",
    image: "🥔",
    reorderLevel: 5
  },
  {
    id: "prod_32",
    name: "Choco Milo Chocolate Cubes 100pk",
    sku: "SNK-CHM-100",
    barcode: "6001001032",
    category: "Snacks & Biscuits",
    costPrice: 28.00,
    price: 36.00,
    stock: 18,
    unit: "pack",
    image: "🍫",
    reorderLevel: 5
  },
  {
    id: "prod_33",
    name: "Crispy Sweet Plantain Chips 150g",
    sku: "SNK-PLC-150",
    barcode: "6001001033",
    category: "Snacks & Biscuits",
    costPrice: 7.00,
    price: 10.00,
    stock: 26,
    unit: "pack",
    image: "🍌",
    reorderLevel: 10
  },

  // Toiletries & Hygiene
  {
    id: "prod_34",
    name: "Geisha Herbal Beauty Soap 180g",
    sku: "TOI-GSH-180",
    barcode: "6001001034",
    category: "Toiletries & Hygiene",
    costPrice: 7.50,
    price: 10.00,
    stock: 52,
    unit: "bar",
    image: "🧼",
    reorderLevel: 18
  },
  {
    id: "prod_35",
    name: "Dettol Antiseptic Liquid 250ml",
    sku: "TOI-DTL-250",
    barcode: "6001001035",
    category: "Toiletries & Hygiene",
    costPrice: 28.00,
    price: 35.00,
    stock: 16,
    unit: "bottle",
    image: "🧴",
    reorderLevel: 6
  },
  {
    id: "prod_36",
    name: "Pepsodent Triple Protection Toothpaste 140g",
    sku: "TOI-PEP-140",
    barcode: "6001001036",
    category: "Toiletries & Hygiene",
    costPrice: 12.00,
    price: 16.00,
    stock: 38,
    unit: "tube",
    image: "🪥",
    reorderLevel: 12
  },
  {
    id: "prod_37",
    name: "Nivea Men Cool Kick Roll-On 50ml",
    sku: "TOI-NIV-50",
    barcode: "6001001037",
    category: "Toiletries & Hygiene",
    costPrice: 22.00,
    price: 29.00,
    stock: 11,
    unit: "roll-on",
    image: "🧴",
    reorderLevel: 5
  },
  {
    id: "prod_38",
    name: "Kleenex Velvet 2-Ply Toilet Rolls 4-Pack",
    sku: "TOI-KLX-4PK",
    barcode: "6001001038",
    category: "Toiletries & Hygiene",
    costPrice: 25.00,
    price: 32.00,
    stock: 22,
    unit: "pack",
    image: "🧻",
    reorderLevel: 8
  },

  // Cleaning & Laundry
  {
    id: "prod_39",
    name: "Omo Active Fresh Detergent Powder 1kg",
    sku: "CLN-OMO-1KG",
    barcode: "6001001039",
    category: "Cleaning & Laundry",
    costPrice: 29.00,
    price: 37.00,
    stock: 19,
    unit: "pack",
    image: "🧺",
    reorderLevel: 6
  },
  {
    id: "prod_40",
    name: "Sunlight Lemon Dishwashing Liquid 750ml",
    sku: "CLN-SNL-750",
    barcode: "6001001040",
    category: "Cleaning & Laundry",
    costPrice: 18.00,
    price: 24.00,
    stock: 5, // Alert low stock
    unit: "bottle",
    image: "🧴",
    reorderLevel: 10
  }
];

const INITIAL_CUSTOMERS = [
  {
    id: "cust_01",
    name: "Eunice Addo",
    phone: "+233 24 555 1212",
    email: "eunice.addo@gmail.com",
    points: 120,
    balanceDebt: 0.00,
    totalSpent: 1420.50,
    visits: 14
  },
  {
    id: "cust_02",
    name: "Kofi Annan Jr.",
    phone: "+233 20 888 3344",
    email: "kofi.annan@yahoo.com",
    points: 85,
    balanceDebt: 25.00,
    totalSpent: 860.00,
    visits: 9
  },
  {
    id: "cust_03",
    name: "Grace Osei",
    phone: "+233 55 777 9900",
    email: "grace.osei@outlook.com",
    points: 210,
    balanceDebt: 0.00,
    totalSpent: 2650.00,
    visits: 23
  },
  {
    id: "cust_04",
    name: "Samuel Boadu",
    phone: "+233 27 333 4455",
    email: "boadu.sam@gmail.com",
    points: 40,
    balanceDebt: 0.00,
    totalSpent: 410.00,
    visits: 5
  },
  {
    id: "cust_walkin",
    name: "Walk-in Customer",
    phone: "N/A",
    email: "",
    points: 0,
    balanceDebt: 0.00,
    totalSpent: 0.00,
    visits: 0
  }
];

// Helper to generate 14 days of realistic sales history
function generate14DaysSalesHistory() {
  const sales = [];
  const cashiers = [
    { name: "Kojo Frimpong", id: "staff_3" },
    { name: "Abena Ofori", id: "staff_4" }
  ];
  const paymentMethods = ["Cash", "Mobile Money", "Card", "Split"];
  const paymentMethodWeights = [0.45, 0.40, 0.10, 0.05];

  const now = new Date();
  let receiptCounter = 10001;

  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const saleDate = new Date(now);
    saleDate.setDate(now.getDate() - dayOffset);

    // Number of transactions per day varies realistically between 6 and 14
    const txCount = Math.floor(Math.random() * 8) + 7;

    for (let t = 0; t < txCount; t++) {
      const txTime = new Date(saleDate);
      // Hours between 8:30 AM and 8:30 PM
      txTime.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
      const customer = INITIAL_CUSTOMERS[Math.floor(Math.random() * INITIAL_CUSTOMERS.length)];

      // Pick 1 to 5 random products for this transaction
      const itemCount = Math.floor(Math.random() * 4) + 1;
      const items = [];
      let subtotal = 0;

      const shuffledProds = [...INITIAL_PRODUCTS].sort(() => 0.5 - Math.random());
      for (let i = 0; i < itemCount; i++) {
        const p = shuffledProds[i];
        const qty = Math.floor(Math.random() * 3) + 1;
        const lineTotal = p.price * qty;
        subtotal += lineTotal;
        items.push({
          productId: p.id,
          name: p.name,
          price: p.price,
          costPrice: p.costPrice,
          quantity: qty,
          total: lineTotal
        });
      }

      const taxRate = 0.035;
      const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
      const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

      // Weighted payment method
      const rand = Math.random();
      let method = "Cash";
      if (rand < 0.45) method = "Cash";
      else if (rand < 0.85) method = "Mobile Money";
      else if (rand < 0.95) method = "Card";
      else method = "Split";

      sales.push({
        id: `TX-${receiptCounter}`,
        receiptNumber: `REC-${receiptCounter}`,
        timestamp: txTime.toISOString(),
        dateStr: txTime.toLocaleDateString("en-GB"),
        timeStr: txTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dayOffset: dayOffset,
        cashierId: cashier.id,
        cashierName: cashier.name,
        customerId: customer.id,
        customerName: customer.name,
        items: items,
        subtotal: subtotal,
        tax: taxAmount,
        discount: 0,
        total: totalAmount,
        paymentMethod: method,
        status: "Completed",
        tendered: method === "Cash" ? Math.ceil(totalAmount / 10) * 10 : totalAmount,
        change: method === "Cash" ? (Math.ceil(totalAmount / 10) * 10) - totalAmount : 0
      });

      receiptCounter++;
    }
  }

  return sales;
}

const INITIAL_AUDIT_LOGS = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    staffName: "Ama Boateng",
    role: "Inventory Manager",
    action: "Stock Intake",
    details: "Added 24 units to Voltic Natural Spring Water 1.5L from Supplier Accra Bottling"
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    staffName: "Kwame Asante",
    role: "Business Owner",
    action: "Price Update",
    details: "Changed Royal Aroma Perfumed Jasmine Rice 5kg price from GH₵ 130.00 to GH₵ 135.00"
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    staffName: "Akosua Mensah",
    role: "General Manager",
    action: "Staff Access",
    details: "Updated shift schedule for cashiers Kojo Frimpong and Abena Ofori"
  },
  {
    id: "log_4",
    timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
    staffName: "Yaw Darkwa",
    role: "Accountant",
    action: "Cash Reconciliation",
    details: "Completed daily Z-Report. Cash variance: +GH₵ 2.50 (balanced)"
  }
];
