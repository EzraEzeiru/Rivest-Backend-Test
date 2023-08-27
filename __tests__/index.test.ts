const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockFind = jest.fn();

jest.mock('typeorm', () => {
    console.log('Setting up TypeORM mock...');
    return {
        ...jest.requireActual('typeorm'),
        createConnection: jest.fn().mockResolvedValue({
            runMigrations: jest.fn().mockResolvedValueOnce(undefined), 
            manager: {
                findOne: mockFindOne,
                save: mockSave,
                find: mockFind
            },
        }),
        getConnectionManager: jest.fn(),
    };
});
  

// Mock entity setups
jest.mock('../src/entity/user.entity', () => {
    return { User: require('./mocks/entityMocks').User };
});

jest.mock('../src/entity/file.entity', () => {
    return { File: require('./mocks/entityMocks').File };
});

jest.mock('../src/entity/folder.entity', () => {
    return { Folder: require('./mocks/entityMocks').Folder };
});

// Import the app after all the mocks
import app from '../src/index';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as authMiddleware from '../src/authMiddleware';
import { Request, Response, NextFunction } from 'express';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../src/authMiddleware.ts', () => {
  return jest.fn().mockImplementation((req: Request, res: Response, next: NextFunction) => {
    next();
  });
});



describe('POST /register', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
        
        mockFindOne.mockResolvedValueOnce(null);
        mockSave.mockResolvedValueOnce({});
        (bcrypt.hashSync as jest.Mocked<any>).mockReturnValueOnce('hashed_password');

        const response = await request(app).post('/register').send({
            email: 'test@example.com',
            password: 'password',
            fullName: 'Test User',
            isAdmin: false,
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response text: ${response.text}`);

        expect(response.status).toBe(201);
        expect(response.text).toBe('User registered successfully!');
    });

    it('should return an error when a user already exists', async () => {

        mockFindOne.mockResolvedValueOnce({ email: 'test@example.com' });

        const response = await request(app).post('/register').send({
            email: 'test@example.com',
            password: 'password',
            fullName: 'Test User',
            isAdmin: false,
        });

        console.log(`Response status: ${response.status}`);
        console.log(`Response text: ${response.text}`);

        expect(response.status).toBe(400);
        expect(response.text).toBe('User already exists.');
    });

    it('should handle internal server errors', async () => {

        mockFindOne.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).post('/register').send({
            email: 'test@example.com',
            password: 'password',
            fullName: 'Test User',
            isAdmin: false,
        });

        expect(response.status).toBe(500);
        expect(response.text).toBe('Error registering user.');
    });
});

describe('POST /login', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should log in an existing user successfully', async () => {
        mockFindOne.mockResolvedValueOnce({
            email: 'test@example.com',
            password: 'hashed_password',
        });
        
        (bcrypt.compare as jest.Mocked<any>).mockReturnValueOnce(true);
        (jwt.sign as jest.Mocked<any>).mockReturnValueOnce('valid_token');

        const response = await request(app).post('/login').send({
            email: 'test@example.com',
            password: 'password',
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ token: 'valid_token' });
    });

    it('should return an error when a user is not found', async () => {
        mockFindOne.mockResolvedValueOnce(null);

        const response = await request(app).post('/login').send({
            email: 'test@example.com',
            password: 'password',
        });

        expect(response.status).toBe(400);
        expect(response.text).toBe('User not found.');
    });

    it('should return an error when the password is invalid', async () => {
        mockFindOne.mockResolvedValueOnce({
            email: 'test@example.com',
            password: 'hashed_password',
        });

        (bcrypt.compare as jest.Mocked<any>).mockReturnValueOnce(false);

        const response = await request(app).post('/login').send({
            email: 'test@example.com',
            password: 'wrong_password',
        });

        expect(response.status).toBe(400);
        expect(response.text).toBe('Invalid password.');
    });

    it('should handle internal server errors', async () => {
        mockFindOne.mockRejectedValueOnce(new Error('Database error'));

        const response = await request(app).post('/login').send({
            email: 'test@example.com',
            password: 'password',
        });

        expect(response.status).toBe(500);
        expect(response.text).toBe('Error logging in.');
    });
});

describe('POST /createFolder', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully create a folder', async () => {
        mockSave.mockResolvedValueOnce({});
        
        const response = await request(app).post('/createFolder').send({ name: 'SampleFolder' });
        
        expect(response.status).toBe(201);
        expect(response.text).toBe('Folder created successfully!');
    });

    it('should handle internal server errors when creating a folder', async () => {
        mockSave.mockRejectedValueOnce(new Error('Database error'));
        
        const response = await request(app).post('/createFolder').send({ name: 'SampleFolder' });
        
        expect(response.status).toBe(500);
        expect(response.text).toBe('Error creating folder.');
    });
});

describe('GET /files', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully retrieve files for a user', async () => {
        const mockFiles = [
            { key: 'file1', originalName: 'test1.txt' },
            { key: 'file2', originalName: 'test2.txt' }
        ];

        mockFind.mockResolvedValueOnce(mockFiles);

        const response = await request(app).get('/files');
        
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockFiles);
    }, 30000);

    it('should return a 404 if no files are found for a user', async () => {
        mockFind.mockResolvedValueOnce([]);

        const response = await request(app).get('/files');

        expect(response.status).toBe(404);
        expect(response.text).toBe('No files found.');
    }, 30000);
});











