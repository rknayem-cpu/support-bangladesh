const verificationEmailTemplate = (code) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
      padding: 30px;
    }
    .logo {
      display: block;
      margin: 0 auto 20px auto;
      width: 120px;
      height: auto;
    }
    h1 {
      text-align: center;
      color: #6b21a8; /* purple-600 */
      font-size: 24px;
      margin-bottom: 10px;
    }
    p {
      text-align: center;
      color: #374151; /* gray-700 */
      font-size: 16px;
      margin-bottom: 30px;
    }
    .code-box {
      display: block;
      text-align: center;
      font-size: 28px;
      letter-spacing: 8px;
      font-weight: bold;
      color: #111827; /* gray-900 */
      background-color: #f9fafb; /* gray-50 */
      border: 2px dashed #6b21a8;
      border-radius: 8px;
      padding: 15px 0;
      margin: 0 auto 30px auto;
      width: fit-content;
      min-width: 200px;
    }
    .footer {
      text-align: center;
      color: #6b7280; /* gray-500 */
      font-size: 14px;
      margin-top: 20px;
    }
    .button {
      display: block;
      width: fit-content;
      margin: 0 auto;
      background-color: #6b21a8;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 8px;
      font-weight: bold;
      transition: background-color 0.3s ease;
    }
    .button:hover {
      background-color: #7e22ce;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="https://i.postimg.cc/9MWNQ3FR/supportbd-removebg-preview.png" alt="Support Bangladesh Logo" class="logo">
    <h1>Verify Your Email</h1>
    <p>Welcome to Support Bangladesh! Use the code below to verify your email address.</p>
    <div class="code-box">${code}</div>
    <a href="https://yourwebsite.com/login" class="button">Go to Login</a>
    <p class="footer">If you didn't request this code, please ignore this email.</p>
  </div>
</body>
</html>
`;

module.exports = verificationEmailTemplate;
