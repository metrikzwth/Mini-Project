// MediCare AI Platform - Mock Data Store

export interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  stock: number;
  instructions: {
    timing: "before_food" | "after_food" | "with_food" | "anytime";
    drinkWith: string;
    foodsToAvoid: string[];
    dosageTiming: string;
    precautions: string[];
  };
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  availability: string[];
  image: string;
  fee: number;
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  type: "video" | "in-person";
  notes?: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  items: {
    medicineId: string;
    medicineName: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  orderDate: string;
  deliveryAddress: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
    instructions: string;
  }[];
  diagnosis: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "patient" | "doctor" | "admin";
  phone?: string;
  address?: string;
}

// Initial mock data
export const initialMedicines: Medicine[] = [
  {
    id: "1",
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    price: 5.99,
    description: "Effective pain reliever and fever reducer",
    image: "/placeholder.svg",
    stock: 150,
    instructions: {
      timing: "after_food",
      drinkWith: "Water - avoid alcohol",
      foodsToAvoid: ["Alcohol", "Caffeine in excess"],
      dosageTiming: "Every 4-6 hours as needed",
      precautions: [
        "Do not exceed 4g in 24 hours",
        "Consult doctor if symptoms persist",
      ],
    },
  },
  {
    id: "2",
    name: "Amoxicillin 250mg",
    category: "Antibiotics",
    price: 12.99,
    description: "Broad-spectrum antibiotic for bacterial infections",
    image: "/placeholder.svg",
    stock: 80,
    instructions: {
      timing: "before_food",
      drinkWith: "Water - full glass",
      foodsToAvoid: ["Dairy products within 2 hours"],
      dosageTiming: "Every 8 hours for prescribed duration",
      precautions: ["Complete full course", "May cause stomach upset"],
    },
  },
  {
    id: "3",
    name: "Omeprazole 20mg",
    category: "Digestive Health",
    price: 8.49,
    description: "Reduces stomach acid production",
    image: "/placeholder.svg",
    stock: 120,
    instructions: {
      timing: "before_food",
      drinkWith: "Water - 30 minutes before meals",
      foodsToAvoid: ["Spicy foods", "Citrus fruits"],
      dosageTiming: "Once daily in the morning",
      precautions: [
        "Do not crush or chew",
        "Long-term use requires monitoring",
      ],
    },
  },
  {
    id: "4",
    name: "Cetirizine 10mg",
    category: "Allergy Relief",
    price: 6.99,
    description: "Non-drowsy antihistamine for allergies",
    image: "/placeholder.svg",
    stock: 200,
    instructions: {
      timing: "anytime",
      drinkWith: "Water",
      foodsToAvoid: ["Grapefruit juice"],
      dosageTiming: "Once daily, preferably at night",
      precautions: ["May cause drowsiness in some", "Avoid alcohol"],
    },
  },
  {
    id: "5",
    name: "Metformin 500mg",
    category: "Diabetes Care",
    price: 9.99,
    description: "Blood sugar management medication",
    image: "/placeholder.svg",
    stock: 90,
    instructions: {
      timing: "with_food",
      drinkWith: "Water - with meals",
      foodsToAvoid: ["Excessive sugar", "Alcohol"],
      dosageTiming: "With breakfast and dinner",
      precautions: ["Monitor blood sugar regularly", "Stay hydrated"],
    },
  },
  {
    id: "6",
    name: "Vitamin D3 1000IU",
    category: "Vitamins",
    price: 14.99,
    description: "Essential vitamin for bone health",
    image: "/placeholder.svg",
    stock: 250,
    instructions: {
      timing: "with_food",
      drinkWith: "Water or milk",
      foodsToAvoid: [],
      dosageTiming: "Once daily with a meal containing fat",
      precautions: [
        "Do not exceed recommended dose",
        "May interact with certain medications",
      ],
    },
  },
];

export const initialDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialization: "General Physician",
    experience: 12,
    rating: 4.8,
    availability: ["Monday", "Tuesday", "Wednesday", "Friday"],
    image: "/placeholder.svg",
    fee: 50,
    isActive: true,
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialization: "Cardiologist",
    experience: 15,
    rating: 4.9,
    availability: ["Monday", "Wednesday", "Thursday"],
    image: "/placeholder.svg",
    fee: 80,
    isActive: true,
  },
  {
    id: "3",
    name: "Dr. Emily Williams",
    specialization: "Dermatologist",
    experience: 8,
    rating: 4.7,
    availability: ["Tuesday", "Thursday", "Friday"],
    image: "/placeholder.svg",
    fee: 65,
    isActive: true,
  },
  {
    id: "4",
    name: "Dr. James Anderson",
    specialization: "Pediatrician",
    experience: 10,
    rating: 4.9,
    availability: ["Monday", "Tuesday", "Thursday", "Friday"],
    image: "/placeholder.svg",
    fee: 55,
    isActive: true,
  },
  {
    id: "5",
    name: "Dr. Lisa Martinez",
    specialization: "Neurologist",
    experience: 18,
    rating: 4.8,
    availability: ["Wednesday", "Thursday", "Friday"],
    image: "/placeholder.svg",
    fee: 90,
    isActive: true,
  },
];

export const initialUsers: User[] = [
  {
    id: "p1",
    email: "patient@test.com",
    password: "patient123",
    name: "John Patient",
    role: "patient",
    phone: "555-0101",
    address: "123 Health St, Medical City",
  },
  {
    id: "p2",
    email: "jane@test.com",
    password: "jane123",
    name: "Jane Doe",
    role: "patient",
    phone: "555-0102",
    address: "456 Care Ave, Wellness Town",
  },
  {
    id: "d1",
    email: "doctor@test.com",
    password: "doctor123",
    name: "Dr. Sarah Johnson",
    role: "doctor",
  },
  {
    id: "d2",
    email: "drchen@test.com",
    password: "chen123",
    name: "Dr. Michael Chen",
    role: "doctor",
  },
  {
    id: "a1",
    email: "admin@test.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
];

// Chatbot knowledge base
export const chatbotKnowledge = {
  medicines: initialMedicines.reduce(
    (acc, med) => {
      acc[med.name.toLowerCase()] = med.instructions;
      return acc;
    },
    {} as Record<string, Medicine["instructions"]>,
  ),

  generalTips: [
    "Always read the medicine label carefully before taking any medication.",
    "Store medicines in a cool, dry place away from direct sunlight.",
    "Never share your prescription medications with others.",
    "Keep all medicines out of reach of children.",
    "If you miss a dose, do not double up - consult your doctor or pharmacist.",
    "Always complete the full course of antibiotics as prescribed.",
  ],

  disclaimer:
    "⚠️ This chatbot provides general information only and does not replace professional medical advice. Always consult with your healthcare provider for personalized medical guidance.",
};

// Storage keys
const STORAGE_KEYS = {
  MEDICINES: "medicare_medicines",
  DOCTORS: "medicare_doctors",
  APPOINTMENTS: "medicare_appointments",
  ORDERS: "medicare_orders",
  PRESCRIPTIONS: "medicare_prescriptions",
  USERS: "medicare_users",
  CURRENT_USER: "medicare_current_user",
  CART: "medicare_cart",
};

// Data access functions
export const getData = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};

export const setData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize data if not present
export const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.MEDICINES)) {
    setData(STORAGE_KEYS.MEDICINES, initialMedicines);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
    setData(STORAGE_KEYS.DOCTORS, initialDoctors);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setData(STORAGE_KEYS.USERS, initialUsers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
    setData(STORAGE_KEYS.APPOINTMENTS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    setData(STORAGE_KEYS.ORDERS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS)) {
    setData(STORAGE_KEYS.PRESCRIPTIONS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CART)) {
    setData(STORAGE_KEYS.CART, []);
  }
};

// Export storage keys for use in components
export { STORAGE_KEYS };
