const { connection } = require('../../models/connection');
const mysql = require('mysql');
const jwtToken = require('../../helpers/jwtToken');
const jwt = require('jsonwebtoken');
const https = require("https");
const axios = require("axios");
var formidable = require('formidable');
var fs = require('fs');
const { lookupService } = require('dns');



const login = function (req, res) {
  var mobile = req.body.mobile;
  const errors = {};
  if (!req.body.mobile) {
    errors.mobile = ['mobile is required'];
  }
  if (!req.body.device_id) {
    errors.device_id = ['\\"device_id" payload Error\\ Device ID is required'];
  }

  if (Object.keys(errors).length > 0) {
    res.send({
      "status": 'failed',
      "validation_error": errors,
    });
  } else {
    connection.query('select * from customers where mobile =? ', [mobile], (error, result) => {
      if (error) throw error;
      if (result.length > 0) {
        // Registered customer

          

        let customerId = result[0].id;
        let deviceId = result[0].device_id;
        
        if (!req.body.device_id) {
          errors.device_id = ['Device ID is required'];
        }
        
       if (req.body.device_id != deviceId) {
          errors.device_id = ['This device is not registered with us, kindly login from your registered Device.'];
        }

        if (Object.keys(errors).length > 0) {
          res.send({
            "status": 'failed',
            "validation_error": errors,
          });
        }

         else {
          let checkSendOtp;
          connection.query('select * from otps where customer_id =? and otp_verified = ?', [customerId, 0], (error, otpresult) => {
            if (error) throw error;
            if (otpresult.length > 0) {
              let otp = otpresult[0].otp;
              checkSendOtp = sendOtp(mobile, otp);
              if (checkSendOtp) {
                res.send({
                  "status": 200,
                  "message": 'otp sent successfully'
                });
              }
            } else {
              if (creatOtp(customerId, mobile)) {
                console.log("--create new otp--");
                res.send({
                  "status": 200,
                  "success": true,
                  "message": "otp sent successfully for existing customer",
                });
              }
            }
          });
        }
      } else {
        // for new customer
        var customerRecords = {
          "mobile": mobile
        }
        connection.query('INSERT INTO customers SET ?', customerRecords, function (error, results, fields) {
          if (error) {
            console.log("error ocurred", error);
            res.send({
              "status": 'failed',
              "success": false,
              "message": 'failed to register'
            });
          } else {
            if (creatOtp(results.insertId, mobile)) {
              res.send({
                "status": 200,
                "success": true,
                "message": "Customer registered sucessfully",
              });
            }
          }
        });
      }
    });
  }
}

const logout = function (req, res) {
  try {
    var token = req.headers['x-auth'] || '';
    var mobile = req.body.mobile;

    const errors = {};

    if (!mobile) {
      errors.mobile = ['Mobile number is required'];
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: 'failed',
        validation_error: errors
      });
    }

    connection.query("UPDATE customers SET isLogedIn = false WHERE accessToken = ? AND mobile = ?", [token, mobile], (error, result, fields) => {
      if (error) {
        console.log("---logout---", error);
        return res.status(500).json({
          status: 500,
          message: "Logout error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(401).json({
          status: 401,
          message: "User not found or already logged out"
        });
      }

      res.status(200).json({
        status: 200,
        message: "User logged out successfully"
      });
    });
  } catch (error) {
    console.log("---logout---", error);
    res.status(500).json({
      status: 500,
      message: "Logout error"
    });
  }
};



const sendOtp = (mobile, otp) => {
  return new Promise((resolve, reject) => {
    let api_key = '56022A7F21E8A6';
    let from = 'MLKANO';
    let sms_text = `Your Milkano Wholesale Verification OTP code is - ${otp} . Do not share this OTP with anyone! Thank you for Choosing Milkano Wholesale!`;
    let pe_id = '1001492040000032389';
    let template_id = '1007168987679625707';

    let api_url = "http://hindit.org/app/smsapi/index.php?key=" + api_key + "&campaign=7095&routeid=100449&type=text&contacts=" + mobile + "&senderid=" + from + "&msg=" + sms_text + "&template_id=" + template_id + "&pe_id=" + pe_id;
    console.log("api_url", api_url);

    axios.get(api_url)
      .then(response => {
        console.log("otp response", response.data);
        if (response.data) {
          resolve({ status: true, message: "OTP sent successfully" });
        } else {
          resolve({ status: false, message: "Failed to send OTP" });
        }
      })
      .catch(error => {
        console.error("Error sending OTP:", error);
        reject(error);
      });
  });
};



const generateOtpNumber = (data) => {
  let otp = Math.floor(Math.random() * 899999 + 100000)
  return otp;
};


const creatOtp = (customerId, mobile) => {
  let otp = Math.floor(Math.random() * 899999 + 100000)
  // let otp = 123456;
  var otpRecords = {
    "customer_id": customerId,
    "mobile": mobile,
    "otp": otp
  }
  let otpQuery = connection.query('INSERT INTO otps SET ?', otpRecords, function (error, results, fields) {
    if (error) {
      return false;

    }
    else {

      connection.query('select * from otps where id =? and otp_verified = ?', [results.insertId, 0], (error, otpresult) => {
        if (error) throw error;
        if (otpresult.length > 0) {

          let otpFromDb = otpresult[0].otp;
          checkSendOtp = sendOtp(mobile, otpFromDb);
          return true;
        }
      });
    }
  });
  return otpQuery;
}


const verifyOtp = (req, res) => {
  var mobile = req.body.mobile;
  var otp = req.body.otp;
  
  connection.query('SELECT * FROM otps WHERE mobile = ? AND otp_verified = ? AND otp = ?', [mobile, 0, otp], (error, result) => {
    if (error) throw error;
    
    console.log("result.length", result.length);
    
    if (result.length > 0) {
      connection.query("UPDATE otps SET otp_verified = '1' WHERE mobile = ? AND otp_verified = ?", [mobile, 0], (error, updateResult) => {
        if (error) throw error;
        
        connection.query("SELECT * FROM customers WHERE mobile = ?", [mobile], (error, selectResult) => {
          if (error) throw error;
          
          // Generate Token
          let data = { data: 'customer' };
          let token = jwtToken.generateLogin(data);

         
          
          connection.query("UPDATE customers SET isLogedIn = true, accessToken = '"+token+"'  WHERE mobile = ?", [mobile], (error, updateTokenResult) => {
            if (error) throw error;
            
            res.send({
              "status": 200,
              "message": "OTP verified successfully",
              "token": token,
              "mobile": mobile,
              "customer": selectResult
            });
          });
        });
      });
    } else {
      res.send({
        "status": false,
        "message": "OTP does not match"
      });
    }
  });
};



const resendotp = function (req, res) {
  var mobile = req.body.mobile;
  const errors = {};
  if (!req.body.mobile) {
    errors.mobile = ['mobile is required'];
  }
  if (Object.keys(errors).length > 0) {
    res.send({
      "status": 'failed',
      "validation_error": errors,
    })
  } else {
    connection.query('select * from customers where mobile =?', mobile, (error, result) => {
      if (error) throw error;
      if (result.length > 0) {

        // Registered customer
        let customerId = result[0].id;
        let checkSendOtp;
        connection.query('select * from otps where customer_id =? and otp_verified = ?', [customerId, 0], (error, otpresult) => {
          if (error) throw error;
          if (otpresult.length > 0) {
            let otp = otpresult[0].otp;
            checkSendOtp = sendOtp(mobile, otp);
            if (checkSendOtp) {
              res.send({
                "status": 200,
                "message": 'otp sent successfully'
              });
            }
          }
          else {

            if (creatOtp(customerId, mobile)) {
              console.log("--create new otp--");
              res.send({
                "status": 200,
                "success": true,
                "message": "otp sent successfully for existing customer",
              });
            }

          }
        });

      } else {

        res.send({
          "status": 'failed',
          "message": 'customer not found',
        })
      }
    });
  }
}


const registration = function (req, res) {

  let id = req.body.id;
  var shopName = req.body.shop_name;
  var aadharNumber = req.body.aadhar_number;
  var shopNumber = req.body.shop_number || '';
  var shopDetail = req.body.shop_detail || '';
  var proprietorName = req.body.proprietor_name || 'customer';
  var state = req.body.state || '';
  var city = req.body.city || '';
  var area = req.body.area || '';
  var landMark = req.body.lank_mark || '';
  var pincode = req.body.pincode || '';
  var gst = req.body.gst || '';
  var license = req.body.license || '';
  var device_id = req.body.device_id || '';
  var buyer_category = req.body.buyer_category || '';
  var bde_id = req.body.bde_id || '';
  // var mobile = req.body.mobile;

  const errors = {};
  if (!req.body.id) {
    errors.id = ['id is required'];
  }
  if (!req.body.shop_name) {
    errors.shop_name = ['shop name is required'];
  }
  // if (!req.body.mobile) {
  //   errors.mobile = ['mobile is required'];
  // }
  // if (!req.body.proprietor_name) {
  //   errors.proprietor_name = ['proprietorName is required'];
  // }
  if (!req.body.aadhar_number) {
    errors.aadhar_number = ['aadhar number is required'];
  }
  // if (!req.body.device_id) {
  //   errors.device_id = ['\\"device_id" payload Error\\Device ID is required'];
  // }
  if (Object.keys(errors).length > 0) {
    res.send({
      "status": 'failed',
      "validation_error": errors,
    })
  } else {
    // Check Aadhar Number
    connection.query('select * from customers where aadhar_number =? AND id!=?', [aadharNumber, id], (error, result) => {
      if (error) throw error;
      if (result.length > 0) {
        res.send({
          "status": 401,
          "success": false,
          "message": 'Aadhar number already registerd'
        })
      } else {
        connection.query('select * from customers where id =?', id, (error, result) => {
          if (error) throw error;
          if (result.length > 0) {
            let mobile = result[0].mobile;
            console.log("--mobile--", mobile);
            connection.query("update customers SET aadhar_number='" + aadharNumber + "',shop_name='" + shopName + "',shop_number='" + shopNumber + "', shop_detail='" + shopDetail + "',proprietor_name='" + proprietorName + "',state='" + state + "',city='" + city + "',area='" + area + "',land_mark='" + landMark + "',pincode='" + pincode + "',device_id='" + device_id + "',gst='" + gst + "',license='" + license + "',buyer_category='"+buyer_category+"', bde_id='"+bde_id+"',customer_status=2  where id = ? ", + id, (error, result, fields) => {
              if (error) {
                console.log("error ocurred", error);
                res.send({
                  "status": 'failed',
                  "success": false,
                  "message": 'failed to register'
                })
              }
              else {

                if (result) {

                  template.welcomeSms(req, res, proprietorName, mobile);
                  res.send({
                    "status": 200,
                    "success": true,
                    "message": "Customer record update sucessfully",
                  });
                }

              }
            });

          } else {
            res.send({
              "status": 'failed',
              "success": false,
              "message": 'record not found'
            })
          }
        });
      }

    });
  }
}


const location = function (req, res) {
  try{
    connection.query('select * from location ', (error, result) => {
    if(error){
      res.send({
        "status": 'failed',
        "success": false,
        "message": 'data not found',
      })
    }else{
      res.send({
        "status": 'success',
        "success": true,
        "message": 'successfully get list',
        "data" : result,
      })
    }
  }) 
  }catch(error){
    res.send({
      "status": 'failed',
      "success": false,
    })
  }
}

const addProducts = function (req, res) {
//  console.log(req.body,'files',req.files)
//  const dataToInsert = req.body.dataToInsert
 const imgUrl = req.files
 let dataToInsert = []

if (Array.isArray(req.body?.dataToInsert)) {
}else{
  dataToInsert = [req.body]
}

values = dataToInsert.map((item) => [item.product_name, item.source_price,item.gross_weight, item.net_weight,item.carry_type,item.quantity, item.invoice_value , item.location_id]);
const productData = values.map((entry, index) => {
  return [entry[0], entry[1],entry[2], entry[3],entry[4], entry[5],entry[6],entry[7],`/${imgUrl[index].destination}${imgUrl[index].filename}`];
});

console.log(productData); 


  const sql = 'INSERT INTO addproducts (product_name,source_price,gross_weight,net_weight,carry_type,quantity,invoice_value,location_id, productImg) VALUES ?';
  connection.query(sql, [productData], (err, results) => {
    if (err) {
      console.log(err)
      res.send({
        "status": 'failed',
        "success": false,
        "message": 'product not add',
      })
    }else{
      res.send({
        "status": 'sucesess',
        "success": true,
        "message": 'product add succesfully',
     })
   }
   // console.log(`Inserted ${results.affectedRows} rows.`);  
})
}
 

module.exports = {
  login,
  generateOtpNumber,
  sendOtp,
  creatOtp,
  verifyOtp,
  resendotp,
  registration,
  logout,
  location,
  addProducts
};



