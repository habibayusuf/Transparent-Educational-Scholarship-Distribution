import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract interactions
const mockDonors = new Map();
const mockFunds = new Map();
const mockDonations = new Map();
let donationCounter = 0;
let fundCounter = 0;

// Mock contract functions
const donorManagement = {
  registerAsDonor: vi.fn((sender) => {
    if (mockDonors.has(sender)) {
      return { err: 1 };
    }
    mockDonors.set(sender, {
      totalDonated: 0,
      lastDonationAmount: 0,
      lastDonationTime: 0,
      active: true
    });
    return { ok: true };
  }),
  
  createScholarshipFund: vi.fn((sender, fundName) => {
    fundCounter++;
    mockFunds.set(fundCounter, {
      fundName,
      totalBalance: 0,
      active: true,
      createdBy: sender
    });
    return { ok: true };
  }),
  
  donateToFund: vi.fn((sender, fundId, amount) => {
    if (!mockDonors.has(sender) || !mockFunds.has(fundId)) {
      return { err: 2 };
    }
    
    const donorInfo = mockDonors.get(sender);
    const fundInfo = mockFunds.get(fundId);
    
    donationCounter++;
    const currentTime = Date.now();
    
    mockDonations.set(donationCounter, {
      donor: sender,
      fundId,
      amount,
      timestamp: currentTime
    });
    
    mockDonors.set(sender, {
      ...donorInfo,
      totalDonated: donorInfo.totalDonated + amount,
      lastDonationAmount: amount,
      lastDonationTime: currentTime
    });
    
    mockFunds.set(fundId, {
      ...fundInfo,
      totalBalance: fundInfo.totalBalance + amount
    });
    
    return { ok: donationCounter };
  }),
  
  getDonorInfo: vi.fn((donorId) => {
    return mockDonors.has(donorId) ? { some: mockDonors.get(donorId) } : { none: null };
  }),
  
  getFundInfo: vi.fn((fundId) => {
    return mockFunds.has(fundId) ? { some: mockFunds.get(fundId) } : { none: null };
  }),
  
  getDonationInfo: vi.fn((donationId) => {
    return mockDonations.has(donationId) ? { some: mockDonations.get(donationId) } : { none: null };
  }),
  
  deactivateDonor: vi.fn((sender) => {
    if (!mockDonors.has(sender)) {
      return { err: 3 };
    }
    
    const donorInfo = mockDonors.get(sender);
    mockDonors.set(sender, {
      ...donorInfo,
      active: false
    });
    
    return { ok: true };
  })
};

describe('Donor Management Contract', () => {
  beforeEach(() => {
    mockDonors.clear();
    mockFunds.clear();
    mockDonations.clear();
    donationCounter = 0;
    fundCounter = 0;
    
    // Reset mock function calls
    vi.clearAllMocks();
  });
  
  describe('registerAsDonor', () => {
    it('should register a new donor successfully', () => {
      const sender = 'donor1';
      const result = donorManagement.registerAsDonor(sender);
      
      expect(result).toEqual({ ok: true });
      expect(mockDonors.has(sender)).toBe(true);
      expect(mockDonors.get(sender)).toEqual({
        totalDonated: 0,
        lastDonationAmount: 0,
        lastDonationTime: 0,
        active: true
      });
    });
    
    it('should fail if donor is already registered', () => {
      const sender = 'donor1';
      donorManagement.registerAsDonor(sender);
      const result = donorManagement.registerAsDonor(sender);
      
      expect(result).toEqual({ err: 1 });
    });
  });
  
  describe('createScholarshipFund', () => {
    it('should create a new scholarship fund', () => {
      const sender = 'creator1';
      const fundName = 'STEM Scholarship';
      const result = donorManagement.createScholarshipFund(sender, fundName);
      
      expect(result).toEqual({ ok: true });
      expect(mockFunds.has(1)).toBe(true);
      expect(mockFunds.get(1)).toEqual({
        fundName,
        totalBalance: 0,
        active: true,
        createdBy: sender
      });
    });
  });
  
  describe('donateToFund', () => {
    it('should process a donation successfully', () => {
      const sender = 'donor1';
      const fundId = 1;
      const amount = 1000;
      
      donorManagement.registerAsDonor(sender);
      donorManagement.createScholarshipFund('creator1', 'STEM Scholarship');
      
      const result = donorManagement.donateToFund(sender, fundId, amount);
      
      expect(result).toEqual({ ok: 1 });
      expect(mockDonations.has(1)).toBe(true);
      
      const donorInfo = donorManagement.getDonorInfo(sender).some;
      expect(donorInfo.totalDonated).toBe(amount);
      expect(donorInfo.lastDonationAmount).toBe(amount);
      
      const fundInfo = donorManagement.getFundInfo(fundId).some;
      expect(fundInfo.totalBalance).toBe(amount);
    });
    
    it('should fail if donor is not registered', () => {
      const sender = 'unregistered';
      const fundId = 1;
      const amount = 1000;
      
      donorManagement.createScholarshipFund('creator1', 'STEM Scholarship');
      
      const result = donorManagement.donateToFund(sender, fundId, amount);
      
      expect(result).toEqual({ err: 2 });
    });
    
    it('should fail if fund does not exist', () => {
      const sender = 'donor1';
      const fundId = 999;
      const amount = 1000;
      
      donorManagement.registerAsDonor(sender);
      
      const result = donorManagement.donateToFund(sender, fundId, amount);
      
      expect(result).toEqual({ err: 2 });
    });
  });
  
  describe('deactivateDonor', () => {
    it('should deactivate a donor', () => {
      const sender = 'donor1';
      
      donorManagement.registerAsDonor(sender);
      const result = donorManagement.deactivateDonor(sender);
      
      expect(result).toEqual({ ok: true });
      expect(donorManagement.getDonorInfo(sender).some.active).toBe(false);
    });
    
    it('should fail if donor does not exist', () => {
      const sender = 'nonexistent';
      const result = donorManagement.deactivateDonor(sender);
      
      expect(result).toEqual({ err: 3 });
    });
  });
});
