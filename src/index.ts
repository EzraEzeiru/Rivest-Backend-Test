import 'reflect-metadata';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { getConnectionManager, createConnection } from 'typeorm';
import { User } from './entity/user.entity';
import { File } from './entity/file.entity';
import upload from './upload';
import { s3, S3_BUCKET_NAME } from './s3config';
import bcrypt from 'bcrypt';
import authConfig from './authConfig';
import authMiddleware from './authMiddleware';
import { Folder } from './entity/folder.entity';
import * as jwt from 'jsonwebtoken';
import config from './ormconfig'

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

app.use(express.json()); 

const deleteFromS3 = async (fileUrl: string) => {
    const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: fileUrl, 
    };

    return new Promise((resolve, reject) => {
        s3.deleteObject(deleteParams, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};


createConnection(config).then(connection => {
  connection.runMigrations().then(() => {

  console.log('Database connected!');

  app.post('/register', async (req, res) => {
    
    try {
      const { email, password, fullName, isAdmin } = req.body;
  
      const userExists = await connection.manager.findOne(User, { where: { email } });
      if (userExists) {
        return res.status(400).send('User already exists.');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      let user = new User();
      user.email = email;
      user.password = hashedPassword;
      user.fullName = fullName;
      user.isAdmin = isAdmin
  
      await connection.manager.save(user);
  
      res.status(201).send('User registered successfully!');
    } catch (error: any) {
      console.log(error.message)
      res.status(500).send('Error registering user.');
    }
  });

  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await connection.manager.findOne(User, { where: { email } });
      if (!user) {
        return res.status(400).send('User not found.');
      }

      const validPassword = await bcrypt.compare(user.password, password);
      if (validPassword) {
        return res.status(400).send('Invalid password.');
      }
  
      const token = jwt.sign({ id: user.id }, authConfig.jwtSecret, {
        expiresIn: '1d', 
      });
  
      res.json({ token });
    } catch (error) {
      res.status(500).send('Error logging in.');
    }
  });
  

  app.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
    const { folderId } = req.body;
    const userId = (req as any).user?.id;

    let folder = null;
    if (folderId) {
        folder = await connection.manager.findOne(Folder, { where: { id: folderId }} );
        if (!folder) {
            return res.status(400).send('Folder not found.');
        }
    }
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const s3Key = (req.file as any).key; 
    const s3OriginalName = req.file.originalname;

    let file = new File();
    file.originalName = s3OriginalName;
    file.key = s3Key;
    if (folder) {
        file.folder = folder;
    }

    const user = await connection.manager.findOne(User, { where: { id: userId }});
    if (!user) {
        return res.status(404).send('User not found.');
    }

    file.user = user;
    file.mimeType = req.file.mimetype;
    await connection.manager.save(file);

    const response = {
      "filekey": file.key,
      "message": 'File uploaded successfully!'
    }

    res.status(201).send(response);

});


app.post('/createFolder', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        let folder = new Folder();
        folder.name = name;

        await connection.manager.save(folder);

        res.status(201).send('Folder created successfully!');
    } catch (error) {
        res.status(500).send('Error creating folder.');
    }
});



app.get('/files', authMiddleware, async (req, res) => {
  const userId = (req as any).user?.id; 

    
    const files = await connection.manager.find(File, {
        where: {
          user: { id: userId }
        }
      });
      
      if (!files || files.length === 0) {
        return res.status(404).send('No files found.');
      }
      

    res.json(files);
});

  

app.get('/download/:filekey', authMiddleware, async (req, res) => {
const userId = (req as any).user?.id;
const key = req.params.filekey

const fileRecord = await connection.manager.findOne(File, {
    where: {
      key: key
    },
    relations: ["user"]
  });
if (!fileRecord) {
    return res.status(404).send('File not found.');
}

if (fileRecord.user.id !== userId) {
  return res.status(403).send('You do not have permission to download this file.');
}

    const filekey = req.params.filekey;
  
    const fileStream = s3.getObject({
      Bucket: S3_BUCKET_NAME!,
      Key: filekey,
  }).createReadStream();
  
  fileStream.on('error', (error) => {
      return res.status(500).send('Error downloading the file.');
  });
  
  fileStream.pipe(res);  
  });

  app.post('/markUnsafe/:filekey', authMiddleware, async (req, res) => {
    const userId = (req as any).user?.id;

    try {
        const user = await connection.manager.findOne(User, {where: { id: userId }});
        if (!user?.isAdmin) return res.status(403).send('Only admins can mark files as unsafe.');

        const file = await connection.manager.findOne(File, { where: { key: req.params.filekey }});
        if (!file) return res.status(404).send('File not found.');

        await deleteFromS3(file.key);

        // Remove the file record from the database
        await connection.manager.remove(file);

        res.send('File marked as unsafe and deleted.');
    } catch (error) {
        res.status(500).send('Error marking file as unsafe.');
    }
});

app.get('/stream/:filekey', authMiddleware, async (req, res) => {
const key = req.params.filekey;
const userId = (req as any).user?.id;

const fileRecord = await connection.manager.findOne(File, {
    where: {
      key: key
    },relations: ["user"]
  });
if (!fileRecord) {
    return res.status(404).send('File not found.');
}

if (fileRecord.user.id !== userId) {
    return res.status(403).send('You do not have permission to download this file.');
}
const filekey = req.params.filekey;

try {
    const Range  = req.headers.range;

    const fileObj = await s3.headObject({
        Bucket: S3_BUCKET_NAME!,
        Key: filekey,
    }).promise();

    const fileSize = fileObj.ContentLength!;
    const rangeValue = typeof Range === 'string' ? Range : Range![0];
    const start = Number((rangeValue.match(/bytes=(\d+)-/)?.[1] || '0'));
    console.log(fileSize)
    console.log(rangeValue)
    console.log(start)
    const end = fileSize - 1;
    const chunkSize = (end - start) + 1;

    const fileStream = s3.getObject({
        Bucket: S3_BUCKET_NAME!,
        Key: filekey,
        Range: `bytes=${start}-${end}`,
    }).createReadStream();
    res.header({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': fileRecord.mimeType,
    });
        res.status(206);
        fileStream.pipe(res);
    } catch (error) {
        res.status(500).send('Error streaming the file.');
    }
});


  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
}).catch(error => console.log(error));

export default app;

export const databaseConnection = createConnection(config);




