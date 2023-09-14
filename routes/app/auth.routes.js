const express = require("express");
const router = express.Router();
const auth = require("../../controllers/app/auth.controllers");
//const messageTemplate = require("../../controllers/app/templateControllers");
//const { verify } = require("../../middleware/auth");
const upload = require('../../helpers/multer')

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.post("/otpverify", auth.verifyOtp);
router.post("/resendotp", auth.resendotp);
router.post("/registration",  auth.registration);
router.get("/location", auth.location);
router.get("/addProducts",upload.array('productImg') , auth.addProducts);




module.exports = router;
