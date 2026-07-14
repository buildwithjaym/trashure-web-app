import imageCompression from "browser-image-compression";


export async function compressImage(file:File){


const options={

maxSizeMB:0.8,

maxWidthOrHeight:1200,

useWebWorker:true,

fileType:"image/webp"

};



const compressedFile =
await imageCompression(
file,
options
);



return compressedFile;


}