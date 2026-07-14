"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

import ScanCapture from "@/components/resident/scan/ScanCapture";
import ScanLoading from "@/components/resident/scan/ScanLoading";

import { compressImage } from "@/lib/compress-image";



export default function ScanPage(){


const router = useRouter();

const supabase = createClient();



const [image,setImage] = useState<File | null>(null);

const [preview,setPreview] = useState("");

const [loading,setLoading] = useState(false);

const [uploaded,setUploaded] = useState(false);





const handleImage = async(file:File)=>{


try{


toast.info("Preparing image...");



const compressed =
await compressImage(file);



setImage(compressed);



setPreview(
URL.createObjectURL(compressed)
);



toast.success("Image ready for analysis.");



}

catch{


toast.error("Unable to process image.");

}


};







const startScan = async()=>{


if(!image){

toast.error("Please capture an image first.");

return;

}




setLoading(true);



try{



const {
data:{
user
}

}=await supabase.auth.getUser();





if(!user){

toast.error("Please login first.");

router.push("/login");

return;

}






const filePath =

`scans/${user.id}/${Date.now()}.webp`;






const {

error

}=await supabase.storage

.from("trashure-images")

.upload(

filePath,

image,

{

contentType:"image/webp",

upsert:true

}

);





if(error){

toast.error(error.message);

return;

}







const {

data:urlData

}=supabase.storage

.from("trashure-images")

.getPublicUrl(filePath);






console.log(
"Image URL:",
urlData.publicUrl
);





setUploaded(true);



toast.success("Image uploaded successfully.");





/*

NEXT STEP:

Send image_url

to Gemini Vision API

*/


setTimeout(()=>{


router.push("/profiles/resident");


},1500);





}

catch{


toast.error(
"Something went wrong."
);


}

finally{


setLoading(false);


}


};







return (

<main className="min-h-screen bg-green-50 px-4 py-6">


<div className="mx-auto max-w-xl">





<Link

href="/profiles/resident"

className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-green-600"

>

<ArrowLeft size={18}/>

Back

</Link>







<section className="mt-6 rounded-[32px] border border-green-100 bg-white p-6 shadow-xl sm:p-8">





<h1 className="text-3xl font-black text-zinc-900">

Scan Material

</h1>



<p className="mt-2 text-zinc-500">

Discover what your unwanted item can become.

</p>







{
loading

?

<ScanLoading/>

:

uploaded

?

<div className="mt-8 text-center">


<CheckCircle2
className="mx-auto text-green-600"
size={60}
/>



<h2 className="mt-4 text-xl font-black">

Material uploaded!

</h2>


<p className="mt-2 text-sm text-zinc-500">

Preparing your discovery...

</p>


</div>


:

<div className="mt-8 space-y-6">





{
preview && (

<div className="overflow-hidden rounded-3xl border">


<img

src={preview}

alt="Preview"

className="h-72 w-full object-cover"

/>


</div>

)

}







{
!preview && (

<ScanCapture

onImageSelected={handleImage}

/>

)

}







{
preview && (

<button

onClick={startScan}

className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-700 py-4 font-bold text-white shadow-lg shadow-green-500/30 transition hover:-translate-y-1"

>

Analyze Material

</button>

)

}







</div>


}





</section>




</div>


</main>

);


}