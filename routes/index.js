var express = require('express');
const jwt = require('jsonwebtoken')
const User = require('../model/user');
const multer = require("multer");
const fs = require('fs')
const cloudinary = require('../config/cloudinary')
const nodemailer = require('nodemailer');


const PendingUser = require('../model/pendingUser');
var router = express.Router();
const verificationEmailTemplate = require('../lib/verifyEmail');
const Post = require('../model/post');

let SECRET = 'mamun'


const upload = multer({ dest: "uploads/" });

router.post("/upload",authenticate, upload.single("image"), async (req, res) => {
 
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "myuploads",
    });

    // লোকাল থেকে টেম্প ফাইল ডিলিট
    fs.unlinkSync(req.file.path);
 const user = await User.findByIdAndUpdate(
      req.user.id, // এখানে req.user._id হবে, {user._id} নয়
      { $set: { imageUrl:result.secure_url} },
      { new: true } // আপডেট হওয়া নতুন ইউজার রিটার্ন করার জন্য
    );
    // res.json({
    //   success: true,
    //   url: result.secure_url,
    // });
    res.redirect('/profile')
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});



router.get('/upload',(req,res)=>{

  res.render('upload')
})



function generateToken(user) {
  return jwt.sign({ id: user._id, username: user.username,email:user.email }, SECRET, {
    expiresIn: '1h',
  });
}

function isLogIn(req,res,next){
  const token = req.cookies.token;

  if(!token){
   next()
  }else{
    res.redirect('/profile')
  }

}


function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).redirect('/login');

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // attach user data to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}


router.get('/update-profile',authenticate,async (req,res)=>{
  const user = await User.findById(req.user.id)
  res.render('edit',{user:user})

})


router.get('/upload-post',(req,res)=>{

  res.render('post')
})


router.post('/upload-post',authenticate,async (req,res)=>{
  const {title,content} = req.body;
  const user= await User.findOne({_id:req.user.id})
const post = new Post({
  title:title,
  content:content,
  user:req.user.id
})
  await post.save();
  user.posts.push(post._id)
  await user.save()
  res.redirect('/profile')
 
})




router.post('/update-profile', authenticate, async (req, res) => {


  const {username,email}=req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, // এখানে req.user._id হবে, {user._id} নয়
      { $set: { username:username,email:email } },
      { new: true } // আপডেট হওয়া নতুন ইউজার রিটার্ন করার জন্য
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
  }
});



router.post('/pregister', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // OTP generate
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // PendingUser এ save
    const pending = new PendingUser({ username, email, password, emailVCode: code });
    await pending.save();

    // Mail পাঠাও
   let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email - সার্পোট বাংলাদেশ",
       html: verificationEmailTemplate(code)
    });

    res.status(200).redirect('/verify')
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/verify',(req,res)=>{
  res.render('verify')
})

router.post('/verify', async (req, res) => {
  const { code } = req.body;

  try {
    const pending = await PendingUser.findOne({ emailVCode:code });

    if (!pending) return res.status(400).json({ message: "No pending registration found" });

    if (pending.emailVCode === code) {
      // Create actual user
      const user = new User({
        username: pending.username,
        email: pending.email,
        password: pending.password,
        isVerified: true
      });
      await user.save();

      // Delete pending
      await PendingUser.deleteOne({ _id: pending._id });

      return res.redirect('/login')
    } else {
      return res.status(400).json({ message: "Invalid code" });
    }

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).redirect('/login')
  }

  const token = generateToken(user);
  res
    .cookie('token', token, {
      httpOnly: true, // cookie won't be accessible in client-side JS
      secure: false, // true in production with HTTPS
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    })
    .redirect('/profile')
});




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/register',isLogIn,(req,res)=>{


  res.render('register');
})


router.get('/login',isLogIn,(req,res)=>{


  res.render('login');
})




router.get('/profile', authenticate,async (req, res) => {
  const user=await User.findOne({_id:req.user.id})
  res.render('profile', {user});
}); 

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login')
});


module.exports = router;
