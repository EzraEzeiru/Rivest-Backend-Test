export class User {
    id!: number;
    email!: string;
    password!: string;
    fullName!: string;
    isAdmin!: boolean;
    files!: File[];
  
    async hashPassword() {
      
    }
  }
  
  export class File {
    id!: number;
    key!: string;
    originalName!: string;
    folder!: Folder;
    isUnsafe!: boolean;
    mimeType!: string;
    user!: User;
  }
  
  export class Folder {
    id!: number;
    name!: string;
    files!: File[];
  }
  