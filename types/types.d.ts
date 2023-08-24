interface CustomRequest extends Express.Request {
    headers: any;
    user?: {
        id: number;
        isAdmin?: boolean;
        email?: string;
        password?: string;
    };
}

export default CustomRequest