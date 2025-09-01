var express = require('express');
const jwt = require('jsonwebtoken')
const User = require('../model/user');
const multer = require("multer");
const cloudinary = require('../config/cloudinary')
const nodemailer = require('nodemailer');



const axios = require('axios');
const PendingUser = require('../model/pendingUser');
var router = express.Router();
const verificationEmailTemplate = require('../lib/verifyEmail');
const Post = require('../model/post');

let SECRET = 'mamun'



 

const streamifier = require('streamifier');

// Multer Setup - In-memory storage
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory (RAM)

router.post("/upload", authenticate, upload.single("image"), async (req, res) => {
  try {
    // Create a stream from the buffer
    const bufferStream = streamifier.createReadStream(req.file.buffer);

    // Upload the file stream to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const cloudinaryStream = cloudinary.uploader.upload_stream(
        { folder: "myuploads" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      bufferStream.pipe(cloudinaryStream); // Pipe the buffer stream to Cloudinary
    });

    // Cloudinary থেকে পাওয়া ফাইলের URL ডাটাবেসে আপডেট করা
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { imageUrl: result.secure_url } },
      { new: true }
    );

    // সফলভাবে আপলোড হওয়ার পর প্রোফাইলে রিডাইরেক্ট করা
    res.redirect('/profile');
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







router.post('/update-profile', authenticate, async (req, res) => {


  const {username,email,fb,phoneno}=req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, // এখানে req.user._id হবে, {user._id} নয়
      { $set: { username:username,email:email,fb:fb,phoneno:phoneno } },
      { new: true } // আপডেট হওয়া নতুন ইউজার রিটার্ন করার জন্য
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.redirect('/profile')
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
const token = req.cookies.token;

if(token){
  return res.render('index', { token: true });
} else{
return res.render('index', { token: false });
}
  
});


router.get('/register',isLogIn,(req,res)=>{


  res.render('register');
})


router.get('/login',isLogIn,(req,res)=>{


  res.render('login');
})


router.get('/members',async (req,res)=>{
const user = await User.find({})
  res.render('member',{user})
})




router.get('/profile', authenticate,async (req, res) => {
  const user=await User.findOne({_id:req.user.id}).populate('posts')
  
  
  res.render('profile', {user});
}); 
router.get("/admin/login",checkAdminBut, (req, res) => {
  res.render('adminlog')
});
router.get("/admin-dashboard", checkAdmin, (req, res) => {
  res.render('admin')
});
router.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true; // ✅ এখানে password না রেখে শুধু flag রাখছি
    return res.redirect("/admin-dashboard");
  }
  res.send("❌ Wrong password!");
});

function checkAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  return res.redirect("/admin/login");
}


function checkAdminBut(req, res, next) {
  if (req.session.isAdmin) {
    return res.redirect('/admin-dashboard')
  }
  return next();
}

router.get("/admin-logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login')
});



router.get('/approve-post/:id',checkAdmin,async (req,res)=>{
const id= req.params.id;
await Post.findByIdAndUpdate(
id,
{$set:{show:true}},
{new:true}
)

res.redirect('/admin/pending')

})


router.get('/admindl/:id',checkAdmin,async (req,res)=>{
const id= req.params.id;
await Post.findByIdAndDelete(id)

res.redirect('/admin-dashboard')

})


router.get('/admin/pending',checkAdmin,async (req,res)=>{
  const posts = await Post.find({})
  res.render('pending',{posts})
})

router.get('/setlive',checkAdmin,async (req,res)=>{
  const user=await User.find({})
  res.render('live',{user})
})
router.get('/setlive/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Step 1: সবার live false করা
    await User.updateMany({}, { $set: { live: false } });

    // Step 2: শুধু ওই id এর user কে true করা
    await User.findByIdAndUpdate(id, { $set: { live: true } });

    res.redirect('/setlive');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});


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

router.get('/postdl/:id',authenticate,async (req,res)=>{

const id = req.params.id;
await Post.findByIdAndDelete(id)

res.redirect('/profile')


})



router.get('/allpost',async (req,res)=>{

  const posts = await Post.find({}).populate('user');
res.render('allpost',{posts})

})




router.get("/api/fb-embed", async (req, res) => {
  try {
    let fbLink = req.query.url;
    console.log(fbLink);
     // ?url=https://www.facebook.com/share/v/xxxx/
    if (!fbLink || !fbLink.startsWith("https://www.facebook.com/" )) {
      return res.status(400).json({ error: "Please provide a Facebook video link (?url=...)" });
    }

    // Follow redirect to get final video link
    let response = await axios.get(fbLink, { maxRedirects: 5 });
let finalUrl = response.request.res.responseUrl;

    // Encode final URL
    let encoded = encodeURIComponent(finalUrl);

    // Embed URL
let embedUrl = `https://www.facebook.com/plugins/video.php?height=476&href=${encoded}&show_text=false`;

    // Return iframe
    res.json({
  iframe: `
    <iframe 
  class="absolute inset-0 w-full h-full"
  src="${embedUrl}"
  style="border:none;overflow:hidden"
  scrolling="no"
  frameborder="0"
  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
  allowfullscreen>
</iframe>

  `
});



  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error while fetching video link" });
  }
});

router.get('/test',(req,res)=>{
  res.render('test')
})



router.post('/save-phone',authenticate,async (req,res)=>{

const isVisible = req.body.showPhone === 'true';

if(isVisible){
await User.findByIdAndUpdate(
  req.user.id,
  {$set:{pshow:true}},
  {new:true}
)
return res.redirect('/update-profile')
} else{

await User.findByIdAndUpdate(
  req.user.id,
  {$set:{pshow:false}},
  {new:true}
)


return res.redirect('/update-profile')

}



})



router.get('/liver/:id',async (req,res)=>{
  const id= req.params.id;
  await User.findByIdAndUpdate(
    id,
    {$set:{live:false}},
    {new:true}
  )
  res.redirect('/setlive')
  })

module.exports = router;
