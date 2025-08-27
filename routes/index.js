var express = require('express');
const jwt = require('jsonwebtoken')
const User = require('../model/user');
const user = require('../model/user');
var router = express.Router();
let SECRET = 'mamun'




function generateToken(user) {
  return jwt.sign({ id: user._id, username: user.username,email:user.email }, SECRET, {
    expiresIn: '1h',
  });
}


function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // attach user data to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}


router.get('/update-profile',authenticate,(req,res)=>{
  res.render('edit',{user:req.user})

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




router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res
    .cookie('token', token, {
      httpOnly: true, // cookie won't be accessible in client-side JS
      secure: false, // true in production with HTTPS
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    })
    .json({ message: 'Login successful' });
});




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/register',(req,res)=>{


  res.render('register');
})


router.get('/login',(req,res)=>{


  res.render('login');
})




router.get('/profile', authenticate, (req, res) => {
  res.render('profile', {user: req.user });
}); 

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});


module.exports = router;
