import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';

const maxAge = 3 * 24 * 60 * 60 * 1000; // 3 days in ms

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

export async function signup(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'The email is already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ email, password: hashedPassword });
    const savedUser = await newUser.save();

    const token = createToken(savedUser._id);
    res.cookie('jwt', token, {
      maxAge,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    });

    return res.status(201).json({
      user: {
        id: savedUser._id.toString(),
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        image: savedUser.image,
        profileSetup: savedUser.profileSetup,
      },
    });
  } catch (error) {
    console.error('Error in signup:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with the given email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = createToken(user._id);
    res.cookie('jwt', token, {
      maxAge,
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    });

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.error('Error in login:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function logout(req, res) {
  try {
    res.cookie('jwt', '', { maxAge: 1, httpOnly: true });
    return res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    console.error('Error in logout:', error.message);
    return res.status(500).json({ message: 'Server Error' });
  }
}

export async function getUserInfo(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(404).json({ message: 'User ID not found in token' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      profileSetup: user.profileSetup,
      color: user.color,
    });
  } catch (error) {
    console.error('Error in getUserInfo:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ message: 'Missing user ID' });
    }

    const { firstName, lastName, color } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, color, profileSetup: true },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      image: updatedUser.image,
      profileSetup: updatedUser.profileSetup,
      color: updatedUser.color,
    });
  } catch (error) {
    console.error('Error in updateProfile:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function addProfileImage(req, res) {
  try {
    const userId = req.userId;
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imagePath = `uploads/profiles/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { image: imagePath },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ image: imagePath });
  } catch (error) {
    console.error('Error in addProfileImage:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function removeProfileImage(req, res) {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the file from disk if it exists
    if (user.image) {
      const filePath = path.resolve(user.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    user.image = null;
    await user.save();

    return res.status(200).json({ message: 'Image removed successfully.' });
  } catch (error) {
    console.error('Error in removeProfileImage:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
