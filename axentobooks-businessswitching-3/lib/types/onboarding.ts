export type BusinessInfo = {
  name: string;
  industry: string;
  registrationNumber?: string;
  taxId?: string;
};

export type FinancialGoal = {
  id?: string;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: Date;
  status?: string;
};

export type Asset = {
  id?: string;
  type: string;
  description: string;
  value: number;
  purchaseDate?: Date;
};

export type Liability = {
  id?: string;
  name: string;
  type: string;
  amount: number;
  dueDate?: Date;
};

export type Equity = {
  id?: string;
  type: string;
  amount: number;
  description?: string;
};

export type OnboardingData = {
  businessInfo: BusinessInfo;
  financialGoals: FinancialGoal[];
  assets: Asset[];
  liabilities: Liability[];
  equity: Equity[];
};
  businessInfo: BusinessInfo
  financialGoals: FinancialGoal[]
  assets: Asset[]
  liabilities: Liability[]
  equity: Equity[]
}

