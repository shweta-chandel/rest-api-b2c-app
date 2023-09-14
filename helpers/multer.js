// const uploadImg = multer({storage: storage});
// app.post('/product',uploadImg.array('product_image',10), (req, res) => {
//   if(req.files){
//     console.log(req.files)
//     console.log("file uploaded")
//   }
//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './uploads');
//       },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname);
//     }
// });
// })


const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/product/'); // Define the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname); // Define the filename for uploaded files
    },
  });
  
  const upload = multer({ storage: storage });

  module.exports = upload