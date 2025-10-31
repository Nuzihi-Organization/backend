
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Therapist from '../models/Therapist.js';
import Admin from '../models/Admin.js';
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from '../utils/emailService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate tokens
const generateTokens = (id, role) => {
  const accessToken = jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  const refreshToken = jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// User Registration
export const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    const user = await User.create({ name, email, password, role: 'user' });
    const { accessToken, refreshToken } = generateTokens(user._id, 'user');
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          imageUrl: user.imageUrl
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// User Login
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    const { accessToken, refreshToken } = generateTokens(user._id, 'user');
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          imageUrl: user.imageUrl
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Google OAuth Login
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    
    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.imageUrl = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        imageUrl: picture,
        role: 'user'
      });
    }
    
    const { accessToken, refreshToken } = generateTokens(user._id, 'user');
    
    res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          imageUrl: user.imageUrl
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

// Therapist Login
export const therapistLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const therapist = await Therapist.findOne({ email }).select('+password');
    if (!therapist) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const isMatch = await therapist.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    if (!therapist.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account pending approval'
      });
    }
    
    if (!therapist.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    
    const { accessToken, refreshToken } = generateTokens(therapist._id, 'therapist');
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: therapist._id,
          name: therapist.name,
          email: therapist.email,
          role: therapist.role,
          imageUrl: therapist.imageUrl
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Therapist login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    let user;
    if (decoded.role === 'user') {
      user = await User.findById(decoded.id);
    } else if (decoded.role === 'therapist') {
      user = await Therapist.findById(decoded.id);
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    const tokens = generateTokens(user._id, decoded.role);
    
    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email, role = 'user' } = req.body;
    
    let user;
    if (role === 'user') {
      user = await User.findOne({ email });
    } else if (role === 'therapist') {
      user = await Therapist.findOne({ email });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }
    
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&role=${role}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });
      
      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      throw emailError;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email'
    });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, password, role = 'user' } = req.body;
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    let user;
    const query = {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    };
    
    if (role === 'user') {
      user = await User.findOne(query);
    } else if (role === 'therapist') {
      user = await Therapist.findOne(query);
    }
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    
    let user;
    if (role === 'user') {
      user = await User.findById(userId).select('+password');
    } else if (role === 'therapist') {
      user = await Therapist.findById(userId).select('+password');
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// Logout
export const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
};




// Therapist Registration
export const therapistRegister = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      bio,
      qualifications,
      experience,
      location,
      modes,
      specialties,
      sessionRate,
      imageUrl
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !bio || !location || !sessionRate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!specialties || specialties.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one specialty'
      });
    }

    if (!modes || modes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one session mode'
      });
    }
    
    // Check if therapist already exists
    const existingTherapist = await Therapist.findOne({ email });
    if (existingTherapist) {
      return res.status(400).json({
        success: false,
        message: 'Therapist already exists with this email'
      });
    }
    
    // Create therapist (isApproved is false by default)
    const therapist = await Therapist.create({
      name,
      email,
      password,
      bio,
      qualifications: qualifications.filter(q => q.trim()),
      experience: parseInt(experience),
      location,
      modes,
      specialties,
      sessionRate: parseFloat(sessionRate),
      imageUrl: imageUrl || '',
      isApproved: false, // Requires admin approval
      isActive: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending approval.',
      data: {
        therapist: {
          id: therapist._id,
          name: therapist.name,
          email: therapist.email,
          isApproved: therapist.isApproved
        }
      }
    });
  } catch (error) {
    console.error('Therapist registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Admin Registration
export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }
    
    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role: 'admin'
    });
    
    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

