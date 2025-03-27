import User from "../models/User.js";
import jwt from "jsonwebtoken";

const secretKey = 'HarshatMehta'; 

export const signupAuth = async (req, res) => {
    try {
        const { name, username, password} = req.body;

        // Check if user already exists
        const usernameExists = await User.findOne({ username });
        if (usernameExists) return res.status(400).json({
            msg: 'username already exists'
        });

        // Create new user
        const user = new User({
            name,
            username,
            password: password,
        });

        const savedUser = await user.save();
        console.log('signup User:', savedUser);

        // Generate token
        const token = jwt.sign({ _id: savedUser._id }, secretKey);

        console.log('signup Token:', token);
        res.send({ user: savedUser, token }); // Send user details and the token
    } catch (err) {
        res.status(400).send(err.message);
    }
};

// User login
export const loginAuth = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username exists and passwords match
        const user = await User.findOne({ username });
        if (!user || user.password !== password) return res.status(400).json({
            msg: 'username or password is wrong'
        });

        // Generate token
        const token = jwt.sign({ _id: user._id}, secretKey);
        console.log('signin Token:', token);

        // Send the token in Authorization header
        res.header('Authorization', token).send({ token , user: user._id});
    } catch (err) {
        res.status(400).send(err.message);
    }
};


export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) return res.status(401).send('Access Denied');

        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
}
