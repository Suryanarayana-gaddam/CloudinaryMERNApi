const express = require("express");
const app = express();
const cors = require('cors');
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const {MongoClient,ServerApiVersion} = require("mongodb");

const port = process.env.PORT || 5030;
const URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json({
    limit:"100mb"
}));

const client = new MongoClient(URI,{
    serverApi : {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get("/",(req,res) => {
    res.send("Hello, World!");
})

cloudinary.config({
    api_key:process.env.CLOUDINARY_API_KEY,
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

async function run(){
    try{
        await client.connect();

        const details = client.db("Neonflake").collection("details");

        app.post("/upload", async (req,res) => {
            const {title,description,image,video} = req.body;
            try {
                const cloudinaryImg = await cloudinary.uploader.upload(image,{
                    folder:"/NeonFlakeTask/Images",
                    resource_type:"image"
                });
                if(!cloudinaryImg){console.log("Error in uploading image to the cloudinary!")}
                console.log("cloudinaryImg :",cloudinaryImg)
                const cloudinaryVideo = await new Promise((resolve,reject) => {
                    cloudinary.uploader.upload_large(
                        video,
                        {
                            folder:"/NeonFlakeTask/Videos",
                            resource_type:"video",
                        },
                        (error,result) => {
                            if(error){
                                reject(error);
                            }
                            resolve(result);
                        }
                    )
                })
                if(!cloudinaryVideo){console.log("Error in uploading video to the cloudinary!")}
                console.log("cloudinaryVideo:",cloudinaryVideo)
                const ItemDetails = {
                    title,
                    description,
                    image:cloudinaryImg,
                    video:cloudinaryVideo
                }
                const UploadData = await details.insertOne(ItemDetails);
                if(!UploadData){
                    res.status(501).json("Error updating the data!")
                }
                console.log(UploadData)
                res.status(200).json({message:"Data uploaded successfully",data:UploadData});
            } catch (error) {
                res.status(500).json({messagge:`Internal server errror:${error}`});
            }
        })

        app.get("/getDetails", async (req,res) =>{
            try {
                const Details = await details.find({}).toArray();
                if(!Details){
                    res.status(502).json("Error getting the details")
                }
                
                res.status(200).json(Details)
            } catch (error) {
                res.status(500).json({messagge:`Internal server errror:${error}`});
            }
        })

        app.listen(port,() =>{
            console.log(`App is listening on the port : ${port}.`)
        })

        console.log("Mongo DB connected successfully!");
    }finally{
        //
    }
}

run().catch(console.dir);

module.exports = app;
