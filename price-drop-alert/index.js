const fetch = require('isomorphic-fetch');
const express = require('express');
const fs = require('fs')
const cors = require('cors')
const jsdom = require('jsdom')
const { JSDOM } = jsdom;
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')

const uri = "mongodb+srv://mgarg123:pricedroptest@price-drop-cluster.2dg9q.mongodb.net/price_db?retryWrites=true&w=majority";

// const app = express()
// app.use(cors())

module.exports = async function(context, myTimer) {


    var timeStamp = new Date().toISOString();

    if (myTimer.isPastDue) {
        context.log('JavaScript is running late!');
    }
    //Write logic here
    context.log('JavaScript timer trigger function ran!', timeStamp);

    // app.get("/price", function(req, res, next) {
    //     res.send("Hello World");
    // })

    try {
        const response = await fetch("https://www.amazon.in/OPPO-Wireless-Bluetooth-Earphones-Green/dp/B085YG9X8Q")
        const text = await response.text()
            // let priceTagString = text.match(/<span id="priceblock_ourprice" class="a-size-medium a-color-price priceBlockBuyingPriceString">(.+)<\/span>/)
            // let priceText = priceTagString[0].split(">")[1].split("<")[0]

        // let price = priceText.match(/([0-9.,]{1,})/)[0].split(".")[0]
        // let finalPrice = parseInt(price.split(",")[0] + "" + price.split(",")[1])
        const dom = new JSDOM(text)

        let price = dom.window.document.getElementById("priceblock_ourprice").innerHTML.split(";")[1]

        let finalPrice = parseInt(price.split(",")[0] + "" + price.split(",")[1])


        // let priceFromFile = fs.readFileSync("price.txt")
        // let sendEmail = false
        // if (priceFromFile.length === 0) {
        //     fs.writeFileSync("price.txt", finalPrice + "");
        // } else if (parseInt(priceFromFile) > finalPrice) {
        //     sendEmail = true
        //     fs.writeFileSync("price.txt", finalPrice + "")

        // }

        // let price = priceText.split(/[^0-9.,]/)
        context.log("Current Price of Oppo Enco M31 is: " + price)
            // context.log("Price in file is: " + priceFromFile)
            // context.log("Send mail? " + sendEmail)


        let sendMail = false;

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const con = mongoose.connection

        con.on('open', function() {
            console.log("Connected to DB!")
        })

        const query = { _id: "price_doc" }
        con.collection("price_drop_col").findOne(query, function(err, res) {
            if (res === null) {
                console.log("No doc present!")
                let obj = {
                    _id: "price_doc",
                    price: finalPrice,
                    sendEmailCount: 3
                }

                con.collection("price_drop_col").insertOne(obj, function(err, res) {
                    console.log("Inserted with id: " + res.insertedId);
                })
            }
        });



        // MongoClient.connect(uri, function(err, db) {
        //     console.log("Connected to MongoDB!")
        //     let dbo = db.db("price_db");

        //     let query = { _id: "price_doc" } //Find the document with this ID

        //     dbo.collection("price_drop_col").findOne(query, function(err, res) {
        //         if (err)
        //             throw err;
        //         else if (res === null) {
        //             console.log("No Docs present!")
        //             let obj = {
        //                 _id: "price_doc",
        //                 price: finalPrice,
        //                 sendEmailCount: 3
        //             }
        //             dbo.collection("price_drop_col").insertOne(obj, function(err, res) {
        //                 if (err) {
        //                     console.log("Error Occured Here: " + err.message)

        //                 }

        //                 console.log("1 row inserted!")
        //             });
        //         } else if (res.price > finalPrice) {
        //             sendMail = true
        //             let obj = {
        //                 $set: {
        //                     price: finalPrice,
        //                     sendEmailCount: 3
        //                 }
        //             }
        //             dbo.collection("price_drop_col").updateOne(query, obj, function(err, res) {
        //                 if (err)
        //                     throw err;
        //                 console.log("1 row updated with id: " + res._id)
        //             })
        //         }
        //     });

        //     db.close();
        // });

        console.log("Send Mail? " + sendMail);

        let urlToBuy = "https://www.amazon.in/OPPO-Wireless-Bluetooth-Earphones-Green/dp/B085YG9X8Q"
        const mailOptions = {
            from: 'mggarg771@gmail.com', // sender address
            to: 'manish.garg771@gmail.com', // list of receivers
            subject: 'Price Dropped of Oppo Enco M31 to ' + price, // Subject line
            html: `<span>Greetings,</span><br />
                <h1>Buy oppo enco M31 right now at ${price}</h1><br />
                <a href=${urlToBuy}>Click Here to Buy</a>` // plain text body
        };

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'youremail@gmail.com',
                pass: 'your_password'
            }
        });

        if (finalPrice <= 2299) {
            transporter.sendMail(mailOptions, function(err, info) {
                if (err)
                    console.log("Mail sending error: " + err.message)
                else
                    console.log("Mail send Success: " + info);
            })
        }
    } catch (err) {
        context.log(err.message)
    }
};