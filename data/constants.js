// data/constants.js

export const DEFAULT_CATEGORIES = [
  {
    id: '0',
    name: 'Income',
    subcategories: [
      'Alimony', 'Bonuses', 'Child Support', 'Commissions',
      'Government Assistance', 'Salary/Wages',
    ],
  },
  {
    id: '1',
    name: 'Spiritual',
    subcategories: [
      "7th Traditions", "Books", "Classes/Workshops", "DA/AA Literature",
      "Other Donations", "Tapes/CDs", "Tithing",
    ],
  },
  {
    id: '2',
    name: 'Housing',
    subcategories: [
      "Association Fees", "Cable Television", "House Cleaning/Contract Labor",
      "Decorating", "Electricity", "Furniture", "Gardening Service", "Heat",
      "Insurance", "Maintenance/Upkeep", "Moving", "Rent/Mortgage",
      "Sanitation", "Storage", "Telephone", "Water",
    ],
  },
  {
    id: '3',
    name: 'Food',
    subcategories: [
      "Bottled Water", "Coffee", "Dining Out", "Fast Food", "Groceries",
      "Party Food", "Snacks", "Soft Drinks",
    ],
  },
  {
    id: '4',
    name: 'Transportation',
    subcategories: [
      "Airfare", "Car Payment", "Car Insurance", "Car Rental", "Gas",
      "Maintenance", "Oil/Lube", "Parking", "Parking Tickets", "Public Transit",
      "Registration", "Repairs", "Taxicabs", "Trains",
    ],
  },
  {
    id: '5',
    name: 'Clothing',
    subcategories: [
      "Accessories", "Alterations", "Apparel", "Dry Cleaning", "Jewelry",
      "Jewelry Repair", "Laundry", "Shoes", "Shoe Repair",
    ],
  },
  {
    id: '6',
    name: 'Personal Care',
    subcategories: [
      "Cosmetics", "Gym Memberships", "Haircuts", "Manicure", "Massage",
      "Pedicure", "Toiletries",
    ],
  },
  {
    id: '7',
    name: 'Health Care',
    subcategories: [
      "Chiropractor", "Dental Insurance", "Dentist", "Disability Insurance",
      "Eye Care", "Foot Care", "Glasses/Contacts", "Health Insurance",
      "Hospitalization", "Long Term Care Insurance", "Physician",
      "Prescriptions/Rx", "Psychiatry", "Therapy", "Vision Insurance",
    ],
  },
  {
    id: '8',
    name: 'Dependent Care',
    subcategories: [
      "Alimony", "Child Care", "Clothing", "Day Care", "Elder Care",
      "Family Events", "Food", "Insurance", "Pet Care", "School",
      "Sitters", "Transportation", "Veterinarian",
    ],
  },
  {
    id: '9',
    name: 'Entertainment',
    subcategories: [
      "Arcades/Games", "Books", "Club/Dancing", "Concerts", "Dates",
      "Hobbies", "Houseguests", "Magazines", "Movies", "Movie Purchases",
      "Movie Rentals", "Newspaper", "Sightseeing", "Theatre",
    ],
  },
  {
    id: '10',
    name: 'Education',
    subcategories: [
      "Books", "Parking", "Seminars/Workshops", "Supplies", "Travel", "Tuition",
    ],
  },
  {
    id: '11',
    name: 'Vacations',
    subcategories: [
      "Airfare", "Boat Fare", "Bus Fare", "Lodging", "Meals",
      "Sightseeing", "Souvenirs", "Taxi Fare", "Tips", "Train Fare",
    ],
  },
  {
    id: '12',
    name: 'Personal Business',
    subcategories: [
      "Banking Fees", "Business Services", "Cell Phone", "Computer", "Faxes",
      "Legal Fees", "Online/Internet", "Pager", "Photocopies", "Postage",
      "Supplies", "Telephone Calls", "Trade Publications", "Voice Mail",
    ],
  },
  {
    id: '13',
    name: 'Gifts',
    subcategories: [
      "Anniversaries", "Baby Showers", "Birthdays", "Cards",
      "Holidays", "Weddings", "Work", "Gifts",
    ],
  },
  {
    id: '14',
    name: 'Investments',
    subcategories: ["Contributions", "IRA", "401K"],
  },
  {
    id: '15',
    name: 'Taxes',
    subcategories: [
      "Federal Tax", "FICA", "Local Tax", "Medicare",
      "Property Tax", "SDI", "SSI", "State Tax",
    ],
  },
  {
    id: '16',
    name: 'Debt Repayment',
    subcategories: ["Payments"],
  },
  {
    id: 'savings',
    name: 'Savings',
    subcategories: ['Emergency Fund', 'Vacation Fund', 'Home Fund', 'Retirement'],
  },
];

export const PLAN_TIERS = ['Ideal', 'Realistic', 'Mini'];

export const TIER_META = {
  Ideal: {
    label:   'Ideal',
    eyebrow: 'IF ALL GOES WELL',
    color:   '#7a9e8e',
    lightBg: 'rgba(122, 158, 142, 0.12)',
  },
  Realistic: {
    label:   'Realistic',
    eyebrow: 'MOST MONTHS',
    color:   '#9e6b72',
    lightBg: 'rgba(158, 107, 114, 0.10)',
  },
  Mini: {
    label:   'Mini',
    eyebrow: 'BARE MINIMUM',
    color:   '#b89060',
    lightBg: 'rgba(184, 144, 96, 0.10)',
  },
};

export const STORAGE_KEYS = {
  categories:      'numbers_categories',
  idealCategories: 'numbers_ideal_categories',
  miniCategories:  'numbers_mini_categories',
  plan:            'numbers_plan',
  planOverrides:   'numbers_plan_overrides',
  planVersions:    'numbers_plan_versions',
  purchases:       'numbers_purchases',
  bankBalance:     'numbers_bank_balance',
  bills:           'numbers_bills',
  savingsGoals:    'numbers_savings_goals',
};

export const BDA_STORAGE_KEYS = {
  categories:      'bda_categories',
  idealCategories: 'bda_ideal_categories',
  miniCategories:  'bda_mini_categories',
  plan:            'bda_plan',
  planOverrides:   'bda_plan_overrides',
  planVersions:    'bda_plan_versions',
  purchases:       'bda_purchases',
  bankBalance:     'bda_bank_balance',
  bills:           'bda_bills',
  savingsGoals:    'bda_savings_goals',
};

export const DEFAULT_BDA_CATEGORIES = [
  {
    id: 'b0',
    name: 'Revenue',
    subcategories: [
      'Sales/Products', 'Services Rendered', 'Consulting/Freelance',
      'Commissions', 'Royalties', 'Grants', 'Interest Income', 'Other Revenue',
    ],
  },
  {
    id: 'b1',
    name: 'Cost of Goods',
    subcategories: [
      'Raw Materials', 'Inventory', 'Manufacturing', 'Packaging',
      'Shipping/Fulfillment', 'Returns/Refunds',
    ],
  },
  {
    id: 'b2',
    name: 'Payroll & Contractors',
    subcategories: [
      'Salaries', 'Hourly Wages', 'Contractor/Freelancer',
      'Benefits', 'Bonuses', 'Payroll Taxes',
    ],
  },
  {
    id: 'b3',
    name: 'Facilities',
    subcategories: [
      'Rent/Lease', 'Utilities', 'Electricity', 'Internet/Phone',
      'Maintenance', 'Cleaning', 'Security', 'Storage',
    ],
  },
  {
    id: 'b4',
    name: 'Marketing & Sales',
    subcategories: [
      'Advertising', 'Website/Domain', 'Social Media Ads', 'Print Materials',
      'Photography/Video', 'Events', 'Sponsorships', 'PR/Press',
    ],
  },
  {
    id: 'b5',
    name: 'Technology',
    subcategories: [
      'Software Subscriptions', 'Hardware', 'Cloud Services',
      'App Development', 'IT Support', 'Phone/Data',
    ],
  },
  {
    id: 'b6',
    name: 'Professional Services',
    subcategories: [
      'Accounting/Bookkeeping', 'Legal Fees', 'Business Consulting',
      'HR Services', 'Financial Advisor',
    ],
  },
  {
    id: 'b7',
    name: 'Travel & Transport',
    subcategories: [
      'Airfare', 'Car/Mileage', 'Lodging', 'Client Meals',
      'Public Transit', 'Parking', 'Car Rental', 'Tips',
    ],
  },
  {
    id: 'b8',
    name: 'Office & Admin',
    subcategories: [
      'Office Supplies', 'Paper/Printing', 'Postage',
      'Stationery', 'Furniture', 'Small Equipment',
    ],
  },
  {
    id: 'b9',
    name: 'Education & Training',
    subcategories: [
      'Courses/Classes', 'Books', 'Conferences',
      'Workshops', 'Certifications', 'Memberships',
    ],
  },
  {
    id: 'b10',
    name: 'Insurance',
    subcategories: [
      'General Liability', 'Professional Liability', 'Property Insurance',
      'Workers Comp', 'Health Insurance',
    ],
  },
  {
    id: 'b11',
    name: 'Banking & Finance',
    subcategories: [
      'Bank Fees', 'Merchant/Processing Fees', 'Interest Charges',
      'Wire Transfers', 'Overdraft Fees',
    ],
  },
  {
    id: 'b12',
    name: 'Taxes',
    subcategories: [
      'Federal Income Tax', 'State Income Tax', 'Self-Employment Tax',
      'Sales Tax', 'Property Tax', 'Estimated Payments',
    ],
  },
  {
    id: 'b13',
    name: 'Debt Repayment',
    subcategories: [
      'Business Loan', 'Line of Credit', 'Credit Card',
      'Equipment Financing', 'SBA Loan',
    ],
  },
  {
    id: 'b14',
    name: 'Investments & Savings',
    subcategories: [
      'Business Savings', 'SEP-IRA/Retirement', 'Equipment Purchase', 'Emergency Fund',
    ],
  },
  {
    id: 'b15',
    name: "Owner's Draw",
    subcategories: [
      "Personal Salary", "Owner's Draw", 'Distributions', 'Profit Share',
    ],
  },
  {
    id: 'b16',
    name: 'Miscellaneous',
    subcategories: [
      'Client Gifts', 'Charitable Donations', 'Community Events',
      'Uncategorized', 'Other Expenses',
    ],
  },
];