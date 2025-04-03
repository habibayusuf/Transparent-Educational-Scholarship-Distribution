import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract interactions
const mockStudents = new Map();
const mockVerifiers = new Map();

// Mock contract functions
const studentVerification = {
  registerAsStudent: vi.fn((sender, name, institution, major, enrollmentYear, graduationYear) => {
    if (mockStudents.has(sender)) {
      return { err: 1 };
    }
    mockStudents.set(sender, {
      name,
      institution,
      major,
      enrollmentYear,
      graduationYear,
      verified: false
    });
    return { ok: true };
  }),
  
  registerAsVerifier: vi.fn((sender, name, institution) => {
    if (mockVerifiers.has(sender)) {
      return { err: 1 };
    }
    mockVerifiers.set(sender, {
      name,
      institution,
      active: true
    });
    return { ok: true };
  }),
  
  verifyStudent: vi.fn((verifier, studentId) => {
    if (!mockVerifiers.has(verifier) || !mockStudents.has(studentId)) {
      return { err: 2 };
    }
    
    const verifierInfo = mockVerifiers.get(verifier);
    if (!verifierInfo.active) {
      return { err: 2 };
    }
    
    const studentInfo = mockStudents.get(studentId);
    mockStudents.set(studentId, {
      ...studentInfo,
      verified: true
    });
    
    return { ok: true };
  }),
  
  updateStudentInfo: vi.fn((sender, name, institution, major, enrollmentYear, graduationYear) => {
    if (!mockStudents.has(sender)) {
      return { err: 3 };
    }
    
    mockStudents.set(sender, {
      name,
      institution,
      major,
      enrollmentYear,
      graduationYear,
      verified: false // Reset verification
    });
    
    return { ok: true };
  }),
  
  getStudentInfo: vi.fn((studentId) => {
    return mockStudents.has(studentId) ? { some: mockStudents.get(studentId) } : { none: null };
  }),
  
  getVerifierInfo: vi.fn((verifierId) => {
    return mockVerifiers.has(verifierId) ? { some: mockVerifiers.get(verifierId) } : { none: null };
  }),
  
  isVerifiedStudent: vi.fn((studentId) => {
    if (!mockStudents.has(studentId)) {
      return false;
    }
    return mockStudents.get(studentId).verified;
  })
};

describe('Student Verification Contract', () => {
  beforeEach(() => {
    mockStudents.clear();
    mockVerifiers.clear();
    
    // Reset mock function calls
    vi.clearAllMocks();
  });
  
  describe('registerAsStudent', () => {
    it('should register a new student successfully', () => {
      const sender = 'student1';
      const result = studentVerification.registerAsStudent(
          sender, 'John Doe', 'University of Example', 'Computer Science', 2020, 2024
      );
      
      expect(result).toEqual({ ok: true });
      expect(mockStudents.has(sender)).toBe(true);
      expect(mockStudents.get(sender)).toEqual({
        name: 'John Doe',
        institution: 'University of Example',
        major: 'Computer Science',
        enrollmentYear: 2020,
        graduationYear: 2024,
        verified: false
      });
    });
    
    it('should fail if student is already registered', () => {
      const sender = 'student1';
      studentVerification.registerAsStudent(
          sender, 'John Doe', 'University of Example', 'Computer Science', 2020, 2024
      );
      
      const result = studentVerification.registerAsStudent(
          sender, 'John Doe', 'University of Example', 'Computer Science', 2020, 2024
      );
      
      expect(result).toEqual({ err: 1 });
    });
  });
  
  describe('registerAsVerifier', () => {
    it('should register a new verifier successfully', () => {
      const sender = 'verifier1';
      const result = studentVerification.registerAsVerifier(
          sender, 'Prof. Smith', 'University of Example'
      );
      
      expect(result).toEqual({ ok: true });
      expect(mockVerifiers.has(sender)).toBe(true);
      expect(mockVerifiers.get(sender)).toEqual({
        name: 'Prof. Smith',
        institution: 'University of Example',
        active: true
      });
    });
    
    it('should fail if verifier is already registered', () => {
      const sender = 'verifier1';
      studentVerification.registerAsVerifier(
          sender, 'Prof. Smith', 'University of Example'
      );
      
      const result = studentVerification.registerAsVerifier(
          sender, 'Prof. Smith', 'University of Example'
      );
      
      expect(result).toEqual({ err: 1 });
    });
  });
  
  describe('verifyStudent', () => {
    it('should verify a student successfully', () => {
      const verifier = 'verifier1';
      const student = 'student1';
      
      studentVerification.registerAsVerifier(
          verifier, 'Prof. Smith', 'University of Example'
      );
      
      studentVerification.registerAsStudent(
          student, 'John Doe', 'University of Example', 'Computer Science', 2020, 2024
      );
      
      const result = studentVerification.verifyStudent(verifier, student);
      
      expect(result).toEqual({ ok: true });
      expect(studentVerification.isVerifiedStudent(student)).toBe(true);
    });
    
    it('should fail if verifier does not exist', () => {
      const verifier = 'nonexistent';
      const student = 'student1';
      
      studentVerification.registerAsStudent(
          student, 'John Doe', 'University of Example', 'Computer Science', 2020, 2024
      );
      
      const result = studentVerification.verifyStudent(verifier, student);
      
      expect(result).toEqual({ err: 2 });
      expect(studentVerification.isVerifiedStudent(student)).toBe(false);
    });
    
    it('should fail if student does not exist', () => {
      const verifier = 'verifier1';
      const student = 'nonexistent';
      
      studentVerification.registerAsVerifier(
          verifier, 'Prof. Smith', 'University of Example'
      );
      
      const result = studentVerification.verifyStudent(verifier, student);
      
      expect(result).toEqual({ err: 2 });
    });
  });
  
  describe('updateStudentInfo', () => {
    it('should update student information and reset verification', () => {
      const student = 'student1';
      
      studentVerification.registerAsStudent(
          student, 'John Doe', 'University of Example', 'Computer Science', 2020, 2024
      );
      
      const verifier = 'verifier1';
      studentVerification.registerAsVerifier(
          verifier, 'Prof. Smith', 'University of Example'
      );
      
      studentVerification.verifyStudent(verifier, student);
      expect(studentVerification.isVerifiedStudent(student)).toBe(true);
      
      const result = studentVerification.updateStudentInfo(
          student, 'John Doe', 'University of Example', 'Data Science', 2020, 2024
      );
      
      expect(result).toEqual({ ok: true });
      expect(studentVerification.getStudentInfo(student).some.major).toBe('Data Science');
      expect(studentVerification.isVerifiedStudent(student)).toBe(false);
    });
    
    it('should fail if student does not exist', () => {
      const student = 'nonexistent';
      
      const result = studentVerification.updateStudentInfo(
          student, 'John Doe', 'University of Example', 'Data Science', 2020, 2024
      );
      
      expect(result).toEqual({ err: 3 });
    });
  });
});
