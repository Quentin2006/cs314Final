import User from '../models/User.js';

export async function signup(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;

    // check if we have email or pass
    if (!email || !password) {
      res.status(400).json({ message: "Missing email or password" });
      return
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: "The email is already in use" });
      return;
    }

    const newUser = new User({ firstName, lastName, email, password });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error("Error in signup auth controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
  return
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // check if we have email or pass
    if (!email || !password) {
      res.status(400).json({ message: "Missing email or password" });
      return
    }

    const user = await User.findOne({ email });
    if (user && user.password == password) {
      res.status(200).json(user);
    }
    else {
      res.status(404).json({ message: "No user found with the given email" });
    }

  } catch (error) {
    console.error("Error in login auth controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export function logout(req, res) {
  res.status(200).json({ message: "Logged out" });
}

export async function getUserInfo(req, res) {
  // FIXME: when add auth, change it to have no params
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "No user found with id" });
    }
    else {
      res.status(200).json(user);
    }
  } catch (error) {
    console.error("Error in getUserInfo auth controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export async function updateProfile(req, res) {
  // FIXME: when add auth, change it to have no id param
  try {
    const { id, firstName, lastName, color, image } = req.body;
    const updatedUser = await User.findByIdAndUpdate(id, { firstName, lastName, color, image }, { new: true });

    if (!updatedUser) {
      res.status(404).json({ message: "No user found with id" });
    }
    else {
      res.status(200).json(updatedUser);
    }

  } catch (error) {
    console.error("Error in updateProfile auth controller: ", error.message)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
