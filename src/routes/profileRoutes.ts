//profileRoutes.ts
import express from 'express';
import multer from 'multer';
import { Request } from 'express';
import { connectToDatabase } from '../microservices/connectDB'; // Adjust the import path as necessary


//console.log('Profile routes loaded');

interface RequestWithFile extends Request {
  file: Express.Multer.File;
}

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this uploads directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ storage });

const router = express.Router();

// Profile picture upload endpoint
router.post('/api/uploadProfilePicture', upload.single('profilePic'), async (req, res) => {
 //   console.log('Received request for profile picture upload');
  const file = req.file;
  if (!file) {
    return res.status(400).send({ message: 'No file uploaded.' });
  }


  const username = req.body.username;

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(404).send({ message: 'User not found.' });
    }

    const filePath = `/uploads/${file.filename}`; // URL to access the file
    await usersCollection.updateOne({ username }, { $set: { profilePicture: filePath } });

    res.send({ message: 'Profile picture uploaded successfully', filePath });
  } catch (error) {
   // console.error('Error uploading profile picture:', error);
    res.status(500).send({ message: 'Error uploading profile picture' });
  }
});

// Get user profile endpoint
router.get('/api/getUserProfile/:username', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const username = req.params.username.toLowerCase();
   // console.log('Looking up user in database:', username);

    const user = await usersCollection.findOne({ username });
    if (!user) {
     // console.log(`User not found in database: ${username}`);
      return res.status(404).send({ message: 'User not found.' });
    }

   // console.log(`User found: ${user.username}`);


    const userProfile = {
      username: user.username,
      profilePicture: user.profilePicture || 'Default.png',
      points: user.points || 0,
      picks: user.picks || [],
      wins: user.wins || 0,
      losses: user.losses || 0,
      pushes: user.pushes || 0,
      // ... any other fields you want to include
    };

    res.json(userProfile); // Send the expanded user profile back to the client

  } catch (error) {
   // console.error('Error getting user profile:', error);
    res.status(500).send({ message: 'Error getting user profile', error });
  }
});
router.get('/api/getUserBio/:username', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const userBiosCollection = db.collection('userBios');
    const username = req.params.username.toLowerCase();

    const userBio = await userBiosCollection.findOne({ username });
    if (!userBio) {
      return res.status(404).send({ message: 'User bio not found.' });
    }

    res.json({ bio: userBio.bio });
  } catch (error:any) {
    res.status(500).send({ message: 'Error getting user bio', error });
  }
});

// Save user bio endpoint
router.post('/api/saveUserBio', async (req, res) => {
  const { username, bio } = req.body;

  try {
    const db = await connectToDatabase();
    const userBiosCollection = db.collection('userBios');

    const result = await userBiosCollection.updateOne(
      { username },
      { $set: { bio } },
      { upsert: true }
    );

    res.send({ message: 'Bio saved successfully' });
  } catch (error:any) {
    res.status(500).send({ message: 'Error saving bio', error });
  }
});

router.get('/getUserPoints/:username/:poolName', async (req, res) => {
  try {
      const { username, poolName } = req.params;
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');
      
      const pool = await poolsCollection.findOne({ 
          name: poolName,
          'members.username': username.toLowerCase()
      });
      
      if (pool) {
          const member = pool.members.find(m => 
              m.username.toLowerCase() === username.toLowerCase()
          );
          
          if (member) {
              return res.json({ points: member.points || 0 });
          }
      }
      
      res.json({ points: 0 });
  } catch (error) {
      console.error('Error getting user points:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Error retrieving user points',
          points: 0
      });
  }
});
export default router;